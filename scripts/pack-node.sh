#!/bin/bash
# 打包 Node.js 离线部署包（Linux/macOS）
# 使用前请先完成 npm ci --legacy-peer-deps && npm run build
# 产物包含 node_modules，目标机器解压后即可运行，无需联网

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/.."

DIST="$SCRIPT_DIR/dist-node"
ARCHIVE="$SCRIPT_DIR/noitool-node.tar.gz"

# 检查 npm 是否可用
if ! command -v npm &>/dev/null; then
  echo "未检测到 npm，是否安装 Node.js 22.x？[Y/n]"
  read -r answer
  answer="${answer:-Y}"
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    echo "正在安装 Node.js 22.x（Ubuntu amd64）..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq
    apt-get install -y -qq nodejs
    echo "Node.js $(node -v) 安装完成"
  else
    echo "已取消，请手动安装 Node.js 22+ 后重试"
    exit 1
  fi
fi

echo "[1/5] 清理旧文件..."
rm -rf "$DIST" "$ARCHIVE"

echo "[2/5] 复制运行所需文件..."
mkdir -p "$DIST/server/io"
cp server/standalone.mjs "$DIST/server/"
cp server/io/compute.mjs "$DIST/server/io/"
cp server/logger.mjs "$DIST/server/"
cp -r build "$DIST/build"

echo "[3/5] 生成精简 package.json..."
PKG_VERSION=$(node -p "require('./package.json').version")
cat > "$DIST/package.json" << EOF
{
  "name": "noitool",
  "version": "${PKG_VERSION}",
  "private": true,
  "type": "module",
  "dependencies": {
    "express": "^4.21.2",
    "socket.io": "4.8.1"
  }
}
EOF

echo "[4/5] 安装运行时依赖（将打包进部署包）..."
cd "$DIST"
if ! npm install --omit=dev; then
  echo "错误: npm install 失败"
  cd "$SCRIPT_DIR/.."
  rm -rf "$DIST"
  exit 1
fi
cd "$SCRIPT_DIR/.."

echo "[5/5] 压缩..."
tar -czf "$ARCHIVE" -C "$DIST" .

rm -rf "$DIST"

echo ""
BASENAME="$(basename "$ARCHIVE")"
echo "完成！部署包: $BASENAME（含 node_modules，可完全离线部署）"
echo "部署步骤:"
echo "  1. 解压: mkdir noitool && tar -xzf $BASENAME -C noitool"
echo "  2. cd noitool && node --experimental-modules ./server/standalone.mjs"
