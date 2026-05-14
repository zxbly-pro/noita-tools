--[[
文件功能描述：
  基于玩家击杀敌人的数量动态提升玩家的最大生命值（max_hp）。在世界后置更新回调中检测击杀数变化，并对玩家实体的
  DamageModelComponent 执行增量更新；在玩家生成事件中加载计时器实体以同步 UI 显示。

主要模块说明：
  - 统计接口：`StatsGetValue(key)` 读取当前击杀数与死亡状态（引用：lua_api_documentation.txt:842）。
  - 实体检索：`EntityGetWithTag(tag)` 获取玩家实体（引用：lua_api_documentation.txt:139）。
  - 组件访问：`EntityGetComponent(entity_id, component_type_name, tag)` 检索伤害模型组件；`ComponentGetValue`/`ComponentSetValue`
    读取与写入组件字段（引用：lua_api_documentation.txt:66, 182, 202）。
  - 实体加载：`EntityLoad(filename, x, y)` 加载计时器实体用于 GUI 展示（引用：lua_api_documentation.txt:13）。
  - 配置读取：`ModTextFileGetContent(filename)` 读取 `mods/kill_monsters_add_max_hp/addhp.txt` 中的倍率设置（引用：lua_api_documentation.txt:1480）。

修改历史记录：
  - 2025-12-11：添加规范中文注释；未更改任何逻辑实现。
  - 2025-12-11：添加规范中文注释；未更改任何逻辑实现。
  - 2025-12-11：新增从 `addhp.txt` 读取倍率并初始化全局变量。
]]

--[[
配置变量：
  - HP_GAIN_PER_KILL_DISPLAY:number（全局）
    说明：倍率系数，表示每击杀一个敌人增加的“游戏显示生命值”点数。初始化时从 `mods/kill_monsters_add_max_hp/addhp.txt` 读取；
    若读取到的内容不是整数，则回退为 1（默认值）。
    游戏内部将生命值按 25 倍缩放存储（示例：内部 `max_hp=4` 对应显示生命值 100），因此写入组件前需转换：
    增量（内部）= 增量（显示） / 25.0。
]]

--[[
函数：readHpGainMultiplier
功能：
  从文本文件 `mods/kill_monsters_add_max_hp/addhp.txt` 读取每击杀增加的“显示生命值”倍率；若读取失败或不是整数，则返回默认值 1。
参数：
  无
返回值：
  - number：合法的整数倍率；非法或读取失败返回 1。
可能抛出的异常：
  - ModTextFileGetContent(filename) 可能返回 nil 或空字符串；需判空与格式校验。
引用 API：
  - ModTextFileGetContent(filename:string) -> string（lua_api_documentation.txt:1480）。
]]
function readHpGainMultiplier()
    local content = ModTextFileGetContent("mods/kill_monsters_add_max_hp/addhp.txt")
    if content == nil then return 1 end
    content = tostring(content)
    -- 去除前后空白与换行
    content = content:gsub("^%s+", ""):gsub("%s+$", "")
    local num = tonumber(content)
    if num == nil then return 1 end
    if math.floor(num) ~= num then return 1 end
    return num
end

--[[
函数：getPlayerEntity
功能：
  返回带有标签 "player_unit" 的玩家实体 ID，用于后续对玩家相关组件的访问与修改。
参数：
  无
返回值：
  - entity_id:int 当存在玩家实体时返回首个玩家实体的 ID
  - nil 当未检索到玩家实体时返回 nil
可能抛出的异常：
  无显式异常；当返回 nil 时，后续 API 调用需要进行判空处理。
引用 API：
  - EntityGetWithTag(tag:string) -> {entity_id:int}（lua_api_documentation.txt:139）
术语一致性：
  - 实体（Entity）、标签（Tag）；与 component_documentation.txt 的术语保持一致。
]]
function getPlayerEntity()
    local players = EntityGetWithTag("player_unit")
    if #players == 0 then
        return
    end

    return players[1]
end

