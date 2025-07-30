"use client"

import { useEffect } from "react"
import { useSystemInfo } from "@/hooks/use-system-info"

interface DynamicTitleProps {
  suffix?: string
}

export function DynamicTitle({ suffix }: DynamicTitleProps) {
  const { systemInfo } = useSystemInfo()

  useEffect(() => {
    const title = suffix ? `${suffix} - ${systemInfo.systemName}` : systemInfo.systemName
    document.title = title
  }, [systemInfo.systemName, suffix])

  return null
}
