import { ListGroup } from "react-bootstrap";

// import { db } from "../services/db";

import { ConfigTitle, PanelToggle } from "./helpers";

const PanelsSettings = () => {
  return (
    <>
      <ConfigTitle title="面板" subtitle="选择你想查看的信息面板。" />
      <ListGroup variant="flush" className="mb-5 shadow">
        <ListGroup.Item>
          <PanelToggle key="alchemy" id="alchemy" title="炼金术" />
        </ListGroup.Item>
        <ListGroup.Item>
          <PanelToggle key="biome" id="biome" title="生物群系" />
        </ListGroup.Item>
        <ListGroup.Item>
          <PanelToggle key="fungal" id="fungal" title="真菌异变" />
        </ListGroup.Item>
        <ListGroup.Item>
          <PanelToggle key="holy-mountain" id="holy-mountain" title="圣山" />
        </ListGroup.Item>
        <ListGroup.Item>
          <PanelToggle key="weather" id="weather" title="天气" />
        </ListGroup.Item>
        <ListGroup.Item>
          <PanelToggle key="start" id="start" title="初始设置" />
        </ListGroup.Item>
        <ListGroup.Item>
          <PanelToggle key="watercave" id="watercave" title="水洞" />
        </ListGroup.Item>
        <ListGroup.Item>
          <PanelToggle key="secret-wands" id="secret-wands" title="秘密法杖" />
        </ListGroup.Item>
        {/* <ListGroup.Item>
          <PanelToggle key="map" id="map" title="Map" />
        </ListGroup.Item> */}
      </ListGroup>
    </>
  );
};

export default PanelsSettings;
