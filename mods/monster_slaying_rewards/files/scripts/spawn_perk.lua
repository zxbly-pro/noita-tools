--[[
文件功能描述：
  天赋生成与拾取逻辑：提供生成天赋实体（指定或随机）、计算天赋生成序列、处理拾取时的效果与标志等。

主要模块说明：
  - `perk_list.lua`：天赋列表与元数据。
  - `EntityLoad` 与 `EntityAddComponent`/`EntityAddComponent2`：生成与初始化天赋物品（引用：lua_api_documentation.txt:13, 52, 265）。
  - `GlobalsGetValue`/`GlobalsSetValue` 与 `GameAddFlagRun`/`AddFlagPersistent`：运行状态与持久化标志（引用：lua_api_documentation.txt:815, 811, 1123, 1111）。
  - `Random`/`SetRandomSeed`：序列生成/随机（引用：lua_api_documentation.txt:927, 922）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；未更改逻辑实现。

]]

dofile_once("data/scripts/lib/utilities.lua")
dofile_once( "data/scripts/perks/perk_list.lua" )

--[[
函数：get_perk_flag_name
功能：
  根据天赋 ID 生成运行时标志名，用于标记拾取与生成状态。
参数：
  - perk_id:string 天赋标识。
返回值：
  - string 标志名。
]]
local get_perk_flag_name = function( perk_id )
    return "PERK_" .. perk_id
end

--[[
函数：perk_is_stackable
功能：
  判断天赋是否可堆叠与是否稀有（仅在每个生成序列中出现一次）。若设置了最大堆叠次数，则在达到上限后视为不可堆叠。
参数：
  - perk_data:table 天赋元数据对象。
返回值：
  - is_stackable:bool 是否可堆叠。
  - is_rare:bool 是否稀有堆叠（仅一次）。
]]
function perk_is_stackable( perk_data )
    local is_stackable = ( perk_data.stackable ~= nil ) and ( perk_data.stackable == true )
    local is_rare = ( perk_data.stackable_is_rare ~= nil ) and ( perk_data.stackable_is_rare == true ) -- stackable_is_rare indicates a perk that does stack but only appears once per every spawn order

    --[[ 当天赋设置了最大堆叠次数，超过后不再出现 ]] 
    if is_stackable and ( perk_data.stackable_maximum ~= nil ) then
        local flag_name = get_perk_picked_flag_name( perk_data.id )
        local pickup_count = tonumber( GlobalsGetValue( flag_name .. "_PICKUP_COUNT", "0" ) )

        if ( pickup_count >= perk_data.stackable_maximum ) then
            is_stackable = false
            is_rare = false
        end
    end

    return is_stackable, is_rare
end

