const NORMAL_WORLD_TILE_WIDTH = 70;
const NIGHTMARE_WORLD_TILE_WIDTH = 64;
const HOLY_MOUNTAIN_WORLD_TILE_WIDTH = 64;

export const getWorldTileWidth = (isNightmare = false) =>
  isNightmare ? NIGHTMARE_WORLD_TILE_WIDTH : NORMAL_WORLD_TILE_WIDTH;

export const getWorldOffsetX = (isNightmare = false) => Math.floor(getWorldTileWidth(isNightmare) / 2);

export const getWorldOffsetY = () => 14;

export const getParallelWorldWidth = (isNightmare = false) => getWorldTileWidth(isNightmare) * 512;

export const getHolyMountainParallelWorldWidth = () => HOLY_MOUNTAIN_WORLD_TILE_WIDTH * 512;

export const normalizeWorldTileX = (x: number, isNightmare = false) => {
  const width = getWorldTileWidth(isNightmare);
  return ((x % width) + width) % width;
};

export const getParallelWorldOffset = (x: number, isNightmare = false) => {
  const width = getWorldTileWidth(isNightmare);
  const normalizedX = normalizeWorldTileX(x, isNightmare);
  return Math.floor((x - normalizedX) / width);
};
