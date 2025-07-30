// 数据库配置文件
export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  ssl?: boolean
  connectionLimit?: number
  acquireTimeout?: number
  timeout?: number
  connectTimeout?: number
  idleTimeout?: number
}

// 从环境变量解析数据库配置
export function parseDatabaseUrl(url: string): DatabaseConfig {
  try {
    const urlObj = new URL(url)
    
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 3306,
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.slice(1), // 移除开头的 /
      ssl: urlObj.searchParams.get('ssl') === 'true',
      connectionLimit: parseInt(urlObj.searchParams.get('connectionLimit') || '10'),
      connectTimeout: parseInt(urlObj.searchParams.get('connectTimeout') || '60000'),
      acquireTimeout: parseInt(urlObj.searchParams.get('acquireTimeout') || '60000'),
    }
  } catch (error) {
    throw new Error(`Invalid database URL: ${error}`)
  }
}

// 预定义的数据库配置
export const databaseConfigs = {
  // 本地开发环境
  development: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'device_auth_system',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },

  // 生产环境示例
  production: {
    host: 'your-production-host.com',
    port: 3306,
    user: 'prod_user',
    password: 'secure_password',
    database: 'device_auth_system',
    ssl: true,
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
  },

  // 测试环境
  test: {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_password',
    database: 'device_auth_system_test',
    connectionLimit: 5,
    acquireTimeout: 30000,
    timeout: 30000,
  },
}

// 获取当前环境的数据库配置
export function getDatabaseConfig(): DatabaseConfig | null {
  const DATABASE_URL = process.env.DATABASE_URL
  const NODE_ENV = process.env.NODE_ENV || 'development'

  // 如果有 DATABASE_URL，优先使用
  if (DATABASE_URL) {
    try {
      return parseDatabaseUrl(DATABASE_URL)
    } catch (error) {
      console.error('Failed to parse DATABASE_URL:', error)
      return null
    }
  }

  // 否则使用预定义配置
  const config = databaseConfigs[NODE_ENV as keyof typeof databaseConfigs]
  if (config) {
    return config
  }

  // 如果没有找到配置，返回开发环境配置
  console.warn(`No database config found for environment: ${NODE_ENV}, using development config`)
  return databaseConfigs.development
}

// 验证数据库配置
export function validateDatabaseConfig(config: DatabaseConfig): boolean {
  const required = ['host', 'port', 'user', 'password', 'database']
  
  for (const field of required) {
    if (!config[field as keyof DatabaseConfig]) {
      console.error(`Missing required database config field: ${field}`)
      return false
    }
  }

  if (config.port < 1 || config.port > 65535) {
    console.error('Invalid database port number')
    return false
  }

  return true
}

// 生成数据库连接URL
export function generateDatabaseUrl(config: DatabaseConfig): string {
  const { host, port, user, password, database, ssl, connectionLimit, acquireTimeout, timeout } = config
  
  let url = `mysql://${user}:${password}@${host}:${port}/${database}`
  
  const params = new URLSearchParams()
  if (ssl) params.append('ssl', 'true')
  if (connectionLimit) params.append('connectionLimit', connectionLimit.toString())
  if (acquireTimeout) params.append('acquireTimeout', acquireTimeout.toString())
  if (timeout) params.append('timeout', timeout.toString())
  
  const paramString = params.toString()
  if (paramString) {
    url += `?${paramString}`
  }
  
  return url
}

// 数据库连接状态
export interface DatabaseStatus {
  connected: boolean
  config: DatabaseConfig | null
  error?: string
  lastChecked: Date
}

// 检查数据库连接状态
export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const config = getDatabaseConfig()
  const status: DatabaseStatus = {
    connected: false,
    config,
    lastChecked: new Date(),
  }

  if (!config) {
    status.error = 'No database configuration found'
    return status
  }

  if (!validateDatabaseConfig(config)) {
    status.error = 'Invalid database configuration'
    return status
  }

  try {
    // 这里可以添加实际的数据库连接测试
    // 暂时返回配置存在即认为可连接
    status.connected = true
  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown database error'
  }

  return status
}
