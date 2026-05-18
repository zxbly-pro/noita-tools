import { useEffect, type ChangeEvent } from "react";
import { Col, Form, ListGroup } from "react-bootstrap";
import {
  clampConcurrency,
  getBrowserHardwareConcurrency,
  getRecommendedConcurrency,
} from "../../services/concurrency";
import useLocalStorage from "../../services/useLocalStorage";

import { ConfigRow, ConfigTitle } from "./helpers";

const Multithread = () => {
  const maxConcurrency = getBrowserHardwareConcurrency();
  const [concurrency, setConcurrency] = useLocalStorage(
    "search-max-concurrency",
    getRecommendedConcurrency(maxConcurrency),
  );
  const normalizedConcurrency = clampConcurrency(concurrency, maxConcurrency);

  useEffect(() => {
    if (concurrency !== normalizedConcurrency) {
      setConcurrency(normalizedConcurrency);
    }
  }, [concurrency, normalizedConcurrency, setConcurrency]);

  const handleRange = (e: ChangeEvent<HTMLInputElement>) => {
    setConcurrency(clampConcurrency(e.target.valueAsNumber, maxConcurrency));
  };

  return (
    <ConfigRow
      left={
        <>
          <strong>多线程限制</strong>
          <p className="text-muted fw-light mb-0">
            默认值改为可用核心数的一半，不足 1 视为 1，避免一开启多线程就直接占满 CPU。
            <br />
            搜索页也可以直接调核心数，这里保留全局上限设置。当前最大核心数：{maxConcurrency}。
          </p>
        </>
      }
      right={
        <div className="d-flex justify-content-center">
          <Form.Group as={Col} xs={6} controlId="search-max-concurrency">
            <Form.Label className="m-0">最大并发数：{normalizedConcurrency}</Form.Label>
            <Form.Range value={normalizedConcurrency} onChange={handleRange} min="1" max={maxConcurrency} />
          </Form.Group>
        </div>
      }
    />
  );
};

const SearchSettings = () => {
  return (
    <>
      <ConfigTitle title="搜索" subtitle="与种子搜索相关的设置。" />
      <ListGroup variant="flush" className="mb-5 shadow">
        <ListGroup.Item>
          <Multithread />
        </ListGroup.Item>
      </ListGroup>
    </>
  );
};

export default SearchSettings;
