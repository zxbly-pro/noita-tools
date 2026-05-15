/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, FC } from "react";
import { Row, Col, Container, Stack, Button } from "react-bootstrap";

import PerkSelect from "../../PerkSelect";
import { Square } from "../../helpers";
import { IRule } from "../../../services/SeedInfo/infoHandler/IRule";
import Perk from "../../Icons/Perk";
import { PerkInfoProvider, IPerkRule } from "../../../services/SeedInfo/infoHandler/InfoProviders/Perk";
import { useSearchContext } from "../SearchContext";
import { getHolyMountainRowCount } from "../../../services/SeedInfo/infoHandler/InfoProviders/holyMountainLocations";

const perkInfoProvider = new PerkInfoProvider({} as any);

interface IPerksProps {
  onUpdateConfig: (config: Partial<IRule>) => void;
  config: IRule<IPerkRule>;
}

const getMaxPerksPerRow = (perks: string[][]): number[] => {
  const res: number[] = [];
  let ppr = 3; // default
  perks.forEach((row, i) => {
    res.push(ppr);
    const extraPerk = row.filter(r => r === "EXTRA_PERK").length;
    ppr += extraPerk;
  });
  return res;
};

const PerkCol: FC<any> = ({ title, perks, handleDelete, togglePerkSelect }) => {
  return (
    <Col xs={6}>
      {title}
      <Stack gap={3}>
        {perks.map((row, i) => {
          return (
            <Row className="justify-content-center align-items-center" key={i}>
              <Col xs={3}>第 {i + 1} 层</Col>
              <Col>
                <Stack gap={3} direction="horizontal">
                  {row.map(perkId => {
                    return (
                      <Perk
                        key={perkId}
                        onClick={() => handleDelete(perkId, i)}
                        perk={perkInfoProvider.perks[perkId]}
                      />
                    );
                  })}
                </Stack>
              </Col>
              <Col className="me-auto">
                <Button size="sm" onClick={() => togglePerkSelect(i)}>
                  <Square>添加天赋</Square>
                </Button>
              </Col>
            </Row>
          );
        })}
      </Stack>
    </Col>
  );
};

