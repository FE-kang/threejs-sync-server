import { clearLog, clearAllLogs } from './logger';

/**
 * 清空日志文件的命令行工具
 */
function main(): void {
  const args = process.argv.slice(2);
  
  // 如果没有参数，显示帮助信息
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }
  
  // 清空所有日志
  if (args[0] === '--all' || args[0] === '-a') {
    const results = clearAllLogs();
    if (results.success.length > 0) {
      console.log(`成功清空 ${results.success.length} 个日志文件: ${results.success.join(', ')}`);
    }
    if (results.failed.length > 0) {
      console.error(`清空 ${results.failed.length} 个日志文件失败:`);
      results.failed.forEach(item => {
        console.error(`  - ${item.file}: ${item.error}`);
      });
    }
    return;
  }
  
  // 清空指定的日志文件
  const filename = args[0] as string;
  const success = clearLog(filename);
  
  if (success) {
    console.log(`成功清空日志文件: ${filename}.log`);
  } else {
    console.error(`清空日志文件失败: ${filename}.log 不存在或无法写入`);
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
清空日志文件工具

用法:
  node clear-logs.js [选项] [文件名]

选项:
  --all, -a     清空所有日志文件
  --help, -h    显示此帮助信息

示例:
  node clear-logs.js sync     # 清空 sync.log 文件
  node clear-logs.js index    # 清空 index.log 文件
  node clear-logs.js --all    # 清空所有日志文件
  `);
}

// 执行主函数
main();