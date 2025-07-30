"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Shield, Settings, Users, Activity, Home, ChevronLeft, ChevronRight, Sparkles, RotateCcw, LogOut, Ban } from "lucide-react"
import { useSystemInfo } from "@/hooks/use-system-info"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  stats?: {
    totalDevices: number
    blacklistedDevices: number
    todayVerifications: number
  }
}

export function Sidebar({ activeTab, onTabChange, stats }: SidebarProps) {
  const { systemInfo } = useSystemInfo()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      id: "dashboard",
      label: "仪表盘",
      icon: BarChart3,
      badge: stats?.todayVerifications,
    },
    {
      id: "devices",
      label: "设备管理",
      icon: Shield,
      badge: stats?.totalDevices,
    },
    {
      id: "blacklist",
      label: "黑名单管理",
      icon: Ban,
      badge: stats?.blacklistedDevices,
    },
    {
      id: "logs",
      label: "验证日志",
      icon: Activity,
    },
    {
      id: "rebind-history",
      label: "换绑历史",
      icon: RotateCcw,
    },
    {
      id: "settings",
      label: "系统设置",
      icon: Settings,
    },
  ]

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-gradient-to-b from-blue-50 to-purple-50 backdrop-blur-sm border-r-2 border-blue-200 transition-all duration-300 flex flex-col shadow-lg`}
    >
      {/* 头部 */}
      <div className="p-6 border-b-2 border-blue-200 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  管理控制台
                </h2>
                <p className="text-xs text-gray-600 font-medium">{systemInfo.systemName}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 h-9 w-9 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-blue-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-blue-600" />
            )}
          </Button>
        </div>
      </div>

      {/* 导航菜单 */}
      <div className="flex-1 p-4">
        <nav className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <div key={item.id} className="relative">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-700 hover:shadow-md"
                  } ${
                    collapsed
                      ? "h-14 w-14 p-0 justify-center rounded-xl mx-auto"
                      : "h-12 justify-start px-4 rounded-xl"
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className={`${collapsed ? "w-6 h-6" : "w-5 h-5 mr-3"}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant={isActive ? "secondary" : "default"}
                          className={`ml-2 ${isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"}`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
                {/* 折叠状态下的标签 */}
                {collapsed && (
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-600 font-medium block">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge className="mt-1 bg-blue-100 text-blue-800 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* 底部 */}
      <div className="p-4 border-t-2 border-blue-200 bg-white/30 space-y-2">
        <Button
          variant="ghost"
          className={`w-full transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-100 ${
            collapsed
              ? "h-12 w-12 p-0 justify-center rounded-xl mx-auto"
              : "h-10 justify-start px-4 rounded-xl"
          }`}
          onClick={() => (window.location.href = "/")}
        >
          <Home className={`${collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"}`} />
          {!collapsed && <span className="font-medium">返回首页</span>}
        </Button>
        {collapsed && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-600 font-medium">首页</span>
          </div>
        )}

        <Button
          variant="ghost"
          className={`w-full transition-all duration-200 text-gray-600 hover:text-red-600 hover:bg-red-100 ${
            collapsed
              ? "h-12 w-12 p-0 justify-center rounded-xl mx-auto"
              : "h-10 justify-start px-4 rounded-xl"
          }`}
          onClick={async () => {
            try {
              await fetch("/api/admin/logout", { method: "POST" })
              window.location.href = "/admin/login"
            } catch (error) {
              console.error("登出失败:", error)
            }
          }}
        >
          <LogOut className={`${collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"}`} />
          {!collapsed && <span className="font-medium">退出登录</span>}
        </Button>
        {collapsed && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-600 font-medium">退出</span>
          </div>
        )}
      </div>
    </div>
  )
}
