"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/admin/sidebar"
import { Dashboard } from "@/components/admin/dashboard"
import { DeviceManagement } from "@/components/admin/device-management"
import { BlacklistManagement } from "@/components/admin/blacklist-management"
import { SystemSettings } from "@/components/admin/system-settings"
import { VerificationLogs } from "@/components/admin/verification-logs"
import { RebindHistory } from "@/components/admin/rebind-history"
import { DynamicTitle } from "@/components/dynamic-title"
import type { DeviceAuthorization, DashboardStats, SystemSettings as SystemSettingsType } from "@/lib/database"

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  // 数据状态
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [devices, setDevices] = useState<DeviceAuthorization[]>([])
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  // 检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // 加载数据
  useEffect(() => {
    loadInitialData()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/admin/auth/check", {
        credentials: 'include'
      })

      if (!response.ok) {
        // 认证失败，跳转到登录页
        router.replace("/admin/login")
        return
      }

      const data = await response.json()
      if (!data.success) {
        router.replace("/admin/login")
        return
      }
    } catch (error) {
      console.error("认证检查失败:", error)
      router.replace("/admin/login")
    }
  }

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([loadDashboardStats(), loadDevices(), loadSettings()])
    } catch (error) {
      console.error("加载数据失败:", error)
      setError("加载数据失败，请刷新页面重试")
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard")
      const data = await response.json()
      if (data.success) {
        setDashboardStats(data.data)
      }
    } catch (error) {
      console.error("加载仪表盘数据失败:", error)
      throw error
    }
  }

  const loadDevices = async () => {
    try {
      const response = await fetch("/api/admin/devices")
      const data = await response.json()
      if (data.success) {
        setDevices(data.data)
      }
    } catch (error) {
      console.error("加载设备列表失败:", error)
      throw error
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error("加载系统设置失败:", error)
      throw error
    }
  }

  const handleRefresh = async () => {
    await loadInitialData()
    setSuccessMessage("数据已刷新")
  }

  // 清除消息
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, error])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">正在加载管理控制台...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return dashboardStats ? <Dashboard stats={dashboardStats} /> : null
      case "devices":
        return <DeviceManagement devices={devices} onRefresh={handleRefresh} />
      case "blacklist":
        return <BlacklistManagement devices={devices} onRefresh={handleRefresh} />
      case "logs":
        return <VerificationLogs />
      case "rebind-history":
        return <RebindHistory />
      case "settings":
        return <SystemSettings />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <DynamicTitle suffix="管理后台" />
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full opacity-10 animate-spin" style={{ animationDuration: "20s" }}></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* 左侧边栏 */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={
            dashboardStats
              ? {
                  totalDevices: dashboardStats.totalDevices,
                  blacklistedDevices: dashboardStats.blacklistedDevices,
                  todayVerifications: dashboardStats.todayVerifications,
                }
              : undefined
          }
        />

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border-2 border-blue-200 p-6">
            {/* 消息提示 */}
            {(error || successMessage) && (
              <div className="mb-6">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

              {/* 内容区域 */}
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
