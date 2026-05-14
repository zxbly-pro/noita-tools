--[[
文件功能描述：
  基于地形深度（biome）与位置确定法术生成等级，并在当前位置生成对应 Action 物品实体；使用位置作为随机种子以保持可重复性。

主要模块说明：
  - `utilities.lua`：通用工具。
  - `gun_actions.lua`：Action 元数据与列表。
  - `SetRandomSeed(x,y)`：位置种子（引用：lua_api_documentation.txt:922）。
  - `GetRandomAction(x,y,max_level,i)`：按等级选择法术（引用：lua_api_documentation.txt:869）。
  - `CreateItemActionEntity(action_id,x,y)`：创建 Action 实体（引用：lua_api_documentation.txt:861）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；行注释改为块注释；未更改逻辑实现。

]]

dofile_once("data/scripts/lib/utilities.lua")
dofile( "data/scripts/gun/gun_actions.lua" )


--[[ cardcost = tostring(math.max(40, cardcost + math.random(-4,4) * 10)) ]]

--[[
函数：generate_spells
功能：
  根据 y 坐标映射到地形深度（biome），计算等级并在 `x,y` 生成一个 Action 实体。若传入 `biomeid_` 则覆盖自动推导；
  `is_stealable` 为可选参数控制生成物品的可偷取属性（当前实现未启用相关 UI 与成本显示）。
参数：
  - x:number 生成位置 X。
  - y:number 生成位置 Y。
  - cheap_item:bool 是否廉价物品（当前注释代码未启用）。
  - biomeid_:int|nil 覆盖的地形等级。
  - is_stealable:bool|nil 是否可偷取（当前注释代码未启用）。
返回值：
  无（在 `x,y` 创建实体）。
可能抛出的异常：
  - `GetRandomAction` 返回空字符串导致创建失败。
关键代码段说明：
  - `biomepixel = floor(y / 512)`：将垂直坐标分桶映射为地形段。
  - `level = biomeid`：使用（平方前）biomeid 作为 Action 选择等级；随后将 biomeid 平方用于价格计算（已注释）。
]]
function generate_spells( x, y, cheap_item, biomeid_, is_stealable )
    --[[ 使用位置作为随机种子以保证确定性生成 ]]
    SetRandomSeed( x, y )

    local biomes =
    {
        [1] = 0,
        [2] = 0,
        [3] = 0,
        [4] = 1,
        [5] = 1,
        [6] = 1,
        [7] = 2,
        [8] = 2,
        [9] = 2,
        [10] = 2,
        [11] = 2,
        [12] = 2,
        [13] = 3,
        [14] = 3,
        [15] = 3,
        [16] = 3,
        [17] = 4,
        [18] = 4,
        [19] = 4,
        [20] = 4,
        [21] = 5,
        [22] = 5,
        [23] = 5,
        [24] = 5,
        [25] = 6,
        [26] = 6,
        [27] = 6,
        [28] = 6,
        [29] = 6,
        [30] = 6,
        [31] = 6,
        [32] = 6,
        [33] = 6,
    }


    local biomepixel = math.floor(y / 512)
    local biomeid = biomes[biomepixel] or 0

    if (biomepixel > 35) then
        biomeid = 7
    end

    if (biomes[biomepixel] == nil) and (biomeid_ == nil) then
        print("无法找到指定深度区块的生物群系ID" .. tostring(biomepixel))
    end

    if (biomeid_ ~= nil) then
        biomeid = biomeid_
    end

    if( is_stealable == nil ) then
        is_stealable = false
    end

    local item = ""
    --[[ local cardcost = 0 ]]

    --[[ Note( Petri ): Testing how much squaring the biomeid for prices affects things ]]
    local level = biomeid
    biomeid = biomeid * biomeid

    item = GetRandomAction( x, y, level, 0 )
    --[[
    cardcost = 0
    for i,thisitem in ipairs( actions ) do
        if ( string.lower( thisitem.id ) == string.lower( item ) ) then
            price = math.max(math.floor( ( (thisitem.price * 0.30) + (70 * biomeid) ) / 10 ) * 10, 10)
            cardcost = price

            if ( thisitem.spawn_requires_flag ~= nil ) then
                local flag = thisitem.spawn_requires_flag

                if ( HasFlagPersistent( flag ) == false ) then
                    print( "Trying to spawn " .. tostring( thisitem.id ) .. " even though flag " .. tostring( flag ) .. " not set!!" )
                end
            end
        end
    end
    ]]

    --[[ if( cheap_item ) then
        cardcost = 0.5 * cardcost
    end ]]

    --[[ if ( biomeid >= 10 ) then
        price = price * 5.0
        cardcost = cardcost * 5.0
    end ]]

    local eid = CreateItemActionEntity( item, x, y )

    --[[ if( cheap_item ) then
        EntityLoad( "data/entities/misc/sale_indicator.xml", x, y )
    end ]]

    --[[ local x, y = EntityGetTransform( entity_id )
    SetRandomSeed( x, y ) ]]

    --[[
    local offsetx = 6
    local text = tostring(cardcost)
    local textwidth = 0

    for i=1,#text do
        local l = string.sub( text, i, i )

        if ( l ~= "1" ) then
            textwidth = textwidth + 6
        else
            textwidth = textwidth + 3
        end
    end

    offsetx = textwidth * 0.5 - 0.5
    ]]

    --[[
    EntityAddComponent( eid, "SpriteComponent", {
        _tags="shop_cost,enabled_in_world",
        image_file="data/fonts/font_pixel_white.xml",
        is_text_sprite="1",
        offset_x=tostring(offsetx),
        offset_y="25",
        update_transform="1" ,
        update_transform_rotation="0",
        text=tostring(cardcost),
        z_index="-1",
    } )
    ]]

    --[[
    local stealable_value = "0"
    if( is_stealable ) then
        stealable_value = "1"
    end
    ]]

    --[[
    EntityAddComponent( eid, "ItemCostComponent", {
        _tags="shop_cost,enabled_in_world",
        cost=cardcost,
        stealable=stealable_value
    } )
    ]]
    --[[ 分隔符 ]]
    --[[
    EntityAddComponent( eid, "LuaComponent", {
        script_item_picked_up="data/scripts/items/shop_effect.lua",
    } )
    ]]

    --[[ 关联脚本：shop_item_pickup2.lua ]]

    --[[
    display uses remaining, if any
    NOTE(Olli): removed this because it didn't work with low resolution rendering
    edit_component( eid, "ItemComponent", function(comp,vars)
        local uses_remaining = tonumber( ComponentGetValue(comp, "uses_remaining" ) )
        if uses_remaining > -1 then
            EntityAddComponent( eid, "SpriteComponent", {
                _tags="shop_cost,enabled_in_world",
                image_file="data/fonts/font_pixel_white.xml",
                is_text_sprite="1",
                offset_x="16",
                offset_y="32",
                has_special_scale="1",
                special_scale_x="0.5",
                special_scale_y="0.5",
                update_transform="1" ,
                update_transform_rotation="0",
                text=tostring(uses_remaining),
                } )
        end
    end)
    ]]
end
