import { ListGroup, Form, Stack, Accordion } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { SpellInfoProvider } from "../../services/SeedInfo/infoHandler/InfoProviders/Spell";
import useLocalStorage from "../../services/useLocalStorage";
import Icon from "../Icons/Icon";

import { ConfigRow, ConfigTitle, DropZone } from "./helpers";
import { NOITA_SPELL_COUNT } from "../../static";

const spellInfoProvider = new SpellInfoProvider({} as any);

await spellInfoProvider.ready();

const flags = spellInfoProvider.spellsArr.reduce((c, r) => {
  if (!r.spawn_requires_flag) {
    return c;
  }
  if (!c[r.spawn_requires_flag]) {
    c[r.spawn_requires_flag] = [];
  }
  c[r.spawn_requires_flag].push(r);
  return c;
}, {});

const flagNames = Object.keys(flags);

const setFlagArr = (spells: (typeof spellInfoProvider)["spellsArr"], unlockedSpells: boolean[], val: boolean) => {
  const indexes = spells.map(spell => spellInfoProvider.spellsArr.findIndex(s => s.id === spell.id));
  const newUnlockedSpells = [...unlockedSpells];
  for (const i of indexes) {
    newUnlockedSpells[i] = val;
  }
  return newUnlockedSpells;
};

const FlagToggle = (props: { flag: string }) => {
  const { flag } = props;

  const [unlockedSpells, setUnlockedSpells] = useLocalStorage("unlocked-spells", Array(NOITA_SPELL_COUNT).fill(true));
  const { t } = useTranslation("materials");

  const spells = flags[flag];

  let unlocked = false;
  for (const spell of spells) {
    const i = spellInfoProvider.spellsArr.findIndex(s => s.id === spell.id);
    if (!unlockedSpells[i]) {
      unlocked = false;
      continue;
    }
    unlocked = true;
  }

  const handleChecked = (checked: boolean) => {
    setUnlockedSpells(setFlagArr(spells, unlockedSpells, checked));
  };

  return (
    <ConfigRow
      left={
        <Stack direction="horizontal" gap={2}>
          {spells.map(spell => (
            <Icon key={spell.name} uri={spell.sprite} alt={t(spell.description)} title={t(spell.name)} background />
          ))}
        </Stack>
      }
      right={
        <Form.Switch
          checked={unlocked}
          onChange={e => {
            handleChecked(e.target.checked);
          }}
          id={`unlocked-spells-${flag}`}
          label=""
        />
      }
    />
  );
};

const UnlockedSpellsSettings = () => {
  const [, setUnlockedSpells] = useLocalStorage("unlocked-spells", Array(NOITA_SPELL_COUNT).fill(true));
  const onDrop = (acceptedFiles: File[]) => {
    let newUnlockedSpells = Array(NOITA_SPELL_COUNT).fill(true);
    const notFoundFlags = flagNames.filter(f => -1 === acceptedFiles.findIndex(file => file.name === f));
    for (const flag of notFoundFlags) {
      const spells = spellInfoProvider.spellsArr.filter(s => s.spawn_requires_flag === flag);
      newUnlockedSpells = setFlagArr(spells, newUnlockedSpells, false);
    }
    setUnlockedSpells(newUnlockedSpells);
  };

  return (
    <>
      <ConfigTitle
        title="未解锁法术"
        subtitle={
          <>
            设置你已解锁的法术。这将确保所有地方生成的法术都准确无误.
            <br />
            如果您能访问自己的存档文件夹，可自动导入此内容。操作方法：从您的电脑中选择以下文件夹:&nbsp;
            <code>%appdata%\..\LocalLow\Nolla_Games_Noita\save00\persistent\flags</code>
            <br />
            <br />
            <DropZone onDrop={onDrop}>
              <p>将文件夹拖放至此，或点击选择文件</p>
            </DropZone>
          </>
        }
      />
      <Accordion flush>
        <Accordion.Item eventKey="0">
          <Accordion.Header>手动切换开关</Accordion.Header>
          <Accordion.Body style={{ padding: 0 }}>
            <ListGroup variant="flush" className="mb-5 shadow">
              {flagNames.map(flag => {
                return (
                  <ListGroup.Item key={flag}>
                    <FlagToggle flag={flag} />
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </>
  );
};

export default UnlockedSpellsSettings;
