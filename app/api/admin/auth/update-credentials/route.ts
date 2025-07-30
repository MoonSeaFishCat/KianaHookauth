import { type NextRequest, NextResponse } from "next/server"
import { getClientIP } from "@/lib/ip-utils"

// 使用全局变量存储凭据（生产环境应使用数据库）
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
  
  try {
    // 检查登录状态
    const session = request.cookies.get('admin-session')?.value
    if (session !== 'authenticated') {
      return NextResponse.json(
        {
          success: false,
          message: "未登录或登录已过期",
        },
        { status: 401 }
      )
    }

    const { username, currentPassword, newPassword } = await request.json()
    
    // 验证输入
    if (!username || !currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "用户名和当前密码不能为空",
        },
        { status: 400 }
      )
    }
    
    // 验证当前密码
    const credentials = getAdminCredentials()
    if (currentPassword !== credentials.password) {
      console.log(`管理员凭据更新失败 - IP: ${clientIP}, 原因: 当前密码错误`)
      return NextResponse.json(
        {
          success: false,
          message: "当前密码错误",
        },
        { status: 401 }
      )
    }
    
    // 更新凭据
    credentials.username = username
    if (newPassword) {
      credentials.password = newPassword
    }
    
    console.log(`管理员凭据已更新 - IP: ${clientIP}, 新用户名: ${username}`)
    
    return NextResponse.json({
      success: true,
      message: "管理员凭据更新成功",
    })
    
  } catch (error) {
    console.error("更新管理员凭据错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    )
  }
}

// 获取当前管理员用户名（用于初始化表单）
export async function GET(request: NextRequest) {
  try {
    // 检查登录状态
    const session = request.cookies.get('admin-session')?.value
    if (session !== 'authenticated') {
      return NextResponse.json(
        {
          success: false,
          message: "未登录或登录已过期",
        },
        { status: 401 }
      )
    }

    const credentials = getAdminCredentials()
    return NextResponse.json({
      success: true,
      data: {
        username: credentials.username,
      },
    })
    
  } catch (error) {
    console.error("获取管理员信息错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    )
  }
}
