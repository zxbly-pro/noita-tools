local function early_init()
    if #ModLuaFileGetAppends("mods/quant.ew/files/core/early_init.lua") == 0 then
        -- Use appends to store data
        ModLuaFileAppend("mods/quant.ew/files/core/early_init.lua", "data/scripts/empty.lua")

        -- Early init stuff, called before main "mod" is loaded. Meaning we can append to data/scripts/init.lua
        dofile("mods/quant.ew/files/core/early_init.lua")
    end
end

dofile("data/scripts/lib/mod_settings.lua") -- see this file for documentation on some of the features.

-- This file can't access other files from this or other mods in all circumstances.
-- Settings will be automatically saved.
-- Settings don't have access unsafe lua APIs.

-- Use ModSettingGet() in the game to query settings.
-- For some settings (for example those that affect world generation) you might want to retain the current value until a certain point, even
-- if the player has changed the setting while playing.
-- To make it easy to define settings like that, each setting has a "scope" (e.g. MOD_SETTING_SCOPE_NEW_GAME) that will define when the changes
-- will actually become visible via ModSettingGet(). In the case of MOD_SETTING_SCOPE_NEW_GAME the value at the start of the run will be visible
-- until the player starts a new game.
-- ModSettingSetNextValue() will set the buffered value, that will later become visible via ModSettingGet(), unless the setting scope is MOD_SETTING_SCOPE_RUNTIME.

function mod_setting_change_callback(mod_id, gui, in_main_menu, setting, old_value, new_value)
    print(tostring(new_value))
end

local mod_id = "quant.ew" -- This should match the name of your mod's folder.
local prfx = mod_id .. "."
mod_settings_version = 1 -- This is a magic global that can be used to migrate settings to new mod versions. call mod_settings_get_version() before mod_settings_update() to get the old value.
mod_settings = {}

--KEY SWITCHER IS FROM NOITA FAIR MOD <3 thx
--- gather keycodes from game file
local function gather_key_codes()
    local arr = {}
    arr["0"] = GameTextGetTranslatedOrNot("$menuoptions_configurecontrols_action_unbound")
    local keycodes_all = ModTextFileGetContent("data/scripts/debug/keycodes.lua")
    for line in keycodes_all:gmatch("Key_.-\n") do
        local _, key, code = line:match("(Key_)(.+) = (%d+)")
        arr[code] = key:upper()
    end
    return arr
end
local keycodes = gather_key_codes()

local function pending_input()
    for code, _ in pairs(keycodes) do
        if InputIsKeyJustDown(code) then
            return code
        end
    end
end

local function ui_get_input(_, gui, _, im_id, setting)
    local setting_id = prfx .. setting.id
    local current = tostring(ModSettingGetNextValue(setting_id)) or "0"
    local current_key = "[" .. keycodes[current] .. "]"

    if setting.is_waiting_for_input then
        current_key = GameTextGetTranslatedOrNot("$menuoptions_configurecontrols_pressakey")
        local new_key = pending_input()
        if new_key then
            ModSettingSetNextValue(setting_id, new_key, false)
            setting.is_waiting_for_input = false
        end
    end

    GuiLayoutBeginHorizontal(gui, 0, 0, true, 0, 0)
    GuiText(gui, mod_setting_group_x_offset, 0, setting.ui_name)

    GuiText(gui, 8, 0, "")
    local _, _, _, x, y = GuiGetPreviousWidgetInfo(gui)
    local w, h = GuiGetTextDimensions(gui, current_key)
    GuiOptionsAddForNextWidget(gui, GUI_OPTION.ForceFocusable)
    GuiImageNinePiece(gui, im_id, x, y, w, h, 0)
    local _, _, hovered = GuiGetPreviousWidgetInfo(gui)
    if hovered then
        GuiTooltip(gui, setting.ui_description, GameTextGetTranslatedOrNot("$menuoptions_reset_keyboard"))
        GuiColorSetForNextWidget(gui, 1, 1, 0.7, 1)
        if InputIsMouseButtonJustDown(1) then
            setting.is_waiting_for_input = true
        end
        if InputIsMouseButtonJustDown(2) or InputIsMouseButtonJustDown(3) then
            GamePlaySound("ui", "ui/button_click", 0, 0)
            ModSettingSetNextValue(setting_id, setting.value_default, false)
            setting.is_waiting_for_input = false
        end
    end
    if keycodes[current] == "BACKSPACE" then
        current_key = "[MIDDLE MOUSE BUTTON]"
    end
    GuiText(gui, 0, 0, current_key)

    GuiLayoutEnd(gui)
