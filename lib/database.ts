import mysql from 'mysql2/promise'
import { getDatabaseConfig, validateDatabaseConfig } from './db-config'

// MySQL数据库配置
const dbConfig = getDatabaseConfig()
let pool: mysql.Pool | null = null

if (dbConfig && validateDatabaseConfig(dbConfig)) {
  try {
    const poolConfig: mysql.PoolOptions = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: dbConfig.waitForConnections !== false,
      connectionLimit: dbConfig.connectionLimit || 10,
      queueLimit: dbConfig.queueLimit || 0,
      // 连接超时设置
      connectTimeout: dbConfig.connectTimeout || 30000,
      // 查询超时设置
      timeout: dbConfig.timeout || 30000,
      // 空闲连接超时
      idleTimeout: dbConfig.idleTimeout || 300000,
      // 重连设置
      reconnect: dbConfig.reconnect !== false,
    }

    // 只有在明确设置为true时才添加SSL配置
    if (dbConfig.ssl === true) {
      poolConfig.ssl = {}
    }

    pool = mysql.createPool(poolConfig)
    console.log(`Database pool created for ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
  } catch (error) {
    console.error("Failed to initialize database connection:", error)
    pool = null
  }
} else {
  console.warn("No valid database configuration found, using mock database for development")
}

// Mock data for development when no database is available
const mockData = {
  devices: [] as any[],
  settings: {
    id: 1,
    free_auth_mode: false,
    system_name: "设备码换绑系统",
    secret_key: "your-super-secret-key-change-this-in-production"
  },
  logs: [] as any[],
  rebindHistory: [] as any[],
}

// MySQL查询执行函数
async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  if (!pool) {
    // 使用模拟数据
    console.log('Using mock data for query:', query)

    if (query.includes('CREATE TABLE')) {
      return []
    }

    if (query.includes('SELECT') && query.includes('device_authorizations')) {
      return mockData.devices
    }

    if (query.includes('SELECT') && query.includes('system_settings')) {
      return [mockData.settings]
    }

    if (query.includes('INSERT INTO device_authorizations')) {
      const device = {
        id: mockData.devices.length + 1,
        device_code: params[0] || 'MOCK_' + Date.now(),
        device_name: params[1],
        qq_number: params[2],
        authorized_by: params[3],
        expires_at: params[4],
        is_permanent: params[5],
        is_blacklisted: false,
        signature: params[6],
        verify_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockData.devices.push(device)
      return []
    }

    return []
  }

  try {
    const [rows] = await pool.execute(query, params)
    return rows as any[]
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export interface DeviceAuthorization {
  id?: number
  device_code: string
  device_name?: string
  qq_number?: string
  authorized_by?: string
  expires_at?: Date | string
  is_permanent: boolean
  is_blacklisted: boolean
  blacklist_reason?: string
  blacklisted_by?: string
  blacklisted_at?: Date | string
  signature: string
  last_verified_at?: Date | string
  verify_count: number
  created_at?: Date | string
  updated_at?: Date | string
}

export interface SystemSettings {
  id: number
  free_auth_mode: boolean
  system_name: string
  secret_key?: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  smtp_from_email?: string
  smtp_from_name?: string
  created_at?: Date | string
  updated_at?: Date | string
}

export interface Admin {
  id?: number
  username: string
  password_hash: string
  created_at?: Date | string
  updated_at?: Date | string
}

export interface VerificationLog {
  id?: number
  device_code: string
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
  created_at?: Date | string
}

export interface OperationLog {
  id?: number
  admin_username?: string
  operation_type: string
  target_device_code?: string
  details?: any
  ip_address?: string
  created_at?: Date | string
}

export interface DeviceRebindHistory {
  id?: number
  old_device_code: string
  new_device_code: string
  reason?: string
  ip_address?: string
  user_agent?: string
  created_at?: Date | string
}

export interface DashboardStats {
  totalDevices: number
  activeDevices: number
  blacklistedDevices: number
  todayVerifications: number
  successRate: number
  recentVerifications: VerificationLog[]
  deviceStats: {
    permanent: number
    temporary: number
    expired: number
  }
}

// 数据库操作函数
export const db = {
  // 系统设置
  async getSettings(): Promise<SystemSettings | null> {
    try {
      const result = await executeQuery('SELECT * FROM system_settings WHERE id = ?', [1])
      return result[0] || null
    } catch (error) {
      console.error("Error getting settings:", error)
      return null
    }
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<void> {
    try {
      const updateFields = []
      const values = []

      if (settings.free_auth_mode !== undefined) {
        updateFields.push("free_auth_mode = ?")
        values.push(settings.free_auth_mode)
      }
      if (settings.system_name !== undefined) {
        updateFields.push("system_name = ?")
        values.push(settings.system_name)
      }
      if (settings.secret_key !== undefined) {
        updateFields.push("secret_key = ?")
        values.push(settings.secret_key)
      }
      if (settings.smtp_host !== undefined) {
        updateFields.push("smtp_host = ?")
        values.push(settings.smtp_host)
      }
      if (settings.smtp_port !== undefined) {
        updateFields.push("smtp_port = ?")
        values.push(settings.smtp_port)
      }
      if (settings.smtp_user !== undefined) {
        updateFields.push("smtp_user = ?")
        values.push(settings.smtp_user)
      }
      if (settings.smtp_password !== undefined) {
        updateFields.push("smtp_password = ?")
        values.push(settings.smtp_password)
      }
      if (settings.smtp_from_email !== undefined) {
        updateFields.push("smtp_from_email = ?")
        values.push(settings.smtp_from_email)
      }
      if (settings.smtp_from_name !== undefined) {
        updateFields.push("smtp_from_name = ?")
        values.push(settings.smtp_from_name)
      }

      if (updateFields.length > 0) {
        updateFields.push("updated_at = NOW()")
        values.push(1)

        const query = `
          UPDATE system_settings
          SET ${updateFields.join(", ")}
          WHERE id = ?
        `

        await executeQuery(query, values)
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      throw error
    }
  },

  // 设备授权
  async getDevices(): Promise<DeviceAuthorization[]> {
    try {
      return await executeQuery(`
        SELECT * FROM device_authorizations
        ORDER BY created_at DESC
      `)
    } catch (error) {
      console.error("Error getting devices:", error)
      return []
    }
  },

  async getDevice(deviceCode: string): Promise<DeviceAuthorization | null> {
    try {
      const result = await executeQuery(`
        SELECT * FROM device_authorizations
        WHERE device_code = ?
      `, [deviceCode])
      return result[0] || null
    } catch (error) {
      console.error("Error getting device:", error)
      return null
    }
  },

  async createDevice(device: Omit<DeviceAuthorization, "id" | "created_at" | "updated_at">): Promise<void> {
    try {
      await executeQuery(`
        INSERT INTO device_authorizations (
          device_code, device_name, qq_number, authorized_by, expires_at,
          is_permanent, signature, verify_count, is_blacklisted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        device.device_code,
        device.device_name || null,
        device.qq_number,
        device.authorized_by || null,
        device.expires_at || null,
        device.is_permanent || false,
        device.signature,
        device.verify_count || 0,
        device.is_blacklisted || false
      ])
    } catch (error) {
      console.error("Error creating device:", error)
      throw error
    }
  },

  async updateDevice(deviceCode: string, updates: Partial<DeviceAuthorization>): Promise<void> {
    try {
      // Build dynamic update query
      const updateFields = []
      const values = []

      if (updates.device_name !== undefined) {
        updateFields.push("device_name = ?")
        values.push(updates.device_name)
      }
      if (updates.qq_number !== undefined) {
        updateFields.push("qq_number = ?")
        values.push(updates.qq_number)
      }
      if (updates.is_blacklisted !== undefined) {
        updateFields.push("is_blacklisted = ?")
        values.push(updates.is_blacklisted)
      }
      if (updates.blacklist_reason !== undefined) {
        updateFields.push("blacklist_reason = ?")
        values.push(updates.blacklist_reason)
      }
      if (updates.blacklisted_by !== undefined) {
        updateFields.push("blacklisted_by = ?")
        values.push(updates.blacklisted_by)
      }
      if (updates.last_verified_at !== undefined) {
        updateFields.push("last_verified_at = ?")
        values.push(updates.last_verified_at)
      }
      if (updates.verify_count !== undefined) {
        updateFields.push("verify_count = ?")
        values.push(updates.verify_count)
      }
      if (updates.is_permanent !== undefined) {
        updateFields.push("is_permanent = ?")
        values.push(updates.is_permanent)
      }
      if (updates.expires_at !== undefined) {
        updateFields.push("expires_at = ?")
        values.push(updates.expires_at)
      }

      if (updateFields.length > 0) {
        updateFields.push("updated_at = NOW()")
        values.push(deviceCode)

        const query = `
          UPDATE device_authorizations
          SET ${updateFields.join(", ")}
          WHERE device_code = ?
        `

        await executeQuery(query, values)
      }
    } catch (error) {
      console.error("Error updating device:", error)
      throw error
    }
  },

  async deleteDevice(deviceCode: string): Promise<void> {
    try {
      await executeQuery(`
        DELETE FROM device_authorizations
        WHERE device_code = ?
      `, [deviceCode])
    } catch (error) {
      console.error("Error deleting device:", error)
      throw error
    }
  },

  async blacklistDevice(deviceCode: string, reason: string, adminUsername: string): Promise<void> {
    try {
      await executeQuery(`
        UPDATE device_authorizations
        SET is_blacklisted = ?,
            blacklist_reason = ?,
            blacklisted_by = ?,
            blacklisted_at = NOW(),
            updated_at = NOW()
        WHERE device_code = ?
      `, [true, reason, adminUsername, deviceCode])
    } catch (error) {
      console.error("Error blacklisting device:", error)
      throw error
    }
  },

  async unblacklistDevice(deviceCode: string): Promise<void> {
    try {
      await executeQuery(`
        UPDATE device_authorizations
        SET is_blacklisted = ?,
            blacklist_reason = NULL,
            blacklisted_by = NULL,
            blacklisted_at = NULL,
            updated_at = NOW()
        WHERE device_code = ?
      `, [false, deviceCode])
    } catch (error) {
      console.error("Error unblacklisting device:", error)
      throw error
    }
  },

  async updateVerificationStats(deviceCode: string): Promise<void> {
    try {
      await executeQuery(`
        UPDATE device_authorizations
        SET last_verified_at = NOW(),
            verify_count = verify_count + 1,
            updated_at = NOW()
        WHERE device_code = ?
      `, [deviceCode])
    } catch (error) {
      console.error("Error updating verification stats:", error)
      // Don't throw here, as this is not critical
    }
  },

  // 验证日志
  async createVerificationLog(log: Omit<VerificationLog, "id" | "created_at">): Promise<void> {
    try {
      await executeQuery(`
        INSERT INTO verification_logs (device_code, ip_address, user_agent, success, error_message)
        VALUES (?, ?, ?, ?, ?)
      `, [
        log.device_code || null,
        log.ip_address || null,
        log.user_agent || null,
        log.success || false,
        log.error_message || null
      ])
    } catch (error) {
      console.error("Error creating verification log:", error)
      // Don't throw here, as logging is not critical
    }
  },

  async getRecentVerificationLogs(limit = 10): Promise<VerificationLog[]> {
    try {
      return await executeQuery(`
        SELECT * FROM verification_logs
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit])
    } catch (error) {
      console.error("Error getting recent verification logs:", error)
      return []
    }
  },

  async getVerificationLogs(options: {
    page?: number
    limit?: number
    deviceCode?: string
    success?: boolean
    startDate?: string
    endDate?: string
  } = {}): Promise<{ logs: VerificationLog[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 50,
        deviceCode,
        success,
        startDate,
        endDate
      } = options

      const offset = (page - 1) * limit
      const whereConditions: string[] = []
      const params: any[] = []

      if (deviceCode) {
        whereConditions.push("device_code LIKE ?")
        params.push(`%${deviceCode}%`)
      }

      if (success !== undefined) {
        whereConditions.push("success = ?")
        params.push(success)
      }

      if (startDate) {
        whereConditions.push("created_at >= ?")
        params.push(startDate)
      }

      if (endDate) {
        whereConditions.push("created_at <= ?")
        params.push(endDate)
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM verification_logs ${whereClause}`
      const countResult = await executeQuery(countQuery, params)
      const total = parseInt(countResult[0]?.total || "0")

      // 获取分页数据
      const dataQuery = `
        SELECT * FROM verification_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `
      const queryParams = [...params, limit, offset]
      const logs = await executeQuery(dataQuery, queryParams)

      return { logs, total }
    } catch (error) {
      console.error("Error getting verification logs:", error)
      return { logs: [], total: 0 }
    }
  },

  // 批量删除验证日志
  async batchDeleteVerificationLogs(logIds: number[]): Promise<void> {
    try {
      if (logIds.length === 0) return

      const placeholders = logIds.map(() => '?').join(',')
      await executeQuery(`
        DELETE FROM verification_logs
        WHERE id IN (${placeholders})
      `, logIds)
    } catch (error) {
      console.error("Error batch deleting verification logs:", error)
      throw error
    }
  },

  // 管理员相关
  async getAdmin(username: string): Promise<Admin | null> {
    try {
      const result = await executeQuery(`
        SELECT * FROM admins WHERE username = ?
      `, [username])
      return result[0] || null
    } catch (error) {
      console.error("Error getting admin:", error)
      throw error
    }
  },

  async createAdmin(admin: Omit<Admin, "id" | "created_at" | "updated_at">): Promise<void> {
    try {
      await executeQuery(`
        INSERT INTO admins (username, password_hash)
        VALUES (?, ?)
      `, [admin.username, admin.password_hash])
    } catch (error) {
      console.error("Error creating admin:", error)
      throw error
    }
  },

  // 操作日志
  async createOperationLog(log: Omit<OperationLog, "id" | "created_at">): Promise<void> {
    try {
      await executeQuery(`
        INSERT INTO operation_logs (admin_username, operation_type, target_device_code, details, ip_address)
        VALUES (?, ?, ?, ?, ?)
      `, [log.admin_username, log.operation_type, log.target_device_code, JSON.stringify(log.details), log.ip_address])
    } catch (error) {
      console.error("Error creating operation log:", error)
      // Don't throw here, as logging is not critical
    }
  },

  // 设备换绑历史
  async createDeviceRebindHistory(history: Omit<DeviceRebindHistory, "id" | "created_at">): Promise<void> {
    try {
      await executeQuery(`
        INSERT INTO device_rebind_history (old_device_code, new_device_code, reason, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `, [history.old_device_code, history.new_device_code, history.reason, history.ip_address, history.user_agent])
    } catch (error) {
      console.error("Error creating device rebind history:", error)
      throw error
    }
  },

  async getDeviceRebindHistory(deviceCode?: string, limit = 50): Promise<DeviceRebindHistory[]> {
    try {
      if (deviceCode) {
        return await executeQuery(`
          SELECT * FROM device_rebind_history
          WHERE old_device_code = ? OR new_device_code = ?
          ORDER BY created_at DESC
          LIMIT ?
        `, [deviceCode, deviceCode, limit])
      } else {
        return await executeQuery(`
          SELECT * FROM device_rebind_history
          ORDER BY created_at DESC
          LIMIT ?
        `, [limit])
      }
    } catch (error) {
      console.error("Error getting device rebind history:", error)
      return []
    }
  },

  // 批量删除换绑历史
  async batchDeleteRebindHistory(historyIds: number[]): Promise<void> {
    try {
      if (historyIds.length === 0) return

      const placeholders = historyIds.map(() => '?').join(',')
      await executeQuery(`
        DELETE FROM device_rebind_history
        WHERE id IN (${placeholders})
      `, historyIds)
    } catch (error) {
      console.error("Error batch deleting rebind history:", error)
      throw error
    }
  },

  // 仪表盘统计 - 简化版本，避免复杂查询
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Use simpler queries to avoid potential issues
      const devices = await this.getDevices()
      const recentVerifications = await this.getRecentVerificationLogs(5)

      const totalDevices = devices.length
      const activeDevices = devices.filter((d) => !d.is_blacklisted).length
      const blacklistedDevices = devices.filter((d) => d.is_blacklisted).length

      // Calculate device stats
      const permanent = devices.filter((d) => d.is_permanent && !d.is_blacklisted).length
      const now = new Date()
      const temporary = devices.filter(
        (d) => !d.is_permanent && !d.is_blacklisted && (!d.expires_at || new Date(d.expires_at) > now),
      ).length
      const expired = devices.filter((d) => !d.is_permanent && d.expires_at && new Date(d.expires_at) <= now).length

      // Get today's verifications count
      let todayVerifications = 0
      try {
        const today = new Date().toISOString().split("T")[0]
        const todayLogs = await executeQuery(`
          SELECT COUNT(*) as count
          FROM verification_logs
          WHERE created_at >= ?
        `, [today])
        todayVerifications = Number.parseInt(todayLogs[0]?.count || "0")
      } catch (error) {
        console.error("Error getting today's verifications:", error)
      }

      // Calculate success rate from recent verifications
      const successRate =
        recentVerifications.length > 0
          ? Math.round((recentVerifications.filter((v) => v.success).length / recentVerifications.length) * 100)
          : 0

      return {
        totalDevices,
        activeDevices,
        blacklistedDevices,
        todayVerifications,
        successRate,
        recentVerifications,
        deviceStats: {
          permanent,
          temporary,
          expired,
        },
      }
    } catch (error) {
      console.error("Error getting dashboard stats:", error)

      // Return fallback stats
      return {
        totalDevices: 0,
        activeDevices: 0,
        blacklistedDevices: 0,
        todayVerifications: 0,
        successRate: 0,
        recentVerifications: [],
        deviceStats: {
          permanent: 0,
          temporary: 0,
          expired: 0,
        },
      }
    }
  },
}
