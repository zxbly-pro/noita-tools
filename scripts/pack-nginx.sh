#!/bin/bash
# 打包 nginx 静态部署包（Linux/macOS）
# 使用前请先完成 npm ci --legacy-peer-deps && npm run build
# 此模式不支持计算池功能

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/.."

DIST="$SCRIPT_DIR/dist-nginx"
ARCHIVE="$SCRIPT_DIR/noitool-nginx.tar.gz"

echo "[1/4] 清理旧文件..."
rm -rf "$DIST" "$ARCHIVE"

echo "[2/4] 复制静态文件..."
mkdir -p "$DIST"
cp -r build "$DIST/build"

echo "[3/4] 生成 nginx 配置..."
cat > "$DIST/nginx.conf" << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

echo "[4/4] 压缩..."
tar -czf "$ARCHIVE" -C "$DIST" .

rm -rf "$DIST"

echo ""
BASENAME="$(basename "$ARCHIVE")"
echo "完成！部署包: $BASENAME"
echo "部署步骤:"
echo "  1. 解压: mkdir noitool && tar -xzf $BASENAME -C noitool"
echo "  2. 将 build/ 内容放到 nginx html 目录"
echo "  3. 将 nginx.conf 放到 /etc/nginx/conf.d/"
echo "注意: 此模式不支持计算池功能"
