/**
 * Web服务器模块
 * 提供Three.js网站的本地访问
 */

import os from 'os';
import express from 'express';
import path from 'path';
import { createLogger } from '../utils/logger/logger';
import config from '../config';
import pkg from '../package.json';

// 创建日志记录器
const logger = createLogger("server", {
  level: "info",
  console: true,
});

/**
 * 启动Web服务器
 */
export async function startServer(): Promise<import('http').Server> {
  const app = express();
  const port = config.server.port;
  const host = config.server.host;

  // 静态文件服务
  app.use(express.static(config.websitePath));

  // 首页路由
  app.get('/', (_req: express.Request, res: express.Response) => {
    res.sendFile(path.join(config.websitePath, "index.html"));
  });

  // 状态API
  app.get('/api/status', (_req: express.Request, res: express.Response) => {
    res.json({
      status: "running",
      version: pkg.version,
      lastSync: new Date().toISOString(),
    });
  });

  // 启动服务器
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, host, () => {
        // 获取本机IP
        const interfaces = os.networkInterfaces();
        let localIp = "127.0.0.1";
        for (const name of Object.keys(interfaces)) {
          const list = interfaces[name];
          if (!list) continue;
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
    } catch (error) {
      logger.error("Web服务器启动失败:", error);
      reject(error);
    }
  });
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  startServer();
}
