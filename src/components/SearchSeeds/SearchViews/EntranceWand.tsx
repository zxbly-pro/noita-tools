import React, { useEffect, useReducer, useState } from "react";
import { Button, Col, Container, Form, Row, Stack } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import cloneDeep from "lodash/cloneDeep.js";
import { IRule } from "../../../services/SeedInfo/infoHandler/IRule";
import { ConfigRow } from "../../Settings/helpers";
import SpellSelect from "../../SpellSelect";
import WandSelect from "../../WandSelect";

interface IEntranceWandConfig {
  wands: Array<{ wand?: any; spells?: string[]; spellsStrict?: boolean }>;
  anyWand?: {
    wand?: any;
    spells?: string[];
    spellsStrict?: boolean;
    perkSpells?: string[];
    perkSpellsStrict?: boolean;
  };
}

type IAction =
  | { action: "spell-add"; data: string }
  | { action: "spell-remove"; data: string }
  | { action: "perk-spell-add"; data: string }
  | { action: "perk-spell-remove"; data: string }
  | { action: "spell-strict"; data: boolean }
  | { action: "perk-spell-strict"; data: boolean }
  | { action: "wand-update"; data: any };

const getDefaultState = (): IEntranceWandConfig => ({
  wands: [],
  anyWand: {
    spells: [],
    spellsStrict: false,
    perkSpells: [],
    perkSpellsStrict: false,
  },
});

const reducer = (state: IEntranceWandConfig, action: IAction): IEntranceWandConfig => {
  const newState = cloneDeep(state);
  if (!newState.anyWand) {
    newState.anyWand = {
      spells: [],
      spellsStrict: false,
      perkSpells: [],
      perkSpellsStrict: false,
    };
  }

  switch (action.action) {
    case "spell-add":
      if (!newState.anyWand.spells) newState.anyWand.spells = [];
      newState.anyWand.spells.push(action.data);
      return newState;
    case "spell-remove": {
      if (!newState.anyWand.spells) return state;
      const idx = newState.anyWand.spells.indexOf(action.data);
      if (idx >= 0) newState.anyWand.spells.splice(idx, 1);
      return newState;
    }
    case "perk-spell-add":
      if (!newState.anyWand.perkSpells) newState.anyWand.perkSpells = [];
      newState.anyWand.perkSpells.push(action.data);
      return newState;
    case "perk-spell-remove": {
      if (!newState.anyWand.perkSpells) return state;
      const idx = newState.anyWand.perkSpells.indexOf(action.data);
      if (idx >= 0) newState.anyWand.perkSpells.splice(idx, 1);
      return newState;
    }
    case "spell-strict":
      newState.anyWand.spellsStrict = action.data;
      return newState;
    case "perk-spell-strict":
      newState.anyWand.perkSpellsStrict = action.data;
      return newState;
    case "wand-update":
      newState.anyWand.wand = {
        params: { x: 0, y: 0, cost: 0, level: 0, force_unshuffle: false, unshufflePerk: false },
        ...action.data,
      };
      return newState;
  }
  return state;
};

interface IEntranceWandProps {
  onUpdateConfig: (config: Partial<IRule>) => void;
  config: IRule;
}

const EntranceWand = (props: IEntranceWandProps) => {
  const { onUpdateConfig, config } = props;
  const { t: tMaterials } = useTranslation("materials");
  const { t } = useTranslation("app");
  const [showSpells, setShowSpells] = useState(false);
  const [showPerkSpells, setShowPerkSpells] = useState(false);
  const [showWand, setShowWand] = useState(false);
  const [state, dispatch] = useReducer(reducer, config.val || getDefaultState());

  useEffect(() => {
    const newConfig = {
      type: "entranceWand",
      path: "",
      params: [],
      val: state,
    };
    if (JSON.stringify(config.val) !== JSON.stringify(state)) {
      onUpdateConfig(newConfig);
    }
  }, [config.val, onUpdateConfig, state]);

  const spells = state.anyWand?.spells || [];
  const perkSpells = state.anyWand?.perkSpells || [];

  return (
    <Container fluid>
      <p>{t("entranceWand.description", { perk: tMaterials("$perk_always_cast") })}</p>
      <Row>
        <Col xs="auto">
          <Stack gap={2}>
            <Button onClick={() => setShowSpells(true)}>{t("entranceWand.wandSpells", { count: spells.length })}</Button>
            <ConfigRow
              left={<>{state.anyWand?.spellsStrict ? t("entranceWand.wandSpellsAll") : t("entranceWand.wandSpellsAny")}</>}
              right={
                <Form.Switch
                  checked={state.anyWand?.spellsStrict || false}
                  onChange={e => dispatch({ action: "spell-strict", data: e.target.checked })}
                  label=""
                />
              }
            />
            <Button onClick={() => setShowPerkSpells(true)}>
              {t("entranceWand.perkSpells", { count: perkSpells.length })}
            </Button>
            <ConfigRow
              left={
                <>{state.anyWand?.perkSpellsStrict ? t("entranceWand.perkSpellsAll") : t("entranceWand.perkSpellsAny")}</>
              }
              right={
                <Form.Switch
                  checked={state.anyWand?.perkSpellsStrict || false}
                  onChange={e => dispatch({ action: "perk-spell-strict", data: e.target.checked })}
                  label=""
                />
              }
            />
            <Button onClick={() => setShowWand(true)}>{t("entranceWand.wandStats")}</Button>
          </Stack>
        </Col>
      </Row>
      <SpellSelect
        show={showSpells}
        selected={spells}
        showSelected
        handleClose={() => setShowSpells(false)}
        handleOnClick={id => dispatch({ action: "spell-add", data: id })}
        handleSelectedClicked={id => dispatch({ action: "spell-remove", data: id })}
      />
      <SpellSelect
        show={showPerkSpells}
        selected={perkSpells}
        showSelected
        handleClose={() => setShowPerkSpells(false)}
        handleOnClick={id => dispatch({ action: "perk-spell-add", data: id })}
        handleSelectedClicked={id => dispatch({ action: "perk-spell-remove", data: id })}
      />
      <WandSelect
        show={showWand}
        handleClose={() => setShowWand(false)}
        onParamsChange={params => dispatch({ action: "wand-update", data: params })}
        initialParams={state.anyWand?.wand}
      />
    </Container>
  );
};

export default EntranceWand;
