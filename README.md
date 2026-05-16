# Noitool

Noita 种子工具，支持：

- 单种子详情查看
- 浏览器本地搜索
- 本地多线程搜索
- 计算池协同搜索
- CLI / Docker Worker 计算节点
- 普通模式与噩梦模式种子解析

## 当前技术栈

- 前端：React + TypeScript + Vite
- 服务端：Node.js + Express + Socket.IO
- 计算执行：Web Worker、`worker_threads`、CLI Worker、Docker Worker
- 当前版本：`35.0.1`
- Node 要求：`22.16.0`

## 目录结构

```text
noitool/
├── src/                    前端源码、搜索逻辑、SeedInfo、Worker
├── server/                 轻量服务端与计算池中转
├── public/                 静态资源
├── scripts/                打包与部署脚本
├── mods/                   Noita mods 数据（含 nightmare）
├── data/                   Noita 解包数据
├── consoleBuild.cjs        CLI Worker 打包脚本
├── Dockerfile              主站 Docker 镜像
├── Dockerfile.worker       Worker Docker 镜像
├── search.package.json     console-build 产物模板包
└── package.json
```

## 功能概览

| 功能 | 运行位置 | 是否依赖后端 |
| --- | --- | --- |
| 种子详情查看 | 浏览器 | 否 |
| 本地种子搜索 | 浏览器 + Web Worker | 否 |
| 本地多线程搜索 | 浏览器 / Node Worker | 否 |
| 计算池协同搜索 | 浏览器 + 服务端 + Worker | 是 |
| CLI Worker | Node.js | 是 |

## 开发

安装依赖：

```bash
npm ci --legacy-peer-deps
```

启动开发环境：

```bash
npm run dev
```

说明：

- Vite 默认运行在 `http://localhost:3000`
- Node 服务端默认运行在 `http://localhost:3001`
- `/api` 与 `/socket.io` 会代理到 `3001`

## 构建

前端构建：

```bash
npm run build
```

CLI Worker 构建：

```bash
npm run console-build
```

运行 CLI Worker：

```bash
npm run console-search -- --url http://127.0.0.1:3000 --cores 4
```

## 运行方式

### 1. 直接运行 Node 服务端

```bash
PORT=3000 BASE_PATH= LOG_LEVEL=info LOG_TIMEZONE=GMT+8 \
node --experimental-modules ./server/standalone.mjs
```

说明：

- 代码内默认端口是 `3001`
- 部署脚本默认端口是 `3000`
- 日志时间格式为 `yyyy-MM-dd HH:mm:ss`
- 日志时区默认是 `GMT+8`

### 2. Docker 主站

```bash
docker build -t noitool:latest .
docker run -d -p 3000:3000 --name noitool noitool:latest
```

### 3. Docker Worker

```bash
docker build -t noitool-worker:latest -f Dockerfile.worker .
docker run -d --name noitool-worker \
  -e NOITOOL_URL=http://127.0.0.1:3000 \
  -e NOITOOL_CORES=4 \
  noitool-worker:latest
```

## 子路径部署

项目使用相对资源路径和 `HashRouter`，支持运行时通过 `BASE_PATH` 部署到子路径，无需重新构建。

示例：

```bash
BASE_PATH=/noita PORT=3000 node --experimental-modules ./server/standalone.mjs
```

访问路径：

```text
http://server:3000/noita/#/search
```

## 打包与部署脚本

详见 [scripts/README.md](scripts/README.md)。

常用脚本：

| 脚本 | 作用 | 产物 |
| --- | --- | --- |
| `scripts/pack-node.sh` / `.bat` | 打包 Node.js 离线部署包 | `noitool-node.tar.gz` / `.zip` |
| `scripts/pack-nginx.sh` / `.bat` | 打包 nginx 静态部署包 | `noitool-nginx.tar.gz` / `.zip` |
| `scripts/pack-docker.sh` | 打包 Docker 构建源码包 | `noitool-docker.tar.gz` |
| `scripts/pack-worker.sh` | 构建 Worker Docker 镜像 | 本地镜像 `noitool-worker:latest` |

注意：

- `pack-worker.sh` 不会直接生成 `tar.gz`
- 如需导出 Worker 镜像，请手动执行 `docker save`

## 环境变量

### 服务端

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | 服务端监听端口 |
| `BASE_PATH` | 空 | 子路径部署前缀 |
| `NODE_ENV` | `production` | 运行环境 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `LOG_TIMEZONE` | `GMT+8` | 日志时区 |

### Worker

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NOITOOL_URL` | `http://zxbly.com:3000` | Worker 连接的主站地址 |
| `NOITOOL_CORES` | `0` | `0` 表示使用全部核心，非 `0` 表示指定核心数 |

## 计算池说明

服务端只负责：

- 托管前端静态文件
- 提供 `/api/cluster_stats`
- 提供 `/api/session`
- 提供 Socket.IO 中转
- 管理 Host / Worker 注册、任务分发、结果回收

真正的搜索计算仍然发生在：

- 浏览器本地 Worker
- Node `worker_threads`
- CLI Worker
- Docker Worker

为避免旧版本 Worker 混入新搜索，当前计算池注册阶段会按完整版本号校验，版本不一致会被直接拒绝。

## 噩梦模式说明

噩梦模式不是普通模式上的简单布尔开关，核心逻辑依赖：

- `mods/nightmare/`
- 独立世界地图
- 独立圣山布局
- 独立入口法杖生成
- 独立部分 Perk / 药水 / 敌人生成逻辑

详细说明见：

- [普通模式与噩梦模式差异说明.md](<普通模式与噩梦模式差异说明.md>)
- [项目结构与维护指南.md](<项目结构与维护指南.md>)

## 文档状态

当前仓库内这些项目文档已按现状同步：

- `README.md`
- `scripts/README.md`
- `项目结构与维护指南.md`
- `普通模式与噩梦模式差异说明.md`

## 常见问题

### 为什么 `npm ci` 需要 `--legacy-peer-deps`

当前依赖树里仍存在 React 19 相关 peer dependency 兼容问题，直接使用默认解析可能失败。

### 为什么本地看到的计算池状态大部分为空

如果只是本地主站加浏览器，没有额外 Host / Worker 接入，那么：

- `hosts = 0`
- `workers = 0`
- `pendingJobs = []`

这是正常现象，不表示服务异常。

### 为什么 GitHub Actions 之前会报 `Permission denied`

因为仓库中的 `.sh` 脚本之前缺少可执行权限。当前主要脚本已经修正为可执行，并且工作流中也显式使用了 `bash ./scripts/*.sh`。
