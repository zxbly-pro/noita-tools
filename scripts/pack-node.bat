@echo off
REM 打包 Node.js 部署包（Windows）
REM 使用前请先完成: npm ci --legacy-peer-deps && npm run build

setlocal
set DIST=dist-node
set ARCHIVE=noitool-node.zip

echo [1/4] 清理旧文件...
if exist %DIST% rmdir /s /q %DIST%
if exist %ARCHIVE% del /q %ARCHIVE%

echo [2/4] 复制运行所需文件...
mkdir %DIST%
mkdir %DIST%\server
mkdir %DIST%\server\io

copy server\standalone.mjs %DIST%\server\
copy server\io\compute.mjs %DIST%\server\io\
copy server\logger.mjs %DIST%\server\
xcopy build %DIST%\build\ /s /e /q

echo [3/4] 生成精简 package.json...
echo {"name":"noitool","version":"35.0.1","private":true,"type":"module","dependencies":{"express":"^4.21.2","socket.io":"4.8.1"}} > %DIST%\package.json

echo [4/4] 压缩...
powershell -Command "Compress-Archive -Path '%DIST%\*' -DestinationPath '%ARCHIVE%' -Force"

echo.
echo 完成! 部署包: %ARCHIVE%
echo 部署步骤:
echo   1. 解压到服务器
echo   2. cd noitool ^&^& npm install
echo   3. node --experimental-modules ./server/standalone.mjs
endlocal
