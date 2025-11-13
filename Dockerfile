# 构建阶段：编译 TypeScript 和前端资源
FROM node:20-slim as build-stage

# 安装系统依赖（含 C++ 编译工具，用于 emscripten 相关模块）
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
  libfontconfig1 && \
  rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖配置文件
COPY package.json package-lock.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 编译 C++ 模块（若有）和前端资源
RUN npm run build-noita_random && \
    npm run build

# 生产阶段：仅保留运行时必要文件
FROM node:20-slim as production-stage

# 安装运行时依赖（如 Python 用于部分脚本）
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  python3 && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制生产依赖和构建产物
COPY package.json package-lock.json ./
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/server ./server
COPY --from=build-stage /app/src/services/SeedInfo/noita_random ./src/services/SeedInfo/noita_random

# 暴露应用端口
EXPOSE 3001

# 启动主应用服务器（与 package.json 中的 start 脚本对应）
CMD ["npm", "start"]
