"use client"

import { StatsigProvider } from "statsig-react"
import type { ReactNode } from "react"

interface StatsigClientProviderProps {
  children: ReactNode
  clientKey?: string // clientKey is now optional and passed from server
}

export function StatsigClientProvider({ children, clientKey }: StatsigClientProviderProps) {
  // If clientKey is not provided (e.g., in development or not configured),
  // render children directly without StatsigProvider to avoid errors.
  if (!clientKey) {
    console.warn("Statsig client key not provided. Statsig features will be disabled.")
    return <>{children}</>
  }

  return (
    <StatsigProvider sdkKey={clientKey} user={{ userID: "a-user-id" }} options={{}}>
      {children}
    </StatsigProvider>
  )
}
