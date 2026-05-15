--[[
文件功能描述：
  随机生成并掉落一张法术卡片（Action）。依据当前实体位置设置随机种子，从 `actions` 列表中选择满足条件（持久化标志）
  的法术，创建对应的物品实体。

主要模块说明：
  - `gun_actions.lua`：提供 `actions` 列表与 Action 元数据。
  - `GetUpdatedEntityID()`：获取当前执行脚本的实体 ID（引用：lua_api_documentation.txt:300）。
  - `EntityGetTransform(entity_id)`：获取实体坐标（引用：lua_api_documentation.txt:92）。
  - `SetRandomSeed(x,y)` 与 `Random(a,b)`：设置随机种子并进行随机选择（引用：lua_api_documentation.txt:922, 927）。
  - `HasFlagPersistent(key)`：检查持久化标志（引用：lua_api_documentation.txt:1119）。
  - `CreateItemActionEntity(action_id,x,y)`：创建 Action 物品实体（引用：lua_api_documentation.txt:861）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；未更改任何逻辑实现。

]]

dofile( "data/scripts/gun/gun_actions.lua" )

--[[
函数：drop_random_spells
功能：
  在当前实体位置随机选择一个合法的法术并生成其物品实体。若法术定义要求特定持久化标志，则仅在该标志成立时选择。
参数：
  无
返回值：
  无（在位置 `x,y` 创建法术实体）
可能抛出的异常：
  - `actions` 列表为空或未加载时无法选择法术。
  - `CreateItemActionEntity` 创建失败时返回 nil。
关键代码段说明：
  - while 循环：持续尝试选择直到满足 `spawn_requires_flag` 条件（若有）。
]]
function drop_random_spells()
    local entity = GetUpdatedEntityID()
    local x, y = EntityGetTransform( entity )

    SetRandomSeed( x, y )

    local item = ""
    local valid = false

    --[[ 随机选择合法法术：若该法术要求持久化标志，则在标志为真时通过；否则直接通过。]]
    while ( valid == false ) do
        local itemno = Random( 1, #actions )
        local thisitem = actions[itemno]
        item = string.lower(thisitem.id)

        if ( thisitem.spawn_requires_flag ~= nil ) then
            local flag_name = thisitem.spawn_requires_flag
            local flag_status = HasFlagPersistent( flag_name )

            if flag_status then
                valid = true
            end
        else
            valid = true
        end
    end

    --[[ 创建 Action 卡片实体；若未找到合法项则输出诊断信息。]]
    if ( string.len(item) > 0 ) then
        local card_entity = CreateItemActionEntity( item, x, y )
    else
        print( "没有找到有效的对象实体!" )
    end
end

--[[ 立即执行一次，便于基于 `script_death` 等触发时直接生成掉落。]]
drop_random_spells()
