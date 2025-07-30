# 🛡️ 设备授权系统

一个基于 Next.js 的现代化设备授权管理系统，提供安全可靠的设备验证、换绑和管理功能。

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ 核心功能

### 🔐 设备认证系统
- **安全签名验证**: 基于 SHA-256 的设备码签名机制
- **时间窗口容错**: 10秒时间窗口，解决客户端与服务器时间差异
- **灵活授权模式**: 支持永久授权和临时授权两种模式
- **黑名单管理**: 实时拉黑恶意设备，保护系统安全
- **IP地址记录**: 完整的访问日志和安全审计

### 📧 设备换绑系统
- **邮箱验证**: 基于邮箱验证码的安全换绑流程
- **操作记录**: 完整的换绑历史追踪
- **防重复换绑**: 智能检测和防止频繁换绑操作
- **多重验证**: 设备码、邮箱、验证码三重验证机制

### 👨‍💼 管理后台
- **设备管理**: 批量添加、编辑、删除设备授权
- **实时监控**: 设备状态、验证日志实时查看
- **系统配置**: 灵活的系统参数和邮件服务配置
- **签名工具**: 内置设备签名生成和验证工具
- **批量操作**: 支持批量删除日志和历史记录

### 📊 数据分析
- **实时仪表盘**: 设备统计、验证成功率、活跃度分析
- **图表展示**: 直观的数据可视化界面
- **趋势分析**: 设备使用趋势和异常检测
- **导出功能**: 支持数据导出和报表生成

## 🚀 快速开始

### 📋 环境要求
- **Node.js**: 18.0+ (推荐 LTS 版本)
- **数据库**: MySQL 5.7+ 或 MySQL 8.0+
- **包管理器**: pnpm (推荐) 或 npm
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### ⚡ 一键安装

```bash
# 1. 克隆项目
git clone https://github.com/your-username/device-auth-system.git
cd device-auth-system

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接和邮件服务

# 4. 初始化数据库
mysql -u root -p < scripts/init-mysql-database.sql

# 5. 启动开发服务器
pnpm dev
```

### 🌐 访问地址
- **前台页面**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin
- **API 接口**: http://localhost:3000/api

### 🔑 默认账号
- **管理员用户名**: `admin`
- **管理员密码**: `admin123`

> ⚠️ **安全提醒**: 生产环境部署后请立即修改默认密码！

## 📖 详细文档

| 文档类型 | 链接 | 描述 |
|---------|------|------|
| 📚 安装指南 | [SETUP.md](./SETUP.md) | 详细的安装和配置步骤 |
| 🔌 API 文档 | [docs/API.md](./docs/API.md) | 完整的 API 接口文档 |
| 🔐 签名机制 | [docs/DEVICE-SIGNATURE.md](./docs/DEVICE-SIGNATURE.md) | 设备签名算法说明 |
| 📝 更新日志 | [CHANGELOG.md](./CHANGELOG.md) | 版本更新记录 |
| 🧪 功能测试 | [test-functionality.md](./test-functionality.md) | 功能测试指南 |

## ⚙️ 配置说明

### 🔧 环境变量配置

创建 `.env` 文件并配置以下参数：

```bash
# 数据库配置 (必需)
DATABASE_URL=mysql://username:password@host:port/database

# 系统密钥 (必需 - 用于设备签名)
SECRET_KEY=your-super-secret-key-change-this-in-production

# JWT 密钥 (必需 - 用于管理员认证)
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# 邮件服务配置 (换绑功能必需)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=noreply@example.com
SMTP_FROM_NAME=设备授权系统

# 应用配置 (可选)
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=https://your-domain.com
```

### 🗄️ 数据库配置

支持两种配置方式：

**方式一：环境变量 (推荐)**
```bash
DATABASE_URL=mysql://user:password@host:port/database
```

**方式二：配置文件**
```javascript
// database.config.js
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'device_auth_system'
  }
}
```

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Next.js 15.2.4 (App Router)
- **语言**: TypeScript 5.0+
- **UI 库**: React 19 + Radix UI
- **样式**: Tailwind CSS 3.4
- **状态管理**: React Hooks
- **图标**: Lucide React
- **通知**: SweetAlert2

### 后端技术栈
- **API**: Next.js API Routes
- **数据库**: MySQL 8.0 + mysql2
- **认证**: JWT + Cookie Session
- **加密**: Node.js Crypto (SHA-256)
- **邮件**: Nodemailer
- **验证**: Zod

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript
- **构建工具**: Next.js + Turbopack

## 📁 项目结构

