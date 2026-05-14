# Noitool 项目文档

## 项目概述

Noita 游戏种子工具，支持种子信息查看、种子搜索、多机协同计算池。

已针对离线/内网环境优化：
- 兼容 HTTP 和 HTTPS（无需 SSL 证书）
- 核心功能纯前端运行，无需后端
- 计算池功能需要 Node.js 后端做 Socket.IO 任务中转

## 项目结构

```
noitool/
├── src/                        前端源码（React + TypeScript）
│   ├── components/             UI 组件
│   ├── services/               业务逻辑、种子计算引擎
│   │   └── SeedInfo/           种子信息核心（含 WASM 模块）
│   └── workers/                Web Worker（浏览器端并行计算）
├── server/                     后端（仅计算池调度）
│   ├── standalone.mjs          服务入口（静态文件 + Socket.IO）
│   ├── logger.mjs              日志模块
│   └── io/compute.mjs          计算池任务分发逻辑
├── public/                     静态资源（主题CSS、图标、本地化）
├── scripts/                    打包和部署脚本
├── consoleBuild.cjs            CLI Worker 构建脚本（esbuild）
├── search.package.json         CLI Worker 独立 package.json
├── Dockerfile                  主服务 Docker 构建
├── Dockerfile.worker           计算池 Worker Docker 构建
├── vite.config.ts              Vite 构建配置
├── tsconfig.json               TypeScript 配置
├── tsconfig.node.json          Node 相关 TS 配置
├── index.html                  SPA 入口
└── package.json                项目依赖和脚本
```

## 功能模块

| 功能 | 运行位置 | 是否需要后端 |
|------|---------|-------------|
| 种子信息查看 | 浏览器 | 否 |
| 种子搜索（本地） | 浏览器 WebWorker | 否 |
| 计算池（多机协同） | 浏览器 + 服务器 | 是（Socket.IO） |
| CLI Worker | Node.js | 是（连接服务器） |

## 环境要求

- Node.js 22.16.0+
- npm 10+
- 现代浏览器（Chrome/Edge/Firefox，需支持 WebWorker + WASM）

---

## 启动模块

### 开发模式

```bash
npm run dev
```

同时启动：
- Node.js 后端（端口 3001）
- Vite 开发服务器（端口 3000，代理 `/socket.io` 和 `/api` 到 3001）

访问 `http://localhost:3000`。

### 生产模式

```bash
npm run start
```

启动 standalone 服务器（默认端口 3001，通过 `PORT` 环境变量修改）。
生产部署时 Dockerfile 设置 `PORT=3000`。

### CLI Worker（计算池客户端）

```bash
npm run console-search -- --url http://zxbly.com:3000 --cores 4
```

---

## 构建要求

### 前端构建

依赖 Vite + TypeScript + React，构建产物为纯静态文件。

### 后端

无需构建，`server/` 下的 `.mjs` 文件直接由 Node.js 运行。
运行时仅依赖 `express` 和 `socket.io`。

### CLI Worker 构建

使用 esbuild 打包 `src/consoleSearch.ts` 为独立 Node.js ESM 包。

---

## 编译步骤

### 1. 安装依赖

```bash
npm ci --legacy-peer-deps
```

`--legacy-peer-deps` 是必须的（react-slider 不兼容 React 19）。

### 2. 前端编译

```bash
npm run build
```

执行 `tsc && vite build`，产物输出到 `build/` 目录。

### 3. CLI Worker 编译（可选）

```bash
npm run console-build
```

产物输出到 `console-build/` 目录。

---

## 部署方案

### 方案一：Docker（推荐）

```bash
docker build -t noitool:latest .
docker run -d -p 3000:3000 --name noitool noitool:latest
```

迁移到离线服务器：

```bash
docker save noitool:latest -o noitool.tar
# 目标机器
docker load -i noitool.tar
docker run -d -p 3000:3000 --name noitool noitool:latest
```

### 方案二：Node.js 直接部署

```bash
npm ci --legacy-peer-deps
npm run build
PORT=3000 node --experimental-modules ./server/standalone.mjs
```

或使用打包脚本生成离线部署包（含 node_modules）：

```bash
./scripts/pack-node.sh
# 产物 noitool-node.tar.gz 解压即可运行，无需网络
```

