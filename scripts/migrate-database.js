#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 用于创建和更新数据库表结构
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// 从环境变量或配置文件获取数据库配置
function getDatabaseConfig() {
  const DATABASE_URL = process.env.DATABASE_URL
  
  if (DATABASE_URL) {
    const url = new URL(DATABASE_URL)
    return {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    }
  }

  // 尝试从配置文件读取
  try {
    const configPath = path.join(__dirname, '..', 'database.config.js')
    if (fs.existsSync(configPath)) {
      const config = require(configPath)
      const env = process.env.NODE_ENV || 'development'
      return config[env] || config.development
    }
  } catch (error) {
    console.warn('无法读取数据库配置文件:', error.message)
  }

  // 默认配置
  return {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'device_auth_system',
  }
}

// 执行SQL文件
async function executeSqlFile(connection, filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8')

    // 清理SQL内容，移除注释和空行
    const cleanSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim()
        return trimmed && !trimmed.startsWith('--')
      })
      .join('\n')

    // 按分号分割语句，但要处理字符串中的分号
    const statements = []
    let currentStatement = ''
    let inString = false
    let stringChar = ''

    for (let i = 0; i < cleanSql.length; i++) {
      const char = cleanSql[i]
      const prevChar = i > 0 ? cleanSql[i - 1] : ''

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
          stringChar = ''
        }
      }

      if (char === ';' && !inString) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim())
        }
        currentStatement = ''
      } else {
        currentStatement += char
      }
    }

    // 添加最后一个语句
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }

    console.log(`📝 准备执行 ${statements.length} 条SQL语句...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          // 使用query而不是execute来避免预处理语句的限制
          await connection.query(statement)
          console.log(`   ✅ 语句 ${i + 1}/${statements.length} 执行成功`)
        } catch (error) {
          // 忽略重复键错误和表已存在错误
          if (error.code === 'ER_DUP_ENTRY' ||
              error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.message.includes('Duplicate entry') ||
              error.message.includes('already exists')) {
            console.log(`   ⚠️  语句 ${i + 1}/${statements.length} 跳过 (已存在)`)
          } else {
            console.error(`   ❌ 语句 ${i + 1}/${statements.length} 执行失败:`)
            console.error(`   SQL: ${statement.substring(0, 100)}...`)
            console.error(`   错误: ${error.message}`)
            throw error
          }
        }
      }
    }

    console.log(`✅ 成功执行: ${path.basename(filePath)}`)
  } catch (error) {
    console.error(`❌ 执行失败: ${path.basename(filePath)}`)
    console.error(error.message)
    throw error
  }
}

// 检查表是否存在
async function tableExists(connection, tableName) {
  try {
    const [rows] = await connection.query(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
      [tableName]
    )
    return rows[0].count > 0
  } catch (error) {
    return false
  }
}

// 主迁移函数
async function migrate() {
  const config = getDatabaseConfig()
  let connection

  try {
    console.log('🔗 连接数据库...')
    console.log(`   主机: ${config.host}:${config.port}`)
    console.log(`   数据库: ${config.database}`)
    
    // 创建连接时移除不支持的选项
    const connectionConfig = {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl
    }

    connection = await mysql.createConnection(connectionConfig)
    console.log('✅ 数据库连接成功')

    // 检查现有表
    const tables = [
      'admins',
      'device_authorizations', 
      'system_settings',
      'verification_logs',
      'operation_logs',
      'device_rebind_history'
    ]

    console.log('\n📋 检查现有表结构...')
    for (const table of tables) {
      const exists = await tableExists(connection, table)
      console.log(`   ${table}: ${exists ? '✅ 存在' : '❌ 不存在'}`)
    }

    // 执行迁移脚本
    console.log('\n🚀 开始数据库迁移...')
    const sqlFile = path.join(__dirname, 'init-mysql-database.sql')
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL文件不存在: ${sqlFile}`)
    }

    await executeSqlFile(connection, sqlFile)

    // 验证迁移结果
    console.log('\n✅ 验证迁移结果...')
    for (const table of tables) {
      const exists = await tableExists(connection, table)
      if (exists) {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`)
        console.log(`   ${table}: ✅ 存在 (${rows[0].count} 条记录)`)
      } else {
        console.log(`   ${table}: ❌ 创建失败`)
      }
    }

    console.log('\n🎉 数据库迁移完成!')

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
数据库迁移脚本

用法:
  node scripts/migrate-database.js [选项]

选项:
  --help, -h     显示帮助信息
  --env <env>    指定环境 (development, production, test)

环境变量:
  DATABASE_URL   数据库连接URL (mysql://user:pass@host:port/db)
  NODE_ENV       运行环境

示例:
  # 使用环境变量
  DATABASE_URL=mysql://root:password@localhost:3306/mydb node scripts/migrate-database.js
  
  # 指定环境
  NODE_ENV=production node scripts/migrate-database.js
  
  # 使用配置文件
  node scripts/migrate-database.js
`)
}

// 命令行参数处理
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  showHelp()
  process.exit(0)
}

const envIndex = args.indexOf('--env')
if (envIndex !== -1 && args[envIndex + 1]) {
  process.env.NODE_ENV = args[envIndex + 1]
}

// 执行迁移
migrate().catch(error => {
  console.error('迁移过程中发生错误:', error)
  process.exit(1)
})
