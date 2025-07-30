import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

export async function GET(request: NextRequest) {
  try {
    // 获取token
    const token = request.cookies.get("admin-token")?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "未登录",
        },
        { status: 401 }
      )
    }

    // 验证token
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return NextResponse.json({
      success: true,
      data: {
        username: payload.username,
        id: payload.id,
        iat: payload.iat,
      },
    })
  } catch (error) {
    console.error("Token验证失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "登录已过期，请重新登录",
      },
      { status: 401 }
    )
  }
}
