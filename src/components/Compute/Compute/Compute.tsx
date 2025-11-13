import { useState, useEffect } from "react";
import { Button, Col, Container, Form, Row, Stack } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import humanize from "humanize-duration";
import Cookies from "js-cookie";

import { SeedSolver } from "../../../services/seedSolverHandler";
import useLocalStorage from "../../../services/useLocalStorage";
import UseMultithreadingButton from "../../SearchSeeds/UseMultithreading";
import { ComputeSocket } from "../../../services/compute/ComputeSocket";
import { localizeNumber } from "../../../services/helpers";
import { VersionMisatch } from "../../misc/VersionMismatch";

const testInfo = {
  jobName: "10c893b9eb6d3fe021fe15de14ddd23d3a9c17a4",
  chunkFrom: 1000,
  chunkTo: 3000,
  jobStats: {
    checked: 15000,
    estimate: 3600, // 1 hour in seconds
    rate: 42.5,
  },
};

const Compute = () => {
  const [computeSocket, setComputeSocket] = useState<ComputeSocket>();

  const [useCores, setUseCores] = useLocalStorage("useCores", 1);
  const [startAutomatically, setStartAutomatically] = useLocalStorage("search-start-automatically", false);
  const [shouldRefresh, setShouldRefresh] = useLocalStorage("search-should-refresh-on-version-mismatch", false);
  const [seedSolver, setSeedSolver] = useState<SeedSolver>();

  const [computeUrl, setComputeUrl] = useState(window.location.host);
  const noitoolSessionToken = Cookies.get("noitoolSessionToken");

  const [connected, setConnected] = useState(false);
  const [computeRunning, setComputeRunning] = useState(false);
  const [computeInfo, setComputeInfo] = useState<any>({});
  const [computeVersionMismatch, setComputeVersionMismatch] = useState<boolean>(false);

  useEffect(() => {
    if (!seedSolver) {
      // not ready
      return;
    }

    const newComputeSocket = new ComputeSocket({
      url: computeUrl,
      sessionToken: noitoolSessionToken,
      version: APP_VERSION,
      seedSolver,
      onUpdate: () => {
        setConnected(newComputeSocket.connected);
        setComputeRunning(newComputeSocket.running);
        setComputeInfo({
          jobName: newComputeSocket.jobName,
          chunkTo: newComputeSocket.chunkTo,
          chunkFrom: newComputeSocket.chunkFrom,
          jobStats: newComputeSocket.jobStats,
        });
      },
    });

    newComputeSocket.on("compute:version_mismatch", () => {
      if (shouldRefresh) {
        window.location.reload();
      }
      setComputeVersionMismatch(true);
      newComputeSocket.terminate();
    });

    setComputeSocket(newComputeSocket);

    return () => {
      newComputeSocket.terminate();
    };
  }, [computeUrl, noitoolSessionToken, seedSolver, startAutomatically]);

  const handleStart = () => {
    if (!computeSocket) return;
    if (!computeSocket.connected) {
      computeSocket.connect();
    }
    computeSocket.register();
    computeSocket.start().catch(e => {
      console.error(e);
      computeSocket.stopComputing();
    });
  };

  const handleStop = () => {
    computeSocket?.stopComputing();
  };

  const handleDisconnect = () => {
    computeSocket?.disconnect();
  };

  useEffect(() => {
    if (startAutomatically) {
      handleStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeSocket, startAutomatically]);

  useEffect(() => {
    const newSeedSolver = new SeedSolver(useCores, false);
    setSeedSolver(newSeedSolver);
    return () => {
      newSeedSolver.destroy().catch(e => {});
    };
  }, [useCores]);

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h4>计算资源池</h4>
        <p className="text-muted mb-0">
          该设备的计算能力可用于协助其他设备进行搜索。连接到计算资源池，即可为支持集群的搜索贡献处理能力.
        </p>
      </div>

      <div className="border rounded p-3 mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className={`badge ${connected ? "bg-success" : "bg-secondary"}`}>
            {connected ? "已连接" : "未连接"}
          </div>
          <div className={`badge ${computeRunning ? "bg-primary" : "bg-secondary"}`}>
            {computeRunning ? "运行" : "停止"}
          </div>
          {computeRunning && !computeInfo.jobName && <div className="badge bg-warning">等待下一个任务</div>}
        </div>

        {computeVersionMismatch && (
          <div className="mb-3">
            <VersionMisatch />
          </div>
        )}

        {computeInfo.jobName && (
          <div className="border-start border-4 border-primary ps-3 mb-3">
            <h6 className="mb-2">Current Job: {computeInfo.jobName.substring(0, 6)}</h6>
            <div className="text-muted small">
              <div>
                处理种子 {localizeNumber(computeInfo.chunkFrom)} - {localizeNumber(computeInfo.chunkTo)}
              </div>
              <div>已检查种子: {localizeNumber(computeInfo.jobStats.checked)}</div>
              <div>
                剩余时间:{" "}
                {humanize(computeInfo.jobStats.estimate * 1000, {
                  round: true,
                  units: ["h", "m"],
                })}
              </div>
              <div>速度: {localizeNumber(Math.round(computeInfo.jobStats.rate * 100) / 100)} 种子/秒</div>
            </div>
          </div>
        )}

        <Row className="g-4">
          <Col md={6}>
            <div className="d-grid gap-2">
              <Button
                size="lg"
                variant={computeRunning ? "outline-danger" : "primary"}
                onClick={() => (computeRunning ? handleStop() : handleStart())}
              >
                {computeRunning ? "退出计算资源池" : "加入计算资源池"}
              </Button>
            </div>
          </Col>
          <Col md={6}>
            <Stack gap={2}>
              <UseMultithreadingButton />
            </Stack>
          </Col>
        </Row>
      </div>

      <div className="border rounded p-3">
        <h6 className="mb-3">设置</h6>
        <Row className="g-3">
          <Col md={6}>
            <Form.Check
              type="switch"
              id="auto-start"
              label="页面加载时自动启动"
              checked={startAutomatically}
              onChange={() => setStartAutomatically(!startAutomatically)}
            />
          </Col>
          <Col md={6}>
            <Form.Check
              type="switch"
              id="auto-refresh"
              label="有新版本时自动刷新 noitool"
              checked={shouldRefresh}
              onChange={() => setShouldRefresh(!shouldRefresh)}
            />
          </Col>
        </Row>
      </div>
    </Container>
  );
};

const withSupport = props => {
  if (typeof OffscreenCanvas === "undefined") {
    return (
      <Container>
        <p>
          此设备不支持计算功能。请使用支持 OffscreenCanvas 的现代浏览器.
          <br />
          若你使用的是苹果移动设备，则需满足 iOS 17 及以上版本要求.
        </p>
      </Container>
    );
  }
  return <Compute {...props} />;
};

export default withSupport;
