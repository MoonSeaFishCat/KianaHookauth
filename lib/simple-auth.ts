// 简单的管理员验证码认证系统

// 生成4位数字验证码
export function generateAdminCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// 验证码存储
interface AdminCodeInfo {
  code: string
  expires: number
  used: boolean
}

// 使用全局变量存储验证码（生产环境应使用Redis等）
declare global {
  var adminCodesStore: Map<string, AdminCodeInfo> | undefined
}

const adminCodes = globalThis.adminCodesStore ?? new Map<string, AdminCodeInfo>()

if (process.env.NODE_ENV !== 'production') {
  globalThis.adminCodesStore = adminCodes
}

// 生成并存储管理员验证码
export function generateAndStoreAdminCode(): string {
  const code = generateAdminCode()
  const expires = Date.now() + 10 * 60 * 1000 // 10分钟过期
  
  // 清理过期的验证码
  cleanupExpiredAdminCodes()
  
  // 存储新验证码
  adminCodes.set(code, {
    code,
    expires,
    used: false
  })
  
  console.log(`管理员验证码已生成: ${code} (过期时间: ${new Date(expires).toLocaleString()})`)
  
  return code
}

// 验证管理员验证码
export function verifyAdminCode(inputCode: string): boolean {
  const codeInfo = adminCodes.get(inputCode)
  
  if (!codeInfo) {
    console.log(`验证码不存在: ${inputCode}`)
    return false
  }
  
  if (codeInfo.used) {
    console.log(`验证码已使用: ${inputCode}`)
    return false
  }
  
  if (Date.now() > codeInfo.expires) {
    console.log(`验证码已过期: ${inputCode}`)
    adminCodes.delete(inputCode)
    return false
  }
  
  // 标记为已使用
  codeInfo.used = true
  console.log(`验证码验证成功: ${inputCode}`)
  
  // 验证成功后删除验证码
  setTimeout(() => {
    adminCodes.delete(inputCode)
  }, 1000)
  
  return true
}

// 清理过期的验证码
export function cleanupExpiredAdminCodes(): void {
  const now = Date.now()
  let cleanedCount = 0
  
  for (const [code, codeInfo] of adminCodes.entries()) {
    if (now > codeInfo.expires || codeInfo.used) {
      adminCodes.delete(code)
      cleanedCount++
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`清理了 ${cleanedCount} 个过期/已使用的管理员验证码`)
  }
}

// 获取当前有效验证码数量（用于调试）
export function getActiveAdminCodesCount(): number {
  cleanupExpiredAdminCodes()
  return adminCodes.size
}

// 定期清理过期验证码
if (typeof window === 'undefined') { // 只在服务器端运行
  setInterval(cleanupExpiredAdminCodes, 2 * 60 * 1000) // 每2分钟清理一次
}
