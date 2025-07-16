"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"

export default function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const success = await login(username, password)

    if (!success) {
      setError("نام کاربری یا رمز عبور اشتباه است.")
      toast({
        title: "خطا در ورود",
        description: "نام کاربری یا رمز عبور اشتباه است.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "ورود موفق",
        description: `خوش آمدید، ${username}!`,
      })
      router.replace("/")
    }
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">نام کاربری</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="نام کاربری"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="رمز عبور"
          disabled={isSubmitting}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-lg py-3" disabled={isSubmitting}>
        {isSubmitting ? "در حال ورود..." : "ورود"}
      </Button>
    </form>
  )
}
