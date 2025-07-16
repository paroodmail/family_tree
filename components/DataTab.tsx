"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Database, Search, Download } from "lucide-react"
import { useFamilyContext } from "../context/FamilyContext"
import { useToast } from "@/hooks/use-toast"

export default function DataTab({ isAdmin }: { isAdmin: boolean }) {
  const { familyData, findPersonById, loading, error } = useFamilyContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGender, setFilterGender] = useState<"all" | "مرد" | "زن">("all")
  const [sortBy, setSortBy] = useState<"name" | "id" | "birthYear">("name")
  const { toast } = useToast()

  // فیلتر و جستجو
  const filteredData = familyData
    .filter((person) => {
      const matchesSearch =
        person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || person.id.includes(searchTerm)
      const matchesGender = filterGender === "all" || person.gender === filterGender
      return matchesSearch && matchesGender
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.fullName.localeCompare(b.fullName, "fa")
        case "id":
          return Number.parseInt(a.id) - Number.parseInt(b.id)
        case "birthYear":
          return (a.birthYear || 0) - (b.birthYear || 0)
        default:
          return 0
      }
    })

  // صادرات داده‌ها به CSV
  const exportToCSV = () => {
    if (!isAdmin) {
      toast({
        title: "خطا",
        description: "شما اجازه صادرات داده‌ها را ندارید.",
        variant: "destructive",
      })
      return
    }
    const headers = [
      "کد",
      "نام کامل",
      "جنسیت",
      "کد پدر",
      "کد مادر",
      "کد همسر ۱",
      "کد همسر ۲",
      "کد همسر ۳",
      "کد همسر ۴",
      "سال تولد",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((person) =>
        [
          person.id,
          `"${person.fullName}"`,
          person.gender,
          person.fatherId || "",
          person.motherId || "",
          person.spouse1Id || "",
          person.spouse2Id || "",
          person.spouse3Id || "",
          person.spouse4Id || "",
          person.birthYear || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "family_data.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // دریافت نام شخص بر اساس ID
  const getPersonName = (id?: string | null) => {
    if (!id) return "-"
    const person = findPersonById(id)
    return person ? person.fullName : `کد ${id}`
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
      {/* کنترل‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
            <Database className="w-5 h-5" />
            بانک اطلاعات خانواده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در نام یا کد..."
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">فیلتر جنسیت</label>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value as "all" | "مرد" | "زن")}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">همه</option>
                <option value="مرد">مرد</option>
                <option value="زن">زن</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">مرتب‌سازی</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "id" | "birthYear")}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="name">بر اساس نام</option>
                <option value="id">بر اساس کد</option>
                <option value="birthYear">بر اساس سال تولد</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">عملیات</label>
              <div className="flex gap-2">
                <Button onClick={exportToCSV} size="sm" className="flex-1" disabled={!isAdmin}>
                  <Download className="w-4 h-4 mr-1" />
                  صادرات
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول داده‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center justify-between">
            <span>اطلاعات اعضای خانواده</span>
            <span className="text-sm font-normal text-gray-600">
              {filteredData.length} از {familyData.length} عضو
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">کد</TableHead>
                  <TableHead className="text-right">نام کامل</TableHead>
                  <TableHead className="text-right">جنسیت</TableHead>
                  <TableHead className="text-right">پدر</TableHead>
                  <TableHead className="text-right">مادر</TableHead>
                  <TableHead className="text-right">همسر</TableHead>
                  <TableHead className="text-right">سال تولد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.id}</TableCell>
                    <TableCell className="font-semibold text-blue-800">{person.fullName}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          person.gender === "مرد" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                        }`}
                      >
                        {person.gender}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {person.fatherId ? <span className="text-blue-600">{getPersonName(person.fatherId)}</span> : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {person.motherId ? <span className="text-pink-600">{getPersonName(person.motherId)}</span> : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        {person.spouse1Id && <div className="text-red-600">{getPersonName(person.spouse1Id)}</div>}
                        {person.spouse2Id && <div className="text-red-600">{getPersonName(person.spouse2Id)}</div>}
                        {person.spouse3Id && <div className="text-red-600">{getPersonName(person.spouse3Id)}</div>}
                        {person.spouse4Id && <div className="text-red-600">{getPersonName(person.spouse4Id)}</div>}
                        {!person.spouse1Id && !person.spouse2Id && !person.spouse3Id && !person.spouse4Id && "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {person.birthYear ? <span className="text-green-600 font-medium">{person.birthYear}</span> : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* آمار سریع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{filteredData.length}</div>
            <div className="text-sm text-gray-600">نتایج فیلتر شده</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredData.filter((p) => p.gender === "مرد").length}
            </div>
            <div className="text-sm text-gray-600">مردان</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">
              {filteredData.filter((p) => p.gender === "زن").length}
            </div>
            <div className="text-sm text-gray-600">زنان</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{filteredData.filter((p) => p.birthYear).length}</div>
            <div className="text-sm text-gray-600">دارای سال تولد</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
