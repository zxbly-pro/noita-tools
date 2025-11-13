FROM node:20-slim

# 安装系统依赖（保持与原 console.Dockerfile 一致）
RUN apt-get update && \
  apt-get install -y \
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
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./

# 关键：添加 --legacy-peer-deps 忽略 peer 依赖冲突，同时保留 --frozen-lockfile
RUN npm install --frozen-lockfile --legacy-peer-deps

# 复制完整代码
COPY . .

# 执行构建命令
RUN npm run build && \
    npm run console-build

EXPOSE 3001

CMD ["npm", "run", "start"]