### 方案三：nginx 反向代理 + Node.js

Node.js 后端处理 Socket.IO，nginx 做反代和静态文件服务：

```bash
PORT=3001 node --experimental-modules ./server/standalone.mjs
```

```nginx
server {
    listen 80;
    server_name _;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
    }

    location / {
        root /path/to/noitool/build;
        try_files $uri $uri/ /index.html;
    }
}
```

### 方案四：纯静态（无计算池）

只需将 `build/` 目录放到任意 Web 服务器，计算池功能不可用。

---

## 子路径部署

默认部署在根路径 `/`。支持部署到子路径（如 `http://server/noita`），**无需重新构建**，运行时通过环境变量指定。

项目使用 HashRouter + 相对资源路径，URL 格式为 `http://server/noita/#/search`。

### Docker 子路径部署

```bash
docker run -d -p 3000:3000 \
  -e BASE_PATH=/noita \
  --name noitool noitool:latest
```

访问 `http://服务器IP:3000/noita/`。

### Node.js 子路径部署

```bash
BASE_PATH=/noita node --experimental-modules ./server/standalone.mjs
```

访问 `http://服务器IP:3001/noita/`。

### nginx 子路径部署（反代到 Node.js）

Node.js 后端以根路径运行：

```bash
node --experimental-modules ./server/standalone.mjs
```

nginx 将子路径转发到后端：

```nginx
location /noita/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### nginx 纯静态子路径（无计算池）

```nginx
location /noita/ {
    alias /path/to/noitool/build/;
    index index.html;
}
```

由于使用 HashRouter，不需要 `try_files` 回退规则。

### 注意事项

- `BASE_PATH` 必须以 `/` 开头，不以 `/` 结尾（如 `/noita`）
- 不设置 `BASE_PATH` 时默认为根路径 `/`，行为不变
- 同一份构建产物可部署到任意路径，无需重新编译
- URL 中 `#` 后面是前端路由（如 `/noita/#/search`）

---

## 计算池 Worker Docker 镜像

```bash
# 构建
docker build -t noitool-worker:latest -f Dockerfile.worker .

# 运行
docker run -d --name noitool-worker \
  -e NOITOOL_URL=http://zxbly.com:3000 \
  -e NOITOOL_CORES=4 \
  noitool-worker:latest
```

---

## 打包脚本

位于 `scripts/` 目录，详见 [scripts/README.md](scripts/README.md)。

| 脚本 | 说明 | 产物 |
|------|------|------|
| `pack-docker.sh` | 打包 Docker 构建源码 | `noitool-docker.tar.gz` |
| `pack-node.bat/.sh` | 打包 Node.js 离线部署包 | `noitool-node.tar.gz`（含 node_modules） |
| `pack-nginx.bat/.sh` | 打包 nginx 静态文件 | `noitool-nginx.tar.gz` |
| `pack-worker.sh` | 构建 Worker Docker 镜像 | `noitool-worker:latest` |

---

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001`（开发）/ `3000`（Docker） | 后端服务端口 |
| `NODE_ENV` | `production` | 运行环境 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `BASE_PATH` | 空（根路径） | 子路径前缀（运行时指定，如 `/noita`） |
| `NOITOOL_URL` | `http://zxbly.com:3000` | Worker 连接的服务器地址 |
| `NOITOOL_CORES` | `0`（全部） | Worker 使用的 CPU 核心数 |

---

## npm scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（后端 + Vite） |
| `npm run build` | 前端编译（tsc + vite build） |
| `npm run start` | 生产模式启动后端 |
| `npm run console-build` | 编译 CLI Worker |
| `npm run console-search` | 运行 CLI Worker |
| `npm run test` | 运行测试（vitest） |

---

## 注意事项

- 项目兼容 HTTP 和 HTTPS，内网部署无需 SSL 证书
- `npm ci` 必须加 `--legacy-peer-deps`
- Docker 镜像基于 `node:22.16.0-alpine`
- 使用 HashRouter，URL 格式为 `http://server/#/path`
- 同一份构建产物可部署到任意子路径，运行时通过 `BASE_PATH` 环境变量指定
- `node_modules` 包含平台相关二进制，Windows 和 Linux 不通用
