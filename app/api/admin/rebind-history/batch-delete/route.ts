import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function DELETE(request: NextRequest) {
  try {
    const { historyIds } = await request.json()

    if (!historyIds || !Array.isArray(historyIds) || historyIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "请选择要删除的换绑历史记录",
        },
        { status: 400 }
      )
    }

    // 批量删除换绑历史
    await db.batchDeleteRebindHistory(historyIds)

    return NextResponse.json({
      success: true,
      message: `成功删除 ${historyIds.length} 条换绑历史记录`,
    })
  } catch (error) {
    console.error("批量删除换绑历史失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "删除失败，请重试",
      },
      { status: 500 }
    )
  }
}
