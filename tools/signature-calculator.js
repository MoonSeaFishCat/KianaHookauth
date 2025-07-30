#!/usr/bin/env node

/**
 * 设备签名计算工具
 * 用于生成和验证设备签名
 */

const crypto = require('crypto');

// 默认密钥（生产环境请更换）
const DEFAULT_SECRET_KEY = "your-super-secret-key-change-this-in-production";

/**
 * 生成设备签名
 * @param {string} deviceCode - 设备码
 * @param {Date|null} expiresAt - 过期时间，null表示永久
 * @param {string} secretKey - 密钥
 * @returns {string} 签名
 */
function generateDeviceSignature(deviceCode, expiresAt = null, secretKey = DEFAULT_SECRET_KEY) {
  const timestamp = expiresAt ? expiresAt.getTime().toString() : "permanent";
  const data = `${deviceCode}:${timestamp}:${secretKey}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 验证设备签名
 * @param {string} deviceCode - 设备码
 * @param {string} signature - 签名
 * @param {Date|null} expiresAt - 过期时间
 * @param {string} secretKey - 密钥
 * @returns {boolean} 验证结果
 */
function verifyDeviceSignature(deviceCode, signature, expiresAt = null, secretKey = DEFAULT_SECRET_KEY) {
  const expectedSignature = generateDeviceSignature(deviceCode, expiresAt, secretKey);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * 生成随机设备码
 * @returns {string} 设备码
 */
function generateDeviceCode() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

/**
 * 命令行工具主函数
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
    case 'gen':
      handleGenerate(args.slice(1));
      break;
    case 'verify':
      handleVerify(args.slice(1));
      break;
    case 'device-code':
    case 'code':
      handleGenerateDeviceCode();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

/**
 * 处理生成签名命令
 */
function handleGenerate(args) {
  if (args.length < 1) {
    console.error('错误: 请提供设备码');
    console.log('使用方法: node signature-calculator.js generate <设备码> [过期时间] [密钥]');
    return;
  }

  const deviceCode = args[0];
  const expiresAtStr = args[1];
  const secretKey = args[2] || DEFAULT_SECRET_KEY;

  let expiresAt = null;
  if (expiresAtStr && expiresAtStr !== 'permanent') {
    expiresAt = new Date(expiresAtStr);
    if (isNaN(expiresAt.getTime())) {
      console.error('错误: 无效的日期格式，请使用 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss 格式');
      return;
    }
  }

  const signature = generateDeviceSignature(deviceCode, expiresAt, secretKey);

  console.log('=== 设备签名生成结果 ===');
  console.log(`设备码: ${deviceCode}`);
  console.log(`过期时间: ${expiresAt ? expiresAt.toISOString() : '永久'}`);
  console.log(`时间戳: ${expiresAt ? expiresAt.getTime() : 'permanent'}`);
  console.log(`密钥: ${secretKey === DEFAULT_SECRET_KEY ? '默认密钥' : '自定义密钥'}`);
  console.log(`签名: ${signature}`);
  console.log('');
  console.log('=== 用于API请求的JSON ===');
  console.log(JSON.stringify({
    deviceCode: deviceCode,
    signature: signature
  }, null, 2));
}

/**
 * 处理验证签名命令
 */
function handleVerify(args) {
  if (args.length < 2) {
    console.error('错误: 请提供设备码和签名');
    console.log('使用方法: node signature-calculator.js verify <设备码> <签名> [过期时间] [密钥]');
    return;
  }

  const deviceCode = args[0];
  const signature = args[1];
  const expiresAtStr = args[2];
  const secretKey = args[3] || DEFAULT_SECRET_KEY;

  let expiresAt = null;
  if (expiresAtStr && expiresAtStr !== 'permanent') {
    expiresAt = new Date(expiresAtStr);
    if (isNaN(expiresAt.getTime())) {
      console.error('错误: 无效的日期格式');
      return;
    }
  }

  const isValid = verifyDeviceSignature(deviceCode, signature, expiresAt, secretKey);
  const expectedSignature = generateDeviceSignature(deviceCode, expiresAt, secretKey);

  console.log('=== 签名验证结果 ===');
  console.log(`设备码: ${deviceCode}`);
  console.log(`过期时间: ${expiresAt ? expiresAt.toISOString() : '永久'}`);
  console.log(`提供的签名: ${signature}`);
  console.log(`期望的签名: ${expectedSignature}`);
  console.log(`验证结果: ${isValid ? '✅ 有效' : '❌ 无效'}`);
}

/**
 * 处理生成设备码命令
 */
function handleGenerateDeviceCode() {
  const deviceCode = generateDeviceCode();
  console.log('=== 随机设备码生成结果 ===');
  console.log(`设备码: ${deviceCode}`);
  console.log('');
  console.log('提示: 使用此设备码生成签名:');
  console.log(`node signature-calculator.js generate ${deviceCode}`);
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log('设备签名计算工具');
  console.log('');
  console.log('使用方法:');
  console.log('  node signature-calculator.js <命令> [参数...]');
  console.log('');
  console.log('命令:');
  console.log('  generate <设备码> [过期时间] [密钥]');
  console.log('    生成设备签名');
  console.log('    过期时间格式: YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss 或 permanent');
  console.log('');
  console.log('  verify <设备码> <签名> [过期时间] [密钥]');
  console.log('    验证设备签名');
  console.log('');
  console.log('  device-code');
  console.log('    生成随机设备码');
  console.log('');
  console.log('  help');
  console.log('    显示此帮助信息');
  console.log('');
  console.log('示例:');
  console.log('  # 生成永久设备签名');
  console.log('  node signature-calculator.js generate ABC123');
  console.log('');
  console.log('  # 生成临时设备签名');
  console.log('  node signature-calculator.js generate ABC123 2024-12-31');
  console.log('');
  console.log('  # 验证签名');
  console.log('  node signature-calculator.js verify ABC123 a1b2c3d4...');
  console.log('');
  console.log('  # 生成随机设备码');
  console.log('  node signature-calculator.js device-code');
}

// 如果直接运行此脚本，执行主函数
if (require.main === module) {
  main();
}

// 导出函数供其他模块使用
module.exports = {
  generateDeviceSignature,
  verifyDeviceSignature,
  generateDeviceCode
};
