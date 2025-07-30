"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Key, Loader2, AlertCircle, CheckCircle, RotateCcw } from "lucide-react"
import { DynamicTitle } from "@/components/dynamic-title"

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    code: ""
  })
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  // 自动生成验证码
  const generateCode = async () => {
    setGeneratingCode(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/auth/generate-code", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedCode(data.data.code)
      } else {
        setMessage({ type: 'error', text: data.message || "生成验证码失败" })
      }
    } catch (error) {
      console.error("生成验证码失败:", error)
      setMessage({ type: 'error', text: "网络错误，请稍后重试" })
    } finally {
      setGeneratingCode(false)
    }
  }

  // 页面加载时自动生成验证码
  useEffect(() => {
    generateCode()
  }, [])

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      setMessage({ type: 'error', text: "请输入用户名" })
      return
    }

    if (!formData.password.trim()) {
      setMessage({ type: 'error', text: "请输入密码" })
      return
    }

    if (!formData.code.trim()) {
      setMessage({ type: 'error', text: "请输入验证码" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: 'include' // 确保包含cookies
      })

      const data = await response.json()
      console.log("登录响应:", data) // 调试信息

      if (data.success) {
        setMessage({ type: 'success', text: "登录成功，正在跳转..." })
        // 等待一小段时间确保cookie设置完成，然后跳转
        setTimeout(() => {
          window.location.href = "/admin"
        }, 500)
      } else {
        setMessage({ type: 'error', text: data.message || "登录失败" })
      }
    } catch (error) {
      console.error("登录失败:", error)
      setMessage({ type: 'error', text: "网络错误，请稍后重试" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <DynamicTitle suffix="管理员登录" />

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/90 border-2 border-blue-200 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-800">管理员登录</CardTitle>
          <CardDescription className="text-gray-600">
            请输入用户名、密码和验证码登录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 消息提示 */}
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}



          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="border-2 border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="border-2 border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">验证码</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="code"
                  type="text"
                  placeholder="请输入4位验证码"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  maxLength={4}
                  className="border-2 border-blue-200 focus:border-blue-400 text-center text-lg font-mono flex-1"
                />
                {generatedCode ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-600">验证码:</span>
                    <span className="text-lg font-mono font-bold text-blue-800">{generatedCode}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateCode}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                      title="刷新验证码"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">生成中...</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.username.trim() || !formData.password.trim() || !formData.code.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </div>
              ) : (
                "登录"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>验证码有效期为10分钟，每个验证码只能使用一次</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
