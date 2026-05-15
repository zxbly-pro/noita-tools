--[[
文件功能描述：
  处理天赋拾取回调：根据物品上的存储变量决定是否移除其他天赋、应用游戏效果与 UI 图标，并按设置扣除/惩罚玩家生命。

主要模块说明：
  - `EntityGetComponent`/`ComponentGetValue`/`ComponentGetValueBool`：读取物品变量（引用：lua_api_documentation.txt:66, 182, 186）。
  - `EntityGetFirstComponent`/`ComponentGetValue2`/`ComponentSetValue2`：读取与写入玩家生命（引用：lua_api_documentation.txt:71, 249, 253）。
  - `GlobalsGetValue`/`EntityLoad`/`EntityKill`：运行状态与实体生成/销毁（引用：lua_api_documentation.txt:815, 13, 242）。
  - `GetGameEffectLoadTo` 与 `ComponentSetValue`：状态效果应用（引用：lua_api_documentation.txt:614, 202）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；将行注释改为块注释；未更改逻辑实现。

]]

dofile_once("data/scripts/game_helpers.lua")
dofile_once("data/scripts/lib/utilities.lua")
dofile_once( "data/scripts/perks/perk_list.lua" )
dofile( "mods/monster_slaying_rewards/files/scripts/spawn_perk.lua" )
dofile( "mods/monster_slaying_rewards/files/scripts/status.lua" )

--[[
函数：item_pickup
功能：
  天赋拾取回调。根据 VariableStorageComponent 的设置决定是否移除其它天赋；为拾取者应用游戏效果与 UI 图标；
  并依据设置扣除最大生命或触发惩罚召唤。
参数：
  - entity_item:int 被拾取的天赋实体 ID。
  - entity_who_picked:int 拾取者实体 ID（通常为玩家）。
  - item_name:string 物品名称。
返回值：
  无
可能抛出的异常：
  - 组件不存在或字段缺失导致读取返回 nil；需判空。
  - 惩罚逻辑中 `EntityRemoveComponent` 的调用参数不符合签名可能报错（参考 API）。
]]
function item_pickup( entity_item, entity_who_picked, item_name )
    local kill_other_perks = true

    local components = EntityGetComponent( entity_item, "VariableStorageComponent" )

    if ( components ~= nil ) then
        for key,comp_id in pairs(components) do
            local var_name = ComponentGetValue( comp_id, "name" )
            if( var_name == "perk_dont_remove_others") then
                if( ComponentGetValueBool( comp_id, "value_bool" ) ) then
                    kill_other_perks = false
                end
            end
        end
    end

    pickup_perk( entity_item, entity_who_picked, item_name, true, kill_other_perks )

    --[[ 捡起天赋的代价 ]]
    local dcomp = EntityGetFirstComponent( entity_who_picked, "DamageModelComponent" )
    if dcomp ~= nil then
        local max_hp = ComponentGetValue2( dcomp, "max_hp" )
        local current_hp = ComponentGetValue2( dcomp, "hp" )
        --[[ 当血量大于 50（内部约 2.0）时仅扣最大生命；否则扣当前生命并生成守卫实体。 ]]
        if( max_hp > 2) then
            max_hp = math.max(max_hp - ModSettingGet("monster_slaying_rewards.pickup_perk_cost") ,2 )
            ComponentSetValue2( dcomp, "max_hp",max_hp )
            --[[ 给玩家一个状态（见 status.lua） ]]
            status_add()
        else if (max_hp <= 2 and ModSettingGet("monster_slaying_rewards.pickup_perk_punishment") == "open") then
            current_hp = math.max(current_hp - ModSettingGet("monster_slaying_rewards.pickup_perk_cost") , 0.04 )
            ComponentSetValue2( dcomp, "hp",current_hp )
            local entity_id = GetUpdatedEntityID()
            local pos_x, pos_y = EntityGetTransform(entity_id)

            if tonumber(GlobalsGetValue("STEVARI_DEATHS", 0)) < 3 then
                EntityLoad("data/entities/animals/necromancer_shop.xml", pos_x, pos_y)
            else
                EntityLoad("data/entities/animals/necromancer_super.xml", pos_x, pos_y)
            end

            EntityKill(entity_id)

            --[[
            local players = EntityGetWithTag("player_unit")
            for key,player_id in ipairs(players) do
                local game_effect_component = GetGameEffectLoadTo(player_id, "PROTECTION_ALL", true)
                if game_effect_component ~= nil then
                    ComponentSetValue(game_effect_component, "frames", "600")
                    EntityAddComponent2( game_effect_component, "UIIconComponent",
                            {
                                name = "Ambrosia",
                                icon_sprite_file = "data/ui_gfx/status_indicators/protection_all_evil.png",
                                display_above_head = true,
                                display_in_hud = false,
                                is_perk = false,
                            })
                end
            end
            ]]
            end
        end
    end
        --[[
        local lua_comps = EntityGetComponentIncludingDisabled( entity_id, "LuaComponent")
        if lua_comps ~= nil and #lua_comps >0 then
            for _,comp in pairs(lua_comps) do
                local lua_file = ComponentGetValue2(comp, "script_item_picked_up" )
                if lua_file ~= nil and lua_file ~= "" then
                    if lua_file == "data/scripts/perks/perk_pickup.lua" then
                        print("change lua file.")
                        ComponentSetValue2(comp,"script_item_picked_up", "mods/…………" )
                    end
                end
            end
        end
        ]]
end
