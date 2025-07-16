"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Search, BarChart3, UserPlus, Database } from "lucide-react"
import SearchTab from "@/components/SearchTab"
import ChartTab from "@/components/ChartTab"
import DataTab from "@/components/DataTab"
import ManageTab from "@/components/ManageTab"
import { FamilyProvider } from "@/context/FamilyContext"
import { SignOutButton } from "@/components/sign-out-button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useFeatureGate } from "statsig-react"
import { useAuth } from "@/context/AuthContext"

export default function FamilyTreeSystem() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [adminTabsEnabled, setAdminTabsEnabled] = useState(true)
  const [isLoadingStatsig, setIsLoadingStatsig] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const userRole = user?.role || "logged_out"

  useEffect(() => {
    try {
      const featureGate = useFeatureGate("admin_tabs_enabled", { custom: { userRole: userRole } })
      setAdminTabsEnabled(featureGate.value)
      setIsLoadingStatsig(featureGate.isLoading)
    } catch (error) {
      // اگر Statsig در دسترس نبود، از مقدار پیش‌فرض استفاده کن
      console.warn("Statsig not available, using default feature gate values")
      setAdminTabsEnabled(true)
      setIsLoadingStatsig(false)
    }
  }, [userRole])

  if (!isClient || authLoading || isLoadingStatsig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-xl text-gray-700">در حال بارگذاری...</p>
      </div>
    )
  }

  const isLoggedIn = !!user
  const isAdmin = userRole === "admin"

  return (
    <FamilyProvider>
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 lg:p-8 flex flex-col"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto space-y-6 flex flex-col flex-1 w-full">
          {/* Header */}
          <Card className="text-center shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-indigo-800 flex items-center justify-center gap-3">
                <Users className="w-8 h-8 md:w-10 md:h-10" />
                سیستم جامع مدیریت شجره‌نامه خانوادگی
              </CardTitle>
              <p className="text-gray-600 mt-2 text-base md:text-lg">
                سیستم هوشمند یافتن روابط خانوادگی با امکانات کامل مدیریت اعضا
              </p>
              {isLoggedIn && (
                <div className="mt-4">
                  <SignOutButton />
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="search" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-indigo-100 rounded-xl shadow-md">
              <TabsTrigger
                value="search"
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-base md:text-lg py-2 md:py-3 px-2 md:px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 rounded-lg"
              >
                <Search className="w-5 h-5" />
                جستجوی رابطه
              </TabsTrigger>
              <TabsTrigger
                value="chart"
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-base md:text-lg py-2 md:py-3 px-2 md:px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 rounded-lg"
              >
                <BarChart3 className="w-5 h-5" />
                نمودار خانواده
              </TabsTrigger>
              {isLoggedIn && adminTabsEnabled ? (
                <>
                  <TabsTrigger
                    value="manage"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-base md:text-lg py-2 md:py-3 px-2 md:px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 rounded-lg"
                  >
                    <UserPlus className="w-5 h-5" />
                    مدیریت اعضا
                  </TabsTrigger>
                  <TabsTrigger
                    value="data"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-base md:text-lg py-2 md:py-3 px-2 md:px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 rounded-lg"
                  >
                    <Database className="w-5 h-5" />
                    بانک اطلاعات
                  </TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger
                    value="manage"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-base md:text-lg py-2 md:py-3 px-2 md:px-4 text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <UserPlus className="w-5 h-5" />
                    مدیریت اعضا
                  </TabsTrigger>
                  <TabsTrigger
                    value="data"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-base md:text-lg py-2 md:py-3 px-2 md:px-4 text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <Database className="w-5 h-5" />
                    بانک اطلاعات
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="search" className="mt-6 flex-1 flex flex-col">
              <SearchTab />
            </TabsContent>

            <TabsContent value="chart" className="mt-6 flex-1 flex flex-col">
              <ChartTab />
            </TabsContent>

            {isLoggedIn && adminTabsEnabled ? (
              <>
                <TabsContent value="manage" className="mt-6 flex-1 flex flex-col">
                  <ManageTab isAdmin={isAdmin} />
                </TabsContent>

                <TabsContent value="data" className="mt-6 flex-1 flex flex-col">
                  <DataTab isAdmin={isAdmin} />
                </TabsContent>
              </>
            ) : (
              <>
                <TabsContent value="manage" className="mt-6 flex-1 flex flex-col">
                  <Card className="p-6 text-center text-red-600">
                    برای دسترسی به این بخش، لطفاً وارد شوید یا دسترسی لازم را ندارید.
                  </Card>
                </TabsContent>
                <TabsContent value="data" className="mt-6 flex-1 flex flex-col">
                  <Card className="p-6 text-center text-red-600">
                    برای دسترسی به این بخش، لطفاً وارد شوید یا دسترسی لازم را ندارید.
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </FamilyProvider>
  )
}
