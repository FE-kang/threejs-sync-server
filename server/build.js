/**
 * 批量替换 website/docs、examples、manual 下 index.html 文件中的 threejs.org 链接
 */
async function fixIndexHtmlLinks() {
  const targetDirs = ['docs', 'examples', 'manual'];
  for (const dir of targetDirs) {
    const indexPath = path.join(OUTPUT_DIR, dir, 'index.html');
    const exists = await fs.pathExists(indexPath);
    if (exists) {
      let content = await fs.readFile(indexPath, 'utf8');
      const replaced = content.replace(/href="https:\/\/threejs\.org"/g, 'href="../index.html"');
      if (replaced !== content) {
        await fs.writeFile(indexPath, replaced, 'utf8');
        logger.info(`已修正 ${dir}/index.html 中 threejs.org 链接`);
      } else {
        logger.info(`${dir}/index.html 未发现需要替换的链接`);
      }
    } else {
      logger.warn(`${dir}/index.html 文件不存在，跳过`);
    }
  }
}

/**
 * 修改 prettify.js 中的 CDN 资源路径为本地路径
 */
async function fixFfmpegPath() {
  logger.info('开始修改 prettify.js 中的 CDN 资源路径...');
  
  try {
    
    const publicFfmpeg = path.join(__dirname, '../public/ffmpeg/ffmpeg.min.js');
    const editorJsDir = path.join(OUTPUT_DIR, 'editor/js');
    const editorIndex = path.join(OUTPUT_DIR, 'editor/index.html');
    const hasFfmpeg = await fs.pathExists(publicFfmpeg);
    if (hasFfmpeg) {
      await fs.ensureDir(editorJsDir);
      await fs.copy(publicFfmpeg, path.join(editorJsDir, 'ffmpeg.min.js'), { overwrite: true });
      const editorExists = await fs.pathExists(editorIndex);
      if (editorExists) {
        let editorHtml = await fs.readFile(editorIndex, 'utf8');
        const replacedEditorHtml = editorHtml.replace(
          /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@ffmpeg\/ffmpeg@[^"']+\/dist\/ffmpeg\.min\.js"><\/script>/,
          '<script src="js/ffmpeg\.min\.js"><\/script>'
        );
        if (replacedEditorHtml !== editorHtml) {
          await fs.writeFile(editorIndex, replacedEditorHtml, 'utf8');
          logger.info('已修改 editor/index.html 中的 ffmpeg 引用为本地路径');
        } else {
          logger.info('editor/index.html 中未找到需要替换的 ffmpeg 引用');
        }
      } else {
        logger.warn('editor/index.html 文件不存在，跳过 ffmpeg 引用替换');
      }
    } else {
      logger.warn('public/ffmpeg/ffmpeg.min.js 不存在，无法本地化 ffmpeg 引用');
    }
  } catch (error) {
    logger.error('修改 ffmpeg.min.js 时出错:', error);
    throw error;
  }
}

/**
 * 修改文档中的源码链接为本地链接
 */
async function fixSourceLinks() {
  logger.info('开始修改文档源码链接...');
  
  try {
    const docsDir = path.join(OUTPUT_DIR, 'oldDocs');
    // 递归获取所有 HTML 文件
    const files = await fs.readdir(docsDir, { recursive: true });
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    for (const file of htmlFiles) {
      const filePath = path.join(docsDir, file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // 计算从当前文档到根目录的相对路径
      const relativePath = path.relative(path.dirname(filePath), OUTPUT_DIR);
      const relativeToRoot = relativePath.split(path.sep).join('/');
      
      // 替换 GitHub 源码链接为 codeview 链接
      const oldPattern = /\[link:https:\/\/github\.com\/mrdoob\/three\.js\/blob\/master\/src\/([^\]]+)\]/g;
      const newPattern = `[link:${relativeToRoot}/codeview/index.html?src=src/$1]`;
      
      const replaced = content.replace(oldPattern, newPattern);
      if (replaced !== content) {
        await fs.writeFile(filePath, replaced, 'utf8');
        logger.info(`已修正源码链接: ${file}`);
      }
    }
    
    logger.info('文档源码链接修改完成');
  } catch (error) {
    logger.error('修改文档源码链接失败:', error);
    throw error;
  }
}
/**
 * Three.js官网打包脚本
 * 该脚本用于构建与Three.js官网一致的本地版本
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { createLogger } = require('../utils/logger/logger');

// 创建日志记录器
const logger = createLogger('build', {
  level: 'info',
  console: true
});

// Three.js仓库路径
const THREEJS_REPO_PATH = path.join(__dirname, '../three.js-repo');
// 输出目录
const OUTPUT_DIR = path.join(__dirname, '../website');

/**
 * 执行命令并记录输出
 * @param {string} command 要执行的命令
 * @param {string} cwd 工作目录
 */
function runCommand(command, cwd, timeout = 600000) { // 默认10分钟超时
  logger.info(`执行命令: ${command}`);
  logger.info(`工作目录: ${cwd}`);
  logger.info(`超时设置: ${timeout / 1000}秒`);
  
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: timeout // 添加超时设置
    });
    // 输出命令执行过程中的内容到日志
    if (output) {
      logger.info(`命令输出: \n${output}`);
    }
    logger.info(`命令执行成功: ${command}`);
    return output;
  } catch (error) {
    // 如果有标准输出或错误输出，也记录到日志
    if (error.stdout) {
      logger.error(`命令标准输出: \n${error.stdout.toString()}`);
    }
    if (error.stderr) {
      logger.error(`命令错误输出: \n${error.stderr.toString()}`);
    }
    if (error.signal === 'SIGTERM') {
      logger.error(`命令执行超时: ${command}`);
      throw new Error(`命令执行超时: ${command}`);
    } else {
      logger.error(`命令执行失败: ${command}`);
      logger.error(error.message);
      throw error;
    }
  }
}

