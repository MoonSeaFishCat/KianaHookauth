import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { deviceCode: string } }) {
  try {
    const deviceCode = params.deviceCode

    // 检查设备是否存在
    const device = await db.getDevice(deviceCode)
    if (!device) {
      return NextResponse.json(
        {
          success: false,
          message: "设备不存在",
        },
        { status: 404 },
      )
    }

    // 检查设备是否已被拉黑
    if (!device.is_blacklisted) {
      return NextResponse.json(
        {
          success: false,
          message: "设备未被拉黑",
        },
        { status: 400 },
      )
    }

    await db.unblacklistDevice(deviceCode)

    // 记录操作日志
    await db.createOperationLog({
      admin_username: "admin", // TODO: 从会话中获取管理员用户名
      operation_type: "UNBLACKLIST_DEVICE",
      target_device_code: deviceCode,
      details: { previous_reason: device.blacklist_reason },
    })

    return NextResponse.json({
      success: true,
      message: "设备已成功解除拉黑",
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