--[[
函数：OnPlayerSpawned
功能：
  玩家生成事件回调。加载计时器 GUI 实体以进行击杀数的可视化呈现，并初始化当前击杀计数；
  同时从 `addhp.txt` 读取倍率并初始化全局变量 `HP_GAIN_PER_KILL_DISPLAY`。
参数：
  - player_entity:int 玩家实体 ID（引擎传入）。
返回值：
  无
可能抛出的异常：
  - EntityLoad(filename, x, y) 可能返回无效实体 ID（加载失败）。
  - StatsGetValue(key) 可能返回 nil；需在后续流程中判空。
引用 API：
  - EntityLoad(filename:string, pos_x:number=0, pos_y:number=0) -> entity_id:int（lua_api_documentation.txt:13）
  - StatsGetValue(key:string) -> string|nil（lua_api_documentation.txt:842）
]]
function OnPlayerSpawned(player_entity)
    EntityLoad("mods/kill_monsters_add_max_hp/files/timer.xml")
    HP_GAIN_PER_KILL_DISPLAY = readHpGainMultiplier()
    kills = StatsGetValue("enemies_killed")
end

--[[
函数：OnWorldPostUpdate
功能：
  世界后置更新事件回调。检测击杀数是否增加；若增加则按可配置倍率提升最大生命值：每击杀增加
  `HP_GAIN_PER_KILL_DISPLAY` 点“游戏显示生命值”。由于内部存储按 25 倍缩放，实际写入组件的增量为：
  `(击杀增量 * HP_GAIN_PER_KILL_DISPLAY) / 25.0`。
参数：
  无
返回值：
  无
可能抛出的异常与边界情况：
  - EntityGetComponent 返回 nil（无 DamageModelComponent）时需跳过处理。
  - ComponentGetValue 返回字符串或 nil；需使用 `tonumber` 转换为数值后再进行计算。
  - ComponentSetValue 需要字符串输入；确保数值转换为字符串或兼容类型。
引用 API：
  - StatsGetValue(key:string) -> string|nil（lua_api_documentation.txt:842）
  - EntityGetComponent(entity_id:int, component_type_name:string, tag:string="") -> {component_id}|nil（lua_api_documentation.txt:66）
  - ComponentGetValue(component_id:int, variable_name:string) -> string|nil（lua_api_documentation.txt:182，注：建议迁移至 ComponentGetValue2）
  - ComponentSetValue(component_id:int, variable_name:string, value:string)（lua_api_documentation.txt:202，注：建议迁移至 ComponentSetValue2）
关键代码段与变量说明：
  - 变量 `kills`：记录上一帧已统计到的击杀数（字符串形式，来自 StatsGetValue）。
  - 变量 `healthToAdd`：本次增量的最大生命值（内部存储单位），计算公式为 `(new_kills - kills) * (HP_GAIN_PER_KILL_DISPLAY / 25.0)`。
  - 组件 `DamageModelComponent`：参照 component_documentation.txt 的“伤害模型组件”术语，字段 `max_hp` 表示最大生命值。
特殊处理逻辑背景：
  - 为适配拥有多个 DamageModelComponent 的实体，使用 `ipairs` 遍历并对所有实例统一增量更新。
]]
function OnWorldPostUpdate()
    if kills ~= nil then
        local new_kills = StatsGetValue("enemies_killed")
        if new_kills > kills then
            --[[ 将击杀增量按可配置倍率转换为内部存储增量：显示生命值增量 / 25.0 ]]
            local healthToAdd = (new_kills - kills) * ((HP_GAIN_PER_KILL_DISPLAY or 1) / 25.0)
            --[[ 获取玩家实体的伤害模型组件集合，用于批量更新 `max_hp` 字段 ]]
            local damagemodels = EntityGetComponent(getPlayerEntity(), "DamageModelComponent")
            if (damagemodels ~= nil) then
                for i, v in ipairs(damagemodels) do
                    local currentMaxHealth = tonumber(ComponentGetValue(v, "max_hp"))
                    ComponentSetValue(v, "max_hp", currentMaxHealth + healthToAdd)
                end
            end
        end
        kills = new_kills
    end
end
