import { type NextRequest } from "next/server"

/**
 * 获取客户端真实IP地址
 * 优先级：x-forwarded-for > x-real-ip > x-client-ip > cf-connecting-ip > 连接IP
 */
export function getClientIP(request: NextRequest): string {
  // 尝试从各种头部获取真实IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const clientIP = request.headers.get("x-client-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")
  
  // x-forwarded-for 可能包含多个IP，取第一个
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map(ip => ip.trim())
    const firstIP = ips[0]
    if (firstIP && isValidIP(firstIP)) {
      return firstIP
    }
  }
  
  // 检查其他头部
  if (realIP && isValidIP(realIP)) {
    return realIP
  }
  
  if (clientIP && isValidIP(clientIP)) {
    return clientIP
  }
  
  if (cfConnectingIP && isValidIP(cfConnectingIP)) {
    return cfConnectingIP
  }
  
  // 从连接信息获取IP（Next.js 13+）
  const ip = request.ip
  if (ip && isValidIP(ip)) {
    return ip
  }
  
  // 如果是本地开发环境的IPv6回环地址，返回本地IP
  const url = new URL(request.url)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return "127.0.0.1"
  }
  
  // 默认返回未知
  return "unknown"
}

/**
 * 验证IP地址格式是否有效
 */
function isValidIP(ip: string): boolean {
  if (!ip || ip === "unknown") {
    return false
  }
  
  // 过滤掉本地回环地址
  if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
    return false
  }
  
  // 简单的IP格式验证
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (ipv4Regex.test(ip)) {
    // 验证IPv4范围
    const parts = ip.split(".").map(Number)
    return parts.every(part => part >= 0 && part <= 255)
  }
  
  if (ipv6Regex.test(ip)) {
    return true
  }
  
  // 简化的IPv6格式（包含::）
  if (ip.includes("::") && ip.length > 2) {
    return true
  }
  
  return false
}

/**
 * 格式化IP地址显示
 */
export function formatIPForDisplay(ip: string): string {
  if (!ip || ip === "unknown") {
    return "未知"
  }
  
  if (ip === "::1") {
    return "本地(IPv6)"
  }
  
  if (ip === "127.0.0.1") {
    return "本地(IPv4)"
  }
  
  return ip
}

/**
 * 获取IP地址的地理位置信息（可选功能）
 */
export async function getIPLocation(ip: string): Promise<{
  country?: string
  region?: string
  city?: string
  isp?: string
} | null> {
  // 如果是本地IP，直接返回
  if (!isValidIP(ip) || ip === "127.0.0.1" || ip === "::1") {
    return {
      country: "本地",
      region: "本地",
      city: "本地",
      isp: "本地网络"
    }
  }
  
  try {
    // 这里可以集成第三方IP地理位置服务
    // 例如：ipapi.co, ip-api.com, geoip2 等
    // 为了演示，这里返回null
    return null
  } catch (error) {
    console.error("获取IP地理位置失败:", error)
    return null
  }
}
