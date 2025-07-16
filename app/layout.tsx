import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/AuthContext"
import StatsigWrapper from "@/components/statsig-wrapper" // Import the StatsigWrapper

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "سیستم جامع مدیریت شجره‌نامه خانوادگی",
  description: "سیستم هوشمند یافتن روابط خانوادگی با امکانات کامل مدیریت اعضا",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <StatsigWrapper>
            {" "}
            {/* Use StatsigWrapper here */}
            <AuthProvider>{children}</AuthProvider>
          </StatsigWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
