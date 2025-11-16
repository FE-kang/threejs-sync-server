"use strict";
/**
 * Web服务器模块
 * 提供Three.js网站的本地访问
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const os_1 = __importDefault(require("os"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger/logger");
const config_1 = __importDefault(require("../config"));
const package_json_1 = __importDefault(require("../package.json"));
// 创建日志记录器
const logger = (0, logger_1.createLogger)("server", {
    level: "info",
    console: true,
});
/**
 * 启动Web服务器
 */
async function startServer() {
    const app = (0, express_1.default)();
    const port = config_1.default.server.port;
    const host = config_1.default.server.host;
    // 静态文件服务
    app.use(express_1.default.static(config_1.default.websitePath));
    // 首页路由
    app.get('/', (_req, res) => {
        res.sendFile(path_1.default.join(config_1.default.websitePath, "index.html"));
    });
    // 状态API
    app.get('/api/status', (_req, res) => {
        res.json({
            status: "running",
            version: package_json_1.default.version,
            lastSync: new Date().toISOString(),
        });
    });
    // 启动服务器
    return new Promise((resolve, reject) => {
        try {
            const server = app.listen(port, host, () => {
                // 获取本机IP
                const interfaces = os_1.default.networkInterfaces();
                let localIp = "127.0.0.1";
                for (const name of Object.keys(interfaces)) {
                    const list = interfaces[name];
                    if (!list)
                        continue;
                    for (const iface of list) {
                        if (iface.family === "IPv4" && !iface.internal) {
                            localIp = iface.address;
                            break;
                        }
                    }
                }
                logger.info(`Web服务器已启动:`);
                logger.info(`  http://localhost:${port}`);
                logger.info(`  http://${localIp}:${port}`);
                resolve(server);
            });
        }
        catch (error) {
            logger.error("Web服务器启动失败:", error);
            reject(error);
        }
    });
}
// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    startServer();
}
