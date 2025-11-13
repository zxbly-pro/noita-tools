import { RuleType } from "../../services/SeedInfo/infoHandler/IRule";

import Alchemy from "./SearchViews/Alchemy";
import Biomes from "./SearchViews/Biomes";
import Shop from "./SearchViews/Shop";
import StartingFlask from "./SearchViews/StartingFlask";
import StartingSpell from "./SearchViews/StartingSpell";
import StartingBombSpell from "./SearchViews/StartingBomb";
import Weather from "./SearchViews/Weather";
import Perks from "./SearchViews/Perks";
import FungalShifts from "./SearchViews/FungalShifts";
import MapSearch from "./SearchViews/Map";
import Search from "./SearchViews/Search";
import { FC, useContext } from "react";
import { Container } from "react-bootstrap";
import { useSearchContext } from "./SearchContext";
import { getTreeTools } from "./node";
import PacifistChest from "./SearchViews/PacifistChest";

const treeTools = getTreeTools("id", "rules");

export const RuleConstructors = {
  // Logic rules
  [RuleType.AND]: {
    defaultConfig: {
      rules: [],
    },
    Title: () => "And",
  },
  [RuleType.OR]: {
    defaultConfig: {
      rules: [],
    },
    Title: () => "Or",
  },
  [RuleType.NOT]: {
    defaultConfig: {
      rules: [],
    },
    Title: () => "Not",
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
    Title: () => "生物群系",
  },
  fungalShift: {
    Component: FungalShifts,
    defaultConfig: {
      params: [],
      path: "",
      val: new Array(20).fill(undefined),
    },
    Title: () => "真菌转变",
  },
  pacifistChest: {
    Component: PacifistChest,
    defaultConfig: {
      params: [],
      path: "",
      val: new Array(7).fill([]),
    },
    Title: () => "和平主义者宝箱",
  },
  perk: {
    Component: Perks,
    defaultConfig: {
      params: [],
      path: "",
      val: {
        all: new Array(7).fill([]),
        deck: new Array(1).fill([]),
        some: new Array(7).fill([]),
      },
    },
    Title: () => "特长",
  },
  search: {
    Component: Search,
    Title: ({ name }) => (name ? `搜索 "${name}"` : "搜索"),
  },
  shop: {
    Component: Shop,
    defaultConfig: {
      params: [],
      path: "",
      val: new Array(7).fill(undefined),
    },
    Title: () => "商店",
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
    Title: () => "初始烧瓶",
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
