import { useState, useContext } from "react";
import { ListGroup, Form } from "react-bootstrap";

import i18n from "../../i18n";

import { ThemeContext } from "../ThemeContext";
import { AlchemyConfigContext } from "../AlchemyConfigContext";
import { ConfigRow, ConfigTitle } from "./helpers";
import useLocalStorage from "../../services/useLocalStorage";

const getFlagEmoji = countryCode =>
  String.fromCodePoint(...[...countryCode.toUpperCase()].map(x => 0x1f1a5 + x.charCodeAt()));

const flags = {
  zh: "zh",
  de: "de",
  "en-US": "us",
  es: "es",
  fr: "fr",
  jp: "jp",
  ko: "kr",
  pl: "pl",
  pt: "pt",
  ru: "ru",
};

const Locale = () => {
  const [l, sl] = useState(i18n.language);

  const setLocale = async lng => {
    await i18n.changeLanguage(lng);
    sl(lng);
  };

  return (
    <ConfigRow
      left={
        <>
          <strong className="">语言</strong>
          <p className="text-muted fw-light mb-0">
            修改 Noitool 的本地化设置。目前，仅对素材内容进行了翻译.
          </p>
        </>
      }
      right={
        <Form.Select
          onChange={async e => {
            await setLocale(e.target.value);
          }}
          value={l}
          size="sm"
          aria-label="Locale"
          style={{
            width: "9rem",
          }}
        >
          {Object.keys(flags).map(l => (
            <option value={l} key={l}>
              {getFlagEmoji(flags[l])} {flags[l]}
            </option>
          ))}
        </Form.Select>
      }
    />
  );
};

const AlchemyConfig = () => {
  const [advancedPerks, setAdvancedPerks] = useContext(AlchemyConfigContext);
  return (
    <ConfigRow
      left={
        <>
          <strong className="">素材 ID</strong>
          <p className="text-muted fw-light mb-0">在名称旁显示素材 ID</p>
        </>
      }
      right={
        <Form.Switch
          checked={advancedPerks}
          onChange={e => {
            setAdvancedPerks(e.target.checked);
          }}
          id="alchemy-config-switch"
          label=""
        />
      }
    />
  );
};

const LotteryPreview = () => {
  const [showInitialLottery, setShowInitialLottery] = useLocalStorage("show-initial-lottery", true);

  return (
    <ConfigRow
      left={
        <>
          <strong className="">抽奖预览</strong>
          <p className="text-muted fw-light mb-0">
            若未选择任何抽奖福利，仍会显示 1 项抽奖福利对应的抽奖机会.
          </p>
        </>
      }
      right={
        <Form.Switch
          checked={showInitialLottery}
          onChange={e => {
            setShowInitialLottery(e.target.checked);
          }}
          id="alchemy-config-switch"
          label=""
        />
      }
    />
  );
};

export const ShowAlwaysCastRow = () => {
  const [showAlwaysCastRow, setShowAlwaysCastRow] = useLocalStorage("show-always-cast-row", false);

  return (
    <ConfigRow
      left={
        <>
          <strong className="">显示整行的始终施法</strong>
          <p className="text-muted fw-light mb-0">
            如果该行中存在 “始终施法” 特长，则显示该行所有特长的潜在 “始终施法” 效果（以此解决 “特性与局限” 部分所述的重随问题）。.
          </p>
        </>
      }
      right={
        <Form.Switch
          checked={showAlwaysCastRow}
          onChange={e => {
            setShowAlwaysCastRow(e.target.checked);
          }}
          id="show-always-cast-row-config-switch"
          label=""
        />
      }
    />
  );
};

export const PlayFungalShiftAudio = () => {
  const [playFungalShiftAudio, setPlayFungalShiftAudio] = useLocalStorage("play-fungal-shift-audio", true);

  return (
    <ConfigRow
      left={
        <>
          <strong className="">播放 “真菌转变就绪” 音效</strong>
          <p className="text-muted fw-light mb-0">真菌转变的 5 分钟冷却时间结束时播放音效.</p>
        </>
      }
      right={
        <Form.Switch
          checked={playFungalShiftAudio}
          onChange={e => {
            setPlayFungalShiftAudio(e.target.checked);
          }}
          id="play-fungal-shift-audio-config-switch"
          label=""
        />
      }
    />
  );
};

const DarkMode = () => {
  const [theme, setTheme] = useContext(ThemeContext);
  return (
    <ConfigRow
      className="py-4"
      left={
        <>
          <strong className="">深色模式</strong>
        </>
      }
      right={
        <Form.Switch
          checked={theme === "dark"}
          onChange={e => {
            setTheme(e.target.checked ? "dark" : "light");
          }}
          id="dark-mode-switch"
          label=""
        />
      }
    />
  );
};

const GeneralSettings = () => {
  return (
    <>
      <ConfigTitle title="常规" subtitle="这些设置可修改 Noitool 的运行方式或显示方式." />
      <ListGroup variant="flush" className="mb-5 shadow">
        <ListGroup.Item>
          <DarkMode />
        </ListGroup.Item>
        <ListGroup.Item>
          <Locale />
        </ListGroup.Item>
        <ListGroup.Item>
          <AlchemyConfig />
        </ListGroup.Item>
        <ListGroup.Item>
          <LotteryPreview />
        </ListGroup.Item>
        <ListGroup.Item>
          <ShowAlwaysCastRow />
        </ListGroup.Item>
        <ListGroup.Item>
          <PlayFungalShiftAudio />
        </ListGroup.Item>
      </ListGroup>
    </>
  );
};

export default GeneralSettings;
