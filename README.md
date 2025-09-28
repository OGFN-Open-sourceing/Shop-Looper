# Shop-Looper
A basic OGFN Shop rotator made in JS, Manual and Semi auto.



## Configurations

**Shop Rotation Settings**
  - Daily items ammount - Number of daily slots  (default is 6)
  - Featured items ammount - Number of featured slots  (default is 2)
  - Date output - Includes the creation date in filename.   (egxample: **`catalog_config-2025-01-01`** )


**Chapter / Season limits**
  - Chapter limit - not working for now ( chapters 1-5)
  - Season limit - not working yet ( seasons 1-30)


**Excluded items / item IDs**
  - 50 items max! - This feature lets you filter comsetics liek BP skins and exlusive items so they dont get used in the generation


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
    default: 800 // IDK YET
  },
  ```


**Output Settings**
  - outputPath - this si the folder that the generator creates to put the `.js` file into.
  - outputFile - This is the file / name that creates upon Shop Generation.  (BTW keep the `.js` because as of right now  since this app cant make other file types)
```JS
outputPath: "./Shop-output",
outputFile: "catalog_config.json" // Dont  Don't change it if you using  backends like: Reload, LawinV2, Momentum
```
  
  
