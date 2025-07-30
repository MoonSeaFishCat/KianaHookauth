import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "用户名和密码不能为空",
        },
        { status: 400 }
      )
    }

    // 获取管理员信息
    const admin = await db.getAdmin(username)
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "用户名或密码错误",
        },
        { status: 401 }
      )
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "用户名或密码错误",
        },
        { status: 401 }
      )
    }

    // 生成JWT token
    const token = await new SignJWT({ 
      username: admin.username,
      id: admin.id,
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(JWT_SECRET)

    // 记录登录日志
    const clientIP = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    "unknown"
    
    await db.createOperationLog({
      admin_username: admin.username,
      operation_type: "LOGIN",
      details: { ip_address: clientIP },
      ip_address: clientIP,
    })

    // 设置HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "登录成功",
      data: {
        username: admin.username,
        token,
      },
    })

    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24小时
      path: "/",
    })

    return response
  } catch (error) {
    console.error("管理员登录失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "登录失败，请稍后重试",
      },
      { status: 500 }
    )
  }
}
