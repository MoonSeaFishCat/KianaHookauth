// 邮箱验证码存储模块
// 在生产环境中应该使用Redis等外部存储

interface EmailCodeInfo {
  code: string
  expires: number
  deviceInfo: {
    oldDeviceCode: string
    newDeviceCode: string
    deviceName?: string
    qqNumber?: string
    email: string
    maskedEmail: string
  }
}

// 使用全局变量确保在不同API调用之间共享
declare global {
  var emailCodesStore: Map<string, EmailCodeInfo> | undefined
}

// 初始化或获取现有的验证码存储
const emailCodes = globalThis.emailCodesStore ?? new Map<string, EmailCodeInfo>()

if (process.env.NODE_ENV !== 'production') {
  globalThis.emailCodesStore = emailCodes
}

// 生成6位数字验证码
export function generateEmailCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 存储验证码
export function storeEmailCode(
  oldDeviceCode: string,
  newDeviceCode: string,
  code: string,
  email: string,
  maskedEmail: string,
  deviceName?: string,
  qqNumber?: string
): void {
  const key = `${oldDeviceCode}-${newDeviceCode}`
  const expires = Date.now() + 10 * 60 * 1000 // 10分钟过期

  emailCodes.set(key, {
    code,
    expires,
    deviceInfo: {
      oldDeviceCode,
      newDeviceCode,
      deviceName,
      qqNumber,
      email,
      maskedEmail,
    }
  })

  console.log(`验证码已存储: ${key} -> ${code} (过期时间: ${new Date(expires).toLocaleString()})`)
}

// 验证验证码
export function verifyEmailCode(
  oldDeviceCode: string,
  newDeviceCode: string,
  inputCode: string
): { success: boolean; message: string; deviceInfo?: any } {
  const key = `${oldDeviceCode}-${newDeviceCode}`
  const storedCodeInfo = emailCodes.get(key)

  console.log(`验证验证码: ${key} -> ${inputCode}`)
  console.log(`存储的验证码信息:`, storedCodeInfo)

  if (!storedCodeInfo) {
    return {
      success: false,
      message: "验证码不存在或已过期，请重新获取"
    }
  }

  if (Date.now() > storedCodeInfo.expires) {
    emailCodes.delete(key)
    return {
      success: false,
      message: "验证码已过期，请重新获取"
    }
  }

  if (storedCodeInfo.code !== inputCode) {
    return {
      success: false,
      message: "验证码错误，请重新输入"
    }
  }

  // 验证成功，删除验证码
  emailCodes.delete(key)
  return {
    success: true,
    message: "验证成功",
    deviceInfo: storedCodeInfo.deviceInfo
  }
}

// 清理过期的验证码
export function cleanupExpiredCodes(): void {
  const now = Date.now()
  let cleanedCount = 0

  for (const [key, codeInfo] of emailCodes.entries()) {
    if (now > codeInfo.expires) {
      emailCodes.delete(key)
      cleanedCount++
    }
  }

  if (cleanedCount > 0) {
    console.log(`清理了 ${cleanedCount} 个过期验证码`)
  }
}

// 获取当前存储的验证码数量（用于调试）
export function getStoredCodesCount(): number {
  return emailCodes.size
}

// 获取所有验证码信息（用于调试，生产环境不应使用）
export function getAllCodes(): Array<{ key: string; code: string; expires: Date; deviceInfo: any }> {
  const result = []
  for (const [key, codeInfo] of emailCodes.entries()) {
    result.push({
      key,
      code: codeInfo.code,
      expires: new Date(codeInfo.expires),
      deviceInfo: codeInfo.deviceInfo
    })
  }
  return result
}

// 定期清理过期验证码
if (typeof window === 'undefined') { // 只在服务器端运行
  setInterval(cleanupExpiredCodes, 5 * 60 * 1000) // 每5分钟清理一次
}
