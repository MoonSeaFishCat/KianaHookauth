import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyDeviceSignatureAsync, generateDeviceSignatureAsync } from "@/lib/crypto"
import { getClientIP } from "@/lib/ip-utils"

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get("user-agent") || "unknown"

  try {
    const { deviceCode, signature } = await request.json()

    if (!deviceCode || !signature) {
      await db.createVerificationLog({
        device_code: deviceCode || "empty",
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备码和签名不能为空",
      })

      return NextResponse.json(
        {
          success: false,
          message: "设备码和签名不能为空",
        },
        { status: 400 },
      )
    }

    // 获取系统设置
    const settings = await db.getSettings()

    // 如果是免授权模式
    if (settings?.free_auth_mode) {
      // 检查设备码是否已存在
      let existingDevice = await db.getDevice(deviceCode)

      if (!existingDevice) {
        // 添加永久授权
        const signature = generateDeviceSignature(deviceCode, settings?.secret_key)
        await db.createDevice({
          device_code: deviceCode,
          device_name: null,
          qq_number: null,
          is_permanent: true,
          is_blacklisted: false,
          signature,
          authorized_by: "system_auto",
          verify_count: 0,
          expires_at: null,
        })
        existingDevice = await db.getDevice(deviceCode)
      }

      // 检查是否被拉黑
      if (existingDevice?.is_blacklisted) {
        await db.createVerificationLog({
          device_code: deviceCode,
          ip_address: clientIP,
          user_agent: userAgent,
          success: false,
          error_message: "设备已被拉黑",
        })

        return NextResponse.json(
          {
            success: false,
            message: `设备已被拉黑：${existingDevice.blacklist_reason || "未提供原因"}`,
          },
          { status: 403 },
        )
      }

      // 更新验证统计
      await db.updateVerificationStats(deviceCode)

      await db.createVerificationLog({
        device_code: deviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: true,
      })

      return NextResponse.json({
        success: true,
        message: "授权成功",
        data: {
          deviceCode,
          isPermanent: true,
          authorizedBy: "system_auto",
        },
      })
    }

    // 需要授权模式 - 检查设备码是否已授权
    const authorization = await db.getDevice(deviceCode)

    if (!authorization) {
      await db.createVerificationLog({
        device_code: deviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备未授权",
      })

      return NextResponse.json(
        {
          success: false,
          message: "当前为非免授权模式，请联系管理员进行设备授权",
          requireAuth: true,
        },
        { status: 403 },
      )
    }

    // 检查是否被拉黑
    if (authorization.is_blacklisted) {
      await db.createVerificationLog({
        device_code: deviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备已被拉黑",
      })

      return NextResponse.json(
        {
          success: false,
          message: `设备已被拉黑：${authorization.blacklist_reason || "未提供原因"}`,
        },
        { status: 403 },
      )
    }

    // 获取系统密钥
    const secretKey = settings?.secret_key

    // 验证签名（允许10秒时间误差）
    const isValidSignature = await verifyDeviceSignatureAsync(
      authorization.device_code,
      signature,
      secretKey
    )

    if (!isValidSignature) {
      await db.createVerificationLog({
        device_code: deviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "签名验证失败",
      })

      return NextResponse.json(
        {
          success: false,
          message: "设备码签名验证失败，可能存在安全风险",
        },
        { status: 403 },
      )
    }

    // 检查是否过期
    if (!authorization.is_permanent && authorization.expires_at) {
      const now = new Date()
      const expiresAt = new Date(authorization.expires_at)

      if (now > expiresAt) {
        await db.createVerificationLog({
          device_code: deviceCode,
          ip_address: clientIP,
          user_agent: userAgent,
          success: false,
          error_message: "授权已过期",
        })

        return NextResponse.json(
          {
            success: false,
            message: "设备授权已过期，请联系管理员续期",
          },
          { status: 403 },
        )
      }
    }

    // 更新验证统计
    await db.updateVerificationStats(deviceCode)

    await db.createVerificationLog({
      device_code: deviceCode,
      ip_address: clientIP,
      user_agent: userAgent,
      success: true,
    })

    return NextResponse.json({
      success: true,
      message: "授权验证成功",
      data: {
        deviceCode: authorization.device_code,
        deviceName: authorization.device_name,
        isPermanent: authorization.is_permanent,
        expiresAt: authorization.expires_at ? new Date(authorization.expires_at).getTime() : null,
        authorizedBy: authorization.authorized_by,
      },
    })
  } catch (error) {
    console.error("验证授权时发生错误:", error)

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
