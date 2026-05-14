#!/bin/bash
# Node.js 部署启动脚本（Linux 目标服务器 - Ubuntu）
# 在解压后的 noitool 目录中运行

set -e

cd "$(dirname "$0")"

PORT="${PORT:-3000}"
BASE_PATH="${BASE_PATH:-}"

echo "[1/3] 检查并安装 Node.js..."
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  echo "  安装 Node.js 22.x..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
  echo "  Node.js $(node -v) 安装完成"
else
  echo "  Node.js $(node -v) 已安装"
fi

echo "[2/3] 安装依赖..."
npm install --omit=dev

echo "[3/3] 启动服务..."
if [ -n "$BASE_PATH" ]; then
  echo "服务运行在 http://0.0.0.0:$PORT$BASE_PATH/"
else
  echo "服务运行在 http://0.0.0.0:$PORT"
fi

export NODE_ENV=production
export PORT
export BASE_PATH

exec node --experimental-modules ./server/standalone.mjs
