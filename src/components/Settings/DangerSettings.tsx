import { Button, ListGroup } from "react-bootstrap";
import { resetDatabase, clearSeeds } from "../../services/db";
import { ConfigRow, ConfigTitle } from "./helpers";

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
            清除 Noitool 的所有持久化数据。 <br />
            包括所有种子配置和设置。
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
            清除所有已保存的种子状态。 <br />
            如果获取种子信息时出现问题，请使用此功能。
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
      <ConfigTitle title="危险区域" subtitle="请谨慎操作。" />
      <ListGroup variant="flush" className="mb-5 shadow">
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
