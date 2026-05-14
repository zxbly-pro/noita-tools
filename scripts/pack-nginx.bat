@echo off
REM 打包 nginx 纯静态部署包（Windows）
REM 使用前请先完成: npm ci --legacy-peer-deps && npm run build
REM 此模式不支持计算池功能

setlocal
set DIST=dist-nginx
set ARCHIVE=noitool-nginx.zip

echo [1/4] 清理旧文件...
if exist %DIST% rmdir /s /q %DIST%
if exist %ARCHIVE% del /q %ARCHIVE%

echo [2/4] 复制静态文件...
mkdir %DIST%
xcopy build %DIST%\build\ /s /e /q

echo [3/4] 生成 nginx 配置...
(
echo server {
echo     listen 80;
echo     server_name _;
echo     root /usr/share/nginx/html;
echo     index index.html;
echo.
echo     location /assets/ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo.
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo }
) > %DIST%\nginx.conf

echo [4/4] 压缩...
powershell -Command "Compress-Archive -Path '%DIST%\*' -DestinationPath '%ARCHIVE%' -Force"

echo.
echo 完成! 部署包: %ARCHIVE%
echo 部署步骤:
echo   1. 解压到服务器
echo   2. 将 build/ 内容放到 nginx html 目录
echo   3. 将 nginx.conf 放到 nginx 配置目录
echo   注意: 此模式不支持计算池功能
endlocal
