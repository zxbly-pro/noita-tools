@echo off
REM Node.js 部署启动脚本（Windows 目标服务器）
REM 在解压后的 noitool 目录中运行
setlocal

echo [1/2] 安装依赖...
npm install

echo [2/2] 启动服务...
set NODE_ENV=production
if "%PORT%"=="" set PORT=3000
if "%BASE_PATH%"=="" set BASE_PATH=
if "%LOG_LEVEL%"=="" set LOG_LEVEL=info
if "%LOG_TIMEZONE%"=="" set LOG_TIMEZONE=GMT+8

if "%BASE_PATH%"=="" (
  echo 服务将在 http://localhost:%PORT% 运行
) else (
  echo 服务将在 http://localhost:%PORT%%BASE_PATH%/ 运行
)
echo 按 Ctrl+C 停止
echo 子路径部署: set BASE_PATH=/noita ^&^& deploy-node.bat

node --experimental-modules ./server/standalone.mjs
endlocal
