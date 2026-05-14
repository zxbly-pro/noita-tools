/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useEffect, useState } from "react";
import { Modal, ModalProps, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import Entity from "./Icons/Entity";

import { EntityInfoProvider } from "../services/SeedInfo/infoHandler/InfoProviders/Entity";

let entitiesLoaded = false;
const entities = new EntityInfoProvider({} as any);
const entitiesReady = entities.ready().then(() => {
  entitiesLoaded = true;
});

const useEntitiesLoaded = () => {
  const [loaded, setLoaded] = useState(entitiesLoaded);

  useEffect(() => {
    if (loaded) {
      return;
    }

    let active = true;
    entitiesReady.then(() => {
      if (active) {
        setLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, [loaded]);

  return loaded;
};

const subtextMap = {
  Spell: ({ t }) => <div>法术</div>,
  "data/entities/animals/illusions/dark_alchemist.xml": ({ t }) => <div>{t("$animal_dark_alchemist")}</div>,
  "data/entities/animals/illusions/shaman_wind.xml": ({ t }) => <div>{t("$animal_shaman_wind")}</div>,
  "data/entities/items/pickup/potion_secret.xml": ({ t }) => (
    <div>
      {t("$item_potion")} <br /> 秘密
    </div>
  ),
  "data/entities/items/pickup/potion_random_material.xml": ({ t }) => (
    <div>
      {t("$item_potion")} <br /> 随机材料
    </div>
  ),
  "data/entities/items/wand_level_01.xml": () => <div>1级法杖</div>,
  "data/entities/items/wand_unshuffle_01.xml": () => (
    <div>
      1级法杖 <br /> 不乱序
    </div>
  ),
  "data/entities/items/wand_level_02.xml": () => <div>2级法杖</div>,
  "data/entities/items/wand_unshuffle_02.xml": () => (
    <div>
      2级法杖 <br /> 不乱序
    </div>
  ),
  "data/entities/items/wand_level_03.xml": () => <div>3级法杖</div>,
  "data/entities/items/wand_unshuffle_03.xml": () => (
    <div>
      3级法杖 <br /> 不乱序
    </div>
  ),
  "data/entities/items/wand_level_04.xml": () => <div>4级法杖</div>,
  "data/entities/items/wand_unshuffle_04.xml": () => (
    <div>
      4级法杖 <br /> 不乱序
    </div>
  ),
};

interface IEntityViewProps {
  id: string;
  onClick: () => void;
}
const EntityView: FC<IEntityViewProps> = ({ id, onClick }) => {
  const Subtext = subtextMap[id];
  const [t] = useTranslation("materials");
  const loaded = useEntitiesLoaded();

  if (!loaded) {
    return <>...</>;
  }

  return (
    <>
      <Entity id={id} onClick={onClick} />
      {(Subtext && <Subtext t={t} />) || entities.getDisplayName(id, t)}
    </>
  );
};

interface IEntitySelectProps {
  selected: string[];
  entitiesToShow: string[];
  show: boolean;
  showSelected?: boolean;
  handleClose: () => void;
  handleOnClick: (id: string) => void;
  handleSelectedClicked?: (id: string) => void;
  modalProps?: Partial<ModalProps>;
}

const EntitySelect = (props: IEntitySelectProps) => {
  const {
    modalProps = {},
    showSelected,
    show,
    entitiesToShow,
    handleClose,
    handleOnClick,
    handleSelectedClicked,
    selected = [],
  } = props;

  return (
    <Modal {...modalProps} fullscreen="sm-down" scrollable show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>实体选择</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {showSelected && selected.length > 0 && (
          <Row sm={5} className="p-3 justify-content-start align-items-baseline row-cols-auto">
            {selected.map(entity => {
              return (
                <Col className="p-0 m-1 d-flex flex-column align-items-center text-center lh-1" key={entity}>
                  <EntityView onClick={() => handleSelectedClicked && handleSelectedClicked(entity)} id={entity} />
                </Col>
              );
            })}
          </Row>
        )}
        <Row sm={5} className="p-3 justify-content-center align-items-baseline row-cols-auto">
          {entitiesToShow.map(entity => {
            return (
              <Col className="p-0 m-1 d-flex flex-column align-items-center text-center lh-1" key={entity}>
                <EntityView onClick={() => handleOnClick(entity)} id={entity} />
              </Col>
            );
          })}
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default EntitySelect;
