# 部署脚本使用说明

## 目录结构

```
scripts/
├── pack-docker.sh           打包 Docker 部署包（仅 Linux/macOS）
├── pack-node.bat/.sh        打包 Node.js 部署包
├── pack-nginx.bat/.sh       打包 nginx 静态部署包
├── pack-worker.sh           打包计算池 CLI Worker（仅 Linux）
├── deploy-docker.bat/.sh    Docker 部署（目标服务器）
├── deploy-node.bat/.sh      Node.js 部署（目标服务器）
└── deploy-nginx.bat/.sh     nginx 部署（目标服务器）
```

## 使用流程

### 第一步：在开发机上打包

在项目根目录运行打包脚本。Node/nginx 包需先构建，Docker 包含源码在容器内构建：

```bash
# 构建前端（Docker 方式不需要这步）
npm ci --legacy-peer-deps
npm run build

# 选择一种方式打包
./scripts/pack-docker.sh    # 产物: noitool-docker.tar.gz（仅 Linux/macOS）
./scripts/pack-node.sh      # 产物: noitool-node.tar.gz
./scripts/pack-nginx.sh     # 产物: noitool-nginx.tar.gz
./scripts/pack-worker.sh    # 产物: noitool-worker.tar.gz（计算池客户端）
```

Windows 下使用对应的 .bat 文件（pack-node.bat / pack-nginx.bat），产物为 .zip 格式。

### 第二步：上传到目标服务器

```bash
scp noitool-*.tar.gz user@server:/opt/
```

### 第三步：在目标服务器解压并部署

```bash
cd /opt
mkdir noitool && tar -xzf noitool-*.tar.gz -C noitool
cd noitool
```

然后运行对应的部署脚本（见下方各方案说明）。

---

## 方案对比

| 方案 | 计算池 | 前置条件 | 部署包大小 | 适用场景 |
|------|--------|----------|-----------|----------|
| Docker | 支持 | Docker | 较大（含源码） | 最简单，推荐 |
| Node.js | 支持 | Node.js 22+ | 中等（build+server） | 已有 Node 环境 |
| nginx | 不支持 | nginx | 最小（仅静态文件） | 只需查看/本地搜索 |

---

## Docker 部署

### 打包内容

完整源码（在容器内编译构建）。

### 部署步骤

```bash
cd noitool
./deploy-docker.sh
```

脚本会自动：构建镜像 → 停止旧容器 → 启动新容器。

### 自定义端口

```bash
PORT=8080 ./deploy-docker.sh
```

### 子路径部署

```bash
BASE_PATH=/noita ./deploy-docker.sh
```

### 迁移镜像到无网络服务器

```bash
docker save noitool:latest -o noitool.tar
# 拷贝到目标机器
docker load -i noitool.tar
docker run -d -p 3000:3000 --name noitool noitool:latest
```

---

## Node.js 部署

### 打包内容

```
noitool/
├── package.json          精简版（仅 express + socket.io）
├── server/
│   ├── standalone.mjs    主服务入口
│   ├── logger.mjs        日志模块
│   └── io/compute.mjs    计算池逻辑
└── build/                前端静态文件
```

### 部署步骤

```bash
cd noitool
./deploy-node.sh
```

脚本会自动：安装依赖 → 启动服务（默认端口 3000）。

### 自定义端口

```bash
PORT=8080 ./deploy-node.sh
```

### 子路径部署

```bash
BASE_PATH=/noita ./deploy-node.sh
```

### 后台运行（pm2）

```bash
npm install -g pm2
PORT=3000 BASE_PATH=/noita pm2 start ./server/standalone.mjs --name noitool \
  --node-args="--experimental-modules"
pm2 save && pm2 startup
```

---

## nginx 静态部署

### 打包内容

```
noitool/
├── build/        前端静态文件
└── nginx.conf    nginx 配置模板
```

### 部署步骤

```bash
cd noitool
sudo ./deploy-nginx.sh
```

脚本会自动：复制文件到 nginx 目录 → 重载 nginx。

### 注意

