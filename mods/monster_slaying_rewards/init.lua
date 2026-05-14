--[[
文件功能描述：
  初始化脚本。加载游戏辅助与通用工具库，为本模组的掉落逻辑与天赋处理脚本提供基础函数与环境。

主要模块说明：
  - `game_helpers.lua`：提供实体检索、组件编辑等常用辅助方法。
  - `utilities.lua`：提供通用工具函数（例如组件编辑便捷函数），与其它脚本共同使用。

修改历史记录：
  - 2025-12-11：添加规范中文注释；未更改任何逻辑实现。

]]

dofile_once("data/scripts/game_helpers.lua")
dofile_once("data/scripts/lib/utilities.lua")
