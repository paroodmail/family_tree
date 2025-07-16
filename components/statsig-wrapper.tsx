import { StatsigClientProvider } from "./statsig-client-provider"
import type { ReactNode } from "react"

interface StatsigWrapperProps {
  children: ReactNode
}

export default function StatsigWrapper({ children }: StatsigWrapperProps) {
  // در server component، مقدار CLIENT_KEY را بگیر
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY

  return <StatsigClientProvider clientKey={clientKey}>{children}</StatsigClientProvider>
}
