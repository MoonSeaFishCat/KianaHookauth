import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // 获取系统设置
    const settings = await db.getSettings()
    
    return NextResponse.json({
      success: true,
      data: {
        systemName: settings?.system_name || "设备授权系统",
        freeAuthMode: settings?.free_auth_mode || false,
      },
    })
  } catch (error) {
    console.error("获取系统信息失败:", error)
    
    return NextResponse.json(
      {
        success: false,
        message: "获取系统信息失败",
        data: {
          systemName: "设备授权系统",
          freeAuthMode: false,
        },
      },
      { status: 500 },
    )
  }
}
