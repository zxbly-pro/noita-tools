/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  createContext,
  FC,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, Col, Form, Stack, Modal, Row, Table } from "react-bootstrap";

import GameInfoProvider from "../../../services/SeedInfo/infoHandler";
import WandIcon from "../../Icons/Wand";
import BadgesWrapper, { CountBadge } from "../../Icons/BadgesWrapper";
import LightBulletIcon from "../../Icons/LightBullet";
import { localizeNumber, removeFromArr } from "../../../services/helpers";
import {
  IGenRowAction,
  IPerk,
  IPerkChangeAction,
  IPerkChangeStateType,
  IRerollAction,
  ISelectAction,
  PerkInfoProvider,
} from "../../../services/SeedInfo/infoHandler/InfoProviders/Perk";
import { IShopItems, IShopType, ShopInfoProvider } from "../../../services/SeedInfo/infoHandler/InfoProviders/Shop";
import { Square } from "../../helpers";
import ShopItems from "./ShopItems";
import { Wand } from "./Wand";
import { useTranslation } from "react-i18next";
import Perk from "../../Icons/Perk";
import { useLiveQuery } from "dexie-react-hooks";
import { db, FavoriteType, FavoriteItem } from "../../../services/db";
import useLocalStorage from "../../../services/useLocalStorage";
import { useSpellFavorite, useFavoritePerks } from "./helpers";
import classNames from "classnames";
import Entity from "../../Icons/Entity";
import { IItem } from "../../../services/SeedInfo/infoHandler/InfoProviders/ChestRandom";
import { cloneDeep } from "lodash";
import { getHolyMountainRowCount as getConfiguredHolyMountainRowCount } from "../../../services/SeedInfo/infoHandler/InfoProviders/holyMountainLocations";

const perkWidth = "3rem";
const gamblePerkDiff = "-0.8rem";

const getHolyMountainRowCount = (worldOffset: number, isNightmare: boolean) => {
  return getConfiguredHolyMountainRowCount(worldOffset, isNightmare);
};

const stripParallelWorldActions = (stack: IPerkChangeAction[]) =>
  stack.filter(action => action.type !== IPerkChangeStateType.shift && action.type !== IPerkChangeStateType.set);

const keepOnlyMainWorld = <T,>(source?: Map<number, T>, clone?: (value: T) => T) => {
  const result = new Map<number, T>();
  const main = source?.get(0);
  if (main !== undefined) {
    result.set(0, clone ? clone(main) : main);
  }
  return result;
};

interface IRerollPaneProps {
  handleRerollUndo?: (e: React.MouseEvent<HTMLButtonElement>) => void;

  loaded: boolean;
  advanced: boolean;
  rerollsForLevel: number;
  nextRerollPrices: number;
  rerollsToFavorite?: number;
  favoritesInNextReroll?: number;

  handleReroll: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleLoad: () => void;
}
const RerollPane = (props: IRerollPaneProps) => {
  const {
    handleRerollUndo,
    rerollsToFavorite,
    favoritesInNextReroll,
    loaded,
    advanced,
    rerollsForLevel,
    nextRerollPrices,
    handleReroll,
    handleLoad,
  } = props;
  return (
    <div className="d-flex justify-content-center">
      {!loaded && advanced ? (
        <Button className="mx-auto" onClick={handleLoad} size="sm">
          加载
        </Button>
      ) : (
        <>
          {handleRerollUndo && !advanced && (
            <Button variant="outline-primary" onClick={handleRerollUndo} size="sm" disabled={!rerollsForLevel}>
              {"<"}
            </Button>
          )}
          {advanced && <div>下次： {nextRerollPrices}</div>}
          <span className="m-2">{rerollsForLevel || 0}</span>
          <Button variant="outline-primary" onClick={handleReroll} size="sm">
            <div className="position-relative">
              {">"}
              {rerollsToFavorite && (
                <div className="position-absolute top-0 start-100 text-info translate-middle">
                  {rerollsToFavorite || ""}
                </div>
              )}
            </div>
          </Button>
        </>
      )}
    </div>
  );
};

