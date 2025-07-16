import { NextResponse } from "next/server"

export const dynamic = "force-static" // کش در بیلد؛ چون کلید تغییری نمی‌کند

export async function GET() {
  // فقط در سرور قابل دسترسی است
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY
  return NextResponse.json({ clientKey })
}
