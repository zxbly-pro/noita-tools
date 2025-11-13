# 使用与项目匹配的 Node 版本（保持与原 console.Dockerfile 一致的 node:20-slim）
FROM node:20-slim

# 关键：补充完整系统依赖（参考原 console.Dockerfile，确保原生模块编译工具齐全）
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
  # 额外补充 sharp 等依赖可能需要的库
  libvips-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 第一步：复制依赖描述文件（确保 package.json 和 package-lock.json 正确复制）
COPY package.json package-lock.json ./

# 可选：清理 npm 缓存，避免缓存导致的安装问题
RUN npm cache clean --force

# 执行依赖安装（使用 --frozen-lockfile 保持与本地一致）
RUN npm install --frozen-lockfile

# 第二步：复制完整项目代码
COPY . .

# 执行本地构建命令
RUN npm run build && \
    npm run console-build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "run", "start"]
