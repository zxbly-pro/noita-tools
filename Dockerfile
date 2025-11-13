# 使用与项目匹配的 Node 版本（package.json 显示依赖 Node 18+，与 README 一致）
FROM node:18-slim

# 安装系统依赖（编译原生模块所需，如之前的 console.Dockerfile）
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
  libfontconfig1 && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# 设置工作目录（容器内的项目根目录）
WORKDIR /app

# 第一步：复制依赖描述文件（关键！没有这些文件，npm install 会失败）
# 优先复制 lock 文件，利用 Docker 缓存，避免依赖重复安装
COPY package.json package-lock.json ./

# 执行依赖安装（与本地命令 `npm install --frozen-lockfile` 一致）
# 此时需要 package.json 和 package-lock.json 已存在
RUN npm install --frozen-lockfile

# 第二步：复制完整项目代码（包括源码、配置文件等）
# 确保所有构建和运行所需的文件都被复制到容器中
COPY . .

# 执行本地构建命令（依赖完整代码）
RUN npm run build && \
    npm run console-build

# 暴露后端服务端口
EXPOSE 3001

# 启动服务
CMD ["npm", "run", "start"]
