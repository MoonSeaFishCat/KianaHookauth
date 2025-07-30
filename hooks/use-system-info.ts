"use client"

import { useState, useEffect } from "react"

interface SystemInfo {
  systemName: string
  freeAuthMode: boolean
}

export function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    systemName: "设备授权系统",
    freeAuthMode: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSystemInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/system/info")
      const data = await response.json()
      
      if (data.success) {
        setSystemInfo(data.data)
      } else {
        setError(data.message || "获取系统信息失败")
        // 使用默认值
        setSystemInfo({
          systemName: "设备授权系统",
          freeAuthMode: false,
        })
      }
    } catch (error) {
      console.error("获取系统信息失败:", error)
      setError("网络错误")
      // 使用默认值
      setSystemInfo({
        systemName: "设备授权系统",
        freeAuthMode: false,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  return {
    systemInfo,
    loading,
    error,
    refetch: fetchSystemInfo,
  }
}
