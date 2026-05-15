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

function toInt(value, fallback) {
  if (value === null || value === undefined) return fallback;
  const parsed = parseInt(String(value).match(/\d+/)?.[0] ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function withDateSuffix(filename, enabled) {
  if (!enabled) return filename;
  const parsed = path.parse(filename);
  const date = new Date().toISOString().split("T")[0];
  return `${parsed.name}_${date}${parsed.ext || ".json"}`;
}

function shuffleCopy(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function fetchCosmetics() {
  const res = await axios.get(API_URL, { timeout: 30000 });
  return res.data.data || [];
}

function filterCosmetics(all) {
  const chapterLimit = toInt(config.bChapterlimit, Number.MAX_SAFE_INTEGER);
  const seasonLimit = toInt(config.bSeasonlimit, Number.MAX_SAFE_INTEGER);
  const exactEra = Boolean(config.bExactEraMatch);
  const requireIntro = Boolean(config.bRequireIntroductionData);
  const canonicalOnly = Boolean(config.bCanonicalEraIdsOnly);
  const excluded = new Set((config.bExcludedItems || []).map((id) => String(id).toLowerCase()));

  function isCanonicalIdForTag(id, tag) {
    if (/(?:_Owned|_Follower|_Template|_NPC|_TBD)/i.test(id)) return false;
    if (/^CID_A_/i.test(id)) return false;

    if (tag === "AthenaCharacter") return /^CID_\d+_/i.test(id);
    if (tag === "AthenaBackpack") return /^BID_\d+_/i.test(id);
    if (tag === "AthenaPickaxe") return /^Pickaxe_ID_\d+_/i.test(id);
    if (tag === "AthenaGlider") return /^Glider_ID_\d+_/i.test(id);
    if (tag === "AthenaSkyDiveContrail") return /^Trails_ID_\d+_/i.test(id);
    if (tag === "AthenaDance") return /^(EID_|SPID_)/i.test(id);
    if (tag === "AthenaItemWrap") return /^Wrap_\d+/i.test(id);
    if (tag === "AthenaLoadingScreen") return /^LSID_\d+_/i.test(id);
    if (tag === "AthenaMusicPack") return /^MusicPack_\d+/i.test(id);
    if (tag === "HomebaseBannerIcon") return /^Banner_Icon_/i.test(id);

    return true;
  }

  return all.filter((cosmetic) => {
    if (!cosmetic.id || !cosmetic.type?.value) return false;

    // Skip excluded IDs
    if (excluded.has(cosmetic.id.toLowerCase())) return false;

    const mappedTag = typeMap[cosmetic.type.value.toLowerCase()];
    if (config.strictTypeFiltering && !mappedTag) return false;

    if (canonicalOnly && mappedTag && !isCanonicalIdForTag(cosmetic.id, mappedTag)) return false;

    // Chapter/Season filtering.
    // Avoid defaulting missing introduction data to 0/0 because that allows unrelated modern cosmetics.
    const introChapterRaw = cosmetic.introduction?.chapter;
    const introSeasonRaw = cosmetic.introduction?.season;
    const chapter = toInt(introChapterRaw, -1);
    const season = toInt(introSeasonRaw, -1);

    const hasIntro = chapter > 0 && season > 0;
    if (requireIntro && !hasIntro) return false;

    if (exactEra) {
      if (!hasIntro) return false;
      if (chapter !== chapterLimit) return false;
      if (season !== seasonLimit) return false;
    } else {
      if (chapter > chapterLimit) return false;
      if (season > seasonLimit) return false;
    }

    return true;
  });
}

function pickWithoutReplacement(array, amount, usedIds) {
  if (!Array.isArray(array) || array.length === 0 || amount <= 0) return [];
  const result = [];
  const shuffled = shuffleCopy(array);

  for (const item of shuffled) {
    if (result.length >= amount) break;
    if (usedIds.has(item.id)) continue;
    usedIds.add(item.id);
    result.push(item);
  }

  return result;
}

function isBackpack(cosmetic) {
  return cosmetic?.type?.value?.toLowerCase() === "backpack";
}

function pickBackpackForOutfit(outfit, pool, usedBackpackIds) {
  const backpacks = pool.filter((item) => isBackpack(item) && !usedBackpackIds.has(item.id));
  if (backpacks.length === 0) return null;

  const outfitSet = outfit?.set?.value || outfit?.set?.text || null;
  if (outfitSet) {
    const sameSet = backpacks.filter((item) => {
      const backpackSet = item?.set?.value || item?.set?.text || null;
      return backpackSet && backpackSet === outfitSet;
    });

    if (sameSet.length > 0) {
      return sameSet[Math.floor(Math.random() * sameSet.length)];
    }
  }

  if (!config.bForceBackpackForOutfits) return null;

  const chapter = toInt(outfit?.introduction?.chapter, -1);
  const season = toInt(outfit?.introduction?.season, -1);

  const sameEra = backpacks.filter(
    (item) =>
      toInt(item?.introduction?.chapter, -1) === chapter &&
      toInt(item?.introduction?.season, -1) === season
  );

  const fallbackPool = sameEra.length > 0 ? sameEra : backpacks;
  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)] || null;
}

function buildEntry(cosmetic, pool, usedBackpackIds) {
  const tag = typeMap[cosmetic.type.value.toLowerCase()] || "AthenaCharacter";
  const itemGrants = [`${tag}:${cosmetic.id}`];

  // For outfits, optionally bundle a back bling in the same slot.
  if (config.bBundleOutfitBackpacks && tag === "AthenaCharacter") {
    const backpack = pickBackpackForOutfit(cosmetic, pool, usedBackpackIds);
    if (backpack) {
      itemGrants.push(`AthenaBackpack:${backpack.id}`);
      usedBackpackIds.add(backpack.id);
    }
  }

  const price = config.useApiPrices
    ? cosmetic.price?.regularPrice || config.priceTable[tag] || config.priceTable.default
    : config.priceTable[tag] || config.priceTable.default;

  return {
    tag,
    cosmeticId: cosmetic.id,
    sectionDisplayAsset: `/OfferCatalog/NewDisplayAssets/DAv2_${cosmetic.id}.DAv2_${cosmetic.id}`,
    itemGrants,
    price
  };
}

function buildSimpleOutput(featuredEntries, dailyEntries, includeMeta) {
  const out = { "//": "BR Item Shop Config" };

  featuredEntries.forEach((entry, idx) => {
    const key = `featured${idx + 1}`;
    out[key] = {
      itemGrants: entry.itemGrants,
      price: entry.price
    };

    if (includeMeta) {
      out[key].displayAssetPath = "";
      out[key].NewDisplayAssetPath = entry.sectionDisplayAsset;
      out[key].meta = {
        SectionId: config.sectionIds?.featured || "Featured"
      };
    }
  });

  dailyEntries.forEach((entry, idx) => {
    const key = `daily${idx + 1}`;
    out[key] = {
      itemGrants: entry.itemGrants,
      price: entry.price
    };

    if (includeMeta) {
      out[key].displayAssetPath = "";
      out[key].NewDisplayAssetPath = entry.sectionDisplayAsset;
      out[key].meta = {
        SectionId: config.sectionIds?.daily || "Daily"
      };
    }
  });

  return out;
}

function getCatalogSettings(override) {
  return {
    refreshIntervalHrs: toInt(override?.refreshIntervalHrs ?? config.catalogSettings?.refreshIntervalHrs, 24),
    dailyPurchaseHrs: toInt(override?.dailyPurchaseHrs ?? config.catalogSettings?.dailyPurchaseHrs, 24),
    expiration: override?.expiration || config.catalogSettings?.expiration || "9999-12-31T23:59:59.999Z",
    includeCurrencyStorefront:
      typeof override?.includeCurrencyStorefront === "boolean"
        ? override.includeCurrencyStorefront
        : Boolean(config.catalogSettings?.includeCurrencyStorefront),
    currencyStorefrontName:
      override?.currencyStorefrontName || config.catalogSettings?.currencyStorefrontName || "CurrencyStorefront",
    dailyStorefrontName:
      override?.dailyStorefrontName || config.catalogSettings?.dailyStorefrontName || "BRDailyStorefront",
    featuredStorefrontName:
      override?.featuredStorefrontName || config.catalogSettings?.featuredStorefrontName || "BRWeeklyStorefront",
    currencyEntries:
      Array.isArray(override?.currencyEntries)
        ? override.currencyEntries
        : Array.isArray(config.catalogSettings?.currencyEntries)
          ? config.catalogSettings.currencyEntries
          : []
  };
}

function makeCatalogEntry(entry, sectionName, index) {
  const templateId = entry.itemGrants[0];
  const price = entry.price;
  return {
    devName: `[VIRTUAL]1 x ${templateId} for ${price} MtxCurrency`,
    offerId: `v2:/shoplooper/${sectionName.toLowerCase()}/${index + 1}/${entry.cosmeticId}`,
    fulfillmentIds: [],
    dailyLimit: -1,
    weeklyLimit: -1,
    monthlyLimit: -1,
    categories: [sectionName],
    prices: [
      {
        currencyType: "MtxCurrency",
        currencySubType: "",
        regularPrice: price,
        dynamicRegularPrice: -1,
        finalPrice: price,
        saleExpiration: "9999-12-31T23:59:59.999Z",
        basePrice: price
      }
    ],
    meta: {},
    matchFilter: "",
    filterWeight: 0,
    appStoreId: [],
    requirements: [
      {
        requirementType: "DenyOnItemOwnership",
        requiredId: templateId,
        minQuantity: 1
      }
    ],
    offerType: "StaticPrice",
    giftInfo: {},
    refundable: true,
    metaInfo: [],
    displayAssetPath: entry.sectionDisplayAsset,
    itemGrants: [
      {
        templateId,
        quantity: 1
      }
    ],
    sortPriority: -1,
    catalogGroupPriority: 0
  };
}

function buildCatalogOutput(featuredEntries, dailyEntries, catalogOptions) {
  const settings = getCatalogSettings(catalogOptions);
  const storefronts = [];

  if (settings.includeCurrencyStorefront) {
    storefronts.push({
      name: settings.currencyStorefrontName,
      catalogEntries: settings.currencyEntries
    });
  }

  storefronts.push(
    {
      name: settings.dailyStorefrontName,
      catalogEntries: dailyEntries.map((entry, idx) =>
        makeCatalogEntry(entry, config.sectionIds?.daily || "Daily", idx)
      )
    },
    {
      name: settings.featuredStorefrontName,
      catalogEntries: featuredEntries.map((entry, idx) =>
        makeCatalogEntry(entry, config.sectionIds?.featured || "Featured", idx)
      )
    }
  );

  return {
    refreshIntervalHrs: settings.refreshIntervalHrs,
    dailyPurchaseHrs: settings.dailyPurchaseHrs,
    expiration: settings.expiration,
    storefronts
  };
}

function resolveTargets() {
  if (Array.isArray(config.outputTargets) && config.outputTargets.length > 0) {
    return config.outputTargets.map((target) => ({
      profile: target.profile || "simple",
      outputPath: target.outputPath || config.outputPath,
      outputFile: target.outputFile || config.outputFile,
      dateOutput: typeof target.dateOutput === "boolean" ? target.dateOutput : config.bDateOutput,
      versionedFiles: Array.isArray(target.versionedFiles) ? target.versionedFiles : null,
      catalogOptions: target.catalogOptions || null
    }));
  }

  return [
    {
      profile: config.outputProfile || "simple",
      outputPath: config.outputPath,
      outputFile: config.outputFile,
      dateOutput: config.bDateOutput,
      versionedFiles: null,
      catalogOptions: null
    }
  ];
}

function formatOutput(profile, featuredEntries, dailyEntries, target) {
  const normalized = String(profile || "simple").toLowerCase();
  if (normalized === "simple-meta") {
    return buildSimpleOutput(featuredEntries, dailyEntries, true);
  }

  if (normalized === "catalog-with-currency") {
    return buildCatalogOutput(featuredEntries, dailyEntries, {
      ...(target?.catalogOptions || {}),
      includeCurrencyStorefront: true
    });
  }

  if (normalized === "catalog") {
    return buildCatalogOutput(featuredEntries, dailyEntries, target?.catalogOptions || {});
  }

  return buildSimpleOutput(featuredEntries, dailyEntries, false);
}

function writeTargets(featuredEntries, dailyEntries) {
  const targets = resolveTargets();

  for (const target of targets) {
    ensureDir(target.outputPath);

    const profileName = String(target.profile || "simple").toLowerCase();
    if (profileName === "catalog-versioned") {
      const versionedFiles =
        Array.isArray(target.versionedFiles) && target.versionedFiles.length > 0
          ? target.versionedFiles
          : ["v1.json", "v2.json", "v3.json"];

      const catalogOutput = buildCatalogOutput(featuredEntries, dailyEntries, {
        ...(target.catalogOptions || {}),
        includeCurrencyStorefront: true
      });

      for (const rawFileName of versionedFiles) {
        const fileName = withDateSuffix(rawFileName, target.dateOutput);
        const fullPath = path.join(target.outputPath, fileName);
        const output = `${JSON.stringify(catalogOutput, null, 2)}\n`;
        fs.writeFileSync(fullPath, output, "utf8");
        console.log(`✅ Shop saved (${target.profile}) -> ${fullPath}`);
      }

      continue;
    }

    const fileName = withDateSuffix(target.outputFile, target.dateOutput);
    const fullPath = path.join(target.outputPath, fileName);

    const outputObj = formatOutput(target.profile, featuredEntries, dailyEntries, target);
    const output = `${JSON.stringify(outputObj, null, 2)}\n`;
    fs.writeFileSync(fullPath, output, "utf8");
    console.log(`✅ Shop saved (${target.profile}) -> ${fullPath}`);
  }
}

async function buildShop() {
  if (!config.bEnableShop) {
    console.log("Shop rotation disabled (bEnableShop = false)");
    return;
  }

  try {
    const allCosmetics = await fetchCosmetics();
    const pool = filterCosmetics(allCosmetics);
    const bundleBackpacksWithSkins =
      Boolean(config.bBundleOutfitBackpacks) && Boolean(config.bBackpacksOnlyWithSkins);
    const slotPool = bundleBackpacksWithSkins
      ? pool.filter((item) => !isBackpack(item))
      : pool;

    if (slotPool.length === 0) {
      throw new Error("No cosmetics available after filtering. Relax chapter/season/type filters.");
    }

    const usedIds = new Set();
    const dailyItems = pickWithoutReplacement(slotPool, config.bDailyItemsAmount, usedIds);
    const featuredItems = pickWithoutReplacement(slotPool, config.bFeaturedItemsAmount, usedIds);

    if (dailyItems.length < config.bDailyItemsAmount || featuredItems.length < config.bFeaturedItemsAmount) {
      console.warn(
        `⚠️ Requested ${config.bDailyItemsAmount + config.bFeaturedItemsAmount} unique items, generated ${dailyItems.length + featuredItems.length}.`
      );
    }

    const usedBackpackIds = new Set();
    const dailyEntries = dailyItems.map((item) => buildEntry(item, pool, usedBackpackIds));
    const featuredEntries = featuredItems.map((item) => buildEntry(item, pool, usedBackpackIds));

    writeTargets(featuredEntries, dailyEntries);
  } catch (err) {
    console.error("❌ Error building shop:", err.message);
  }
}

buildShop();
