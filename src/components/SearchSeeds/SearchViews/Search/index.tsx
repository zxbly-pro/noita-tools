import React, { useContext } from "react";
import {
  Container,
  Stack,
  Row,
  Col,
  ListGroup,
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
import UseMultithreadingButton from "../../UseMultithreading";
import { Status } from "../../../../services/compute/ChunkProvider";
import useLocalStorage from "../../../../services/useLocalStorage";
import ClusterInfo from "./Cluster";
import Multithreading from "./Multithreading";

const MemoSeedDataOutput = React.memo(SeedDataOutput);

const Description = () => {
  return (
    <>
      <h4 className="mb-3">找到带有所需参数的种子</h4>
      <p>
        逻辑运算已可用。逻辑元规则能帮助你更好地筛选特定种子，或让搜索更灵活。规则的顶层列表是一个 <code>AND</code>, 即包含其中所有的规则{" "}
        <code>AND</code>&nbsp; 种子要被判定为 “找到”，其中所有规则必须全部成立。你可以将规则和逻辑规则拖放到其他逻辑规则中。
      </p>
      <p>
        <code>AND</code>: 所有规则必须全部成立。&nbsp;
        <code>OR</code>: 任意一条规则必须成立。 <code>NOT</code>: 否定其中的任何规则 / 逻辑。仅接受一项内容。
      </p>
      <p>
        要获得与旧版种子搜索相同的效果，只需将规则添加到根节点即可。 <code>AND</code>.
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
    findAll,
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

  return (
    <div className="p-0 pt-3">
      <Description />
      <Row>{/* <RuleConstructor onSubmit={updateRules} /> */}</Row>
      <Row className="px-0 mt-2-xs">
        <Col xs={12} sm={6} md={5}>
          <Form onSubmit={e => e.preventDefault()}>
            <FormGroup>
              <Col className="mb-4">
                <Form.Group>
                  <Form.Label htmlFor="SearchSeeds.name">搜索名称:</Form.Label>
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
                  <Form.Label htmlFor="SearchSeeds.seed">从种子数据开始搜索: </Form.Label>
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
                  <Form.Label htmlFor="SearchSeeds.seedEnd">以种子数据结束搜索: </Form.Label>
                  <Form.Control
                    id="SearchSeeds.seedEnd"
                    type="number"
                    placeholder="Optional"
                    disabled={running || !solverReady}
                    value={seedEnd}
                    onChange={e => updateSearchConfig({ to: parseInt(e.target.value, 10) })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mt-3">
                  <Form.Label htmlFor="SearchSeeds.seedEnd">
                    或者，输入种子列表（速度较慢，最适合筛选）:{" "}
                  </Form.Label>
                  <Form.Control
                    id="SearchSeeds.seedList"
                    type="text"
                    placeholder="可选的"
                    disabled={running || !solverReady}
                    value={customSeedList}
                    onChange={e => handleCustomSeedListChange(e)}
                  />
                  {customSeedList && (
                    <Form.Text className="text-muted">{chunkProvider.customSeeds?.length} 剩余种子</Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mt-3">
                  <Form.Check
                    checked={findAll}
                    disabled={!solverReady}
                    onChange={e => updateSearchConfig({ findAll: e.target.checked })}
                    id={`find-all-switch`}
                    label="发现种子后，不要停止搜索"
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
                {!solverReady ? "正在加载搜索器" : "查找下一项"}
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
          <Button variant={clearClicked ? "危险" : "轮廓警告"} onClick={() => handleClear()}>
            清除搜索{clearClicked && "?"}
          </Button>
        </Col>
      </Row>
      <div>
        {!chunkProvider?.customSeeds && solverStatus?.running && (
          <div>
            <ProgressBar animated now={percentChecked} label={`${percentChecked}%`} />
            已检查种子: {localizeNumber(seedsChecked)} / {localizeNumber(totalSeeds)} (预计剩余时间:{" "}
            {humanize((solverStatus as Status).estimate * 1000, {
              round: true,
              units: ["h", "m"],
            })}
            , {Math.round(seedsPerSecond * 10) / 10} 平均 种子/秒)
            <br />
            {}
          </div>
        )}
        <h5 className="mt-3 mb-1">结果:</h5>
        {findAll && chunkProvider && (
          <div>
            发现 {results.length} 种子: <br />
            <Button onClick={handleCopy}>将种子列表复制到剪贴板</Button>
            <ListGroup
              style={{
                overflowY: "auto",
                height: "100px",
              }}
            >
              {results.map(s => {
                return (
                  <ListGroup.Item variant="flush" key={s}>
                    {s}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </div>
        )}
        {!findAll && results.length > 0 && (
          <div>
            <Row>
              <Col>
                <Button disabled={showedSeed === 0} onClick={() => setShowedSeed(showedSeed - 1)}>
                  {"<"}
                </Button>
              </Col>
              <Col>
                显示种子 {showedSeed + 1} of {results.length}
              </Col>
              <Col>
                <Button disabled={showedSeed === results.length - 1} onClick={() => setShowedSeed(showedSeed + 1)}>
                  {">"}
                </Button>
              </Col>
            </Row>
            <div className="mb-4" key={results[showedSeed]}>
              <MemoSeedDataOutput key={results[showedSeed]} seed={`${results[showedSeed]}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
