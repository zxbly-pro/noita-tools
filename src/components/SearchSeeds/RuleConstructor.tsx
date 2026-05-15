import { RuleType } from "../../services/SeedInfo/infoHandler/IRule";

import Alchemy from "./SearchViews/Alchemy";
import Biomes from "./SearchViews/Biomes";
import Shop from "./SearchViews/Shop";
import StartingFlask from "./SearchViews/StartingFlask";
import StartingSpell from "./SearchViews/StartingSpell";
import StartingBombSpell from "./SearchViews/StartingBomb";
import Weather from "./SearchViews/Weather";
import Perks from "./SearchViews/Perks";
import EntranceWand from "./SearchViews/EntranceWand";
import FungalShifts from "./SearchViews/FungalShifts";
import MapSearch from "./SearchViews/Map";
import Search from "./SearchViews/Search";
import { FC, useContext } from "react";
import { Container } from "react-bootstrap";
import { useSearchContext } from "./SearchContext";
import { getTreeTools } from "./node";
import PacifistChest from "./SearchViews/PacifistChest";
import { getHolyMountainRowCount } from "../../services/SeedInfo/infoHandler/InfoProviders/holyMountainLocations";

const treeTools = getTreeTools("id", "rules");
const createHolyMountainRows = <T,>(count: number, factory: () => T) => Array.from({ length: count }, factory);

export const RuleConstructors = {
  // Logic rules
  [RuleType.AND]: {
    defaultConfig: {
      rules: [],
    },
    Title: () => "且",
  },
  [RuleType.OR]: {
    defaultConfig: {
      rules: [],
    },
    Title: () => "或",
  },
  [RuleType.NOT]: {
    defaultConfig: {
      rules: [],
    },
    Title: () => "非",
  },

  // Search rules
  alchemy: {
    Component: Alchemy,
    defaultConfig: {
      params: [],
      path: "",
      val: {
        AP: [],
        LC: [],
      },
    },
    Title: () => "炼金术",
  },
  biomeModifier: {
    Component: Biomes,
    defaultConfig: {
      params: [],
      path: "",
      val: {},
    },
    Title: () => "生态修饰",
  },
  fungalShift: {
    Component: FungalShifts,
    defaultConfig: {
      params: [],
      path: "",
      val: new Array(20).fill(undefined),
    },
    Title: () => "真菌转换",
  },
  pacifistChest: {
    Component: PacifistChest,
    defaultConfig: (isNightmare = false) => ({
      params: [],
      path: "",
      val: createHolyMountainRows(getHolyMountainRowCount(0, isNightmare), () => [] as string[]),
    }),
    Title: () => "和平宝箱",
  },
  perk: {
    Component: Perks,
    defaultConfig: (isNightmare = false) => ({
      params: [],
      path: "",
      val: {
        all: createHolyMountainRows(getHolyMountainRowCount(0, isNightmare), () => [] as string[]),
        deck: new Array(1).fill([]),
        some: createHolyMountainRows(getHolyMountainRowCount(0, isNightmare), () => [] as string[]),
        entrance: { some: [], all: [] },
      },
    }),
    Title: () => "天赋",
  },
  search: {
    Component: Search,
    Title: ({ name }) => (name ? `搜索 "${name}"` : "搜索"),
  },
  shop: {
    Component: Shop,
    defaultConfig: (isNightmare = false) => ({
      params: [],
      path: "",
      val: createHolyMountainRows(getHolyMountainRowCount(0, isNightmare), () => undefined),
    }),
    Title: () => "商店",
  },
  entranceWand: {
    Component: EntranceWand,
    defaultConfig: {
      params: [],
      path: "",
      val: {
        wands: [],
        anyWand: { spells: [], spellsStrict: false },
      },
    },
    Title: () => "入口法杖（噩梦）",
  },
  startingBombSpell: {
    Component: StartingBombSpell,
    defaultConfig: {
      params: [],
      path: "",
      val: "",
    },
    Title: () => "初始炸弹法术",
  },
  startingFlask: {
    Component: StartingFlask,
    defaultConfig: {
      params: [],
      path: "",
      val: "",
    },
    Title: () => "初始药瓶",
  },
  startingSpell: {
    Component: StartingSpell,
    defaultConfig: {
      params: [],
      path: "",
      val: "",
    },
    Title: () => "初始法术",
  },
  weather: {
    Component: Weather,
    defaultConfig: {
      params: [],
      path: "",
      val: {
        clouds: [0, 1],
        fog: [0, 1],
        rain_material: "",
      },
    },
    Title: () => "天气",
  },
};

export const getRuleDefaultConfig = (type: string, isNightmare = false) => {
  const constructor = RuleConstructors[type];
  if (!constructor) {
    return {};
  }
  if (typeof constructor.defaultConfig === "function") {
    return constructor.defaultConfig(isNightmare);
  }
  return constructor.defaultConfig || {};
};
type IRuleConstructor = (typeof RuleConstructors)[keyof typeof RuleConstructors];

interface IRuleConstructorProps {}
const RuleConstructor: FC<IRuleConstructorProps> = () => {
  const { ruleTree, query, ruleDispatch } = useSearchContext();
  const rule = treeTools.getById(ruleTree, ruleTree.selectedRule);
  if (!rule) {
    return <></>;
  }
  const { Component } = RuleConstructors[rule.type] || {};
  if (!Component) {
    return <></>;
  }
  return (
    <div id="tab-config" className="px-sm-3">
      <Component
        config={rule}
        key={ruleTree.selectedRule}
        onUpdateConfig={newConfig =>
          ruleDispatch({
            action: "update",
            data: {
              id: ruleTree.selectedRule,
              config: newConfig,
            },
          })
        }
      />
    </div>
  );
};
export default RuleConstructor;
