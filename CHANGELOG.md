# Changelog

All notable changes to Dad Bod.

## [2.2.0] - 2026-08-01 - "Your Account, Your Keys"

Google Sign-In, and a cloud backup only you can read.

### Sign in
- **Continue with Google** - native account sheet on Android via
  `@capacitor-firebase/authentication`; name, email, and profile photo come from
  the Google account and the photo becomes your in-app avatar.
- **Continue Offline** stays first-class: no Firebase call, no network, nothing
  uploaded. The app boots and works fully even if Firebase is unreachable,
  unconfigured, or disabled.
- Sessions persist across restarts and are restored during the splash, so
  signing in costs no extra launch time. Sign-out clears both the Firebase
  session and the local active profile.
- Provider errors are translated into plain language - including error 10,
  named as an unregistered signing certificate rather than a bare number.

### Migration - nothing is lost
Signing in resolves against existing data in this order:
1. Same Google account seen before -> reuse that profile.
2. Local profile with the same email -> link it in place, data untouched.
3. One unlinked local profile that has data -> adopt it into the account,
   keeping meals, workouts, weights, photos and Dad Coins (the previous email
   is retained for traceability).
4. Otherwise -> start a clean profile.

Profiles are only ever updated or added, never deleted, so an unexpected
adoption stays recoverable through Export.

### End-to-end encrypted cloud backup
- Encrypted **on the device** with a passphrase only you know:
  PBKDF2-SHA256 (210k iterations, random salt) -> AES-GCM-256. Firestore stores
  an opaque blob; nobody - including us and Google - can decrypt it.
- The passphrase is never stored or transmitted; it lives in memory for the
  session only. A wrong passphrase fails the AES-GCM auth tag and is reported
  as such rather than returning corrupt data.
- Transport is the Firestore REST API with the Firebase ID token, so no
  Firestore SDK (and no bundler) is needed.
- Photos stay on the device when the payload would exceed Firestore's 1 MiB
  document limit - metadata is kept and the user is told.
- Restore **merges** and never clears local photos.
- Backup is inert until Firestore is enabled, degrading with an actionable
  message instead of failing silently. Setup and rules: `docs/FIREBASE.md`.

### Engineering
- `js/firebase-config.js` is generated from `android/app/google-services.json`
  by `npm run sync:firebase`, which `build:dist` runs automatically so a release
  can never ship a stale config. The generator warns when the file predates the
  SHA-1 registration.
- `rgcfaIncludeGoogle = true` in `android/variables.gradle` - without it the
  Google Sign-In libraries are `compileOnly` and the app builds but crashes at
  sign-in.
- 14 new unit tests cover the encryption envelope (round-trip, wrong passphrase,
  tampering, salt/IV uniqueness), payload shaping, and every migration branch.
  Smoke suite extended to 29 checks.
- versionCode 8.

## [2.1.0] — 2026-08-01 · "Scan, Earn, Refine"

Device-feedback round: CRED-inspired restraint, a hero scanner, and rewards
for real behavior.

### Scan is now the hero
- The center nav button is a labeled **Scan** action opening a fullscreen
  Google-Lens-style scanner: corner brackets, animated laser, haptic lock-on,
  green success state, and nutrition sliding straight into the food sheet.
- Decoder chain now covers WebViews without the Shape Detection API:
  native BarcodeDetector → lazy-loaded ZXing → manual entry.
- Barcode data chain never dead-ends: Open Food Facts v2 → OFF v0 (legacy)
  → UPCItemDB name lookup → name-based estimation → search-by-name/manual.

### Dad Coins
- Rewards for doing, not opening: check-in +100, workout +250, protein +150,
  calories +120, hydration +100, weigh-in +50, photo +80, 7-day streak +700,
  30-day streak +5,000. Once per day per category, streaks once per run.
- Coins chip on Home, full Rewards card (earn rules + ledger) in HQ.

### Fixed against live APIs (verified with real payloads)
- **Recipes were empty**: MyPlate list shape is `results[]` with `name`/
  `image_url`/`rating.value`; detail nutrition is a keyed row array and
  directions are a single string. Mappers rewritten; recipes now load,
  render, and log as meals.
- **Calorie-needs**: activity enum (`moderately-active`…) and flat
  `bmr`/`tdee` fields corrected; USDA cross-check now also shows the
  standard-cut intake. Water target reads `result.headline.value`.
