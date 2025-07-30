"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RotateCcw, ArrowRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from "@/lib/sweetalert"

interface DeviceRebindHistory {
  id: number
  old_device_code: string
  new_device_code: string
  reason?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export function RebindHistory() {
  const [history, setHistory] = useState<DeviceRebindHistory[]>([])
  const [loading, setLoading] = useState(true)

  // 批量删除相关状态
  const [selectedHistory, setSelectedHistory] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  useEffect(() => {
    fetchRebindHistory()
  }, [])

  const fetchRebindHistory = async () => {
    try {
      const response = await fetch("/api/admin/rebind-history")
      const data = await response.json()
      
      if (data.success) {
        setHistory(data.data)
      }
    } catch (error) {
      console.error("获取换绑历史失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 批量删除处理函数
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedHistory(new Set(history.map(item => item.id)))
    } else {
      setSelectedHistory(new Set())
    }
  }

  const handleSelectHistory = (historyId: number, checked: boolean) => {
    const newSelected = new Set(selectedHistory)
    if (checked) {
      newSelected.add(historyId)
    } else {
      newSelected.delete(historyId)
    }
    setSelectedHistory(newSelected)
    setSelectAll(newSelected.size === history.length)
  }

  // 批量删除换绑历史
  const handleBatchDelete = async () => {
    if (selectedHistory.size === 0) return

    const result = await showDeleteConfirm(
      `确定要删除选中的 ${selectedHistory.size} 条换绑历史吗？`,
      "此操作不可撤销"
    )

    if (result.isConfirmed) {
      setBatchDeleting(true)
      showLoading("正在批量删除换绑历史...")

      try {
        const response = await fetch('/api/admin/rebind-history/batch-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ historyIds: Array.from(selectedHistory) })
        })

        const data = await response.json()
        closeLoading()

        if (data.success) {
          showSuccess("批量删除成功")
          setSelectedHistory(new Set())
          setSelectAll(false)
          fetchRebindHistory()
        } else {
          showError("批量删除失败", data.message)
        }
      } catch (error) {
        closeLoading()
        showError("批量删除失败", "网络错误，请稍后重试")
      } finally {
        setBatchDeleting(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            设备换绑历史
          </h2>
          <p className="text-gray-600 mt-1">查看所有设备码换绑操作记录</p>
        </div>
      </div>

      {/* 批量操作工具栏 */}
      {history.length > 0 && (
        <Card className="border-2 border-red-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    id="select-all-history"
                  />
                  <Label htmlFor="select-all-history" className="text-sm font-medium">
                    全选 ({selectedHistory.size}/{history.length})
                  </Label>
                </div>

                {selectedHistory.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={batchDeleting}
                    className="h-8"
                  >
                    {batchDeleting ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="w-3 h-3 mr-1" />
                    )}
                    删除 ({selectedHistory.size})
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-500">
                共 {history.length} 条记录
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle>换绑记录</CardTitle>
          <CardDescription>查看所有设备码换绑操作的历史记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-500">暂无换绑记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Checkbox
                      checked={selectedHistory.has(record.id)}
                      onCheckedChange={(checked) => handleSelectHistory(record.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-sm">
                            {record.old_device_code}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <Badge className="bg-green-100 text-green-800 font-mono text-sm">
                            {record.new_device_code}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(record.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-7">
                    {record.reason && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">换绑原因: </span>
                        <span className="text-sm text-gray-800">{record.reason}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      {record.ip_address && <p>IP地址: {record.ip_address}</p>}
                      {record.user_agent && (
                        <p className="truncate">User Agent: {record.user_agent}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
