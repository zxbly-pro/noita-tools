--[[
文件功能描述：
  Mod 设置定义脚本。通过 `mod_settings.lua` 的接口定义/更新/绘制本模组的配置项，包括法术掉落概率、掉落逻辑、
  天赋掉落与拾取惩罚等。

主要模块说明：
  - `mod_settings.lua`：提供 `mod_settings_update`、`mod_settings_gui_count`、`mod_settings_gui` 等设置管理与 UI 绘制函数。
  - `ModSettingGet(id)`：运行时查询设置值（引用：lua_api_documentation.txt:1411）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；将行注释改为块注释；未更改任何逻辑实现。

]]

dofile("data/scripts/lib/mod_settings.lua")

--[[ 在游戏中使用 ModSettingGet() 查询设置。 ]]
local mod_id = "monster_slaying_rewards"
mod_settings_version = 1
mod_settings = 
{
  {
    category_id = "monster_slaying_rewards_settings",
    ui_name = "敌人掉落法术设置",
    ui_description = "设置敌人掉落法术的相关参数。",
    settings = 
    {
      {
        id = "drop_spell_chance",
        ui_name = "掉落法术概率",
        ui_description = "击杀敌人掉落法术的概率。默认值为 8%。",
        value_default = 0.08,
        value_min = 0,
        value_max = 1,
        value_display_multiplier = 100,
        value_display_formatting = " $0 %",
        scope = MOD_SETTING_SCOPE_RUNTIME,
      },
      {
        id = "drop_spell_logic",
        ui_name = "掉落法术逻辑",
        ui_description = "选择掉落法术的逻辑。默认值为根据圣山商店逻辑。",
        value_default = "shop",
        values = { {"shop", "圣山商店"}, {"random", "随机"} },
        scope = MOD_SETTING_SCOPE_RUNTIME,
      },
      {
        id = "drop_perk_logic",
        ui_name = "掉落天赋逻辑",
        ui_description = "选择掉落天赋的逻辑。默认值为开启。",
        value_default = "open",
        values = { {"open", "开启"}, {"close", "关闭"} },
        scope = MOD_SETTING_SCOPE_RUNTIME,
      },
      {
        id = "drop_perk_chance",
        ui_name = "掉落天赋概率",
        ui_description = "击杀敌人掉落天赋的概率。默认值为 0.1%。",
        value_default = 0.001,
        value_min = 0,
        value_max = 0.1,
        value_display_multiplier = 100,
        value_display_formatting = " $0 %",
        scope = MOD_SETTING_SCOPE_RUNTIME,
      },
      {
        id = "pickup_perk_cost",
        ui_name = "拾取天赋成本",
        ui_description = "拾取一个天赋需要的最大生命值,最低降至 50。默认为 25 最大生命值。",
        value_default = 1,
        value_min = 0,
        value_max = 8,
        value_display_multiplier = 25,
        value_display_formatting = " $0 HP",
        scope = MOD_SETTING_SCOPE_RUNTIME,
      },
      {
        id = "pickup_perk_punishment",
        ui_name = "拾取天赋惩罚",
        ui_description = "当最大生命值低于 50 时是否开启惩罚。默认值为开启。当开启时，会生成一个商店守卫。",
        value_default = "open",
        values = { {"open", "开启"}, {"close", "关闭"} },
        scope = MOD_SETTING_SCOPE_RUNTIME,
      }
    }
  }
}

--[[
函数：ModSettingsUpdate
功能：
  确保设置值正确暴露给游戏引擎以供 `ModSettingGet()` 查询；在不同初始化范围下应用默认值或迁移版本。
参数：
  - init_scope:int 初始化范围枚举（如 MOD_SETTINGS_SCOPE_ONLY_SET_DEFAULT、MOD_SETTING_SCOPE_NEW_GAME、MOD_SETTING_SCOPE_RESTART、MOD_SETTINGS_SCOPE_RUNTIME）。
返回值：
  无
可能抛出的异常：
  - 当 `mod_settings` 结构不合法或 `mod_settings.lua` 未正确加载时，更新函数可能报告错误。
引用 API：
  - mod_settings_update(mod_id, mod_settings, init_scope)（来自 `mod_settings.lua`）。
]]
function ModSettingsUpdate( init_scope )
	local old_version = mod_settings_get_version( mod_id ) -- This can be used to migrate some settings between mod versions.
	mod_settings_update( mod_id, mod_settings, init_scope )
end

--[[
函数：ModSettingsGuiCount
功能：
  返回当前设置 UI 元素的可见数量，用于决定是否展示关联到 Mod 设置的 UI 元素；在设置菜单中每帧调用。
参数：
  无
返回值：
  - int：可见设置项数量。
可能抛出的异常：
  无显式异常；若 `mod_settings` 定义不完整可能导致返回值异常。
引用 API：
  - mod_settings_gui_count(mod_id, mod_settings)。
]]
function ModSettingsGuiCount()
	--[[ 若以下判断打开，则菜单仅在 noita_dev.exe 中工作：
	if (not DebugGetIsDevBuild()) then
		return 0
	end
	]]

	return mod_settings_gui_count( mod_id, mod_settings )
end

--[[
函数：ModSettingsGui
功能：
  绘制 Mod 设置的 GUI；由引擎在设置菜单状态下调用。
参数：
  - gui:obj GUI 句柄。
  - in_main_menu:bool 是否处于主菜单状态。
返回值：
  无
可能抛出的异常：
  - 当 `mod_settings` 不合法或 GUI 句柄无效时，绘制可能失败。
引用 API：
  - mod_settings_gui(mod_id, mod_settings, gui, in_main_menu)。
]]
function ModSettingsGui( gui, in_main_menu )
  mod_settings_gui( mod_id, mod_settings, gui, in_main_menu )
end
