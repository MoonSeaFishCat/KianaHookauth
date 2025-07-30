"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Ban, Search, RotateCcw, Loader2, Calendar, User, AlertTriangle } from "lucide-react"
import type { DeviceAuthorization } from "@/lib/database"
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from "@/lib/sweetalert"

interface BlacklistManagementProps {
  devices: DeviceAuthorization[]
  onRefresh: () => void
}

export function BlacklistManagement({ devices, onRefresh }: BlacklistManagementProps) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [blacklistDialog, setBlacklistDialog] = useState<{ show: boolean; device: DeviceAuthorization | null }>({
    show: false,
    device: null,
  })
  const [blacklistForm, setBlacklistForm] = useState({
    reason: "",
  })

  // 过滤黑名单设备
  const blacklistedDevices = devices.filter(device => device.is_blacklisted)
  
  // 搜索过滤
  const filteredDevices = blacklistedDevices.filter(device =>
    device.device_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.qq_number?.includes(searchTerm) ||
    device.blacklist_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddToBlacklist = async () => {
    if (!blacklistDialog.device || !blacklistForm.reason.trim()) return

    setLoading(true)
    showLoading("加入黑名单中...")
    
    try {
      const response = await fetch(`/api/admin/devices/${blacklistDialog.device.device_code}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blacklistForm.reason }),
      })

      const data = await response.json()
      closeLoading()
      
      if (data.success) {
        await showSuccess("操作成功", "设备已加入黑名单")
        setBlacklistDialog({ show: false, device: null })
        setBlacklistForm({ reason: "" })
        onRefresh()
      } else {
        await showError("操作失败", data.message || "加入黑名单时发生错误")
      }
    } catch (error) {
      closeLoading()
      console.error("拉黑设备失败:", error)
      await showError("操作失败", "网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromBlacklist = async (deviceCode: string) => {
    const result = await showDeleteConfirm(
      "确认解除黑名单？",
      `确定要将设备 "${deviceCode}" 从黑名单中移除吗？`
    )

    if (result.isConfirmed) {
      showLoading("解除黑名单中...")
      
      try {
        const response = await fetch(`/api/admin/devices/${deviceCode}/blacklist`, {
          method: "DELETE",
        })

        const data = await response.json()
        closeLoading()
        
        if (data.success) {
          await showSuccess("操作成功", "设备已从黑名单中移除")
          onRefresh()
        } else {
          await showError("操作失败", data.message || "解除黑名单时发生错误")
        }
      } catch (error) {
        closeLoading()
        console.error("解除拉黑失败:", error)
        await showError("操作失败", "网络错误，请稍后重试")
      }
    }
  }

  const openBlacklistDialog = (device: DeviceAuthorization) => {
    setBlacklistDialog({ show: true, device })
    setBlacklistForm({ reason: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ban className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              黑名单管理
            </h2>
            <p className="text-gray-600 mt-1">管理被拉黑的设备和用户</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-sm">
            {blacklistedDevices.length} 个设备被拉黑
          </Badge>
        </div>
      </div>

      {/* 搜索栏 */}
      <Card className="border-2 border-red-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-red-600" />
            搜索黑名单
          </CardTitle>
          <CardDescription>根据设备码、设备名称、QQ号或拉黑原因搜索</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="输入设备码、设备名称、QQ号或拉黑原因..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2 border-red-200 focus:border-red-400"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              清除
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 黑名单列表 */}
      <div className="grid gap-4">
        {filteredDevices.length === 0 ? (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-12 text-center">
              <Ban className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {blacklistedDevices.length === 0 ? "暂无黑名单设备" : "未找到匹配的设备"}
              </h3>
              <p className="text-gray-500">
                {blacklistedDevices.length === 0 
                  ? "目前没有设备被加入黑名单" 
                  : "尝试调整搜索条件"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDevices.map((device) => (
            <Card key={device.device_code} className="border-2 border-red-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" className="font-mono">
                        {device.device_code}
                      </Badge>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        已拉黑
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">设备名称:</span>
                        <span className="font-medium">{device.device_name || "未设置"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">QQ号:</span>
                        <span className="font-medium">{device.qq_number || "未绑定"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">拉黑时间:</span>
                        <span className="font-medium">
                          {device.blacklisted_at 
                            ? new Date(device.blacklisted_at).toLocaleString("zh-CN")
                            : "未知"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">操作人:</span>
                        <span className="font-medium">{device.blacklisted_by || "系统"}</span>
                      </div>
                    </div>

                    {device.blacklist_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div>
                            <span className="text-sm font-medium text-red-800">拉黑原因:</span>
                            <p className="text-sm text-red-700 mt-1">{device.blacklist_reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-300 bg-transparent hover:bg-green-50"
                      onClick={() => handleRemoveFromBlacklist(device.device_code)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      解除拉黑
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 添加到黑名单对话框 */}
      <Dialog open={blacklistDialog.show} onOpenChange={(open) => setBlacklistDialog({ show: open, device: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              加入黑名单
            </DialogTitle>
            <DialogDescription>
              将设备 {blacklistDialog.device?.device_code} 加入黑名单
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">拉黑原因 *</Label>
              <Textarea
                id="reason"
                placeholder="请输入拉黑原因..."
                value={blacklistForm.reason}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, reason: e.target.value })}
                className="border-2 border-red-200 focus:border-red-400"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBlacklistDialog({ show: false, device: null })}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleAddToBlacklist}
              disabled={loading || !blacklistForm.reason.trim()}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </div>
              ) : (
                "确认拉黑"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