- **Exercise library was dead**: wger retired `/exercise/search`. The app now
  downloads the full English catalog once (paged `/exerciseinfo`), caches it
  30 days, and searches on-device — the library also works offline.
- **Device rendering bug**: charts drawn while their screen was hidden
  measured 0×0 (oval donut on phones). Screens now re-render on activation
  and hidden canvases skip drawing.

### Design refinement (CRED × WHOOP restraint)
- Natural radius scale (28/24/20/18/16), thinner 1.5px icon strokes, glow
  reserved for CTAs/selection/rewards/completion, more whitespace.
- Home leads with a contextual hero action: **Start/Continue Today's
  Workout** → next meal → progress.
- "More" is now **Dad Bod HQ**; science paragraphs replaced by a rotating
  **Today's Tip**; splash gained particles and a slow breathing orb.

## [2.0.0] — 2026-08-01 · "The Dad Physique OS"

Complete product redesign and production re-architecture.

### Design
- New "obsidian glass" design language: aurora ambient background, glass
  cards, Inter typography, electric-cyan accent system, physics-feel
  micro-interactions, haptic feedback, and confetti celebrations.
- **Home is now the Daily Mission**: animated Dad Physique Score ring (protein,
  calories, training, hydration, streak), calorie + burn rings, and a bento
  grid (workout, water, weight sparkline, macros, activity, consistency
  heatmap, nearby, recipes).
- **Diet is search-first**: one search bar with voice, barcode, and label-scan
  built in; live suggestions from history and the dataset; a bottom-sheet food
  card with macro/micro editing; meal timeline grouped by slot with per-slot
  totals; macro donut with an expandable micronutrient panel.
- **Train is a workout experience**: session hero with muscle chips and time/
  kcal estimates, exercise cards with load/rep logging, full-screen rest timer
  with ±15s and haptics, session-complete celebration, cardio + abs panel,
  and a searchable 700+ exercise library.
- **Progress**: animated weight chart with goal line and delta chips, photo
  timeline with a before/after compare slider, GitHub-style consistency
  heatmap, and a strength PR board with estimated 1RM.
- **More is a Control Center**: profile, goals with USDA cross-check, training
  setup, weekly plan, nearby, recipes, data tools, and policies.
- Floating quick-action button: log meal, +250 ml water, weigh-in, photo, train.

### Production API architecture (AI removed)
- Removed OpenRouter/LLM integration, AI settings, and API-key prompts
  entirely. Replaced with a resilient layered stack:
  - **On-device dataset first** — 5,277-food Indian dataset, offline, instant.
  - **Edamam** natural-language nutrition parsing as online fallback.
  - **Open Food Facts** barcode lookup (camera BarcodeDetector + manual entry).
  - **MyPlate.food** USDA calculators (BMI, calorie needs, water) and 1,000+
    MyPlate Kitchen recipes, loggable as meals.
  - **wger** open exercise database with images and muscle data.
  - **Overpass/OpenStreetMap** nearby gyms, fitness centres, and parks.
- All service responses cached with TTLs; graceful offline degradation.

### New features
- Water tracking with per-weight USDA-personalized targets.
- Dad Physique Score + daily missions.
- Sex and activity-level aware BMR/TDEE (Mifflin-St Jeor).
- Photo compare slider, strength PR board, consistency heatmap.
- On-device OCR label scanning kept (Tesseract, loaded on demand) — its
  AI fallback removed.

### Engineering
- Monolithic `app.js` (5,881 lines) split into 29 ES modules:
  `js/core` (state, nutrition, resolver, metrics), `js/services` (API
  clients), `js/ui` (icons, components, charts), `js/features` (screens).
- Styles split into tokens / base / components / screens.
- Hardcoded admin passkey removed from source; owner gate is now optional
  runtime configuration.
- Meals are keyed by local date (was UTC), fixing early-morning logging.
- New test suites: service-mapper unit tests and a Playwright end-to-end
  smoke test with screenshots; dataset validation and resolver regression
  tests retained.
- Android: versionCode 6, versionName 2.0.0; location permission added for
  Nearby; vibrate permission for haptics.
- Existing user data migrates in place (same storage keys).

## [1.1.0] — 2026-06-16
- 5,274-food Indian nutrition dataset with dataset-first meal estimation.
- Stronger food search index and matching accuracy.
- Progress photo timeline improvements.

## [1.0.0] — 2026-06-13
- Initial release: calorie/macro tracking, structured workouts, weight chart,
  progress photos, PWA + Capacitor Android build.
