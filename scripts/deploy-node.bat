@echo off
REM Node.js 部署启动脚本（Windows 目标服务器）
REM 在解压后的 noitool 目录中运行

setlocal

echo [1/2] 安装依赖...
npm install

echo [2/2] 启动服务...
echo 服务将在 http://localhost:3000 运行
echo 按 Ctrl+C 停止

set NODE_ENV=production
set PORT=3000
node --experimental-modules ./server/standalone.mjs
endlocal
