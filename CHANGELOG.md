# Changelog

All notable changes to Dad Bod.

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
