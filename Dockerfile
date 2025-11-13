# 构建阶段：完整拷贝项目并执行构建
FROM node:20-slim AS build-image

# 安装系统依赖（包含编译工具）
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
WORKDIR /app

# 拷贝整个项目的所有文件（不做任何过滤）
COPY . .

# 安装所有依赖（包括开发依赖）
RUN npm install --verbose

# 执行构建命令（按项目实际脚本调整）
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

# 从构建阶段完整拷贝所有文件到生产环境
COPY --from=build-image /app /app

# 启动应用
ENTRYPOINT ["npm", "run", "start"]
