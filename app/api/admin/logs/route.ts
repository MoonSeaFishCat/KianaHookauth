import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const deviceCode = searchParams.get("deviceCode")
    const success = searchParams.get("success")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")



    // 构建查询选项
    const options: any = {
      page,
      limit,
    }

    if (deviceCode) {
      options.deviceCode = deviceCode
    }

    if (success !== null && success !== undefined && success !== "" && success !== "all") {
      options.success = success === "true"
    }

    if (startDate) {
      options.startDate = startDate + " 00:00:00"
    }

    if (endDate) {
      options.endDate = endDate + " 23:59:59"
    }

    // 使用数据库方法获取验证日志
    const { logs, total } = await db.getVerificationLogs(options)

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("获取验证日志失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "获取验证日志失败",
      },
      { status: 500 },
    )
  }
}
