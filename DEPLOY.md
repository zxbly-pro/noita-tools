# Noitool 离线部署说明

## 概述

Noitool 是一个 Noita 游戏工具，前端为 React SPA，后端为 Node.js（仅用于计算池 Socket.IO 调度）。

已针对离线/内网环境优化：
- 移除了每日种子等需要外网的功能
- 兼容 HTTP 和 HTTPS 访问（无需 SSL 证书即可正常使用）
- 所有核心功能（种子信息、种子搜索）纯前端运行，无需后端

## 功能说明

| 功能 | 是否需要后端 | 说明 |
|------|-------------|------|
| 种子信息查看 | 否 | 纯前端计算 |
| 种子搜索（本地） | 否 | 浏览器内 WebWorker 计算 |
| 计算池（多机协同搜索） | 是 | 需要 Node.js 后端做 Socket.IO 任务中转 |

---

## 方案一：Docker 部署（推荐）

最简单的部署方式，适合内网服务器。

### 构建与运行

```bash
# 将项目文件夹上传到 Linux 服务器后：
docker build -t noitool:latest .

# 运行
docker run -d -p 3000:3000 --name noitool noitool:latest
```

访问 `http://服务器IP:3000`。

### 自定义端口

```bash
docker run -d -p 8080:8080 -e PORT=8080 --name noitool noitool:latest
```

### 迁移镜像到其他服务器

```bash
# 在构建机器上导出镜像
docker save noitool:latest -o noitool.tar

# 拷贝到目标服务器后加载
docker load -i noitool.tar

# 在目标服务器运行
docker run -d -p 3000:3000 --name noitool noitool:latest
```

### 常用管理命令

```bash
docker logs noitool          # 查看日志
docker restart noitool       # 重启
docker stop noitool          # 停止
docker rm noitool            # 删除容器（停止后）
```

---

## 方案二：直接部署（无 Docker）

适合已有 Node.js 环境的服务器。需要 Node.js 22.16.0+。

```bash
# 安装依赖并构建
npm ci --legacy-peer-deps
npm run build

# 启动服务
node --experimental-modules ./server/standalone.mjs
```

默认监听 3000 端口，可通过环境变量 `PORT` 修改：

```bash
PORT=8080 node --experimental-modules ./server/standalone.mjs
```

配合 pm2 做进程守护：

```bash
npm install -g pm2
pm2 start ./server/standalone.mjs --name noitool --node-args="--experimental-modules"
pm2 save
pm2 startup
```

---

## 方案三：nginx 反向代理 + Node.js

适合需要域名、缓存、多服务共存等场景。

### 启动后端

```bash
PORT=3001 node --experimental-modules ./server/standalone.mjs
```

### nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # WebSocket - 计算池通信
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }

    # 静态文件
    location /assets/ {
        root /path/to/noitool/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /locales/ {
        root /path/to/noitool/build;
        expires 1d;
    }

    # SPA fallback
    location / {
        root /path/to/noitool/build;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 方案四：纯静态部署（无计算池）

如果不需要多机协同搜索，可以纯 nginx 部署，无需 Node.js。

```nginx
server {
    listen 80;
    root /path/to/noitool/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

此模式下种子信息和本地搜索正常工作，计算池功能不可用。

---

## 计算池使用说明

计算池允许多台设备协同搜索种子：

1. **搜索发起者**：在"搜索种子"页面配置规则并开始搜索，启用"集群"选项
2. **算力贡献者**：打开"计算池"页面，点击加入

所有设备需能访问同一个服务器地址。服务器仅做任务分发中转，不执行实际计算。

---

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务监听端口 |
| `NODE_ENV` | `production` | Docker 中默认为 production |
| `LOG_LEVEL` | `info` | 日志级别（debug/info/warn/error） |

---

## 一键打包脚本

项目提供了 `scripts/` 目录下的打包和部署脚本，分别对应 Windows (.bat) 和 Linux (.sh)：

### 打包脚本（在开发机上运行）

| 脚本 | 说明 | 产物 |
|------|------|------|
| `pack-docker.sh` | 打包 Docker 构建所需源码（仅 Linux） | `noitool-docker.tar.gz` |
| `pack-node.bat/.sh` | 打包 Node.js 运行所需文件 | `noitool-node.zip/.tar.gz` |
| `pack-nginx.bat/.sh` | 打包 nginx 静态文件 | `noitool-nginx.zip/.tar.gz` |
| `pack-worker.sh` | 构建计算池 Worker Docker 镜像 | `noitool-worker:latest` 镜像 |

使用前需先完成构建（Docker 包除外，Docker 在容器内构建）：

```bash
npm ci --legacy-peer-deps
npm run build
```

### 部署脚本（在目标服务器上运行）

| 脚本 | 说明 | 前置条件 |
|------|------|----------|
| `deploy-docker.bat/.sh` | 构建镜像并启动容器 | Docker |
| `deploy-node.bat/.sh` | 安装依赖并启动 Node 服务 | Node.js 22+ |
| `deploy-nginx.bat/.sh` | 复制文件并重载 nginx | nginx |

---

## 注意事项

- 项目兼容 HTTP 和 HTTPS，内网部署无需配置 SSL 证书
- 构建时如遇 npm 依赖冲突，需加 `--legacy-peer-deps` 参数
- Docker 镜像基于 `node:22.16.0-alpine`，体积较小
- 前端使用 WebWorker 进行种子计算，建议使用现代浏览器（Chrome/Edge/Firefox）
- Node.js 部署只需 `express` 和 `socket.io` 两个运行时依赖
