#!/bin/bash
# 构建计算池 Worker Docker 镜像

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/.."

IMAGE="noitool-worker:latest"

echo "[1/1] 构建 Worker 镜像..."
docker build -t "$IMAGE" -f Dockerfile.worker .

echo ""
echo "完成! 镜像: $IMAGE"
echo ""
echo "运行方式:"
echo "  docker run -d --name noitool-worker noitool-worker:latest"
echo ""
echo "自定义参数:"
echo "  docker run -d --name noitool-worker \\"
echo "    -e NOITOOL_URL=http://服务器:3000 \\"
echo "    -e NOITOOL_CORES=4 \\"
echo "    noitool-worker:latest"
echo ""
echo "迁移到其他服务器:"
echo "  docker save noitool-worker:latest -o noitool-worker.tar"
echo "  docker load -i noitool-worker.tar"
