import { type NextRequest, NextResponse } from "next/server"
import { generateAndStoreAdminCode } from "@/lib/simple-auth"
import { getClientIP } from "@/lib/ip-utils"

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  try {
    // 生成验证码
    const code = generateAndStoreAdminCode()
    
    console.log(`管理员验证码请求 - IP: ${clientIP}, 验证码: ${code}`)
    
    return NextResponse.json({
      success: true,
      message: "验证码已生成",
      data: {
        code, // 在生产环境中，这应该通过其他安全渠道发送（如邮件、短信等）
        expiresIn: 5 * 60 * 1000, // 5分钟（毫秒）
      },
    })
    
  } catch (error) {
    console.error("生成管理员验证码错误:", error)
    return NextResponse.json(
      {
        success: false,
        message: "生成验证码失败",
      },
      { status: 500 }
    )
  }
}
