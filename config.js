/**
 * 项目配置文件
 */

const path = require('path');

module.exports = {
  // GitHub仓库URL
  repoUrl: 'https://gitee.com/mirrors/three.js.git',
  
  // 本地仓库路径
  repoPath: path.join(__dirname, 'three.js-repo'),
  
  // 网站输出目录
  websitePath: path.join(__dirname, 'website'),
  
  // 日志配置
  logs: {
    dir: path.join(__dirname, 'logs'),
    level: 'info',
    maxSize: '10m',
    maxFiles: 10
  },
  
  // 同步配置
  sync: {
    // 定时任务配置 (cron格式: 秒 分 时 日 月 周)
    // 默认每天凌晨2点执行
    schedule: '0 0 2 * * *',
    
    // 是否在启动时立即执行同步
    syncOnStart: true,
    
    // 是否在同步后自动构建网站
    buildAfterSync: true,
    
    // 同步超时时间(毫秒)
    timeout: 600000, // 10分钟
    
    // 重试次数
    maxRetries: 3,
    
    // 重试延迟(毫秒)
    retryDelay: 5000 // 5秒
  },
  
  // 构建配置
  build: {
    // 是否尝试完整构建
    tryFullBuild: true,
    
    // 完整构建失败后是否尝试最小化构建
    fallbackToMinimal: true,
    
    // 构建超时时间(毫秒)
    timeout: 1200000 // 20分钟
  },
  
  // 服务器配置
  server: {
    port: 9753,
    host: '0.0.0.0'
  }
};
