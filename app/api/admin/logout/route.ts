import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

export async function POST(request: NextRequest) {
  try {
    // 获取token
    const token = request.cookies.get("admin-token")?.value

    if (token) {
      try {
        // 验证token并获取用户信息
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const username = payload.username as string

        // 记录登出日志
        const clientIP = request.headers.get("x-forwarded-for") || 
                        request.headers.get("x-real-ip") || 
                        "unknown"
        
        await db.createOperationLog({
          admin_username: username,
          operation_type: "LOGOUT",
          details: { ip_address: clientIP },
          ip_address: clientIP,
        })
      } catch (error) {
        // token无效，忽略错误
        console.warn("登出时token验证失败:", error)
      }
    }

    // 清除cookie
    const response = NextResponse.json({
      success: true,
      message: "登出成功",
    })

    response.cookies.set("admin-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("管理员登出失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "登出失败",
      },
      { status: 500 }
    )
  }
}
