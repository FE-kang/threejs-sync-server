# Three.js 本地镜像服务

这个项目可以定期从Gitee拉取Three.js源码到本地，并提供Web访问界面，方便在本地环境中查看Three.js的文档和示例。

## 功能特点

- 自动定期从Gitee同步Three.js最新代码
- 提供本地Web服务器访问Three.js文档和示例
- 完善的日志记录和错误处理机制
- 可配置的同步计划和构建选项

## 系统要求

- Node.js >= 14.0.0
- Git

## 安装

1. 克隆本仓库：

```bash
git clone https://github.com/kang-git/threejs-sync-server.git
cd threejs-sync-server
```

2. 安装依赖：

```bash
npm install
```

## 配置

配置文件位于`config.js`，可以根据需要修改以下配置：

- `repoUrl`: Three.js的Gitee镜像仓库URL
- `sync.schedule`: 同步计划（Cron格式，默认值北京时间每天凌晨 2:00 ）
- `sync.syncOnStart`: 是否在启动时立即同步
- `server.port`: Web服务器端口
- `server.host`: Web服务器主机

## 使用方法

### 启动服务

```bash
npm start
```

这将启动服务，根据配置自动同步Three.js仓库并启动Web服务器, 每次自动同步之后自动构建。

### 手动同步

```bash
npm run sync
```

### 手动构建

完整构建（包含文档）：

```bash
npm run build
```

## 访问服务

启动服务后，可以通过浏览器访问：

```
http://localhost:9753
```

## 目录结构

- `sync/`: 同步相关代码
- `server/`: Web服务器和构建相关代码
- `utils/`: 工具函数
- `logs/`: 日志文件
- `three.js-repo/`: 同步的Three.js仓库
- `website/`: 构建后的网站文件

## 故障排除

### 同步失败

如果同步失败，可以尝试以下方法：

1. 检查网络连接
2. 确认Git是否正确安装
3. 查看日志文件（`logs/sync.log`）了解详细错误信息
4. 尝试手动同步：`npm run sync`

### 构建失败

如果构建失败，可以尝试以下方法：

1. 检查Three.js仓库是否正确同步
2. 查看日志文件（`logs/build.log`）了解详细错误信息
3. 可删除 three.js-repo 整个目录后重新同步并构建，第一次同步耗时会较长

## 许可证

MIT