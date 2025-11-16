/**
 * 日志记录器模块
 * 提供统一的日志记录功能
 */

import winston, { Logger } from 'winston';
import path from 'path';
import fs from 'fs-extra';
// @ts-ignore 无法找到模块“../../config”的声明文件，临时忽略类型检查
import config from '../../config';

// 确保日志目录存在
fs.ensureDirSync(config.logs.dir);

/**
 * 创建日志记录器
 * @param {string} name 日志记录器名称
 * @param {Object} options 配置选项
 * @returns {winston.Logger} 日志记录器实例
 */
export interface LoggerOptions {
  level?: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  console?: boolean;
  file?: boolean;
}

export function createLogger(name: string, options: LoggerOptions = {}): Logger {
  const logOptions: Required<LoggerOptions> = {
    level: options.level ?? config.logs.level,
    console: options.console ?? true,
    file: options.file ?? true
  };
  
  // 创建格式化器
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] [${name}] [${level.toUpperCase()}]: ${message}`;
    })
  );
  
  // 创建传输器
  const transports = [];
  
  // 控制台传输器
  if (logOptions.console) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      })
    );
  }
  
  // 文件传输器
  if (logOptions.file) {
    const parseSize = (s: string): number => {
      const m = s.trim().toLowerCase();
      if (/^\d+$/.test(m)) return Number(m);
      const num = parseFloat(m);
      if (m.endsWith('kb') || m.endsWith('k')) return Math.round(num * 1024);
      if (m.endsWith('mb') || m.endsWith('m')) return Math.round(num * 1024 * 1024);
      if (m.endsWith('gb') || m.endsWith('g')) return Math.round(num * 1024 * 1024 * 1024);
      return Number.isFinite(num) ? Math.round(num) : 10 * 1024 * 1024;
    };
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logs.dir, `${name}.log`),
        format: logFormat,
        maxsize: parseSize(config.logs.maxSize),
        maxFiles: config.logs.maxFiles
      })
    );
  }
  
  // 创建日志记录器
  return winston.createLogger({
    level: logOptions.level,
    transports
  });
}

export function clearLog(name: string): boolean {
  try {
    const filePath = path.join(config.logs.dir, `${name}.log`);
    if (!fs.existsSync(filePath)) return false;
    fs.writeFileSync(filePath, '', 'utf8');
    return true;
  } catch {
    return false;
  }
}

export function clearAllLogs(): { success: string[]; failed: { file: string; error: string }[] } {
  const success: string[] = [];
  const failed: { file: string; error: string }[] = [];
  try {
    const files = fs.readdirSync(config.logs.dir);
    for (const file of files) {
      if (file.endsWith('.log')) {
        const name = file.replace(/\.log$/, '');
        const ok = clearLog(name);
        if (ok) success.push(name);
        else failed.push({ file, error: '无法清空或文件不存在' });
      }
    }
  } catch (e) {
    failed.push({ file: '*', error: e instanceof Error ? e.message : '未知错误' });
  }
  return { success, failed };
}