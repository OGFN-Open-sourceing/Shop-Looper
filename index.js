import axios from "axios";
import fs from "fs";
import path from "path";
import config from "./config.js";

const API_URL = "https://fortnite-api.com/v2/cosmetics/br";

// Map Fortnite API type → Item Shop tag
const typeMap = {
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

async function fetchCosmetics() {
  const res = await axios.get(API_URL);
  return res.data.data || [];
}

function filterCosmetics(all) {
  return all.filter((cosmetic) => {
    if (!cosmetic.id || !cosmetic.type?.value) return false;

    // Skip excluded IDs
    if (config.bExcludedItems.includes(cosmetic.id)) return false;

    // Chapter/Season limit
    const chapter = cosmetic.introduction?.chapter || "0";
    const season = cosmetic.introduction?.season || "0";
    if (parseInt(chapter) > parseInt(config.bChapterlimit)) return false;
    if (parseInt(season) > parseInt(config.bSeasonlimit)) return false;

    return true;
  });
}

function pickRandom(array, amount) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, amount);
}

function buildEntry(cosmetic) {
  const tag = typeMap[cosmetic.type.value.toLowerCase()] || "Unknown";
  const grant = `${tag}:${cosmetic.id}`;

  const price = config.useApiPrices
    ? cosmetic.price?.regularPrice || config.priceTable[tag] || config.priceTable.default
    : config.priceTable[tag] || config.priceTable.default;

  return {
    itemGrants: [grant],
    price: price
  };
}

async function buildShop() {
  if (!config.bEnableShop) {
    console.log("Shop rotation disabled (bEnableShop = false)");
    return;
  }

  try {
    const allCosmetics = await fetchCosmetics();
    const pool = filterCosmetics(allCosmetics);

    const dailyItems = pickRandom(pool, config.bDailyItemsAmount);
    const featuredItems = pickRandom(pool, config.bFeaturedItemsAmount);

    const shop = { "//": "BR Item Shop Config" };

    dailyItems.forEach((item, i) => {
      shop[`daily${i + 1}`] = buildEntry(item);
    });

    featuredItems.forEach((item, i) => {
      shop[`featured${i + 1}`] = buildEntry(item);
    });

    if (!fs.existsSync(config.outputPath)) {
      fs.mkdirSync(config.outputPath, { recursive: true });
    }

    const dateSuffix = config.bDateOutput
      ? `_${new Date().toISOString().split("T")[0]}`
      : "";

    const outputFile = path.join(
      config.outputPath,
      config.outputFile.replace(".json", `${dateSuffix}.json`)
    );

   let output = JSON.stringify(shop, null, 2);

// collapse arrays like "itemGrants": [ "X" ] → "itemGrants": ["X"]
output = output.replace(/\[\s+"([^"]+)"\s+\]/g, '["$1"]');

fs.writeFileSync("./output/catalog_config.json", output);
    console.log(`✅ Shop saved to ${outputFile}`);
  } catch (err) {
    console.error("❌ Error building shop:", err.message);
  }
}

buildShop();
