# Shop-Looper (Semi auto)
A basic OGFN Shop rotator made in JS, Manual and Semi auto.

<img width="310.99" height="310.99" alt="Shop Looper logo" src="https://github.com/user-attachments/assets/f0024aa8-ad88-4a8f-8917-13c2536e2d36" />

# Features
  - [x] semi auto rotations.
  - [x] Season / Chapter devider for C1S1 - C5S3 (*inspired by Brulone's Reload backend*).
  - [x] Custom output settings.
  - [x] Changeable *Featured* and *Daily* slots ammount.
  - [x] Uses **https://fortnite-api.com/v2/cosmetics/br** as its API for skins and cosmetics etc.

## License

This project is licensed under the **MIT License**.

Make sure to read it tho.

### What does this mean?

- ✅ You can **use this project freely** in personal or commercial projects.  
- ✅ You can **modify, distribute, and share** the code.  
- ✅ You must **include the original license and credit** (Ducki67).  
- ❌ There is **no warranty** – if something breaks, I’m not responsible.  

## Configurations

**Shop Rotation Settings**
  - Daily items ammount - Number of daily slots  (default is 6)
  - Featured items ammount - Number of featured slots  (default is 2)
  - Date output - Includes the creation date in filename.   (egxample: **`catalog_config-2025-01-01`** )


**Chapter / Season limits**
  - Chapter limit - not working for now ( chapters 1-5)
  - Season limit - not working yet ( seasons 1-30)


**Excluded items / item IDs**
  - 50 items max! - This feature lets you filter comsetics like BP skins and exlusive items so they dont get used in the generation


**Price Configuration**
  - UseApiPrices - If "false" fallback to priceTable below
 - Price table - This feature lest u customize all types of cosmetic prices for OGFN Item Shops
 ```JS
 priceTable: {
    AthenaCharacter: 1500, // Skins
    AthenaBackpack: 400, // Back Blings
    AthenaPickaxe: 800, // Pickaxes
    AthenaGlider: 800, // Gliders
    AthenaSkyDiveContrail: 400, // Contraills
    AthenaDance: 500, // Emotes
    AthenaItemWrap: 500, // Weapon wraps (Season 7 and above btw)
    AthenaLoadingScreen: 200, // Loading Screens
    AthenaMusicPack: 200, // Musick paks (NOT jatm tracks)
    HomebaseBannerIcon: 200, // Banner icons
    default: 800 // Fallback price
  },
  ```


**Output Settings**
  - outputPath - this si the folder that the generator creates to put the `.js` file into.
  - outputFile - This is the file / name that creates upon Shop Generation.  (BTW keep the `.js` because as of right now  since this app cant make other file types)
```JS
outputPath: "./Shop-output",
outputFile: "catalog_config.json" // Dont  Don't change it if you using  backends like: Reload, LawinV2, Momentum
```

## Backend Compatibility (Any OGFN backend)

The rotator now supports output profiles so you can generate files for different backend styles without editing code.

Important: This tool does not hook to any backend. It only creates output files that you manually copy/replace in your backend shop files.

### Output profiles

- `simple` (default):
  - Keys like `daily1`, `featured1`
  - Each slot has `itemGrants` + `price`
  - Works for most config-based backends.

- `simple-meta`:
  - Same as `simple`
  - Also includes `displayAssetPath`, `NewDisplayAssetPath`, and `meta.SectionId`
  - Useful for backends that expect display assets or section metadata.

- `catalog`:
  - Generates a full `/fortnite/api/storefront/v2/catalog` JSON shape
  - Includes `storefronts`, `catalogEntries`, `prices`, `requirements`, and object-style `itemGrants`.

- `catalog-with-currency`:
  - Same as `catalog`
  - Also includes `CurrencyStorefront` from `catalogSettings`.

- `catalog-versioned`:
  - Writes multiple catalog files in one run (default: `v1.json`, `v2.json`, `v3.json`)
  - Useful for backends that switch shop files by client version/build.

### Single target example

```js
outputPath: "./output",
outputFile: "catalog_config.json",
outputProfile: "simple"
```

### Multi-target example (recommended)

Generate multiple backend formats in one run:

```js
outputTargets: [
  {
    profile: "simple",
    outputPath: "./output",
    outputFile: "catalog_config.json"
  },
  {
    profile: "simple-meta",
    outputPath: "./output",
    outputFile: "catalog_config_v2.json"
  },
  {
    profile: "catalog",
    outputPath: "./output",
    outputFile: "catalog.json"
  },
  {
    profile: "catalog-versioned",
    outputPath: "./output",
    versionedFiles: ["v1.json", "v2.json", "v3.json"]
  }
]
```

### Catalog storefront tuning

Use `catalogSettings` to tune catalog shape:

```js
catalogSettings: {
  refreshIntervalHrs: 24,
  dailyPurchaseHrs: 24,
  expiration: "9999-12-31T23:59:59.999Z",
  includeCurrencyStorefront: false,
  currencyStorefrontName: "CurrencyStorefront",
  dailyStorefrontName: "BRDailyStorefront",
  featuredStorefrontName: "BRWeeklyStorefront",
  currencyEntries: []
}
```

For versioned-catalog backends, keep `catalog-versioned` enabled and replace your backend's `v1/v2/v3` shop files with generated files.

### Important fixes in current version

- Output path bug fixed (it now writes to configured target files, not hardcoded paths).
- Chapter/season filters now parse values like `Chapter 2` and `Season 4` correctly.
- Daily and featured picks are now unique (no duplicate cosmetics across slots).
- Strict type filtering prevents invalid item templates by default.

## Semi-Auto Mode (Local + VPS)

Semi-auto mode can generate shop files on a timer and deploy them automatically.

### 1) Setup

Copy `.env.example` to `.env` and edit values.

```bash
cp .env.example .env
```

### 2) Modes

- `SEMI_AUTO_MODE=off`
  - only generates output files.
- `SEMI_AUTO_MODE=local`
  - generates and copies output files to `SEMI_AUTO_LOCAL_TARGET_DIR`.
- `SEMI_AUTO_MODE=vps`
  - generates and uploads output files to VPS using `ssh` + `scp`.

Required VPS env values:

- `VPS_HOST`
- `VPS_USER`
- `VPS_REMOTE_DIR`
- optional: `VPS_PORT` (default `22`), `VPS_KEY_PATH`, `VPS_POST_DEPLOY_CMD`

### 3) Run commands

- One cycle:

```bash
npm run semi-auto:once
```

- Continuous loop:

```bash
npm run semi-auto
```

Loop interval uses `SEMI_AUTO_INTERVAL_MINUTES` (or `ShopRotationIntervalMinutes` in config if env var is not set).
  
