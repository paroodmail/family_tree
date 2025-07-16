"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Edit, Trash2, Save, X, FileUp } from "lucide-react" // Add FileUp icon
import { useFamilyContext, type Person } from "../context/FamilyContext"
import { useToast } from "@/hooks/use-toast" // Assuming you have shadcn/ui toast setup
import ImportMembersDialog from "./import-members-dialog" // Import the new dialog

export default function ManageTab({ isAdmin }: { isAdmin: boolean }) {
  const { familyData, addPerson, updatePerson, deletePerson, findPersonById, loading, error, refreshFamilyData } =
    useFamilyContext()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false) // State for import dialog
  const { toast } = useToast()

  const [newPerson, setNewPerson] = useState({
    fullName: "",
    gender: "مرد" as "مرد" | "زن",
    fatherId: "",
    motherId: "",
    spouse1Id: "",
    spouse2Id: "",
    spouse3Id: "",
    spouse4Id: "",
    birthYear: "",
  })

  const [editPersonState, setEditPersonState] = useState<Partial<Person>>({})

  // اضافه کردن عضو جدید
  const handleAddPerson = async () => {
    if (!isAdmin) {
      toast({
        title: "خطا",
        description: "شما اجازه اضافه کردن عضو جدید را ندارید.",
        variant: "destructive",
      })
      return
    }
    if (!newPerson.fullName.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام کامل را وارد کنید.",
        variant: "destructive",
      })
      return
    }

    const personToAdd: Omit<Person, "id"> = {
      fullName: newPerson.fullName.trim(),
      gender: newPerson.gender,
      fatherId: newPerson.fatherId === "none" ? null : newPerson.fatherId || null,
      motherId: newPerson.motherId === "none" ? null : newPerson.motherId || null,
      spouse1Id: newPerson.spouse1Id === "none" ? null : newPerson.spouse1Id || null,
      spouse2Id: newPerson.spouse2Id === "none" ? null : newPerson.spouse2Id || null,
      spouse3Id: newPerson.spouse3Id === "none" ? null : newPerson.spouse3Id || null,
      spouse4Id: newPerson.spouse4Id === "none" ? null : newPerson.spouse4Id || null,
      birthYear: newPerson.birthYear ? Number.parseInt(newPerson.birthYear) : null,
    }

    const result = await addPerson(personToAdd)
    if (result.success) {
      toast({
        title: "موفقیت",
        description: result.message,
      })
      setNewPerson({
        fullName: "",
        gender: "مرد",
        fatherId: "",
        motherId: "",
        spouse1Id: "",
        spouse2Id: "",
        spouse3Id: "",
        spouse4Id: "",
        birthYear: "",
      })
      setShowAddForm(false)
    } else {
      toast({
        title: "خطا",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  // شروع ویرایش
  const startEdit = (person: Person) => {
    if (!isAdmin) {
      toast({
        title: "خطا",
        description: "شما اجازه ویرایش اعضا را ندارید.",
        variant: "destructive",
      })
      return
    }
    setEditingPersonId(person.id)
    setEditPersonState({ ...person })
  }

  // ذخیره ویرایش
  const saveEdit = async () => {
    if (!isAdmin) {
      toast({
        title: "خطا",
        description: "شما اجازه ذخیره تغییرات را ندارید.",
        variant: "destructive",
      })
      return
    }
    if (!editPersonState.fullName?.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام کامل را وارد کنید.",
        variant: "destructive",
      })
      return
    }

    const result = await updatePerson(editingPersonId!, editPersonState)
    if (result.success) {
      toast({
        title: "موفقیت",
        description: result.message,
      })
      setEditingPersonId(null)
      setEditPersonState({})
    } else {
      toast({
        title: "خطا",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  // لغو ویرایش
  const cancelEdit = () => {
    setEditingPersonId(null)
    setEditPersonState({})
  }

  // حذف عضو
  const handleDeletePerson = async (personId: string) => {
    if (!isAdmin) {
      toast({
        title: "خطا",
        description: "شما اجازه حذف اعضا را ندارید.",
        variant: "destructive",
      })
      return
    }
    const person = findPersonById(personId)
    if (!person) return

    if (confirm(`آیا مطمئن هستید که می‌خواهید ${person.fullName} را حذف کنید؟`)) {
      const result = await deletePerson(personId)
      if (result.success) {
        toast({
          title: "موفقیت",
          description: result.message,
        })
      } else {
        toast({
          title: "خطا",
          description: result.message,
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-600">در حال بارگذاری اطلاعات...</CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-600">خطا: {error}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* فرم اضافه کردن عضو جدید */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            مدیریت اعضای خانواده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "destructive" : "default"}
              disabled={!isAdmin && showAddForm}
            >
              {showAddForm ? "لغو" : "اضافه کردن عضو جدید"}
            </Button>
            <Button onClick={() => setIsImportDialogOpen(true)} disabled={!isAdmin}>
              <FileUp className="w-4 h-4 mr-2" />
              وارد کردن از اکسل (CSV)
            </Button>
          </div>

          {showAddForm && (
            <>
              {!isAdmin && <p className="text-red-500 mb-4">شما اجازه اضافه کردن عضو جدید را ندارید.</p>}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg ${!isAdmin ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="space-y-2">
                  <Label>نام کامل *</Label>
                  <Input
                    value={newPerson.fullName}
                    onChange={(e) => setNewPerson((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="نام کامل"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label>جنسیت</Label>
                  <Select
                    value={newPerson.gender}
                    onValueChange={(value: "مرد" | "زن") => setNewPerson((prev) => ({ ...prev, gender: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مرد">مرد</SelectItem>
                      <SelectItem value="زن">زن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>سال تولد</Label>
                  <Input
                    type="number"
                    value={newPerson.birthYear}
                    onChange={(e) => setNewPerson((prev) => ({ ...prev, birthYear: e.target.value }))}
                    placeholder="1400"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label>پدر</Label>
                  <Select
                    value={newPerson.fatherId || "none"}
                    onValueChange={(value) => setNewPerson((prev) => ({ ...prev, fatherId: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب پدر (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">هیچکدام</SelectItem>
                      {familyData
                        .filter((p) => p.gender === "مرد")
                        .map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.fullName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>مادر</Label>
                  <Select
                    value={newPerson.motherId || "none"}
                    onValueChange={(value) => setNewPerson((prev) => ({ ...prev, motherId: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب مادر (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">هیچکدام</SelectItem>
                      {familyData
                        .filter((p) => p.gender === "زن")
                        .map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.fullName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>همسر اول</Label>
                  <Select
                    value={newPerson.spouse1Id || "none"}
                    onValueChange={(value) => setNewPerson((prev) => ({ ...prev, spouse1Id: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">هیچکدام</SelectItem>
                      {familyData.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>همسر دوم</Label>
                  <Select
                    value={newPerson.spouse2Id || "none"}
                    onValueChange={(value) => setNewPerson((prev) => ({ ...prev, spouse2Id: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">هیچکدام</SelectItem>
                      {familyData.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>همسر سوم</Label>
                  <Select
                    value={newPerson.spouse3Id || "none"}
                    onValueChange={(value) => setNewPerson((prev) => ({ ...prev, spouse3Id: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">هیچکدام</SelectItem>
                      {familyData.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>همسر چهارم</Label>
                  <Select
                    value={newPerson.spouse4Id || "none"}
                    onValueChange={(value) => setNewPerson((prev) => ({ ...prev, spouse4Id: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">هیچکدام</SelectItem>
                      {familyData.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <Button onClick={handleAddPerson} className="bg-green-600 hover:bg-green-700" disabled={!isAdmin}>
                    <Save className="w-4 h-4 mr-2" />
                    ثبت عضو جدید
                  </Button>
                  <Button onClick={() => setShowAddForm(false)} variant="outline" disabled={!isAdmin}>
                    <X className="w-4 h-4 mr-2" />
                    لغو
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* لیست اعضا */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">لیست اعضای خانواده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {familyData.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                {editingPersonId === person.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={editPersonState.fullName || ""}
                      onChange={(e) => setEditPersonState((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="نام کامل"
                      disabled={!isAdmin}
                    />
                    <Select
                      value={editPersonState.gender || "مرد"}
                      onValueChange={(value: "مرد" | "زن") =>
                        setEditPersonState((prev) => ({ ...prev, gender: value }))
                      }
                      disabled={!isAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="مرد">مرد</SelectItem>
                        <SelectItem value="زن">زن</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={editPersonState.birthYear?.toString() || ""}
                      onChange={(e) =>
                        setEditPersonState((prev) => ({
                          ...prev,
                          birthYear: e.target.value ? Number.parseInt(e.target.value) : null,
                        }))
                      }
                      placeholder="سال تولد"
                      disabled={!isAdmin}
                    />
                    {/* Parent/Spouse Selects for Edit Mode */}
                    <div className="space-y-2">
                      <Label>پدر</Label>
                      <Select
                        value={editPersonState.fatherId || "none"}
                        onValueChange={(value) => setEditPersonState((prev) => ({ ...prev, fatherId: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب پدر (اختیاری)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">هیچکدام</SelectItem>
                          {familyData
                            .filter((p) => p.gender === "مرد" && p.id !== person.id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>مادر</Label>
                      <Select
                        value={editPersonState.motherId || "none"}
                        onValueChange={(value) => setEditPersonState((prev) => ({ ...prev, motherId: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب مادر (اختیاری)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">هیچکدام</SelectItem>
                          {familyData
                            .filter((p) => p.gender === "زن" && p.id !== person.id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>همسر اول</Label>
                      <Select
                        value={editPersonState.spouse1Id || "none"}
                        onValueChange={(value) => setEditPersonState((prev) => ({ ...prev, spouse1Id: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">هیچکدام</SelectItem>
                          {familyData
                            .filter((p) => p.id !== person.id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>همسر دوم</Label>
                      <Select
                        value={editPersonState.spouse2Id || "none"}
                        onValueChange={(value) => setEditPersonState((prev) => ({ ...prev, spouse2Id: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">هیچکدام</SelectItem>
                          {familyData
                            .filter((p) => p.id !== person.id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>همسر سوم</Label>
                      <Select
                        value={editPersonState.spouse3Id || "none"}
                        onValueChange={(value) => setEditPersonState((prev) => ({ ...prev, spouse3Id: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">هیچکدام</SelectItem>
                          {familyData
                            .filter((p) => p.id !== person.id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>همسر چهارم</Label>
                      <Select
                        value={editPersonState.spouse4Id || "none"}
                        onValueChange={(value) => setEditPersonState((prev) => ({ ...prev, spouse4Id: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب همسر (اختیاری)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">هیچکدام</SelectItem>
                          {familyData
                            .filter((p) => p.id !== person.id)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3 flex gap-2 mt-4">
                      <Button
                        onClick={saveEdit}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!isAdmin}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        ذخیره
                      </Button>
                      <Button onClick={cancelEdit} size="sm" variant="outline" disabled={!isAdmin}>
                        <X className="w-4 h-4 mr-1" />
                        لغو
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{person.fullName}</div>
                      <div className="text-sm text-gray-600">
                        {person.gender} • کد: {person.id}
                        {person.birthYear && ` • متولد ${person.birthYear}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => startEdit(person)} size="sm" variant="outline" disabled={!isAdmin}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeletePerson(person.id)}
                        size="sm"
                        variant="destructive"
                        disabled={!isAdmin}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ImportMembersDialog
        isOpen={isImportDialogOpen}
        onClose={() => {
          setIsImportDialogOpen(false)
          refreshFamilyData() // Refresh data after import attempt
        }}
        isAdmin={isAdmin}
      />
    </div>
  )
}
