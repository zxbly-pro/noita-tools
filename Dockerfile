# 构建阶段：修复系统依赖，优化依赖安装步骤
FROM node:20-slim AS build-stage

# 安装完整编译工具链（补充 python3-dev 等关键依赖）
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

# 先复制依赖配置文件（利用 Docker 缓存）
COPY package.json package-lock.json ./

# 清除 npm 缓存，强制重新解析依赖（解决 lockfile 兼容性问题）
RUN npm cache clean --force && \
    npm install --frozen-lockfile --verbose

# 复制源代码
COPY . .

# 执行构建命令
RUN npm run build && \
    npm run console-build


# 生产阶段：精简依赖，修正大小写
FROM node:20-slim AS production-stage

# 安装运行时依赖（保留必要库）
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  python3 \
  libvips-dev && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制生产环境所需文件
COPY package.json package-lock.json ./
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/server ./server
COPY --from=build-stage /app/console-build ./console-build
COPY --from=build-stage /app/src/services/SeedInfo/noita_random ./src/services/SeedInfo/noita_random

EXPOSE 3001

CMD ["npm", "run", "start"]