/**
 * 构建Three.js库文件
 */
async function buildThreeJs() {
  logger.info('开始构建Three.js库文件...');
  
  try {
    // 检查是否已安装依赖
    const nodeModulesPath = path.join(THREEJS_REPO_PATH, 'node_modules');
    const hasNodeModules = await fs.pathExists(nodeModulesPath);
    
    if (!hasNodeModules) {
      logger.info('安装Three.js依赖...');
      try {
        // 使用--no-fund --no-audit参数加速安装过程
        runCommand('npm install --no-fund --no-audit --loglevel=error', THREEJS_REPO_PATH, 1200000); // 20分钟超时
      } catch (installError) {
        logger.warn('完整依赖安装失败，尝试使用--production标志安装最小依赖...');
        // 如果完整安装失败，尝试只安装生产依赖
        runCommand('npm install --production --no-fund --no-audit --loglevel=error', THREEJS_REPO_PATH, 600000);
      }
    }
    
    // 构建Three.js
    logger.info('构建Three.js...');
    runCommand('npm run build', THREEJS_REPO_PATH, 600000);
    
    logger.info('Three.js库文件构建完成');
  } catch (error) {
    logger.error('构建Three.js库文件失败:', error);
    logger.warn('尝试使用预构建的文件...');
    
    // 检查是否有build目录
    const buildDir = path.join(THREEJS_REPO_PATH, 'build');
    const hasBuildDir = await fs.pathExists(buildDir);
    
    if (!hasBuildDir) {
      logger.error('没有找到预构建文件，构建失败');
      throw error;
    } else {
      logger.info('找到预构建文件，跳过构建步骤');
    }
  }
}

/**
 * 构建Three.js文档
 */
async function buildDocs() {
  logger.info('开始构建Three.js文档...');
  
  try {
    // 构建文档
    runCommand('npm run build-docs', THREEJS_REPO_PATH);
    
    logger.info('Three.js文档构建完成');
  } catch (error) {
    logger.error('构建Three.js文档失败:', error);
    throw error;
  }
}

/**
 * 复制网站文件到输出目录
 */
