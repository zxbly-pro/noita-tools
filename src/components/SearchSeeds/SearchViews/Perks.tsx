/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, FC } from "react";
import { Row, Col, Container, Stack, Button } from "react-bootstrap";

import PerkSelect from "../../PerkSelect";
import { Square } from "../../helpers";
import { IRule } from "../../../services/SeedInfo/infoHandler/IRule";
import Perk from "../../Icons/Perk";
import { PerkInfoProvider, IPerkRule } from "../../../services/SeedInfo/infoHandler/InfoProviders/Perk";

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
              <Col xs={3}>层级 {i + 1}</Col>
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
                  <Square>添加特长</Square>
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
  const [selectOpen, setSelectOpen] = useState(-1);
  const [selectType, setSelectType] = useState("");

  const perksSome = val?.some || [];
  const perksAll = val?.all || [];
  const perksDeck = val?.deck || [];

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
    // The regular [...] keeps refs to the old arrays, so need to copy
    const newPerks = perks.map(p => p.slice());
    newPerks[selectOpen].push(perkId);
    setPerks({ ...val, [type]: newPerks });
  };

  const handleDelete = (type, perkId, row) => {
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
    // The regular [...] keeps refs to the old arrays, so need to copy
    const newPerks = perks.map(p => p.slice());
    const index = newPerks[row].indexOf(perkId);
    if (index === -1) {
      return;
    }
    newPerks[row].splice(index, 1);

    // Handle EXTRA_PERK perk being removed
    if (perkId !== "EXTRA_PERK") {
      setPerks({ ...val, [type]: newPerks });
      return;
    }
    // We don't need to do anything if it's the last level
    if (row === newPerks.length - 1) {
      setPerks({ ...val, [type]: newPerks });
      return;
    }

    for (let i = row + 1; i < newPerks.length; i++) {
      // Only do something if we are at max
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
    }
    return [];
  };

  return (
    <Container fluid>
      <p>
        <b>卡组:</b> 选择卡组中必须包含的增益效果. <b>全部的:</b> <i>全部</i> 增益效果必须存在于圣山之中. <b>一部分:</b> 至少 <i>一个</i> 增益效果必须存在于圣山之中. <br />
        删除增益效果时，点击该效果即可。（此操作）计算密集型。请谨慎使用!
      </p>
      <Row className="my-2 p-2 border-bottom border-top">
        <Col>
          卡组:
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
                <Square>添加特长</Square>
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <PerkCol
          title="全部的:"
          perks={perksAll}
          handleDelete={(perkId, row) => handleDelete("all", perkId, row)}
          togglePerkSelect={i => togglePerkSelect("all", i)}
        />
        <PerkCol
          title="一部分:"
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
