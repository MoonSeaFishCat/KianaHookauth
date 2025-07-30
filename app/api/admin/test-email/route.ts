import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "请提供测试邮箱地址",
        },
        { status: 400 },
      )
    }

    // 获取邮件配置
    const settings = await db.getSettings()
    if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      return NextResponse.json(
        {
          success: false,
          message: "邮件服务未配置，请先在系统设置中配置SMTP信息",
        },
        { status: 400 },
      )
    }

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: (settings.smtp_port || 587) === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
      },
    })

    // 验证SMTP连接
    try {
      await transporter.verify()
    } catch (error) {
      console.error("SMTP连接验证失败:", error)
      return NextResponse.json(
        {
          success: false,
          message: "SMTP服务器连接失败，请检查配置信息",
        },
        { status: 500 },
      )
    }

    // 发送测试邮件
    const mailOptions = {
      from: `${settings.smtp_from_name || "设备码换绑系统"} <${settings.smtp_from_email || settings.smtp_user}>`,
      to: testEmail,
      subject: "邮件服务测试 - 设备码换绑系统",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📧 邮件服务测试</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">设备码换绑系统</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; border-left: 4px solid #3b82f6;">
            <h2 style="color: #1e293b; margin-top: 0;">✅ 邮件服务配置成功！</h2>
            <p style="color: #64748b; line-height: 1.6;">
              恭喜！您的SMTP邮件服务已成功配置并可以正常发送邮件。
            </p>
            <p style="color: #64748b; line-height: 1.6;">
              现在用户可以通过邮箱验证码进行设备码换绑操作了。
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">📋 测试信息</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>测试时间: ${new Date().toLocaleString("zh-CN")}</li>
              <li>SMTP服务器: ${settings.smtp_host}:${settings.smtp_port}</li>
              <li>发件人: ${settings.smtp_from_email || settings.smtp_user}</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 14px;">
            <p>这是一封自动发送的测试邮件，请勿回复。</p>
            <p>© ${new Date().getFullYear()} 设备码换绑系统</p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: `测试邮件已成功发送到 ${testEmail}`,
    })
  } catch (error) {
    console.error("发送测试邮件失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "发送测试邮件失败，请检查邮件配置",
      },
      { status: 500 },
    )
  }
}