async function copyWebsiteFiles() {
  logger.info('开始复制网站文件...');
  
  try {
    // 确保输出目录存在
    await fs.ensureDir(OUTPUT_DIR);

    // 复制必要的目录
    const dirsToCopy = ['build', 'docs', 'editor', 'examples', 'manual', 'playground', 'files', 'src'];

    for (const dir of dirsToCopy) {
      const srcDir = path.join(THREEJS_REPO_PATH, dir);
      const destDir = path.join(OUTPUT_DIR, dir);
      logger.info(`复制目录: ${dir}`);
      await fs.copy(srcDir, destDir);
    }

    // 复制 public/index.html 到 website 根目录
    const publicDir = path.join(__dirname, '../public');
    const publicIndex = path.join(publicDir, 'index.html');
    const websiteIndex = path.join(OUTPUT_DIR, 'index.html');
    const publicProjects = path.join(publicDir, 'projects');
    const publicCodeview = path.join(publicDir, 'codeview');
    const publicOldDocs = path.join(publicDir, 'oldDocs');
    const websiteFilesProjects = path.join(OUTPUT_DIR, 'files', 'projects');
    const websiteCodeview = path.join(OUTPUT_DIR, 'codeview');
    const websiteOldDocs = path.join(OUTPUT_DIR, 'oldDocs');
    const publicExists = await fs.pathExists(publicDir);
    if (publicExists) {
      // 复制 index.html
      const indexExists = await fs.pathExists(publicIndex);
      if (indexExists) {
        logger.info('复制 public/index.html 到 website 根目录');
        await fs.copy(publicIndex, websiteIndex, { overwrite: true });
      } else {
        logger.warn('public/index.html 不存在，跳过复制');
      }

      // 复制 projects 目录到 website/files/projects
      const projectsExists = await fs.pathExists(publicProjects);
      if (projectsExists) {
        // 确保目标目录存在
        await fs.ensureDir(path.join(OUTPUT_DIR, 'files'));
        logger.info('复制 public/projects 到 website/files/projects');
        await fs.copy(publicProjects, websiteFilesProjects, { overwrite: true });
      } else {
        logger.warn('public/projects 目录不存在，跳过复制');
      }

      // 复制 codeview 目录到 website/codeview
      const codeviewExists = await fs.pathExists(publicCodeview);
      if (codeviewExists) {
        logger.info('复制 public/codeview 到 website/codeview');
        await fs.copy(publicCodeview, websiteCodeview, { overwrite: true });
      } else {
        logger.warn('public/codeview 目录不存在，跳过复制');
      }

      // 复制 oldDocs 目录到 website/oldDocs
      const oldDocsExists = await fs.pathExists(publicOldDocs);
      if (oldDocsExists) {
        logger.info('复制 public/oldDocs 到 website/oldDocs');
        await fs.copy(publicOldDocs, websiteOldDocs, { overwrite: true });
      } else {
        logger.warn('public/oldDocs 目录不存在，跳过复制');
      }
    } else {
      logger.warn('public 目录不存在，跳过复制');
    }

    logger.info('网站文件复制完成');
  } catch (error) {
    logger.error('复制网站文件失败:', error);
    throw error;
  }
}

/**
 * 将 manual/index.html 中的 href="../docs/" 替换为 href="../oldDocs/"
 */
async function fixManualDocsLink() {
  const manualIndexPath = path.join(OUTPUT_DIR, 'manual', 'index.html');
  const exists = await fs.pathExists(manualIndexPath);
  if (exists) {
    let content = await fs.readFile(manualIndexPath, 'utf8');
    const replaced = content.replace(/href="\.\.\/docs\/"/g, 'href="../oldDocs/#api/zh/animation/AnimationAction"');
    if (replaced !== content) {
      await fs.writeFile(manualIndexPath, replaced, 'utf8');
      logger.info('已修正 manual/index.html 中的 docs 链接为 oldDocs');
    } else {
      logger.info('manual/index.html 未发现需要替换的 docs 链接');
    }
  } else {
    logger.warn('manual/index.html 文件不存在，跳过');
  }
}

/**
 * 主函数
 */
async function main() {
  logger.info('开始构建Three.js官网...');
  
  try {
    // 检查Three.js仓库是否存在
    const repoExists = await fs.pathExists(THREEJS_REPO_PATH);
    
    if (!repoExists) {
      logger.error(`Three.js仓库不存在: ${THREEJS_REPO_PATH}`);
      return;
    }
    
    // 构建Three.js库文件
    await buildThreeJs();
    
    // 构建文档
    await buildDocs();
    
    // 复制网站文件
    await copyWebsiteFiles();

    // 修复 website中 各 index.html 页面中的链接
    await fixIndexHtmlLinks();
    
    // 修复文档中的源码链接
    await fixSourceLinks();

    // 在 main() 中调用
    await fixManualDocsLink();
    
    // 修改manual首页 docs 超链接到中文旧文档
    await fixManualDocsLink();

    await fixFfmpegPath();
    
    logger.info(`Three.js官网构建完成，输出目录: ${OUTPUT_DIR}`);
  } catch (error) {
    logger.error('构建Three.js官网失败:', error);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  main();
}

module.exports = { main };