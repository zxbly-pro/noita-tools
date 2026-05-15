--[[
文件功能描述：
  在玩家捡起天赋后赋予一个状态效果与 UI 图标，当前实现给予“BLINDNESS”短时效果与贪婪诅咒图标说明。

主要模块说明：
  - `EntityGetWithTag("player_unit")`：获取玩家实体（引用：lua_api_documentation.txt:139）。
  - `GetGameEffectLoadTo(entity_id,effect,always_new)`：加载状态效果组件（引用：lua_api_documentation.txt:614）。
  - `ComponentSetValue(comp,"frames",value)`：设置效果持续帧数（引用：lua_api_documentation.txt:202，建议使用 SetValue2）。
  - `EntityAddComponent2(entity_id,"UIIconComponent",values)`：添加 UI 图标（引用：lua_api_documentation.txt:265）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；未更改逻辑实现。

]]

dofile_once("data/scripts/game_helpers.lua")
dofile_once("data/scripts/lib/utilities.lua")

--[[
函数：status_add
功能：
  为玩家添加一个状态效果与 UI 图标，用于提示因贪婪导致的生命损失风险；当前实现添加 BLINDNESS 效果 60 帧。
参数：
  无
返回值：
  无
可能抛出的异常：
  - `EntityRemoveComponent` 参数与签名不匹配可能导致错误（API 期望实体 ID 与组件 ID）。
]]
function status_add()
    local players = EntityGetWithTag("player_unit")
    for key,player_id in ipairs(players) do
        local game_effect_component = GetGameEffectLoadTo(player_id, "BLINDNESS", true)
        if game_effect_component ~= nil then
            ComponentSetValue(game_effect_component, "frames", "60")
            EntityRemoveComponent(game_effect_component,AudioComponent)
        end
        EntityAddComponent2( player_id, "UIIconComponent",
                {
                    icon_sprite_file="data/ui_gfx/status_indicators/greed_curse.png",
                    name="贪婪诅咒",
                    description="你因为贪婪而失去了最大生命值。\n过多的贪婪会导致神明愤怒！",
                    display_above_head = false,
                    display_in_hud = false,
                    is_perk = false
                } )
    end
end
