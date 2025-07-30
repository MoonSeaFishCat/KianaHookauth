import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminCode } from "@/lib/simple-auth"
import { getClientIP } from "@/lib/ip-utils"

// 导入凭据（这里应该与update-credentials API共享）
// 在实际项目中应该使用数据库或共享存储
declare global {
  var adminCredentials: { username: string; password: string } | undefined
}

const getAdminCredentials = () => {
  if (!globalThis.adminCredentials) {
    globalThis.adminCredentials = { username: "admin", password: "admin123" }
  }
  return globalThis.adminCredentials
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get("user-agent") || "unknown"
  
  try {
    const { username, password, code } = await request.json()

    // 验证输入
    if (!username || !password || !code) {
      return NextResponse.json(
        {
          success: false,
          message: "请填写完整的登录信息",
        },
        { status: 400 }
      )
    }

    if (code.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          message: "请输入4位验证码",
        },
        { status: 400 }
      )
    }

    // 验证用户名和密码
    const credentials = getAdminCredentials()

    if (username !== credentials.username || password !== credentials.password) {
      console.log(`管理员登录失败 - IP: ${clientIP}, 用户名: ${username}, 原因: 用户名或密码错误`)
      return NextResponse.json(
        {
          success: false,
          message: "用户名或密码错误",
        },
        { status: 401 }
      )
    }
    
    // 验证验证码
    const isValid = verifyAdminCode(code)
    
    if (!isValid) {
      console.log(`管理员登录失败 - IP: ${clientIP}, 用户名: ${username}, 原因: 验证码无效`)
      return NextResponse.json(
        {
          success: false,
          message: "验证码无效、已过期或已使用",
        },
        { status: 401 }
      )
    }

    console.log(`管理员登录成功 - IP: ${clientIP}, 用户名: ${username}`)
    
    // 设置简单的session标识
    const response = NextResponse.json({
      success: true,
      message: "登录成功",
      data: {
        loginTime: Date.now(),
        expiresIn: 24 * 60 * 60 * 1000, // 24小时（毫秒）
      },
    })
    
    // 设置简单的cookie标识
    response.cookies.set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时（秒）
      path: '/',
    })
    
    return response
    
  } catch (error) {
    console.error("管理员登录错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    )
  }
}
