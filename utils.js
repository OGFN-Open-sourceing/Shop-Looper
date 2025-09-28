// Map Fortnite API item types to in-game shop tags
export const typeMap = {
  outfit: "AthenaCharacter",
  backpack: "AthenaBackpack",
  pickaxe: "AthenaPickaxe",
  glider: "AthenaGlider",
  contrail: "AthenaSkyDiveContrail",
  emote: "AthenaDance",
  emoji: "AthenaDance",
  toy: "AthenaDance",
  spray: "AthenaDance",
  wrap: "AthenaItemWrap",
  loadingscreen: "AthenaLoadingScreen",
  music: "AthenaMusicPack",
  banner: "HomebaseBannerIcon"
};

export function pickRandom(arr, count) {
  return arr.sort(() => 0.5 - Math.random()).slice(0, count);
}

export function makeEntry(category, index, itemId, price) {
  return {
    [`${category}${index + 1}`]: {
      itemGrants: [itemId],
      price
    }
  };
}
