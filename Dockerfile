# 构建阶段：解决平台依赖冲突，优化依赖安装
FROM node:20 AS build-stage

# 安装完整系统依赖（包含更多编译工具）
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

# 复制依赖配置文件
COPY package.json package-lock.json ./

# 关键调整：处理平台依赖冲突
RUN npm cache clean --force && \
    npm install --verbose && \
    npm shrinkwrap

# 复制源代码
COPY . .

# 执行构建命令
RUN npm run build && \
    npm run console-build


# 生产阶段
FROM node:20-slim AS production-stage

# 安装运行时依赖
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  python3 \
  libvips-dev && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制生产环境文件（使用构建阶段重新生成的依赖）
COPY package.json package-lock.json npm-shrinkwrap.json ./
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/server ./server
COPY --from=build-stage /app/console-build ./console-build
COPY --from=build-stage /app/src/services/SeedInfo/noita_random ./src/services/SeedInfo/noita_random

EXPOSE 3001

CMD ["npm", "start"]
