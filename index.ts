/**
 * Three.js本地镜像服务
 * 定期从GitHub拉取Three.js源码并提供本地访问
 */

import cron from 'node-cron';
import { syncThreeJsRepo } from './sync/sync';
import { main as buildWebsite } from './server/build';
import { startServer } from './server/server';
import { createLogger } from './utils/logger/logger';
import config from './config';

// 创建日志记录器
const logger = createLogger('main', {
  level: 'info',
  console: true
});

/**
 * 执行同步任务
 */
async function runSyncTask(): Promise<void> {
  logger.info('开始执行同步任务...');
  
  try {
    // 同步仓库
    await syncThreeJsRepo();
    const syncResult = { success: true, hasChanges: true }; // 简化结果，因为syncThreeJsRepo不返回详细信息
    
    // 如果同步成功且有更新，或者配置为始终构建，则构建网站
    if ((syncResult.success && syncResult.hasChanges) || config.sync.buildAfterSync) {
      logger.info('开始构建网站...');
      
      try {
        // 尝试完整构建
        await buildWebsite();
      } catch (error) {
        const e = error as Error;
        logger.warn('完整构建失败:', e.message);
      }
    }
    
    logger.info('同步任务完成');
  } catch (error) {
    const e = error as Error;
    logger.error('同步任务失败:', e);
  }
}

/**
 * 启动Web服务器
 */
async function startWebServer(): Promise<import('http').Server> {
  logger.info('正在启动Web服务器...');
  
  try {
    const server = await startServer();
    logger.info('Web服务器启动成功');
    return server;
  } catch (error) {
    const e = error as Error;
    logger.error('启动Web服务器时发生错误:', e);
    throw e;
  }
}

/**
 * 主函数
 */
export async function main(): Promise<void> {
  logger.info('Three.js本地镜像服务启动中...');
  
  try {
    // 如果配置为启动时同步，则执行同步任务
    if (config.sync.syncOnStart) {
      await runSyncTask();
    }
    
    // 设置定时任务
    logger.info(`设置定时任务: ${config.sync.schedule}`);
    cron.schedule(config.sync.schedule, runSyncTask);
    
    // 启动Web服务器
    await startWebServer();
    
    logger.info('Three.js本地镜像服务已启动');
  } catch (error) {
    const e = error as Error;
    logger.error('服务启动失败:', e);
    process.exit(1);
  }
}

// 启动服务
main();

// 导出函数，方便单独使用
export { runSyncTask, startWebServer };
