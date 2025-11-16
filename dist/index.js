"use strict";
/**
 * Three.js本地镜像服务
 * 定期从GitHub拉取Three.js源码并提供本地访问
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
exports.runSyncTask = runSyncTask;
exports.startWebServer = startWebServer;
const node_cron_1 = __importDefault(require("node-cron"));
const sync_1 = require("./sync/sync");
const build_1 = require("./server/build");
const server_1 = require("./server/server");
const logger_1 = require("./utils/logger/logger");
const config_1 = __importDefault(require("./config"));
// 创建日志记录器
const logger = (0, logger_1.createLogger)('main', {
    level: 'info',
    console: true
});
/**
 * 执行同步任务
 */
async function runSyncTask() {
    logger.info('开始执行同步任务...');
    try {
        // 同步仓库
        await (0, sync_1.syncThreeJsRepo)();
        const syncResult = { success: true, hasChanges: true }; // 简化结果，因为syncThreeJsRepo不返回详细信息
        // 如果同步成功且有更新，或者配置为始终构建，则构建网站
        if ((syncResult.success && syncResult.hasChanges) || config_1.default.sync.buildAfterSync) {
            logger.info('开始构建网站...');
            try {
                // 尝试完整构建
                await (0, build_1.main)();
            }
            catch (error) {
                const e = error;
                logger.warn('完整构建失败:', e.message);
            }
        }
        logger.info('同步任务完成');
    }
    catch (error) {
        const e = error;
        logger.error('同步任务失败:', e);
    }
}
/**
 * 启动Web服务器
 */
async function startWebServer() {
    logger.info('正在启动Web服务器...');
    try {
        const server = await (0, server_1.startServer)();
        logger.info('Web服务器启动成功');
        return server;
    }
    catch (error) {
        const e = error;
        logger.error('启动Web服务器时发生错误:', e);
        throw e;
    }
}
/**
 * 主函数
 */
async function main() {
    logger.info('Three.js本地镜像服务启动中...');
    try {
        // 如果配置为启动时同步，则执行同步任务
        if (config_1.default.sync.syncOnStart) {
            await runSyncTask();
        }
        // 设置定时任务
        logger.info(`设置定时任务: ${config_1.default.sync.schedule}`);
        node_cron_1.default.schedule(config_1.default.sync.schedule, runSyncTask);
        // 启动Web服务器
        await startWebServer();
        logger.info('Three.js本地镜像服务已启动');
    }
    catch (error) {
        const e = error;
        logger.error('服务启动失败:', e);
        process.exit(1);
    }
}
// 启动服务
main();