--[[
函数：pickup_perk
功能：
  将天赋应用到拾取者：设置运行标志、添加游戏效果、更新 UI 图标，并在需要时触发外观效果（屏幕震动、提示、粒子）。
参数：
  - entity_item:int 被拾取的天赋实体 ID。
  - entity_who_picked:int 拾取者实体 ID。
  - item_name:string 物品名称。
  - do_cosmetic_fx:bool 是否播放外观效果。
  - kill_other_perks:bool 是否移除其它天赋。
返回值：
  无
可能抛出的异常：
  - 组件缺失或字段错误导致读取失败。
引用 API：
  - GamePlaySound、GameScreenshake、GamePrintImportant（引用：lua_api_documentation.txt:1146, 342, 725）。
]]
function pickup_perk( entity_item, entity_who_picked, item_name, do_cosmetic_fx, kill_other_perks )
    --[[ fetch perk info --------------------------------------------------- ]]

    local pos_x, pos_y = EntityGetTransform( entity_item )

    local perk_name = "PERK_NAME_NOT_DEFINED"
    local perk_desc = "PERK_DESCRIPTION_NOT_DEFINED"

    local perk_id = ""
    edit_component( entity_item, "VariableStorageComponent", function(comp,vars)
        perk_id = ComponentGetValue( comp, "value_string" )
    end)

    local perk_data = get_perk_with_id( perk_list, perk_id )
    if perk_data == nil then
        return
    end

    --[[ 获取天赋标志名 ]]

    local flag_name = get_perk_picked_flag_name( perk_id )

    --[[ 更新本次运行中拾取次数 ----------------- ]]

    local pickup_count = tonumber( GlobalsGetValue( flag_name .. "_PICKUP_COUNT", "0" ) )
    pickup_count = pickup_count + 1
    GlobalsSetValue( flag_name .. "_PICKUP_COUNT", tostring( pickup_count ) )

    --[[ 为拾取者加载天赋 ----------------------------------- ]]

    local flag_name_persistent = string.lower( flag_name )
    if ( HasFlagPersistent( flag_name_persistent ) == false ) then
        GameAddFlagRun( "new_" .. flag_name_persistent )
    end
    GameAddFlagRun( flag_name )
    AddFlagPersistent( flag_name_persistent )

    --[[ 添加游戏效果 ]]
    if perk_data.game_effect ~= nil then
        local game_effect_comp = GetGameEffectLoadTo( entity_who_picked, perk_data.game_effect, true )
        if game_effect_comp ~= nil then
            ComponentSetValue( game_effect_comp, "frames", "-1" )
        end
    end

    if perk_data.remove_other_perks ~= nil then
        for i,v in ipairs( perk_data.remove_other_perks ) do
            local f = get_perk_picked_flag_name( v )
            GameAddFlagRun( f )
        end
    end

    if perk_data.func ~= nil then
        perk_data.func( entity_item, entity_who_picked, item_name )
    end

    perk_name = GameTextGetTranslatedOrNot( perk_data.ui_name )
    perk_desc = GameTextGetTranslatedOrNot( perk_data.ui_description )

    --[[ 添加 UI 图标等 ]]
    local entity_ui = EntityCreateNew( "" )
    EntityAddComponent( entity_ui, "UIIconComponent",
            {
                name = perk_data.ui_name,
                description = perk_data.ui_description,
                icon_sprite_file = perk_data.ui_icon
            })
    EntityAddChild( entity_who_picked, entity_ui )

    --[[ 外观效果 ------------------------------------------------------- ]]
    if do_cosmetic_fx then
        local enemies_killed = tonumber( StatsBiomeGetValue("enemies_killed") )
        --[[ 先显示神明生气 ]]
        GamePlaySound( "data/audio/Desktop/event_cues.bank", "event_cues/angered_the_gods/create", pos_x, pos_y )
        GameScreenshake( 50 )
        GamePrintImportant("神明愤怒！", "你因为贪婪而失去了一部分最大生命值。")
        --[[ 再显示天赋信息 ]]
        EntityLoad( "mods/monster_slaying_rewards/files/entities/perk_pickup_effect.xml", pos_x, pos_y )
        GamePrintImportant( GameTextGet( "$log_pickedup_perk", GameTextGetTranslatedOrNot( perk_name ) ), perk_desc )
    end

    --[[
    disable the perk rerolling machine --------------------------------
    local x,y = EntityGetTransform( entity_who_picked )
    local rerolls = EntityGetInRadiusWithTag( x, y, 200, "perk_reroll_machine" )
    local other_perks = EntityGetInRadiusWithTag( x, y, 200, "item_perk" )

    print( "Other perks: " .. tostring( #other_perks ) .. ", " .. tostring( kill_other_perks ) )

    local disable_reroll = false

    if ( #other_perks <= 1 ) then
        disable_reroll = true
    end

    remove all perk items (also this one!) ----------------------------
    if kill_other_perks then
        local perk_destroy_chance = tonumber( GlobalsGetValue( "TEMPLE_PERK_DESTROY_CHANCE", "100" ) )
        SetRandomSeed( pos_x, pos_y )

        if( Random( 1, 100 ) <= perk_destroy_chance ) then
            removes all the perks
            local all_perks = EntityGetWithTag( "perk" )
            disable_reroll = true

            if ( #all_perks > 0 ) then
                for i,entity_perk in ipairs(all_perks) do
                    if entity_perk ~= entity_item then
                        EntityKill( entity_perk )
                    end
                end
            end
        end
    end

    if disable_reroll then
        for i,rid in ipairs( rerolls ) do
            local reroll_comp = EntityGetFirstComponent( rid, "ItemCostComponent" )

            if ( reroll_comp ~= nil ) then
                EntitySetComponentIsEnabled( rid, reroll_comp, false )
            end

            reroll_comp = EntityGetComponent( rid, "SpriteComponent", "shop_cost" )

            if ( reroll_comp ~= nil ) then
                for a,b in ipairs( reroll_comp ) do
                    EntitySetComponentIsEnabled( rid, b, false )
                end
            end

            EntitySetComponentsWithTagEnabled( rid, "perk_reroll_disable", false )
        end
    end
    ]]

    EntityKill( entity_item ) -- entity item should always be killed, hence we don't kill it in the above loop
end


--[[
函数：spawn_perk
功能：
  在指定位置生成特定天赋，并初始化其 UI、物品、动画与存储变量。
参数：
  - x:number 位置 X。
  - y:number 位置 Y。
  - perk_id:string 天赋标识。
返回值：
  - entity_id:int 生成的天赋实体 ID；失败返回 nil。
]]
function spawn_perk( x, y, perk_id )
    local perk_data = get_perk_with_id( perk_list, perk_id )
    if ( perk_data == nil ) then
        print_error( "spawn_perk( perk_id ) 调用时，参数 '" .. perk_id .. "' 对应的天赋不存在。" )
        return
    end

    print( "spawn_perk " .. tostring( perk_id ) .. " " .. tostring( x ) .. " " .. tostring( y ) )

    --[[ 生成天赋拾取实体并初始化组件 ]]
    local entity_id = EntityLoad( "mods/monster_slaying_rewards/files/entities/perk_pickup.xml", x, y )
    if ( entity_id == nil ) then
        return
    end

    --[[ 初始化天赋物品组件 ]]
    EntityAddComponent( entity_id, "SpriteComponent",
            {
                image_file = perk_data.perk_icon or "mods/monster_slaying_rewards/files/entities/perk.xml",
                offset_x = "8",
                offset_y = "8",
                update_transform = "1" ,
                update_transform_rotation = "0",
            } )

    EntityAddComponent( entity_id, "UIInfoComponent",
            {
                name = perk_data.ui_name,
            } )

    EntityAddComponent( entity_id, "ItemComponent",
            {
                item_name = perk_data.ui_name,
                ui_description = perk_data.ui_description,
                ui_display_description_on_pick_up_hint = "1",
                play_spinning_animation = "0",
                play_hover_animation = "0",
                play_pick_sound = "0",
            } )

    EntityAddComponent( entity_id, "SpriteOffsetAnimatorComponent",
            {
                sprite_id="-1" ,
                x_amount="0" ,
                x_phase="0" ,
                x_phase_offset="0" ,
                x_speed="0" ,
                y_amount="2" ,
                y_speed="3",
            } )

    EntityAddComponent( entity_id, "VariableStorageComponent",
            {
                name = "perk_id",
                value_string = perk_data.id,
            } )

    return entity_id
end

--[[
函数：perk_get_spawn_order
功能：
  生成天赋出现顺序（长度 300），非堆叠天赋在出现一次后移除，堆叠天赋在设定间距后可再次出现；返回值在一次运行内应保持确定性。
参数：
  无
返回值：
  - {string} 天赋 ID 列表。
关键代码段说明：
  - `create_perk_pool`：构造默认天赋池。
  - 去重逻辑：非堆叠天赋与稀有堆叠天赋的移除与间距约束。
]]
function perk_get_spawn_order()
    --[[ 本函数应在一次运行内任意调用均返回一致结果，且无副作用。 ]]
    local MIN_DISTANCE_BETWEEN_DUPLICATE_PERKS = 4
    local PERK_SPAWN_ORDER_LENGTH = 300
    local PERK_DUPLICATE_AVOIDANCE_TRIES = 400

    SetRandomSeed( 1, 2 )

    --[[ NOTE( Petri ): 23.4.2020 - 堆叠天赋集中在末尾的问题，通过位移使堆叠段位于中部。 ]]

    --[[ NOTE( Petri ): 23.4.2020 - 需重构：堆叠与非堆叠分布问题导致各种问题。 ]]

    --[[
    local create_perk_pools = function()
        local perks_stackable = {}
        local perks_not_stackable = {}

        for i,perk_data in ipairs(perk_list) do
            if ( perk_data.not_in_default_perk_pool == nil or perk_data.not_in_default_perk_pool == false ) then

                if( perk_is_stackable( perk_data ) ) then
                    table.insert( perks_stackable, perk_data )
                else
                    table.insert( perks_not_stackable, perk_data )
                end
            end
        end

        return perks_stackable, perks_not_stackable
    end


    local perk_pool_stackable, perk_pool_non_stackable = create_perk_pools()

    perk_pool_stackable = shuffle_array( perk_pool_stackable )
    perk_pool_non_stackable = shuffle_array( perk_pool_non_stackable )

    local result = {}
    local perk_pool_stackable_i = 1
    local perk_pool_non_stackable_i = 1

    for i=1,PERK_SPAWN_ORDER_LENGTH do
        local how_many_left = PERK_SPAWN_ORDER_LENGTH - i

    end

    --[[
    table.insert( result, perk_data.id )
    while( #perk_pool_stackable + #perk_pool_non_stackable < PERK_SPAWN_ORDER_LENGTH ) do
        local temp_array = shuffle_array( perk_pool_non_stackable )
    end
    ]]--

    --[[ NOTE( Arvi ): 26.10.2020 - 伪代码格式问题，已尝试定位正确的结束位置。 ]]

    --[[ 分隔符 ]]
    local create_perk_pool = function()
        local result = {}

        for i,perk_data in ipairs(perk_list) do
            if ( perk_data.not_in_default_perk_pool == nil or perk_data.not_in_default_perk_pool == false ) then
                table.insert( result, perk_data )
            end
        end

        return result
    end

    --[[ 分隔符 ]]
    local perk_pool = create_perk_pool()

    local result = { }
    local nonstackables = { }

    for i=1,PERK_SPAWN_ORDER_LENGTH do
        local tries = 0
        local perk_data = nil

        while tries < PERK_DUPLICATE_AVOIDANCE_TRIES do
            local ok = true
            if #perk_pool == 0 then
                perk_pool = create_perk_pool()
            end

            local index_in_perk_pool = Random( 1, #perk_pool )
            perk_data = perk_pool[index_in_perk_pool]

            local can_stack,only_once_per_spawn_order = perk_is_stackable( perk_data )

            if can_stack and ( only_once_per_spawn_order == false ) then

                --[[ Perks may have a special reoccurrence value ]]
                local min_distance = perk_data.stackable_how_often_reappears or MIN_DISTANCE_BETWEEN_DUPLICATE_PERKS

                for ri=#result-min_distance,#result do --  ensure stackable perks are not spawned too close to each other
                    if ri >= 1 and result[ri] == perk_data.id then
                        ok = false
                        break
                    end
                end
            else
                if ( can_stack == false ) then --  mark actual nonstackable perks so that they never appear again
                    nonstackables[perk_data.id] = 1
                end

                table.remove( perk_pool, index_in_perk_pool ) -- remove non-stackable perks and rare stackable perks from the pool
            end

            if ok then
                --[[ print( "Ignoring " .. perk_data.id .. " because it tried to reappear too soon" ) ]]
                break
            end

            tries = tries + 1
        end

        table.insert( result, perk_data.id )
    end

    --[[ 删除已收集的非堆叠天赋 ]]
    for i,perk_id in pairs( result ) do
        local flag_name = get_perk_picked_flag_name( perk_id )
        local pickup_count = tonumber( GlobalsGetValue( flag_name .. "_PICKUP_COUNT", "0" ) )

        if ( nonstackables[perk_id] ~= nil ) and ( ( pickup_count > 0 ) or GameHasFlagRun( flag_name ) ) then
            print( "已从天赋池移除 " .. perk_id .. " ，因为它已被拾取" )
            table.remove( result, i )
        end
    end

    --[[ 随机向前位移结果序列 ]]
    local new_start_i = Random( 10, 20 )
    local real_result = {}
    for i=1,PERK_SPAWN_ORDER_LENGTH do
        real_result[i] = result[ new_start_i ]
        new_start_i = new_start_i + 1
        if( new_start_i > #result ) then
            new_start_i = 1
        end
    end

    --[[
    debug - print duplicates
    for i,id in ipairs(result) do
        for i2,id2 in ipairs(result) do
            if id == id2 and i ~= i2 then
                print(id .. " " .. tostring(i) .. " and " .. tostring(i2))
            end
        end
    end
    ]]

    return real_result
end

--[[
函数：spawn_perk_random
功能：
  根据生成序列选择下一项天赋并在指定位置生成，随后更新序列索引与运行标志。
参数：
  - x:number 位置 X。
  - y:number 位置 Y。
返回值：
  - entity_id:int 生成的天赋实体 ID。
]]
function spawn_perk_random( x, y )
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
    result_id = spawn_perk( x, y, perk_id )

    return result_id
end
