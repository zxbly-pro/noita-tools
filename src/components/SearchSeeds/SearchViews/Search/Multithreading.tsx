import { useEffect } from "react";
import { Button, ButtonGroup, Col, Form, Row } from "react-bootstrap";
import {
  clampConcurrency,
  getBrowserHardwareConcurrency,
  getRecommendedConcurrency,
} from "../../../../services/concurrency";
import useLocalStorage from "../../../../services/useLocalStorage";
import { useSearchContext } from "../../SearchContext";

const Multithreading = () => {
  const maxHardwareConcurrency = getBrowserHardwareConcurrency();
  const [concurrency, setConcurrency] = useLocalStorage(
    "search-max-concurrency",
    getRecommendedConcurrency(maxHardwareConcurrency),
  );
  const [useCores, setUseCores] = useLocalStorage("useCores", 1);
  const { running, solverReady } = useSearchContext();

  const normalizedConcurrency = clampConcurrency(concurrency, maxHardwareConcurrency);
  const normalizedUseCores = clampConcurrency(useCores, normalizedConcurrency);
  const disabled = running || !solverReady;

  useEffect(() => {
    if (concurrency !== normalizedConcurrency) {
      setConcurrency(normalizedConcurrency);
    }
  }, [concurrency, normalizedConcurrency, setConcurrency]);

  useEffect(() => {
    if (useCores !== normalizedUseCores) {
      setUseCores(normalizedUseCores);
    }
  }, [useCores, normalizedUseCores, setUseCores]);

  const updateConcurrency = (nextConcurrency: number) => {
    const clampedConcurrency = clampConcurrency(nextConcurrency, maxHardwareConcurrency);
    setConcurrency(clampedConcurrency);
    if (normalizedUseCores > 1) {
      setUseCores(clampedConcurrency);
    }
  };

  const toggleMultithreading = () => {
    if (normalizedUseCores > 1) {
      setUseCores(1);
      return;
    }

    setUseCores(normalizedConcurrency);
  };

  return (
    <Col md={12}>
      <Row className="m-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button
            size="sm"
            onClick={toggleMultithreading}
            disabled={disabled}
            variant={normalizedUseCores > 1 ? "outline-success" : "outline-secondary"}
          >
            {`多线程 ${normalizedUseCores > 1 ? `开启 (x${normalizedUseCores})` : "关闭"}`}
          </Button>
          <ButtonGroup size="sm">
            <Button
              variant="outline-secondary"
              disabled={disabled || normalizedConcurrency <= 1}
              onClick={() => updateConcurrency(normalizedConcurrency - 1)}
            >
              -
            </Button>
            <Button variant="outline-primary" disabled>
              {`核心数 ${normalizedConcurrency}`}
            </Button>
            <Button
              variant="outline-secondary"
              disabled={disabled || normalizedConcurrency >= maxHardwareConcurrency}
              onClick={() => updateConcurrency(normalizedConcurrency + 1)}
            >
              +
            </Button>
          </ButtonGroup>
        </div>
      </Row>
      <Row className="mx-3 mb-3">
        <Form.Text className="text-muted">
          {`默认使用可用核心数的一半，不足 1 按 1 处理；这里调整的是多线程开启时使用的核心数上限，设置页中的滑块仍然保留。当前最大核心数：${maxHardwareConcurrency}。`}
        </Form.Text>
      </Row>
    </Col>
  );
};

export default Multithreading;
