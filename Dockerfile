# 构建阶段：执行所有编译和构建步骤（与本地流程完全匹配）
FROM node:20-slim as build-stage

# 安装系统依赖（编译 C++ 模块和前端资源所需）
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  g++ \
  make \
  cmake \
  build-essential \
  autoconf \
  automake \
  libtool \
  m4 \
  libssl-dev \
  unzip \
  python3 \
  libcurl4-openssl-dev \
  libfontconfig1 \
  libvips-dev && \
  rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖配置文件（优先复制锁文件以利用 Docker 缓存）
COPY package.json package-lock.json ./

# 严格按照 lockfile 安装依赖（与本地 `npm install --frozen-lockfile` 一致）
RUN npm install --frozen-lockfile

# 复制所有源代码
COPY . .

# 执行本地构建命令：先构建核心应用，再构建控制台工具
RUN npm run build && \
    npm run console-build


# 生产阶段：仅保留运行时必要文件
FROM node:20-slim as production-stage

# 安装运行时依赖（如 Python 用于脚本执行）
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  python3 \
  libvips-dev && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制生产环境依赖和构建产物
COPY package.json package-lock.json ./
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/server ./server
COPY --from=build-stage /app/console-build ./console-build
COPY --from=build-stage /app/src/services/SeedInfo/noita_random ./src/services/SeedInfo/noita_random

# 暴露应用端口（与本地启动的 3001 一致）
EXPOSE 3001

# 启动命令（与本地 `npm run start` 一致）
CMD ["npm", "run", "start"]
