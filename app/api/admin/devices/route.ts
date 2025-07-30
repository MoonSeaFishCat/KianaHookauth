import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { generateDeviceSignature, generateDeviceCode } from "@/lib/crypto"

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

export async function GET() {
  try {
    // Initialize database first
    await initializeDatabase()

    const devices = await db.getDevices()

    // 转换expires_at为时间戳
    const devicesWithTimestamp = devices.map(device => ({
      ...device,
      expires_at: device.expires_at ? new Date(device.expires_at).getTime() : null
    }))

    return NextResponse.json({
      success: true,
      data: devicesWithTimestamp,
    })
  } catch (error) {
    console.error("获取设备列表失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "获取设备列表失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database first
    await initializeDatabase()

    const { deviceCode, deviceName, qqNumber, expiresAt, isPermanent } = await request.json()

    // 验证必填字段
    if (!deviceCode || !qqNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "设备码和QQ号不能为空",
        },
        { status: 400 },
      )
    }

    // 验证QQ号格式
    if (!/^\d{5,11}$/.test(qqNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "QQ号格式不正确",
        },
        { status: 400 },
      )
    }

    // 获取系统密钥
    const settings = await db.getSettings()
    const secretKey = settings?.secret_key

    const finalDeviceCode = deviceCode.trim()
    const expiresDate = isPermanent ? null : expiresAt ? new Date(expiresAt) : null
    const signature = generateDeviceSignature(finalDeviceCode, secretKey)

    await db.createDevice({
      device_code: finalDeviceCode,
      device_name: deviceName,
      qq_number: qqNumber,
      expires_at: expiresDate ? expiresDate.toISOString().slice(0, 19).replace('T', ' ') : null,
      is_permanent: isPermanent,
      is_blacklisted: false,
      signature,
      authorized_by: "admin",
      verify_count: 0,
    })

    // Record operation log
    try {
      await db.createOperationLog({
        admin_username: "admin", // TODO: 从会话中获取
        operation_type: "CREATE_DEVICE",
        target_device_code: finalDeviceCode,
        details: { deviceName, qqNumber, isPermanent, expiresAt },
      })
    } catch (logError) {
      console.error("Failed to create operation log:", logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "设备授权添加成功",
      data: { deviceCode: finalDeviceCode },
    })
  } catch (error) {
    console.error("添加设备授权失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "添加设备授权失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
