import React, { FC, useEffect, useState } from "react";
import { Table, Button, Col, Modal, Row, Stack, ListGroup, Form } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
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
                        删除
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
        <Modal.Title>特性与局限</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Part>
          <h4>特长重随</h4>
          <p>
            由于游戏内特长的<b>重随机</b>机制，唯一能保证的是<b>特长</b> 你会获得,{" "}
            <b>而非它们的位置</b>. <br />
            <br />
            查看 <i>始终施法</i> 和 <i>特长抽奖</i> 相关信息时请注意，这些信息取决于<b>位置</b>，而非<b>特长</b> 本身。这意味着，如果工具中
            <i>始终施法</i>的位置与游戏内的位置不同，其数值也会不同。作为一种非完美解决方案，请在设置中开启
            “显示整行的始终施法”（下方有快捷键）。
          </p>
          <ListGroup variant="flush" className="mt-0 mb-3 shadow">
            <ListGroup.Item>
              <ShowAlwaysCastRow />
            </ListGroup.Item>
          </ListGroup>
        </Part>
        <Part>
          <h4>和平主义者宝箱</h4>
          <h5>贪婪模式</h5>
          <p>贪婪模式目前暂不支持，后续将推出。.</p>
          <h5>随机材料药水</h5>
          <p>
            随机材料药水的内容高度依赖模组。 <br />
            如果游戏内的材料数量发生变化，那么该药水的材料也会不同。即使改变材料的位置<code className="mx-1">data/materials.xml</code> 也会改变生成的材料。
          </p>
        </Part>
        <Part>
          <h4>天气</h4>
          <p>
            在《Noita》中，降雨的出现取决于游戏种子，而降雪则依赖实时日期。降雪仅在 12 月、1 月和 2 月期间出现。{" "}
            <b>
              <em>请注意，显示的数值代表当前时间和日期。</em>
            </b>
            <br />
            这一点在搜索种子时同样适用。若寻找带有雪景的种子，搜索结果仅适用于 12 月、1 月和 2 月，且对生成时的具体日期和时间精准匹配。
          </p>
        </Part>
        <Part>
          <h4>真菌转变</h4>
          <p>真菌转变会将一种材料转换为另一种材料。</p>
          <p>
            切换到手持材料时，若你手持金子，则将该材料切换为金子的概率仅为 <b>1/1000</b>。
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
  const [showCurrentDailySeed, setShowCurrentDailySeed] = useLocalStorage("show-current-daily-seed", false);

  const [filterParams, setFilterParams] = useSearchParamsState({
    seed: {
      type: "string",
      default: "",
    },
  });

  const [dailySeed, setDailySeed] = useState<string | null>(null);

  const seed = filterParams.seed;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const res = await fetch("/api/daily-seed").then(r => r.json());
      setDailySeed(res.seed);
      if (showCurrentDailySeed && !seed) {
        setFilterParams({ seed: res.seed });
      }
    })();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCurrentDailySeed]);

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
                Noitool 提供指定种子的相关信息,包括增益效果.真菌转变.商店物品.宝箱.生物群系信息.LC 和 AP 配方以及天气情况. <br />
              </p>
            </Col>
            <Col>
              <p>
                请注意，Noitool 在生成细节方面存在轻微限制： <span className="mx-2" />
                <Button
                  className="align-self-baseline mt-1"
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setQuirksOpen(true)}
                >
                  显示特殊特性
                </Button>
                <QuirkModal show={openQuirks} handleClose={() => setQuirksOpen(false)} />
              </p>
            </Col>
          </Row>
        </Col>
        <Col lg="4">
          <Row>
            <Col xs={8} className="d-flex justify-content-center align-items-center">
              <Form.Check
                checked={showCurrentDailySeed}
                onChange={e => setShowCurrentDailySeed(e.target.checked)}
                type="switch"
                id="custom-switch"
              />
              <Form.Label className="ms-2" htmlFor="custom-switch">
                自动显示当前每日种子 {dailySeed && <Link to={`?seed=${dailySeed}`}>{dailySeed}</Link>}
              </Form.Label>
            </Col>
            <Col className="d-flex">
              <Button className="ms-auto" variant="outline-secondary" size="sm" onClick={() => setShowHistory(true)}>
                种子历史记录
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <Stack>
        <SeedForm onSubmit={seed => handleSetSeed(seed)} />
        {seed ? <SeedDataOutput isDaily={seed === dailySeed} seed={seed} /> : null}
      </Stack>
    </div>
  );
};

export default SeedData;
