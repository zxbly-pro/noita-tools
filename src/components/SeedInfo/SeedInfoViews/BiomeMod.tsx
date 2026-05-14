import { capitalize, Objectify } from "../../../services/helpers";

import { BiomeInfoProvider } from "../../../services/SeedInfo/infoHandler/InfoProviders/Biome";
import { BiomeModifierInfoProvider } from "../../../services/SeedInfo/infoHandler/InfoProviders/BiomeModifier";

const modifierNameZh: Record<string, string> = {
  MOIST: "潮湿",
  FOG_OF_WAR_REAPPEARS: "迷雾重现",
  HIGH_GRAVITY: "高重力",
  LOW_GRAVITY: "低重力",
  CONDUCTIVE: "导电",
  FREEZING: "严寒",
  HOT: "炎热",
  GOLD_VEIN: "金矿脉",
  GOLD_VEIN_SUPER: "超级金矿脉",
  PLANT_INFESTED: "植物蔓延",
  FURNISHED: "家具陈设",
  BOOBY_TRAPPED: "陷阱密布",
  PERFORATED: "千疮百孔",
  SPOOKY: "阴森恐怖",
  GRAVITY_FIELDS: "重力场",
  FUNGAL: "真菌弥漫",
  FLOODED: "洪水泛滥",
  GAS_FLOODED: "毒气弥漫",
  SHIELDED: "护盾防护",
  PROTECTION_FIELDS: "保护力场",
  OMINOUS: "不祥之兆",
  INVISIBILITY: "隐身",
  WORMY: "虫群涌动",
  FOG_OF_WAR_CLEAR_AT_PLAYER: "战争迷雾(玩家可见)",
  FREEZING_COSMETIC: "霜冻(装饰)",
};

interface IBiomeModifierProps {
  biome: string;
  modifier: Objectify<typeof biomeModfierInfoProvider.modifiers>[string] | string;
  onClick?: (e) => void;
}

const biomeInfoProvider = new BiomeInfoProvider({} as any);
const biomeModfierInfoProvider = new BiomeModifierInfoProvider({} as any);

const BiomeModifier = (props: IBiomeModifierProps) => {
  const { biome, modifier, onClick } = props;
  let modifierObject: Objectify<typeof biomeModfierInfoProvider.modifiers>[string];
  if (typeof modifier === "string") {
    modifierObject = biomeModfierInfoProvider.modifiers[modifier];
  } else {
    modifierObject = modifier;
  }
  return (
    <div className="d-flex flex-column" onClick={onClick}>
      <div className="mx-auto" style={{}}>
        {biome && <span>{capitalize(biomeInfoProvider.translate(biome))}</span>}
      </div>

      <div
        className="position-relative text-center mx-auto"
        style={{
          height: "5rem",
          width: "15rem",
        }}
      >
        <div
          className="img-fluid position-relative top-50 start-50 translate-middle"
          style={{
            height: "5rem",
            width: "15rem",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundImage: `url('data:image/png;base64,${modifierObject.ui_decoration_file}')`,
            backgroundPositionX: "50%",
            imageRendering: "pixelated",
          }}
        ></div>
        <div className="position-absolute top-50 start-50 translate-middle" style={{}}>
          <span
            style={{
              zIndex: 1,
            }}
          >
            {modifierNameZh[modifierObject.id] || modifierObject.id.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BiomeModifier;