- 此模式下计算池功能不可用（无 Socket.IO 后端）
- 种子信息查看和本地搜索正常工作
- 如需自定义路径，编辑脚本中的 `NGINX_HTML` 和 `NGINX_CONF` 变量

---

## 计算池 Worker 客户端（Docker）

用于在多台 Linux 机器上运行无浏览器的计算节点，为搜索任务提供算力。

### 构建镜像

```bash
# 在项目根目录（或通过 pack-worker.sh）
./scripts/pack-worker.sh
```

或手动构建：

```bash
docker build -t noitool-worker:latest -f Dockerfile.worker .
```

### 运行

```bash
docker run -d --name noitool-worker noitool-worker:latest
```

### 自定义参数

```bash
docker run -d --name noitool-worker \
  -e NOITOOL_URL=http://192.168.1.100:3000 \
  -e NOITOOL_CORES=4 \
  noitool-worker:latest
```

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `NOITOOL_URL` | `http://zxbly.com:3000` | 服务器地址 |
| `NOITOOL_CORES` | `0`（全部核心） | 使用的 CPU 核心数 |

### 迁移镜像到其他服务器

```bash
docker save noitool-worker:latest -o noitool-worker.tar
# 拷贝到目标机器
docker load -i noitool-worker.tar
docker run -d --name noitool-worker noitool-worker:latest
```

### 批量部署多个 Worker

```bash
for i in 1 2 3; do
  docker run -d --name noitool-worker-$i \
    -e NOITOOL_CORES=4 \
    noitool-worker:latest
done
```

---

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务监听端口（Docker/Node 方式） |
| `BASE_PATH` | 空（根路径） | 子路径前缀（运行时指定，如 `/noita`） |
| `NODE_ENV` | `production` | 运行环境 |
| `LOG_LEVEL` | `info` | 日志级别（debug/info/warn/error） |

---

## 子路径部署

支持部署到子路径（如 `http://server/noita`），**无需重新构建**，运行时通过 `BASE_PATH` 环境变量指定。

项目使用 HashRouter + 相对资源路径，URL 格式为 `http://server/noita/#/search`。

### Docker 子路径

```bash
BASE_PATH=/noita ./deploy-docker.sh
# 或
BASE_PATH=/noita PORT=8080 ./deploy-docker.sh
```

Windows:
```bat
set BASE_PATH=/noita
deploy-docker.bat
```

### Node.js 子路径

```bash
BASE_PATH=/noita ./deploy-node.sh
# 或
BASE_PATH=/noita PORT=8080 ./deploy-node.sh
```

Windows:
```bat
set BASE_PATH=/noita
deploy-node.bat
```

### nginx 子路径（反代到 Node.js）

Node.js 后端以根路径运行，nginx 转发子路径：

```nginx
location /noita/ {
    proxy_pass http://127.0.0.1:3000/;
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

### 注意事项

- `BASE_PATH` 必须以 `/` 开头，不以 `/` 结尾（如 `/noita`）
- 不设置 `BASE_PATH` 时默认为根路径 `/`，行为不变
- 同一份构建产物可部署到任意路径，无需重新编译
- Socket.IO 连接自动适配 HTTP/HTTPS 协议，无需额外配置

---

## 常见问题

**Q: npm install 报错 EBADENGINE？**
Node.js 版本低于 22.16.0 时会有警告，一般不影响运行。建议使用 Node 22+。

**Q: npm ci 报错依赖冲突？**
加 `--legacy-peer-deps` 参数。打包脚本生成的精简 package.json 不会有此问题。

**Q: HTTP 访问是否正常？**
项目已兼容 HTTP 和 HTTPS，Socket.IO 连接自动适配协议（ws/wss），无需 HTTPS 证书即可正常使用全部功能。

**Q: Windows 下 .sh 脚本怎么运行？**
使用 Git Bash 或 WSL 运行。或直接使用对应的 .bat 脚本。

**Q: 如何部署到子路径？**
通过 `BASE_PATH` 环境变量指定，无需重新构建。详见上方"子路径部署"章节。
