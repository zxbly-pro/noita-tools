# 构建阶段：安装依赖并执行构建
FROM node:20-slim AS build-image

# 安装系统依赖（包含编译工具，支持 C++ 模块构建）
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

# 创建工作目录
RUN mkdir -p /app
WORKDIR /app

# 拷贝所有项目文件到容器（依赖 .dockerignore 过滤不必要文件）
COPY . .

# 安装所有依赖（包括开发依赖）
RUN npm install --verbose

# 执行项目构建和 console 构建
RUN npm run build && \
    npm run console-build


# 生产阶段：运行应用
FROM node:20-slim

# 安装运行时依赖
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  libvips-dev && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 从构建阶段拷贝必要文件
COPY --from=build-image /app/package.json ./package.json
COPY --from=build-image /app/node_modules ./node_modules
COPY --from=build-image /app/build ./build
COPY --from=build-image /app/console-build ./console-build
COPY --from=build-image /app/src ./src

# 启动命令
ENTRYPOINT ["npm", "run", "start"]
