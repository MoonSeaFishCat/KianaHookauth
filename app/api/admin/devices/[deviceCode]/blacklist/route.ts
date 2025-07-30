import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { deviceCode: string } }) {
  try {
    const { reason } = await request.json()
    const deviceCode = params.deviceCode

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: "拉黑原因不能为空",
        },
        { status: 400 },
      )
    }

    await db.blacklistDevice(deviceCode, reason, "admin") // TODO: 从会话中获取管理员用户名

    // 记录操作日志
    await db.createOperationLog({
      admin_username: "admin",
      operation_type: "BLACKLIST_DEVICE",
      target_device_code: deviceCode,
      details: { reason },
    })

    return NextResponse.json({
      success: true,
      message: "设备已成功拉黑",
    })
  } catch (error) {
    console.error("拉黑设备失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "拉黑设备失败",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceCode: string } }) {
  try {
    const deviceCode = params.deviceCode

    await db.unblacklistDevice(deviceCode)

    // 记录操作日志
    await db.createOperationLog({
      admin_username: "admin",
      operation_type: "UNBLACKLIST_DEVICE",
      target_device_code: deviceCode,
      details: {},
    })

    return NextResponse.json({
      success: true,
      message: "设备已解除拉黑",
    })
  } catch (error) {
    console.error("解除拉黑失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "解除拉黑失败",
      },
      { status: 500 },
    )
  }
}
