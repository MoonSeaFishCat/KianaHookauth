"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Shield, Activity, TrendingUp, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import type { DashboardStats } from "@/lib/database"

interface DashboardProps {
  stats: DashboardStats
}

export function Dashboard({ stats }: DashboardProps) {
  const statCards = [
    {
      title: "总设备数",
      value: stats.totalDevices,
      icon: Shield,
      color: "from-blue-500 to-blue-600",
      description: "已注册设备总数",
    },
    {
      title: "活跃设备",
      value: stats.activeDevices,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      description: "正常可用设备",
    },
    {
      title: "拉黑设备",
      value: stats.blacklistedDevices,
      icon: XCircle,
      color: "from-red-500 to-red-600",
      description: "已被拉黑设备",
    },
    {
      title: "今日验证",
      value: stats.todayVerifications,
      icon: Activity,
      color: "from-purple-500 to-purple-600",
      description: "今日验证次数",
    },
  ]

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            数据仪表盘
          </h2>
          <p className="text-gray-600 mt-1">系统运行状态和统计数据</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="relative overflow-hidden border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 成功率统计 */}
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              验证成功率
            </CardTitle>
            <CardDescription>过去7天的验证成功率统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">成功率</span>
                <span className="text-2xl font-bold text-green-600">{stats.successRate}%</span>
              </div>
              <Progress value={stats.successRate} className="h-2" />
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>成功验证</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>验证失败</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 设备类型分布 */}
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              设备类型分布
            </CardTitle>
            <CardDescription>不同类型设备的数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">永久授权</span>
                </div>
                <Badge className="bg-green-100 text-green-800">{stats.deviceStats.permanent}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">临时授权</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{stats.deviceStats.temporary}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">已过期</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">{stats.deviceStats.expired}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近验证记录 */}
      <Card className="border-2 border-pink-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            最近验证记录
          </CardTitle>
          <CardDescription>最新的设备验证活动</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentVerifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无验证记录</p>
              </div>
            ) : (
              stats.recentVerifications.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {log.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{log.device_code}</p>
                      <p className="text-sm text-gray-500">
                        {log.ip_address} • {new Date(log.created_at!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={log.success ? "default" : "destructive"}>{log.success ? "成功" : "失败"}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
