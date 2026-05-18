import React, { useContext } from "react";
import {
  Container,
  Stack,
  Row,
  Col,
  Button,
  ButtonGroup,
  Form,
  FormGroup,
  ProgressBar,
} from "react-bootstrap";
import humanize from "humanize-duration";

import { localizeNumber } from "../../../../services/helpers";
import SeedDataOutput from "../../../SeedInfo/SeedDataOutput";
import { useSearchContext } from "../../SearchContext";
import { Status } from "../../../../services/compute/ChunkProvider";
import useLocalStorage from "../../../../services/useLocalStorage";
import ClusterInfo from "./Cluster";
import Multithreading from "./Multithreading";

const MemoSeedDataOutput = React.memo(SeedDataOutput);

const Description = () => {
  return (
    <>
      <h4 className="mb-3">根据指定参数搜索种子</h4>
      <p>
        支持逻辑运算。逻辑元规则可以更灵活地筛选种子。顶层规则列表是一个 <code>AND</code>，
        即 <code>AND</code> 内的所有规则都必须为真，种子才会被视为"找到"。
        你可以拖放规则和逻辑规则到其他逻辑规则中。
      </p>
      <p>
        <code>AND</code>：所有规则必须为真。&nbsp;
        <code>OR</code>：任一规则为真即可。<code>NOT</code>：取反内部的规则/逻辑，仅接受一项。
      </p>
      <p>
        要获得与旧版种子搜索相同的行为，只需将规则添加到根 <code>AND</code> 中。
      </p>
    </>
  );
};

