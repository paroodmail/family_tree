"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { importMembers } from "@/lib/actions" // Import the new action

interface ImportMembersDialogProps {
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
}

// Define the expected CSV headers and their corresponding Person properties
const CSV_HEADERS = [
  "ID",
  "FullName",
  "Gender",
  "FatherID",
  "MotherID",
  "Spouse1_ID",
  "Spouse2_ID",
  "Spouse3_ID",
  "Spouse4_ID",
  "BirthYear",
]

export default function ImportMembersDialog({ isOpen, onClose, isAdmin }: ImportMembersDialogProps) {
  const [csvText, setCsvText] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n")
    if (lines.length === 0) return []

    const headers = lines[0].split(",").map((h) => h.trim())
    const dataLines = lines.slice(1)

    // Basic validation for headers
    const missingHeaders = CSV_HEADERS.filter((h) => !headers.includes(h))
    if (missingHeaders.length > 0) {
      throw new Error(
        `هدرهای زیر در فایل CSV یافت نشدند: ${missingHeaders.join(", ")}. لطفاً از فرمت صحیح استفاده کنید.`,
      )
    }

    return dataLines
      .map((line, lineIndex) => {
        const values = line.split(",").map((v) => v.trim())
        const person: any = {}
        headers.forEach((header, index) => {
          person[header] = values[index] === "" ? undefined : values[index]
        })

        // Basic validation for required fields
        if (!person.FullName || !person.Gender) {
          console.warn(`Skipping row ${lineIndex + 2} due to missing FullName or Gender: ${line}`)
          return null // Skip invalid rows
        }

        // Ensure gender is valid
        if (person.Gender !== "مرد" && person.Gender !== "زن") {
          console.warn(`Skipping row ${lineIndex + 2} due to invalid Gender: ${person.Gender}`)
          return null
        }

        return person
      })
      .filter(Boolean) // Remove nulls from skipped rows
  }

  const handleImport = async () => {
    if (!isAdmin) {
      toast({
        title: "خطا",
        description: "شما اجازه وارد کردن داده‌ها را ندارید.",
        variant: "destructive",
      })
      return
    }
    if (!csvText.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً داده‌های CSV را وارد کنید یا یک فایل را انتخاب کنید.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const parsedData = parseCSV(csvText)
      if (parsedData.length === 0) {
        toast({
          title: "هشدار",
          description: "هیچ داده معتبری برای وارد کردن یافت نشد.",
          variant: "warning",
        })
        return
      }

      const result = await importMembers(parsedData)

      if (result.success) {
        toast({
          title: "وارد کردن موفق",
          description: result.message,
          action: <CheckCircle className="text-green-500" />,
        })
        onClose()
        setCsvText("")
      } else {
        toast({
          title: "خطا در وارد کردن",
          description: result.message,
          variant: "destructive",
          action: <XCircle className="text-red-500" />,
        })
      }
    } catch (error: any) {
      toast({
        title: "خطا در پردازش CSV",
        description: error.message || "فرمت CSV نامعتبر است.",
        variant: "destructive",
        action: <XCircle className="text-red-500" />,
      })
      console.error("CSV parsing error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCsvText(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>وارد کردن اعضا از اکسل (CSV)</DialogTitle>
          <DialogDescription>
            داده‌های اعضای خانواده را از یک فایل CSV یا با کپی و پیست وارد کنید.
            <br />
            <span className="font-bold text-blue-600">فرمت مورد انتظار:</span>{" "}
            <code className="bg-gray-100 p-1 rounded text-sm">
              ID,FullName,Gender,FatherID,MotherID,Spouse1_ID,Spouse2_ID,Spouse3_ID,Spouse4_ID,BirthYear
            </code>
            <br />
            <span className="text-red-500">توجه:</span> هدرها باید دقیقاً مطابق با فرمت بالا باشند.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-input">کپی و پیست داده‌های CSV</Label>
            <Textarea
              id="csv-input"
              placeholder="ID,FullName,Gender,FatherID,MotherID,Spouse1_ID,Spouse2_ID,Spouse3_ID,Spouse4_ID,BirthYear
1,صلاح الدین بلیدئی,مرد,5,6,,,,,"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              disabled={loading || !isAdmin}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">یا</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-upload">آپلود فایل CSV</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading || !isAdmin}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={loading}>
            لغو
          </Button>
          <Button onClick={handleImport} disabled={loading || !isAdmin}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                در حال وارد کردن...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                شروع وارد کردن
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
