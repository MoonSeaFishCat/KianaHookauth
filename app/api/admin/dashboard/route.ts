import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const stats = await db.getDashboardStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("获取仪表盘数据失败:", error)

    // 返回默认数据
    return NextResponse.json({
      success: true,
      data: {
        totalDevices: 0,
        activeDevices: 0,
        blacklistedDevices: 0,
        todayVerifications: 0,
        successRate: 0,
        deviceStats: {
          permanent: 0,
          temporary: 0,
          expired: 0,
        },
        recentVerifications: [],
      },
    })
  }
}
