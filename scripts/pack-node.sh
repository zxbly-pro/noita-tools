#!/bin/bash
# 打包 Node.js 部署包（Linux/macOS）
# 使用前请先完成: npm ci --legacy-peer-deps && npm run build

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/.."

DIST="$SCRIPT_DIR/dist-node"
ARCHIVE="$SCRIPT_DIR/noitool-node.tar.gz"

echo "[1/4] 清理旧文件..."
rm -rf "$DIST" "$ARCHIVE"

echo "[2/4] 复制运行所需文件..."
mkdir -p "$DIST/server/io"
cp server/standalone.mjs "$DIST/server/"
cp server/io/compute.mjs "$DIST/server/io/"
cp server/logger.mjs "$DIST/server/"
cp -r build "$DIST/build"

echo "[3/4] 生成精简 package.json..."
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

echo "[4/4] 压缩..."
tar -czf "$ARCHIVE" -C "$DIST" .

rm -rf "$DIST"

echo ""
BASENAME="$(basename "$ARCHIVE")"
echo "完成! 部署包: $BASENAME"
echo "部署步骤:"
echo "  1. 解压: mkdir noitool && tar -xzf $BASENAME -C noitool"
echo "  2. cd noitool && npm install"
echo "  3. node --experimental-modules ./server/standalone.mjs"
