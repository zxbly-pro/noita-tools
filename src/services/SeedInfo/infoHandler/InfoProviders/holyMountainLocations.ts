import templeData from "../../data/temple-locations.json";

type HolyMountainLocation = {
  x: number;
  y: number;
};

const nightmareHolyMountainLocations: HolyMountainLocation[] = [
  { x: -32, y: 1410 },
  { x: -32, y: 3970 },
  { x: -32, y: 6530 },
  { x: -32, y: 10626 },
  { x: 2560, y: 13181 },
];

export const getHolyMountainLocation = (level: number, isNightmare = false): HolyMountainLocation | undefined => {
  if (isNightmare) {
    return nightmareHolyMountainLocations[level];
  }
  return templeData[level];
};

export const getHolyMountainLocations = (isNightmare = false): HolyMountainLocation[] => {
  if (isNightmare) {
    return nightmareHolyMountainLocations;
  }
  return templeData as HolyMountainLocation[];
};

export const getHolyMountainRowCount = (worldOffset = 0, isNightmare = false): number => {
  const baseCount = getHolyMountainLocations(isNightmare).length;
  return Math.max(baseCount - Number(!!worldOffset), 0);
};
