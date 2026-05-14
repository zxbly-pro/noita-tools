#!/bin/bash
# nginx 静态部署脚本（Linux 目标服务器）
# 在解压后的 noitool 目录中运行

set -e

cd "$(dirname "$0")"

NGINX_HTML="/usr/share/nginx/html"
NGINX_CONF="/etc/nginx/conf.d"

echo "[1/3] 复制静态文件..."
rm -rf "$NGINX_HTML"/*
cp -r build/* "$NGINX_HTML/"

echo "[2/3] 复制 nginx 配置..."
cp nginx.conf "$NGINX_CONF/noitool.conf"

echo "[3/3] 重载 nginx..."
nginx -t && nginx -s reload

echo ""
echo "部署完成! 访问 http://服务器IP"
echo "注意: 此模式不支持计算池功能"
