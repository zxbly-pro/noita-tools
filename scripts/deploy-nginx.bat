@echo off
REM nginx 静态部署脚本（Windows 目标服务器）
REM 在解压后的 noitool 目录中运行
REM 需要已安装 nginx

setlocal
set NGINX_HTML=C:\nginx\html\noitool
set NGINX_CONF=C:\nginx\conf\conf.d

echo [1/3] 复制静态文件...
if not exist %NGINX_HTML% mkdir %NGINX_HTML%
xcopy build\* %NGINX_HTML%\ /s /e /q /y

echo [2/3] 复制 nginx 配置...
if not exist %NGINX_CONF% mkdir %NGINX_CONF%
copy nginx.conf %NGINX_CONF%\noitool.conf /y

echo [3/3] 重载 nginx...
nginx -s reload

echo.
echo 部署完成!
echo 注意: 请根据实际 nginx 安装路径修改脚本中的目录
echo 此模式不支持计算池功能
endlocal
