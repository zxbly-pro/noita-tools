import { ILogicRules, RuleType } from "../../services/SeedInfo/infoHandler/IRule";

import cloneDeep from "lodash/cloneDeep.js";

import { getTreeTools } from "./node";
import { getRuleDefaultConfig } from "./RuleConstructor";
import { randomUUID } from "../../services/helpers";
import { normalizeRuleTreeForMode } from "./ruleNormalization";

const treeTools = getTreeTools("id", "rules");

interface IState extends ILogicRules {
  selectedRule: string;
}

interface IAddAction {
  action: "add";
  data: {
    type: string;
    target: string;
    isNightmare?: boolean;
  };
}
interface ISelectAction {
  action: "select";
  data: string;
}
interface IUpdateAction {
  action: "update";
  data: {
    id: string;
    config: any;
  };
}
interface IDeleteAction {
  action: "delete";
  data: string;
}
interface IMoveAction {
  action: "move";
  data: {
    source: string;
    dest: string;
  };
}
interface IImportAction {
  action: "import";
  data: string;
}
interface INormalizeModeAction {
  action: "normalizeMode";
  data: {
    isNightmare: boolean;
  };
}

type IActions = IAddAction | ISelectAction | IUpdateAction | IDeleteAction | IMoveAction | IImportAction | INormalizeModeAction;

export const initialRuleState: IState = {
  id: "root",
  type: RuleType.AND,
  rules: [],
  selectedRule: "search",
};

export const ruleReducer = (state: IState, action: IActions) => {
  const newState = cloneDeep(state);
  switch (action.action) {
    case "add": {
      newState.rules.push({
        id: randomUUID(),
        type: action.data.type,
        ...getRuleDefaultConfig(action.data.type, action.data.isNightmare),
      });
      return newState;
    }
    case "select": {
      newState.selectedRule = action.data;
      return newState;
    }
    case "update": {
      const { id, config } = action.data;
      const node = treeTools.getById(newState, id);
      if (!node) {
        return state;
      }
      Object.assign(node, config);
      return newState;
    }
    case "delete": {
      const id = action.data;
      treeTools.deleteById(newState, id);
      return newState;
    }
    case "move": {
      const { source, dest } = action.data;
      treeTools.move(newState, source, dest);
      return newState;
    }
    case "import": {
      try {
        const str = action.data;
        return JSON.parse(atob(str));
      } catch (e) {
        console.error(e);
        return state;
      }
    }
    case "normalizeMode": {
      return normalizeRuleTreeForMode(newState, action.data.isNightmare);
    }
  }
  return state;
};