```
device-auth-system/
├── 📁 app/                     # Next.js 应用目录 (App Router)
│   ├── 📁 admin/              # 管理后台页面
│   │   ├── page.tsx           # 仪表盘页面
│   │   └── login/             # 登录页面
│   ├── 📁 api/                # API 路由
│   │   ├── auth/              # 认证相关 API
│   │   ├── admin/             # 管理员 API
│   │   └── system/            # 系统信息 API
│   ├── globals.css            # 全局样式
│   ├── layout.tsx             # 根布局
│   └── page.tsx               # 首页
├── 📁 components/             # React 组件
│   ├── 📁 admin/              # 管理后台组件
│   │   ├── device-management.tsx
│   │   ├── verification-logs.tsx
│   │   ├── system-settings.tsx
│   │   └── rebind-history.tsx
│   └── 📁 ui/                 # 基础 UI 组件
├── 📁 lib/                    # 核心工具库
│   ├── database.ts            # 数据库操作层
│   ├── crypto.ts              # 加密和签名工具
│   ├── email-codes.ts         # 邮件验证码
│   ├── db-config.ts           # 数据库配置
│   └── utils.ts               # 通用工具函数
├── 📁 hooks/                  # React Hooks
├── 📁 docs/                   # 项目文档
├── 📁 scripts/                # 数据库脚本和工具
├── 📁 tools/                  # 开发工具
└── 📁 public/                 # 静态资源
```

## 🔒 安全特性

### 🛡️ 多层安全防护
- **设备签名验证**: 基于 SHA-256 的设备码签名机制
- **时间窗口防护**: 10秒时间窗口防止重放攻击
- **IP 地址追踪**: 完整记录访问来源和用户代理
- **操作日志审计**: 所有关键操作的完整日志记录
- **黑名单机制**: 实时拉黑恶意设备和IP

### 🔐 认证与授权
- **JWT 令牌**: 安全的管理员会话管理
- **密码哈希**: bcrypt 加密存储管理员密码
- **会话超时**: 自动过期的安全会话机制
- **权限控制**: 基于角色的访问控制

### 📧 通信安全
- **邮件验证**: 基于邮箱验证码的安全换绑
- **SMTP 加密**: 支持 TLS/SSL 邮件传输加密
- **防暴力破解**: 验证码有效期和重试限制

## 🚀 部署指南

### 🌐 生产环境部署

```bash
# 1. 构建生产版本
pnpm build

# 2. 启动生产服务器
pnpm start

# 3. 使用 PM2 进程管理 (推荐)
npm install -g pm2
pm2 start npm --name "device-auth-system" -- start
pm2 save
pm2 startup
```

### 🐳 Docker 部署

**单容器部署**
```bash
# 构建镜像
docker build -t device-auth-system .

# 运行容器
docker run -d \
  --name device-auth-system \
  -p 3000:3000 \
  --env-file .env \
  device-auth-system
```

**Docker Compose 部署**
```bash
# 启动所有服务 (包括 MySQL)
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### ☁️ 云平台部署

**Vercel 部署**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署到 Vercel
vercel --prod
```

**Railway 部署**
```bash
# 连接 GitHub 仓库到 Railway
# 配置环境变量
# 自动部署
```

## 🔧 开发指南

### 🛠️ 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/device-auth-system.git
cd device-auth-system

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行类型检查
pnpm type-check

# 运行代码检查
pnpm lint

# 格式化代码
pnpm format
```

### 🧪 测试

```bash
# 运行单元测试
pnpm test

# 运行集成测试
pnpm test:integration

# 生成测试覆盖率报告
pnpm test:coverage
```

### 📦 构建

```bash
# 构建生产版本
pnpm build

# 分析构建包大小
pnpm analyze

# 导出静态文件
pnpm export
```

## 🐛 故障排除

### 常见问题

**1. 数据库连接失败**
```bash
# 检查数据库服务状态
systemctl status mysql

# 检查连接配置
mysql -u username -p -h host -P port database_name
```

**2. 邮件发送失败**
- 检查 SMTP 配置是否正确
- 验证邮箱密码或应用专用密码
- 确认防火墙设置

**3. 签名验证失败**
- 检查系统时间是否同步
- 验证 SECRET_KEY 配置
- 查看服务器日志

### 🔍 调试模式

```bash
# 启用调试日志
DEBUG=* pnpm dev

# 查看数据库查询日志
DEBUG=mysql:* pnpm dev
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 📝 提交 Issue
- 使用清晰的标题描述问题
- 提供详细的重现步骤
- 包含错误日志和截图
- 说明您的环境信息

### 🔀 提交 Pull Request
1. Fork 项目到您的 GitHub
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 📋 代码规范
- 遵循 ESLint 和 Prettier 配置
- 编写清晰的提交信息
- 添加必要的测试用例
- 更新相关文档

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 许可证。

## 🙏 致谢

感谢以下开源项目：
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 无障碍 UI 组件
- [MySQL](https://www.mysql.com/) - 关系型数据库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript

## 📞 支持与联系

- 📚 **文档**: [查看完整文档](./docs/README.md)
- 🐛 **Bug 报告**: [提交 Issue](https://github.com/your-username/device-auth-system/issues)
- 💡 **功能建议**: [功能请求](https://github.com/your-username/device-auth-system/issues/new?template=feature_request.md)
- 💬 **讨论**: [GitHub Discussions](https://github.com/your-username/device-auth-system/discussions)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**

Made with ❤️ by [Your Name](https://github.com/your-username)

</div>
