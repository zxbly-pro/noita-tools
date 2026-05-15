import React, { useReducer, useState, useEffect } from "react";
import { Container, Stack, Button, Form, Row, Col } from "react-bootstrap";

import { IRule } from "../../../services/SeedInfo/infoHandler/IRule";
import SpellSelect from "../../SpellSelect";
import WandSelect from "../../WandSelect";
import cloneDeep from "lodash/cloneDeep.js";
import { ConfigRow } from "../../Settings/helpers";

interface IEntranceWandConfig {
  wands: Array<{ wand?: any; spells?: string[]; spellsStrict?: boolean }>;
  anyWand?: { wand?: any; spells?: string[]; spellsStrict?: boolean };
}

type IAction =
  | { action: "spell-add"; data: string }
  | { action: "spell-remove"; data: string }
  | { action: "strict"; data: boolean }
  | { action: "wand-update"; data: any };

const reducer = (state: IEntranceWandConfig, a: IAction): IEntranceWandConfig => {
  const newState = cloneDeep(state);
  if (!newState.anyWand) {
    newState.anyWand = { spells: [], spellsStrict: false };
  }

  switch (a.action) {
    case "spell-add":
      if (!newState.anyWand.spells) newState.anyWand.spells = [];
      newState.anyWand.spells.push(a.data);
      return newState;
    case "spell-remove": {
      if (!newState.anyWand.spells) return state;
      const idx = newState.anyWand.spells.indexOf(a.data);
      if (idx >= 0) newState.anyWand.spells.splice(idx, 1);
      return newState;
    }
    case "strict":
      newState.anyWand.spellsStrict = a.data;
      return newState;
    case "wand-update":
      newState.anyWand.wand = {
        params: { x: 0, y: 0, cost: 0, level: 0, force_unshuffle: false, unshufflePerk: false },
        ...a.data,
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
  const [showSpells, setShowSpells] = useState(false);
  const [showWand, setShowWand] = useState(false);
  const [state, dispatch] = useReducer(
    reducer,
    config.val || { wands: [], anyWand: { spells: [], spellsStrict: false } },
  );

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
  }, [state]);

  const spells = state.anyWand?.spells || [];

  return (
    <Container fluid>
      <p>筛选噩梦模式入口处生成的3把法杖（任意一把满足条件即可）</p>
      <Row>
        <Col xs="auto">
          <Stack gap={2}>
            <Button onClick={() => setShowSpells(true)}>
              选择法术 ({spells.length})
            </Button>
            <Button onClick={() => setShowWand(true)}>
              法杖属性筛选
            </Button>
            <ConfigRow
              left={<>{state.anyWand?.spellsStrict ? "全部包含" : "包含任一"}</>}
              right={
                <Form.Switch
                  checked={state.anyWand?.spellsStrict || false}
                  onChange={e => dispatch({ action: "strict", data: e.target.checked })}
                  label=""
                />
              }
            />
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
