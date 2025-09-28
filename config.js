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
  bSeasonlimit: "2",

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
    AthenaItemWrap: 500,
    AthenaLoadingScreen: 200,
    AthenaMusicPack: 200,
    HomebaseBannerIcon: 200,
    default: 800
  },

  // =====================================================
  // Output Settings
  // =====================================================
  outputPath: "./output",
  outputFile: "catalog_config.json"
};
