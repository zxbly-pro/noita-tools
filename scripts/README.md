# 部署脚本使用说明

## 目录结构

```text
scripts/
├── pack-docker.sh           打包 Docker 部署源码包（Linux/macOS）
├── pack-node.bat/.sh        打包 Node.js 离线部署包
├── pack-nginx.bat/.sh       打包 nginx 静态部署包
├── pack-worker.sh           构建计算池 Worker Docker 镜像（Linux/macOS）
├── deploy-docker.bat/.sh    在目标机器部署 Docker 版本
├── deploy-node.bat/.sh      在目标机器部署 Node.js 版本
├── deploy-nginx.bat/.sh     在目标机器部署 nginx 静态版本
└── install-node.sh          在 Linux 机器安装 Node.js 22
```

## 使用流程

### 第一步：在开发机上构建

Node.js 包和 nginx 包都依赖前端构建产物：

```bash
npm ci --legacy-peer-deps
npm run build
```

如果还要构建 CLI Worker 产物：

```bash
npm run console-build
```

### 第二步：按目标形态打包

```bash
./scripts/pack-docker.sh
./scripts/pack-node.sh
./scripts/pack-nginx.sh
./scripts/pack-worker.sh
```

Windows 下使用对应的 `.bat` 文件：

```bat
scripts\pack-node.bat
scripts\pack-nginx.bat
```

## 打包方式对比

| 方式 | 是否支持计算池 | 产物 | 说明 |
| --- | --- | --- | --- |
| Docker | 支持 | Docker 构建源码包 | 目标机上再构建主站镜像 |
| Node.js | 支持 | `noitool-node.tar.gz` / `noitool-node.zip` | 包含 `build/`、`server/` 和运行时依赖 |
| nginx | 不支持 | `noitool-nginx.tar.gz` / `noitool-nginx.zip` | 仅静态文件，不能使用 Socket.IO 计算池 |
| Worker | 仅 Worker | 本地 Docker 镜像 `noitool-worker:latest` | `pack-worker.sh` 不直接生成压缩包 |

## Node.js 部署包

### 打包内容

当前 Node.js 部署包包含：

```text
noitool/
├── package.json
├── build/
└── server/
    ├── standalone.mjs
    ├── logger.mjs
    └── io/
        └── compute.mjs
```

### 运行方式

```bash
cd noitool
./deploy-node.sh
```

或手动：

```bash
NODE_ENV=production PORT=3000 BASE_PATH= \
LOG_LEVEL=info LOG_TIMEZONE=GMT+8 \
node --experimental-modules ./server/standalone.mjs
```

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000`（deploy 脚本） | 服务端口 |
| `BASE_PATH` | 空 | 子路径部署前缀，例如 `/noita` |
| `NODE_ENV` | `production` | 运行环境 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `LOG_TIMEZONE` | `GMT+8` | 服务端日志时区 |

## nginx 静态部署包

### 适用场景

- 只查看种子详情
- 只使用浏览器本地搜索
- 不需要计算池、Socket.IO、CLI Worker

### 限制

- 不支持 `/socket.io`
- 不支持 `/api/cluster_stats`
- 不支持 `/api/session`
- 不能加入或提供计算池

## Worker Docker 镜像

### 构建

```bash
./scripts/pack-worker.sh
```

实际行为是：

- 执行 `docker build -t noitool-worker:latest -f Dockerfile.worker .`
- 生成本地镜像 `noitool-worker:latest`

它不会自动生成 `tar.gz`。如需离线迁移，请手动执行：

```bash
docker save noitool-worker:latest -o noitool-worker.tar
```

### 运行

```bash
docker run -d --name noitool-worker \
  -e NOITOOL_URL=http://127.0.0.1:3000 \
  -e NOITOOL_CORES=4 \
  noitool-worker:latest
```

### Worker 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NOITOOL_URL` | `http://zxbly.com:3000` | 主站地址 |
| `NOITOOL_CORES` | `0` | `0` 表示使用全部核心，非 `0` 表示指定核心数 |

## GitHub Actions

当前 [.github/workflows/build.yml](../.github/workflows/build.yml) 关键流程是：

1. `npm ci --legacy-peer-deps`
2. `npx tsc --noEmit`
3. `npm run build`
4. `npm run console-build`
5. `bash ./scripts/pack-node.sh`
6. `bash ./scripts/pack-nginx.sh`
7. 上传 Node 包、nginx 包、`console-build/` Worker 产物

注意：

- GitHub Actions 上传的 Worker 产物是 `console-build/` 目录
- 不是 `noitool-worker:latest` Docker 镜像
- 工作流显式使用 `bash`，即使权限位异常也更稳妥

## 常见问题

### 为什么之前 GitHub Actions 会报 `Permission denied`

因为 `.sh` 脚本缺少可执行权限时，直接 `./scripts/xxx.sh` 会失败。当前仓库已经修正主要脚本权限，但 CI 仍保留 `bash ./scripts/*.sh` 以降低风险。

### 为什么 `pack-worker.sh` 没有生成压缩包

因为它的职责是“构建 Worker Docker 镜像”，不是“导出镜像包”。导出请手动执行：

```bash
docker save noitool-worker:latest -o noitool-worker.tar
```

### 子路径部署是否需要重新构建

不需要。项目使用相对资源路径和 `HashRouter`，运行时通过 `BASE_PATH` 指定即可。

### Windows 能否直接运行 `.sh`

不能直接用 `cmd`。请使用 Git Bash、WSL，或者改用对应的 `.bat` 脚本。
