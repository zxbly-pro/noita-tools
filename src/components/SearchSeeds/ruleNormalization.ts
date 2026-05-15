import cloneDeep from "lodash/cloneDeep.js";

import { getHolyMountainRowCount } from "../../services/SeedInfo/infoHandler/InfoProviders/holyMountainLocations";
import { ILogicRules, IRule, RuleType } from "../../services/SeedInfo/infoHandler/IRule";

const normalizeHolyMountainRows = <T,>(rows: T[] | undefined, rowCount: number, factory: () => T): T[] => {
  return Array.from({ length: rowCount }, (_, index) => rows?.[index] ?? factory());
};

const normalizeRule = (rule: IRule, isNightmare: boolean): IRule => {
  const rowCount = getHolyMountainRowCount(0, isNightmare);

  switch (rule.type) {
    case "shop": {
      return {
        ...rule,
        val: normalizeHolyMountainRows(rule.val as any[] | undefined, rowCount, () => undefined),
      };
    }
    case "pacifistChest": {
      return {
        ...rule,
        val: normalizeHolyMountainRows(rule.val as string[][] | undefined, rowCount, () => []),
      };
    }
    case "perk": {
      const val = (rule.val || {}) as {
        all?: string[][];
        deck?: string[][];
        some?: string[][];
        entrance?: { some?: string[]; all?: string[] };
      };
      return {
        ...rule,
        val: {
          all: normalizeHolyMountainRows(val.all, rowCount, () => []),
          deck: val.deck?.length ? val.deck : [[]],
          some: normalizeHolyMountainRows(val.some, rowCount, () => []),
          entrance: {
            some: val.entrance?.some || [],
            all: val.entrance?.all || [],
          },
        },
      };
    }
    default: {
      return rule;
    }
  }
};

const normalizeRulesRecursive = (rules: any[], isNightmare: boolean): any[] => {
  return rules.map(rule => {
    if (rule.type === RuleType.AND || rule.type === RuleType.OR || rule.type === RuleType.NOT) {
      return {
        ...rule,
        rules: normalizeRulesRecursive(rule.rules, isNightmare),
      };
    }

    return normalizeRule(rule, isNightmare);
  });
};

export const normalizeRuleTreeForMode = (state: ILogicRules, isNightmare: boolean): ILogicRules => {
  const nextState = cloneDeep(state);
  nextState.rules = normalizeRulesRecursive(nextState.rules, isNightmare);
  return nextState;
};
