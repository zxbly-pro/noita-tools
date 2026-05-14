#!/bin/bash
# Docker 部署脚本（Linux 目标服务器）
# 在解压后的 noitool 目录中运行

set -e

cd "$(dirname "$0")"

IMAGE="noitool:latest"
CONTAINER="noitool"
PORT="${PORT:-3000}"

echo "[1/3] 停止旧容器（如果存在）..."
docker stop "$CONTAINER" 2>/dev/null || true
docker rm "$CONTAINER" 2>/dev/null || true

echo "[2/3] 构建镜像..."
docker build -t "$IMAGE" .

echo "[3/3] 启动容器..."
docker run -d \
  -p "$PORT:$PORT" \
  -e "PORT=$PORT" \
  --name "$CONTAINER" \
  --restart unless-stopped \
  "$IMAGE"

echo ""
echo "部署完成! 访问 http://0.0.0.0:$PORT"
echo ""
echo "管理命令:"
echo "  docker logs $CONTAINER       - 查看日志"
echo "  docker restart $CONTAINER    - 重启"
echo "  docker stop $CONTAINER       - 停止"
