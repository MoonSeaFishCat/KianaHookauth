import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // 检查cookie中的session标识
    const session = request.cookies.get('admin-session')?.value
    
    if (session === 'authenticated') {
      return NextResponse.json({
        success: true,
        message: "已登录",
        data: {
          role: 'admin',
          loginTime: Date.now(),
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "未登录",
        },
        { status: 401 }
      )
    }
    
  } catch (error) {
    console.error("验证管理员登录状态错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "登录状态无效",
      },
      { status: 401 }
    )
  }
}
