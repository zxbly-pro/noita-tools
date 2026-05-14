import React, { FC, useState } from "react";
import { Table, Button, Col, Modal, Row, Stack, ListGroup, Form } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { useSearchParamsState } from "react-use-search-params-state";

import SeedForm from "./SeedForm";
import SeedDataOutput from "./SeedDataOutput";
import { db } from "../../services/db";
import { useLiveQuery } from "dexie-react-hooks";
import FungalShifts from "./SeedInfoViews/FungalShifts";
import { MaterialInfoProvider } from "../../services/SeedInfo/infoHandler/InfoProviders/Material";
import i18n from "../../i18n";
import { ShowAlwaysCastRow } from "../Settings/GeneralSettings";
import useLocalStorage from "../../services/useLocalStorage";

const MemoSeedDataOutput = React.memo(SeedDataOutput);

const SeedHistoryModal = props => {
  const { show, handleClose, onSelectSeed } = props;

  const seeds = useLiveQuery(() => db.seedInfo.toArray(), [], []).sort((a, b) => +b.updatedAt - +a.updatedAt);

  const [clicked, setClicked] = useState<number | null>(null);

  return (
    <Modal size="lg" show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>种子历史</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table responsive striped borderless hover>
          <thead>
            <tr>
              <th>种子</th>
              <th>最后更新</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {seeds.map((seed, i) => {
              const dateString = seed.updatedAt.toLocaleString();
              return (
                <tr style={{ cursor: "pointer" }} onClick={() => onSelectSeed(seed.seed)} key={seed.seed}>
                  <td className="text-primary">
                    <Button size="sm" variant="outline-primary">
                      {seed.seed}
                    </Button>
                  </td>
                  <td>{dateString}</td>
                  <td>
                    {clicked !== i ? (
                      <Button
                        variant="outline-warning"
                        onClick={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          setClicked(i);
                        }}
                        size="sm"
                      >
                        删除
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        onClick={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          setClicked(null);
                          db.seedInfo
                            .get({ seed: seed.seed })
                            .then(q => {
                              if (!q) return;
                              db.seedInfo.delete(q.id!).finally(() => {});
                            })
                            .catch(e => console.error(e));
                        }}
                        size="sm"
                      >
                        确认删除
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          关闭
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const materialProvider = new MaterialInfoProvider(i18n);

const Part: FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="mt-3">{children}</div>;
};

const QuirkModal = props => {
  const { show, handleClose } = props;

  return (
    <Modal fullscreen="sm-down" size="lg" scrollable show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>注意事项与限制</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Part>
          <h4>天赋重骰</h4>
          <p>
            由于游戏中天赋重骰的机制，唯一能保证的是你会获得的<b>天赋</b>，{" "}
            <b>而非它们的位置</b>。 <br />
            <br />
            查看<i>始终施放</i>和<i>天赋彩票</i>信息时，请注意它们是依赖<b>位置</b>
            的，而非依赖<b>天赋</b>的。这意味着如果工具中<i>始终施放</i>的位置与游戏中不同，则数值也会不同。作为不完美的解决方案，请在设置中启用"显示整行始终施放"（快捷方式如下）。
          </p>
          <ListGroup variant="flush" className="mt-0 mb-3 shadow">
            <ListGroup.Item>
              <ShowAlwaysCastRow />
            </ListGroup.Item>
          </ListGroup>
        </Part>
        <Part>
          <h4>和平宝箱</h4>
          <h5>贪婪</h5>
          <p>贪婪目前不支持，稍后添加。</p>
          <h5>随机材料药水</h5>
          <p>
            随机材料药水的内容高度依赖于 mod。<br />
            如果游戏中材料数量发生变化，则此药水中的材料也会不同。即使更改
            <code className="mx-1">data/materials.xml</code> 中的材料位置也会改变生成的材料。
          </p>
        </Part>
        <Part>
          <h4>天气</h4>
          <p>
            在 Noita 中，降雨取决于游戏种子，而降雪依赖于现实时间日期。雪只在12月、1月和2月出现。{" "}
            <b>
              <em>请注意，显示的值代表当前的时间和日期。</em>
            </b>
            <br />
            搜索种子时也是如此。搜索有雪的种子时，结果仅在12月、1月和2月有效，并且精确到生成时的具体日期和小时。
          </p>
        </Part>
        <Part>
          <h4>真菌转换</h4>
          <p>真菌转换会将一种材料转变为另一种。</p>
          <p>
            当转换为手持材料时，如果你手持黄金，则只有 <b>1/1000</b> 的概率将材料转换为黄金。
          </p>
          <FungalShifts
            fungalData={[
              {
                flaskTo: true,
                flaskFrom: false,
                from: ["water"],
                to: "lava",
                gold_to_x: "gold",
                grass_to_x: "grass_holy",
              },
              {
                flaskTo: true,
                flaskFrom: false,
                from: ["water"],
                to: "lava",
                gold_to_x: "pea_soup",
                grass_to_x: "grass_holy",
              },
            ]}
            infoProvider={
              {
                // stub for this example
                updateConfig: () => {},
                config: { fungalShifts: [true, false] },
                providers: {
                  material: materialProvider,
                },
              } as any
            }
          />
        </Part>
      </Modal.Body>
    </Modal>
  );
};

const SeedData = () => {
  const [isNightmare, setIsNightmare] = useLocalStorage("seed-info-nightmare", false);

  const [filterParams, setFilterParams] = useSearchParamsState({
    seed: {
      type: "string",
      default: "",
    },
  });

  const seed = filterParams.seed;

  // const [seed, setSeed] = React.useState<any>(() => seedInSeachParams || '');

  const [openQuirks, setQuirksOpen] = React.useState(false);

  const handleSetSeed = (newSeed: string) => {
    setFilterParams({ seed: newSeed });
  };

  const [showHistory, setShowHistory] = React.useState(false);

  return (
    <div className="px-sm-3 px-2 pb-3 mb-5">
      <SeedHistoryModal
        show={showHistory}
        handleClose={() => setShowHistory(false)}
        onSelectSeed={seed => handleSetSeed(seed)}
      />
      <Row className="align-items-center mt-2">
        <Col lg="8" sm="12">
          <Row>
            <Col xs={6}>
              <p className="mb-0">
                Noitool 提供给定种子的天赋、真菌转换、商店物品、宝箱、生态信息、LC 和 AP 配方、天气等信息。 <br />
              </p>
            </Col>
            <Col>
              <p>
                注意 Noitool 在生成细节上有一些小限制： <span className="mx-2" />
                <Button
                  className="align-self-baseline mt-1"
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setQuirksOpen(true)}
                >
                  查看注意事项
                </Button>
                <QuirkModal show={openQuirks} handleClose={() => setQuirksOpen(false)} />
              </p>
            </Col>
          </Row>
        </Col>
        <Col lg="4">
          <Row>
            <Col className="d-flex">
              <Button className="ms-auto" variant="outline-secondary" size="sm" onClick={() => setShowHistory(true)}>
                种子历史
              </Button>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col className="d-flex align-items-center">
              <Form.Check
                checked={isNightmare}
                onChange={e => setIsNightmare(e.target.checked)}
                type="switch"
                id="nightmare-switch"
              />
              <Form.Label className="ms-2 mb-0" htmlFor="nightmare-switch">
                噩梦模式
              </Form.Label>
            </Col>
          </Row>
        </Col>
      </Row>
      <Stack>
        <SeedForm onSubmit={seed => handleSetSeed(seed)} />
        {seed ? <SeedDataOutput isDaily={false} seed={seed} isNightmare={isNightmare} /> : null}
      </Stack>
    </div>
  );
};

export default SeedData;
