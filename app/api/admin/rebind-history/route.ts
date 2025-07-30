import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const history = await db.getDeviceRebindHistory()

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error("获取换绑历史失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "获取换绑历史失败",
      },
      { status: 500 },
    )
  }
}
