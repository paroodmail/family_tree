"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, Heart, Crown, Users, Baby, Sparkles, Star, Maximize, Minimize, Printer } from "lucide-react"
import { useFamilyContext, type Person } from "../context/FamilyContext"

interface RelationshipResult {
  type: "simple" | "complex"
  relation?: string
  path?: { id: string; name: string }[]
  relationships?: string[]
  person1: string
  person2: string
  error?: string
}

export default function SearchTab() {
  const { familyData, findPersonByName, findPersonById, getParents, getSpouses, loading, error } = useFamilyContext()
  const [person1, setPerson1] = useState("")
  const [person2, setPerson2] = useState("")
  const [person1Search, setPerson1Search] = useState("")
  const [person2Search, setPerson2Search] = useState("")
  const [showPerson1List, setShowPerson1List] = useState(false)
  const [showPerson2List, setShowPerson2List] = useState(false)
  const [result, setResult] = useState<RelationshipResult | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isResultExpanded, setIsResultExpanded] = useState(false)

  // فیلتر کردن اسامی بر اساس جستجو
  const filteredPerson1List = useMemo(() => {
    if (!person1Search.trim()) return familyData
    return familyData.filter(
      (person) =>
        person.fullName.toLowerCase().includes(person1Search.toLowerCase()) || person.id.includes(person1Search),
    )
  }, [familyData, person1Search])

  const filteredPerson2List = useMemo(() => {
    if (!person2Search.trim()) return familyData
    return familyData.filter(
      (person) =>
        person.fullName.toLowerCase().includes(person2Search.toLowerCase()) || person.id.includes(person2Search),
    )
  }, [familyData, person2Search])

  // روابط ساده که نیاز به نمایش مسیر ندارند
  const simpleRelations = [
    "father",
    "mother",
    "spouse",
    "brother",
    "sister",
    "paternal_grandfather",
    "paternal_grandmother",
    "maternal_grandfather",
    "maternal_grandmother",
    "child",
    "grandchild",
    "father_in_law",
    "mother_in_law",
    "son_in_law",
    "daughter_in_law",
  ]

  // بررسی رابطه مستقیم
  const getDirectRelation = (person1: Person, person2: Person): string | null => {
    // پدر/مادر - person1 نسبت به person2
    if (person1.fatherId === person2.id) return "child"
    if (person1.motherId === person2.id) return "child"
    if (person2.fatherId === person1.id) return "father"
    if (person2.motherId === person1.id) return "mother"

    // همسر
    if (
      person1.spouse1Id === person2.id ||
      person1.spouse2Id === person2.id ||
      person1.spouse3Id === person2.id ||
      person1.spouse4Id === person2.id ||
      person2.spouse1Id === person1.id ||
      person2.spouse2Id === person1.id ||
      person2.spouse3Id === person1.id ||
      person2.spouse4Id === person1.id
    ) {
      return "spouse"
    }

    // برادر/خواهر - اصلاح شده
    if (
      (person1.fatherId && person1.fatherId === person2.fatherId) ||
      (person1.motherId && person1.motherId === person2.motherId)
    ) {
      if (person1.id !== person2.id) {
        // جنسیت person1 را چک می‌کنیم نه person2
        return person1.gender === "مرد" ? "brother" : "sister"
      }
    }

    // پدربزرگ/مادربزرگ
    const person1Parents = getParents(person1.id)
    if (person1Parents.father) {
      const fatherParents = getParents(person1Parents.father.id!)
      if (fatherParents.father?.id === person2.id) return "grandchild"
      if (fatherParents.mother?.id === person2.id) return "grandchild"
    }
    if (person1Parents.mother) {
      const motherParents = getParents(person1Parents.mother.id!)
      if (motherParents.father?.id === person2.id) return "grandchild"
      if (motherParents.mother?.id === person2.id) return "grandchild"
    }

    const person2Parents = getParents(person2.id)
    if (person2Parents.father) {
      const fatherParents = getParents(person2Parents.father.id!)
      if (fatherParents.father?.id === person1.id) return "paternal_grandfather"
      if (fatherParents.mother?.id === person1.id) return "paternal_grandmother"
    }
    if (person2Parents.mother) {
      const motherParents = getParents(person2Parents.mother.id!)
      if (motherParents.father?.id === person1.id) return "maternal_grandfather"
      if (motherParents.mother?.id === person1.id) return "maternal_grandmother"
    }

    // پدرشوهر/مادرشوهر - جدید
    const person1Spouses = getSpouses(person1.id)
    for (const spouse of person1Spouses) {
      const spouseParents = getParents(spouse.id)
      if (spouseParents.father?.id === person2.id) return "father_in_law"
      if (spouseParents.mother?.id === person2.id) return "mother_in_law"
    }

    const person2Spouses = getSpouses(person2.id)
    for (const spouse of person2Spouses) {
      const spouseParents = getParents(spouse.id)
      if (spouseParents.father?.id === person1.id) return person1.gender === "مرد" ? "son_in_law" : "daughter_in_law"
      if (spouseParents.mother?.id === person1.id) return person1.gender === "مرد" ? "son_in_law" : "daughter_in_law"
    }

    return null
  }

  // پیدا کردن کوتاه‌ترین مسیر
  const findShortestPath = (startId: string, endId: string): string[] | null => {
    if (startId === endId) return [startId]

    const visited = new Set<string>()
    const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }]

    while (queue.length > 0) {
      const { id: currentId, path } = queue.shift()!

      if (visited.has(currentId)) continue
      visited.add(currentId)

      if (currentId === endId) return path

      const currentPerson = findPersonById(currentId)
      if (!currentPerson) continue

      // اضافه کردن والدین
      if (currentPerson.fatherId && !visited.has(currentPerson.fatherId)) {
        queue.push({ id: currentPerson.fatherId, path: [...path, currentPerson.fatherId] })
      }
      if (currentPerson.motherId && !visited.has(currentPerson.motherId)) {
        queue.push({ id: currentPerson.motherId, path: [...path, currentPerson.motherId] })
      }

      // اضافه کردن همسران
      const spouses = getSpouses(currentId)
      spouses.forEach((spouse) => {
        if (!visited.has(spouse.id)) {
          queue.push({ id: spouse.id, path: [...path, spouse.id] })
        }
      })

      // اضافه کردن فرزندان
      familyData.forEach((person) => {
        if ((person.fatherId === currentId || person.motherId === currentId) && !visited.has(person.id)) {
          queue.push({ id: person.id, path: [...path, person.id] })
        }
      })
    }

    return null
  }

  // تعیین نوع رابطه در مسیر
  const getRelationshipInPath = (person1Id: string, person2Id: string): string => {
    const person1 = findPersonById(person1Id)
    const person2 = findPersonById(person2Id)

    if (!person1 || !person2) return "نامشخص"

    if (person2.fatherId === person1Id) return "پدر"
    if (person2.motherId === person1Id) return "مادر"
    if (person1.fatherId === person2Id || person1.motherId === person2Id) return "فرزند"

    const spouses = getSpouses(person1Id)
    if (spouses.some((s) => s.id === person2Id)) return "همسر"

    // برادر/خواهر
    if (
      (person1.fatherId && person1.fatherId === person2.fatherId) ||
      (person1.motherId && person1.motherId === person2.motherId)
    ) {
      return person1.gender === "مرد" ? "برادر" : "خواهر"
    }

    return "خویشاوند"
  }

  // ترجمه روابط
  const translateRelation = (relation: string): string => {
    const translations: { [key: string]: string } = {
      father: "پدر",
      mother: "مادر",
      spouse: "همسر",
      brother: "برادر",
      sister: "خواهر",
      child: "فرزند",
      grandchild: "نوه",
      paternal_grandfather: "پدربزرگ پدری",
      paternal_grandmother: "مادربزرگ پدری",
      maternal_grandfather: "پدربزرگ مادری",
      maternal_grandmother: "مادربزرگ مادری",
      father_in_law: "پدرشوهر",
      mother_in_law: "مادرشوهر",
      son_in_law: "داماد",
      daughter_in_law: "عروس",
    }
    return translations[relation] || relation
  }

  // پیدا کردن رابطه
  const findRelationship = () => {
    if (!person1 || !person2) {
      setResult({ type: "simple", person1: "", person2: "", error: "لطفاً هر دو نفر را انتخاب کنید" })
      return
    }

    if (person1 === person2) {
      setResult({ type: "simple", person1: "", person2: "", error: "نمی‌توان یک نفر را با خودش مقایسه کرد" })
      return
    }

    setSearchLoading(true)

    setTimeout(() => {
      const p1 = findPersonByName(person1)
      const p2 = findPersonByName(person2)

      if (!p1 || !p2) {
        setResult({ type: "simple", person1: "", person2: "", error: "یکی از افراد پیدا نشد" })
        setSearchLoading(false)
        return
      }

      const directRelation = getDirectRelation(p1, p2)

      if (directRelation && simpleRelations.includes(directRelation)) {
        setResult({
          type: "simple",
          relation: translateRelation(directRelation),
          person1: p1.fullName,
          person2: p2.fullName,
        })
      } else {
        const path = findShortestPath(p1.id, p2.id)

        if (!path || path.length === 0) {
          setResult({
            type: "simple",
            person1: p1.fullName,
            person2: p2.fullName,
            error: "هیچ رابطه خویشاوندی بین این دو شخص وجود ندارد",
          })
        } else {
          const pathWithNames = path.map((id) => {
            const person = findPersonById(id)
            return { id, name: person?.fullName || "نامشخص" }
          })

          const relationships = []
          for (let i = 0; i < path.length - 1; i++) {
            relationships.push(getRelationshipInPath(path[i], path[i + 1]))
          }

          setResult({
            type: "complex",
            path: pathWithNames,
            relationships,
            person1: p1.fullName,
            person2: p2.fullName,
          })
        }
      }

      setSearchLoading(false)
    }, 500)
  }

  const getRelationIcon = (relation: string) => {
    if (relation.includes("همسر")) return <Heart className="w-6 h-6 text-red-500" />
    if (relation.includes("پدر") || relation.includes("مادر")) return <Crown className="w-6 h-6 text-yellow-500" />
    if (relation.includes("برادر") || relation.includes("خواهر")) return <Users className="w-6 h-6 text-blue-500" />
    if (relation.includes("فرزند") || relation.includes("نوه")) return <Baby className="w-6 h-6 text-green-500" />
    if (relation.includes("شوهر") || relation.includes("عروس") || relation.includes("داماد"))
      return <Star className="w-6 h-6 text-purple-500" />
    return <Users className="w-6 h-6 text-gray-500" />
  }

  const handlePrint = () => {
    window.print()
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
    <div className={`grid gap-8 ${isResultExpanded ? "lg:grid-cols-1 h-full" : "lg:grid-cols-3"}`} dir="rtl">
      <div className={`${isResultExpanded ? "lg:col-span-1 flex flex-col h-full" : "lg:col-span-2"} space-y-8`}>
        {/* جستجوی رابطه */}
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-3">
              <Search className="w-7 h-7" />
              جستجوی رابطه خانوادگی
              <Sparkles className="w-6 h-6 animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* نفر اول */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-700">نفر اول</Label>
                <div className="relative">
                  <Input
                    value={person1Search}
                    onChange={(e) => {
                      setPerson1Search(e.target.value)
                      setShowPerson1List(true)
                    }}
                    onFocus={() => setShowPerson1List(true)}
                    onBlur={() => setTimeout(() => setShowPerson1List(false), 500)} // Delay to allow click
                    placeholder="نام نفر اول را تایپ کنید..."
                    className="h-14 text-lg border-2 border-indigo-200 focus:border-indigo-500 rounded-xl"
                  />
                  {showPerson1List && filteredPerson1List.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 z-10 bg-white border-2 border-indigo-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2"
                      onMouseDown={(e) => e.preventDefault()} // Prevent input from losing focus when clicking inside dropdown
                    >
                      {filteredPerson1List.map((person) => (
                        <div
                          key={person.id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setPerson1(person.fullName)
                            setPerson1Search(person.fullName)
                            setShowPerson1List(false)
                          }}
                        >
                          <div className="font-semibold text-gray-800">{person.fullName}</div>
                          <div className="text-sm text-gray-500">
                            {person.gender} • کد: {person.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* نفر دوم */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-700">نفر دوم</Label>
                <div className="relative">
                  <Input
                    value={person2Search}
                    onChange={(e) => {
                      setPerson2Search(e.target.value)
                      setShowPerson2List(true)
                    }}
                    onFocus={() => setShowPerson2List(true)}
                    onBlur={() => setTimeout(() => setShowPerson2List(false), 500)} // Delay to allow click
                    placeholder="نام نفر دوم را تایپ کنید..."
                    className="h-14 text-lg border-2 border-indigo-200 focus:border-indigo-500 rounded-xl"
                  />
                  {showPerson2List && filteredPerson2List.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 z-10 bg-white border-2 border-indigo-200 rounded-xl shadow-xl max-h-60 overflow-y-auto mt-2"
                      onMouseDown={(e) => e.preventDefault()} // Prevent input from losing focus when clicking inside dropdown
                    >
                      {filteredPerson2List.map((person) => (
                        <div
                          key={person.id}
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setPerson2(person.fullName)
                            setPerson2Search(person.fullName)
                            setShowPerson2List(false)
                          }}
                        >
                          <div className="font-semibold text-gray-800">{person.fullName}</div>
                          <div className="text-sm text-gray-500">
                            {person.gender} • کد: {person.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={findRelationship}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-16 text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              disabled={searchLoading}
            >
              {searchLoading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  در حال جستجو...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Search className="w-6 h-6" />
                  پیدا کردن رابطه
                  <Sparkles className="w-6 h-6" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* نتایج */}
        {result && (
          <Card
            className={`shadow-2xl border-0 bg-gradient-to-br from-white to-green-50 ${isResultExpanded ? "flex-1 flex flex-col" : ""}`}
          >
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Star className="w-7 h-7" />
                نتیجه جستجو
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsResultExpanded(!isResultExpanded)}
                  className="text-white hover:bg-white/20"
                  title={isResultExpanded ? "کوچک‌نمایی" : "بزرگ‌نمایی"}
                >
                  {isResultExpanded ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrint}
                  className="text-white hover:bg-white/20"
                  title="پرینت نتیجه"
                >
                  <Printer className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className={`p-8 ${isResultExpanded ? "flex-1 flex flex-col" : ""}`}>
              {result.error ? (
                <div className="text-center p-8 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border-2 border-red-200">
                  <div className="text-2xl font-bold text-red-700 mb-2">{result.error}</div>
                  {result.person1 && result.person2 && (
                    <div className="text-lg text-red-600">
                      بین <span className="font-semibold">{result.person1}</span> و{" "}
                      <span className="font-semibold">{result.person2}</span>
                    </div>
                  )}
                </div>
              ) : result.type === "simple" ? (
                <div className="text-center space-y-8">
                  <div className="flex items-center justify-center gap-8 text-xl flex-wrap" dir="rtl">
                    <div className="px-6 py-4 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl border-2 border-indigo-300 shadow-lg">
                      <span className="font-bold text-indigo-800 text-xl">{result.person1}</span>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border-2 border-green-400 shadow-lg">
                        {getRelationIcon(result.relation!)}
                        <span className="font-bold text-green-800 text-2xl">{result.relation}</span>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl border-2 border-indigo-300 shadow-lg">
                      <span className="font-bold text-indigo-800 text-xl">{result.person2}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`space-y-8 ${isResultExpanded ? "flex-1 flex flex-col" : ""}`} dir="rtl">
                  <h3 className="text-2xl font-bold text-center text-gray-800 bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-2xl border-2 border-yellow-300">
                    مسیر رابطه از {result.person1} به {result.person2}
                  </h3>
                  <div className={`space-y-6 overflow-y-auto ${isResultExpanded ? "flex-1" : "max-h-96"}`}>
                    {result.path!.map((person, index) => (
                      <div key={person.id} className="flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <div className="px-8 py-6 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl font-bold text-blue-800 border-2 border-blue-400 min-w-[250px] text-center shadow-lg text-lg">
                            {person.name}
                          </div>
                          {index < result.relationships!.length && (
                            <div className="flex flex-col items-center mt-4 mb-4">
                              <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-red-400 rounded-full"></div>
                              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-full text-lg text-orange-800 font-bold border-2 border-orange-400 shadow-lg">
                                <span>{result.relationships![index]}</span>
                              </div>
                              <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-red-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* بخش کناری */}
      {!isResultExpanded && (
        <div className="space-y-6">
          {/* آمار جستجو */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                آمار خانواده
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                  <span className="font-semibold">کل اعضا:</span>
                  <span className="font-bold text-2xl text-indigo-600">{familyData.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <span className="font-semibold">مردان:</span>
                  <span className="font-bold text-xl text-blue-600">
                    {familyData.filter((p) => p.gender === "مرد").length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
                  <span className="font-semibold">زنان:</span>
                  <span className="font-bold text-xl text-pink-600">
                    {familyData.filter((p) => p.gender === "زن").length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                  <span className="font-semibold">متاهلان:</span>
                  <span className="font-bold text-xl text-red-600">
                    {familyData.filter((p) => p.spouse1Id || p.spouse2Id || p.spouse3Id || p.spouse4Id).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* راهنمای نمادها */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-lg">راهنمای نمادها</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                  <Heart className="w-6 h-6 text-red-500" />
                  <span className="font-semibold">همسر</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <span className="font-semibold">والدین</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" />
                  <span className="font-semibold">خواهر/برادر</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <Baby className="w-6 h-6 text-green-500" />
                  <span className="font-semibold">فرزند/نوه</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                  <Star className="w-6 h-6 text-purple-500" />
                  <span className="font-semibold">پدرشوهر/مادرشوهر</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
