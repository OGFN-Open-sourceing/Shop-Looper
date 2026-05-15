export default {
  // =====================================================
  // Shop Rotation Settings
  // =====================================================
  bEnableShop: true,                     // Master toggle for shop rotation
  bDailyItemsAmount: 6,                  // Number of daily slots
  bFeaturedItemsAmount: 2,               // Number of featured slots
  bDateOutput: false,                    // If true → include date in filename
  ShopRotationIntervalMinutes: 1440,     // Rotation interval (default 24h)

  // Chapter / Season limits
  bChapterlimit: "1",
  bSeasonlimit: "4",

  // Era filtering behavior:
  // - exact match keeps only this exact chapter+season (recommended for 1:1 style shops)
  // - require introduction data prevents modern/no-intro cosmetics from slipping in
  bExactEraMatch: true,
  bRequireIntroductionData: true,
  bCanonicalEraIdsOnly: true,

  // Bundle settings:
  // - If enabled, outfit slots can include a back bling in the same itemGrants array.
  // - Skin is always first: ["AthenaCharacter:...", "AthenaBackpack:..."]
  bBundleOutfitBackpacks: true,
  bForceBackpackForOutfits: true,
  bBackpacksOnlyWithSkins: true,

  // Excluded cosmetics (won’t appear in shop)
  bExcludedItems: [
    "CID_VIP_Athena_Commando_M_GalileoGondola_SG",
    "CID_636_Athena_Commando_M_GalileoGondola_78MFZ",
    "CID_637_Athena_Commando_M_GalileoOutrigger_7Q0YU",
    "CID_VIP_Athena_Commando_M_GalileoFerry_SG",
    "CID_VIP_Athena_Commando_F_GalileoRocket_SG",
    "CID_568_Athena_Commando_M_RebirthSoldier"
  ],

  // =====================================================
  // Price Configuration
  // =====================================================
  useApiPrices: true,   // If false → fallback to priceTable below

  priceTable: {
    AthenaCharacter: 1500,
    AthenaBackpack: 400,
    AthenaPickaxe: 800,
    AthenaGlider: 800,
    AthenaSkyDiveContrail: 400,
    AthenaDance: 500,
    AthenaItemWrap: 500, // Waps are s7+
    AthenaLoadingScreen: 0,
    AthenaMusicPack: 0,
    HomebaseBannerIcon: 0,
    default: 800
  },

  // =====================================================
  // Output Settings
  // =====================================================
  outputPath: "./output",
  outputFile: "catalog_config.json",

  // Output profile controls what file shape is generated:
  // This generator is standalone output-only (no backend hook/injection).
  // You replace backend shop files manually with generated output.
  // - "simple": daily/featured entries with itemGrants + price
  // - "simple-meta": simple + NewDisplayAssetPath + meta.SectionId
  // Keep this project on the two stable outputs only:
  // - "simple": daily/featured entries with itemGrants + price
  // - "simple-meta": simple + NewDisplayAssetPath + meta.SectionId
  //
  // If outputTargets is empty, outputPath/outputFile + outputProfile is used.
  outputProfile: "simple",
  outputTargets: [
    {
      profile: "simple",
      outputPath: "./output",
      outputFile: "catalog_config.json",
      dateOutput: false
    },
    {
      profile: "simple-meta",
      outputPath: "./output",
      outputFile: "catalog_configV2.json",
      dateOutput: false
    }
  ],

  // Catalog profile controls for storefront output (legacy/optional).
  catalogSettings: {
    refreshIntervalHrs: 24,
    dailyPurchaseHrs: 24,
    expiration: "9999-12-31T23:59:59.999Z",
    includeCurrencyStorefront: false,
    currencyStorefrontName: "CurrencyStorefront",
    dailyStorefrontName: "BRDailyStorefront",
    featuredStorefrontName: "BRWeeklyStorefront",
    currencyEntries: []
  },

  // When true, only known shop-supported cosmetic types are used.
  strictTypeFiltering: true,

  // Optional section id labels for profiles that include meta.
  sectionIds: {
    daily: "Daily",
    featured: "Featured"
  }
};
