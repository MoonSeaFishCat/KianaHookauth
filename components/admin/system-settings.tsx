"use client"

import { useState, useEffect } from "react"
import crypto from "crypto"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Settings, Mail, Shield, Eye, EyeOff, Database, CheckCircle, XCircle, RefreshCw, AlertTriangle, Key } from "lucide-react"

interface SystemSettings {
  id: number
  free_auth_mode: boolean
  system_name: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  smtp_from_email?: string
  smtp_from_name?: string
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [savedSecretKey, setSavedSecretKey] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [checkingDb, setCheckingDb] = useState(false)

  const [formData, setFormData] = useState({
    freeAuthMode: false,
    systemName: "",
    secretKey: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "",
  })

  // 管理员账号设置
  const [adminSettings, setAdminSettings] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 签名工具状态
  const [signatureTool, setSignatureTool] = useState({
    deviceCode: "",
    generatedSignature: "",
    generatedAt: 0
  })

  // 签名有效期倒计时
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    fetchSettings()
    checkDatabaseStatus()
    fetchAdminInfo()
  }, [])

  // 签名倒计时
  useEffect(() => {
    if (signatureTool.generatedAt > 0) {
      const interval = setInterval(() => {
        const now = Date.now()
        const currentWindow = Math.floor(now / 10000) * 10000
        const nextWindow = currentWindow + 10000
        const remaining = Math.max(0, nextWindow - now)
        setCountdown(Math.ceil(remaining / 1000))

        if (remaining <= 0) {
          setSignatureTool(prev => ({ ...prev, generatedSignature: "", generatedAt: 0 }))
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [signatureTool.generatedAt])

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch("/api/admin/auth/update-credentials")
      const data = await response.json()

      if (data.success) {
        setAdminSettings(prev => ({
          ...prev,
          username: data.data.username
        }))
      }
    } catch (error) {
      console.error("获取管理员信息失败:", error)
    }
  }

  const checkDatabaseStatus = async () => {
    setCheckingDb(true)
    try {
      const response = await fetch("/api/admin/database-status")
      const data = await response.json()
      if (data.success) {
        setDbStatus(data.data)
      }
    } catch (error) {
      console.error("检查数据库状态失败:", error)
    } finally {
      setCheckingDb(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.data)
        setFormData({
          freeAuthMode: data.data.free_auth_mode,
          systemName: data.data.system_name,
          secretKey: data.data.secret_key || "",
          smtpHost: data.data.smtp_host || "",
          smtpPort: data.data.smtp_port || 587,
          smtpUser: data.data.smtp_user || "",
          smtpPassword: data.data.smtp_password || "",
          smtpFromEmail: data.data.smtp_from_email || "",
          smtpFromName: data.data.smtp_from_name || "",
        })
      }
    } catch (error) {
      console.error("获取系统设置失败:", error)
      setMessage({ type: "error", text: "获取系统设置失败" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeAuthMode: formData.freeAuthMode,
          systemName: formData.systemName,
          secretKey: formData.secretKey,
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpUser: formData.smtpUser,
          smtpPassword: formData.smtpPassword,
          smtpFromEmail: formData.smtpFromEmail,
          smtpFromName: formData.smtpFromName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // 如果密钥被更新，显示密钥信息
        if (formData.secretKey && formData.secretKey !== settings?.secret_key) {
          setSavedSecretKey(formData.secretKey)
          setMessage({
            type: "success",
            text: `系统设置保存成功！新密钥已生成 (长度: ${formData.secretKey.length} 字符)`
          })
          // 5秒后清除保存的密钥显示
          setTimeout(() => setSavedSecretKey(null), 10000)
        } else {
          setMessage({ type: "success", text: "系统设置保存成功" })
        }
        await fetchSettings() // 重新获取设置
      } else {
        setMessage({ type: "error", text: data.message || "保存失败" })
      }
    } catch (error) {
      console.error("保存系统设置失败:", error)
      setMessage({ type: "error", text: "保存失败，请重试" })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAdmin = async () => {
    // 验证输入
    if (!adminSettings.username.trim()) {
      setMessage({ type: "error", text: "请输入用户名" })
      return
    }

    if (!adminSettings.currentPassword.trim()) {
      setMessage({ type: "error", text: "请输入当前密码" })
      return
    }

    if (adminSettings.newPassword && adminSettings.newPassword !== adminSettings.confirmPassword) {
      setMessage({ type: "error", text: "新密码和确认密码不匹配" })
      return
    }

    setSavingAdmin(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/auth/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminSettings.username,
          currentPassword: adminSettings.currentPassword,
          newPassword: adminSettings.newPassword || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "管理员账号设置已更新" })
        setAdminSettings({
          username: adminSettings.username,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        setMessage({ type: "error", text: data.message || "更新失败" })
      }
    } catch (error) {
      console.error("更新管理员设置失败:", error)
      setMessage({ type: "error", text: "更新失败，请重试" })
    } finally {
      setSavingAdmin(false)
    }
  }

  const generateSignature = () => {
    if (!signatureTool.deviceCode.trim()) {
      setMessage({ type: "error", text: "请输入设备码" })
      return
    }

    // 使用当前表单中的密钥，如果没有则使用已保存的设置中的密钥
    const secretKey = formData.secretKey || settings?.secret_key || "your-super-secret-key-change-this-in-production"
    const deviceCode = signatureTool.deviceCode.trim()

    // 计算签名（基于当前时间戳，向前取整到10秒边界）
    const now = Date.now()
    const timestamp = Math.floor(now / 10000) * 10000 // 取整到10秒边界
    const data = `${deviceCode}:${timestamp}:${secretKey}`
    const signature = crypto.createHash('sha256').update(data).digest('hex')

    setSignatureTool(prev => ({
      ...prev,
      generatedSignature: signature,
      generatedAt: now
    }))

    setMessage({ type: "success", text: "签名生成成功" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            系统设置
          </h2>
          <p className="text-gray-600 mt-1">配置系统参数和邮件服务</p>
        </div>
      </div>

      {message && (
        <Alert className={`border-2 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
          <CardTitle className="text-xl text-gray-800">系统配置</CardTitle>
          <CardDescription>管理系统的核心设置和邮件服务配置</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-blue-50">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                基本设置
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                管理员账号
              </TabsTrigger>
              <TabsTrigger value="signature" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                签名工具
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                邮件配置
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                数据库状态
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="systemName" className="text-base font-medium">系统名称</Label>
                  <Input
                    id="systemName"
                    value={formData.systemName}
                    onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                    placeholder="请输入系统名称"
                    className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretKey" className="text-base font-medium">系统密钥</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="secretKey"
                        type={showPassword ? "text" : "password"}
                        value={formData.secretKey}
                        onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                        placeholder="请输入系统密钥"
                        className="border-2 border-orange-200 focus:border-orange-400 transition-colors pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    {/* 密钥信息显示 */}
                    {formData.secretKey && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">当前密钥信息</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(formData.secretKey)
                              setMessage({ type: "success", text: "密钥已复制到剪贴板" })
                            }}
                            className="h-6 px-2 text-blue-600 hover:text-blue-700"
                          >
                            复制
                          </Button>
                        </div>
                        <div className="text-xs text-blue-700 space-y-1">
                          <p>长度: {formData.secretKey.length} 字符</p>
                          <p>类型: {/^[a-f0-9]+$/.test(formData.secretKey) ? 'Hex编码' : '自定义字符串'}</p>
                          <p>强度: {formData.secretKey.length >= 64 ? '强' : formData.secretKey.length >= 32 ? '中等' : '弱'}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newKey = crypto.randomBytes(32).toString('hex')
                          setFormData({ ...formData, secretKey: newKey })
                        }}
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        生成新密钥
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newKey = crypto.randomBytes(64).toString('hex')
                          setFormData({ ...formData, secretKey: newKey })
                        }}
                        className="border-green-300 text-green-600 hover:bg-green-50"
                      >
                        生成强密钥
                      </Button>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                        <div className="text-sm text-orange-800">
                          <p className="font-medium mb-1">重要提醒</p>
                          <p>系统密钥用于生成设备签名，修改后所有现有设备需要重新生成签名。生产环境请使用足够复杂的密钥。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 保存后的密钥显示 */}
                {savedSecretKey && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-800">密钥保存成功！</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-green-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-green-800">生成的系统密钥</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(savedSecretKey)
                              setMessage({ type: "success", text: "密钥已复制到剪贴板" })
                            }}
                            className="h-7 px-3 text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <Key className="w-3 h-3 mr-1" />
                            复制密钥
                          </Button>
                        </div>

                        <div className="p-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm break-all">
                          {savedSecretKey}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-2 bg-white border border-green-300 rounded">
                          <div className="font-medium text-green-800">密钥长度</div>
                          <div className="text-green-600">{savedSecretKey.length} 字符</div>
                        </div>
                        <div className="text-center p-2 bg-white border border-green-300 rounded">
                          <div className="font-medium text-green-800">编码类型</div>
                          <div className="text-green-600">
                            {/^[a-f0-9]+$/.test(savedSecretKey) ? 'Hex编码' : '自定义'}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white border border-green-300 rounded">
                          <div className="font-medium text-green-800">安全强度</div>
                          <div className="text-green-600">
                            {savedSecretKey.length >= 64 ? '强' : savedSecretKey.length >= 32 ? '中等' : '弱'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">重要提醒</p>
                            <p>请妥善保存此密钥！修改密钥后，所有现有设备需要重新生成签名才能正常验证。</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="freeAuthMode" className="text-base font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        免授权模式
                      </Label>
                      <p className="text-sm text-gray-600">
                        开启后，任何设备码都会自动获得永久授权（仅用于测试环境）
                      </p>
                    </div>
                    <Switch
                      id="freeAuthMode"
                      checked={formData.freeAuthMode}
                      onCheckedChange={(checked) => setFormData({ ...formData, freeAuthMode: checked })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="space-y-6">
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">管理员账号设置</p>
                      <p>修改管理员登录用户名和密码</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminUsername" className="text-base font-medium">用户名</Label>
                    <Input
                      id="adminUsername"
                      value={adminSettings.username}
                      onChange={(e) => setAdminSettings({ ...adminSettings, username: e.target.value })}
                      placeholder="请输入新的用户名"
                      className="border-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-base font-medium">当前密码</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={adminSettings.currentPassword}
                        onChange={(e) => setAdminSettings({ ...adminSettings, currentPassword: e.target.value })}
                        placeholder="请输入当前密码"
                        className="border-2 border-orange-200 focus:border-orange-400 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-base font-medium">新密码（可选）</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={adminSettings.newPassword}
                        onChange={(e) => setAdminSettings({ ...adminSettings, newPassword: e.target.value })}
                        placeholder="留空则不修改密码"
                        className="border-2 border-orange-200 focus:border-orange-400 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-base font-medium">确认新密码</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={adminSettings.confirmPassword}
                        onChange={(e) => setAdminSettings({ ...adminSettings, confirmPassword: e.target.value })}
                        placeholder="请再次输入新密码"
                        className="border-2 border-orange-200 focus:border-orange-400 pr-10"
                        disabled={!adminSettings.newPassword}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={!adminSettings.newPassword}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveAdmin}
                    disabled={savingAdmin || !adminSettings.username.trim() || !adminSettings.currentPassword.trim()}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  >
                    {savingAdmin ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        保存中...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        保存管理员设置
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signature" className="space-y-6">
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">设备签名计算工具</p>
                      <p>使用当前系统密钥为设备生成签名，用于API调用验证</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signatureDeviceCode" className="text-base font-medium">设备码</Label>
                    <Input
                      id="signatureDeviceCode"
                      value={signatureTool.deviceCode}
                      onChange={(e) => setSignatureTool({ ...signatureTool, deviceCode: e.target.value })}
                      placeholder="请输入设备码，如：ABC123"
                      className="border-2 border-green-200 focus:border-green-400"
                    />
                  </div>

                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>注意：</strong>签名基于10秒时间窗口生成，在当前10秒窗口内有效。建议生成后立即使用。设备的过期时间在数据库中单独管理。
                    </p>
                  </div>

                  <Button
                    onClick={generateSignature}
                    disabled={!signatureTool.deviceCode.trim()}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    生成设备签名
                  </Button>

                  {signatureTool.generatedSignature && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">生成的签名</Label>
                          {countdown > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <span className={`font-medium ${countdown <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                                {countdown}秒后过期
                              </span>
                              {countdown <= 3 && <span className="text-red-600">⚠️</span>}
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <code className="text-sm font-mono break-all text-gray-800">
                            {signatureTool.generatedSignature}
                          </code>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium">API请求示例</Label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
{JSON.stringify({
  deviceCode: signatureTool.deviceCode,
  signature: signatureTool.generatedSignature
}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">邮件服务配置</p>
                      <p>配置SMTP服务器信息，用于发送设备码换绑验证邮件</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost" className="text-base font-medium">SMTP服务器</Label>
                    <Input
                      id="smtpHost"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      placeholder="smtp.qq.com"
                      className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort" className="text-base font-medium">端口</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                      placeholder="587"
                      className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUser" className="text-base font-medium">用户名</Label>
                  <Input
                    id="smtpUser"
                    value={formData.smtpUser}
                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                    placeholder="your-email@qq.com"
                    className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword" className="text-base font-medium">密码/授权码</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                      placeholder="请输入SMTP密码或授权码"
                      className="border-2 border-blue-200 focus:border-blue-400 transition-colors pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpFromEmail" className="text-base font-medium">发件人邮箱</Label>
                    <Input
                      id="smtpFromEmail"
                      value={formData.smtpFromEmail}
                      onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.target.value })}
                      placeholder="noreply@example.com"
                      className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpFromName" className="text-base font-medium">发件人名称</Label>
                    <Input
                      id="smtpFromName"
                      value={formData.smtpFromName}
                      onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                      placeholder="设备码换绑系统"
                      className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">数据库连接状态</h3>
                      <p className="text-sm text-gray-600">检查MySQL数据库连接和配置信息</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={checkDatabaseStatus}
                    disabled={checkingDb}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingDb ? 'animate-spin' : ''}`} />
                    刷新状态
                  </Button>
                </div>

                {dbStatus && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 连接状态 */}
                    <Card className="border-2 border-blue-100">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {dbStatus.status === 'connected' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          连接状态
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            dbStatus.status === 'connected'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dbStatus.status === 'connected' ? '已连接' : '连接失败'}
                          </div>
                          {dbStatus.connectionTest?.responseTime && (
                            <p className="text-sm text-gray-600">
                              响应时间: {dbStatus.connectionTest.responseTime}ms
                            </p>
                          )}
                          {dbStatus.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-800">{dbStatus.error}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 配置信息 */}
                    <Card className="border-2 border-blue-100">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Database className="w-5 h-5 text-blue-600" />
                          配置信息
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dbStatus.config ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">主机:</span>
                              <span className="font-mono">{dbStatus.config.host}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">端口:</span>
                              <span className="font-mono">{dbStatus.config.port}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">数据库:</span>
                              <span className="font-mono">{dbStatus.config.database}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">用户:</span>
                              <span className="font-mono">{dbStatus.config.user}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">SSL:</span>
                              <span className={dbStatus.config.ssl ? 'text-green-600' : 'text-gray-500'}>
                                {dbStatus.config.ssl ? '启用' : '禁用'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">连接池:</span>
                              <span>{dbStatus.config.connectionLimit} 个连接</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">无配置信息</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!dbStatus && !checkingDb && (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-500">点击刷新状态按钮检查数据库连接</p>
                  </div>
                )}

                {checkingDb && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">正在检查数据库状态...</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <Separator />

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 shadow-lg"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    保存所有设置
                  </div>
                )}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
