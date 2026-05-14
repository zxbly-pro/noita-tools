--[[
文件功能描述：
  计时器/GUI 展示脚本。通过协程循环（async_loop）在每帧刷新 UI 文本，显示当前累计击杀数（用于与最大生命值增量逻辑保持视觉同步）。

主要模块说明：
  - 协程库：`data/scripts/lib/coroutines.lua` 提供 `async_loop` 与 `wait` 等接口。
  - GUI 接口：`GuiCreate`/`GuiStartFrame`/`GuiLayoutBeginVertical`/`GuiText`/`GuiLayoutEnd`（引用：lua_api_documentation.txt:1181, 1189, 1311, 1249, 1320）。
  - 统计接口：`StatsGetValue(key)` 获取击杀数与死亡状态（引用：lua_api_documentation.txt:842）。
  - 运行标志：`GameHasFlagRun(flag)` 判断游戏状态（引用：lua_api_documentation.txt:1131）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；未更改任何逻辑实现。
]]

if not async then
	dofile( "data/scripts/lib/coroutines.lua" )
end
dofile( "data/scripts/lib/utilities.lua" )

--[[ 重要变量：
  - kills:string 当前累计击杀数的字符串表达（来源：StatsGetValue("enemies_killed")）。
  - gui:obj      GUI 对象句柄，通过 `GuiCreate()` 创建并在每帧 `GuiStartFrame(gui)` 后绘制。
]]
local kills = ""
local gui = GuiCreate()

--[[
函数：gui_frame_fn
功能：
  构建并绘制一帧的 GUI 布局，显示当前击杀数。使用垂直布局，并在指定坐标绘制文本。
参数：
  无（闭包读取外部变量 `gui` 与 `kills`）。
返回值：
  无
引用 API：
  - GuiLayoutBeginVertical(gui, x, y, position_in_ui_scale?, margin_x?, margin_y?)（lua_api_documentation.txt:1311）
  - GuiText(gui, x, y, text, scale?, font?, font_is_pixel_font?)（lua_api_documentation.txt:1249）
  - GuiLayoutEnd(gui)（lua_api_documentation.txt:1320）
]]
local gui_frame_fn = function()
	GuiLayoutBeginVertical( gui, 93, 0 )
	GuiText(gui, -35, 8, "kill: "..kills)
	GuiLayoutEnd(gui)
end

--[[
关键逻辑说明（协程循环）：
  - 在游戏未完成结局且玩家未死亡（StatsGetValue("dead") ~= "1"）时更新 `kills`。
  - 每帧调用 `GuiStartFrame(gui)` 初始化 GUI 绘制状态，并执行 `gui_frame_fn()` 进行布局与文本输出。
  - 使用 `wait(0)` 让协程在每帧末尾让出执行权，实现平滑 UI 更新。
可能边界情况：
  - `StatsGetValue` 返回 nil 时，`kills` 维持上一值（此处未强制转换为数值）。
  - `gui` 或 `gui_frame_fn` 为 nil 时跳过绘制以避免运行期错误。
]]
async_loop(function()
	if not GameHasFlagRun("ending_game_completed") and StatsGetValue("dead") ~= "1" then
		kills = StatsGetValue("enemies_killed")
	end
	if gui ~= nil then
		GuiStartFrame(gui)
	end
	if gui_frame_fn ~= nil then
		gui_frame_fn()
	end
	wait(0)
end)