interface IPacifistChestProps {
  items: IItem[];
}
// TODO: Extract this into it's own file to decouple
const PacifistChest: FC<IPacifistChestProps> = ({ items }) => {
  const goldReward = items.filter(r => r.entity.includes("goldnugget"));
  const nonGoldReward = items.filter(r => !r.entity.includes("goldnugget"));
  let goldSumm = goldReward.reduce<number>((c, r) => {
    // either goldnugget or goldnugget_x
    const gn = r.entity.split("/")[4].split(".")[0];
    if (gn === "goldnugget") {
      return c + 10;
    }
    const number = gn.replace("goldnugget_", "");
    return c + parseInt(number, 10);
  }, 0);
  return (
    <>
      {goldSumm > 0 && (
        <div className="d-flex m-2 flex-column align-content-center justify-content-center align-items-center">
          <Entity width="1rem" height="1rem" id="data/entities/items/pickup/goldnugget.xml" />
          {goldSumm}
        </div>
      )}
      {nonGoldReward.map((r, i) => (
        <Entity preview key={`${r.entity} - ${i}`} id={r.entity} entityParams={{ extra: r.extra, x: r.x, y: r.y }} />
      ))}
    </>
  );
};

// TODO: Extract this into it's own file to decouple
const Shop = ({ type, handleOpenShopInfo, favoriteSpells }) => {
  const Icon = type === IShopType.wand ? WandIcon : LightBulletIcon;

  const [maxFavoriteSpellPreview] = useLocalStorage("favorite-spell-preview-max-count", 2);

  // group duplicate favorite spells and count occurrences
  const favoriteSpellsGrouped: Map<string, number> = favoriteSpells.reduce((acc, spell) => {
    acc.set(spell, (acc.get(spell) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  // add favorite spell icons with badges for counts
  let favSpellIcons = Array.from(favoriteSpellsGrouped.entries())
    .slice(0, maxFavoriteSpellPreview)
    .map(([spell, count]) => (
      <BadgesWrapper key={spell} badges={[CountBadge({ text: count.toString() })]}>
        <Entity key={spell} width="1rem" height="1rem" id="Spell" entityParams={{ extra: spell }} />
      </BadgesWrapper>
    ));

  const countSlicedFavSpells = favoriteSpellsGrouped.size - maxFavoriteSpellPreview;
  if (countSlicedFavSpells > 0) {
    favSpellIcons.push(
      <span key="more" className="text-body" style={{ alignSelf: "center", paddingLeft: "0.2rem", fontSize: "0.7rem" }}>
        (+{countSlicedFavSpells})
      </span>,
    );
  }

  return (
    <Button
      className="position-relative w-100"
      onClick={handleOpenShopInfo}
      variant={favoriteSpells.length ? "outline-info" : "outline-primary"}
      size="sm"
    >
      {favSpellIcons.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", marginBottom: "-0.7rem" }}>
          {favSpellIcons}
        </div>
      )}
      <Square>
        <Icon />
      </Square>
    </Button>
  );
};

interface IPerkRowProps {
  pickedPerks: string[];
  perkRerolls: number;
  nextRerollPrices: number;
  shop: IShopItems;
  perks: IPerk[];
  advanced: boolean;
  rerollsToFavorite?: number;
  favoritesInNextReroll?: number;
  showAllAlwaysCast?: boolean;
  infoProvider: GameInfoProvider;
  pacifistChestItems: IItem[];

  handleReroll: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleRerollUndo?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleClickPerk: (pos: number | string) => void;
  isRerollable: (i: number, perks: number) => boolean;
  handleOpenShopInfo: () => void;
  handleLoad: () => void;
  isPerkFavorite: (id: string) => boolean;
  isSpellFavorite: (id: string) => boolean;
  getAlwaysCast: (i: number, perks: number) => string;
}
const PerkRow: FC<IPerkRowProps> = props => {
  const {
    pacifistChestItems,
    rerollsToFavorite,
    favoritesInNextReroll,
    advanced,
    pickedPerks,
    perkRerolls,
    nextRerollPrices,
    shop,
    perks,
    showAllAlwaysCast,
    infoProvider,
    handleReroll,
    handleRerollUndo,
    handleClickPerk,
    isRerollable,
    getAlwaysCast,
    handleOpenShopInfo,
    handleLoad,
    isPerkFavorite,
    isSpellFavorite,
  } = props;
  const numberOfGambles = pickedPerks?.filter(p => p === "GAMBLE").length;
  const type = shop.type;
  const rerollsForLevel = perkRerolls ? perkRerolls : 0;
  const perksToShow = (numberOfGambles > 0 ? perks?.slice(0, -2 * numberOfGambles) : perks) || [];
  const gamblePerks = perks?.slice(-2 * numberOfGambles) || [];
  const spellIds: string[] =
    shop.type === IShopType.wand
      ? shop.items.flatMap(i => [i.cards.permanentCard, ...i.cards.cards].filter(Boolean) as string[])
      : shop.items.map(i => i.spell.id);
  const favoriteSpells = spellIds.filter(id => isSpellFavorite(id));

  const rowHasAlwaysCast = perks.find(p => p.id === "ALWAYS_CAST");

  return (
    <tr>
      <td>
        <Shop type={type} handleOpenShopInfo={handleOpenShopInfo} favoriteSpells={favoriteSpells} />
      </td>
      <td style={{ height: "4rem" }} className="d-flex align-content-center justify-content-around align-items-center">
        <PacifistChest items={pacifistChestItems} />
      </td>
      <td className="w-100">
        <Stack direction="horizontal" className="justify-content-center" gap={3}>
          {perksToShow &&
            perksToShow.map((perk, i) => {
              const rerollable = isRerollable(i, perksToShow.length);
              const alwaysCast =
                perk.id === "ALWAYS_CAST" || (rowHasAlwaysCast && showAllAlwaysCast)
                  ? getAlwaysCast(i, perksToShow.length)
                  : undefined;
              const fav = isPerkFavorite(perk.id);
              return (
                <Perk
                  className={fav && "border border-info border-3"}
                  highlight={fav}
                  rerollable={rerollable}
                  key={perk.ui_name + i}
                  onClick={() => handleClickPerk(advanced ? i : perk.id)}
                  clicked={!advanced ? pickedPerks?.includes(perk.id) : pickedPerks && !!pickedPerks[i]}
                  perk={perk}
                  alwaysCast={alwaysCast}
                />
              );
            })}
          {!!numberOfGambles &&
            new Array(numberOfGambles).fill("").map((_, i) => {
              return (
                <div key={i} className="d-flex ms-4 position-relative" style={{ width: "2rem" }}>
                  {/* Hard coded to make it more pretty */}
                  <div
                    className="position-absolute top-0 start-0 translate-middle"
                    style={{
                      marginRight: "-1rem",
                      marginTop: "-0.25rem",
                      zIndex: 1,
                    }}
                  >
                    <Perk
                      width={`calc(${perkWidth} + ${gamblePerkDiff})`}
                      key={gamblePerks[i * 2].ui_name}
                      perk={gamblePerks[i * 2]}
                    />
                  </div>
                  <div className="position-absolute top-50 start-100 translate-middle" style={{ marginTop: "0.25rem" }}>
                    <Perk
                      width={`calc(${perkWidth} + ${gamblePerkDiff})`}
                      key={gamblePerks[i * 2 + 1].ui_name}
                      perk={gamblePerks[i * 2 + 1]}
                    />
                  </div>
                </div>
              );
            })}
        </Stack>
      </td>
      <td>
        <RerollPane
          rerollsToFavorite={rerollsToFavorite}
          favoritesInNextReroll={favoritesInNextReroll}
          handleReroll={handleReroll}
          handleRerollUndo={handleRerollUndo}
          loaded={!!perks?.length}
          advanced={advanced}
          rerollsForLevel={rerollsForLevel}
          nextRerollPrices={nextRerollPrices}
          handleLoad={handleLoad}
        />
      </td>
    </tr>
  );
};

const PerkDeckModal = props => {
  const { perkDeck, show, handleClose, isPerkFavorite } = props;
  const [t] = useTranslation("materials");

  return (
    <Modal size="lg" show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>天赋牌组</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="p-3 justify-content-center align-items-center row-cols-auto">
          {perkDeck
            .map((perk, i) => {
              if (!perk) {
                return false;
              }
              const fav = isPerkFavorite(perk.id);
              return (
                <Col className="p-0 m-1" key={`${perk.id}-${i}`}>
                  <Perk
                    className={classNames(fav && "border border-info border-3")}
                    highlight={fav}
                    width={perkWidth}
                    perk={perk}
                  />
                </Col>
              );
            })
            .filter(Boolean)}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          关闭
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

interface IHolyMountainHeaderProps {
  advanced: boolean;
  rerolls: number;
  price: number;
  total: number;
  canUndo: boolean;
  perkDeck: IPerk[];
  lotteries: number;
  setAdvanced: (boolean) => void;
  handleReset: () => void;
  handleBack: () => void;
  isPerkFavorite: (string) => boolean;
}
const HolyMountainHeader = (props: IHolyMountainHeaderProps) => {
  const {
    canUndo,
    advanced,
    rerolls,
    price,
    total,
    perkDeck,
    lotteries,
    setAdvanced,
    handleReset,
    handleBack,
    isPerkFavorite,
  } = props;

  const [showDeck, setShowDeck] = useState(false);
  const favoritePerks = perkDeck.map(p => p?.id).filter(isPerkFavorite);

  return (
    <>
      <Stack gap={2} direction="horizontal" className="flex-wrap">
        <Form.Switch
          checked={advanced}
          onChange={e => {
            setAdvanced(e.target.checked);
          }}
          id="advanced-switch"
          label="高级"
        />
        <div className="ms-auto" />
        {advanced ? (
          <Button disabled={!canUndo} onClick={handleBack}>
            撤销
          </Button>
        ) : (
          <div className="ms-auto" />
        )}
        <div className="ms-auto" />
        <Button onClick={() => handleReset()}>重置</Button>
        <div className="ms-auto" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignSelf: "stretch",
          }}
        >
          <span> 重骰次数： {rerolls}</span>
          {!advanced && <span> 下次： {localizeNumber(price)}</span>}
          <span> 总计： {localizeNumber(total)}</span>
          {/* 50% per stack (multiplicative), rounded down to nearest int */}
          {/* <span>Lottery chance: {Math.floor(Math.pow(0.5, lotteries) * 100)}%</span> */}
        </div>
        <div className="ms-auto" />
        <Button
          className="position-relative"
          size="sm"
          variant="outline-secondary"
          onClick={() => setShowDeck(true)}
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
          }}
        >
          显示 <br /> 天赋牌组 ({perkDeck.length})
          {favoritePerks.length ? (
            <div className="position-absolute text-info top-0 end-0 pe-1">{favoritePerks.length}</div>
          ) : (
            ""
          )}
        </Button>
      </Stack>
      <PerkDeckModal
        perkDeck={perkDeck}
        show={showDeck}
        isPerkFavorite={isPerkFavorite}
        handleClose={() => setShowDeck(false)}
      />
    </>
  );
};

const getRerollPrices = (perkStack: IPerkChangeAction[], isNightmare: boolean): [Map<number, number[]>, number] => {
  const nextRerollPrices = new Map<number, number[]>();
  nextRerollPrices.set(0, new Array(getHolyMountainRowCount(0, isNightmare)));

  let rerollTotal = 0;
  let totalRerolls = 0;
  let offset = 0;

  const getNextPrice = () => {
    const next = 200 * Math.pow(2, totalRerolls);
    // Roughly simulate breaking the perk reroll machine
    // https://youtu.be/DC976SBwSm4
    if (next > 55e12) {
      return 1;
    }
    return next;
  };

  for (const event of perkStack) {
    let rerolls = nextRerollPrices.get(offset)!;
    switch (event.type) {
      case IPerkChangeStateType.reroll: {
        rerollTotal += rerolls[event.data] || 0;
        totalRerolls++;
        const nextPrice = getNextPrice();

        rerolls[event.data] = nextPrice;
        break;
      }
      case IPerkChangeStateType.genRow: {
        const nextPrice = getNextPrice();
        rerolls[event.data] = nextPrice;
        break;
      }
      case IPerkChangeStateType.set: {
        offset = event.data;
        if (!nextRerollPrices.has(offset)) {
          nextRerollPrices.set(offset, new Array(getHolyMountainRowCount(offset, isNightmare)));
        }
        break;
      }
      case IPerkChangeStateType.shift: {
        offset += event.data;
        if (!nextRerollPrices.has(offset)) {
          nextRerollPrices.set(offset, new Array(getHolyMountainRowCount(offset, isNightmare)));
        }
        break;
      }
    }
    nextRerollPrices.set(offset, rerolls);
  }

  return [nextRerollPrices, rerollTotal];
};

interface IPerkData {
  perks: IPerk[][];
  pickedPerks: string[][];
  pickedState?: Map<number, string[][]>;
  perkRerolls: number[];
  nextRerollPrices: Map<number, number[]>;
  totalRerolls: number;
  rerollPrice: number;
  rerollTotal: number;
  worldOffset: number;
  rerollsToFavorite?: number;
  favoritesInNextReroll?: number;
  isFavorite: (id: string) => boolean;
  lotteries: number;
}

const HolyMountainContext = createContext<any>({});

interface IHolyMountainContextProviderProps {
  infoProvider: GameInfoProvider;
  perks: ReturnType<PerkInfoProvider["provide"]>;
  perkDeck: ReturnType<PerkInfoProvider["getPerkDeck"]>;
  children: any;
}
// This is messy because there are two ways of generating perks: provide() and provideStateful()
// For refactoring, it should be best to have the stateful provide everything and create a transition function
// from action[] => old config.
const HolyMountainContextProvider = (props: IHolyMountainContextProviderProps) => {
  const { infoProvider, perkDeck } = props;
  const [advanced, setAdvanced] = useState(() => infoProvider.config.perksAdvanced);

  const nightmarePerks = infoProvider.config.isNightmare ? ["INVISIBILITY"] : undefined;
  const initialPerkIndex = infoProvider.config.isNightmare ? 3 : undefined;

  const handleAdvancedChange = (value: boolean) => {
    setAdvanced(value);
    infoProvider.updateConfig({ perksAdvanced: value });
  };

  const [perkStacks, setPerkStacks] = useState<IPerkChangeAction[][]>(() => {
    const sanitized = (infoProvider.config.perkStacks || [[]]).map(stripParallelWorldActions);
    return sanitized.length ? sanitized : [[]];
  });
  const perkStack = perkStacks[perkStacks.length - 1];

  useEffect(() => {
    infoProvider.updateConfig({
      perkWorldOffset: 0,
      pickedPerks: keepOnlyMainWorld(infoProvider.config.pickedPerks, rows => rows.map(row => [...row])),
      perkRerolls: keepOnlyMainWorld(infoProvider.config.perkRerolls, rows => [...rows]),
      perkStacks,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const favorites = useFavoritePerks(infoProvider.providers.perk, perkDeck);
  const getPerkData = () => {
    const perk = infoProvider.providers.perk;
    const data = perk.provideStateless(perkStack, true, nightmarePerks, initialPerkIndex);
    const hydrated = perk.hydrate(data.perks);
    return {
      ...data,
      perks: hydrated,
    };
  };

  const [pd, setPerkData] = useState<{
    lotteries: number;
    worldOffset: number;
    pickedPerks: string[][];
    pickedState?: Map<number, string[][]>;
    perks: IPerk[][];
    perkRerolls: number[];
  }>({
    lotteries: 0,
    worldOffset: 0,
    pickedPerks: [],
    pickedState: new Map(),
    perks: [],
    perkRerolls: [],
  });
  const { worldOffset, pickedPerks, perks, perkRerolls, pickedState } = pd;

  useEffect(() => {
    const newData = getPerkData();
    infoProvider.updateConfig({
      perkWorldOffset: 0,
      perkStacks,
    });
    setPerkData({
      ...newData,
      worldOffset: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perkStack]);

  const totalRerolls = advanced
    ? perkStack.reduce((c, n) => {
        return c + (n.type === IPerkChangeStateType.reroll ? 1 : 0);
      }, 0)
    : (infoProvider.config.perkRerolls.get(0) || []).reduce((c, n) => c + n, 0);

  const getPrice = (rerolls: number) => 200 * Math.pow(2, rerolls);
  const getTotal = (rerolls = 0) => {
    if (rerolls <= 0) return 0;
    return getTotal(rerolls - 1) + getPrice(rerolls - 1);
  };

  const rerollPrice = getPrice(totalRerolls);

  let [nextRerollPrices, rerollTotal] = getRerollPrices(perkStack, infoProvider.config.isNightmare);

  if (!advanced) {
    rerollTotal = getTotal(totalRerolls);
  }

  const worldOffsetSimple = 0;

  const handleGenRowAdvanced = (level: number) => {
    const action: IGenRowAction = {
      type: IPerkChangeStateType.genRow,
      data: level,
    };
    setPerkStacks([...perkStacks, [...perkStack, action]]);
  };

  const handleRerollAdvanced = (e: React.MouseEvent<HTMLButtonElement>, level: number) => {
    e.preventDefault();
    const actions: IPerkChangeAction[] = [];
    actions.push({
      type: IPerkChangeStateType.reroll,
      data: level,
    });
    setPerkStacks([...perkStacks, [...perkStack, ...actions]]);
  };
  const handleRerollSimple = (e: React.MouseEvent<HTMLButtonElement>, level: number) => {
    e.preventDefault();
    const perkRerolls = new Map(infoProvider.config.perkRerolls);
    if (!perkRerolls.has(worldOffsetSimple)) {
      perkRerolls.set(worldOffsetSimple, []);
    }
    const p = perkRerolls.get(worldOffsetSimple)!;
    if (isNaN(p[level])) {
      p[level] = 0;
    }
    p[level] += 1;
    perkRerolls.set(worldOffsetSimple, p);
    infoProvider.updateConfig({ perkRerolls });
  };
  const handleRerollUndoSimple = (e: React.MouseEvent<HTMLButtonElement>, level: number) => {
    e.preventDefault();
    const perkRerolls = new Map(infoProvider.config.perkRerolls);
    if (!perkRerolls.has(worldOffsetSimple)) {
      perkRerolls.set(worldOffsetSimple, []);
    }
    const p = perkRerolls.get(worldOffsetSimple)!;
    if (isNaN(p[level])) {
      p[level] = 0;
    }
    if (p[level] > 0) {
      p[level] -= 1;
    }
    perkRerolls.set(worldOffsetSimple, p);
    infoProvider.updateConfig({ perkRerolls });
  };

  const handleClickPerkAdvanced = (level: number, pos: number) => () => {
    const action: ISelectAction = {
      type: IPerkChangeStateType.select,
      data: {
        row: level,
        pos,
      },
    };

    if (pickedPerks[level] && pickedPerks[level][pos]) {
      return;
    }
    setPerkStacks([...perkStacks, [...perkStack, action]]);
  };
  const handleClickPerkSimple = (level: number, id: string) => () => {
    const pickedPerks = new Map(infoProvider.config.pickedPerks);
    if (!pickedPerks.has(worldOffsetSimple)) {
      pickedPerks.set(worldOffsetSimple, []);
    }
    const p = pickedPerks.get(worldOffsetSimple)!;
    if (p[level]?.includes(id)) {
      // if gamble, remove the gamble ones
      if (id === "GAMBLE") {
        const perkIds = simplePerksForCurrentOffset[level].map(p => p.id);
        const gamblePerks = perkIds.slice(-2);
        removeFromArr(p[level], gamblePerks[0]);
        removeFromArr(p[level], gamblePerks[1]);
      }
      removeFromArr(p[level], id);
    } else {
      if (!p[level]) {
        p[level] = [];
      }
      p[level].push(id);
    }
    pickedPerks.set(worldOffsetSimple, p);
    infoProvider.updateConfig({ pickedPerks });
  };

  const handleResetAdvanced = () => {
    setPerkStacks([[]]);
  };
  const handleResetSimple = () => {
    const pickedPerks = new Map();
    const perkRerolls = new Map();
    infoProvider.updateConfig({ pickedPerks, perkRerolls, perkWorldOffset: 0 });
  };

  const handleBackAdvanced = () => {
    if (perkStacks.length > 1) {
      perkStacks.pop();
      setPerkStacks([...perkStacks]);
    }
  };

  const perkMethods = {
    handleReroll: advanced ? handleRerollAdvanced : handleRerollSimple,
    handleRerollUndo: advanced ? false : handleRerollUndoSimple,
    handleClickPerk: advanced ? handleClickPerkAdvanced : handleClickPerkSimple,
    handleReset: advanced ? handleResetAdvanced : handleResetSimple,
    handleBack: advanced ? handleBackAdvanced : false,
    handleGenRowAdvanced: advanced ? handleGenRowAdvanced : false,
  };

  const simplePerksForCurrentOffset = infoProvider.providers.perk.provide(
    infoProvider.config.pickedPerks,
    undefined,
    true,
    worldOffsetSimple,
    infoProvider.config.perkRerolls,
    nightmarePerks,
    initialPerkIndex,
  );

  // For basic mode.
  // If gamble is picked in a row, we need to add the last 2 perks from the row
  // to the pickedPerks.
  const pickedPerksWithGambles = () => {
    const pickedPerks = cloneDeep(keepOnlyMainWorld(infoProvider.config.pickedPerks));
    for (const [offset, pp] of pickedPerks) {
      if (offset !== worldOffsetSimple) {
        continue;
      }
      for (let i = 0; i < pp.length; i++) {
        if (pp[i]?.includes("GAMBLE")) {
          const perkRow = simplePerksForCurrentOffset[i];
          if (!perkRow?.length || perkRow.length < 2) {
            continue;
          }
          const p1 = perkRow[perkRow.length - 2].id;
          const p2 = perkRow[perkRow.length - 1].id;
          pp[i].push(p1, p2);
        }
      }
    }
    return pickedPerks;
  };

  const currentPickedPerks = advanced ? pickedPerks : pickedPerksWithGambles().get(worldOffsetSimple) || [];
  const lotteriesSimple = (pickedPerksWithGambles().get(0) || []).filter(p => p?.includes("PERKS_LOTTERY")).length;

  const perkData: IPerkData = {
    perks: advanced ? perks : simplePerksForCurrentOffset,
    pickedPerks: currentPickedPerks,
    pickedState,
    perkRerolls: advanced
      ? perkRerolls
      : infoProvider.config.perkRerolls.get(0) || [],
    nextRerollPrices: advanced ? nextRerollPrices : new Map(),
    totalRerolls,
    rerollPrice,
    rerollTotal,
    worldOffset: 0,
    lotteries: advanced ? pd.lotteries : lotteriesSimple,
    ...favorites,
  };

  return (
    <HolyMountainContext.Provider value={{ advanced, setAdvanced: handleAdvancedChange, perkMethods, perkData }}>
      {props.children}
    </HolyMountainContext.Provider>
  );
};

interface IHolyMountainProps {
  shop: ReturnType<ShopInfoProvider["provide"]>;
  perks: ReturnType<PerkInfoProvider["provide"]>;
  perkDeck: ReturnType<PerkInfoProvider["getPerkDeck"]>;
  infoProvider: GameInfoProvider;
  entrancePerks?: IPerk[];
  entranceWands?: any[];
}

const HolyMountain = (props: IHolyMountainProps) => {
  const { infoProvider, perkDeck, entrancePerks, entranceWands } = props;

  const { advanced, setAdvanced, perkMethods, perkData } = useContext(HolyMountainContext);
  const {
    handleReroll,
    handleRerollUndo,
    handleClickPerk,
    handleReset,
    handleBack,
    handleGenRowAdvanced,
  } = perkMethods;
  const {
    perks,
    pickedPerks,
    perkRerolls,
    totalRerolls,
    rerollPrice,
    rerollTotal,
    lotteries,
    rerollsToFavorite,
    favoritesInNextReroll,
    isFavorite,
    nextRerollPrices,
    pickedState,
  } = perkData;
  const [showInitialLottery] = useLocalStorage("show-initial-lottery", true);
  const [showAlwaysCastRow] = useLocalStorage("show-always-cast-row", false);

  const adjustedLotteries = lotteries === 0 ? Number(showInitialLottery) : lotteries;
  const nightmarePerks = infoProvider.config.isNightmare ? ["INVISIBILITY"] : undefined;
  const initialPerkIndex = infoProvider.config.isNightmare ? 3 : undefined;

  const { isFavorite: isSpellFavorite } = useSpellFavorite();

  const [shopSelected, setShopSelected] = useState(-1);
  const worldOffset = 0;
  const displayedPerks = advanced
    ? perks
    : infoProvider.providers.perk.provide(
        infoProvider.config.pickedPerks,
        undefined,
        true,
        worldOffset,
        infoProvider.config.perkRerolls,
        nightmarePerks,
        initialPerkIndex,
      );
  const displayedShop = infoProvider.providers.shop.provide(
    advanced ? pickedState || new Map() : infoProvider.config.pickedPerks,
    worldOffset,
  );
  const rowCount = Math.min(displayedPerks.length, displayedShop.length);

  const handleOpenShopInfo = (level: number) => {
    setShopSelected(level);
  };

  const pacifistChestItems = useCallback((l: number) => infoProvider.providers.pacifistChest.provide(l, 0), [
    infoProvider.providers.pacifistChest,
  ]);

  return (
    <div
      style={{
        padding: 0,
        imageRendering: "pixelated",
      }}
    >
      <HolyMountainHeader
        advanced={advanced}
        setAdvanced={setAdvanced}
        rerolls={totalRerolls}
        canUndo={true}
        price={rerollPrice}
        total={rerollTotal}
        perkDeck={perkDeck}
        handleReset={handleReset}
        handleBack={handleBack}
        isPerkFavorite={isFavorite}
        lotteries={lotteries}
      />
      {entrancePerks && entrancePerks.length > 0 && (
        <div className="my-2 p-2 border rounded">
          <div className="fw-bold mb-1">入口天赋（噩梦模式）</div>
          <Stack direction="horizontal" className="justify-content-center" gap={3}>
            {entrancePerks.map((perk, i) => (
              <Perk key={perk.id + i} perk={perk} />
            ))}
          </Stack>
        </div>
      )}
      {entranceWands && entranceWands.length > 0 && (
        <div className="my-2 p-2 border rounded">
          <div className="fw-bold mb-1">入口法杖（噩梦模式）</div>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            {entranceWands.map((wand, i) => (
              <Wand key={i} item={wand} isFavorite={isSpellFavorite} />
            ))}
          </div>
        </div>
      )}
      <Table borderless responsive="xs" size="sm">
        <thead className="text-center text-nowrap">
          <tr>
            <th>商店</th>
            <th>和平宝箱</th>
            <th>天赋</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Array(rowCount)
            .fill("")
            .map((_, level) => {
              const row = displayedPerks[level] || [];
              return (
                <PerkRow
                  key={level}
                  advanced={advanced}
                  pickedPerks={pickedPerks[level]}
                  perkRerolls={perkRerolls[level]}
                  perks={row}
                  shop={displayedShop[level]}
                  rerollsToFavorite={rerollsToFavorite}
                  favoritesInNextReroll={favoritesInNextReroll}
                  nextRerollPrices={
                    nextRerollPrices.get(0) ? nextRerollPrices.get(0)[level] : undefined
                  }
                  isPerkFavorite={isFavorite}
                  showAllAlwaysCast={showAlwaysCastRow}
                  infoProvider={infoProvider}
                  isSpellFavorite={isSpellFavorite}
                  handleRerollUndo={e => handleRerollUndo(e, level)}
                  handleReroll={e => handleReroll(e, level)}
                  handleClickPerk={id => handleClickPerk(level, id)()}
                  pacifistChestItems={pacifistChestItems(level)}
                  isRerollable={(i, l) => infoProvider.providers.lottery.provide(level, i, l, 0, adjustedLotteries)}
                  getAlwaysCast={(i, l) => infoProvider.providers.alwaysCast.provide(level, i, l, 0) ?? ""}
                  handleOpenShopInfo={() => handleOpenShopInfo(level)}
                  handleLoad={() => handleGenRowAdvanced(level)}
                />
              );
            })}
        </tbody>
      </Table>
      <ShopItems
        shop={displayedShop[shopSelected]}
        show={shopSelected >= 0}
        handleClose={() => handleOpenShopInfo(-1)}
        isFavorite={isSpellFavorite}
      />
    </div>
  );
};

const e = props => (
  <HolyMountainContextProvider perkDeck={props.perkDeck} perks={props.perks} infoProvider={props.infoProvider}>
    {" "}
    <HolyMountain {...props} />
  </HolyMountainContextProvider>
);

export default e;

