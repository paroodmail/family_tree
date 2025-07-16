import { StatsigClientProvider } from "./statsig-client-provider"
import type { ReactNode } from "react"

interface StatsigWrapperProps {
  children: ReactNode
}

export default function StatsigWrapper({ children }: StatsigWrapperProps) {
  // این کامپوننت سرور است؛ فقط کلید فیچرگیت را ارسال می‌کنیم.
  const featureGateKey = process.env.NEXT_PUBLIC_EXPERIMENTATION_CONFIG_ITEM_KEY

  return <StatsigClientProvider featureGateKey={featureGateKey}>{children}</StatsigClientProvider>
}
