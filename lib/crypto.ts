import crypto from "crypto"
import { SignJWT, jwtVerify } from "jose"
import { db } from "./database"

const DEFAULT_SECRET_KEY = process.env.SECRET_KEY || "your-super-secret-key-change-this-in-production"
const JWT_SECRET = new TextEncoder().encode(DEFAULT_SECRET_KEY)

// 获取系统密钥（优先从数据库获取，然后是环境变量，最后是默认值）
async function getSystemSecretKey(): Promise<string> {
  try {
    const settings = await db.getSettings()
    return settings?.secret_key || DEFAULT_SECRET_KEY
  } catch (error) {
    console.warn("Failed to get secret key from database, using default:", error)
    return DEFAULT_SECRET_KEY
  }
}

// 生成设备码签名（基于当前时间戳）
export function generateDeviceSignature(deviceCode: string, secretKey?: string): string {
  const key = secretKey || DEFAULT_SECRET_KEY
  const timestamp = Date.now()
  const data = `${deviceCode}:${timestamp}:${key}`
  return crypto.createHash("sha256").update(data).digest("hex")
}

// 异步生成设备码签名（从数据库获取密钥）
export async function generateDeviceSignatureAsync(deviceCode: string, secretKey?: string): Promise<string> {
  const key = secretKey || await getSystemSecretKey()
  const timestamp = Math.floor(Date.now() / 10000) * 10000 // 使用10秒时间窗口
  const data = `${deviceCode}:${timestamp}:${key}`
  return crypto.createHash("sha256").update(data).digest("hex")
}

// 验证设备码签名（允许10秒时间误差）
export function verifyDeviceSignature(deviceCode: string, clientSignature: string, secretKey?: string): boolean {
  const key = secretKey || DEFAULT_SECRET_KEY
  const currentTime = Date.now()

  // 检查当前10秒时间窗口和前一个10秒时间窗口
  const currentWindow = Math.floor(currentTime / 10000) * 10000
  const previousWindow = currentWindow - 10000

  const timeWindows = [currentWindow, previousWindow]

  for (const timestamp of timeWindows) {
    const testData = `${deviceCode}:${timestamp}:${key}`
    const testSignature = crypto.createHash("sha256").update(testData).digest("hex")

    if (crypto.timingSafeEqual(Buffer.from(clientSignature), Buffer.from(testSignature))) {
      return true
    }
  }

  return false
}

// 异步验证设备码签名（从数据库获取密钥）
export async function verifyDeviceSignatureAsync(deviceCode: string, clientSignature: string, secretKey?: string): Promise<boolean> {
  const key = secretKey || await getSystemSecretKey()
  const currentTime = Date.now()

  // 检查当前10秒时间窗口和前一个10秒时间窗口
  const currentWindow = Math.floor(currentTime / 10000) * 10000
  const previousWindow = currentWindow - 10000

  const timeWindows = [currentWindow, previousWindow]

  for (const timestamp of timeWindows) {
    const testData = `${deviceCode}:${timestamp}:${key}`
    const testSignature = crypto.createHash("sha256").update(testData).digest("hex")

    if (crypto.timingSafeEqual(Buffer.from(clientSignature), Buffer.from(testSignature))) {
      return true
    }
  }

  return false
}

// 生成JWT令牌
export async function generateToken(payload: any): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

// 验证JWT令牌
export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}

// 生成随机设备码
export function generateDeviceCode(): string {
  return crypto.randomBytes(16).toString("hex").toUpperCase()
}
