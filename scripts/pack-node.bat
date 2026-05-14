@echo off
REM 打包 Node.js 部署包（Windows）
REM 使用前请先完成: npm ci --legacy-peer-deps && npm run build
REM 产物包含 node_modules，目标机器解压即可运行

setlocal

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set DIST=%SCRIPT_DIR%dist-node
set ARCHIVE=%SCRIPT_DIR%noitool-node.zip

echo [1/5] 清理旧文件...
if exist "%DIST%" rmdir /s /q "%DIST%"
if exist "%ARCHIVE%" del /q "%ARCHIVE%"

echo [2/5] 复制运行所需文件...
mkdir "%DIST%"
mkdir "%DIST%\server"
mkdir "%DIST%\server\io"

copy "%PROJECT_DIR%\server\standalone.mjs" "%DIST%\server\" >nul
copy "%PROJECT_DIR%\server\io\compute.mjs" "%DIST%\server\io\" >nul
copy "%PROJECT_DIR%\server\logger.mjs" "%DIST%\server\" >nul
xcopy "%PROJECT_DIR%\build" "%DIST%\build\" /s /e /q

echo [3/5] 生成精简 package.json...
pushd "%PROJECT_DIR%"
for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set PKG_VERSION=%%v
popd
echo {"name":"noitool","version":"%PKG_VERSION%","private":true,"type":"module","dependencies":{"express":"^4.21.2","socket.io":"4.8.1"}} > "%DIST%\package.json"

echo [4/5] 安装运行时依赖（将打入包内）...
pushd "%DIST%"
npm install --omit=dev
if errorlevel 1 (
  echo 错误: npm install 失败
  popd
  rmdir /s /q "%DIST%"
  exit /b 1
)
popd

echo [5/5] 压缩...
powershell -Command "Compress-Archive -Path '%DIST%\*' -DestinationPath '%ARCHIVE%' -Force"

rmdir /s /q "%DIST%"

echo.
echo 完成! 部署包: noitool-node.zip（含 node_modules，完全离线部署）
echo 部署步骤:
echo   1. 解压到服务器
echo   2. cd noitool
echo   3. node --experimental-modules ./server/standalone.mjs
endlocal
