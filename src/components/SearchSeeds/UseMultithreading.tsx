import { useEffect } from "react";
import { Button } from "react-bootstrap";
import {
  clampConcurrency,
  getBrowserHardwareConcurrency,
  getRecommendedConcurrency,
} from "../../services/concurrency";
import useLocalStorage from "../../services/useLocalStorage";

const UseMultithreadingButton = () => {
  const maxConcurrency = getBrowserHardwareConcurrency();
  const [useCores, setUseCores] = useLocalStorage("useCores", 1);
  const [concurrency, setConcurrency] = useLocalStorage(
    "search-max-concurrency",
    getRecommendedConcurrency(maxConcurrency),
  );

  const normalizedConcurrency = clampConcurrency(concurrency, maxConcurrency);
  const normalizedUseCores = clampConcurrency(useCores, normalizedConcurrency);

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

  const handleMultithreading = () => {
    if (normalizedUseCores > 1) {
      setUseCores(1);
      return;
    }

    setUseCores(normalizedConcurrency);
  };

  return (
    <Button
      size="sm"
      onClick={handleMultithreading}
      variant={normalizedUseCores > 1 ? "outline-success" : "outline-secondary"}
    >
      多线程 {normalizedUseCores > 1 ? `开启 (x${normalizedUseCores})` : "关闭"}
    </Button>
  );
};

export default UseMultithreadingButton;
