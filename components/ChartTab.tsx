"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Users, PieChart } from "lucide-react"
import { useFamilyContext, type Person } from "../context/FamilyContext"

export default function ChartTab() {
  const { familyData, findPersonById, getChildren, getSpouses, getParents, loading, error } = useFamilyContext()
  const [selectedPersonId, setSelectedPersonId] = useState("")
  const [chartType, setChartType] = useState("family-tree")

  // آمار کلی خانواده
  const totalMembers = familyData.length
  const maleMembers = familyData.filter((p) => p.gender === "مرد").length
  const femaleMembers = familyData.filter((p) => p.gender === "زن").length
  const marriedMembers = familyData.filter((p) => p.spouse1Id || p.spouse2Id || p.spouse3Id || p.spouse4Id).length

  // پیدا کردن نسل‌ها
  const getGenerations = () => {
    const generations: { [key: number]: string[] } = {}
    const visited = new Set<string>()

    const calculateGeneration = (personId: string, generation = 0): void => {
      if (visited.has(personId)) return
      visited.add(personId)

      const person = findPersonById(personId)
      if (!person) return

      if (!generations[generation]) generations[generation] = []
      if (!generations[generation].includes(personId)) {
        generations[generation].push(personId)
      }

      const children = getChildren(personId)
      children.forEach((child) => {
        calculateGeneration(child.id, generation + 1)
      })
    }

    // شروع از ریشه‌های خانواده (کسانی که والد ندارند)
    const roots = familyData.filter((p) => !p.fatherId && !p.motherId)
    roots.forEach((root) => calculateGeneration(root.id))

    return generations
  }

  const generations = getGenerations()

  // نمودار درختی پیشرفته
  const renderFamilyTree = () => {
    if (!selectedPersonId)
      return <p className="text-center text-gray-600">یک شخص را از لیست بالا انتخاب کنید تا نمودار نمایش داده شود.</p>

    const person = findPersonById(selectedPersonId)
    if (!person) return <p className="text-center text-red-600">شخص انتخاب شده یافت نشد.</p>

    // Helper to create a person node
    const createNode = (p: Person, isSelected = false) => (
      <div
        key={p.id}
        className={`
          chart-node p-3 rounded-lg shadow-md text-center min-w-[150px] max-w-[200px] transition-all duration-200 hover:shadow-lg
          ${p.gender === "مرد" ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-pink-100 border-pink-300 text-pink-800"}
          ${isSelected ? "bg-green-100 border-green-400 text-green-800 scale-105" : ""}
        `}
      >
        <div className="font-bold text-lg">{p.fullName}</div>
        <div className="text-sm">
          {p.gender} {p.birthYear && `• متولد ${p.birthYear}`}
        </div>
      </div>
    )

    // Helper for connectors (simplified for Tailwind)
    const VerticalLine = () => <div className="w-1 h-8 bg-gray-400 mx-auto my-2 rounded-full"></div>
    const HorizontalLine = () => <div className="w-full h-1 bg-gray-400 my-2 rounded-full"></div>
    const Junction = () => <div className="w-3 h-3 bg-gray-600 rounded-full mx-auto my-1"></div>
    const SpouseLine = () => <div className="w-12 h-1 bg-red-400 mx-2 rounded-full"></div>

    // --- Level 0: Grandparents (2 generations up) ---
    const paternalGrandfather = person.fatherId ? findPersonById(getParents(person.fatherId).father?.id || "") : null
    const paternalGrandmother = person.fatherId ? findPersonById(getParents(person.fatherId).mother?.id || "") : null
    const maternalGrandfather = person.motherId ? findPersonById(getParents(person.motherId).father?.id || "") : null
    const maternalGrandmother = person.motherId ? findPersonById(getParents(person.motherId).mother?.id || "") : null

    const grandparents = [paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother].filter(
      Boolean,
    ) as Person[]

    // --- Level 1: Parents ---
    const father = person.fatherId ? findPersonById(person.fatherId) : null
    const mother = person.motherId ? findPersonById(person.motherId) : null
    const parents = [father, mother].filter(Boolean) as Person[]

    // --- Level 2: Selected Person and Spouses ---
    const spouses = getSpouses(person.id)

    // --- Level 3: Children ---
    const children = getChildren(person.id)

    // --- Level 4: Grandchildren ---
    const grandchildren: Person[] = []
    children.forEach((child) => {
      grandchildren.push(...getChildren(child.id))
    })

    return (
      <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-inner overflow-x-auto min-h-[500px]">
        {/* Grandparents Level */}
        {grandparents.length > 0 && (
          <>
            <h4 className="font-bold text-gray-700 mb-3">پدربزرگ‌ها و مادربزرگ‌ها</h4>
            <div className="flex justify-center flex-wrap gap-4 mb-4">{grandparents.map((gp) => createNode(gp))}</div>
            <VerticalLine />
            <Junction />
            <VerticalLine />
          </>
        )}

        {/* Parents Level */}
        {parents.length > 0 && (
          <>
            <h4 className="font-bold text-gray-700 mb-3">والدین</h4>
            <div className="flex justify-center flex-wrap gap-4 mb-4">{parents.map((p) => createNode(p))}</div>
            <VerticalLine />
            <Junction />
            <VerticalLine />
          </>
        )}

        {/* Selected Person and Spouses Level */}
        <h4 className="font-bold text-gray-700 mb-3">شخص مرکزی و همسران</h4>
        <div className="flex items-center justify-center flex-wrap gap-2 mb-4">
          {createNode(person, true)}
          {spouses.map((spouse) => (
            <React.Fragment key={spouse.id}>
              <SpouseLine />
              {createNode(spouse)}
            </React.Fragment>
          ))}
        </div>

        {/* Children Level */}
        {children.length > 0 && (
          <>
            <VerticalLine />
            <Junction />
            <VerticalLine />
            <h4 className="font-bold text-gray-700 mb-3">فرزندان</h4>
            <div className="flex justify-center flex-wrap gap-4 mb-4">{children.map((child) => createNode(child))}</div>
          </>
        )}

        {/* Grandchildren Level */}
        {grandchildren.length > 0 && (
          <>
            <VerticalLine />
            <Junction />
            <VerticalLine />
            <h4 className="font-bold text-gray-700 mb-3">نوه‌ها</h4>
            <div className="flex justify-center flex-wrap gap-4 mb-4">{grandchildren.map((gc) => createNode(gc))}</div>
          </>
        )}
      </div>
    )
  }

  // نمودار آماری
  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* نمودار جنسیت */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">توزیع جنسیت</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>مردان</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(maleMembers / totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-blue-600">{maleMembers}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>زنان</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full"
                    style={{ width: `${(femaleMembers / totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-pink-600">{femaleMembers}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نمودار وضعیت تاهل */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">وضعیت تاهل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>متاهل</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(marriedMembers / totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-red-600">{marriedMembers}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>مجرد</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full"
                    style={{ width: `${((totalMembers - marriedMembers) / totalMembers) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-gray-600">{totalMembers - marriedMembers}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نمودار نسل‌ها */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">توزیع نسل‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(generations).map(([generation, members]) => (
              <div key={generation} className="flex items-center justify-between">
                <span>نسل {Number.parseInt(generation) + 1}</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(members.length / totalMembers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-indigo-600">{members.length} نفر</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

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
            <BarChart3 className="w-5 h-5" />
            نمودارها و آمار خانواده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع نمودار</label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family-tree">درخت خانوادگی</SelectItem>
                  <SelectItem value="statistics">آمار و نمودارها</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {chartType === "family-tree" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">انتخاب شخص مرکزی</label>
                <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                  <SelectTrigger>
                    <SelectValue placeholder="شخص مرکزی را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyData.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* نمایش نمودار */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
            {chartType === "family-tree" ? <Users className="w-5 h-5" /> : <PieChart className="w-5 h-5" />}
            {chartType === "family-tree" ? "درخت خانوادگی" : "آمار خانواده"}
          </CardTitle>
        </CardHeader>
        <CardContent>{chartType === "family-tree" ? renderFamilyTree() : renderStatistics()}</CardContent>
      </Card>

      {/* آمار کلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{totalMembers}</div>
            <div className="text-sm text-gray-600">کل اعضا</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{maleMembers}</div>
            <div className="text-sm text-gray-600">مردان</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{femaleMembers}</div>
            <div className="text-sm text-gray-600">زنان</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{marriedMembers}</div>
            <div className="text-sm text-gray-600">متاهلان</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
