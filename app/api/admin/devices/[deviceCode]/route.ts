import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { deviceCode: string } }) {
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

    // 删除设备
    await db.deleteDevice(deviceCode)

    // 记录操作日志
    await db.createOperationLog({
      admin_username: "admin", // TODO: 从会话中获取管理员用户名
      operation_type: "DELETE_DEVICE",
      target_device_code: deviceCode,
      details: { device_name: device.device_name },
    })

    return NextResponse.json({
      success: true,
      message: "设备已成功删除",
    })
  } catch (error) {
    console.error("删除设备失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "删除设备失败",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { deviceCode: string } }) {
  try {
    const { deviceCode } = await params
    const { deviceName, qqNumber, expiresAt, isPermanent } = await request.json()

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

    // 验证QQ号格式（如果提供）
    if (qqNumber && !/^\d{5,11}$/.test(qqNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "QQ号格式不正确",
        },
        { status: 400 },
      )
    }

    // 更新设备信息
    const updates: any = {}
    if (deviceName !== undefined) updates.device_name = deviceName
    if (qqNumber !== undefined) updates.qq_number = qqNumber
    if (isPermanent !== undefined) {
      updates.is_permanent = isPermanent
      if (isPermanent) {
        updates.expires_at = null
      } else if (expiresAt) {
        // 转换为MySQL DATETIME格式
        const date = new Date(expiresAt)
        updates.expires_at = date.toISOString().slice(0, 19).replace('T', ' ')
      }
    } else if (expiresAt !== undefined) {
      if (expiresAt) {
        const date = new Date(expiresAt)
        updates.expires_at = date.toISOString().slice(0, 19).replace('T', ' ')
      } else {
        updates.expires_at = null
      }
    }

    await db.updateDevice(deviceCode, updates)

    // 记录操作日志
    await db.createOperationLog({
      admin_username: "admin", // TODO: 从会话中获取管理员用户名
      operation_type: "UPDATE_DEVICE",
      target_device_code: deviceCode,
      details: { updates },
    })

    return NextResponse.json({
      success: true,
      message: "设备信息已更新",
    })
  } catch (error) {
    console.error("更新设备失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "更新设备失败",
      },
      { status: 500 },
    )
  }
}
