#!/bin/bash
# Node.js 离线安装脚本（Ubuntu amd64）
# 优先使用当前目录的离线安装包，没有则下载一份到当前目录供后续离线使用

set -e

NODE_VERSION="${1:-22.16.0}"
ARCH="linux-x64"
TARBALL="node-v${NODE_VERSION}-${ARCH}.tar.xz"
INSTALL_DIR="/usr/local"

cd "$(dirname "$0")"

# 检查是否已安装且版本满足
if command -v node &>/dev/null; then
  CURRENT=$(node -v | tr -d v | cut -d. -f1)
  if [ "$CURRENT" -ge 22 ]; then
    echo "Node.js $(node -v) 已安装，无需操作"
    exit 0
  fi
  echo "当前 Node.js 版本过低 ($(node -v))，将安装 v${NODE_VERSION}"
fi

# 优先使用当前目录的离线包
if [ -f "$TARBALL" ]; then
  echo "检测到离线安装包: $TARBALL"
else
  echo "未找到离线安装包，正在下载 Node.js v${NODE_VERSION}..."
  curl -fSL -o "$TARBALL" "https://nodejs.org/dist/v${NODE_VERSION}/${TARBALL}"
  echo "已下载到当前目录: $TARBALL（可拷贝到离线环境复用）"
fi

echo "正在安装 Node.js v${NODE_VERSION}..."
tar -xJf "$TARBALL" -C "$INSTALL_DIR" --strip-components=1

echo ""
echo "安装完成: node $(node -v), npm $(npm -v)"
echo "安装路径: ${INSTALL_DIR}/bin/node"
