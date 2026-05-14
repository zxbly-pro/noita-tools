import { Row, Col, Button } from "react-bootstrap";

import { useSearchContext } from "../../SearchContext";
import { VersionMisatch } from "../../../misc/VersionMismatch";

const InfoText = ({ clusterHelpAvailable }) => {
  if (clusterHelpAvailable) {
    return (
      <p>
        将部分工作分配到计算集群<b>可用</b>！
      </p>
    );
  }

  return (
    <p>
      将部分工作分配到计算集群暂时<b>不可用</b>。
    </p>
  );
};

const IndicatorConnected = () => {
  return <i className="bi bi-cloud-check"></i>;
};
const IndicatorNotConnected = () => {
  return <i className="bi bi-cloud-slash"></i>;
};

const ClusterInfo = () => {
  const {
    clusterState,
    clusterHelpAvailable,
    clusterHelpEnabled,
    toggleClusterHelp,
    clusterConnected,
    computeVersionMismatch,
  } = useSearchContext();

  const buttonDisabled = !clusterHelpAvailable;
  let buttonVariant = "outline-info";
  if (clusterHelpEnabled) {
    buttonVariant = "outline-success";
  }
  if (buttonDisabled) {
    buttonVariant = "outline-secondary";
  }
  return (
    <Col md={12} className="mt-3 mt-sm-0 mb-3">
      {computeVersionMismatch && (
        <Row className="mx-3 mb-1">
          <VersionMisatch />
        </Row>
      )}
      {clusterHelpAvailable && (
        <Row className="mx-3 mb-1">
          <Button
            style={{
              position: "relative",
            }}
            disabled={buttonDisabled}
            variant={buttonVariant}
            onClick={toggleClusterHelp}
          >
            {clusterHelpEnabled ? "集群计算已启用" : "启用集群计算"}
            <div
              style={{
                position: "absolute",
                top: "-0.0rem",
                right: "0.5rem",
                fontSize: "1rem",
              }}
              className="ms-2"
            >
              {clusterConnected ? <IndicatorConnected /> : <IndicatorNotConnected />}
            </div>
          </Button>
        </Row>
      )}
      <Row className="mx-3 mb-0">
        <InfoText clusterHelpAvailable={clusterHelpAvailable} />
      </Row>
      <Row className="mx-3 mt-0">
        <Col className="fw-light p-1 lh-sm" xs={12} sm={6}>
          当前集群规模： <br />
          <b>
            {clusterState.workers} （{clusterState.appetite} 核心在线）
          </b>
          <br />
        </Col>
        <Col className="fw-light p-1 lh-1" xs={12} sm={6}>
          搜索者在线： <b>{clusterState.hosts}</b>
        </Col>
      </Row>
    </Col>
  );
};

export default ClusterInfo;
