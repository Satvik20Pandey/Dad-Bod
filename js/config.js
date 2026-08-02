/* Dad Bod — global configuration: app identity, storage keys, production API endpoints. */

export const APP_NAME = "Dad Bod";
export const APP_TAGLINE = "The Dad Physique OS";
export const APP_VERSION = "1.0.0";

/* ---- Storage keys (stable across versions — do not rename, user data lives here) ---- */
export const AUTH_KEY = "dadbod_auth_v1";
export const LEGACY_STATE_KEY = "transform_hq_v2";
export const SECURITY_CONFIG_KEY = "dadbod_security_config_v1";
export const API_CACHE_KEY = "dadbod_apicache_v1";
export const IDB_NAME = "dadbod_persistent_v1";

/* ---- Production nutrition + fitness APIs ---- */
export const API = {
  /* Edamam Nutrition Analysis — natural-language food parsing (per-request auth). */
  edamam: {
    base: "https://api.edamam.com/api/nutrition-data",
    detailsBase: "https://api.edamam.com/api/nutrition-details",
    appId: "77b55852",
    appKey: "3db498484f509f99fdbc4c4fd3ded762",
  },
  /* Open Food Facts — barcode product lookup (no key). */
  openFoodFacts: {
    base: "https://world.openfoodfacts.org/api/v2/product",
  },
  /* MyPlate.food — USDA calculators + recipe collection (no key, 20 req/min). */
  myplate: {
    base: "https://myplate.food/api/v1",
  },
  /* wger — open exercise database (no key for public data). */
  wger: {
    base: "https://wger.de/api/v2",
    site: "https://wger.de",
  },
  /* Overpass / OpenStreetMap — nearby gyms and parks (no key). */
  overpass: {
    endpoints: [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ],
  },
};

/* ---- App constants ---- */
export const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PLAN_DAYS_ORDER = ["Thursday", "Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];
export const MEAL_SLOTS = ["breakfast", "lunch", "snacks", "dinner"];
export const MEAL_SLOT_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

export const WATER_GLASS_ML = 250;
export const DEFAULT_WATER_TARGET_ML = 2500;

export const ONBOARDING_QUOTES = [
  "One day or day one. You decide.",
  "Consistency beats intensity when intensity is temporary.",
  "Build habits, and your body will follow.",
  "The work you do today shows up next month.",
];
