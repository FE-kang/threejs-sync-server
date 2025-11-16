"use strict";
/**
 * 日志记录器模块
 * 提供统一的日志记录功能
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
exports.clearLog = clearLog;
exports.clearAllLogs = clearAllLogs;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// @ts-ignore 无法找到模块“../../config”的声明文件，临时忽略类型检查
const config_1 = __importDefault(require("../../config"));
// 确保日志目录存在
fs_extra_1.default.ensureDirSync(config_1.default.logs.dir);
function createLogger(name, options = {}) {
    const logOptions = {
        level: options.level ?? config_1.default.logs.level,
        console: options.console ?? true,
        file: options.file ?? true
    };
    // 创建格式化器
    const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ level, message, timestamp }) => {
        return `[${timestamp}] [${name}] [${level.toUpperCase()}]: ${message}`;
    }));
    // 创建传输器
    const transports = [];
    // 控制台传输器
    if (logOptions.console) {
        transports.push(new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
        }));
    }
    // 文件传输器
    if (logOptions.file) {
        const parseSize = (s) => {
            const m = s.trim().toLowerCase();
            if (/^\d+$/.test(m))
                return Number(m);
            const num = parseFloat(m);
            if (m.endsWith('kb') || m.endsWith('k'))
                return Math.round(num * 1024);
            if (m.endsWith('mb') || m.endsWith('m'))
                return Math.round(num * 1024 * 1024);
            if (m.endsWith('gb') || m.endsWith('g'))
                return Math.round(num * 1024 * 1024 * 1024);
            return Number.isFinite(num) ? Math.round(num) : 10 * 1024 * 1024;
        };
        transports.push(new winston_1.default.transports.File({
            filename: path_1.default.join(config_1.default.logs.dir, `${name}.log`),
            format: logFormat,
            maxsize: parseSize(config_1.default.logs.maxSize),
            maxFiles: config_1.default.logs.maxFiles
        }));
    }
    // 创建日志记录器
    return winston_1.default.createLogger({
        level: logOptions.level,
        transports
    });
}
function clearLog(name) {
    try {
        const filePath = path_1.default.join(config_1.default.logs.dir, `${name}.log`);
        if (!fs_extra_1.default.existsSync(filePath))
            return false;
        fs_extra_1.default.writeFileSync(filePath, '', 'utf8');
        return true;
    }
    catch {
        return false;
    }
}
function clearAllLogs() {
    const success = [];
    const failed = [];
    try {
        const files = fs_extra_1.default.readdirSync(config_1.default.logs.dir);
        for (const file of files) {
            if (file.endsWith('.log')) {
                const name = file.replace(/\.log$/, '');
                const ok = clearLog(name);
                if (ok)
                    success.push(name);
                else
                    failed.push({ file, error: '无法清空或文件不存在' });
            }
        }
    }
    catch (e) {
        failed.push({ file: '*', error: e instanceof Error ? e.message : '未知错误' });
    }
    return { success, failed };
}
