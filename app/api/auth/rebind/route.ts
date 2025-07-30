import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyDeviceSignature, generateDeviceSignature } from "@/lib/crypto"
import { verifyEmailCode } from "@/lib/email-codes"
import { getClientIP } from "@/lib/ip-utils"

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    // 这里可以添加数据库表初始化逻辑
    // 由于使用MySQL，表结构应该通过SQL脚本预先创建
    console.log("Database initialization skipped - using pre-created tables")
  } catch (error) {
    console.error("Database initialization error:", error)
    // Don't throw, continue with existing tables
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get("user-agent") || "unknown"

  try {
    // Initialize database first
    await initializeDatabase()
    const { oldDeviceCode, newDeviceCode, emailCode, signature } = await request.json()

    if (!oldDeviceCode || !newDeviceCode || !emailCode) {
      await db.createVerificationLog({
        device_code: oldDeviceCode || "empty",
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备码和邮箱验证码不能为空",
      })

      return NextResponse.json(
        {
          success: false,
          message: "设备码和邮箱验证码不能为空",
        },
        { status: 400 },
      )
    }

    // 验证邮箱验证码
    const verificationResult = verifyEmailCode(oldDeviceCode, newDeviceCode, emailCode)

    if (!verificationResult.success) {
      await db.createVerificationLog({
        device_code: oldDeviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: verificationResult.message,
      })

      return NextResponse.json(
        {
          success: false,
          message: verificationResult.message,
        },
        { status: 400 },
      )
    }

    // 验证旧设备码是否存在且有效
    const oldDevice = await db.getDevice(oldDeviceCode)
    if (!oldDevice) {
      await db.createVerificationLog({
        device_code: oldDeviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "旧设备码不存在",
      })

      return NextResponse.json(
        {
          success: false,
          message: "旧设备码不存在或无效",
        },
        { status: 404 },
      )
    }

    // 检查设备是否被拉黑
    if (oldDevice.is_blacklisted) {
      await db.createVerificationLog({
        device_code: oldDeviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备已被拉黑，无法换绑",
      })

      return NextResponse.json(
        {
          success: false,
          message: `设备已被拉黑，无法换绑：${oldDevice.blacklist_reason || "未提供原因"}`,
        },
        { status: 403 },
      )
    }

    // 获取系统密钥
    const settings = await db.getSettings()
    const secretKey = settings?.secret_key

    // 验证设备码签名（允许10秒时间误差）
    const isValidSignature = verifyDeviceSignature(
      oldDeviceCode,
      signature,
      secretKey
    )

    if (!isValidSignature) {
      await db.createVerificationLog({
        device_code: oldDeviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备码签名验证失败",
      })

      return NextResponse.json(
        {
          success: false,
          message: "设备码签名验证失败",
        },
        { status: 403 },
      )
    }

    // 检查设备是否过期
    if (!oldDevice.is_permanent && oldDevice.expires_at) {
      const expiresAt = new Date(oldDevice.expires_at)
      if (expiresAt <= new Date()) {
        await db.createVerificationLog({
          device_code: oldDeviceCode,
          ip_address: clientIP,
          user_agent: userAgent,
          success: false,
          error_message: "设备码已过期，无法换绑",
        })

        return NextResponse.json(
          {
            success: false,
            message: "设备码已过期，无法换绑",
          },
          { status: 403 },
        )
      }
    }

    // 检查新设备码是否已存在
    const existingNewDevice = await db.getDevice(newDeviceCode)
    if (existingNewDevice) {
      return NextResponse.json(
        {
          success: false,
          message: "新设备码已存在，请选择其他设备码",
        },
        { status: 400 },
      )
    }

    // 生成新设备码的签名
    const newSignature = generateDeviceSignature(newDeviceCode, secretKey)

    // 创建设备换绑历史记录
    await db.createDeviceRebindHistory({
      old_device_code: oldDeviceCode,
      new_device_code: newDeviceCode,
      reason: "邮箱验证换绑",
      ip_address: clientIP,
      user_agent: userAgent,
    })

    // 创建新设备记录
    await db.createDevice({
      device_code: newDeviceCode,
      device_name: oldDevice.device_name,
      qq_number: oldDevice.qq_number,
      authorized_by: oldDevice.authorized_by,
      expires_at: oldDevice.expires_at,
      is_permanent: oldDevice.is_permanent,
      is_blacklisted: false,
      signature: newSignature,
      verify_count: 0,
    })

    // 删除旧设备记录
    await db.deleteDevice(oldDeviceCode)

    // 记录成功的验证日志
    await db.createVerificationLog({
      device_code: oldDeviceCode,
      ip_address: clientIP,
      user_agent: userAgent,
      success: true,
      error_message: `设备码换绑成功，新设备码：${newDeviceCode}`,
    })

    return NextResponse.json({
      success: true,
      message: "设备码换绑成功",
      data: {
        oldDeviceCode,
        newDeviceCode,
        deviceName: oldDevice.device_name,
        qqNumber: oldDevice.qq_number,
        isPermanent: oldDevice.is_permanent,
        expiresAt: oldDevice.expires_at,
        authorizedBy: oldDevice.authorized_by,
      },
    })
  } catch (error) {
    console.error("设备码换绑时发生错误:", error)

    await db.createVerificationLog({
      device_code: "unknown",
      ip_address: clientIP,
      user_agent: userAgent,
      success: false,
      error_message: "服务器内部错误",
    })

    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 },
    )
  }
}
