import { NextResponse } from "next/server"

export const dynamic = "force-static" // کش در بیلد؛ چون کلید تغییری نمی‌کند

export async function GET() {
  // اکنون کلید را با نام جدید STATSIG_CLIENT_KEY می‌خوانیم
  const clientKey = process.env.STATSIG_CLIENT_KEY
  return NextResponse.json({ clientKey })
}
