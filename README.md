# Noitool

一款适用于 Noita 游戏的多功能 Web 应用。

它能帮助你找到符合特定需求的游戏种子。

当前支持的功能包括：

- 圣山信息查询
- 商店类型及物品清单
- 和平主义者宝箱内容
- 天赋及天赋重 roll 选项
- 初始游戏配置
- 水洞布局
- 活力药剂（Lively Concoction）与炼金前驱体（Alchemic Precursor）配方
- 真菌转变（Fungal Shifts）效果
- 基于机器学习计算机视觉的实时游戏种子检测
- 支持自定义复杂度的种子搜索，且兼容多设备协作

目录：

- [作为计算节点连接](https://www.doubao.com/chat/28986651372002562#作为计算节点连接)
- [开发指南](https://www.doubao.com/chat/28986651372002562#开发指南)
- [相关项目](https://www.doubao.com/chat/28986651372002562#相关项目)
- [许可信息](https://www.doubao.com/chat/28986651372002562#许可信息)

## 作为计算节点连接

### 前提条件

- 设备需安装 Node.js（建议版本 v18.6+）和 npm。

### 安装与连接步骤

#### Docker 方式

可通过 Docker 快速启动计算节点：

bash











```bash
docker run -it -e ghcr.io/twoabove/noitool-console-search:latest
```

开发环境专用：

bash











```bash
docker run -it -e NOITOOL_URL=https://dev.noitool.com/ ghcr.io/twoabove/noitool-console-search:latest-dev
```

#### 命令行（CLI）方式

按以下步骤通过命令行连接 Noitool 作为计算节点：

bash











```bash
git clone https://github.com/TwoAbove/noita-tools.git
cd noita-tools
git checkout master # 用于连接正式环境 https://www.noitool.com
# git checkout develop # 用于连接开发环境 https://dev.noitool.com
npm install --frozen-lockfile
npm run console-build
npm run console-search --userId <你的用户ID>
```

console-search 支持的参数（或环境变量）：

- `--url` / `NOITOOL_URL`：默认值为 https://www.noitool.com/，连接开发环境需改为 https://dev.noitool.com/
- `--cores` / `NOITOOL_CORES`：默认使用设备全部 CPU 核心，可指定核心数量
- `--userId` / `NOITOOL_USER_ID`：连接身份标识（即你的 Patreon ID）
- `--exit` / `NOITOOL_EXIT`：默认值为 `false`，添加该参数后，无任务时计算节点会自动退出
- `--minRunTime` / `NOITOOL_MIN_RUN_TIME`：默认值为 `0`（禁用），指定计算节点最小运行时间（秒），无任务时将在该时间后退出

#### 多设备自动化部署 Noitool

可通过 `deploy_to_servers.sh` 脚本实现多设备部署。需先创建 `.servers` 文件，格式如下：

csv











```csv
user@server1,,main_user_id
user@server2,dev_user_id,
```

该文件为无表头的 CSV 格式，包含三列：`ssh连接地址,开发环境用户ID,正式环境用户ID`。

注意：服务器 1 未填写开发环境用户 ID，服务器 2 未填写正式环境用户 ID。这意味着服务器 1 将连接正式环境，服务器 2 将连接开发环境，避免两个搜索进程争夺 CPU 资源。

执行 `./deploy_to_servers.sh` 即可向所有服务器部署。

------

## 技术细节与有趣的实现亮点

如需了解项目结构和核心组件的详细说明，可查看 [ARCHITECTURE.md](https://www.doubao.com/chat/ARCHITECTURE.md) 文件。

------

## 开发指南

若你是首次接触该代码仓库，建议先阅读 [ARCHITECTURE.md](https://www.doubao.com/chat/ARCHITECTURE.md) 文件，了解项目结构后再开始开发。

### 环境搭建

我使用 Linux 或 macOS 进行开发，无法保证 Windows 系统下所有功能正常运行。Windows 用户可通过 WSL2 搭建开发环境。

前提条件：

- Docker（用于容器化部署）
- Node.js
- `chokidar`（需全局安装：`npm install -g chokidar-cli`）
- 若需开发 C++ 相关代码，需安装 [emscripten](https://emscripten.org/docs/getting_started/downloads.html)
- 若需修改数据文件，需获取 [Noita 游戏数据](https://noita.wiki.gg/wiki/Modding#Extracting_data_files)，并将其放置在 `dataScripts/noita-data` 目录下

执行 `npm run dev` 前，请将 `.env.example` 文件复制为 `.env` 并填写相关配置。非 Patreon 和 Discord 相关功能可保持默认配置。

### Noita 游戏数据准备

需解压 Noita 的 wak 数据（参考 [此处](https://noita.wiki.gg/wiki/Modding#Extracting_data_files)），并将以下目录复制或链接到 `dataScripts/noita-data` 文件夹中。注意：`translations`（翻译文件）和 `fonts`（字体文件）位于 Noita 主目录，而非 `Nolla_Games_Noita` 目录。

必需目录清单：`data`（核心数据）、`translations`（翻译文件）、`fonts`（字体文件）。

通过以下命令创建符号链接（以 Debian 系统为例）：

sh











```sh
ln -s ~/.steam/debian-installation/steamapps/compatdata/881100/pfx/drive_c/users/steamuser/AppData/LocalLow/Nolla_Games_Noita/data dataScripts/noita-data/data
ln -s ~/.steam/debian-installation/steamapps/common/Noita/data/translations dataScripts/noita-data/translations
ln -s ~/.steam/debian-installation/steamapps/common/Noita/data/fonts dataScripts/noita-data/fonts
```

执行 `./dataScripts/full_parse.sh` 脚本可清理并解析数据文件。

### emscripten 安装与必要配置

使用 emscripten 时，需修改部分配置以启用闭包编译器（closure compiler）。

建议通过 Git 仓库安装 emsdk，并选择最新版本。

安装步骤（emscripten 安装完成后）：执行 `npm i` 安装依赖。

运行 `npm run dev` 后，构建脚本会监听 `.cpp` 文件的变更，并自动重新编译 WebAssembly（wasm）文件。

若需在 VS Code 中开发 C++ 代码，需安装 [C++ 插件](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)，并按以下步骤配置：

1. 打开 `C/C++: 编辑配置（UI）`
2. 在「包含路径」中添加 `<emscripten 安装路径>/upstream/emscripten/cache/**`
3. 首次构建后，emscripten 头文件将自动可用，VS Code 可正常识别

------

## 相关项目

（按字母顺序排列）

- https://github.com/cr4xy/noita-seed-tool
- https://github.com/Dadido3/noita-mapcap
- https://github.com/pudy248/NoitaMapViewer
- https://github.com/SaphireLattice/noita_unicorn
- [https://noitamap.com](https://noitamap.com/)

------

## 许可信息

本项目基于 MIT 许可证开源，详细条款见 [LICENSE](https://www.doubao.com/chat/LICENSE) 文件。
