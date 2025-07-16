"use server"

import { revalidatePath } from "next/cache"
import { client as edgedb } from "./edgedb" // Use the EdgeDB client
import type { Person } from "@/context/FamilyContext"

export async function getFamilyData(): Promise<Person[]> {
  try {
    // NOTE: اگر جدول Person هنوز ساخته نشده، با آرایهٔ خالی برمی‌گردیم
    // و پیغام راهنما در لاگ چاپ می‌کنیم.
    const query = `
      select Person {
        id,
        full_name,
        gender,
        father: { id, full_name },
        mother: { id, full_name },
        spouses: { id, full_name },
        birth_year,
      } order by .id;
    `
    const data = await edgedb.query(query)

    // Map EdgeDB data to frontend Person type
    return data.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      gender: p.gender as "مرد" | "زن",
      fatherId: p.father?.id || null,
      motherId: p.mother?.id || null,
      spouse1Id: p.spouses[0]?.id || null,
      spouse2Id: p.spouses[1]?.id || null,
      spouse3Id: p.spouses[2]?.id || null,
      spouse4Id: p.spouses[3]?.id || null,
      birthYear: p.birth_year || null,
    }))
  } catch (error: any) {
    const msg = String(error?.message || error)
    if (msg.includes("does not exist") && msg.includes("Person")) {
      console.warn(
        "[EdgeDB] جدول/نوع Person یافت نشد؛ احتمالاً migrate اجرا نشده است.\n" +
          "برای ایجاد آن فرمان زیر را در ترمینال بزنید:\n\n" +
          "    edgedb migrate\n",
      )
      return [] // بدون کرش، دیتای خالی برمی‌گردانیم
    }
    console.error("Error fetching family data from EdgeDB:", error)
    throw new Error("خطا در بارگذاری اطلاعات خانواده از پایگاه داده.")
  }
}

export async function addPerson(person: Omit<Person, "id">): Promise<{ success: boolean; message: string }> {
  try {
    // Generate a new ID (sequential string, similar to previous logic)
    const maxIdResult = await edgedb.querySingle(`select max(to_int64(.id)) from Person;`)
    const newId = ((maxIdResult || 0) + 1).toString()

    const query = `
      insert Person {
        id := <str>$id,
        full_name := <str>$fullName,
        gender := <str>$gender,
        father := (select Person filter .id = <str>$fatherId),
        mother := (select Person filter .id = <str>$motherId),
        birth_year := <optional int32>$birthYear,
      };
    `
    await edgedb.query(query, {
      id: newId,
      fullName: person.fullName,
      gender: person.gender,
      fatherId: person.fatherId || null,
      motherId: person.motherId || null,
      birthYear: person.birthYear || null,
    })

    // Update reciprocal spouse relationships
    const spouseIds = [person.spouse1Id, person.spouse2Id, person.spouse3Id, person.spouse4Id].filter(Boolean)
    for (const spouseId of spouseIds) {
      // Add new person to spouse's 'spouses' link
      await edgedb.query(
        `
        update Person filter .id = <str>$spouseId
        set {
          spouses += (select Person filter .id = <str>$newPersonId)
        };
      `,
        { spouseId, newPersonId: newId },
      )

      // Add spouse to new person's 'spouses' link
      await edgedb.query(
        `
        update Person filter .id = <str>$newPersonId
        set {
          spouses += (select Person filter .id = <str>$spouseId)
        };
      `,
        { newPersonId: newId, spouseId },
      )
    }

    revalidatePath("/")
    return { success: true, message: "عضو جدید با موفقیت اضافه شد." }
  } catch (error) {
    console.error("Error adding person to EdgeDB:", error)
    return { success: false, message: "خطا در افزودن عضو جدید." }
  }
}

export async function updatePerson(
  id: string,
  updates: Partial<Omit<Person, "id">>,
): Promise<{ success: boolean; message: string }> {
  try {
    const currentPersonQuery = `
      select Person {
        id,
        spouses: { id },
      } filter .id = <str>$id;
    `
    const currentPerson = await edgedb.querySingle(currentPersonQuery, { id })

    if (!currentPerson) {
      return { success: false, message: "عضو برای ویرایش پیدا نشد." }
    }

    const oldSpouseIds = currentPerson.spouses.map((s) => s.id)

    const updateQuery = `
      update Person filter .id = <str>$id
      set {
        full_name := <str>$fullName,
        gender := <str>$gender,
        father := (select Person filter .id = <str>$fatherId),
        mother := (select Person filter .id = <str>$motherId),
        birth_year := <optional int32>$birthYear,
      };
    `
    await edgedb.query(updateQuery, {
      id,
      fullName: updates.fullName,
      gender: updates.gender,
      fatherId: updates.fatherId === "none" ? null : updates.fatherId || null,
      motherId: updates.motherId === "none" ? null : updates.motherId || null,
      birthYear: updates.birthYear || null,
    })

    // Handle spouse updates (more complex due to multi link)
    const newSpouseIds = [updates.spouse1Id, updates.spouse2Id, updates.spouse3Id, updates.spouse4Id].filter(Boolean)

    // Remove old spouses that are no longer in the new list
    for (const oldSpouseId of oldSpouseIds) {
      if (!newSpouseIds.includes(oldSpouseId)) {
        await edgedb.query(
          `
          update Person filter .id = <str>$personId
          set {
            spouses -= (select Person filter .id = <str>$oldSpouseId)
          };
        `,
          { personId: id, oldSpouseId },
        )
        // Also remove reciprocal link
        await edgedb.query(
          `
          update Person filter .id = <str>$oldSpouseId
          set {
            spouses -= (select Person filter .id = <str>$personId)
          };
        `,
          { oldSpouseId, personId: id },
        )
      }
    }

    // Add new spouses that were not in the old list
    for (const newSpouseId of newSpouseIds) {
      if (!oldSpouseIds.includes(newSpouseId)) {
        await edgedb.query(
          `
          update Person filter .id = <str>$personId
          set {
            spouses += (select Person filter .id = <str>$newSpouseId)
          };
        `,
          { personId: id, newSpouseId },
        )
        // Also add reciprocal link
        await edgedb.query(
          `
          update Person filter .id = <str>$newSpouseId
          set {
            spouses += (select Person filter .id = <str>$personId)
          };
        `,
          { newSpouseId, personId: id },
        )
      }
    }

    revalidatePath("/")
    return { success: true, message: "اطلاعات با موفقیت به‌روزرسانی شد." }
  } catch (error) {
    console.error("Error updating person in EdgeDB:", error)
    return { success: false, message: "خطا در به‌روزرسانی اطلاعات عضو." }
  }
}

export async function deletePerson(id: string): Promise<{ success: boolean; message: string }> {
  try {
    // First, remove all incoming and outgoing spouse links to this person
    await edgedb.query(
      `
      update Person
      filter .spouses.id = <str>$id
      set {
        spouses -= (select Person filter .id = <str>$id)
      };
    `,
      { id },
    )

    // Then, delete the person
    const query = `
      delete Person filter .id = <str>$id;
    `
    await edgedb.query(query, { id })

    // Update children and parents whose links might point to the deleted person
    // EdgeDB's `on delete set null` for single links (father, mother) handles this automatically.
    // For multi links (spouses), we handled it above.

    revalidatePath("/")
    return { success: true, message: "عضو با موفقیت حذف شد." }
  } catch (error) {
    console.error("Error deleting person from EdgeDB:", error)
    return { success: false, message: "خطا در حذف عضو." }
  }
}
