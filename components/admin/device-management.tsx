"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Shield, Ban, RotateCcw, Loader2, Edit, Trash2 } from "lucide-react"
import type { DeviceAuthorization } from "@/lib/database"
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from "@/lib/sweetalert"

interface DeviceManagementProps {
  devices: DeviceAuthorization[]
  onRefresh: () => void
}

export function DeviceManagement({ devices, onRefresh }: DeviceManagementProps) {
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // 批量操作相关状态
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [batchOperating, setBatchOperating] = useState(false)

  const [blacklistDialog, setBlacklistDialog] = useState<{ show: boolean; device: DeviceAuthorization | null }>({
    show: false,
    device: null,
  })
  const [editDialog, setEditDialog] = useState<{ show: boolean; device: DeviceAuthorization | null }>({
    show: false,
    device: null,
  })

  // 拉黑表单
  const [blacklistForm, setBlacklistForm] = useState({
    reason: "",
  })

  // 添加设备表单
  const [newDevice, setNewDevice] = useState({
    deviceCode: "",
    deviceName: "",
    qqNumber: "",
    email: "",
    expiresAt: "",
    isPermanent: true,
  })

  // 编辑设备表单
  const [editForm, setEditForm] = useState({
    deviceName: "",
    qqNumber: "",
    email: "",
    expiresAt: "",
    isPermanent: true,
  })

  // 快速时间设置
  const [quickTime, setQuickTime] = useState({
    amount: 1,
    unit: "days" as "hours" | "days" | "weeks" | "months",
  })

  const [editQuickTime, setEditQuickTime] = useState({
    amount: 1,
    unit: "days" as "hours" | "days" | "weeks" | "months",
  })

  // 计算过期时间
  const calculateExpiresAt = (amount: number, unit: string) => {
    const now = new Date()
    switch (unit) {
      case "hours":
        now.setHours(now.getHours() + amount)
        break
      case "days":
        now.setDate(now.getDate() + amount)
        break
      case "weeks":
        now.setDate(now.getDate() + amount * 7)
        break
      case "months":
        now.setMonth(now.getMonth() + amount)
        break
    }
    return now.toISOString()
  }

  // 应用快速时间设置
  const applyQuickTime = () => {
    const expiresAt = calculateExpiresAt(quickTime.amount, quickTime.unit)
    setNewDevice({ ...newDevice, expiresAt: expiresAt.split('T')[0] }) // 只取日期部分
  }

  // 应用快速时间设置到编辑表单
  const applyEditQuickTime = () => {
    const expiresAt = calculateExpiresAt(editQuickTime.amount, editQuickTime.unit)
    setEditForm({ ...editForm, expiresAt: expiresAt.split('T')[0] }) // 只取日期部分
  }

  // 批量操作处理函数
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedDevices(new Set(devices.map(device => device.device_code)))
    } else {
      setSelectedDevices(new Set())
    }
  }

  const handleSelectDevice = (deviceCode: string, checked: boolean) => {
    const newSelected = new Set(selectedDevices)
    if (checked) {
      newSelected.add(deviceCode)
    } else {
      newSelected.delete(deviceCode)
    }
    setSelectedDevices(newSelected)
    setSelectAll(newSelected.size === devices.length)
  }

  // 批量删除设备
  const handleBatchDelete = async () => {
    if (selectedDevices.size === 0) return

    const result = await showDeleteConfirm(
      `确定要删除选中的 ${selectedDevices.size} 个设备吗？`,
      "此操作不可撤销"
    )

    if (result.isConfirmed) {
      setBatchOperating(true)
      showLoading("正在批量删除设备...")

      try {
        const deletePromises = Array.from(selectedDevices).map(deviceCode =>
          fetch(`/api/admin/devices/${deviceCode}`, { method: "DELETE" })
        )

        await Promise.all(deletePromises)
        
        closeLoading()
        showSuccess("批量删除成功")
        setSelectedDevices(new Set())
        setSelectAll(false)
        onRefresh()
      } catch (error) {
        closeLoading()
        showError("批量删除失败")
      } finally {
        setBatchOperating(false)
      }
    }
  }

  // 批量拉黑设备
  const handleBatchBlacklist = async () => {
    if (selectedDevices.size === 0) return

    const result = await showDeleteConfirm(
      `确定要拉黑选中的 ${selectedDevices.size} 个设备吗？`,
      "拉黑后设备将无法通过验证"
    )

    if (result.isConfirmed) {
      setBatchOperating(true)
      showLoading("正在批量拉黑设备...")

      try {
        const blacklistPromises = Array.from(selectedDevices).map(deviceCode =>
          fetch(`/api/admin/devices/${deviceCode}/blacklist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "批量拉黑操作" })
          })
        )

        await Promise.all(blacklistPromises)
        
        closeLoading()
        showSuccess("批量拉黑成功")
        setSelectedDevices(new Set())
        setSelectAll(false)
        onRefresh()
      } catch (error) {
        closeLoading()
        showError("批量拉黑失败")
      } finally {
        setBatchOperating(false)
      }
    }
  }

  const handleAddDevice = async () => {
    setLoading(true)
    showLoading("添加设备中...")

    try {
      const response = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDevice),
      })

      const data = await response.json()
      closeLoading()

      if (data.success) {
        await showSuccess("添加成功", "设备已成功添加到授权列表")
        setShowAddDialog(false)
        setNewDevice({ deviceCode: "", deviceName: "", qqNumber: "", email: "", expiresAt: "", isPermanent: true })
        onRefresh()
      } else {
        await showError("添加失败", data.message || "添加设备时发生错误")
      }
    } catch (error) {
      closeLoading()
      console.error("添加设备失败:", error)
      await showError("添加失败", "网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleBlacklistDevice = async () => {
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

  const handleEditDevice = async () => {
    if (!editDialog.device) return

    setLoading(true)
    showLoading("更新设备信息中...")

    try {
      const response = await fetch(`/api/admin/devices/${editDialog.device.device_code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()
      closeLoading()

      if (data.success) {
        await showSuccess("更新成功", "设备信息已更新")
        setEditDialog({ show: false, device: null })
        onRefresh()
      } else {
        await showError("更新失败", data.message || "更新设备信息时发生错误")
      }
    } catch (error) {
      closeLoading()
      console.error("编辑设备失败:", error)
      await showError("更新失败", "网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDevice = async (device: DeviceAuthorization) => {
    const result = await showDeleteConfirm(
      "确认删除设备？",
      `确定要删除设备 "${device.device_code}" 吗？此操作不可撤销。`
    )

    if (result.isConfirmed) {
      showLoading("删除设备中...")

      try {
        const response = await fetch(`/api/admin/devices/${device.device_code}`, {
          method: "DELETE",
        })

        const data = await response.json()
        closeLoading()

        if (data.success) {
          await showSuccess("删除成功", "设备已从授权列表中移除")
          onRefresh()
        } else {
          await showError("删除失败", data.message || "删除设备时发生错误")
        }
      } catch (error) {
        closeLoading()
        console.error("删除设备失败:", error)
        await showError("删除失败", "网络错误，请稍后重试")
      }
    }
  }

  const openEditDialog = (device: DeviceAuthorization) => {
    setEditForm({
      deviceName: device.device_name || "",
      qqNumber: device.qq_number || "",
      email: (device.qq_number ? device.qq_number + "@qq.com" : ""),
      expiresAt: device.expires_at ? new Date(device.expires_at).toISOString().split('T')[0] : "",
      isPermanent: device.is_permanent,
    })
    setEditDialog({ show: true, device })
  }

  const getDeviceStatus = (device: DeviceAuthorization) => {
    if (device.is_blacklisted) {
      return { status: "blacklisted", label: "已拉黑", color: "bg-red-100 text-red-800" }
    }

    if (device.is_permanent) {
      return { status: "permanent", label: "永久授权", color: "bg-green-100 text-green-800" }
    }

    if (device.expires_at) {
      const now = new Date()
      const expiresAt = new Date(device.expires_at)
      if (now > expiresAt) {
        return { status: "expired", label: "已过期", color: "bg-orange-100 text-orange-800" }
      }
      return { status: "temporary", label: "临时授权", color: "bg-blue-100 text-blue-800" }
    }

    return { status: "unknown", label: "未知", color: "bg-gray-100 text-gray-800" }
  }

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              设备管理
            </h2>
            <p className="text-gray-600 mt-1">管理设备授权和权限</p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              添加设备
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加新设备</DialogTitle>
              <DialogDescription>添加设备到授权列表</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceCode">设备码</Label>
                <Input
                  id="deviceCode"
                  value={newDevice.deviceCode}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceCode: e.target.value })}
                  placeholder="请输入设备码"
                  className="border-2 border-pink-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">设备名称</Label>
                <Input
                  id="deviceName"
                  value={newDevice.deviceName}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceName: e.target.value })}
                  placeholder="请输入设备名称"
                  className="border-2 border-pink-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qqNumber">绑定QQ号</Label>
                <Input
                  id="qqNumber"
                  value={newDevice.qqNumber}
                  onChange={(e) => {
                    const qqNumber = e.target.value
                    setNewDevice({ 
                      ...newDevice, 
                      qqNumber,
                      email: qqNumber ? `${qqNumber}@qq.com` : ""
                    })
                  }}
                  placeholder="请输入QQ号"
                  className="border-2 border-pink-200 focus:border-purple-400"
                  pattern="[0-9]{5,11}"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPermanent"
                  checked={newDevice.isPermanent}
                  onCheckedChange={(checked) => setNewDevice({ ...newDevice, isPermanent: checked as boolean })}
                />
                <Label htmlFor="isPermanent">永久授权</Label>
              </div>

              {!newDevice.isPermanent && (
                <div className="space-y-3">
                  <Label htmlFor="expiresAt">到期时间</Label>

                  {/* 快速时间设置 */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
                    <Label className="text-sm font-medium text-green-800">快速设置</Label>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="1"
                          value={quickTime.amount}
                          onChange={(e) => setQuickTime({ ...quickTime, amount: parseInt(e.target.value) || 1 })}
                          className="border-green-300 focus:border-green-500"
                        />
                      </div>
                      <div className="flex-1">
                        <Select value={quickTime.unit} onValueChange={(value: any) => setQuickTime({ ...quickTime, unit: value })}>
                          <SelectTrigger className="border-green-300 focus:border-green-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hours">小时</SelectItem>
                            <SelectItem value="days">天</SelectItem>
                            <SelectItem value="weeks">周</SelectItem>
                            <SelectItem value="months">月</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyQuickTime}
                        className="border-green-300 text-green-600 hover:bg-green-50"
                      >
                        应用
                      </Button>
                    </div>
                  </div>

                  <Input
                    id="expiresAt"
                    type="date"
                    value={newDevice.expiresAt}
                    onChange={(e) => setNewDevice({ ...newDevice, expiresAt: e.target.value })}
                    className="border-2 border-pink-200 focus:border-purple-400"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAddDevice} disabled={loading || !newDevice.deviceCode.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  "确认添加"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 批量操作工具栏 */}
      {devices.length > 0 && (
        <Card className="border-2 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    全选 ({selectedDevices.size}/{devices.length})
                  </Label>
                </div>
                
                {selectedDevices.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDelete}
                      disabled={batchOperating}
                      className="h-8"
                    >
                      {batchOperating ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="w-3 h-3 mr-1" />
                      )}
                      删除 ({selectedDevices.size})
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBatchBlacklist}
                      disabled={batchOperating}
                      className="h-8 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {batchOperating ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Ban className="w-3 h-3 mr-1" />
                      )}
                      拉黑 ({selectedDevices.size})
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                共 {devices.length} 个设备
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 设备列表 */}
      <div className="grid gap-4">
        {devices.length === 0 ? (
          <Card className="border-2 border-pink-100">
            <CardContent className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-500">暂无设备授权记录</p>
            </CardContent>
          </Card>
        ) : (
          devices.map((device) => {
            const status = getDeviceStatus(device)
            return (
              <Card key={device.id} className="border-2 border-pink-100">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedDevices.has(device.device_code)}
                      onCheckedChange={(checked) => handleSelectDevice(device.device_code, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{device.device_code}</h3>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">设备名称：</span>
                              {device.device_name || "未设置"}
                            </div>
                            <div>
                              <span className="font-medium">绑定QQ：</span>
                              {device.qq_number || "未绑定"}
                            </div>
                            <div>
                              <span className="font-medium">授权类型：</span>
                              {device.is_permanent ? "永久授权" : "临时授权"}
                            </div>
                            <div>
                              <span className="font-medium">到期时间：</span>
                              {device.expires_at ? new Date(device.expires_at).toLocaleString() : "永不过期"}
                            </div>
                            <div>
                              <span className="font-medium">验证次数：</span>
                              {device.verify_count || 0}
                            </div>
                            <div>
                              <span className="font-medium">授权者：</span>
                              {device.authorized_by || "未知"}
                            </div>
                          </div>

                          {device.is_blacklisted && device.blacklist_reason && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">
                                <span className="font-medium">拉黑原因：</span>
                                {device.blacklist_reason}
                              </p>
                              {device.blacklisted_by && (
                                <p className="text-xs text-red-600 mt-1">
                                  操作者：{device.blacklisted_by} • {new Date(device.blacklisted_at!).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-300 bg-transparent"
                            onClick={() => openEditDialog(device)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            编辑
                          </Button>

                          {!device.is_blacklisted && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 bg-transparent hover:bg-red-50"
                              onClick={() => setBlacklistDialog({ show: true, device })}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              拉黑
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 bg-transparent hover:bg-red-50"
                            onClick={() => handleDeleteDevice(device)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
