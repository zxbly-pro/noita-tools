# 构建阶段：解决平台依赖冲突
FROM node:20 AS build-image

# 安装系统依赖（补充原配置中可能缺失的编译工具）
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
  python3-dev \
  libcurl4-openssl-dev \
  libfontconfig1 \
  libvips-dev && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先复制依赖配置文件（利用缓存）
COPY package.json package-lock.json ./

# 安装依赖并生成适配容器的 lockfile
RUN npm cache clean --force && \
    npm install --verbose && \
    npm shrinkwrap

# 复制源代码并构建
COPY . .
RUN npm run console-build


# 生产阶段：修复文件复制路径
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

# 关键修复：从构建阶段复制生成的 shrinkwrap 文件，而非宿主环境
COPY package.json package-lock.json ./
COPY --from=build-image /app/npm-shrinkwrap.json ./

# 复制构建产物和依赖
COPY --from=build-image /app/console-build /app/console-build
COPY --from=build-image /app/node_modules ./node_modules

# 安装生产依赖（使用构建阶段生成的锁文件）
RUN npm install --production=true

ENTRYPOINT ["npm", "run", "start"]
