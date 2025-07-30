-- MySQL数据库初始化脚本
-- 设备码换绑系统

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建设备授权表
CREATE TABLE IF NOT EXISTS device_authorizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_code VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    qq_number VARCHAR(20),
    authorized_by VARCHAR(255),
    expires_at TIMESTAMP NULL,
    is_permanent BOOLEAN DEFAULT FALSE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    blacklisted_by VARCHAR(255),
    blacklisted_at TIMESTAMP NULL,
    signature VARCHAR(512) NOT NULL,
    last_verified_at TIMESTAMP NULL,
    verify_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device_code (device_code),
    INDEX idx_qq_number (qq_number),
    INDEX idx_is_blacklisted (is_blacklisted),
    INDEX idx_created_at (created_at)
);

-- 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    free_auth_mode BOOLEAN DEFAULT FALSE,
    system_name VARCHAR(255) DEFAULT '设备码换绑系统',
    secret_key VARCHAR(255) DEFAULT 'default-secret-key-change-this-in-production',
    smtp_host VARCHAR(255),
    smtp_port INT DEFAULT 587,
    smtp_user VARCHAR(255),
    smtp_password VARCHAR(255),
    smtp_from_email VARCHAR(255),
    smtp_from_name VARCHAR(255) DEFAULT '设备码换绑系统',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建验证日志表
CREATE TABLE IF NOT EXISTS verification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_code VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_device_code (device_code),
    INDEX idx_success (success),
    INDEX idx_created_at (created_at)
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_username VARCHAR(255),
    operation_type VARCHAR(100) NOT NULL,
    target_device_code VARCHAR(255),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_admin_username (admin_username),
    INDEX idx_operation_type (operation_type),
    INDEX idx_target_device_code (target_device_code),
    INDEX idx_created_at (created_at)
);

-- 创建设备换绑历史表
CREATE TABLE IF NOT EXISTS device_rebind_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    old_device_code VARCHAR(255) NOT NULL,
    new_device_code VARCHAR(255) NOT NULL,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_old_device_code (old_device_code),
    INDEX idx_new_device_code (new_device_code),
    INDEX idx_created_at (created_at)
);

-- 插入默认系统设置
INSERT INTO system_settings (id, free_auth_mode, system_name, secret_key)
VALUES (1, FALSE, '设备码换绑系统', 'default-secret-key-change-this-in-production');

-- 插入默认管理员 (用户名: admin, 密码: admin123)
-- 密码哈希: $2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeGvGzjYwjUxVzfGq.L0jRBXQ/Wa (admin123)
INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeGvGzjYwjUxVzfGq.L0jRBXQ/Wa');

-- 创建示例设备（可选）
-- INSERT INTO device_authorizations (device_code, device_name, qq_number, authorized_by, is_permanent, signature, verify_count)
-- VALUES ('DEMO123456', '演示设备', '123456789', 'admin', TRUE, 'demo_signature', 0)
-- ON DUPLICATE KEY UPDATE device_name = VALUES(device_name);
