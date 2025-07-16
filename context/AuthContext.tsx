"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  username: string
  role: "admin" | "guest"
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// کاربران ثابت (مشابه فایل HTML اصلی)
const USERS = {
  admin: "admin123",
  guest: "guest123",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // بارگذاری وضعیت ورود از localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("familyTreeUser")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("familyTreeUser")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const expectedPassword = USERS[username as keyof typeof USERS]
    if (expectedPassword && expectedPassword === password) {
      const userData: User = {
        username,
        role: username as "admin" | "guest",
      }
      setUser(userData)
      localStorage.setItem("familyTreeUser", JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("familyTreeUser")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
