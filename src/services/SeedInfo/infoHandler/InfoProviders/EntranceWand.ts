import { IRule } from "../IRule";
import { InfoProvider } from "./Base";
import { IRandom } from "../../random";
import { WandInfoProvider, IWandRule } from "./Wand";
import { includesAll, includesSome } from "../../../helpers";

const ENTRANCE_WAND_OPTS = [
  { entity: "wand_level_02", cost: 40, level: 2, force_unshuffle: false },
  { entity: "wand_level_02_better", cost: 50, level: 2, force_unshuffle: false },
  { entity: "wand_level_03", cost: 60, level: 3, force_unshuffle: false },
  { entity: "wand_unshuffle_01", cost: 25, level: 1, force_unshuffle: true },
  { entity: "wand_unshuffle_02", cost: 40, level: 2, force_unshuffle: true },
  { entity: "wand_unshuffle_03", cost: 60, level: 3, force_unshuffle: true },
];

const SPAWN_X = -833;
const SPAWN_Y = -94;
const ITEM_WIDTH = 44;

export interface IEntranceWandRule {
  wands: Array<{ wand?: IWandRule; spells?: string[]; spellsStrict?: boolean }>;
  anyWand?: { wand?: IWandRule; spells?: string[]; spellsStrict?: boolean };
}

export class EntranceWandInfoProvider extends InfoProvider {
  wandInfoProvider: WandInfoProvider;

  constructor(randoms: IRandom, wandInfoProvider: WandInfoProvider) {
    super(randoms);
    this.wandInfoProvider = wandInfoProvider;
  }

  provide() {
    this.randoms.SetRandomSeed(SPAWN_X, SPAWN_Y);
    const wands: ReturnType<WandInfoProvider["provide"]>[] = [];
    for (let i = 0; i < 3; i++) {
      const optIdx = this.randoms.Random(1, ENTRANCE_WAND_OPTS.length) - 1;
      const opt = ENTRANCE_WAND_OPTS[optIdx];
      const wandX = SPAWN_X + i * ITEM_WIDTH;
      const wand = this.wandInfoProvider.provide(
        wandX, SPAWN_Y, opt.cost, opt.level, opt.force_unshuffle, false,
      );
      wands.push(wand);
    }
    return wands;
  }

  test(rule: IRule<IEntranceWandRule>): boolean {
    if (!rule.val) return true;
    const wands = this.provide();

    if (rule.val.anyWand) {
      const target = rule.val.anyWand;
      if (target.wand) {
        const matched = wands.some(wand => this.wandInfoProvider.testGun(target.wand!, wand));
        if (!matched) return false;
      }
      if (target.spells?.length) {
        const allCards = wands.flatMap(w => {
          const cards = [...w.cards.cards];
          if (w.cards.permanentCard) cards.push(w.cards.permanentCard);
          return cards;
        });
        if (target.spellsStrict === true) {
          if (!includesAll(allCards, target.spells)) return false;
        } else {
          if (!includesSome(allCards, target.spells)) return false;
        }
      }
    }

    if (rule.val.wands) {
      for (let i = 0; i < rule.val.wands.length; i++) {
        const target = rule.val.wands[i];
        if (!target) continue;
        if (!this.matchWand(target, wands[i])) return false;
      }
    }

    return true;
  }

  private matchWand(
    target: { wand?: IWandRule; spells?: string[]; spellsStrict?: boolean },
    wand: ReturnType<WandInfoProvider["provide"]>,
  ): boolean {
    if (target.wand) {
      if (!this.wandInfoProvider.testGun(target.wand, wand)) return false;
    }
    if (target.spells?.length) {
      const cards = [...wand.cards.cards];
      if (wand.cards.permanentCard) cards.push(wand.cards.permanentCard);
      const check = target.spellsStrict ? includesAll : includesSome;
      if (!check(cards, target.spells)) return false;
    }
    return true;
  }
}

export default EntranceWandInfoProvider;
