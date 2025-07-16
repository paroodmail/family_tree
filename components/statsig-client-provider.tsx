"use client"

import { StatsigProvider } from "statsig-react"
import type { ReactNode } from "react"

interface StatsigClientProviderProps {
  children: ReactNode
  clientKey?: string
}

export function StatsigClientProvider({ children, clientKey }: StatsigClientProviderProps) {
  // اگر clientKey وجود نداشت، فقط children را برگردان
  if (!clientKey) {
    return <>{children}</>
  }

  return (
    <StatsigProvider sdkKey={clientKey} user={{ userID: "a-user-id" }} options={{}}>
      {children}
    </StatsigProvider>
  )
}
