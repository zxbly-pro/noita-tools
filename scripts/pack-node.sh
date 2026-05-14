#!/bin/bash
# 打包 Node.js 部署包（Linux/macOS）
# 使用前请先完成: npm ci --legacy-peer-deps && npm run build
# 产物包含 node_modules，目标机器解压即可运行，无需网络

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/.."

DIST="$SCRIPT_DIR/dist-node"
ARCHIVE="$SCRIPT_DIR/noitool-node.tar.gz"

echo "[1/5] 清理旧文件..."
rm -rf "$DIST" "$ARCHIVE"

echo "[2/5] 复制运行所需文件..."
mkdir -p "$DIST/server/io"
cp server/standalone.mjs "$DIST/server/"
cp server/io/compute.mjs "$DIST/server/io/"
cp server/logger.mjs "$DIST/server/"
cp -r build "$DIST/build"

echo "[3/5] 生成精简 package.json..."
cat > "$DIST/package.json" << 'EOF'
{
  "name": "noitool",
  "version": "35.0.1",
  "private": true,
  "type": "module",
  "dependencies": {
    "express": "^4.21.2",
    "socket.io": "4.8.1"
  }
}
EOF

echo "[4/5] 安装运行时依赖（将打入包内）..."
cd "$DIST"
npm install --omit=dev 2>/dev/null
cd "$SCRIPT_DIR/.."

echo "[5/5] 压缩..."
tar -czf "$ARCHIVE" -C "$DIST" .

rm -rf "$DIST"

echo ""
BASENAME="$(basename "$ARCHIVE")"
echo "完成! 部署包: $BASENAME（含 node_modules，完全离线部署）"
echo "部署步骤:"
echo "  1. 解压: mkdir noitool && tar -xzf $BASENAME -C noitool"
echo "  2. cd noitool && node --experimental-modules ./server/standalone.mjs"
