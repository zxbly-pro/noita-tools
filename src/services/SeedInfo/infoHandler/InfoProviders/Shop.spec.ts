import { describe, it, expect } from "vitest";
import { ShopInfoProvider, IShopType } from "./Shop";
import { WandInfoProvider } from "./Wand";
import { loadRandom } from "../../../../testHelpers";
import { SpellInfoProvider } from "./Spell";

const spellInfoProvider = new SpellInfoProvider({} as any);

describe("ShopInfoProvider", () => {
  describe("#provide", () => {
    describe("type", () => {
      const tests = [
        {
          seed: 123,
          ans: {
            row: 0,
            type: IShopType.wand,
          },
        },
        {
          seed: 5151515,
          ans: {
            row: 4,
            type: IShopType.item,
          },
        },
        {
          seed: 123435616,
          ans: {
            row: 6,
            type: IShopType.item,
          },
        },
      ];

      tests.forEach((t, i) => {
        it(`Should generate correct output #${i}`, async () => {
          const randoms = await loadRandom();
          const wandInfoProvider = new WandInfoProvider(randoms);
          await wandInfoProvider.ready();
          const ap = new ShopInfoProvider(randoms, wandInfoProvider, spellInfoProvider);
          randoms.SetWorldSeed(t.seed);
          const r = ap.provide();
          const res = r[t.ans.row];
          expect(res.type).toEqual(t.ans.type);
        });
      });
    });

    describe("items - spells", () => {
      const tests = [
        {
          seed: 123,
          ans: {
            row: 2,
            items: [
              "RECHARGE",
              "CLOUD_ACID",
              "TELEPORT_PROJECTILE_CLOSER",
              "MANA_REDUCE",
              "EXPLOSION_TINY",
              "ROCKET_OCTAGON",
              "PROPANE_TANK",
              "GRENADE_TRIGGER",
              "BULLET_TIMER",
              "LIGHTNING",
            ],
          },
        },

        {
          seed: 123,
          ans: {
            row: 6,
            items: [
              "RANDOM_EXPLOSION",
              "ROCKET_TIER_3",
              "HOMING_CURSOR",
              "CURSE_WITHER_MELEE",
              "RECHARGE",
              "RECOIL_DAMPER",
              "BLACK_HOLE_BIG",
              "HEAVY_SPREAD",
              "BULLET_TIMER",
              "MINE",
            ],
          },
        },
      ];

      tests.forEach((t, i) => {
        it(`Should generate correct output #${i}`, async () => {
          const randoms = await loadRandom();
          const wandInfoProvider = new WandInfoProvider(randoms);
          await wandInfoProvider.ready();
          const ap = new ShopInfoProvider(randoms, wandInfoProvider, spellInfoProvider);
          randoms.SetWorldSeed(t.seed);
          const r = ap.provide();
          const res = r[t.ans.row];
          expect(res.type).toEqual(IShopType.item);
          const items = res.items.map(i => i.spell.id);
          expect(items).toEqual(t.ans.items);
        });
      });
    });
  });

  describe("#test", () => {
    it("matches selected spells in item shops", async () => {
      const randoms = await loadRandom();
      const wandInfoProvider = new WandInfoProvider(randoms);
      await wandInfoProvider.ready();
      const ap = new ShopInfoProvider(randoms, wandInfoProvider, spellInfoProvider);

      randoms.SetWorldSeed(123);

      expect(
        ap.test({
          id: "shop-rule",
          type: "shop",
          val: [
            null,
            null,
            {
              type: IShopType.item,
              items: [{ spell: "RECHARGE" }],
              strict: true,
            },
          ],
        }),
      ).toBe(true);
    });

    it("matches selected spells against cards across wand shop wands", () => {
      class TestShopInfoProvider extends ShopInfoProvider {
        provideLevel() {
          return {
            type: IShopType.wand,
            items: [
              {
                cards: {
                  cards: ["SPELL_1"],
                  permanentCard: undefined,
                },
              },
              {
                cards: {
                  cards: ["SPELL_2"],
                  permanentCard: undefined,
                },
              },
              {
                cards: {
                  cards: ["SPELL_3"],
                  permanentCard: undefined,
                },
              },
              {
                cards: {
                  cards: [],
                  permanentCard: undefined,
                },
              },
            ],
          } as any;
        }
      }

      const ap = new TestShopInfoProvider(
        {} as any,
        {
          testGun: () => false,
        } as any,
        {} as any,
      );
      ap.isNightmare = false;

      expect(
        ap.test({
          id: "shop-rule",
          type: "shop",
          val: [
            {
              type: IShopType.item,
              items: [{ spell: "SPELL_1" }, { spell: "SPELL_2" }, { spell: "SPELL_3" }],
              strict: true,
            },
          ],
        }),
      ).toBe(true);
    });

    it("continues checking later rows after a wand shop match", () => {
      class TestShopInfoProvider extends ShopInfoProvider {
        provideLevel(level: number) {
          if (level === 0) {
            return {
              type: IShopType.wand,
              items: [
                {
                  gun: { marker: "row-0" },
                  cards: { cards: [], permanentCard: undefined },
                },
              ],
            } as any;
          }

          return {
            type: IShopType.item,
            items: [{ spell: { id: "ROW_1_SPELL" } }],
          } as any;
        }
      }

      const ap = new TestShopInfoProvider(
        {} as any,
        {
          testGun: (target, wand) => target.gun?.marker?.[0] === wand.gun?.marker,
        } as any,
        {} as any,
      );

      expect(
        ap.test({
          id: "shop-rule",
          type: "shop",
          val: [
            {
              type: IShopType.wand,
              items: [{ wand: { gun: { marker: ["row-0", "row-0"] } } }],
              strict: true,
            },
            {
              type: IShopType.item,
              items: [{ spell: "ROW_1_SPELL" }],
              strict: true,
            },
          ],
        }),
      ).toBe(true);
    });

    it("fails if a later row does not match after an earlier wand shop match", () => {
      class TestShopInfoProvider extends ShopInfoProvider {
        provideLevel(level: number) {
          if (level === 0) {
            return {
              type: IShopType.wand,
              items: [
                {
                  gun: { marker: "row-0" },
                  cards: { cards: [], permanentCard: undefined },
                },
              ],
            } as any;
          }

          return {
            type: IShopType.item,
            items: [{ spell: { id: "ACTUAL_SPELL" } }],
          } as any;
        }
      }

      const ap = new TestShopInfoProvider(
        {} as any,
        {
          testGun: (target, wand) => target.gun?.marker?.[0] === wand.gun?.marker,
        } as any,
        {} as any,
      );

      expect(
        ap.test({
          id: "shop-rule",
          type: "shop",
          val: [
            {
              type: IShopType.wand,
              items: [{ wand: { gun: { marker: ["row-0", "row-0"] } } }],
              strict: true,
            },
            {
              type: IShopType.item,
              items: [{ spell: "EXPECTED_SPELL" }],
              strict: true,
            },
          ],
        }),
      ).toBe(false);
    });
  });
});
