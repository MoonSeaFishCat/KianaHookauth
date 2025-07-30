"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, RefreshCw, CheckCircle, XCircle, Activity, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from "@/lib/sweetalert"

interface VerificationLog {
  id: number
  device_code: string
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
  created_at: string
}

interface LogsResponse {
  logs: VerificationLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function VerificationLogs() {
  const [logs, setLogs] = useState<VerificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  const [filters, setFilters] = useState({
    deviceCode: "",
    success: "all",
    startDate: "",
    endDate: "",
  })

  // 批量删除相关状态
  const [selectedLogs, setSelectedLogs] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [pagination.page])

  const fetchLogs = async (resetPage = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: resetPage ? "1" : pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.deviceCode && { deviceCode: filters.deviceCode }),
        ...(filters.success && filters.success !== "all" && { success: filters.success }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      })

      const response = await fetch(`/api/admin/logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.data.logs)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error("获取验证日志失败:", error)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  const handleSearch = () => {
    setSearching(true)
    fetchLogs(true)
  }

  const handleReset = () => {
    setFilters({
      deviceCode: "",
      success: "all",
      startDate: "",
      endDate: "",
    })
    setTimeout(() => fetchLogs(true), 100)
  }

  // 批量删除处理函数
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedLogs(new Set(logs.map(log => log.id)))
    } else {
      setSelectedLogs(new Set())
    }
  }

  const handleSelectLog = (logId: number, checked: boolean) => {
    const newSelected = new Set(selectedLogs)
    if (checked) {
      newSelected.add(logId)
    } else {
      newSelected.delete(logId)
    }
    setSelectedLogs(newSelected)
    setSelectAll(newSelected.size === logs.length)
  }

  // 批量删除验证日志
  const handleBatchDelete = async () => {
    if (selectedLogs.size === 0) return

    const result = await showDeleteConfirm(
      `确定要删除选中的 ${selectedLogs.size} 条验证日志吗？`,
      "此操作不可撤销"
    )

    if (result.isConfirmed) {
      setBatchDeleting(true)
      showLoading("正在批量删除验证日志...")

      try {
        const response = await fetch('/api/admin/logs/batch-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logIds: Array.from(selectedLogs) })
        })

        const data = await response.json()
        closeLoading()

        if (data.success) {
          showSuccess("批量删除成功")
          setSelectedLogs(new Set())
          setSelectAll(false)
          fetchLogs(true)
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

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        成功
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        失败
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            验证日志
          </h2>
          <p className="text-gray-600 mt-1">查看所有设备验证记录和统计</p>
        </div>
      </div>

      {/* 搜索过滤器 */}
      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle>搜索过滤</CardTitle>
          <CardDescription>根据条件筛选验证日志</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>设备码</Label>
              <Input
                placeholder="输入设备码..."
                value={filters.deviceCode}
                onChange={(e) => setFilters({ ...filters, deviceCode: e.target.value })}
                className="border-2 border-pink-200 focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label>验证结果</Label>
              <Select value={filters.success} onValueChange={(value) => setFilters({ ...filters, success: value })}>
                <SelectTrigger className="border-2 border-pink-200 focus:border-purple-400">
                  <SelectValue placeholder="选择结果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">成功</SelectItem>
                  <SelectItem value="false">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="border-2 border-pink-200 focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="border-2 border-pink-200 focus:border-purple-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={searching} className="bg-purple-500 hover:bg-purple-600">
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              搜索
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作工具栏 */}
      {logs.length > 0 && (
        <Card className="border-2 border-red-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    id="select-all-logs"
                  />
                  <Label htmlFor="select-all-logs" className="text-sm font-medium">
                    全选 ({selectedLogs.size}/{logs.length})
                  </Label>
                </div>

                {selectedLogs.size > 0 && (
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
                    删除 ({selectedLogs.size})
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-500">
                共 {logs.length} 条记录
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日志列表 */}
      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle>验证记录</CardTitle>
          <CardDescription>
            共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-500">暂无验证日志</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      checked={selectedLogs.has(log.id)}
                      onCheckedChange={(checked) => handleSelectLog(log.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-mono">
                            {log.device_code}
                          </Badge>
                          {getStatusBadge(log.success)}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-7">
                    {log.error_message && (
                      <p className="text-sm text-red-600 mb-2">{log.error_message}</p>
                    )}
                    <div className="text-xs text-gray-500 space-y-1">
                      {log.ip_address && <p>IP: {log.ip_address}</p>}
                      {log.user_agent && <p className="truncate">User Agent: {log.user_agent}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600">
                第 {pagination.page} / {pagination.totalPages} 页
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
