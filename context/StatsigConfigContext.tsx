"use client"

import { createContext, useContext, type ReactNode } from "react"

interface StatsigConfigContextType {
  featureGateKey: string | undefined
}

const StatsigConfigContext = createContext<StatsigConfigContextType | undefined>(undefined)

export function StatsigConfigProvider({ children, featureGateKey }: { children: ReactNode; featureGateKey?: string }) {
  return <StatsigConfigContext.Provider value={{ featureGateKey }}>{children}</StatsigConfigContext.Provider>
}

export function useStatsigConfig() {
  const context = useContext(StatsigConfigContext)
  if (context === undefined) {
    throw new Error("useStatsigConfig must be used within a StatsigConfigProvider")
  }
  return context
}
