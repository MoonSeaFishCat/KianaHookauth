import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getClientIP } from "@/lib/ip-utils"

export async function GET() {
  try {
    const settings = await db.getSettings()

    if (!settings) {
      // 返回默认设置
      return NextResponse.json({
        success: true,
        data: {
          id: 1,
          free_auth_mode: false,
          system_name: "二次元学院授权系统",
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("获取系统设置失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "获取系统设置失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    const {
      freeAuthMode,
      systemName,
      secretKey,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFromEmail,
      smtpFromName
    } = await request.json()

    await db.updateSettings({
      free_auth_mode: freeAuthMode,
      system_name: systemName,
      secret_key: secretKey,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_user: smtpUser,
      smtp_password: smtpPassword,
      smtp_from_email: smtpFromEmail,
      smtp_from_name: smtpFromName,
    })

    // 记录操作日志
    try {
      await db.createOperationLog({
        admin_username: "admin",
        operation_type: "UPDATE_SETTINGS",
        target_device_code: null,
        details: { freeAuthMode, systemName, secretKey: secretKey ? "***" : null },
        ip_address: clientIP,
      })
    } catch (logError) {
      console.error("Failed to create operation log:", logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "系统设置更新成功",
    })
  } catch (error) {
    console.error("更新系统设置失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "更新系统设置失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
