# 架构概述

本文档概述了该项目的架构设计及组件间的交互方式，涵盖前端、后端、数据处理脚本以及各组件的通信逻辑。同时，也会分享开发过程中遇到的一些值得关注的问题。

该项目包含 3 个核心部分：前端、后端和数据脚本（dataScripts），以及一个隐藏的第四部分：计算客户端（compute client）。下文将对每个部分进行详细说明。


## 概述

Noitool 是一款基于 React 构建的 Web 应用。后端服务器采用 Express.js 开发，通过 Socket.IO 实现实时通信。数据处理脚本使用 Node.js 编写，用于将原始游戏数据转换为应用可使用的格式。前端是基于 React 和 Vite 构建的单页应用（SPA）。

------

## 数据脚本（DataScripts）

这是一组用于处理 Noita 游戏数据的脚本（相关参考：[Data.wak](https://noita.fandom.com/wiki/Data.wak) 及 [数据文件提取方法](https://noita.fandom.com/wiki/Modding#Extracting_data_files)）。这些脚本的核心输出包括各类 JSON 文件（存放于 `src/services/SeedInfo/data` 目录）和国际化（i18n）数据（存放于 `public/locales` 目录）。建议快速浏览脚本内容以了解其功能。目前脚本会输出数组和键值对两种格式的数据文件，这种设计并不理想，后续需统一为单一格式。

探索数据脚本的最佳方式是查看 `dataScripts/full_parse.sh` 文件，了解其执行流程。该文件中唯一不够直观的操作是 `mapsToObj` 调用，这是一个从游戏 XML 文件生成地图处理器模板和实体数据的脚本。将两者放在一起处理是因为地图和实体的定义存在大量重叠。该脚本会进行 XML 解析与遍历，部分逻辑还会解析和遍历 Lua 代码 —— 这是因为 Noita 的实体生成逻辑由地图 XML 调用的 Lua 代码定义。更多细节可参考 [生物群系定义原理](https://noita.fandom.com/wiki/Modding:_Making_a_custom_environment)。

------

## 后端（Backend）

幸运的是，这部分实现相对简单。Noitool 的后端功能较为精简，本质上是一个轻量的 Express 服务器：生产环境中负责托管前端资源，提供少量供前端交互的接口，并通过 WebSocket 供计算客户端连接。后端代码位于 `server` 目录下。

计算客户端是项目的核心算力提供者，承担着种子求解的核心计算任务。后端还提供了部分专项接口（如每日种子接口）供前端调用。

核心文件包括 `server/server.mjs` 和 `io/compute.mjs`：前者负责初始化 Express 服务器、中间件和路由，后者处理计算实例间的通信。

即使后端未启动，前端仍可正常使用大部分功能，唯一受影响的是每日种子的获取功能。

------

## 前端（Frontend）

这是项目的核心部分。前端是基于 React 和 Vite 构建的单页应用（SPA）。在深入代码前，建议先理解数据的生成逻辑与使用流程。

### 数据的来源与去向

Noita 是一款带有程序化生成世界的类 Rogue 游戏。游戏世界由种子（`worldSeed`）生成，该种子在每局游戏中保持固定。所有其他随机性均源于此种子，且具有确定性 —— 这意味着只要知道种子，就能预测游戏中即将发生的所有（或大部分，后续会详细说明）事件。

因此，我们需要一套脚本接收种子和各类游戏关键数据，经过处理后进行展示；同时，借助其确定性特征，还能搜索符合特定条件的种子。

游戏的随机数生成和地图生成逻辑均从游戏的反编译二进制文件中提取，其余数据则来自游戏的原始数据文件。本文档不涉及反编译和逆向工程的具体流程，但可参考 `noita_random` 目录下的 WebAssembly（WASM）代码，该代码用于实现随机数生成和地图生成功能。推荐使用 [Ghidra](https://ghidra-sre.org/)（感谢美国国家安全局用纳税人的钱开发出如此强大的工具）搭配 C++ 插件进行反编译操作。

补充说明：种子搜索属于[极易并行](https://en.wikipedia.org/wiki/Embarrassingly_parallel)的计算任务，因此可将工作分配到多个核心或计算客户端（存在部分限制条件）。

所有数据生成逻辑均位于 `src/services/SeedInfo` 目录下，核心入口是 `src/services/SeedInfo/infoHandler/index.ts` 中的 `GameInfoProvider`。该文件体积较大，主要是因为包含了多个不同类型 `InfoProvider` 的异步导入逻辑。`InfoProvider` 是实际执行数据生成的类，按数据类型拆分到不同文件中（例如 `src/services/SeedInfo/infoHandler/InfoProviders/Perk` 负责生成天赋数据）。每个信息提供者都包含 `provide()` 方法（返回生成的数据）和 `test()` 方法（验证数据是否符合搜索条件）。

每个信息提供者类都有若干依赖项，核心依赖是 `src/services/SeedInfo/random`—— 该模块负责生成游戏中使用的伪随机数。可查看 `src/services/SeedInfo/random/random.ts` 和 `src/services/SeedInfo/noita_random/src/wasm_in.cpp` 了解接口设计。核心逻辑一致：代码通过 `SetRandomSeed()` 传入两个值（通常是坐标 x 和 y），再调用各类 `Random()` 函数及其变体。本质上，这些函数都是基础 `Random()` 调用的轻微变体或抽象封装。

这也是部分内容不具备确定性的原因：游戏中部分逻辑会使用非固定坐标调用 `SetRandomSeed()`，导致结果依赖于游戏状态（例如 Boss 战斗中，会使用其死亡坐标作为参数）。

数据生成完成后，即可进行展示。

### 游戏数据展示

视图层代码位于 `src/components` 目录，包含所有 UI 组件的定义。Noitool 支持「信息查看（Info）」「搜索（Search）」「计算（Compute）」「实时辅助（Live）」等功能，组件按功能模块拆分到对应文件夹中。

「信息查看（Info）」是规模最大的模块，定义了游戏信息的完整展示逻辑和交互逻辑，每个组件负责展示特定的数据片段。建议先查看 `src/components/SeedInfo/SeedInfo.tsx` 以了解组件结构。

`src/components/LiveSeedStats` 对应「实时游戏辅助（Live Game Helper）」功能，通过 [Tesseract](https://tesseract.projectnaptha.com/) 识别游戏屏幕内容并提取种子。

`src/components/Compute` 是计算客户端管理界面，包含计算客户端代码 —— 本质上是一个无界面的搜索组件，负责连接后端并监听任务分配。

`src/components/SearchSeeds` 是另一核心模块（搜索界面），用于构建规则树（`src/services/SeedInfo/infoHandler/IRule.ts`），并将其传递给搜索器（下文将详细说明）。

### 种子搜索

`src/services/seedSearcher.ts` 是实现搜索功能的基础组件。核心逻辑简单直接：加载 `GameInfoProvider`，接收种子范围和规则集作为输入，遍历种子范围内的所有种子并验证是否符合规则集，符合条件的种子将被添加到结果列表并反馈给主线程。

Noitool 提供两种种子搜索器：浏览器内搜索器和 Node 环境搜索器，入口文件均位于 `src/workers` 目录。`src/consoleSearch.ts` 中的 `ConsoleSearch` 会被打包到 Docker 容器中，可独立运行；浏览器端则通过 Web Worker 实现搜索功能。Web Worker 交互存在部分特殊注意事项，代码中已添加注释说明。

可查看 `src/components/SearchSeeds/SearchContext.tsx` 了解前端的搜索管理逻辑（理论上该逻辑应封装为有状态类）。

### 关于地图的小吐槽

地图生成功能尚未完全实现，无法 100% 正常工作。尽管已尽力优化，但仍存在部分未解决的边缘场景。`src/services/SeedInfo/infoHandler/InfoProviders/Map` 目录包含所有生物群系生成类，这些类由 Lua 代码手动转换为 TypeScript 代码（半手动流程）。理论上可通过抽象语法树（AST）直接转换，但目前尚未实现。可查看 `dataScripts/src/mapsToObj/generateMaps.ts` 和 `dataScripts/src/mapsToObj/generateMapImpls.ts` 了解转换流程。

我对 [王氏瓦片生成（Wang generation）](https://noita.fandom.com/wiki/World_generation#Herringbone_Wang_Tiles) 的逻辑有 100% 的把握，但王氏瓦片到实际瓦片的转换过程及「游戏空间」中的坐标计算仍存在精度问题。一旦解决该问题，Noitool 就能获取每个种子对应的完整地图信息。需要注意的是，敌人生成逻辑依赖 `RaytracePlatforms` 函数的实现，而该函数需要基于实际地形生成结果，目前尚未破解。

------

## 吐槽时刻

Noitool 尚未完全完工，我的目标是完全解析 Noita 中所有与游戏玩法相关的确定性逻辑。最终状态需要实现完整的地图生成功能和 `RaytracePlatforms()` 函数破解，这样才能获取游戏中所有可能的信息并展示。

我认为需要重新设计地图生成的实现逻辑 —— 最初按生物群系拆分生成的思路是错误的。游戏的实际运行逻辑是：围绕相机位置生成瓦片，仅在需要时才生成生物群系。例如，`LoadPixelScene` 可以在其瓦片范围外绘制实体（且能正常工作），典型案例是圣山（Holy Mountains）和 `spawn_altar_top`：传送门和可能的液体泛滥效果定义在圣山之上，但实际位于上方的生物群系区域内。

关于 WebAssembly 和 C++ 的一个遗憾：我没有将其充分拆分。理想情况下，地图生成模块和基础 `noita_random` 模块应分离，这样可以简化 WebAssembly 的加载流程，提升代码模块化程度。

另一个遗憾是未能充分优化 UI 代码的复用性。如果能将 UI 层与交互逻辑分离，后续开发会更加高效。目前许多组件直接依赖 `GameInfoProvider` 并在内部生成数据，建议重构为 UI 层与数据层完全解耦的架构：UI 仅触发事件，由独立层处理事件逻辑。这样可以通过模拟数据独立测试和开发 UI 层。

------

## 有趣的发现

WebAssembly 是一项非常出色的技术。在本项目中，JavaScript 与 WebAssembly 之间的通信开销通常是值得的 —— 这也是性能优化的主要方向，因为随机数生成（noita_random）调用需要频繁在 JavaScript 和 WebAssembly 之间切换。

游戏核心功能的许多关键逻辑由 C++ 编写，这些 C++ 代码被编译为 WebAssembly 并在 Web Worker（部分在主线程）中运行。将种子相关函数（如随机数生成、LC 和 AP 配方计算）从 TypeScript 迁移到 C++ 后，即使包含 Worker 到 WebAssembly 的调用开销，性能仍提升了 20 倍。

Noita 的地图生成采用 [王氏瓦片（wang tiles）](https://github.com/nothings/stb/blob/master/stb_herringbone_wang_tile.h) 技术。Lua/XML 代码中使用 ARGB 颜色格式进行颜色定位，而浏览器通常采用 RGBA 格式。因此，数据 JSON 文件中的颜色数据已转换为 RGBA 格式，以实现颜色格式统一。

鸣谢同类工具的开发者：

- LC 和 AP 值的查找逻辑改编自 [noita_unicorn](https://github.com/SaphireLattice/noita_unicorn) 的 `Program.cs`，已从 C# 迁移至 C++。
- 部分额外功能灵感来自 [cr4xy](https://cr4xy.dev/noita/)，你们太厉害了！❤️

通过 Web Worker 传递搜索配置时，字符串相等性判断是一个痛点。JavaScript 中存在 `new String('a') !== new String('a')` 的特殊行为 —— 字符串默认按引用比较而非值比较。因此，在 `test()` 函数的部分场景中，需要通过 `new String()` 重新初始化字符串，确保比较逻辑正确。

游戏的 Lua 文件中隐藏着大量有价值的信息。通过将 Lua 代码编译为抽象语法树（AST）并遍历，可提取游戏的各类细节信息。目前数据脚本中尚未充分利用这一特性，但它无疑是一座信息金矿，未来应进一步挖掘。
