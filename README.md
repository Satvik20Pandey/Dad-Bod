# Dad Bod — The Dad Physique OS

A premium, completely free fitness companion for building a lean, strong
physique. Nutrition, training, hydration, and progress — one beautiful app,
no account, no subscription, no ads.

Built as an offline-first PWA (vanilla ES modules, zero framework) wrapped
with Capacitor for Android.

## Product

| Screen | What it does |
| --- | --- |
| **Home — Daily Mission** | Animated **Dad Physique Score**, contextual hero action (Start/Continue Workout), Dad Coins + streak chips, calorie + burn rings, bento grid |
| **Diet** | Search-first logging: 5,277-food Indian dataset (offline), voice input, barcode scan, label OCR, live suggestions, macro donut + 13 micronutrients, weekly meal plan |
| **Train** | Structured weekly splits with form cues, load/rep logging, full-screen rest timer with haptics, session celebrations, cardio + abs, 700+ exercise library |
| **Progress** | Animated weight trend with goal line, before/after photo compare slider, consistency heatmap, strength PR board with estimated 1RM, CSV export |
| **Scan** | Center-nav fullscreen scanner (brackets + laser + haptics): BarcodeDetector → ZXing fallback; OFF v2 → OFF v0 → UPCItemDB name lookup — never a dead end |
| **Dad Bod HQ** | Account (Google or offline), Dad Coins rewards, encrypted cloud backup, goals with USDA cross-check, **customizable Training Setup** (per-day exercises + library search), nearby, recipes |

## Production API architecture

Meal text resolves through a layered chain — fast and offline first, network
only when needed:

```
Food search      →  On-device dataset (5,277 Indian foods, instant, offline)
                 →  Edamam natural-language parsing   (unmatched portions)
                 →  Heuristic estimation → manual edit (always available)

Barcode          →  BarcodeDetector → ZXing (lazy) → manual
                 →  Open Food Facts v2 → v0 → UPCItemDB (name) → estimate
Label photo      →  On-device OCR (Tesseract, lazy-loaded)
Recipes + USDA   →  MyPlate.food (BMI, calorie needs, water, 1,072 recipes)
Exercise library →  wger.de catalog, downloaded once + cached 30d (offline search)
Nearby           →  Geolocation → Overpass/OpenStreetMap (gyms, parks)
```

Every service call is cached with a TTL (`js/services/http.js`) so free-tier
quotas stretch far and repeat lookups work offline. Edamam credentials live in
[js/config.js](js/config.js).

## Codebase

```
index.html                 App shell: screens, sheets, overlays
styles/                    Design system
  tokens.css               Color/depth/motion tokens (single source of truth)
  base.css                 Reset, aurora background, utilities
  components.css           Buttons, cards, rings, sheets, nav, toasts
  screens.css              Per-screen layout
js/
  main.js                  Composition root: boot, navigation, render cycle
  config.js                App identity, storage keys, API endpoints
  utils.js                 DOM/format/date helpers
  core/                    Domain logic (no DOM assumptions beyond store)
    store.js               Auth + state, localStorage/IndexedDB persistence
    nutrition.js           Nutrient model, targets, scaling
    dataset.js             Food dataset loading, indexing, fuzzy matching
    resolver.js            Free-text meal → components → nutrition engine
    profile.js             BMR/TDEE/macros target engine
    metrics.js             Daily totals, burn, streak, physique score
    program.js             Training splits, schedules, prescriptions
    bus.js                 Render bus (no circular imports)
  services/                API clients (http cache, edamam, openfoodfacts,
                           myplate, wger, overpass, firebase, backup)
  ui/                      Icons (inline Lucide-style), components
                           (sheets/toasts/confetti/haptics), canvas charts
  features/                Screen controllers (home, diet, workout, progress,
                           nearby, recipes, more, training-setup, capture,
                           onboarding, account)
scripts/                   Build + test tooling
assets/food-dataset.json   5,277-food nutrition dataset (generated)
data/food-sources/         Canonical staples + supplements (dataset inputs)
android/                   Capacitor Android project
release/                   Signed artifacts + Play Store listing pack
```

All user data stays on-device (localStorage mirrored to IndexedDB). Storage
keys are stable across versions — v1.x users upgrade in place.

## Accounts and privacy

Two ways in, both first-class:

- **Continue with Google** - Firebase Authentication provides identity (name,
  email, photo) and unlocks encrypted cloud backup.
- **Continue Offline** - no network, no account, nothing uploaded, ever.

Cloud backup is **end-to-end encrypted on the device** (PBKDF2-SHA256 ->
AES-GCM-256) with a passphrase only you know; the server holds an opaque blob.
Signing in never discards existing local data - see the migration rules in
[CHANGELOG.md](CHANGELOG.md). Full setup, Firestore rules, and troubleshooting:
[docs/FIREBASE.md](docs/FIREBASE.md).

```bash
npm run sync:firebase   # regenerate js/firebase-config.js after any console change
```

## Quick start (web)

```bash
git clone https://github.com/Satvik20Pandey/Dad-Bod.git
cd Dad-Bod
npm install
python -m http.server 8080   # or any static server
```

Open http://localhost:8080

## Tests

```bash
npm test              # dataset + resolver + service + auth/encryption units
npm run test:smoke    # Playwright end-to-end (screenshots → scripts/screenshots/)
```

The smoke test drives the real app: onboarding → physique score → dataset
search → meal logging → workout toggles → rest timer → weight entry →
persistence across reload.

## Build the Android release

First-time setup (installs portable JDK 21 + Android SDK locally):

```powershell
npm run setup:android
```

Build the signed release APK + AAB (auto-runs `build:dist` + `cap sync`):

```powershell
npm run build:android
```

Outputs land in `release/`:

- `DadBod-v1.0.0-signed.apk` — side-load / testers
- `DadBod-v1.0.0-signed.aab` — Play Store upload
- `DadBod-latest-signed.apk` / `.aab` — rolling aliases

Keystore password override (PKCS12 uses one password for store + key):

```powershell
$env:DADBOD_STORE_PASSWORD = "your-store-password"
npm run build:android
```

Play Store checklist: [release/PLAYSTORE_LISTING.txt](release/PLAYSTORE_LISTING.txt)

## Deployment (web)

- **Vercel**: repo includes `vercel.json` — import and deploy `main`.
- **GitHub Pages**: `.github/workflows/deploy-pages.yml` tests and publishes
  on every push to `main`.

## Owner profile (optional)

No credentials are hardcoded in source. The owner email gets a preloaded
training plan; to additionally gate it with a passkey on a shared device,
set a runtime config in the browser console once:

```js
localStorage.setItem(
  "dadbod_security_config_v1",
  JSON.stringify({ adminPasskey: "your-strong-passkey" })
);
```

## Rebuilding the food dataset

```bash
npm run build:food-dataset      # regenerates assets/food-dataset.json
npm run validate:food-dataset   # integrity + alias sanity checks
```

## License

MIT © Satvik Pandey
