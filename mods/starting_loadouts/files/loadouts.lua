loadout_list =
{
	{
		name = "a Summoner TYPE",
		folder = "summoner",
		-- NOTE: Usually the game uses ARGB format for colours, but the cape colour uses ABGR here instead
		cape_color = 0xff60a1a2,
		cape_color_edge = 0xff3c696a,
		items = 
		{
			"mods/starting_loadouts/files/summoner/wands/wand_1.xml",
			"mods/starting_loadouts/files/summoner/wands/wand_2.xml",
			"data/entities/items/pickup/potion_water.xml",
			{ 
			options = { "data/entities/items/pickup/egg_fire.xml", "data/entities/items/pickup/egg_red.xml", "data/entities/items/pickup/egg_monster.xml", "data/entities/items/pickup/egg_slime.xml" },
			amount = 3,
			},
		},
		perks =
		{
			"PLAGUE_RATS",
			"HOMUNCULUS",
		},
	},
	{
		name = "a Fire TYPE",
		folder = "fire",
		-- NOTE: Usually the game uses ARGB format for colours, but the cape colour uses ABGR here instead
		cape_color = 0xff5a60dd,
		cape_color_edge = 0xff3e43af,
		items = 
		{
			"mods/starting_loadouts/files/fire/wands/wand_1.xml",
			"mods/starting_loadouts/files/fire/wands/wand_2.xml",
			{
			"mods/starting_loadouts/files/fire/potion_fire.xml",
			amount = 2,
			},
		},
		perks =
		{
			"BLEED_OIL",
		},
	},
	{
		name = "a Slime TYPE",
		folder = "slime",
		-- NOTE: Usually the game uses ARGB format for colours, but the cape colour uses ABGR here instead
		cape_color = 0xff9a6f9b,
		cape_color_edge = 0xff76547f,
		items = 
		{
			"mods/starting_loadouts/files/slime/wands/wand_1.xml",
			"mods/starting_loadouts/files/slime/wands/wand_2.xml",
			"mods/starting_loadouts/files/slime/wands/wand_3.xml",
			{
			"mods/starting_loadouts/files/slime/potion_slime.xml",
			amount = 2,
			},
		},
		perks =
		{
			"BLEED_SLIME",
		},
	},
	{
		name = "a Thunder TYPE",
		folder = "thunder",
		-- NOTE: Usually the game uses ARGB format for colours, but the cape colour uses ABGR here instead
		cape_color = 0xff9d7b4d,
		cape_color_edge = 0xff846235,
		items = 
		{
			"mods/starting_loadouts/files/thunder/wands/wand_1.xml",
			"mods/starting_loadouts/files/thunder/wands/wand_2.xml",
			"data/entities/items/pickup/thunderstone.xml",
		},
		perks =
		{
			"ELECTRICITY",
		},
	},
	{
		name = "an Eldritch TYPE",
		folder = "eldritch",
		-- NOTE: Usually the game uses ARGB format for colours, but the cape colour uses ABGR here instead
		cape_color = 0xff7d4e53,
		cape_color_edge = 0xff6b4144,
		items = 
		{
			"mods/starting_loadouts/files/eldritch/wands/wand_1.xml",
			"mods/starting_loadouts/files/eldritch/wands/wand_2.xml",
			"mods/starting_loadouts/files/eldritch/wands/wand_3.xml",
			"mods/starting_loadouts/files/eldritch/potion_teleport.xml",
			"data/entities/items/pickup/potion_water.xml",
		},
		perks =
		{
			"REVENGE_TENTACLE",
			"PROJECTILE_REPULSION",
		},
	},
	{
		name = "a Butcher TYPE",
		folder = "butcher",
		-- NOTE: Usually the game uses ARGB format for colours, but the cape colour uses ABGR here instead
		cape_color = 0xff4f626b,
		cape_color_edge = 0xff465258,
		items = 
		{
			"mods/starting_loadouts/files/butcher/wands/wand_1.xml",
			"mods/starting_loadouts/files/butcher/wands/wand_2.xml",
			"mods/starting_loadouts/files/butcher/potion_berserk.xml",
			"mods/starting_loadouts/files/butcher/potion_blood.xml",
		},
		perks =
		{
			"GLOBAL_GORE",
			"STRONG_KICK",
		},
	},
	--[[
	{
		name = "Sludge warlock",
	},
	{
		name = "Master transmuter",
	},
	{
		name = "Ricochet druid",
	},
	{
		name = "Teleport wizard",
	},
	{
		name = "Engineer",
	},
	]]--
}