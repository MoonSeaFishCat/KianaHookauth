import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function DELETE(request: NextRequest) {
  try {
    const { logIds } = await request.json()

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "请选择要删除的日志记录",
        },
        { status: 400 }
      )
    }

    // 批量删除验证日志
    await db.batchDeleteVerificationLogs(logIds)

    return NextResponse.json({
      success: true,
      message: `成功删除 ${logIds.length} 条验证日志`,
    })
  } catch (error) {
    console.error("批量删除验证日志失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "删除失败，请重试",
      },
      { status: 500 }
    )
  }
}
