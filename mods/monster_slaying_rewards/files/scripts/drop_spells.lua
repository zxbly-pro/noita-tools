--[[
文件功能描述：
  敌人死亡时的掉落逻辑：根据设置决定是否掉落法术（随机或按店铺等级）以及是否掉落天赋；并在 `death` 回调中统一调度。

主要模块说明：
  - `drop_random_spells.lua`：随机法术掉落实现。
  - `generate_spells.lua`：按等级生成法术。
  - `spawn_perk.lua`：生成/拾取天赋相关函数。
  - `perks/perk.lua`：天赋系统工具。
  - `ModSettingGet(id)`：读取模组设置（引用：lua_api_documentation.txt:1411）。
  - `GetUpdatedEntityID()` 与 `EntityGetTransform()`：获取当前实体及位置（引用：lua_api_documentation.txt:300, 92）。
  - `GameGetIsTrailerModeEnabled()`：预告模式下跳过逻辑（引用：lua_api_documentation.txt:1356）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；未更改任何逻辑实现。

]]

dofile_once("data/scripts/game_helpers.lua")
dofile_once("data/scripts/lib/utilities.lua")
dofile( "mods/monster_slaying_rewards/files/scripts/drop_random_spells.lua" )
dofile( "mods/monster_slaying_rewards/files/scripts/generate_spells.lua" )
dofile( "mods/monster_slaying_rewards/files/scripts/spawn_perk.lua" )
dofile( "data/scripts/perks/perk.lua" )

--[[
函数：do_spell_drop
功能：
  根据设置概率与逻辑在敌人死亡位置掉落法术；若敌人具有 `no_gold_drop` 标签则不掉落法术。
参数：
  无
返回值：
  无
可能抛出的异常：
  - `edit_component_with_tag` 为工具库函数，若目标组件不存在则 `no_gold_drop` 不会被置位。
引用 API：
  - ModSettingGet(id)（lua_api_documentation.txt:1411）
]]

function do_spell_drop()
    local entity = GetUpdatedEntityID()
    local x, y = EntityGetTransform( entity )

    if ( GameGetIsTrailerModeEnabled() ) then return end

    --[[ 不掉黄金的怪不掉法术 ]]
    local no_gold_drop = false
    edit_component_with_tag( entity, "VariableStorageComponent", "no_gold_drop", function(comp,vars) no_gold_drop = true end )

    if no_gold_drop then
        return
    end

    if( math.random() < ModSettingGet("monster_slaying_rewards.drop_spell_chance") ) then
        if(ModSettingGet("monster_slaying_rewards.drop_spell_logic") == "random") then
            --[[ 随机掉落 ]]
            drop_random_spells( x , y - 7 )
        else
            --[[ 按商店等级生成法术 ]]
            generate_spells( x, y-6 , false )
        end
    end
end

--[[
函数：get_perk_flag_name
功能：
  根据天赋 ID 生成运行时标志名，用于标记拾取状态。
参数：
  - perk_id:string 天赋标识。
返回值：
  - string 运行标志名。
]]
local get_perk_flag_name = function( perk_id )
    return "PERK_" .. perk_id
end

--[[
函数：drop_perks
功能：
  按设置概率掉落一个天赋；预告模式或拥有 `no_gold_drop` 标签的怪不掉落。
参数：
  无
返回值：
  无
引用 API：
  - ModSettingGet(id)（lua_api_documentation.txt:1411）
]]
function drop_perks()
    --[[ 掉落一个天赋 ]]
    local entity = GetUpdatedEntityID()
    local x, y = EntityGetTransform( entity )

    if ( GameGetIsTrailerModeEnabled() ) then return end

    --[[ 不掉黄金的怪不掉 ]]
    local no_gold_drop = false
    edit_component_with_tag( entity, "VariableStorageComponent", "no_gold_drop", function(comp,vars) no_gold_drop = true end )

    if no_gold_drop then
        return
    end

    if( math.random() < ModSettingGet("monster_slaying_rewards.drop_perk_chance") ) then
        if( ModSettingGet("monster_slaying_rewards.drop_perk_logic") == "open") then

            --[[
            local perks = perk_get_spawn_order()
            local result_id = 0

            local next_perk_index = tonumber( GlobalsGetValue( "TEMPLE_NEXT_PERK_INDEX", "1" ) )
            local perk_id = perks[next_perk_index]

            next_perk_index = next_perk_index + 1
            if next_perk_index > #perks then
                next_perk_index = 1
            end
            GlobalsSetValue( "TEMPLE_NEXT_PERK_INDEX", tostring(next_perk_index) )

            GameAddFlagRun( get_perk_flag_name(perk_id) )
            result_id = perk_spawn( x, y-8, perk_id )

            EntityAddComponent2( result_id, "LuaComponent",
                    {

                        script_item_picked_up="mods/monster_slaying_rewards/files/scripts/pickup_perk.lua"
                    } )

            return result_id
            ]]

            result_id =  spawn_perk_random( x,y-6 )
            --[[
            EntityAddComponent2( result_id, "LuaComponent",
                    {

                        script_item_picked_up="mods/monster_slaying_rewards/files/scripts/pickup_perk.lua"
                    } )
            ]]
        end
    end

end

--[[
函数：death
功能：
  敌人死亡回调；触发法术和天赋的掉落流程。
参数：
  - damage_type_bit_field:int 伤害类型位掩码。
  - damage_message:string 伤害消息文本。
  - entity_thats_responsible:int 造成伤害的实体 ID。
  - drop_items:bool 是否允许物品掉落。
返回值：
  无
]]
function death( damage_type_bit_field, damage_message, entity_thats_responsible, drop_items )
        do_spell_drop()
        drop_perks()
end
