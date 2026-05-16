@echo off
REM Docker 部署脚本（Windows 目标服务器）
REM 在解压后的 noitool 目录中运行
setlocal
set IMAGE=noitool:latest
set CONTAINER=noitool
if "%PORT%"=="" set PORT=3000
if "%BASE_PATH%"=="" set BASE_PATH=
if "%LOG_LEVEL%"=="" set LOG_LEVEL=info
if "%LOG_TIMEZONE%"=="" set LOG_TIMEZONE=GMT+8

echo [1/3] 停止旧容器（如果存在）...
docker stop %CONTAINER% 2>nul
docker rm %CONTAINER% 2>nul

echo [2/3] 构建镜像...
docker build -t %IMAGE% .

echo [3/3] 启动容器...
docker run -d -p %PORT%:%PORT% -e PORT=%PORT% -e BASE_PATH=%BASE_PATH% -e LOG_LEVEL=%LOG_LEVEL% -e LOG_TIMEZONE=%LOG_TIMEZONE% --name %CONTAINER% --restart unless-stopped %IMAGE%

echo.
if "%BASE_PATH%"=="" (
  echo 部署完成！访问 http://localhost:%PORT%
) else (
  echo 部署完成！访问 http://localhost:%PORT%%BASE_PATH%/
)
echo.
echo 管理命令:
echo   docker logs %CONTAINER%       - 查看日志
echo   docker restart %CONTAINER%    - 重启
echo   docker stop %CONTAINER%       - 停止
echo.
echo 子路径部署: set BASE_PATH=/noita ^&^& deploy-docker.bat
endlocal
