import { describe, it, expect } from "vitest";
import { EntranceWandInfoProvider } from "./EntranceWand";

describe("EntranceWandInfoProvider", () => {
  it("matches nightmare entrance ALWAYS_CAST spells in perk spell filters", () => {
    class TestEntranceWandInfoProvider extends EntranceWandInfoProvider {
      provide() {
        return [
          {
            cards: { cards: ["WAND_SPELL"], permanentCard: undefined },
          },
        ] as any;
      }
    }

    const provider = new TestEntranceWandInfoProvider(
      {} as any,
      {
        testGun: () => false,
      } as any,
      {
        generateEntrancePerks: () => ["ALWAYS_CAST", "EXTRA_PERK", "EXTRA_HP"],
      } as any,
      {
        providePos: () => "NIGHTMARE_ALWAYS_CAST_SPELL",
      } as any,
    );

    expect(
      provider.test({
        id: "entrance-wand-rule",
        type: "entranceWand",
        val: {
          wands: [],
          anyWand: {
            perkSpells: ["NIGHTMARE_ALWAYS_CAST_SPELL"],
            perkSpellsStrict: false,
          },
        },
      }),
    ).toBe(true);
  });

  it("keeps strict matching for perk spell filters", () => {
    class TestEntranceWandInfoProvider extends EntranceWandInfoProvider {
      provide() {
        return [
          {
            cards: { cards: ["WAND_SPELL"], permanentCard: undefined },
          },
        ] as any;
      }
    }

    const provider = new TestEntranceWandInfoProvider(
      {} as any,
      {
        testGun: () => false,
      } as any,
      {
        generateEntrancePerks: () => ["ALWAYS_CAST", "EXTRA_PERK", "EXTRA_HP"],
      } as any,
      {
        providePos: () => "NIGHTMARE_ALWAYS_CAST_SPELL",
      } as any,
    );

    expect(
      provider.test({
        id: "entrance-wand-rule",
        type: "entranceWand",
        val: {
          wands: [],
          anyWand: {
            perkSpells: ["NIGHTMARE_ALWAYS_CAST_SPELL"],
            perkSpellsStrict: true,
          },
        },
      }),
    ).toBe(true);
  });

  it("keeps wand spell filters separate from perk spell filters", () => {
    class TestEntranceWandInfoProvider extends EntranceWandInfoProvider {
      provide() {
        return [
          {
            cards: { cards: ["WAND_SPELL"], permanentCard: undefined },
          },
        ] as any;
      }
    }

    const provider = new TestEntranceWandInfoProvider(
      {} as any,
      {
        testGun: () => false,
      } as any,
      {
        generateEntrancePerks: () => ["ALWAYS_CAST", "EXTRA_PERK", "EXTRA_HP"],
      } as any,
      {
        providePos: () => "NIGHTMARE_ALWAYS_CAST_SPELL",
      } as any,
    );

    expect(
      provider.test({
        id: "entrance-wand-rule",
        type: "entranceWand",
        val: {
          wands: [],
          anyWand: {
            spells: ["WAND_SPELL"],
            spellsStrict: true,
            perkSpells: ["NIGHTMARE_ALWAYS_CAST_SPELL"],
            perkSpellsStrict: true,
          },
        },
      }),
    ).toBe(true);
  });

  it("fails perk spell filters when entrance has no ALWAYS_CAST perk", () => {
    class TestEntranceWandInfoProvider extends EntranceWandInfoProvider {
      provide() {
        return [
          {
            cards: { cards: ["WAND_SPELL"], permanentCard: undefined },
          },
        ] as any;
      }
    }

    const provider = new TestEntranceWandInfoProvider(
      {} as any,
      {
        testGun: () => false,
      } as any,
      {
        generateEntrancePerks: () => ["EXTRA_PERK", "EXTRA_HP", "FASTER_LEVITATION"],
      } as any,
      {
        providePos: () => "NIGHTMARE_ALWAYS_CAST_SPELL",
      } as any,
    );

    expect(
      provider.test({
        id: "entrance-wand-rule",
        type: "entranceWand",
        val: {
          wands: [],
          anyWand: {
            perkSpells: ["NIGHTMARE_ALWAYS_CAST_SPELL"],
            perkSpellsStrict: false,
          },
        },
      }),
    ).toBe(false);
  });
});