const Search = () => {
  // TODO: Spilt Search Context into something more manageable
  const {
    solverStatus,
    solverReady,
    chunkProvider,
    clearSearch,

    handleCopy,
    startCalculation,
    stopCalculation,
    computeJobName,
    handleCustomSeedListChange,
    updateSearchConfig,
    maxResults,
    isNightmare,
    running,
    seed,
    seedEnd,
    customSeedList,
    seedsChecked,
    totalSeeds,
    percentChecked,
    seedsPerSecond,
  } = useSearchContext();

  const [clearClicked, setClearClicked] = React.useState(false);

  const handleClear = () => {
    if (!clearClicked) {
      setTimeout(() => {
        setClearClicked(false);
      }, 2000);

      setClearClicked(true);
      return;
    }
    clearSearch();
    setClearClicked(false);
  };

  const [showedSeed, setShowedSeed] = React.useState<number>(0);

  let results: number[] = [];
  if (chunkProvider?.results.size) {
    results = [...chunkProvider?.results.values()];
  }

  const clampedShowedSeed = Math.min(showedSeed, Math.max(results.length - 1, 0));

  return (
    <div className="p-0 pt-3">
      <Description />
      <Row>{/* <RuleConstructor onSubmit={updateRules} /> */}</Row>
      <Row className="px-0 mt-2-xs">
        <Col xs={12} sm={6} md={5}>
          <Form onSubmit={e => e.preventDefault()}>
            <FormGroup>
              <Col className="mb-3">
                <Form.Group>
                  <Form.Check
                    checked={isNightmare}
                    disabled={running || !solverReady}
                    onChange={e => updateSearchConfig({ isNightmare: e.target.checked })}
                    id={`nightmare-mode-switch`}
                    label={<span className="fw-bold fs-5">噩梦模式</span>}
                  />
                </Form.Group>
              </Col>
              <Col className="mb-4">
                <Form.Group>
                  <Form.Label htmlFor="SearchSeeds.name">搜索名称：</Form.Label>
                  <Form.Control
                    id="SearchSeeds.name"
                    disabled={running || !solverReady}
                    value={computeJobName}
                    onChange={e => updateSearchConfig({ name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="my-2">
                  <Form.Label htmlFor="SearchSeeds.seed">起始种子：</Form.Label>
                  <Form.Control
                    id="SearchSeeds.seed"
                    type="number"
                    disabled={running || !solverReady}
                    value={seed}
                    onChange={e => updateSearchConfig({ from: parseInt(e.target.value, 10) })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mt-2">
                  <Form.Label htmlFor="SearchSeeds.seedEnd">结束种子：</Form.Label>
                  <Form.Control
                    id="SearchSeeds.seedEnd"
                    type="number"
                    placeholder="可选"
                    disabled={running || !solverReady}
                    value={seedEnd}
                    onChange={e => updateSearchConfig({ to: parseInt(e.target.value, 10) })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mt-3">
                  <Form.Label htmlFor="SearchSeeds.seedEnd">
                    或者输入种子列表（较慢，适合筛选）：{" "}
                  </Form.Label>
                  <Form.Control
                    id="SearchSeeds.seedList"
                    type="text"
                    placeholder="可选"
                    disabled={running || !solverReady}
                    value={customSeedList}
                    onChange={e => handleCustomSeedListChange(e)}
                  />
                  {customSeedList && (
                    <Form.Text className="text-muted">剩余 {chunkProvider.customSeeds?.length} 个种子</Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mt-2">
                  <Form.Label htmlFor="SearchSeeds.maxResults">找到几个种子后停止（0 = 不停止）：</Form.Label>
                  <Form.Control
                    id="SearchSeeds.maxResults"
                    type="number"
                    min={0}
                    disabled={running || !solverReady}
                    value={maxResults}
                    onChange={e => updateSearchConfig({ maxResults: parseInt(e.target.value, 10) || 0 })}
                  />
                </Form.Group>
              </Col>
            </FormGroup>
          </Form>
        </Col>
        {/* <Col /> */}
        <Col md={7} className="px-0 mt-0-xs">
          <Row className="d-flex flex-direction-column justify-content-center">
            <ClusterInfo />
            <hr className="w-75" />
            {navigator.hardwareConcurrency && <Multithreading />}
          </Row>
          <Row className="p-3">
            <ButtonGroup>
              <Button color="primary" disabled={running || !solverReady} onClick={() => startCalculation()}>
                {!solverReady ? "加载搜索器中" : "开始搜索"}
              </Button>
              <Button color="primary" disabled={!running || !solverReady} onClick={() => stopCalculation()}>
                停止
              </Button>
            </ButtonGroup>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col className="my-2">
          <Button variant={clearClicked ? "danger" : "outline-warning"} onClick={() => handleClear()}>
            清除搜索{clearClicked && "？"}
          </Button>
        </Col>
      </Row>
      <div>
        {!chunkProvider?.customSeeds && solverStatus?.running && (
          <div>
            <ProgressBar animated now={percentChecked} label={`${percentChecked}%`} />
            Seeds checked: {localizeNumber(seedsChecked)} / {localizeNumber(totalSeeds)} (预计剩余时间：{" "}
            {humanize((solverStatus as Status).estimate * 1000, {
              round: true,
              units: ["h", "m"],
            })}
            ，平均 {Math.round(seedsPerSecond * 10) / 10} 种子/秒)
            <br />
            {}
          </div>
        )}
        <h5 className="mt-3 mb-1">结果：</h5>
        {results.length > 0 && (
          <div>
            <div className="mb-2">
              找到 {results.length} 个种子
              <Button size="sm" className="ms-2" onClick={handleCopy}>复制种子列表到剪贴板</Button>
            </div>
            <Row>
              <Col>
                <Button disabled={clampedShowedSeed === 0} onClick={() => setShowedSeed(clampedShowedSeed - 1)}>
                  {"<"}
                </Button>
              </Col>
              <Col>
                显示种子 {clampedShowedSeed + 1} / {results.length}
              </Col>
              <Col>
                <Button disabled={clampedShowedSeed === results.length - 1} onClick={() => setShowedSeed(clampedShowedSeed + 1)}>
                  {">"}
                </Button>
              </Col>
            </Row>
            <div className="mb-4" key={results[clampedShowedSeed]}>
              <MemoSeedDataOutput key={results[clampedShowedSeed]} seed={`${results[clampedShowedSeed]}`} isNightmare={isNightmare} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
