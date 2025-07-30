"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Shield, CheckCircle, XCircle, Clock } from "lucide-react"
import { useSystemInfo } from "@/hooks/use-system-info"
import { DynamicTitle } from "@/components/dynamic-title"

export default function HomePage() {
  const { systemInfo } = useSystemInfo()
  const [oldDeviceCode, setOldDeviceCode] = useState("")
  const [newDeviceCode, setNewDeviceCode] = useState("")
  const [emailCode, setEmailCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [step, setStep] = useState(1) // 1: 输入设备码, 2: 验证邮箱, 3: 完成
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [countdown, setCountdown] = useState(0)

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!oldDeviceCode.trim() || !newDeviceCode.trim()) {
      setResult({ success: false, message: "请先输入旧设备码和新设备码" })
      return
    }

    setSendingCode(true)
    try {
      const response = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldDeviceCode: oldDeviceCode.trim(),
          newDeviceCode: newDeviceCode.trim()
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDeviceInfo(data.data)
        setStep(2)
        setCountdown(60)
        setResult({ success: true, message: `验证码已发送到 ${data.data.maskedEmail}` })

        // 倒计时
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setResult(data)
      }
    } catch (error) {
      setResult({ success: false, message: "网络错误，请重试" })
    } finally {
      setSendingCode(false)
    }
  }

  // 验证邮箱验证码并完成换绑
  const handleVerifyAndRebind = async () => {
    if (!emailCode.trim()) {
      setResult({ success: false, message: "请输入邮箱验证码" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/rebind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldDeviceCode: oldDeviceCode.trim(),
          newDeviceCode: newDeviceCode.trim(),
          emailCode: emailCode.trim()
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        setStep(3)
        // 清空表单
        setTimeout(() => {
          setOldDeviceCode("")
          setNewDeviceCode("")
          setEmailCode("")
          setStep(1)
          setDeviceInfo(null)
          setResult(null)
        }, 5000)
      }
    } catch (error) {
      setResult({ success: false, message: "网络错误，请重试" })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setOldDeviceCode("")
    setNewDeviceCode("")
    setEmailCode("")
    setDeviceInfo(null)
    setResult(null)
    setCountdown(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <DynamicTitle suffix="设备码换绑" />
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full opacity-10 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {systemInfo.systemName}
            </h1>
            <Shield className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            🔒 安全便捷的设备码换绑服务，通过邮箱验证确保账户安全
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">输入设备码</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">邮箱验证</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">换绑完成</span>
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="max-w-2xl mx-auto">
          <Card className="backdrop-blur-sm bg-white/90 border-2 border-blue-200 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-gray-800 flex items-center justify-center gap-2">
                {step === 1 && <><Shield className="w-6 h-6 text-blue-600" />设备码换绑</>}
                {step === 2 && <><CheckCircle className="w-6 h-6 text-blue-600" />邮箱验证</>}
                {step === 3 && <><CheckCircle className="w-6 h-6 text-green-600" />换绑完成</>}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {step === 1 && "请输入旧设备码和新设备码"}
                {step === 2 && "请输入发送到您邮箱的验证码"}
                {step === 3 && "设备码换绑已完成"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 步骤1: 输入设备码 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldDeviceCode" className="text-gray-700 font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        旧设备码
                      </Label>
                      <Input
                        id="oldDeviceCode"
                        type="text"
                        placeholder="请输入当前设备码"
                        value={oldDeviceCode}
                        onChange={(e) => setOldDeviceCode(e.target.value)}
                        className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                        disabled={sendingCode}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newDeviceCode" className="text-gray-700 font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        新设备码
                      </Label>
                      <Input
                        id="newDeviceCode"
                        type="text"
                        placeholder="请输入新设备码"
                        value={newDeviceCode}
                        onChange={(e) => setNewDeviceCode(e.target.value)}
                        className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                        disabled={sendingCode}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">安全提示</p>
                        <p>系统将向您绑定的QQ邮箱发送验证码，请确保邮箱可正常接收邮件</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 步骤2: 邮箱验证 */}
              {step === 2 && (
                <div className="space-y-6">
                  {deviceInfo && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <p className="font-medium mb-2">设备信息确认</p>
                          <div className="space-y-1">
                            <p>旧设备码: <span className="font-mono">{oldDeviceCode}</span></p>
                            <p>新设备码: <span className="font-mono">{newDeviceCode}</span></p>
                            {deviceInfo.deviceName && <p>设备名称: {deviceInfo.deviceName}</p>}
                            <p>绑定QQ: {deviceInfo.qqNumber}</p>
                            <p>验证邮箱: {deviceInfo.maskedEmail}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="emailCode" className="text-gray-700 font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      邮箱验证码
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="emailCode"
                        type="text"
                        placeholder="请输入6位验证码"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="border-2 border-blue-200 focus:border-blue-400 transition-colors"
                        maxLength={6}
                      />
                      <Button
                        variant="outline"
                        onClick={handleSendEmailCode}
                        disabled={countdown > 0}
                        className="whitespace-nowrap"
                      >
                        {countdown > 0 ? `${countdown}s` : "重新发送"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 步骤3: 完成 */}
              {step === 3 && result?.success && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">换绑成功！</h3>
                    <p className="text-gray-600">您的设备码已成功更换，请妥善保管新设备码</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">旧设备码:</span> <span className="font-mono text-gray-500">{oldDeviceCode}</span></p>
                      <p><span className="font-medium">新设备码:</span> <span className="font-mono text-green-700 font-bold">{newDeviceCode}</span></p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">页面将在5秒后自动重置</p>
                </div>
              )}

              {/* 按钮区域 */}
              <div className="flex gap-3">
                {step === 1 && (
                  <Button
                    onClick={handleSendEmailCode}
                    disabled={sendingCode || !oldDeviceCode.trim() || !newDeviceCode.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                  >
                    {sendingCode ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        发送验证码...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        发送邮箱验证码
                      </div>
                    )}
                  </Button>
                )}

                {step === 2 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="px-6"
                    >
                      重新开始
                    </Button>
                    <Button
                      onClick={handleVerifyAndRebind}
                      disabled={loading || emailCode.length !== 6}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          验证中...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          确认换绑
                        </div>
                      )}
                    </Button>
                  </>
                )}

                {step === 3 && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    重新换绑
                  </Button>
                )}
              </div>

              {/* 结果显示 */}
              {result && step !== 3 && (
                <Card
                  className={`border-2 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                          {result.message}
                        </p>

                        {result.requireAuth && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">💡 提示：请联系系统管理员获取设备授权后再进行换绑</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

        </div>

        {/* 管理员入口 */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            className="text-gray-500 hover:text-blue-600 transition-colors"
            onClick={() => (window.location.href = "/admin")}
          >
            管理员入口 →
          </Button>
        </div>

        {/* 帮助信息 */}
        <div className="max-w-2xl mx-auto mt-8">
          <Card className="bg-white/50 border border-gray-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">使用说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">换绑流程</h4>
                  <ul className="space-y-1">
                    <li>• 输入旧设备码和新设备码</li>
                    <li>• 系统发送验证码到绑定邮箱</li>
                    <li>• 输入验证码完成换绑</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">安全保障</h4>
                  <ul className="space-y-1">
                    <li>• 邮箱验证确保账户安全</li>
                    <li>• 换绑记录完整保存</li>
                    <li>• 支持管理员审核机制</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
