import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyDeviceSignature } from "@/lib/crypto"
import { generateEmailCode, storeEmailCode } from "@/lib/email-codes"
import { getClientIP } from "@/lib/ip-utils"

// 发送邮件验证码
async function sendEmail(email: string, code: string, oldDeviceCode: string, newDeviceCode: string, clientIP: string, settings: any): Promise<boolean> {
  try {

    if (settings && settings.smtp_host && settings.smtp_user && settings.smtp_password) {
      const nodemailer = require('nodemailer')

      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port || 587,
        secure: (settings.smtp_port || 587) === 465,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
      })

      const mailOptions = {
        from: `${settings.smtp_from_name || "设备码换绑系统"} <${settings.smtp_from_email || settings.smtp_user}>`,
        to: email,
        subject: "设备码换绑验证码",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔐 设备码换绑验证</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${settings.system_name || "设备码换绑系统"}</p>
            </div>

            <div style="background: #f8fafc; padding: 25px; border-radius: 10px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">您的验证码</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #64748b; line-height: 1.6; margin: 0;">
                请在10分钟内使用此验证码完成设备码换绑操作。如果不是您本人操作，请忽略此邮件。
              </p>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">📋 换绑信息</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                <li>旧设备码: ${oldDeviceCode}</li>
                <li>新设备码: ${newDeviceCode}</li>
                <li>操作时间: ${new Date().toLocaleString("zh-CN")}</li>
                <li>IP地址: ${clientIP}</li>
              </ul>
            </div>

            <div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 14px;">
              <p>验证码有效期为10分钟，请勿泄露给他人。</p>
              <p>© ${new Date().getFullYear()} ${settings.system_name || "设备码换绑系统"}</p>
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log(`验证码邮件已发送到: ${email}`)
      return true
    } else {
      console.log(`模拟发送邮件到 ${email}，验证码: ${code}`)
      return true
    }
  } catch (error) {
    console.error("邮件发送失败:", error)
    return false
  }
}

// 根据QQ号获取邮箱
function getEmailByQQ(qqNumber: string): string {
  // 固定为QQ邮箱格式
  return `${qqNumber}@qq.com`
}

// 脱敏邮箱地址
function maskEmail(email: string): string {
  const [username, domain] = email.split('@')
  if (username.length <= 3) {
    return `${username[0]}***@${domain}`
  }
  return `${username.slice(0, 2)}***${username.slice(-1)}@${domain}`
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get("user-agent") || "unknown"

  try {
    const { oldDeviceCode, newDeviceCode, signature } = await request.json()

    // 获取系统设置（包含密钥）
    const settings = await db.getSettings()

    if (!oldDeviceCode || !newDeviceCode) {
      return NextResponse.json(
        {
          success: false,
          message: "设备码不能为空",
        },
        { status: 400 },
      )
    }

    // 验证旧设备码是否存在且有效
    const oldDevice = await db.getDevice(oldDeviceCode)
    if (!oldDevice) {
      await db.createVerificationLog({
        device_code: oldDeviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "旧设备码不存在",
      })

      return NextResponse.json(
        {
          success: false,
          message: "旧设备码不存在或无效",
        },
        { status: 404 },
      )
    }

    // 检查设备是否被拉黑
    if (oldDevice.is_blacklisted) {
      await db.createVerificationLog({
        device_code: oldDeviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备已被拉黑，无法换绑",
      })

      return NextResponse.json(
        {
          success: false,
          message: `设备已被拉黑，无法换绑：${oldDevice.blacklist_reason || "未提供原因"}`,
        },
        { status: 403 },
      )
    }

    // 获取系统密钥
    const secretKey = settings?.secret_key

    // 验证设备码签名（允许10秒时间误差）
    const isValidSignature = verifyDeviceSignature(
      oldDeviceCode,
      signature,
      secretKey
    )

    if (!isValidSignature) {
      await db.createVerificationLog({
        device_code: oldDeviceCode,
        ip_address: clientIP,
        user_agent: userAgent,
        success: false,
        error_message: "设备码签名验证失败",
      })

      return NextResponse.json(
        {
          success: false,
          message: "设备码签名验证失败",
        },
        { status: 403 },
      )
    }

    // 检查设备是否过期
    if (!oldDevice.is_permanent && oldDevice.expires_at) {
      const expiresAt = new Date(oldDevice.expires_at)
      if (expiresAt <= new Date()) {
        await db.createVerificationLog({
          device_code: oldDeviceCode,
          ip_address: clientIP,
          user_agent: userAgent,
          success: false,
          error_message: "设备码已过期，无法换绑",
        })

        return NextResponse.json(
          {
            success: false,
            message: "设备码已过期，无法换绑",
          },
          { status: 403 },
        )
      }
    }

    // 检查新设备码是否已存在
    const existingNewDevice = await db.getDevice(newDeviceCode)
    if (existingNewDevice) {
      return NextResponse.json(
        {
          success: false,
          message: "新设备码已存在，请选择其他设备码",
        },
        { status: 400 },
      )
    }

    // 检查是否有绑定的QQ号
    if (!oldDevice.qq_number) {
      return NextResponse.json(
        {
          success: false,
          message: "该设备未绑定QQ号，无法进行邮箱验证",
        },
        { status: 400 },
      )
    }

    // 获取邮箱地址
    const email = getEmailByQQ(oldDevice.qq_number)
    const maskedEmail = maskEmail(email)

    // 生成验证码
    const code = generateEmailCode()

    // 存储验证码
    storeEmailCode(
      oldDeviceCode,
      newDeviceCode,
      code,
      email,
      maskedEmail,
      oldDevice.device_name,
      oldDevice.qq_number
    )

    // 发送邮件
    const emailSent = await sendEmail(email, code, oldDeviceCode, newDeviceCode, clientIP, settings)
    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          message: "邮件发送失败，请稍后重试",
        },
        { status: 500 },
      )
    }

    // 记录操作日志
    await db.createVerificationLog({
      device_code: oldDeviceCode,
      ip_address: clientIP,
      user_agent: userAgent,
      success: true,
      error_message: `邮箱验证码已发送到 ${maskedEmail}`,
    })

    return NextResponse.json({
      success: true,
      message: `验证码已发送到 ${maskedEmail}`,
      data: {
        deviceName: oldDevice.device_name,
        qqNumber: oldDevice.qq_number,
        maskedEmail,
      },
    })
  } catch (error) {
    console.error("发送邮箱验证码时发生错误:", error)

    await db.createVerificationLog({
      device_code: "unknown",
      ip_address: clientIP,
      user_agent: userAgent,
      success: false,
      error_message: "服务器内部错误",
    })

    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 },
    )
  }
}
