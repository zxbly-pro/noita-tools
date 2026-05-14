@echo off
REM Docker 部署脚本（Windows 目标服务器）
REM 在解压后的 noitool 目录中运行

setlocal
set IMAGE=noitool:latest
set CONTAINER=noitool
set PORT=3000

echo [1/3] 停止旧容器（如果存在）...
docker stop %CONTAINER% 2>nul
docker rm %CONTAINER% 2>nul

echo [2/3] 构建镜像...
docker build -t %IMAGE% .

echo [3/3] 启动容器...
docker run -d -p %PORT%:%PORT% -e PORT=%PORT% --name %CONTAINER% --restart unless-stopped %IMAGE%

echo.
echo 部署完成! 访问 http://localhost:%PORT%
echo.
echo 管理命令:
echo   docker logs %CONTAINER%       - 查看日志
echo   docker restart %CONTAINER%    - 重启
echo   docker stop %CONTAINER%       - 停止
endlocal