end

local function build_settings()
    local settings = {
        {
            category_id = "keybinds",
            ui_name = "按键绑定",
            ui_description = "按键绑定",
            settings = {
                {
                    id = "rebind_ping",
                    ui_name = "Ping 按键",
                    ui_description = "信号（Ping）",
                    value_default = "42",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "rebind_lspectate",
                    ui_name = "旁观左侧按键",
                    ui_description = "左",
                    value_default = "54",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "rebind_rspectate",
                    ui_name = "旁观右侧按键",
                    ui_description = "右",
                    value_default = "55",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "rebind_sspectate",
                    ui_name = "旁观自身按键",
                    ui_description = "自身",
                    value_default = "56",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "rebind_mspectate",
                    ui_name = "旁观最近玩家按键",
                    ui_description = "最近玩家",
                    value_default = "52",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "rebind_ptt",
                    ui_name = "按键说话",
                    ui_description = "按键说话（设置在 proxy 语音界面）",
                    value_default = "23",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "ptt_toggle",
                    ui_name = "切换静音",
                    ui_description = "切换静音（替代按住说话）",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "text",
                    ui_name = "文本",
                    ui_description = "你好",
                    value_default = "40",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "stoptext",
                    ui_name = "停止文本",
                    ui_description = "再见",
                    value_default = "76",
                    ui_fn = ui_get_input,
                    is_waiting_for_input = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "no_gamepad",
                    ui_name = "不添加手柄键位绑定",
                    ui_description = "不支持手柄键位绑定",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
            },
        },
        {
            category_id = "ui",
            ui_name = "界面",
            ui_description = "界面",
            settings = {
                {
                    id = "notext",
                    ui_name = "不显示文本",
                    ui_description = "不显示文本",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "nochathint",
                    ui_name = "不显示聊天提示",
                    ui_description = "不显示聊天提示",
                    value_default = true,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "textcolor",
                    ui_name = "聊天昵称亮度",
                    ui_description = "0 表示玩家主色，255 表示白色，默认 63",
                    value_default = 0,
                    value_min = 0,
                    value_max = 255,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "textaltcolor",
                    ui_name = "聊天消息亮度",
                    ui_description = "0 表示玩家次色，255 表示白色，默认 191",
                    value_default = 255,
                    value_min = 0,
                    value_max = 255,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "ping_life",
                    ui_name = "Ping 持续时间",
                    ui_description = "单位：秒",
                    value_default = "6.0",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "ping_size",
                    ui_name = "Ping 额外大小",
                    ui_description = "单位：像素",
                    value_default = "0.0",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "disable_cursors",
                    ui_name = "禁用其他玩家光标",
                    ui_description = "布尔值",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "disable_arrows",
                    ui_name = "禁用其他玩家箭头",
                    ui_description = "布尔值",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "disable_nametags",
                    ui_name = "禁用其他玩家名称标签",
                    ui_description = "布尔值",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
            },
        },
        {
            category_id = "misc",
            ui_name = "杂项",
            ui_description = "杂项",
            settings = {
                {
                    id = "flex",
                    ui_name = "灵活更新",
                    ui_description = "一种区块更新策略，可能提升性能但有 Bug",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "log_performance",
                    ui_name = "记录性能数据",
                    ui_description = "将性能数据写入日志",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "cache",
                    ui_name = "缓存实体",
                    ui_description = "缓存实体数据以提升性能",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "enable_log",
                    ui_name = "启用日志",
                    ui_description = "启用 Noita 日志（略降性能）",
                    value_default = true,
                    scope = MOD_SETTING_SCOPE_NEW_GAME,
                },
                {
                    id = "text_range",
                    ui_name = "文本聊天范围",
                    ui_description = "文本聊天范围（像素），0 为禁用",
                    value_default = "0",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "tetherrange",
                    ui_name = "系绳范围",
                    ui_description = "半径（像素），0 为禁用",
                    value_default = "0",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                --[[{
                    id = "entity_sync",
                    ui_name = "entity sync interval",
                    ui_description = "every N frames entitys under your authority are synced",
                    value_default = "2",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },]]
                {
                    id = "world_sync",
                    ui_name = "世界同步间隔",
                    ui_description = "世界同步频率",
                    value_default = "4",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                --[[                {
                    id = "rocks",
                    ui_name = "cap of special item entities to be synced",
                    ui_description = "max amount of proj to be synced, -1 for infinite",
                    value_default = "16",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },TODO]]
                {
                    id = "explosions",
                    ui_name = "单帧可处理的爆炸半径数量",
                    ui_description = "如出现网络卡顿请降低，世界同步异常请提高（受 CPU 限制）",
                    value_default = "128",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "cell_eater",
                    ui_name = "单帧可处理的细胞吞噬逻辑长度",
                    ui_description = "如出现网络卡顿请降低，世界同步异常请提高（受 CPU 限制）",
                    value_default = "64",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "disable_shield",
                    ui_name = "死亡时禁用护盾",
                    ui_description = "布尔值",
                    value_default = false,
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
                {
                    id = "team",
                    ui_name = "友伤队伍",
                    ui_description = "队伍编号用于友伤判定，0 无队伍，-1 友方",
                    value_default = "0",
                    scope = MOD_SETTING_SCOPE_RUNTIME,
                },
            },
        },
    }
    return settings
end
mod_settings = build_settings()

-- This function is called to ensure the correct setting values are visible to the game via ModSettingGet(). your mod's settings don't work if you don't have a function like this defined in settings.lua.
-- This function is called:
--        - when entering the mod settings menu (init_scope will be MOD_SETTINGS_SCOPE_ONLY_SET_DEFAULT)
--         - before mod initialization when starting a new game (init_scope will be MOD_SETTING_SCOPE_NEW_GAME)
--        - when entering the game after a restart (init_scope will be MOD_SETTING_SCOPE_RESTART)
--        - at the end of an update when mod settings have been changed via ModSettingsSetNextValue() and the game is unpaused (init_scope will be MOD_SETTINGS_SCOPE_RUNTIME)
function ModSettingsUpdate(init_scope)
    --local old_version = mod_settings_get_version( mod_id ) -- This can be used to migrate some settings between mod versions.
    mod_settings = build_settings()
    mod_settings_update(mod_id, mod_settings, init_scope)
    if ModIsEnabled(mod_id) and (init_scope == 0 or init_scope == 1) then
        print("Running early init fn")
        early_init()
    end
end

-- This function should return the number of visible setting UI elements.
-- Your mod's settings wont be visible in the mod settings menu if this function isn't defined correctly.
-- If your mod changes the displayed settings dynamically, you might need to implement custom logic.
-- The value will be used to determine whether or not to display various UI elements that link to mod settings.
-- At the moment it is fine to simply return 0 or 1 in a custom implementation, but we don't guarantee that will be the case in the future.
-- This function is called every frame when in the settings menu.
function ModSettingsGuiCount()
    return mod_settings_gui_count(mod_id, mod_settings)
end

-- This function is called to display the settings UI for this mod. Your mod's settings wont be visible in the mod settings menu if this function isn't defined correctly.
function ModSettingsGui(gui, in_main_menu)
    mod_settings_gui(mod_id, mod_settings, gui, in_main_menu)
end
