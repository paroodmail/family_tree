/* eslint react-hooks/exhaustive-deps: off */
"use client"

import { useEffect, useState, type ReactNode } from "react"
import { StatsigProvider } from "statsig-react"
import { StatsigConfigProvider } from "@/context/StatsigConfigContext"

interface StatsigClientProviderProps {
  children: ReactNode
  featureGateKey?: string
}

export function StatsigClientProvider({ children, featureGateKey }: StatsigClientProviderProps) {
  const [sdkKey, setSdkKey] = useState<string | null>(null)

  useEffect(() => {
    async function fetchKey() {
      try {
        const res = await fetch("/api/statsig-client-key")
        const data = (await res.json()) as { clientKey?: string }
        setSdkKey(data.clientKey ?? null)
      } catch (err) {
        console.error("Failed to fetch Statsig client key:", err)
        setSdkKey(null)
      }
    }
    fetchKey()
  }, [])

  // ➊ همیشه ابتدا StatsigConfigProvider را رندر می‌کنیم
  // ➋ سپس در صورت آماده بودن sdkKey، StatsigProvider را دور آن می‌پیچیم
  const content = <StatsigConfigProvider featureGateKey={featureGateKey}>{children}</StatsigConfigProvider>

  if (!sdkKey) {
    // هنوز کلید آماده نیست؛ فقط Content (با Provider) را برمی‌گردانیم
    return content
  }

  return (
    <StatsigProvider sdkKey={sdkKey} user={{ userID: "a-user-id" }}>
      {content}
    </StatsigProvider>
  )
}
