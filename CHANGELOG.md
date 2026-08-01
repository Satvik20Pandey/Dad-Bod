# Changelog

All notable changes to Dad Bod.

## [1.0.0] — 2026-08-01 · First public release

Dad Bod — The Dad Physique OS. A premium, completely free fitness companion
for building a lean, strong physique. (Internal development builds 2.0–2.2
were consolidated into this first public version; Android versionCode 9.)

### Product

- **Home — Daily Mission**: animated Dad Physique Score (protein · calories ·
  training · hydration · streak), contextual hero action (Start/Continue
  Workout), Dad Coins + streak chips, calorie + burn rings, and a bento grid
  into every feature.
- **Diet — search-first logging**: 5,277-food Indian dataset (instant,
  offline), free-text portion understanding ("200g paneer with 2 roti"),
  voice input, nutrition-label OCR, live suggestions, macro donut with an
  expandable 13-micronutrient panel, meal timeline with per-slot totals,
  weekly meal plan.
- **Scan — the hero action**: fullscreen Google-Lens-style scanner (corner
  brackets, laser sweep, haptic lock-on). Decoder chain covers every WebView:
  native BarcodeDetector → lazy-loaded ZXing → manual entry. Product chain
  never dead-ends: Open Food Facts v2 → OFF v0 → UPCItemDB name lookup →
  name-based estimation → search-by-name.
- **Train — a workout experience**: structured weekly splits with form cues,
  load/rep logging, full-screen rest timer with ±15s and haptics,
  session-complete celebrations, cardio + abs tracking, rotating Today's Tip,
  and an 800+ exercise library (wger catalog, cached for offline search).
- **Progress**: animated weight trend with goal line and delta chips,
  before/after photo compare slider, GitHub-style consistency heatmap, and a
  strength PR board with estimated 1RM; CSV export.
- **Dad Bod HQ**: account, rewards, goals with USDA cross-check, training
  setup, nearby gyms & parks (OpenStreetMap), 1,000+ USDA MyPlate Kitchen
  recipes loggable as meals, backup/restore, policies.
- **Dad Coins** — rewards for real behavior only: check-in +100, workout +250,
  protein +150, calories +120, hydration +100, weigh-in +50, photo +80,
  7-day streak +700, 30-day streak +5,000. Once per day per category; streak
  milestones once per run.

### Accounts & privacy

- **Continue with Google** (Firebase Authentication, native account sheet) —
  name, email, and profile photo; sessions persist and restore during the
  splash. **Continue Offline** is first-class: no network, no account,
  nothing uploaded, and the app works fully without Firebase.
- **Migration never loses data**: sign-in reuses a known Google account, links
  a local profile with the same email in place, or adopts a single unlinked
  profile that has data — carrying meals, workouts, weights, photos, and Dad
  Coins. Profiles are only updated or added, never deleted.
- **End-to-end encrypted cloud backup**: PBKDF2-SHA256 (210k iterations) →
  AES-GCM-256, encrypted on-device with a passphrase that is never stored or
  transmitted. Firestore holds an opaque blob nobody can decrypt — including
  the developer and Google. Restore merges and never clears local photos.
  Setup and Firestore rules: `docs/FIREBASE.md`.

### Architecture

- Zero-framework PWA (29 ES modules: core / services / ui / features) wrapped
  with Capacitor 8 for Android; token-based design system ("obsidian glass":
  aurora background, glass cards, Inter, natural radius scale, restrained
  glow, haptics, confetti).
- Production API stack, all TTL-cached with graceful offline degradation:
  on-device dataset first, Edamam NLP fallback, Open Food Facts + UPCItemDB
  barcodes, MyPlate.food USDA calculators + recipes, wger exercise catalog,
  Overpass/OpenStreetMap nearby.
- Test suites: dataset validation, meal-resolver regressions, API-mapper
  units, auth/encryption units (envelope round-trip, tampering, every
  migration branch), and a 29-check Playwright end-to-end smoke test.
- `js/firebase-config.js` is generated from `android/app/google-services.json`
  by `npm run sync:firebase` (run automatically by `build:dist`).
