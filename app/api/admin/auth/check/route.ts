import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // 检查session cookie
    const session = request.cookies.get("admin-session")?.value

    if (session !== "authenticated") {
      return NextResponse.json(
        {
          success: false,
          message: "未认证",
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "认证有效",
      data: {
        authenticated: true,
        checkTime: Date.now(),
      },
    })
  } catch (error) {
    console.error("认证检查错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    )
  }
}
