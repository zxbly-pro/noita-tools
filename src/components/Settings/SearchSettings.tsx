import { Col, Form, ListGroup } from "react-bootstrap";
import useLocalStorage from "../../services/useLocalStorage";

// import { db } from "../services/db";

import { ConfigRow, ConfigTitle, PanelToggle } from "./helpers";

const Multithread = () => {
  const [concurrency, setConcurrency] = useLocalStorage("search-max-concurrency", navigator.hardwareConcurrency);
  const handleRange = (e: any) => {
    setConcurrency(e.target.valueAsNumber);
  };

  const maxConcurrency = navigator.hardwareConcurrency;

  return (
    <ConfigRow
      left={
        <>
          <strong className="">多线程限制</strong>
          <p className="text-muted fw-light mb-0">
            若 Noitool 在最大并发状态下不稳定，可降低此滑块数值直至稳定.
            <br />
            在搜索中禁用并重新启用多线程，使更改生效.
          </p>
        </>
      }
      right={
        <>
          <div className="d-flex justify-content-center">
            <Form.Group as={Col} xs={6} controlId="code">
              <Form.Label className="m-0">最大并发量: {concurrency}</Form.Label>
              <Form.Range value={concurrency} onChange={handleRange} min="1" max={maxConcurrency} />
            </Form.Group>
          </div>
        </>
      }
    />
  );
};

const SearchSettings = () => {
  return (
    <>
      <ConfigTitle title="搜索" subtitle="与种子搜索相关的设置." />
      <ListGroup variant="flush" className="mb-5 shadow">
        <ListGroup.Item>
          <Multithread />
        </ListGroup.Item>
      </ListGroup>
    </>
  );
};

export default SearchSettings;
