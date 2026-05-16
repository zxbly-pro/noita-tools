#!/bin/bash
# 打包 Docker 部署源码包（Linux/macOS）
# 包含构建 Docker 镜像所需的全部源码

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/.."

DIST="$SCRIPT_DIR/dist-docker"
ARCHIVE="$SCRIPT_DIR/noitool-docker.tar.gz"

echo "[1/4] 清理旧文件..."
rm -rf "$DIST" "$ARCHIVE"

echo "[2/4] 复制构建所需文件..."
mkdir -p "$DIST"

cp Dockerfile "$DIST/"
cp .dockerignore "$DIST/"
cp package.json "$DIST/"
cp package-lock.json "$DIST/"
cp index.html "$DIST/"
cp vite.config.ts "$DIST/"
cp tsconfig.json "$DIST/"
cp tsconfig.node.json "$DIST/"

cp -r src "$DIST/src"
cp -r public "$DIST/public"
cp -r server "$DIST/server"

echo "[3/4] 压缩..."
tar -czf "$ARCHIVE" -C "$DIST" .

echo "[4/4] 清理临时目录..."
rm -rf "$DIST"

echo ""
BASENAME="$(basename "$ARCHIVE")"
echo "完成！部署包: $BASENAME"
echo "部署步骤:"
echo "  1. 解压: mkdir noitool && tar -xzf $BASENAME -C noitool"
echo "  2. cd noitool && docker build -t noitool:latest ."
echo "  3. docker run -d -p 3000:3000 --name noitool noitool:latest"
