"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react"
import {
  getFamilyData,
  addPerson as addPersonAction,
  updatePerson as updatePersonAction,
  deletePerson as deletePersonAction,
} from "@/lib/actions"

// نوع داده برای اعضای خانواده (مطابق با ستون‌های دیتابیس)
export interface Person {
  id: string
  fullName: string
  gender: "مرد" | "زن"
  fatherId?: string | null
  motherId?: string | null
  spouse1Id?: string | null
  spouse2Id?: string | null
  spouse3Id?: string | null
  spouse4Id?: string | null
  birthYear?: number | null
}

interface FamilyContextType {
  familyData: Person[]
  loading: boolean
  error: string | null
  refreshFamilyData: () => Promise<void>
  addPerson: (person: Omit<Person, "id">) => Promise<{ success: boolean; message: string }>
  updatePerson: (id: string, person: Partial<Person>) => Promise<{ success: boolean; message: string }>
  deletePerson: (id: string) => Promise<{ success: boolean; message: string }>
  findPersonById: (id: string) => Person | undefined
  findPersonByName: (name: string) => Person | undefined
  getChildren: (parentId: string) => Person[]
  getSpouses: (personId: string) => Person[]
  getParents: (personId: string) => { father?: Person; mother?: Person }
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyData, setFamilyData] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshFamilyData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFamilyData()
      setFamilyData(data) // Data is already mapped in getFamilyData action
    } catch (err: any) {
      console.error("Failed to fetch family data:", err)
      setError(err.message || "خطا در بارگذاری اطلاعات خانواده.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshFamilyData()
  }, [refreshFamilyData])

  const addPerson = useCallback(
    async (person: Omit<Person, "id">) => {
      const result = await addPersonAction(person)
      if (result.success) {
        await refreshFamilyData()
      }
      return result
    },
    [refreshFamilyData],
  )

  const updatePerson = useCallback(
    async (id: string, updates: Partial<Person>) => {
      const result = await updatePersonAction(id, updates)
      if (result.success) {
        await refreshFamilyData()
      }
      return result
    },
    [refreshFamilyData],
  )

  const deletePerson = useCallback(
    async (id: string) => {
      const result = await deletePersonAction(id)
      if (result.success) {
        await refreshFamilyData()
      }
      return result
    },
    [refreshFamilyData],
  )

  const findPersonById = useCallback(
    (id: string): Person | undefined => {
      return familyData.find((person) => person.id === id)
    },
    [familyData],
  )

  const findPersonByName = useCallback(
    (name: string): Person | undefined => {
      return familyData.find((person) => person.fullName === name)
    },
    [familyData],
  )

  const getChildren = useCallback(
    (parentId: string): Person[] => {
      return familyData.filter((person) => person.fatherId === parentId || person.motherId === parentId)
    },
    [familyData],
  )

  const getSpouses = useCallback(
    (personId: string): Person[] => {
      const person = findPersonById(personId)
      if (!person) return []

      const spouses: Person[] = []
      if (person.spouse1Id) {
        const spouse = findPersonById(person.spouse1Id)
        if (spouse) spouses.push(spouse)
      }
      if (person.spouse2Id) {
        const spouse = findPersonById(person.spouse2Id)
        if (spouse) spouses.push(spouse)
      }
      if (person.spouse3Id) {
        const spouse = findPersonById(person.spouse3Id)
        if (spouse) spouses.push(spouse)
      }
      if (person.spouse4Id) {
        const spouse = findPersonById(person.spouse4Id)
        if (spouse) spouses.push(spouse)
      }

      return spouses
    },
    [familyData, findPersonById],
  )

  const getParents = useCallback(
    (personId: string): { father?: Person; mother?: Person } => {
      const person = findPersonById(personId)
      if (!person) return {}

      return {
        father: person.fatherId ? findPersonById(person.fatherId) : undefined,
        mother: person.motherId ? findPersonById(person.motherId) : undefined,
      }
    },
    [familyData, findPersonById],
  )

  return (
    <FamilyContext.Provider
      value={{
        familyData,
        loading,
        error,
        refreshFamilyData,
        addPerson,
        updatePerson,
        deletePerson,
        findPersonById,
        findPersonByName,
        getChildren,
        getSpouses,
        getParents,
      }}
    >
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamilyContext() {
  const context = useContext(FamilyContext)
  if (context === undefined) {
    throw new Error("useFamilyContext must be used within a FamilyProvider")
  }
  return context
}
