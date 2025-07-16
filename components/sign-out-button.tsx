"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"

export function SignOutButton() {
  const router = useRouter()
  const { toast } = useToast()
  const { logout } = useAuth()

  const handleSignOut = () => {
    logout()
    toast({
      title: "خروج موفق",
      description: "شما با موفقیت از سیستم خارج شدید.",
    })
    router.replace("/login")
  }

  return (
    <Button onClick={handleSignOut} variant="destructive" className="flex items-center gap-2">
      <LogOut className="w-4 h-4" />
      خروج
    </Button>
  )
}
