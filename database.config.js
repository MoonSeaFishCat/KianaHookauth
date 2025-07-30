// 数据库配置示例文件
// 复制此文件为 database.config.js 并修改配置

module.exports = {
  // 开发环境配置
  development: {
    host: '156.226.176.148',
    port: 3306,
    user: 'kianaHook',
    password: 'fA2KSwiBGNcThe3h',
    database: 'kianahook',
    ssl: false,
    connectionLimit: 10,
    // 连接超时设置
    connectTimeout: 30000,
    // 查询超时设置
    timeout: 30000,
    // 重连设置
    reconnect: true,
    // 空闲连接超时
    idleTimeout: 300000,
    // 等待连接
    waitForConnections: true,
    // 队列限制
    queueLimit: 0,
  },

  // 生产环境配置
  production: {
    host: '156.226.176.148',
    port: 3306,
    user: 'kianaHook',
    password: 'fA2KSwiBGNcThe3h',
    database: 'kianahook',
    ssl: false,
    connectionLimit: 20,
    // 连接超时设置
    connectTimeout: 30000,
    // 查询超时设置
    timeout: 30000,
    // 重连设置
    reconnect: true,
    // 空闲连接超时
    idleTimeout: 300000,
    // 等待连接
    waitForConnections: true,
    // 队列限制
    queueLimit: 0,
  },
}

/*
使用说明：

1. 环境变量方式（推荐）：
   在 .env 文件中设置：
   DATABASE_URL=mysql://username:password@host:port/database

2. 配置文件方式：
   复制此文件为 database.config.js，修改对应环境的配置

3. 配置优先级：
   DATABASE_URL 环境变量 > database.config.js > 默认配置

4. SSL 配置：
   - 生产环境建议启用 SSL
   - 本地开发可以禁用 SSL
   - 云服务商通常要求启用 SSL

5. 连接池配置：
   - connectionLimit: 最大连接数
   - acquireTimeout: 获取连接超时时间（毫秒）
   - timeout: 查询超时时间（毫秒）

6. 安全建议：
   - 不要在代码中硬编码密码
   - 使用强密码
   - 限制数据库用户权限
   - 定期更换密码
   - 启用防火墙和白名单

7. 性能优化：
   - 根据应用负载调整连接池大小
   - 监控连接使用情况
   - 使用连接池避免频繁建立连接
   - 合理设置超时时间
*/
