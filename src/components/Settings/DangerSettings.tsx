import { useState } from "react";
import { Button, Col, Form, ListGroup } from "react-bootstrap";
import { resetDatabase, clearSeeds } from "../../services/db";
import { ConfigRow, ConfigTitle } from "./helpers";

import SyncHandler from "./SyncHandler";

const SyncApp = () => {
  const [syncId, setSyncId] = useState("");
  const [thisId, setThisId] = useState<string | number>("");
  const [sent, setSent] = useState(false);
  const [synced, setSynced] = useState(false);
  const [handler] = useState(() => new SyncHandler());

  const handleSync = async () => {
    await handler.getSettingsFrom(syncId);
    setSyncId("");
    setThisId("");
    setSynced(true);
  };

  const handleSend = async () => {
    await handler.sendToSync().then(id => {
      setThisId(id);
      setSent(true);
    });
  };
  const handleChange = (e: any) => {
    if (e.target.validity.valid) {
      setSyncId(e.target.value);
    } else if (syncId === "" || syncId === "-") {
      setSyncId(syncId);
    }
  };
  return (
    <ConfigRow
      left={
        <>
          <strong className="text-info">与其他 Noitool 同步</strong>
          <p className="text-muted fw-light mb-0">
            从其他在线 Noitool 复制 Noitool 配置。这包括所有种子配置和设置.
            <br />
            该代码 15 分钟内可使用.
          </p>
        </>
      }
      right={
        <div className="my-1">
          <div className="d-flex justify-content-between mb-2">
            <p>{sent ? `你的代码: ${thisId}` : ``}</p>
            <Button variant={sent ? "success" : "outline-info"} onClick={handleSend}>
              {sent ? "已发送" : "发送此 Noitool 以进行同步"}
            </Button>
          </div>
          {/*<div className="d-flex justify-content-between">*/}
          {/*  <Form.Group as={Col} xs={12} sm={12} md={9} controlId="code">*/}
          {/*    <Form.Label>输入用于同步的代码</Form.Label>*/}
          {/*    <Form.Control*/}
          {/*      onChange={handleChange}*/}
          {/*      value={syncId}*/}
          {/*      size="sm"*/}
          {/*      type="tel"*/}
          {/*      pattern="[0-9]*"*/}
          {/*      placeholder="代码"*/}
          {/*    />*/}
          {/*  </Form.Group>*/}
          {/*  <Button variant={synced ? "success" : "info"} onClick={handleSync}>*/}
          {/*    {synced ? "已同步" : "同步"}*/}
          {/*  </Button>*/}
          {/*</div>*/}
        </div>
      }
    />
  );
};

const ResetApp = () => {
  const handleClick = async () => {
    await resetDatabase();
  };

  return (
    <ConfigRow
      left={
        <>
          <strong className="text-danger">重置 Noitool</strong>
          <p className="text-muted fw-light mb-0">
            清除 Noitool 的所有持久化数据. <br />
            这包括所有种子配置和设置.
          </p>
        </>
      }
      right={
        <>
          <Button variant="danger" onClick={handleClick}>
            重置 Noitool
          </Button>
        </>
      }
    />
  );
};

const ResetSeeds = () => {
  const handleClick = async () => {
    await clearSeeds();
  };

  return (
    <ConfigRow
      left={
        <>
          <strong className="text-warning">清除种子状态</strong>
          <p className="text-muted fw-light mb-0">
            清除所有已保存的种子状态. <br />
            若获取种子信息时遇到问题，可使用此功能.
          </p>
        </>
      }
      right={
        <>
          <Button variant="warning" onClick={handleClick}>
            清除种子状态
          </Button>
        </>
      }
    />
  );
};

const DangerSettings = () => {
  return (
    <>
      <ConfigTitle title="危险区域" subtitle="这些东西要小心." />
      <ListGroup variant="flush" className="mb-5 shadow">
        <ListGroup.Item>
          <SyncApp />
        </ListGroup.Item>
        <ListGroup.Item>
          <ResetSeeds />
        </ListGroup.Item>
        <ListGroup.Item>
          <ResetApp />
        </ListGroup.Item>
      </ListGroup>
    </>
  );
};
export default DangerSettings;
