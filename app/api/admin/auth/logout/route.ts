import { type NextRequest, NextResponse } from "next/server"
import { getClientIP } from "@/lib/ip-utils"

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  try {
    console.log(`管理员登出 - IP: ${clientIP}`)
    
    const response = NextResponse.json({
      success: true,
      message: "已登出",
    })
    
    // 清除cookie
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin',
    })
    
    return response
    
  } catch (error) {
    console.error("管理员登出错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "登出失败",
      },
      { status: 500 }
    )
  }
}