const Perks: FC<IPerksProps> = ({ onUpdateConfig, config }) => {
  const { val } = config;
  const { isNightmare } = useSearchContext();
  const rowCount = getHolyMountainRowCount(0, isNightmare);
  const [selectOpen, setSelectOpen] = useState(-1);
  const [selectType, setSelectType] = useState("");

  const perksSome = val?.some || [];
  const perksAll = val?.all || [];
  const perksDeck = val?.deck || [];
  const entrance = val?.entrance || { some: [], all: [] };

  useEffect(() => {
    const normalizeRows = (rows: string[][] = []) =>
      Array.from({ length: rowCount }, (_, i) => Array.isArray(rows[i]) ? rows[i] : []);
    const normalizedAll = normalizeRows(perksAll);
    const normalizedSome = normalizeRows(perksSome);
    if (
      normalizedAll.length !== perksAll.length
      || normalizedSome.length !== perksSome.length
      || perksDeck.length === 0
    ) {
      setPerks({
        ...val,
        all: normalizedAll,
        some: normalizedSome,
        deck: perksDeck?.length ? perksDeck : [[]],
        entrance,
      });
    }
  }, [rowCount, perksAll, perksSome, perksDeck, entrance]);

  const setPerks = newConfig => {
    onUpdateConfig({
      ...config,
      type: "perk",
      path: "",
      params: [],
      val: newConfig,
    });
  };

  const handleAdd = (type, perkId) => {
    if (type === "entrance-some") {
      const newEntrance = { ...entrance, some: [...entrance.some, perkId] };
      setPerks({ ...val, entrance: newEntrance });
      return;
    }
    if (type === "entrance-all") {
      const newEntrance = { ...entrance, all: [...entrance.all, perkId] };
      setPerks({ ...val, entrance: newEntrance });
      return;
    }
    let perks;
    switch (type) {
      case "all":
        perks = perksAll;
        break;
      case "some":
        perks = perksSome;
        break;
      case "deck":
        perks = perksDeck;
        break;
    }
    const newPerks = perks.map(p => p.slice());
    newPerks[selectOpen].push(perkId);
    setPerks({ ...val, [type]: newPerks });
  };

  const handleDelete = (type, perkId, row) => {
    if (type === "entrance-some") {
      const idx = entrance.some.indexOf(perkId);
      if (idx === -1) return;
      const newSome = [...entrance.some];
      newSome.splice(idx, 1);
      setPerks({ ...val, entrance: { ...entrance, some: newSome } });
      return;
    }
    if (type === "entrance-all") {
      const idx = entrance.all.indexOf(perkId);
      if (idx === -1) return;
      const newAll = [...entrance.all];
      newAll.splice(idx, 1);
      setPerks({ ...val, entrance: { ...entrance, all: newAll } });
      return;
    }
    let perks;
    switch (type) {
      case "all":
        perks = perksAll;
        break;
      case "some":
        perks = perksSome;
        break;
      case "deck":
        perks = perksDeck;
        break;
    }
    const newPerks = perks.map(p => p.slice());
    const index = newPerks[row].indexOf(perkId);
    if (index === -1) {
      return;
    }
    newPerks[row].splice(index, 1);

    if (perkId !== "EXTRA_PERK") {
      setPerks({ ...val, [type]: newPerks });
      return;
    }
    if (row === newPerks.length - 1) {
      setPerks({ ...val, [type]: newPerks });
      return;
    }

    for (let i = row + 1; i < newPerks.length; i++) {
      if (newPerks[i].length !== 3) {
        continue;
      }
      newPerks[i] = newPerks[i].slice(0, -1);
    }
    setPerks({ ...val, [type]: newPerks });
  };

  const togglePerkSelect = (type, n = 0) => {
    setSelectType(type);
    setSelectOpen(n);
  };

  const getSelected = (type, row) => {
    switch (type) {
      case "all":
        return perksAll[row];
      case "some":
        return perksSome[row];
      case "deck":
        return perksDeck[row];
      case "entrance-some":
        return entrance.some;
      case "entrance-all":
        return entrance.all;
    }
    return [];
  };

  return (
    <Container fluid>
      <p>
        <b>牌组:</b> 选择牌组中必须包含的天赋。<b>全部包含:</b> 该层圣山必须<i>同时</i>出现所有指定天赋。
        <b>任一包含:</b> 该层圣山至少出现<i>一个</i>指定天赋。<br />
        点击天赋图标可删除。计算量较大，请谨慎使用！
      </p>
      <Row className="my-2 p-2 border-bottom border-top">
        <Col>
          牌组:
          <Row className="justify-content-start row-cols-auto">
            {perksDeck[0].map(perkId => {
              return (
                <Col key={perkId}>
                  <Perk onClick={() => handleDelete("deck", perkId, 0)} perk={perkInfoProvider.perks[perkId]} />
                </Col>
              );
            })}
            <Col className="me-auto flex-grow-1">
              <Button size="sm" onClick={() => togglePerkSelect("deck", 0)}>
                <Square>添加天赋</Square>
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      {isNightmare && (
        <Row className="my-2 p-2 border-bottom">
          <Col xs={6}>
            入口 - 全部包含:
            <Row className="justify-content-center align-items-center">
              <Col xs={3}>入口</Col>
              <Col>
                <Stack gap={3} direction="horizontal">
                  {entrance.all.map(perkId => (
                    <Perk
                      key={perkId}
                      onClick={() => handleDelete("entrance-all", perkId, 0)}
                      perk={perkInfoProvider.perks[perkId]}
                    />
                  ))}
                </Stack>
              </Col>
              <Col className="me-auto">
                <Button size="sm" onClick={() => togglePerkSelect("entrance-all", 0)}>
                  <Square>添加天赋</Square>
                </Button>
              </Col>
            </Row>
          </Col>
          <Col xs={6}>
            入口 - 任一包含:
            <Row className="justify-content-center align-items-center">
              <Col xs={3}>入口</Col>
              <Col>
                <Stack gap={3} direction="horizontal">
                  {entrance.some.map(perkId => (
                    <Perk
                      key={perkId}
                      onClick={() => handleDelete("entrance-some", perkId, 0)}
                      perk={perkInfoProvider.perks[perkId]}
                    />
                  ))}
                </Stack>
              </Col>
              <Col className="me-auto">
                <Button size="sm" onClick={() => togglePerkSelect("entrance-some", 0)}>
                  <Square>添加天赋</Square>
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      )}
      <Row className="justify-content-center">
        <PerkCol
          title="全部包含:"
          perks={perksAll}
          handleDelete={(perkId, row) => handleDelete("all", perkId, row)}
          togglePerkSelect={i => togglePerkSelect("all", i)}
        />
        <PerkCol
          title="任一包含:"
          perks={perksSome}
          handleDelete={(perkId, row) => handleDelete("some", perkId, row)}
          togglePerkSelect={i => togglePerkSelect("some", i)}
        />
      </Row>
      <PerkSelect
        selected={getSelected(selectType, selectOpen)}
        handleOnClick={perkId => handleAdd(selectType, perkId)}
        show={selectOpen >= 0}
        handleClose={() => togglePerkSelect("", -1)}
      />
    </Container>
  );
};

export default Perks;
