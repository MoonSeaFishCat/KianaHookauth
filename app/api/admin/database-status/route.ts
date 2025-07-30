import { NextResponse } from "next/server"
import { checkDatabaseStatus, getDatabaseConfig } from "@/lib/db-config"
import mysql from 'mysql2/promise'

export async function GET() {
  try {
    const config = getDatabaseConfig()
    const status = await checkDatabaseStatus()

    // 尝试实际连接数据库
    let connectionTest = {
      connected: false,
      error: null as string | null,
      responseTime: 0,
    }

    if (config) {
      const startTime = Date.now()
      try {
        const connection = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          database: config.database,
          ssl: config.ssl ? {} : false,
        })

        // 执行一个简单的查询来测试连接
        await connection.execute('SELECT 1 as test')
        await connection.end()

        connectionTest.connected = true
        connectionTest.responseTime = Date.now() - startTime
      } catch (error) {
        connectionTest.error = error instanceof Error ? error.message : 'Unknown connection error'
        connectionTest.responseTime = Date.now() - startTime
      }
    }

    // 获取数据库信息（隐藏敏感信息）
    const safeConfig = config ? {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user.replace(/./g, '*'), // 隐藏用户名
      ssl: config.ssl,
      connectionLimit: config.connectionLimit,
    } : null

    return NextResponse.json({
      success: true,
      data: {
        status: status.connected && connectionTest.connected ? 'connected' : 'disconnected',
        config: safeConfig,
        connectionTest,
        lastChecked: status.lastChecked,
        error: status.error || connectionTest.error,
      },
    })
  } catch (error) {
    console.error("Database status check failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check database status",
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
