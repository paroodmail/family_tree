/* eslint react-hooks/exhaustive-deps: off */
"use client"

import { useEffect, useState, type ReactNode } from "react"
import { StatsigProvider } from "statsig-react"
import { StatsigConfigProvider } from "@/context/StatsigConfigContext"
import { useAuth } from "@/context/AuthContext" // Import useAuth

interface StatsigClientProviderProps {
  children: ReactNode
  featureGateKey?: string
}

export function StatsigClientProvider({ children, featureGateKey }: StatsigClientProviderProps) {
  const { user, isLoading: authLoading } = useAuth() // Get user and loading state from AuthContext
  const [sdkKey, setSdkKey] = useState<string | null>(null)
  const [isStatsigReady, setIsStatsigReady] = useState(false)

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

  // Wait for both SDK key and auth data to be ready
  useEffect(() => {
    if (sdkKey && !authLoading) {
      setIsStatsigReady(true)
    } else {
      setIsStatsigReady(false)
    }
  }, [sdkKey, authLoading])

  // Prepare Statsig user object
  const statsigUser = user
    ? {
        userID: user.username, // Use username as userID
        custom: {
          userRole: user.role, // Pass user role as a custom property
        },
      }
    : { userID: "logged_out", custom: { userRole: "logged_out" } } // Default for logged out users

  const content = <StatsigConfigProvider featureGateKey={featureGateKey}>{children}</StatsigConfigProvider>

  if (!isStatsigReady || !sdkKey) {
    // Render content without StatsigProvider if not ready
    return content
  }

  return (
    <StatsigProvider sdkKey={sdkKey} user={statsigUser}>
      {content}
    </StatsigProvider>
  )
}
