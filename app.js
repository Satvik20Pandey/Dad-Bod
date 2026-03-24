const LEGACY_STATE_KEY = "transform_hq_v2";
const AUTH_KEY = "dadbod_auth_v1";
const SECURITY_CONFIG_KEY = "dadbod_security_config_v1";
const LOCKED_ADMIN_EMAIL = "satvikofficial20@gmail.com";
const LOCKED_ADMIN_PASSKEY = "Satvik123";

function loadSecurityConfig() {
  const blank = {
    adminEmail: LOCKED_ADMIN_EMAIL,
    adminPasskey: LOCKED_ADMIN_PASSKEY,
    bootstrapApiKey: "",
  };

  const fromWindow =
    typeof window !== "undefined" && window.__DADBOD_SECURITY_CONFIG
      ? window.__DADBOD_SECURITY_CONFIG
      : null;

  const fromStorageRaw =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(SECURITY_CONFIG_KEY)
      : null;

  let fromStorage = null;
  if (fromStorageRaw) {
    try {
      fromStorage = JSON.parse(fromStorageRaw);
    } catch {
      fromStorage = null;
    }
  }

  const source = (fromWindow && typeof fromWindow === "object" ? fromWindow : null)
    || (fromStorage && typeof fromStorage === "object" ? fromStorage : null)
    || blank;

  return {
    // Keep admin gate fixed to owner credentials regardless of runtime config.
    adminEmail: LOCKED_ADMIN_EMAIL,
    adminPasskey: LOCKED_ADMIN_PASSKEY,
    bootstrapApiKey: String(source.bootstrapApiKey || "").trim(),
  };
}

const securityConfig = loadSecurityConfig();
const ADMIN_EMAIL = securityConfig.adminEmail;
const ADMIN_PASSWORD = securityConfig.adminPasskey;
const ADMIN_API_KEY = securityConfig.bootstrapApiKey;
const TENOR_PUBLIC_KEY = "LIVDSRZULELA";

const APP_NAME = "Dad Bod";
const APP_TAGLINE = "Built Dream Physique";
const APP_VERSION = "1.0.2";
const FAST_AI_MODEL_STEP = "stepfun-ai/step-3.5-flash";
const FAST_AI_MODEL_QWEN = "qwen/qwen3-next-80b-a3b-instruct";
const FAST_AI_MODEL_NEMOTRON = "nvidia/llama-3.1-nemotron-nano-8b-v1";
const DEFAULT_AI_MODEL = FAST_AI_MODEL_STEP;
const API_PROMPT_STORAGE_KEY = "dadbod_api_prompt_v1";

const ONBOARDING_QUOTES = [
  "One day or day one. You decide.",
  "Consistency beats intensity when intensity is temporary.",
  "Build habits, and your body will follow.",
  "The work you do today shows up next month.",
];

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const daysOrder = ["Thursday", "Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];

const adminDailyDiet = {
  breakfast: "Oats 40g + Milk 500ml + Dry Fruits Mix 10g",
  lunch: "3 egg omelette + mixed vegetables + 1 roti",
  snacks: "Protein shake + banana",
  dinner: "Besan chilla + vegetables + tofu 100g",
  notes: "Simple repeatable plan with foods you can arrange daily.",
};

function buildAdminWeeklyPlan() {
  const plan = {};
  daysOrder.forEach((day) => {
    plan[day] = {
      ...adminDailyDiet,
      notes:
        day === "Wednesday"
          ? "Recovery day. Keep same simple diet and do light mobility."
          : "Same simple meal structure for consistency.",
    };
  });
  return plan;
}

function buildBlankWeeklyPlan() {
  const plan = {};
  daysOrder.forEach((day) => {
    plan[day] = {
      breakfast: "",
      lunch: "",
      snacks: "",
      dinner: "",
      notes: "",
    };
  });
  return plan;
}

const morningActivityCatalog = {
  running: {
    label: "Running",
    met: 8.8,
    gifQuery: "running form cardio workout",
  },
  racing: {
    label: "Racing / Sprint Intervals",
    met: 11,
    gifQuery: "sprint interval running form",
  },
  swimming: {
    label: "Swimming",
    met: 8.3,
    gifQuery: "freestyle swimming technique",
  },
  walk: {
    label: "Brisk Walk",
    met: 4.3,
    gifQuery: "brisk walking exercise form",
  },
  custom: {
    label: "Custom Activity",
    met: 6.5,
    gifQuery: "home cardio workout",
  },
  none: {
    label: "None Today",
    met: 0,
    gifQuery: "",
  },
};

const absCircuit = [
  {
    name: "Reverse Crunch",
    sets: "4 x 15",
    cues: "Control hips up. Do not swing legs.",
    timerSec: 45,
  },
  {
    name: "V-Up",
    sets: "4 x 12",
    cues: "Lift chest and legs together, controlled lowering.",
    timerSec: 45,
  },
  {
    name: "Bicycle Crunch",
    sets: "4 x 24",
    cues: "Elbow to opposite knee, keep core braced.",
    timerSec: 50,
  },
  {
    name: "Mountain Climbers",
    sets: "4 x 35 sec",
    cues: "Shoulders stacked over wrists, steady pace.",
    timerSec: 35,
  },
  {
    name: "Forearm Plank",
    sets: "4 x 45 sec",
    cues: "Neutral spine and glutes tight.",
    timerSec: 45,
  },
  {
    name: "Side Plank Hip Dip",
    sets: "3 x 14 each",
    cues: "Move from obliques, keep shoulder stable.",
    timerSec: 40,
  },
  {
    name: "Dead Bug",
    sets: "3 x 14 each",
    cues: "Lower opposite arm-leg while back stays flat.",
    timerSec: 45,
  },
  {
    name: "Hollow Body Hold",
    sets: "3 x 30 sec",
    cues: "Ribs down, lower back pressed to floor.",
    timerSec: 30,
  },
];

const eveningWorkoutTemplates = [
  {
    key: "push",
    title: "Chest + Triceps",
    note: "Medium-advanced push day using common gym machines and free weights.",
    exercises: [
      { name: "Barbell Bench Press", sets: "4 x 6-8", cues: "Scapula retracted, controlled eccentric.", timerSec: 120 },
      { name: "Incline Dumbbell Press", sets: "3 x 8-10", cues: "Drive elbows down and in, full range.", timerSec: 105 },
      { name: "Seated Machine Chest Press", sets: "3 x 10-12", cues: "Pause at stretch, smooth lockout.", timerSec: 90 },
      { name: "Cable Fly", sets: "3 x 12-15", cues: "Soft elbows, squeeze chest at center.", timerSec: 75 },
      { name: "Rope Triceps Pushdown", sets: "3 x 10-12", cues: "Elbows fixed, full extension.", timerSec: 75 },
      { name: "Overhead Dumbbell Triceps Extension", sets: "3 x 10-12", cues: "Control bottom stretch and lockout.", timerSec: 90 },
    ],
  },
  {
    key: "pull",
    title: "Back + Biceps",
    note: "Thick back focus with easy-to-find machines and cable stations.",
    exercises: [
      { name: "Wide-Grip Lat Pulldown", sets: "4 x 8-10", cues: "Pull elbows to ribs, chest high.", timerSec: 105 },
      { name: "Seated Cable Row", sets: "4 x 8-10", cues: "Neutral spine, hold squeeze 1 sec.", timerSec: 105 },
      { name: "Chest-Supported Row Machine", sets: "3 x 10-12", cues: "Drive elbows behind body.", timerSec: 90 },
      { name: "Single-Arm Dumbbell Row", sets: "3 x 10 each", cues: "Pull to hip, avoid torso twist.", timerSec: 90 },
      { name: "Face Pull", sets: "3 x 12-15", cues: "Elbows high, external rotation at finish.", timerSec: 75 },
      { name: "EZ-Bar Curl", sets: "3 x 8-10", cues: "No swinging, full elbow extension.", timerSec: 75 },
      { name: "Incline Dumbbell Curl", sets: "3 x 10-12", cues: "Stretch at bottom, controlled up.", timerSec: 75 },
    ],
  },
  {
    key: "legs-shoulders",
    title: "Legs + Shoulders",
    note: "Compound lower-body work plus complete shoulder coverage.",
    exercises: [
      { name: "Leg Press", sets: "4 x 10", cues: "Full depth without lower-back rounding.", timerSec: 120 },
      { name: "Romanian Deadlift", sets: "4 x 8", cues: "Hip hinge and slow hamstring stretch.", timerSec: 120 },
      { name: "Walking Lunges", sets: "3 x 12 each", cues: "Long stride, torso upright.", timerSec: 90 },
      { name: "Seated Leg Curl", sets: "3 x 12", cues: "Pause hard at contraction.", timerSec: 75 },
      { name: "Seated Calf Raise", sets: "4 x 12-15", cues: "Full stretch and full squeeze.", timerSec: 60 },
      { name: "Seated Dumbbell Shoulder Press", sets: "4 x 8-10", cues: "Brace core, no overarch.", timerSec: 105 },
      { name: "Dumbbell Lateral Raise", sets: "3 x 12-15", cues: "Raise to shoulder level with control.", timerSec: 60 },
      { name: "Rear Delt Fly Machine", sets: "3 x 12-15", cues: "Lead with elbows, squeeze rear delts.", timerSec: 60 },
    ],
  },
];

const eveningTreadmillFinisher = {
  name: "Treadmill Walk (15 incline, 4 speed)",
  sets: "30 min",
  cues: "Steady incline walk. Keep chest up and hold rails only when needed.",
  timerSec: 1800,
  trackWeight: false,
};

const nutrientFields = [
  "protein",
  "carbs",
  "fiber",
  "sugar",
  "fat",
  "satFat",
  "polyFat",
  "monoFat",
  "transFat",
  "cholesterol",
  "sodium",
  "potassium",
  "vitaminA",
  "vitaminC",
  "calcium",
  "iron",
];

const nutrientLabels = {
  protein: "Protein",
  carbs: "Carbs",
  fiber: "Fiber",
  sugar: "Sugar",
  fat: "Fat",
  satFat: "Saturated Fat",
  polyFat: "Polyunsaturated Fat",
  monoFat: "Monounsaturated Fat",
  transFat: "Trans Fat",
  cholesterol: "Cholesterol",
  sodium: "Sodium",
  potassium: "Potassium",
  vitaminA: "Vitamin A",
  vitaminC: "Vitamin C",
  calcium: "Calcium",
  iron: "Iron",
};

const nutrientUnits = {
  protein: "g",
  carbs: "g",
  fiber: "g",
  sugar: "g",
  fat: "g",
  satFat: "g",
  polyFat: "g",
  monoFat: "g",
  transFat: "g",
  cholesterol: "mg",
  sodium: "mg",
  potassium: "mg",
  vitaminA: "mcg",
  vitaminC: "mg",
  calcium: "mg",
  iron: "mg",
};

const baseNutrientTargets = {
  fiber: 35,
  sugar: 35,
  satFat: 20,
  polyFat: 0,
  monoFat: 0,
  transFat: 0,
  cholesterol: 300,
  sodium: 2300,
  potassium: 4000,
  vitaminA: 900,
  vitaminC: 100,
  calcium: 1000,
  iron: 12,
};

const nutrientInputIds = {
  protein: "mealProtein",
  carbs: "mealCarbs",
  fiber: "mealFiber",
  sugar: "mealSugar",
  fat: "mealFat",
  satFat: "mealSaturatedFat",
  polyFat: "mealPolyunsaturatedFat",
  monoFat: "mealMonounsaturatedFat",
  transFat: "mealTransFat",
  cholesterol: "mealCholesterol",
  sodium: "mealSodium",
  potassium: "mealPotassium",
  vitaminA: "mealVitaminA",
  vitaminC: "mealVitaminC",
  calcium: "mealCalcium",
  iron: "mealIron",
};

const nutrientFieldAliases = {
  protein: ["protein"],
  carbs: ["carbs", "carbohydrates", "carbohydrate"],
  fiber: ["fiber"],
  sugar: ["sugar", "sugars"],
  fat: ["fat", "totalFat", "total_fat"],
  satFat: ["satFat", "saturatedFat", "saturated_fat", "sat_fat"],
  polyFat: ["polyFat", "polyunsaturatedFat", "polyunsaturated_fat", "poly_fat"],
  monoFat: ["monoFat", "monounsaturatedFat", "monounsaturated_fat", "mono_fat"],
  transFat: ["transFat", "trans_fat"],
  cholesterol: ["cholesterol"],
  sodium: ["sodium"],
  potassium: ["potassium"],
  vitaminA: ["vitaminA", "vitamin_a"],
  vitaminC: ["vitaminC", "vitamin_c", "vitaminCMg"],
  calcium: ["calcium", "calciumMg"],
  iron: ["iron", "ironMg"],
};

function withNutritionDefaults(values) {
  const source = values || {};
  const normalized = { kcal: Number(source.kcal || 0) };
  nutrientFields.forEach((field) => {
    normalized[field] = Number(source[field] || 0);
  });
  return normalized;
}

function zeroNutritionTotals() {
  return withNutritionDefaults({});
}

function calculateDynamicNutrientTargets(profile) {
  const calorieTarget = Math.max(
    1200,
    Number(profile?.calorieTarget || profile?.recommendedCalories || 2000)
  );
  const currentWeight = Math.max(30, Number(profile?.currentWeight || 70));
  const goalWeight = Math.max(30, Number(profile?.goalWeight || currentWeight));
  const goalMode =
    goalWeight > currentWeight ? "gain" : goalWeight < currentWeight ? "loss" : "maintain";

  const fatTarget = Math.max(35, Number(profile?.macros?.fatG || 0));
  const kcalScale = Math.min(1.35, Math.max(0.82, calorieTarget / 2200));

  return {
    ...baseNutrientTargets,
    fiber: Math.max(25, Math.round((calorieTarget / 1000) * 14)),
    sugar: Math.max(20, Math.round((calorieTarget * (goalMode === "loss" ? 0.08 : 0.1)) / 4)),
    satFat: Math.max(10, Math.round((calorieTarget * 0.1) / 9)),
    polyFat: Math.max(8, Math.round(fatTarget * 0.25)),
    monoFat: Math.max(12, Math.round(fatTarget * 0.4)),
    transFat: 0,
    cholesterol: goalMode === "loss" ? 250 : goalMode === "gain" ? 330 : 300,
    sodium: Math.round(Math.max(1800, Math.min(2800, 1800 + currentWeight * 6))),
    potassium: Math.round(Math.max(3000, Math.min(5000, currentWeight * 45))),
    vitaminA: Math.round(Math.max(700, Math.min(1300, 900 * kcalScale))),
    vitaminC: Math.round(Math.max(75, Math.min(180, 90 * kcalScale + (goalMode === "loss" ? 10 : 0)))),
    calcium: goalMode === "gain" ? 1100 : 1000,
    iron: Math.round(Math.max(10, Math.min(18, 11 + (goalWeight - currentWeight) * 0.05))),
  };
}

function getNutrientTarget(field) {
  if (!state || !state.profile) return baseNutrientTargets[field] ?? null;
  const dynamicTargets = state.profile.nutrientTargets || calculateDynamicNutrientTargets(state.profile);
  if (field === "protein") return Number(state.profile.macros?.proteinG || 0);
  if (field === "carbs") return Number(state.profile.macros?.carbsG || 0);
  if (field === "fat") return Number(state.profile.macros?.fatG || 0);
  return Number(dynamicTargets[field] ?? baseNutrientTargets[field] ?? 0);
}

function readNutrientValue(source, field) {
  const aliases = nutrientFieldAliases[field] || [field];
  for (const key of aliases) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function normalizeNutrition(source) {
  const normalized = { kcal: Number(source?.kcal || source?.calories || 0) };
  nutrientFields.forEach((field) => {
    normalized[field] = readNutrientValue(source, field);
  });
  return normalized;
}

function formatNutrientValue(field, value) {
  const unit = nutrientUnits[field] || "";
  const digits = unit === "g" ? 1 : 0;
  return `${formatNum(Number(value || 0), digits)}${unit}`;
}

const builtInFoodDb = {
  tofu: { kcal: 144, protein: 17.3, carbs: 2.8, fiber: 1.2, sugar: 0.6, fat: 8.7, satFat: 1.3, polyFat: 4.9, monoFat: 1.9, transFat: 0, cholesterol: 0, sodium: 14, potassium: 237, vitaminA: 0, vitaminC: 0, calcium: 350, iron: 3.4 },
  bread: { kcal: 265, protein: 9, carbs: 49, fiber: 2.7, sugar: 5, fat: 3.2, satFat: 0.7, polyFat: 1.4, monoFat: 0.8, transFat: 0.05, cholesterol: 0, sodium: 491, potassium: 115, vitaminA: 0, vitaminC: 0, calcium: 107, iron: 3.6 },
  egg: { kcal: 143, protein: 13, carbs: 0.7, fiber: 0, sugar: 0.4, fat: 9.5, satFat: 3.1, polyFat: 1.9, monoFat: 3.6, transFat: 0, cholesterol: 372, sodium: 140, potassium: 126, vitaminA: 160, vitaminC: 0, calcium: 56, iron: 1.8 },
  "egg curry": { kcal: 171, protein: 11.5, carbs: 5.7, fiber: 1.1, sugar: 2.1, fat: 11.2, satFat: 3.3, polyFat: 2.2, monoFat: 4.1, transFat: 0, cholesterol: 230, sodium: 330, potassium: 210, vitaminA: 120, vitaminC: 3.5, calcium: 52, iron: 2.1 },
  dal: { kcal: 116, protein: 9, carbs: 20, fiber: 8, sugar: 1.8, fat: 0.4, satFat: 0.1, polyFat: 0.2, monoFat: 0.1, transFat: 0, cholesterol: 0, sodium: 2, potassium: 369, vitaminA: 8, vitaminC: 1.5, calcium: 19, iron: 3.3 },
  rice: { kcal: 130, protein: 2.7, carbs: 28, fiber: 0.4, sugar: 0.1, fat: 0.3, satFat: 0.1, polyFat: 0.1, monoFat: 0.1, transFat: 0, cholesterol: 0, sodium: 1, potassium: 35, vitaminA: 0, vitaminC: 0, calcium: 10, iron: 1.2 },
  banana: { kcal: 89, protein: 1.1, carbs: 23, fiber: 2.6, sugar: 12.2, fat: 0.3, satFat: 0.1, polyFat: 0.07, monoFat: 0.03, transFat: 0, cholesterol: 0, sodium: 1, potassium: 358, vitaminA: 3, vitaminC: 8.7, calcium: 5, iron: 0.3 },
  milk: { kcal: 61, protein: 3.2, carbs: 5, fiber: 0, sugar: 5, fat: 3.3, satFat: 1.9, polyFat: 0.2, monoFat: 0.8, transFat: 0.1, cholesterol: 10, sodium: 43, potassium: 150, vitaminA: 46, vitaminC: 0, calcium: 113, iron: 0.03 },
  oats: { kcal: 389, protein: 17, carbs: 66, fiber: 10.6, sugar: 1, fat: 7, satFat: 1.2, polyFat: 2.5, monoFat: 2.2, transFat: 0, cholesterol: 0, sodium: 2, potassium: 429, vitaminA: 0, vitaminC: 0, calcium: 54, iron: 4.7 },
  dryfruits: { kcal: 520, protein: 10, carbs: 45, fiber: 7, sugar: 30, fat: 34, satFat: 3.6, polyFat: 10.2, monoFat: 16.7, transFat: 0, cholesterol: 0, sodium: 10, potassium: 540, vitaminA: 2, vitaminC: 1.2, calcium: 85, iron: 2.6 },
  roti: { kcal: 297, protein: 11, carbs: 58, fiber: 9.6, sugar: 2.8, fat: 3.6, satFat: 0.7, polyFat: 1.3, monoFat: 0.8, transFat: 0, cholesterol: 0, sodium: 12, potassium: 405, vitaminA: 0, vitaminC: 0, calcium: 29, iron: 3.9 },
  besan: { kcal: 387, protein: 22, carbs: 58, fiber: 10.8, sugar: 10.8, fat: 7, satFat: 0.7, polyFat: 2.9, monoFat: 1.6, transFat: 0, cholesterol: 0, sodium: 64, potassium: 846, vitaminA: 0, vitaminC: 0, calcium: 45, iron: 4.9 },
  paneer: { kcal: 265, protein: 18.3, carbs: 1.2, fiber: 0, sugar: 0.5, fat: 20.8, satFat: 13, polyFat: 0.6, monoFat: 4.5, transFat: 0.8, cholesterol: 56, sodium: 22, potassium: 104, vitaminA: 210, vitaminC: 0, calcium: 208, iron: 0.7 },
  chicken: { kcal: 239, protein: 27, carbs: 0, fiber: 0, sugar: 0, fat: 14, satFat: 3.8, polyFat: 3.2, monoFat: 6.4, transFat: 0.1, cholesterol: 88, sodium: 82, potassium: 223, vitaminA: 13, vitaminC: 0, calcium: 15, iron: 1.3 },
  potato: { kcal: 87, protein: 1.9, carbs: 20.1, fiber: 1.8, sugar: 0.9, fat: 0.1, satFat: 0, polyFat: 0.1, monoFat: 0, transFat: 0, cholesterol: 0, sodium: 6, potassium: 379, vitaminA: 0, vitaminC: 13, calcium: 5, iron: 0.8 },
  curd: { kcal: 63, protein: 3.5, carbs: 4.7, fiber: 0, sugar: 4.7, fat: 3.3, satFat: 2.1, polyFat: 0.1, monoFat: 0.9, transFat: 0.1, cholesterol: 13, sodium: 46, potassium: 141, vitaminA: 27, vitaminC: 0, calcium: 121, iron: 0.1 },
  oil: { kcal: 884, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 100, satFat: 14, polyFat: 34, monoFat: 43, transFat: 0.5, cholesterol: 0, sodium: 0, potassium: 0, vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0 },
};

let externalFoodDb = {};
let foodDatasetEntries = [];
let foodDatasetLoaded = false;
let foodDatasetLoadPromise = null;

const genericFoodTokens = new Set([
  "oil",
  "ghee",
  "butter",
  "sauce",
  "masala",
  "gravy",
  "pickle",
  "spice",
  "salt",
  "sugar",
]);

const adminDefaultState = {
  profile: {
    currentWeight: 82,
    goalWeight: 71,
    age: 22,
    heightCm: 180.3,
    adminPlanVersion: 2,
    weeklyLoss: 1,
    goalMode: "loss",
    gymClosedDay: "Wednesday",
    trainingStartDay: "Thursday",
    calorieTarget: 1800,
    recommendedCalories: 1800,
    manualCalorieTarget: 0,
    maintenanceCalories: 2460,
    deficitCalories: 1800,
    surplusCalories: 0,
    macros: {
      proteinG: 149,
      fatG: 57,
      carbsG: 189,
    },
  },
  settings: {
    apiKey: ADMIN_API_KEY || "",
    aiModel: DEFAULT_AI_MODEL,
  },
  mealsByDate: {},
  foodLibrary: {},
  foodHistory: [],
  weeklyPlan: buildAdminWeeklyPlan(),
  gymLogsByDate: {},
  weightEntries: [],
  photoEntries: [],
  editingMealId: null,
  editingPhotoId: null,
};

const genericDefaultState = {
  profile: {
    currentWeight: 75,
    goalWeight: 68,
    age: 24,
    heightCm: 170,
    weeklyLoss: 0.5,
    goalMode: "loss",
    gymClosedDay: "Sunday",
    trainingStartDay: "Monday",
    calorieTarget: 1900,
    recommendedCalories: 1900,
    manualCalorieTarget: 0,
    maintenanceCalories: 2250,
    deficitCalories: 1900,
    surplusCalories: 0,
    macros: {
      proteinG: 136,
      fatG: 54,
      carbsG: 197,
    },
  },
  settings: {
    apiKey: "",
    aiModel: DEFAULT_AI_MODEL,
  },
  mealsByDate: {},
  foodLibrary: {},
  foodHistory: [],
  weeklyPlan: buildBlankWeeklyPlan(),
  gymLogsByDate: {},
  weightEntries: [],
  photoEntries: [],
  editingMealId: null,
  editingPhotoId: null,
};

let authStore = loadAuthStore();
let currentUser = null;
let state = null;
let appEventsBound = false;
let onboardingEventsBound = false;
const gifCache = {};
let activeSpeechRecognition = null;
let activeWorkoutTimer = null;
let workoutTimerInterval = null;
let lastWorkoutTimerPreset = null;
let mealSuggestionResults = [];
let mealSuggestionActiveIndex = -1;

const exerciseGifQueryOverrides = {
  "mountain climbers": "mountain climber abs core plank exercise form",
  "v up": "v up abs exercise form",
  "dead bug": "dead bug core stability exercise form",
  "hollow body hold": "hollow body hold gymnastics core exercise form",
  "march in place": "march in place cardio exercise indoor",
  "high knees march": "high knees march in place exercise form",
};

const exerciseGifBlockedKeywords = ["mountain", "cliff", "hiking", "everest", "snow", "rock climbing", "alpinism"];

function clone(data) {
  if (typeof structuredClone === "function") return structuredClone(data);
  return JSON.parse(JSON.stringify(data));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function select(id) {
  return document.getElementById(id);
}

function setText(id, txt) {
  const el = select(id);
  if (el) el.textContent = txt;
}

function formatNum(v, digits = 1) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentDayName() {
  return new Date().toLocaleDateString(undefined, { weekday: "long" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseOptionalNumber(inputId) {
  const v = select(inputId)?.value;
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeFoodKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeFoodText(value) {
  const stopWords = new Set([
    "with",
    "without",
    "and",
    "plus",
    "for",
    "the",
    "in",
    "of",
    "a",
    "an",
    "ml",
    "gram",
    "grams",
    "g",
    "restaurant",
    "homemade",
  ]);

  return normalizeFoodKey(value)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function mapFoodPayloadToNutrition(item) {
  return withNutritionDefaults({
    kcal: Number(item?.kcal || 0),
    protein: Number(item?.protein || 0),
    carbs: Number(item?.carbs || 0),
    fiber: Number(item?.fiber || 0),
    sugar: Number(item?.sugar || 0),
    fat: Number(item?.fat || 0),
    satFat: Number(item?.satFat || 0),
    polyFat: Number(item?.polyFat || 0),
    monoFat: Number(item?.monoFat || 0),
    transFat: Number(item?.transFat || 0),
    cholesterol: Number(item?.cholesterol || 0),
    sodium: Number(item?.sodium || 0),
    potassium: Number(item?.potassium || 0),
    vitaminA: Number(item?.vitaminA || 0),
    vitaminC: Number(item?.vitaminC || 0),
    calcium: Number(item?.calcium || 0),
    iron: Number(item?.iron || 0),
  });
}

async function loadFoodDatasetIfNeeded() {
  if (foodDatasetLoaded) return;
  if (foodDatasetLoadPromise) {
    await foodDatasetLoadPromise;
    return;
  }

  foodDatasetLoadPromise = (async () => {
    try {
      const response = await fetch("./assets/food-dataset.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`dataset http ${response.status}`);

      const payload = await response.json();
      const foods = Array.isArray(payload?.foods) ? payload.foods : [];
      if (!foods.length) {
        throw new Error("dataset has no foods");
      }

      const index = {};
      const entries = [];

      foods.forEach((food) => {
        const nutrition = mapFoodPayloadToNutrition(food);
        const aliases = [food?.name, food?.key, ...(Array.isArray(food?.aliases) ? food.aliases : [])]
          .map((alias) => normalizeFoodKey(alias))
          .filter(Boolean);

        if (!aliases.length) return;

        aliases.forEach((alias) => {
          if (!index[alias]) index[alias] = nutrition;
        });

        entries.push({
          name: String(food?.name || food?.key || aliases[0]),
          key: aliases[0],
          nutrition,
        });
      });

      externalFoodDb = index;
      foodDatasetEntries = entries;
      foodDatasetLoaded = true;
    } catch (error) {
      console.warn("Food dataset load failed, using built-in DB only.", error);
      externalFoodDb = {};
      foodDatasetEntries = [];
      foodDatasetLoaded = false;
    } finally {
      foodDatasetLoadPromise = null;
    }
  })();

  await foodDatasetLoadPromise;
}

function getMergedFoodDb() {
  const merged = {};
  const addSource = (source) => {
    Object.entries(source || {}).forEach(([rawKey, values]) => {
      const key = normalizeFoodKey(rawKey);
      if (!key) return;
      merged[key] = withNutritionDefaults(values);
    });
  };

  addSource(builtInFoodDb);
  addSource(externalFoodDb);
  addSource(state?.foodLibrary || {});

  return merged;
}

function scoreFoodKeyMatch(normalizedText, textTokens, dbKey) {
  if (!normalizedText || !dbKey) return 0;
  if (normalizedText === dbKey) return 100;

  const dbTokens = dbKey.split(" ").filter(Boolean);
  const overlapTokens = dbTokens.filter((token) => textTokens.includes(token));
  const overlap = overlapTokens.length;

  let score = 0;

  if (normalizedText.includes(dbKey)) score += 60;
  if (dbKey.includes(normalizedText)) score += 30;

  score += overlap * 9;

  if (dbTokens.length > 1 && overlap === dbTokens.length) score += 18;

  // Avoid overfitting a single generic ingredient token to a full dish string.
  if (dbTokens.length === 1 && textTokens.length >= 2) {
    const token = dbTokens[0];
    if (genericFoodTokens.has(token)) {
      score -= 22;
    }

    if (!textTokens.includes(token)) {
      score -= 30;
    }
  }

  if (dbTokens.length >= 2) {
    const overlapRatio = overlap / dbTokens.length;
    if (overlapRatio >= 0.6) score += 16;
    if (overlapRatio < 0.35 && !normalizedText.includes(dbKey)) score -= 14;
  }

  return score;
}

function findTopFoodMatches(text, db, limit = 8) {
  const normalizedText = normalizeFoodKey(text);
  if (!normalizedText) return [];

  const tokens = tokenizeFoodText(normalizedText);
  const ranked = Object.keys(db || {})
    .map((key) => ({
      key,
      score: scoreFoodKeyMatch(normalizedText, tokens, key),
      nutrition: db[key],
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, Math.max(1, limit));
}

function buildFoodReferenceSnippet(description, qty, db) {
  const refs = findTopFoodMatches(description, db, 8);
  if (!refs.length) return "No close food references found in the dataset.";

  return refs
    .map((item, idx) => {
      const n = withNutritionDefaults(item.nutrition);
      return `${idx + 1}. ${item.key} (per 100g): kcal ${formatNum(n.kcal, 0)}, protein ${formatNum(n.protein, 1)}g, carbs ${formatNum(n.carbs, 1)}g, fat ${formatNum(n.fat, 1)}g, fiber ${formatNum(n.fiber, 1)}g`;
    })
    .join("\n");
}

function loadAuthStore() {
  const raw = localStorage.getItem(AUTH_KEY);
  let parsed = { users: [], userStates: {}, activeUserId: null, userDirectory: [] };
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { users: [], userStates: {}, activeUserId: null, userDirectory: [] };
    }
  }

  if (!Array.isArray(parsed.users)) parsed.users = [];
  if (!parsed.userStates || typeof parsed.userStates !== "object") parsed.userStates = {};
  if (!Array.isArray(parsed.userDirectory)) parsed.userDirectory = [];

  return ensureAdminUser(parsed);
}

function saveAuthStore() {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authStore));
}

function ensureAdminUser(store) {
  if (ADMIN_EMAIL) {
    let admin = store.users.find((u) => normalizeEmail(u?.email) === ADMIN_EMAIL);

    if (!admin) {
      admin = {
        id: uid("user"),
        name: "Satvik",
        email: ADMIN_EMAIL,
        provider: "email-profile",
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };
      store.users.push(admin);
    }

    admin.email = ADMIN_EMAIL;
    admin.isAdmin = true;
    admin.provider = "email-profile";
    admin.name = admin.name || "Satvik";

    if (!store.userStates[admin.id]) {
      let adminState = clone(adminDefaultState);
      const legacyRaw = localStorage.getItem(LEGACY_STATE_KEY);
      if (legacyRaw) {
        try {
          adminState = mergeState(adminState, JSON.parse(legacyRaw));
        } catch {}
      }
      store.userStates[admin.id] = adminState;
    }
  }

  if (store.activeUserId && !store.users.some((u) => u.id === store.activeUserId)) {
    store.activeUserId = null;
  }

  return store;
}

function mergeState(baseState, savedState) {
  const merged = {
    ...clone(baseState),
    ...(savedState || {}),
    profile: {
      ...clone(baseState.profile),
      ...(savedState?.profile || {}),
      macros: {
        ...clone(baseState.profile.macros),
        ...(savedState?.profile?.macros || {}),
      },
    },
    settings: {
      ...clone(baseState.settings),
      ...(savedState?.settings || {}),
    },
    mealsByDate: {
      ...(savedState?.mealsByDate || {}),
    },
    foodLibrary: {
      ...(savedState?.foodLibrary || {}),
    },
    foodHistory: Array.isArray(savedState?.foodHistory) ? savedState.foodHistory : [],
    gymLogsByDate: {
      ...(savedState?.gymLogsByDate || {}),
    },
    weightEntries: Array.isArray(savedState?.weightEntries) ? savedState.weightEntries : [],
    photoEntries: Array.isArray(savedState?.photoEntries) ? savedState.photoEntries : [],
    weeklyPlan: savedState?.weeklyPlan ? savedState.weeklyPlan : clone(baseState.weeklyPlan),
  };

  return merged;
}

function ensureFoodHistory() {
  if (!Array.isArray(state.foodHistory)) state.foodHistory = [];
  return state.foodHistory;
}

function normalizeMealPhrase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function loadApiPromptTracker() {
  const raw = localStorage.getItem(API_PROMPT_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveApiPromptTracker(data) {
  localStorage.setItem(API_PROMPT_STORAGE_KEY, JSON.stringify(data || {}));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isConfiguredAdminEmail(email) {
  if (!ADMIN_EMAIL) return false;
  return normalizeEmail(email) === ADMIN_EMAIL;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function isValidGmail(email) {
  const normalized = normalizeEmail(email);
  return isValidEmail(normalized) && normalized.endsWith("@gmail.com");
}

function deriveNameFromEmail(email) {
  return normalizeEmail(email)
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Member";
}

function findUserByEmail(email) {
  const lookup = normalizeEmail(email);
  return authStore.users.find((u) => (u.email || "").toLowerCase() === lookup) || null;
}

function createUser({ name, email, provider }) {
  const normalizedEmail = normalizeEmail(email);
  const user = {
    id: uid("user"),
    name: name?.trim() || "Member",
    email: normalizedEmail,
    password: "",
    provider: provider || "email-profile",
    isAdmin: isConfiguredAdminEmail(normalizedEmail),
    createdAt: new Date().toISOString(),
  };

  authStore.users.push(user);

  const baseState = user.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
  authStore.userStates[user.id] = baseState;
  saveAuthStore();

  return user;
}

function upsertUserProfile(name, email) {
  const normalizedEmail = normalizeEmail(email);
  let user = findUserByEmail(normalizedEmail);

  if (!user) {
    return createUser({ name, email: normalizedEmail, provider: "email-profile" });
  }

  user.name = name?.trim() || user.name || deriveNameFromEmail(normalizedEmail);
  user.provider = "email-profile";
  if (!user.isAdmin) {
    user.isAdmin = isConfiguredAdminEmail(normalizedEmail);
  }
  user.email = normalizedEmail;
  saveAuthStore();
  return user;
}

function recordUserDirectoryEntry(user) {
  if (!user) return;
  if (!Array.isArray(authStore.userDirectory)) authStore.userDirectory = [];

  const normalizedEmail = normalizeEmail(user.email);
  const now = new Date().toISOString();
  const existing = authStore.userDirectory.find(
    (entry) => normalizeEmail(entry.email) === normalizedEmail
  );

  if (existing) {
    existing.name = user.name || existing.name;
    existing.lastSeenAt = now;
    existing.userId = user.id;
    existing.isAdmin = Boolean(user.isAdmin);
  } else {
    authStore.userDirectory.push({
      id: uid("directory"),
      userId: user.id,
      name: user.name || deriveNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      isAdmin: Boolean(user.isAdmin),
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  saveAuthStore();
}

function exportUserDirectoryCsv() {
  if (!currentUser?.isAdmin) {
    showToast("Only admin can export user sheet.", "error");
    return;
  }

  const rows = Array.isArray(authStore.userDirectory) ? authStore.userDirectory : [];
  if (!rows.length) {
    showToast("No user entries available yet.", "error");
    return;
  }

  const toCsvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = ["Name", "Email", "Admin", "First Seen", "Last Seen"];

  const lines = [header.map(toCsvCell).join(",")];
  rows.forEach((entry) => {
    lines.push(
      [
        entry.name,
        entry.email,
        entry.isAdmin ? "Yes" : "No",
        entry.firstSeenAt,
        entry.lastSeenAt,
      ]
        .map(toCsvCell)
        .join(",")
    );
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dad-bod-users-${todayDate()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Users sheet exported.", "success");
}

function getDefaultWeeklyPlan() {
  return currentUser?.isAdmin ? clone(buildAdminWeeklyPlan()) : clone(buildBlankWeeklyPlan());
}

function loadStateForUser(user) {
  const base = user.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
  const saved = authStore.userStates[user.id];
  const merged = mergeState(base, saved || {});

  if (!merged.weeklyPlan) merged.weeklyPlan = getDefaultWeeklyPlan();

  return merged;
}

function saveState() {
  if (!currentUser || !state) return;
  authStore.userStates[currentUser.id] = state;
  saveAuthStore();

  if (currentUser.isAdmin) {
    localStorage.setItem(LEGACY_STATE_KEY, JSON.stringify(state));
  }
}

function setOnboardingQuote() {
  const idx = Math.floor(Math.random() * ONBOARDING_QUOTES.length);
  const quote = ONBOARDING_QUOTES[idx];
  setText("welcomeQuote", `"${quote}"`);
}

function prefillOnboardingForm(user = null) {
  const candidate = user || authStore.users.find((u) => u.id === authStore.activeUserId) || null;
  if (!candidate) return;

  if (select("welcomeName")) select("welcomeName").value = candidate.name || "";
  if (select("welcomeEmail")) select("welcomeEmail").value = candidate.email || "";
}

function showAuthShell(prefillUser = null) {
  select("authShell")?.classList.remove("hidden");
  select("appShell")?.classList.add("hidden");
  select("welcomeForm")?.reset();
  setOnboardingQuote();
  prefillOnboardingForm(prefillUser);
}

function showAppShell() {
  select("authShell")?.classList.add("hidden");
  select("appShell")?.classList.remove("hidden");
}

/* ---- Toast Notification ---- */
function showToast(msg, type = "") {
  const t = select("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show" + (type ? " " + type : "");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = "toast"; }, 2600);
}

/* ---- Splash Screen ---- */
function hideSplash() {
  const s = select("splashScreen");
  if (!s) return;
  s.classList.add("fade-out");
  setTimeout(() => s.remove(), 600);
}

/* ---- Streak Calculation ---- */
function calculateStreak() {
  if (!state) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const meals = state.mealsByDate[key];
    if (meals && meals.length > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function renderStreak() {
  const streak = calculateStreak();
  const el = select("streakCount");
  if (el) el.textContent = streak + " Day Streak";
}

/* ---- Calorie Ring ---- */
function renderCalorieRing() {
  const totals = dailyTotals();
  const burn = calculateDailyBurn();
  const target = Number(state.profile.calorieTarget || 2000);
  const eaten = totals.kcal;
  const remaining = Math.max(0, target - eaten);
  const rawPct = target > 0 ? eaten / target : 0;
  const pct = Math.min(1, rawPct);
  const burnTarget = Math.max(1200, Number(state.profile.maintenanceCalories || 2200));
  const rawBurnPct = burnTarget > 0 ? burn.total / burnTarget : 0;
  const burnPct = Math.min(1, rawBurnPct);
  const circumference = 2 * Math.PI * 78; // ~490
  const offset = circumference * (1 - pct);
  const burnOffset = circumference * (1 - burnPct);

  const ring = select("calorieRing");
  if (ring) {
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;

    const ringWrapper = ring.closest(".calorie-ring-wrapper");
    if (ringWrapper) {
      const prevPct = Number(ringWrapper.dataset.pct || 0);
      ringWrapper.style.setProperty("--ring-progress", String(pct));
      ringWrapper.classList.toggle("ring-over", rawPct > 1);
      if (Math.abs(prevPct - rawPct) >= 0.01) {
        ringWrapper.classList.remove("ring-pop");
        // Force reflow to replay the pop animation only when progress changes.
        void ringWrapper.offsetWidth;
        ringWrapper.classList.add("ring-pop");
      }
      ringWrapper.dataset.pct = String(rawPct);
    }
  }

  const burnRing = select("burnRing");
  if (burnRing) {
    burnRing.style.strokeDasharray = circumference;
    burnRing.style.strokeDashoffset = burnOffset;

    const burnWrapper = burnRing.closest(".calorie-ring-wrapper");
    if (burnWrapper) {
      burnWrapper.style.setProperty("--ring-progress", String(burnPct));
    }
  }

  const val = select("calorieRingValue");
  if (val) val.textContent = formatNum(remaining, 0);

  const burnVal = select("burnRingValue");
  if (burnVal) burnVal.textContent = formatNum(burn.total, 0);

  const burnSub = select("burnRingSub");
  if (burnSub) burnSub.textContent = `${formatNum(burn.total, 0)} / ${formatNum(burnTarget, 0)} kcal`;

  const pp = select("pillProtein");
  const pc = select("pillCarbs");
  const pf = select("pillFat");
  if (pp) pp.textContent = formatNum(totals.protein, 0) + "g";
  if (pc) pc.textContent = formatNum(totals.carbs, 0) + "g";
  if (pf) pf.textContent = formatNum(totals.fat, 0) + "g";
}

/* ---- Policy Modals ---- */
function openPolicyModal(title, bodyHtml) {
  setText("policyModalTitle", title);
  const body = select("policyModalBody");
  if (body) body.innerHTML = bodyHtml;
  const m = select("policyModal");
  if (m) { m.classList.remove("hidden"); m.setAttribute("aria-hidden", "false"); }
  document.body.classList.add("modal-open");
}

function closePolicyModal() {
  const m = select("policyModal");
  if (m) { m.classList.add("hidden"); m.setAttribute("aria-hidden", "true"); }
  document.body.classList.remove("modal-open");
}

function openAbout() {
  openPolicyModal("About Dad Bod", `<div class="policy-content"><p><strong>Dad Bod — Built Dream Physique</strong></p><p>Version ${APP_VERSION}</p><p>Dad Bod is your free, all-in-one fitness companion. Track calories, macros, full nutrients, workouts, weight, and progress photos — all without any subscription or premium wall.</p><p><strong>Key Features:</strong></p><ul><li>Complete calorie and macro tracking</li><li>Full nutrient tracking: Protein, Carbs, Fiber, Sugar, Fat, Saturated Fat, Polyunsaturated Fat, Monounsaturated Fat, Trans Fat, Cholesterol, Sodium, Potassium, Vitamin A, Vitamin C, Calcium, Iron</li><li>AI-powered meal estimation from food descriptions</li><li>Camera nutrition label scanning</li><li>Voice input for meal logging</li><li>Structured weekly workout plans</li><li>Weight trend tracking with charts</li><li>Progress photo timeline</li><li>Weekly meal planner</li></ul><p><strong>Developer:</strong> Satvik Pandey</p><p>© 2024-2026 Dad Bod. All rights reserved.</p></div>`);
}

function openHelp() {
  openPolicyModal("Help & Support", `<div class="policy-content"><p>Need help? We're here for you.</p><h3>Contact Us</h3><p>Email: <a href="mailto:satvikofficial20@gmail.com">satvikofficial20@gmail.com</a></p><h3>FAQ</h3><p><strong>Q: Is Dad Bod really free?</strong><br/>A: Yes! All core features including calorie tracking, workouts, and progress tracking are completely free.</p><p><strong>Q: Do I need an API key?</strong><br/>A: No. API key is only needed for optional AI features like smart meal estimation and photo analysis. All manual tracking works without it.</p><p><strong>Q: Where is my data stored?</strong><br/>A: All data is stored locally on your device. We don't collect or send your personal data to any server.</p><p><strong>Q: How do I export my data?</strong><br/>A: Go to More → Data → Export to download your data as a JSON file.</p></div>`);
}

function openPrivacyPolicy() {
  openPolicyModal("Privacy Policy", `<div class="policy-content"><p><em>Last updated: March 2026</em></p><h3>Data Collection</h3><p>Dad Bod does not collect, store, or transmit any personal information to external servers. All user data including meal logs, workout records, weight entries, and photos are stored locally on your device using browser local storage.</p><h3>Third-Party Services</h3><p>If you choose to use AI features, your meal descriptions may be sent to OpenRouter API using your own API key. No personal identifiers are included.</p><p>Exercise GIFs are fetched from Tenor API. No user data is shared with Tenor.</p><h3>Cookies</h3><p>Dad Bod does not use cookies or any tracking technologies.</p><h3>Data Deletion</h3><p>You can delete all your data at any time by clearing your browser data or using the Clear Today / Export features in the app.</p><h3>Contact</h3><p>For privacy concerns: <a href="mailto:satvikofficial20@gmail.com">satvikofficial20@gmail.com</a></p></div>`);
}

function openTerms() {
  openPolicyModal("Terms of Service", `<div class="policy-content"><p><em>Last updated: March 2026</em></p><h3>Acceptance</h3><p>By using Dad Bod, you agree to these terms. If you disagree, please do not use the app.</p><h3>Use License</h3><p>Dad Bod grants you a free, non-exclusive, non-transferable license to use the application for personal fitness tracking.</p><h3>Disclaimer</h3><p>Dad Bod is not a medical application. Nutritional estimates are approximate. Always consult a healthcare professional before starting any diet or exercise program.</p><h3>Limitation of Liability</h3><p>Dad Bod is provided "as is" without warranties. We are not liable for any health outcomes or data loss.</p><h3>Changes</h3><p>We may update these terms. Continued use constitutes acceptance of changes.</p><h3>Contact</h3><p>Questions: <a href="mailto:satvikofficial20@gmail.com">satvikofficial20@gmail.com</a></p></div>`);
}

function updateBranding() {
  setText("brandTitle", APP_NAME);
  setText("brandTagline", APP_TAGLINE);
  setText("dateTimeText", new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" }));
  const badgeText = currentUser
    ? `${currentUser.name}${currentUser.isAdmin ? " (Admin)" : ""}`
    : "Guest";
  setText("userBadge", badgeText);
  setText("userEmailLine", currentUser?.email || "guest@profile");

  const userSheetBtn = select("userSheetExportBtn");
  if (userSheetBtn) {
    userSheetBtn.classList.toggle("hidden", !currentUser?.isAdmin);
  }
}

function activateUser(user) {
  currentUser = user;
  authStore.activeUserId = user.id;
  saveAuthStore();
  recordUserDirectoryEntry(user);

  state = loadStateForUser(user);

  if (user.isAdmin) {
    const version = Number(state.profile.adminPlanVersion || 0);
    if (version < 2) {
      state.weeklyPlan = buildAdminWeeklyPlan();
      state.profile.adminPlanVersion = 2;
    }
    state.profile.gymClosedDay = "Wednesday";
    state.profile.trainingStartDay = "Thursday";
    if (!state.settings.apiKey && ADMIN_API_KEY) {
      state.settings.apiKey = ADMIN_API_KEY;
    }
  }

  calculateTargetsFromProfile();
  saveState();

  showAppShell();
  updateBranding();
  showTab("home");
  renderAll();
  showDailyApiPromptIfNeeded();
}

function logoutCurrentUser() {
  closeExerciseModal();
  closeApiPromptModal(false);
  currentUser = null;
  state = null;
  authStore.activeUserId = null;
  saveAuthStore();
  showAuthShell();
}

function handleWelcomeSubmit(e) {
  e.preventDefault();

  const name = String(select("welcomeName")?.value || "").trim();
  const email = normalizeEmail(select("welcomeEmail")?.value);

  if (!name || !email) {
    showToast("Please enter your name and Gmail ID.", "error");
    return;
  }

  if (!isValidGmail(email)) {
    showToast("Please enter a valid Gmail address.", "error");
    return;
  }

  if (isConfiguredAdminEmail(email) && ADMIN_PASSWORD) {
    const passkey = prompt("Admin passkey required for this Gmail ID:");
    if ((passkey || "") !== ADMIN_PASSWORD) {
      showToast("Incorrect admin passkey.", "error");
      return;
    }
  }

  const user = upsertUserProfile(name, email);
  activateUser(user);
  showToast("Welcome, " + user.name + "!", "success");
}

function calculateTargetsFromProfile() {
  if (!state) return;

  const currentWeight = Math.max(30, Number(state.profile.currentWeight || 70));
  const goalWeight = Math.max(30, Number(state.profile.goalWeight || currentWeight));
  const age = Math.max(10, Number(state.profile.age || 24));
  const heightCm = Math.max(120, Number(state.profile.heightCm || 170));
  const weeklyChangeKg = Math.max(0.1, Math.abs(Number(state.profile.weeklyLoss || 0.5)));
  const goalGapKg = Math.abs(goalWeight - currentWeight);
  const goalMode =
    goalWeight > currentWeight ? "gain" : goalWeight < currentWeight ? "loss" : "maintain";

  // Mifflin-St Jeor baseline estimate when gender/activity detail is unavailable.
  const bmrEstimate = Math.max(1100, Math.round(10 * currentWeight + 6.25 * heightCm - 5 * age + 5));
  const maintenance = Math.max(1300, Math.round(bmrEstimate * 1.4));

  const goalBmrEstimate = Math.max(1050, Math.round(10 * goalWeight + 6.25 * heightCm - 5 * age + 5));
  const goalMaintenance = Math.max(1200, Math.round(goalBmrEstimate * 1.4));

  const rawDailyAdjustment = Math.round((weeklyChangeKg * 7700) / 7);
  const maxDeficit = Math.max(250, Math.round(maintenance * 0.35));
  const maxSurplus = Math.max(200, Math.round(maintenance * 0.25));
  const boundedDailyAdjustment =
    goalMode === "loss"
      ? Math.max(150, Math.min(maxDeficit, rawDailyAdjustment))
      : goalMode === "gain"
        ? Math.max(120, Math.min(maxSurplus, rawDailyAdjustment))
        : 0;

  // Blend current and goal maintenance so target calories shift when goal weight changes.
  const adaptiveMaintenance =
    goalMode === "maintain"
      ? maintenance
      : Math.round(maintenance * 0.6 + goalMaintenance * 0.4);

  // As user gets close to target, gently reduce the adjustment to avoid aggressive swings.
  const goalGapFactor = Math.min(1, Math.max(0.25, goalGapKg / 12));
  const dailyAdjustment = Math.round(boundedDailyAdjustment * (0.75 + 0.25 * goalGapFactor));

  const recommendedCalories =
    goalMode === "gain"
      ? adaptiveMaintenance + dailyAdjustment
      : goalMode === "loss"
        ? Math.max(1200, adaptiveMaintenance - dailyAdjustment)
        : adaptiveMaintenance;

  const manualTarget = Number(state.profile.manualCalorieTarget || 0);
  const hasManualTarget = Number.isFinite(manualTarget) && manualTarget >= 1000;
  const activeCalorieTarget = hasManualTarget ? manualTarget : recommendedCalories;

  state.profile.currentWeight = currentWeight;
  state.profile.goalWeight = goalWeight;
  state.profile.age = age;
  state.profile.heightCm = heightCm;
  state.profile.weeklyLoss = weeklyChangeKg;
  state.profile.goalMode = goalMode;
  state.profile.maintenanceCalories = maintenance;
  state.profile.recommendedCalories = recommendedCalories;
  state.profile.calorieTarget = activeCalorieTarget;
  state.profile.deficitCalories = goalMode === "loss" ? Math.max(0, maintenance - recommendedCalories) : 0;
  state.profile.surplusCalories = goalMode === "gain" ? Math.max(0, recommendedCalories - maintenance) : 0;

  const proteinPerKg = goalMode === "gain" ? 1.9 : 1.8;
  const proteinReferenceWeight = goalMode === "loss" ? currentWeight : goalWeight;
  const proteinG = Math.max(100, Math.round(proteinReferenceWeight * proteinPerKg));

  let fatG = Math.max(40, Math.round(currentWeight * 0.75));
  let carbsG = Math.round((activeCalorieTarget - proteinG * 4 - fatG * 9) / 4);

  if (carbsG < 80) {
    carbsG = 80;
    fatG = Math.max(35, Math.round((activeCalorieTarget - proteinG * 4 - carbsG * 4) / 9));
  }

  state.profile.macros = {
    proteinG,
    fatG: Math.max(35, fatG),
    carbsG: Math.max(80, carbsG),
  };

  if (!weekDays.includes(state.profile.gymClosedDay)) {
    state.profile.gymClosedDay = currentUser?.isAdmin ? "Wednesday" : "Sunday";
  }
  if (!weekDays.includes(state.profile.trainingStartDay)) {
    state.profile.trainingStartDay = currentUser?.isAdmin ? "Thursday" : "Monday";
  }

  state.profile.nutrientTargets = calculateDynamicNutrientTargets(state.profile);
}

function updateDateTime() {
  setText(
    "dateTimeText",
    new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" })
  );
}

function getDayMeals(date = todayDate()) {
  if (!state.mealsByDate[date]) state.mealsByDate[date] = [];
  return state.mealsByDate[date];
}

function dailyTotals(date = todayDate()) {
  const list = getDayMeals(date);
  return list.reduce((acc, meal) => {
    const nutrition = normalizeNutrition(meal);
    acc.kcal += nutrition.kcal;
    nutrientFields.forEach((field) => {
      acc[field] += Number(nutrition[field] || 0);
    });
    return acc;
  }, zeroNutritionTotals());
}

function dayNameFromDate(dateValue = todayDate()) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return currentDayName();
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function getWeekdayIndex(day) {
  const idx = weekDays.indexOf(day);
  return idx >= 0 ? idx : 0;
}

function orderedWeekFromStart(startDay) {
  const startIdx = getWeekdayIndex(startDay);
  return [...weekDays.slice(startIdx), ...weekDays.slice(0, startIdx)];
}

function getWorkoutPreferences() {
  const fallbackClosed = currentUser?.isAdmin ? "Wednesday" : "Sunday";
  const fallbackStart = currentUser?.isAdmin ? "Thursday" : "Monday";

  const closedDay = weekDays.includes(state.profile.gymClosedDay)
    ? state.profile.gymClosedDay
    : fallbackClosed;
  const trainingStartDay = weekDays.includes(state.profile.trainingStartDay)
    ? state.profile.trainingStartDay
    : fallbackStart;

  return { closedDay, trainingStartDay };
}

function buildWeeklyEveningSchedule(closedDay, trainingStartDay) {
  const schedule = {};
  const orderedDays = orderedWeekFromStart(trainingStartDay);
  let splitCursor = 0;

  orderedDays.forEach((day) => {
    if (day === closedDay) {
      schedule[day] = {
        key: "off",
        title: "Gym Closed Day",
        note: "Recovery day. No evening gym workout scheduled.",
        exercises: [],
        isOff: true,
      };
      return;
    }

    const template = eveningWorkoutTemplates[splitCursor % eveningWorkoutTemplates.length];
    splitCursor += 1;

    const exercises = template.exercises.map((exercise) => ({ ...exercise }));
    const hasTreadmill = exercises.some((exercise) =>
      String(exercise?.name || "").toLowerCase().includes("treadmill")
    );
    if (!hasTreadmill) {
      exercises.push({ ...eveningTreadmillFinisher });
    }

    schedule[day] = {
      ...template,
      exercises,
      isOff: false,
    };
  });

  return schedule;
}

function getEveningWorkoutForDay(day = currentDayName()) {
  const { closedDay, trainingStartDay } = getWorkoutPreferences();
  const schedule = buildWeeklyEveningSchedule(closedDay, trainingStartDay);
  return schedule[day] || schedule[trainingStartDay] || eveningWorkoutTemplates[0];
}

function findTodayWorkout() {
  return getEveningWorkoutForDay(currentDayName());
}

function ensureGymLogForDate(date = todayDate()) {
  if (!state.gymLogsByDate[date]) {
    state.gymLogsByDate[date] = {
      morningActivityType: "running",
      morningMinutes: 20,
      morningDone: false,
      absDone: false,
      morningNotes: "",
      morningCustomActivity: "",
      morningCustomMet: 6.5,
      exerciseDone: {},
      exerciseWeights: {},
      steps: 0,
      sleepHours: 0,
    };
  }

  const log = state.gymLogsByDate[date];
  if (!log.exerciseDone || typeof log.exerciseDone !== "object") log.exerciseDone = {};
  if (!log.exerciseWeights || typeof log.exerciseWeights !== "object") log.exerciseWeights = {};
  if (!Number.isFinite(Number(log.steps))) log.steps = 0;
  if (!Number.isFinite(Number(log.sleepHours))) log.sleepHours = 0;
  if (!log.morningActivityType) log.morningActivityType = "running";
  if (!Number.isFinite(Number(log.morningCustomMet))) log.morningCustomMet = 6.5;

  return log;
}

function parseSetPrescription(text) {
  const value = String(text || "").toLowerCase();
  const setsMatch = value.match(/(\d+)\s*x/);
  const sets = setsMatch ? Math.max(1, Number(setsMatch[1])) : 1;

  const secMatch = value.match(/(\d+(?:\.\d+)?)\s*sec/);
  if (secMatch) {
    return {
      sets,
      secondsPerSet: Number(secMatch[1]) || 30,
      repsPerSet: null,
    };
  }

  const minMatch = value.match(/(\d+(?:\.\d+)?)\s*min/);
  if (minMatch) {
    return {
      sets,
      secondsPerSet: (Number(minMatch[1]) || 1) * 60,
      repsPerSet: null,
    };
  }

  const repMatch = value.match(/x\s*(\d+)(?:\s*-\s*(\d+))?/);
  if (repMatch) {
    const low = Number(repMatch[1]) || 10;
    const high = Number(repMatch[2] || repMatch[1]) || low;
    return {
      sets,
      secondsPerSet: null,
      repsPerSet: Math.max(4, (low + high) / 2),
    };
  }

  return {
    sets,
    secondsPerSet: 45,
    repsPerSet: null,
  };
}

function estimateExerciseCalories(exercise, bodyWeightKg, loadKg = 0) {
  const parsed = parseSetPrescription(exercise?.sets || "");
  const sets = Math.max(1, Number(parsed.sets || 1));
  const loadFactor = 1 + Math.min(1.8, Math.max(0, Number(loadKg || 0)) / 60);

  let minutes = 0;
  if (parsed.secondsPerSet) {
    minutes = (sets * parsed.secondsPerSet) / 60;
  } else if (parsed.repsPerSet) {
    minutes = Math.max(3, (sets * parsed.repsPerSet) / 12 + sets * 1.2);
  } else {
    minutes = Math.max(3, sets * 2.5);
  }

  const met = 5.6 + Math.min(2.4, Math.max(0, Number(loadKg || 0)) / 40);
  const kcal = (met * 3.5 * Math.max(30, Number(bodyWeightKg || 70)) * minutes) / 200;
  return Math.max(0, kcal * loadFactor);
}

function estimateMorningCalories(log, bodyWeightKg) {
  if (!log.morningDone) return 0;
  const minutes = Math.max(0, Number(log.morningMinutes || 0));
  if (minutes <= 0) return 0;

  const activityType = log.morningActivityType || "running";
  const defaultConfig = morningActivityCatalog[activityType] || morningActivityCatalog.running;
  const customMet = Number(log.morningCustomMet || 0);
  const met = activityType === "custom" && customMet >= 2 ? customMet : Number(defaultConfig.met || 0);

  return (Math.max(2, met) * 3.5 * Math.max(30, Number(bodyWeightKg || 70)) * minutes) / 200;
}

function estimateAbsCalories(log, bodyWeightKg) {
  const completedKeys = absCircuit
    .map((_, idx) => `abs-${idx}`)
    .filter((key) => Boolean(log.exerciseDone?.[key]));

  if (!completedKeys.length && !log.absDone) return 0;

  const indexes = completedKeys.length
    ? completedKeys.map((key) => Number(key.split("-")[1])).filter((n) => Number.isFinite(n))
    : absCircuit.map((_, idx) => idx);

  return indexes.reduce((sum, idx) => {
    const exercise = absCircuit[idx];
    if (!exercise) return sum;
    const load = 0;
    return sum + estimateExerciseCalories(exercise, bodyWeightKg, load);
  }, 0);
}

function estimateEveningCalories(dayName, log, bodyWeightKg) {
  const workout = getEveningWorkoutForDay(dayName);
  if (!workout || workout.isOff) return 0;

  return workout.exercises.reduce((sum, exercise, idx) => {
    const key = `${dayName}-${idx}`;
    if (!log.exerciseDone?.[key]) return sum;
    const load = Number(log.exerciseWeights?.[key] || 0);
    return sum + estimateExerciseCalories(exercise, bodyWeightKg, load);
  }, 0);
}

function estimateStepsCalories(steps, bodyWeightKg) {
  return Math.max(0, Number(steps || 0)) * Math.max(30, Number(bodyWeightKg || 70)) * 0.0005;
}

function estimateSleepCalories(hours, profile) {
  const sleepHours = Math.max(0, Number(hours || 0));
  if (!sleepHours) return 0;

  const currentWeight = Math.max(30, Number(profile?.currentWeight || 70));
  const age = Math.max(10, Number(profile?.age || 24));
  const heightCm = Math.max(120, Number(profile?.heightCm || 170));
  const bmr = Math.max(1100, Math.round(10 * currentWeight + 6.25 * heightCm - 5 * age + 5));
  return (bmr / 24) * sleepHours * 0.95;
}

function calculateDailyBurn(date = todayDate()) {
  const log = ensureGymLogForDate(date);
  const dayName = dayNameFromDate(date);
  const bodyWeightKg = Math.max(30, Number(state.profile.currentWeight || 70));

  const morning = estimateMorningCalories(log, bodyWeightKg);
  const abs = estimateAbsCalories(log, bodyWeightKg);
  const evening = estimateEveningCalories(dayName, log, bodyWeightKg);
  const steps = estimateStepsCalories(log.steps, bodyWeightKg);
  const sleep = estimateSleepCalories(log.sleepHours, state.profile);
  const total = morning + abs + evening + steps + sleep;

  return {
    morning,
    abs,
    evening,
    steps,
    sleep,
    total,
    dayName,
  };
}

function renderHeaderStats() {
  const totals = dailyTotals();
  const burn = calculateDailyBurn();
  const target = state.profile;
  const latestWeight = state.weightEntries.length
    ? state.weightEntries[state.weightEntries.length - 1].weight
    : target.currentWeight;

  const html = `
    <div class="stat-item">
      <div class="stat-item-label">Eaten</div>
      <b>${formatNum(totals.kcal, 0)} / ${formatNum(target.calorieTarget, 0)} kcal</b>
    </div>
    <div class="stat-item">
      <div class="stat-item-label">Weight</div>
      <b>${formatNum(latestWeight, 1)} kg</b>
    </div>
    <div class="stat-item">
      <div class="stat-item-label">Protein</div>
      <b>${formatNum(totals.protein, 0)} / ${formatNum(target.macros.proteinG, 0)} g</b>
    </div>
    <div class="stat-item">
      <div class="stat-item-label">Burnt</div>
      <b>${formatNum(burn.total, 0)} kcal</b>
    </div>
  `;

  const container = select("headerStats");
  if (container) container.innerHTML = html;
}

function renderDashboard() {
  const totals = dailyTotals();
  const target = state.profile;
  const latestWeight = state.weightEntries.length
    ? state.weightEntries[state.weightEntries.length - 1].weight
    : target.currentWeight;

  const todayWorkout = getEveningWorkoutForDay();
  const log = ensureGymLogForDate();
  const today = currentDayName();

  const macroHtml = `
    <div class="macro-box">
      <div class="macro-box-label">Calories</div>
      <div class="macro-box-value">${formatNum(totals.kcal, 0)}</div>
      <div class="muted">/ ${formatNum(target.calorieTarget, 0)}</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-label">Protein</div>
      <div class="macro-box-value">${formatNum(totals.protein, 0)}g</div>
      <div class="muted">/ ${formatNum(target.macros.proteinG, 0)}g</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-label">Carbs</div>
      <div class="macro-box-value">${formatNum(totals.carbs, 0)}g</div>
      <div class="muted">/ ${formatNum(target.macros.carbsG, 0)}g</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-label">Fat</div>
      <div class="macro-box-value">${formatNum(totals.fat, 0)}g</div>
      <div class="muted">/ ${formatNum(target.macros.fatG, 0)}g</div>
    </div>
  `;

  const macro = select("todayMacroSummary");
  if (macro) macro.innerHTML = macroHtml;

  const weightHtml = `
    <div class="weights-display">
      <div class="weight-item">
        <div class="weight-label">Current</div>
        <div class="weight-value">${formatNum(latestWeight, 1)} kg</div>
      </div>
      <div class="weight-item">
        <div class="weight-label">Goal</div>
        <div class="weight-value">${formatNum(target.goalWeight, 1)} kg</div>
      </div>
    </div>
  `;

  const wd = select("weightDisplay");
  if (wd) wd.innerHTML = weightHtml;

  const completed = todayWorkout.exercises.filter((_, idx) => Boolean(log.exerciseDone?.[`${today}-${idx}`])).length;
  setText("todayWorkoutTitle", todayWorkout.title);
  if (todayWorkout.isOff) {
    setText("todayExerciseCount", "Gym closed day");
  } else {
    setText("todayExerciseCount", `${completed}/${todayWorkout.exercises.length} exercises`);
  }
}

function renderTodayWorkout() {
  const day = currentDayName();
  const { closedDay, trainingStartDay } = getWorkoutPreferences();
  const workout = getEveningWorkoutForDay(day);
  const log = ensureGymLogForDate();

  setText("todayWorkoutDayName", day);
  setText("todayWorkoutNote", workout.note);
  setText("todayWorkoutCycle", `Cycle: ${trainingStartDay} start | Gym closed: ${closedDay}`);

  const list = select("todayExerciseList");
  if (!list) return;

  if (workout.isOff) {
    list.innerHTML = `<p class="muted">No evening gym workout today. Recover, hydrate, and prepare for next split day.</p>`;
    setText("workoutCompletionText", "Recovery day");
    return;
  }

  list.innerHTML = workout.exercises
    .map((ex, idx) => {
      const key = `${day}-${idx}`;
      const done = Boolean(log.exerciseDone[key]);
      const trackWeight = ex.trackWeight !== false;
      const load = trackWeight ? Number(log.exerciseWeights?.[key] || 0) : 0;
      const timerSec = Math.max(20, Number(ex.timerSec || parseSetPrescription(ex.sets).secondsPerSet || 60));

      return `
        <div class="exercise-item ${done ? "done" : ""}" onclick="toggleExercise('${day}', ${idx})">
          <input type="checkbox" ${done ? "checked" : ""} onclick="event.stopPropagation()" onchange="toggleExercise('${day}', ${idx})" />
          <div>
            <h3>${escapeHtml(ex.name)}</h3>
            <p class="exercise-meta">${escapeHtml(ex.sets)} | ${escapeHtml(ex.cues)}</p>
            ${trackWeight
              ? `<label style="display:block;margin-top:6px;">
                  <span class="label-text" style="margin-bottom:4px;">Weight Used (kg)</span>
                  <input type="number" min="0" step="0.5" value="${Number.isFinite(load) && load > 0 ? load : ""}" onclick="event.stopPropagation()" onchange="updateExerciseWeight('${day}', ${idx}, this.value)" placeholder="e.g., 35" />
                </label>`
              : `<p class="muted" style="margin-top:6px;">Cardio finisher: no load entry needed.</p>`}
            <div class="btn-row" style="margin-top:6px;">
              <button type="button" class="btn-small guide-btn" onclick="event.stopPropagation(); openExerciseGuide('${encodeURIComponent(ex.name)}')">View GIF Guide</button>
              <button type="button" class="btn-small" onclick="event.stopPropagation(); startExerciseTimer('${encodeURIComponent(ex.name)}', ${timerSec})">Start ${Math.round(timerSec)}s Timer</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const completed = workout.exercises.filter((_, idx) => Boolean(log.exerciseDone?.[`${day}-${idx}`])).length;
  setText("workoutCompletionText", `${completed}/${workout.exercises.length} completed`);
}

function toggleExercise(day, idx) {
  const log = ensureGymLogForDate();
  const key = `${day}-${idx}`;
  log.exerciseDone[key] = !log.exerciseDone[key];
  saveState();
  renderTodayWorkout();
  renderCalorieRing();
  renderHeaderStats();
  renderDashboard();
  renderBurnPage();
}

function updateExerciseWeight(day, idx, rawValue) {
  const log = ensureGymLogForDate();
  const key = `${day}-${idx}`;
  const value = Number(rawValue || 0);
  if (Number.isFinite(value) && value > 0) {
    log.exerciseWeights[key] = value;
  } else {
    delete log.exerciseWeights[key];
  }
  saveState();
  renderCalorieRing();
  renderHeaderStats();
  renderBurnPage();
}

function renderAbsCircuit() {
  const log = ensureGymLogForDate();
  const list = select("absExerciseList");
  if (!list) return;

  list.innerHTML = absCircuit
    .map((ex, idx) => {
      const key = `abs-${idx}`;
      const done = Boolean(log.exerciseDone[key]);
      const timerSec = Math.max(20, Number(ex.timerSec || parseSetPrescription(ex.sets).secondsPerSet || 45));
      return `
        <div class="exercise-item ${done ? "done" : ""}" onclick="toggleAbsExercise(${idx})">
          <input type="checkbox" ${done ? "checked" : ""} onclick="event.stopPropagation()" onchange="toggleAbsExercise(${idx})" />
          <div>
            <h3>${escapeHtml(ex.name)}</h3>
            <p class="exercise-meta">${escapeHtml(ex.sets)} | ${escapeHtml(ex.cues)}</p>
            <div class="btn-row" style="margin-top:6px;">
              <button type="button" class="btn-small guide-btn" onclick="event.stopPropagation(); openAbsGuide('${encodeURIComponent(ex.name)}')">View GIF Guide</button>
              <button type="button" class="btn-small" onclick="event.stopPropagation(); startExerciseTimer('${encodeURIComponent(ex.name)}', ${timerSec})">Start ${Math.round(timerSec)}s Timer</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

}

function toggleAbsExercise(idx) {
  const log = ensureGymLogForDate();
  const key = `abs-${idx}`;
  log.exerciseDone[key] = !log.exerciseDone[key];
  const completedAbs = absCircuit.filter((_, i) => Boolean(log.exerciseDone?.[`abs-${i}`])).length;
  log.absDone = completedAbs === absCircuit.length && absCircuit.length > 0;
  saveState();
  renderAbsCircuit();
  renderCalorieRing();
  renderHeaderStats();
  renderBurnPage();
}

function renderWorkoutPreferences() {
  const { closedDay, trainingStartDay } = getWorkoutPreferences();
  if (select("gymClosedDay")) select("gymClosedDay").value = closedDay;
  if (select("trainingStartDay")) select("trainingStartDay").value = trainingStartDay;
}

function handleWorkoutPrefsSubmit(e) {
  e.preventDefault();
  const closedDay = select("gymClosedDay")?.value;
  const trainingStartDay = select("trainingStartDay")?.value;

  if (weekDays.includes(closedDay)) {
    state.profile.gymClosedDay = closedDay;
  }
  if (weekDays.includes(trainingStartDay)) {
    state.profile.trainingStartDay = trainingStartDay;
  }

  saveState();
  renderTodayWorkout();
  renderDashboard();
  renderCalorieRing();
  renderHeaderStats();
  renderBurnPage();
  showToast("Workout setup updated.", "success");
}

function showTab(tabName) {
  const map = {
    home: "tabHome",
    burn: "tabBurn",
    diet: "tabDiet",
    "weekly-plan": "tabWeeklyPlan",
    gym: "tabGym",
    progress: "tabProgress",
    settings: "tabSettings",
  };

  const activeTab = map[tabName] ? tabName : "home";
  const contentId = map[activeTab];

  document.querySelectorAll(".tab-content").forEach((el) => {
    const isActive = el.id === contentId;
    el.classList.toggle("active", isActive);
    el.hidden = !isActive;
    el.setAttribute("aria-hidden", String(!isActive));
  });
  document.querySelectorAll(".nav-btn").forEach((el) => el.classList.remove("active"));

  const content = select(contentId);
  if (content) content.classList.add("active");

  /* Match nav button - weekly-plan maps to diet nav btn */
  const navTab = activeTab === "weekly-plan" ? "diet" : activeTab === "burn" ? "home" : activeTab;
  const btn = document.querySelector(`[data-tab="${navTab}"]`);
  if (btn) btn.classList.add("active");

  const shell = select("appShell");
  if (shell) shell.classList.toggle("home-active", activeTab === "home");

  window.scrollTo({ top: 0, behavior: "auto" });
}

function scrollToTab(tabName) {
  showTab(tabName);
}

function renderDietForm() {
  if (select("mealSlot") && !select("mealSlot").value) {
    select("mealSlot").value = "breakfast";
  }

  const submitBtn = select("mealSubmitBtn");
  if (submitBtn) submitBtn.textContent = state.editingMealId ? "Update Meal" : "Save Meal";

  const cancelBtn = select("mealCancelEditBtn");
  if (cancelBtn) {
    const editing = Boolean(state.editingMealId);
    cancelBtn.disabled = !editing;
    cancelBtn.style.opacity = editing ? "1" : "0.65";
  }

  renderMealSuggestions([]);
}

function renderMealSuggestions(items, preserveIndex = false) {
  const box = select("mealSuggestionBox");
  if (!box) return;

  mealSuggestionResults = Array.isArray(items) ? items : [];
  if (!mealSuggestionResults.length) {
    mealSuggestionActiveIndex = -1;
  } else if (!preserveIndex || mealSuggestionActiveIndex < 0 || mealSuggestionActiveIndex >= mealSuggestionResults.length) {
    mealSuggestionActiveIndex = 0;
  }

  if (!mealSuggestionResults.length) {
    box.innerHTML = "";
    box.classList.add("hidden");
    return;
  }

  box.innerHTML = mealSuggestionResults
    .map((item, idx) => {
      const activeClass = idx === mealSuggestionActiveIndex ? " active" : "";
      return `
        <button type="button" class="meal-suggestion-item${activeClass}" data-suggestion-index="${idx}">
          <span class="meal-suggestion-title">${escapeHtml(item.description)}</span>
          <span class="meal-suggestion-meta">${formatNum(item.kcal, 0)} kcal | P ${formatNum(item.protein, 1)}g | C ${formatNum(item.carbs, 1)}g | F ${formatNum(item.fat, 1)}g</span>
        </button>
      `;
    })
    .join("");

  box.classList.remove("hidden");
}

function hideMealSuggestions() {
  renderMealSuggestions([]);
}

function getMealSuggestions(inputText) {
  const query = normalizeMealPhrase(inputText);
  if (!query || query.length < 3) return [];

  const history = ensureFoodHistory();
  const historyMatches = history
    .filter((entry) => {
      const normalized = normalizeMealPhrase(entry?.description);
      return normalized.startsWith(query) || normalized.includes(query);
    })
    .sort((a, b) => Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0));

  const mapped = historyMatches.slice(0, 8).map((entry) => ({
    description: String(entry.description || ""),
    qty: Number(entry.qty || 0),
    kcal: Number(entry.kcal || 0),
    protein: Number(entry.protein || 0),
    carbs: Number(entry.carbs || 0),
    fat: Number(entry.fat || 0),
    nutrients: withNutritionDefaults(entry.nutrients || entry),
  }));

  return mapped;
}

function applyMealSuggestion(item) {
  if (!item) return;

  if (select("mealDescription")) select("mealDescription").value = item.description || "";
  if (select("mealQty") && Number(item.qty || 0) > 0) {
    select("mealQty").value = Math.round(Number(item.qty || 0));
  }

  fillMealFormFromEstimate(withNutritionDefaults(item.nutrients || item));
  hideMealSuggestions();
  setText("mealStatus", "Autofilled from your recent food history. Review and save.");
}

function persistMealHistoryEntry(meal) {
  if (!meal) return;
  const description = String(meal.description || meal.name || "").trim();
  if (!description) return;

  const history = ensureFoodHistory();
  const key = normalizeMealPhrase(description);
  const now = Date.now();
  const existing = history.find((entry) => normalizeMealPhrase(entry?.description) === key);

  const nutrients = {};
  nutrientFields.forEach((field) => {
    nutrients[field] = Number(meal[field] || 0);
  });

  const payload = {
    description,
    qty: Math.max(1, Number(meal.qty || 100)),
    kcal: Number(meal.kcal || 0),
    protein: Number(meal.protein || 0),
    carbs: Number(meal.carbs || 0),
    fat: Number(meal.fat || 0),
    nutrients,
    lastUsedAt: now,
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    history.push(payload);
  }

  if (history.length > 120) {
    history.sort((a, b) => Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0));
    state.foodHistory = history.slice(0, 120);
  }
}

function handleMealDescriptionInput() {
  const text = select("mealDescription")?.value || "";
  renderMealSuggestions(getMealSuggestions(text));
}

function handleMealDescriptionKeydown(event) {
  if (!mealSuggestionResults.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    mealSuggestionActiveIndex = (mealSuggestionActiveIndex + 1) % mealSuggestionResults.length;
    renderMealSuggestions(mealSuggestionResults, true);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    mealSuggestionActiveIndex = (mealSuggestionActiveIndex - 1 + mealSuggestionResults.length) % mealSuggestionResults.length;
    renderMealSuggestions(mealSuggestionResults, true);
    return;
  }

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const pick = mealSuggestionResults[mealSuggestionActiveIndex] || mealSuggestionResults[0];
    if (pick) applyMealSuggestion(pick);
  }
}

function clearMealInputFields() {
  select("mealForm")?.reset();
  if (select("mealSlot")) select("mealSlot").value = "breakfast";
  state.editingMealId = null;
  hideMealSuggestions();
  setText("mealStatus", "");

  const submitBtn = select("mealSubmitBtn");
  if (submitBtn) submitBtn.textContent = "Save Meal";

  const cancelBtn = select("mealCancelEditBtn");
  if (cancelBtn) {
    cancelBtn.disabled = true;
    cancelBtn.style.opacity = "0.65";
  }
}

function getMealDisplayName(meal) {
  const text = String(meal?.description || meal?.name || "Meal").trim();
  if (text.length <= 90) return text;
  return `${text.slice(0, 87)}...`;
}

function renderMealsList() {
  const meals = getDayMeals();
  const slots = ["breakfast", "lunch", "snacks", "dinner"];
  const slotLabels = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    snacks: "Snacks",
    dinner: "Dinner",
  };

  const wrapper = select("mealSections");
  if (!wrapper) return;

  wrapper.innerHTML = slots
    .map((slot) => {
      const items = meals.filter((m) => m.slot === slot);
      const content =
        items.length > 0
          ? items
              .map((m) => {
                const nutrition = normalizeNutrition(m);
                const qty = Number(m.qty || 0);
                const detailsFields = nutrientFields.filter(
                  (field) => !["protein", "carbs", "fat"].includes(field)
                );

                const nutrientDetails = detailsFields
                  .map(
                    (field) =>
                      `<span><b>${nutrientLabels[field]}:</b> ${formatNutrientValue(field, nutrition[field])}</span>`
                  )
                  .join("");

                return `
                  <div class="meal-card">
                    <h3>${escapeHtml(getMealDisplayName(m))}</h3>
                    <p class="meal-meta">
                      ${qty > 0 ? `Qty ${formatNum(qty, 0)}g | ` : ""}
                      ${formatNum(nutrition.kcal, 0)} kcal | P ${formatNum(nutrition.protein, 1)}g | C ${formatNum(nutrition.carbs, 1)}g | F ${formatNum(nutrition.fat, 1)}g
                    </p>
                    <details class="meal-nutrient-details">
                      <summary>View full nutrients</summary>
                      <div class="meal-nutrient-grid">${nutrientDetails}</div>
                    </details>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                      <button class="btn-small" onclick="startEditMeal('${m.id}')">Edit</button>
                      <button class="btn-small" style="color:#f44336;" onclick="deleteMeal('${m.id}')">Delete</button>
                    </div>
                  </div>
                `;
              })
              .join("")
          : `<p class="muted">No meals added yet</p>`;

      return `
        <div class="day-plan">
          <h3>${slotLabels[slot]}</h3>
          ${content}
        </div>
      `;
    })
    .join("");
}

function renderNutrientSummary() {
  const container = select("nutrientSummaryGrid");
  if (!container) return;

  const totals = dailyTotals();

  container.innerHTML = nutrientFields
    .map((field) => {
      const value = Number(totals[field] || 0);
      const target = Number(getNutrientTarget(field) || 0);
      const unit = nutrientUnits[field] || "";
      const digits = unit === "g" ? 1 : 0;
      const progress = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

      return `
        <div class="nutrient-card">
          <div class="nutrient-card-label">${nutrientLabels[field]}</div>
          <div class="nutrient-card-value">${formatNum(value, digits)} <span>${unit}</span></div>
          ${target > 0 ? `<div class="nutrient-card-target">Target ${formatNum(target, digits)} ${unit}</div>` : `<div class="nutrient-card-target">No daily target</div>`}
          ${target > 0 ? `<div class="nutrient-progress"><span style="width:${progress}%"></span></div>` : ""}
        </div>
      `;
    })
    .join("");
}

function deleteMeal(id) {
  state.mealsByDate[todayDate()] = getDayMeals().filter((m) => m.id !== id);
  saveState();
  renderAll();
}

function startEditMeal(id) {
  const meal = getDayMeals().find(m => m.id === id);
  if (!meal) {
    showToast("Meal not found.", "error");
    return;
  }

  state.editingMealId = id;
  
  // Load meal data into form
  select("mealDescription").value = meal.description || meal.name || "";
  select("mealQty").value = meal.qty || 100;
  select("mealSlot").value = meal.slot || "breakfast";
  select("mealCalories").value = meal.kcal || 0;
  
  // Load nutrient fields
  nutrientFields.forEach((field) => {
    const inputId = nutrientInputIds[field];
    if (inputId && select(inputId)) {
      select(inputId).value = Number(meal[field] || 0).toFixed(nutrientUnits[field] === 'g' ? 1 : 0);
    }
  });

  setText("mealStatus", `Editing meal: ${meal.name || meal.description}`);
  showTab("diet");
  select("mealDescription").focus();
  
  const submitBtn = select("mealSubmitBtn");
  if (submitBtn) submitBtn.textContent = "Update Meal";

  const cancelBtn = select("mealCancelEditBtn");
  if (cancelBtn) {
    cancelBtn.disabled = false;
    cancelBtn.style.opacity = "1";
  }
}

function cancelEditMeal() {
  clearMealInputFields();
  showToast("Edit cancelled.", "info");
}


const portionHintByKeyword = {
  egg: 50,
  roti: 40,
  chapati: 40,
  bread: 30,
  banana: 118,
  milk: 240,
  oats: 40,
  rice: 150,
  dal: 150,
  tofu: 120,
  paneer: 100,
  chicken: 120,
  curd: 120,
  potato: 150,
  dryfruits: 30,
  besan: 50,
};

function findFoodPortionHint(foodKey) {
  const key = String(foodKey || "").toLowerCase();
  const hintKey = Object.keys(portionHintByKeyword).find((item) => key.includes(item));
  return hintKey ? portionHintByKeyword[hintKey] : 100;
}

function inferQuantityFromDescription(description, fallback = null) {
  const text = String(description || "").toLowerCase();

  const unitMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|ml|l|litre|liter|cup|cups|tbsp|tablespoon|tsp|teaspoon)\b/i);
  if (unitMatch) {
    const value = Number(unitMatch[1]);
    const unit = unitMatch[2].toLowerCase();
    if (!Number.isFinite(value) || value <= 0) return fallback;
    if (unit === "kg") return value * 1000;
    if (unit === "l" || unit === "litre" || unit === "liter") return value * 1000;
    if (unit === "cup" || unit === "cups") return value * 240;
    if (unit === "tbsp" || unit === "tablespoon") return value * 15;
    if (unit === "tsp" || unit === "teaspoon") return value * 5;
    return value;
  }

  const countMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(egg|eggs|roti|rotis|chapati|chapatis|slice|slices|banana|bananas|piece|pieces)\b/i
  );
  if (countMatch) {
    const count = Number(countMatch[1]);
    const unit = countMatch[2].toLowerCase();
    const perUnit =
      unit.includes("egg") ? 50 :
      unit.includes("roti") || unit.includes("chapati") ? 40 :
      unit.includes("slice") ? 30 :
      unit.includes("banana") ? 118 :
      60;
    return count * perUnit;
  }

  const halfMatch = text.match(/half\s+(egg|roti|chapati|banana|cup)/i);
  if (halfMatch) {
    const unit = halfMatch[1].toLowerCase();
    const halfWeight =
      unit.includes("egg") ? 25 :
      unit.includes("roti") || unit.includes("chapati") ? 20 :
      unit.includes("banana") ? 59 :
      unit.includes("cup") ? 120 :
      50;
    return halfWeight;
  }

  if (Number.isFinite(Number(fallback)) && Number(fallback) > 0) return Number(fallback);
  return null;
}

function inferTopLevelMealQuantity(description) {
  const text = String(description || "").trim().toLowerCase();
  if (!text) return null;

  const topLevelMatch = text.match(/^\s*(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|ml|l|litre|liter|cup|cups|tbsp|tablespoon|tsp|teaspoon)\b/i);
  if (!topLevelMatch) return null;
  return inferQuantityFromDescription(topLevelMatch[0], null);
}

function scaleNutrition(per100, grams) {
  const base = normalizeNutrition(per100);
  const factor = Math.max(1, Number(grams || 100)) / 100;
  const scaled = zeroNutritionTotals();
  scaled.kcal = base.kcal * factor;
  nutrientFields.forEach((field) => {
    scaled[field] = Number(base[field] || 0) * factor;
  });
  return scaled;
}

function estimateUnknownFood(description, grams) {
  const text = String(description || "").toLowerCase();
  let profile = withNutritionDefaults({
    kcal: 195,
    protein: 9,
    carbs: 22,
    fiber: 2,
    sugar: 3,
    fat: 7,
    satFat: 2,
    polyFat: 1.2,
    monoFat: 2.8,
    transFat: 0.05,
    cholesterol: 18,
    sodium: 220,
    potassium: 220,
    vitaminA: 60,
    vitaminC: 4,
    calcium: 70,
    iron: 1.5,
  });

  if (/(salad|vegetable|veggie|soup)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 85,
      protein: 3.5,
      carbs: 13,
      fiber: 3.5,
      sugar: 3.5,
      fat: 1.8,
      satFat: 0.3,
      polyFat: 0.5,
      monoFat: 0.6,
      transFat: 0,
      cholesterol: 0,
      sodium: 130,
      potassium: 280,
      vitaminA: 180,
      vitaminC: 14,
      calcium: 55,
      iron: 1.2,
    });
  } else if (/(chicken|fish|egg|paneer|tofu|dal|lentil|bean|protein)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 170,
      protein: 19,
      carbs: 8,
      fiber: 2,
      sugar: 1.8,
      fat: 7,
      satFat: 2,
      polyFat: 1.5,
      monoFat: 2.8,
      transFat: 0.05,
      cholesterol: 55,
      sodium: 180,
      potassium: 320,
      vitaminA: 90,
      vitaminC: 4,
      calcium: 95,
      iron: 2.2,
    });
  } else if (/(fried|pakora|samosa|fries|chips|burger|pizza)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 290,
      protein: 8,
      carbs: 24,
      fiber: 2,
      sugar: 3,
      fat: 18,
      satFat: 5,
      polyFat: 4.5,
      monoFat: 6.2,
      transFat: 0.3,
      cholesterol: 35,
      sodium: 430,
      potassium: 220,
      vitaminA: 50,
      vitaminC: 3,
      calcium: 75,
      iron: 1.4,
    });
  } else if (/(fruit|apple|orange|banana|papaya|berries|mango)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 90,
      protein: 1.2,
      carbs: 23,
      fiber: 2.8,
      sugar: 14,
      fat: 0.5,
      satFat: 0.1,
      polyFat: 0.1,
      monoFat: 0.1,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      potassium: 260,
      vitaminA: 40,
      vitaminC: 24,
      calcium: 25,
      iron: 0.6,
    });
  }

  return scaleNutrition(profile, grams);
}

function findBestFoodMatch(text, db) {
  const top = findTopFoodMatches(text, db, 1)[0];
  if (!top) return null;

  const normalizedText = normalizeFoodKey(text);
  const textTokens = tokenizeFoodText(normalizedText);
  const keyTokens = String(top.key || "").split(" ").filter(Boolean);

  if (keyTokens.length === 1 && textTokens.length >= 2 && genericFoodTokens.has(keyTokens[0])) {
    return null;
  }

  return top.score >= 16 ? top.key : null;
}

function splitMealDescription(description) {
  return String(description || "")
    .split(/\+|,|\sand\s|\s&\s|\swith\s/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function applyMealSpecificSanityAdjustments(description, nutrition, gramsHint) {
  const adjusted = normalizeNutrition(nutrition);
  const text = normalizeFoodKey(description);
  const totalGrams = Math.max(1, Number(gramsHint || inferQuantityFromDescription(description, 100) || 100));

  const massBasedProteinCap = (totalGrams / 100) * 28;
  if (adjusted.protein > massBasedProteinCap) adjusted.protein = massBasedProteinCap;

  const massBasedFatCap = (totalGrams / 100) * 45;
  if (adjusted.fat > massBasedFatCap) adjusted.fat = massBasedFatCap;

  // Carb-dominant dishes should not get extremely high protein unless explicitly protein-heavy.
  const hasProteinHeavySignals = /(chicken|fish|egg|paneer|tofu|soy|dal|rajma|chana|lentil|keema|mutton)/i.test(text);
  const carbHeavyDish = /(idli|dosa|rice|chawal|pulao|biryani|poha|upma|paratha|chapati|roti|bread|khichdi|noodles)/i.test(text);
  if (carbHeavyDish && !hasProteinHeavySignals) {
    const carbDishProteinCap = (totalGrams / 100) * 10;
    if (adjusted.protein > carbDishProteinCap) {
      adjusted.protein = carbDishProteinCap;
    }
  }

  const eggCountMatch = text.match(/(\d+(?:\.\d+)?)\s*eggs?\b/i);
  const eggCount = eggCountMatch ? Number(eggCountMatch[1]) : 0;
  if (eggCount > 0 && /egg curry/.test(text)) {
    const gravyAllowance = Math.min(4, Math.max(1, totalGrams / 200));
    const realisticProteinCap = eggCount * 6.5 + gravyAllowance;
    if (adjusted.protein > realisticProteinCap) {
      adjusted.protein = realisticProteinCap;
    }
  }

  const macroCalories = estimateCaloriesFromNutrition(adjusted);
  if (!adjusted.kcal || adjusted.kcal < macroCalories * 0.72 || adjusted.kcal > macroCalories * 1.45) {
    adjusted.kcal = Math.round(macroCalories);
  }

  adjusted.kcal = Math.max(0, adjusted.kcal);
  adjusted.protein = Math.max(0, adjusted.protein);
  adjusted.carbs = Math.max(0, adjusted.carbs);
  adjusted.fat = Math.max(0, adjusted.fat);

  return adjusted;
}

function addNutritionTotals(target, addition) {
  const dest = target || zeroNutritionTotals();
  const source = normalizeNutrition(addition || {});
  dest.kcal += Number(source.kcal || 0);
  nutrientFields.forEach((field) => {
    dest[field] += Number(source[field] || 0);
  });
  return dest;
}

function deriveCountBasedFoodConfig(unitText) {
  const unit = String(unitText || "").toLowerCase();
  if (unit.includes("egg")) return { foodLookup: "egg", gramsPerUnit: 50 };
  if (unit.includes("roti") || unit.includes("chapati")) return { foodLookup: "roti", gramsPerUnit: 40 };
  if (unit.includes("slice")) return { foodLookup: "bread", gramsPerUnit: 30 };
  if (unit.includes("banana")) return { foodLookup: "banana", gramsPerUnit: 118 };
  return null;
}

function extractCountBasedComponents(segmentText, db) {
  let working = String(segmentText || "");
  const components = [];

  const countPattern = /(\d+(?:\.\d+)?)\s*(eggs?|rotis?|chapatis?|slices?|bananas?)\b/gi;
  working = working.replace(countPattern, (fullMatch, countText, unitText) => {
    const config = deriveCountBasedFoodConfig(unitText);
    const count = Number(countText);
    if (!config || !Number.isFinite(count) || count <= 0) return " ";

    const matchedKey = findBestFoodMatch(config.foodLookup, db);
    if (!matchedKey || !db[matchedKey]) return " ";

    const grams = Math.max(1, count * config.gramsPerUnit);
    components.push({
      source: "dataset",
      label: `${count} ${unitText}`,
      grams,
      matchedKey,
      nutrition: scaleNutrition(db[matchedKey], grams),
    });

    return " ";
  });

  return {
    components,
    remainder: working.replace(/\s+/g, " ").trim(),
  };
}

function summarizeMealComponents(components) {
  const knownTotals = zeroNutritionTotals();
  const unknownComponents = [];
  let totalGrams = 0;

  (components || []).forEach((component) => {
    const grams = Math.max(0, Number(component?.grams || 0));
    totalGrams += grams;

    if (component?.source === "dataset") {
      addNutritionTotals(knownTotals, component.nutrition);
    } else {
      unknownComponents.push({
        label: String(component?.label || "unknown component"),
        grams,
      });
    }
  });

  return { knownTotals, unknownComponents, totalGrams };
}

function buildHybridMealComponents(description, qtyInput, db) {
  const rawText = String(description || "").trim();
  const explicitQty = Number(qtyInput);
  const hasExplicitQty = Number.isFinite(explicitQty) && explicitQty > 0;
  const topLevelMealQty = inferTopLevelMealQuantity(rawText);
  const hasTopLevelMealQty = Number.isFinite(topLevelMealQty) && topLevelMealQty > 0;

  const components = [];
  let workingText = rawText;
  const normalizedText = normalizeFoodKey(rawText);

  const eggCountMatch = normalizedText.match(/(\d+(?:\.\d+)?)\s*eggs?\b/i);
  const eggCount = eggCountMatch ? Number(eggCountMatch[1]) : 0;

  if (/egg curry/.test(normalizedText) && eggCount > 0) {
    const eggKey = findBestFoodMatch("egg", db) || "egg";
    const eggGrams = eggCount * 50;

    if (db[eggKey]) {
      components.push({
        source: "dataset",
        label: `eggs (${eggCount})`,
        grams: eggGrams,
        matchedKey: eggKey,
        nutrition: scaleNutrition(db[eggKey], eggGrams),
      });
    }

    const inferredMealQty = Number(
      inferQuantityFromDescription(rawText, hasExplicitQty ? explicitQty : eggGrams + 160) ||
        (hasExplicitQty ? explicitQty : eggGrams + 160)
    );
    const gravyGrams = Math.max(60, inferredMealQty - eggGrams);

    components.push({
      source: "unknown",
      label: "egg curry gravy",
      grams: gravyGrams,
    });

    workingText = workingText
      .replace(/(\d+(?:\.\d+)?)\s*eggs?\b/gi, " ")
      .replace(/egg curry/gi, "curry gravy")
      .replace(/\s+/g, " ")
      .trim();
  }

  const segments = splitMealDescription(workingText);
  segments.forEach((segment) => {
    const { components: countedComponents, remainder } = extractCountBasedComponents(segment, db);
    countedComponents.forEach((component) => components.push(component));

    const segmentText = String(remainder || "").trim();
    if (!segmentText) return;

    const matchedKey = findBestFoodMatch(segmentText, db);
    const grams = Math.max(
      1,
      Number(inferQuantityFromDescription(segmentText, matchedKey ? findFoodPortionHint(matchedKey) : 100) || 100)
    );

    if (matchedKey && db[matchedKey]) {
      components.push({
        source: "dataset",
        label: segmentText,
        grams,
        matchedKey,
        nutrition: scaleNutrition(db[matchedKey], grams),
      });
      return;
    }

    components.push({
      source: "unknown",
      label: segmentText,
      grams,
    });
  });

  if (!components.length) {
    const grams = Math.max(1, Number(hasExplicitQty ? explicitQty : inferQuantityFromDescription(rawText, 100) || 100));
    components.push({
      source: "unknown",
      label: rawText || "meal",
      grams,
    });
  }

  const preScaleSummary = summarizeMealComponents(components);
  const targetTotalQty = hasExplicitQty ? explicitQty : hasTopLevelMealQty ? topLevelMealQty : null;
  if (targetTotalQty && preScaleSummary.totalGrams > 0) {
    const scale = targetTotalQty / preScaleSummary.totalGrams;
    components.forEach((component) => {
      component.grams = Math.max(1, Number(component.grams || 0) * scale);
      if (component.source === "dataset" && component.nutrition) {
        component.nutrition.kcal *= scale;
        nutrientFields.forEach((field) => {
          component.nutrition[field] *= scale;
        });
      }
    });
  }

  const summary = summarizeMealComponents(components);
  return {
    components,
    knownTotals: summary.knownTotals,
    unknownComponents: summary.unknownComponents,
    totalGrams: targetTotalQty || summary.totalGrams,
  };
}

function estimateFromFoodDb(description, qtyInput = null) {
  const text = String(description || "").trim();
  if (!foodDatasetLoaded && !foodDatasetLoadPromise) {
    loadFoodDatasetIfNeeded().catch(() => {});
  }

  const db = getMergedFoodDb();
  const hybrid = buildHybridMealComponents(text, qtyInput, db);

  const combined = zeroNutritionTotals();
  addNutritionTotals(combined, hybrid.knownTotals);

  hybrid.unknownComponents.forEach((component) => {
    addNutritionTotals(combined, estimateUnknownFood(component.label, component.grams));
  });

  const gramsHint = Math.max(
    1,
    Number(hybrid.totalGrams || inferQuantityFromDescription(text, qtyInput || 100) || qtyInput || 100)
  );

  return applyMealSpecificSanityAdjustments(text, combined, gramsHint);
}

function fillMealFormFromEstimate(estimation) {
  const normalized = normalizeNutrition(estimation);
  if (select("mealCalories")) select("mealCalories").value = Math.round(normalized.kcal || 0);

  nutrientFields.forEach((field) => {
    const inputId = nutrientInputIds[field];
    if (!inputId || !select(inputId)) return;
    const unit = nutrientUnits[field] || "";
    const digits = unit === "g" ? 1 : 0;
    select(inputId).value = Number(normalized[field] || 0).toFixed(digits);
  });
}

async function estimateMealFromBtn() {
  const description = select("mealDescription")?.value.trim();
  if (!description) {
    alert("Enter food description first.");
    return;
  }

  await loadFoodDatasetIfNeeded();

  const qty = parseOptionalNumber("mealQty");
  const estimation = estimateFromFoodDb(description, qty);
  fillMealFormFromEstimate(estimation);
  setText("mealStatus", foodDatasetLoaded
    ? "Estimated using merged Indian food dataset (CSV + XLS)."
    : "Estimated using built-in food intelligence.");
}

function extractJsonObject(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in response");
  return JSON.parse(match[0]);
}

function redirectToApiKeySetup(featureName) {
  showTab("settings");
  const input = select("apiKeyInput");
  if (input) {
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  setText("apiStatus", `${featureName} needs an API key. Paste key and tap Save AI Settings.`);
}

function closeApiPromptModal(markShown = true) {
  const modal = select("apiPromptModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");

  if (!markShown || !currentUser) return;

  const tracker = loadApiPromptTracker();
  tracker[currentUser.id] = {
    date: todayDate(),
    closedAt: Date.now(),
  };
  saveApiPromptTracker(tracker);
}

function openApiPromptModal() {
  const modal = select("apiPromptModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function showDailyApiPromptIfNeeded() {
  if (!currentUser || !state) return;
  if ((state.settings.apiKey || "").trim()) return;

  const tracker = loadApiPromptTracker();
  const record = tracker[currentUser.id];
  if (record?.date === todayDate()) return;

  setTimeout(() => {
    openApiPromptModal();
  }, 900);
}

function handleApiPromptGoToSetup() {
  closeApiPromptModal(true);
  redirectToApiKeySetup("Advanced AI features");
}

function ensureApiKey(featureName) {
  const key = (state.settings.apiKey || "").trim();
  if (key) return true;

  showToast(`${featureName} requires API key setup in Settings.`, "error");
  redirectToApiKeySetup(featureName);
  return false;
}

async function callOpenRouter(messages, modelOverride, options = {}) {
  const apiKey = (state.settings.apiKey || "").trim();
  if (!apiKey) throw new Error("No API key available");

  const expectJson = Boolean(options.expectJson);
  const maxTokens = Number.isFinite(Number(options.maxTokens)) ? Number(options.maxTokens) : 320;
  const totalTimeoutMs = Number.isFinite(Number(options.totalTimeoutMs)) ? Number(options.totalTimeoutMs) : 12000;

  const modelChain = Array.from(new Set([
    (modelOverride || "").trim(),
    (state.settings.aiModel || "").trim(),
    DEFAULT_AI_MODEL,
    FAST_AI_MODEL_QWEN,
    FAST_AI_MODEL_NEMOTRON,
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
  ].filter(Boolean)));

  let lastError = "";
  const startedAt = Date.now();

  for (const model of modelChain) {
    const elapsed = Date.now() - startedAt;
    const remaining = totalTimeoutMs - elapsed;
    if (remaining < 800) break;

    const requestTimeout = Math.max(700, Math.min(3200, remaining - 120));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("timeout"), requestTimeout);

    try {
      const payload = {
        model,
        messages,
        temperature: 0,
        max_tokens: maxTokens,
      };

      if (expectJson) {
        payload.response_format = { type: "json_object" };
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin || "http://localhost",
          "X-Title": APP_NAME,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        lastError = `${model}: OpenRouter ${response.status}: ${text.slice(0, 180)}`;
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        const joined = content
          .map((part) => {
            if (typeof part === "string") return part;
            if (typeof part?.text === "string") return part.text;
            return "";
          })
          .join("\n")
          .trim();
        if (joined) return joined;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const msg = error?.name === "AbortError" ? "request timeout" : error?.message || "request failed";
      lastError = `${model}: ${msg}`;
    }
  }

  throw new Error(lastError || "OpenRouter call failed across model fallbacks");
}

function parseLooseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return NaN;
}

function pickNumericValue(source, keys, fallback = 0) {
  for (const key of keys) {
    const value = parseLooseNumber(source?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function estimateCaloriesFromNutrition(nutrition) {
  const protein = Number(nutrition.protein || 0);
  const carbs = Number(nutrition.carbs || 0);
  const fat = Number(nutrition.fat || 0);
  return protein * 4 + carbs * 4 + fat * 9;
}

function parseAiNutritionPayload(parsed) {
  return {
    kcal: pickNumericValue(parsed, ["kcal", "calories"]),
    protein: pickNumericValue(parsed, ["protein"]),
    carbs: pickNumericValue(parsed, ["carbs", "carbohydrates"]),
    fiber: pickNumericValue(parsed, ["fiber"]),
    sugar: pickNumericValue(parsed, ["sugar", "sugars"]),
    fat: pickNumericValue(parsed, ["fat", "totalFat"]),
    satFat: pickNumericValue(parsed, ["saturatedFat", "satFat", "saturated_fat", "sfa"]),
    polyFat: pickNumericValue(parsed, ["polyunsaturatedFat", "polyFat", "polyunsaturated_fat", "pufa"]),
    monoFat: pickNumericValue(parsed, ["monounsaturatedFat", "monoFat", "monounsaturated_fat", "mufa"]),
    transFat: pickNumericValue(parsed, ["transFat", "trans_fat", "transfat"]),
    cholesterol: pickNumericValue(parsed, ["cholesterolMg", "cholesterol"]),
    sodium: pickNumericValue(parsed, ["sodiumMg", "sodium"]),
    potassium: pickNumericValue(parsed, ["potassiumMg", "potassium"]),
    vitaminA: pickNumericValue(parsed, ["vitaminAMcg", "vitaminA"]),
    vitaminC: pickNumericValue(parsed, ["vitaminCMg", "vitaminC"]),
    calcium: pickNumericValue(parsed, ["calciumMg", "calcium"]),
    iron: pickNumericValue(parsed, ["ironMg", "iron"]),
  };
}

function clampNumber(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function harmonizeAiNutritionEstimate(description, llmNutrition, knownTotals, heuristicNutrition, gramsHint) {
  const adjusted = normalizeNutrition(llmNutrition || {});
  const known = normalizeNutrition(knownTotals || {});
  const heuristic = normalizeNutrition(heuristicNutrition || {});
  const totalGrams = Math.max(1, Number(gramsHint || inferQuantityFromDescription(description, 100) || 100));
  const text = normalizeFoodKey(description);

  ["protein", "carbs", "fat"].forEach((field) => {
    adjusted[field] = Math.max(Number(adjusted[field] || 0), Number(known[field] || 0));
  });

  if (adjusted.kcal <= 0 && heuristic.kcal > 0) {
    adjusted.kcal = heuristic.kcal;
  }

  if (heuristic.kcal > 0 && adjusted.kcal > 0) {
    const minKcal = heuristic.kcal * 0.72;
    const maxKcal = heuristic.kcal * 1.28;
    adjusted.kcal = clampNumber(adjusted.kcal, minKcal, maxKcal);
  }

  const fatBreakdownTotal = Number(adjusted.satFat || 0) + Number(adjusted.polyFat || 0) + Number(adjusted.monoFat || 0);
  if (adjusted.fat > 0 && fatBreakdownTotal <= 0) {
    adjusted.satFat = Math.max(Number(known.satFat || 0), adjusted.fat * 0.32);
    adjusted.polyFat = Math.max(Number(known.polyFat || 0), adjusted.fat * 0.26);
    adjusted.monoFat = Math.max(Number(known.monoFat || 0), adjusted.fat * 0.38);
  }

  const breakdownWithTrans = Number(adjusted.satFat || 0) + Number(adjusted.polyFat || 0) + Number(adjusted.monoFat || 0) + Number(adjusted.transFat || 0);
  if (adjusted.fat > 0 && breakdownWithTrans > adjusted.fat) {
    const scale = adjusted.fat / breakdownWithTrans;
    adjusted.satFat *= scale;
    adjusted.polyFat *= scale;
    adjusted.monoFat *= scale;
    adjusted.transFat *= scale;
  }

  adjusted.transFat = Math.max(Number(adjusted.transFat || 0), Number(known.transFat || 0));
  if (adjusted.transFat <= 0 && /(fried|deep fried|pakora|chips|namkeen|bakery|processed)/i.test(text)) {
    adjusted.transFat = Math.max(0.1, (totalGrams / 100) * 0.2);
  }

  const macroCalories = estimateCaloriesFromNutrition(adjusted);
  if (macroCalories > 0) {
    const kcalGapRatio = Math.abs(adjusted.kcal - macroCalories) / macroCalories;
    if (!adjusted.kcal || kcalGapRatio > 0.25) {
      adjusted.kcal = Math.round(macroCalories * 0.65 + adjusted.kcal * 0.35);
    }
  }

  return applyMealSpecificSanityAdjustments(description, adjusted, totalGrams);
}

function buildHybridCompositionPrompt(hybrid, description, db) {
  const knownComponents = hybrid.components
    .filter((component) => component.source === "dataset")
    .map((component, idx) => `${idx + 1}. ${component.label} -> dataset key "${component.matchedKey}", qty ${formatNum(component.grams, 0)}g`)
    .join("\n");

  const unknownComponents = hybrid.unknownComponents
    .map((component, idx) => `${idx + 1}. ${component.label}, qty ${formatNum(component.grams, 0)}g`)
    .join("\n");

  const references = buildFoodReferenceSnippet(description, hybrid.totalGrams, db);
  const knownTotals = normalizeNutrition(hybrid.knownTotals);

  return `Meal description:
"${description}"

Total quantity: ${formatNum(hybrid.totalGrams, 0)} grams.

Known components already computed from dataset (do NOT recalculate these):
${knownComponents || "none"}

Dataset subtotal estimate (use this as evidence, not final answer):
${JSON.stringify(knownTotals)}

Unknown components requiring estimation:
${unknownComponents || "none"}

Reference foods from merged dataset:
${references}

Use meal description, quantity, and dataset references to produce FINAL nutrition totals for the whole meal.
Return ONLY strict JSON with numeric fields:
kcal, protein, carbs, fiber, sugar, fat, saturatedFat, polyunsaturatedFat, monounsaturatedFat, transFat, cholesterolMg, sodiumMg, potassiumMg, vitaminAMcg, vitaminCMg, calciumMg, ironMg, confidence.
Do not leave fat subtype fields as all-zero when total fat is present; provide realistic saturated/polyunsaturated/monounsaturated split.
If trans fat is unknown, estimate a small realistic value (0 is acceptable only for clearly non-processed foods).
No explanation.`;
}

async function aiEstimateMeal() {
  const description = select("mealDescription")?.value.trim();
  if (!description) {
    alert("Enter food description first.");
    return;
  }

  if (!ensureApiKey("AI meal estimate")) return;

  await loadFoodDatasetIfNeeded();

  const qtyInput = parseOptionalNumber("mealQty");
  const db = getMergedFoodDb();
  const hybrid = buildHybridMealComponents(description, qtyInput, db);
  const qty = Number(hybrid.totalGrams || qtyInput || inferQuantityFromDescription(description, 100) || 100);

  setText("mealStatus", "AI is verifying meal nutrition using Indian dataset evidence + quantity context...");

  try {
    const prompt = buildHybridCompositionPrompt(hybrid, description, db);
    const heuristic = estimateFromFoodDb(description, qty);

    const raw = await callOpenRouter(
      [
        {
          role: "system",
          content:
            "You are a strict nutrition estimation engine for Indian foods. Use dataset references as support and return realistic final totals; avoid impossible calories and avoid zeroing fat subtypes when total fat is non-zero.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      state.settings.aiModel || DEFAULT_AI_MODEL,
      { expectJson: true, maxTokens: 260, totalTimeoutMs: 4800 }
    );

    const parsed = extractJsonObject(raw);

    const llmFinal = parseAiNutritionPayload(parsed);
    const corrected = harmonizeAiNutritionEstimate(description, llmFinal, hybrid.knownTotals, heuristic, qty);

    fillMealFormFromEstimate(corrected);

    const qtyInputEl = select("mealQty");
    if (qtyInputEl && !qtyInputEl.value) {
      qtyInputEl.value = Math.round(qty);
    }

    const confidence = pickNumericValue(parsed, ["confidence"], 0);
    const confidenceText = confidence > 0 ? ` (confidence ${Math.round(confidence)}%)` : "";
    const knownCount = hybrid.components.filter((component) => component.source === "dataset").length;
    const referenceCount = findTopFoodMatches(description, db, 8).length;
    setText("mealStatus", `AI final estimate ready${confidenceText}: verified against Indian dataset (${knownCount} matched components, ${referenceCount} reference foods). You can edit any nutrient before save.`);
  } catch {
    const fallback = estimateFromFoodDb(description, qty);
    fillMealFormFromEstimate(fallback);
    setText("mealStatus", "AI estimate failed. Used Indian dataset + heuristic composition estimate instead.");
  }
}

async function parseNutritionLabelWithAI(rawText) {
  const apiKey = (state?.settings?.apiKey || "").trim();
  if (!apiKey) return null;

  const prompt = `OCR nutrition label text:\n${String(rawText || "").slice(0, 8000)}\n\nExtract nutrition values and return strict JSON only with these numeric fields:\nkcal, protein, carbs, fiber, sugar, fat, saturatedFat, polyunsaturatedFat, monounsaturatedFat, transFat, cholesterolMg, sodiumMg, potassiumMg, vitaminAMcg, vitaminCMg, calciumMg, ironMg.`;

  const raw = await callOpenRouter(
    [
      {
        role: "system",
        content: "Extract nutrition facts from OCR text. Return numeric JSON only. If a value is missing, set 0.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    state.settings.aiModel || DEFAULT_AI_MODEL,
    { expectJson: true, maxTokens: 180, totalTimeoutMs: 4500 }
  );

  const parsed = extractJsonObject(raw);
  return parseAiNutritionPayload(parsed);
}

function extractMeasuredValue(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (!match) continue;
    const value = Number(String(match[1]).replace(/,/g, "."));
    if (!Number.isFinite(value)) continue;
    const unit = String(match[2] || "").toLowerCase().replace(/μ|µ/g, "u");
    return { value, unit };
  }
  return null;
}

function toGrams(measure) {
  if (!measure) return null;
  if (measure.unit === "mg") return measure.value / 1000;
  if (measure.unit === "mcg" || measure.unit === "ug") return measure.value / 1000000;
  return measure.value;
}

function toMilligrams(measure) {
  if (!measure) return null;
  if (measure.unit === "g") return measure.value * 1000;
  if (measure.unit === "mcg" || measure.unit === "ug") return measure.value / 1000;
  return measure.value;
}

function toMicrograms(measure) {
  if (!measure) return null;
  if (measure.unit === "g") return measure.value * 1000000;
  if (measure.unit === "mg") return measure.value * 1000;
  if (measure.unit === "iu") return measure.value * 0.3;
  return measure.value;
}

function parseNutritionLabel(text) {
  const normalized = String(text || "")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");

  const normalizedForTotalFat = normalized
    .replace(/saturated\s*fat/gi, "")
    .replace(/polyunsaturated\s*fat/gi, "")
    .replace(/monounsaturated\s*fat/gi, "")
    .replace(/trans\s*fat/gi, "");

  const caloriesMatch = extractMeasuredValue(normalized, [/(?:calories|energy)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i]);
  const proteinMatch = extractMeasuredValue(normalized, [/protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const carbsMatch = extractMeasuredValue(normalized, [/(?:carbohydrate|carbohydrates|carbs?)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const fiberMatch = extractMeasuredValue(normalized, [/fiber\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const sugarMatch = extractMeasuredValue(normalized, [/(?:total\s+)?sugars?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const fatMatch = extractMeasuredValue(normalizedForTotalFat, [/(?:total\s+fat|\bfat\b)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const satFatMatch = extractMeasuredValue(normalized, [/(?:saturated\s*fat|sat\.?\s*fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const polyFatMatch = extractMeasuredValue(normalized, [/(?:polyunsaturated\s*fat|poly\.?\s*fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const monoFatMatch = extractMeasuredValue(normalized, [/(?:monounsaturated\s*fat|mono\.?\s*fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const transFatMatch = extractMeasuredValue(normalized, [/trans\s*fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|mg)?/i]);
  const cholesterolMatch = extractMeasuredValue(normalized, [/cholesterol\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const sodiumMatch = extractMeasuredValue(normalized, [/sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const potassiumMatch = extractMeasuredValue(normalized, [/potassium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const vitaminAMatch = extractMeasuredValue(normalized, [/(?:vitamin\s*a|vit\.?\s*a)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mcg|ug|mg|iu)?/i]);
  const vitaminCMatch = extractMeasuredValue(normalized, [/(?:vitamin\s*c|vit\.?\s*c)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const calciumMatch = extractMeasuredValue(normalized, [/calcium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);
  const ironMatch = extractMeasuredValue(normalized, [/iron\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(mg|g)?/i]);

  return {
    kcal: caloriesMatch ? caloriesMatch.value : null,
    protein: toGrams(proteinMatch),
    carbs: toGrams(carbsMatch),
    fiber: toGrams(fiberMatch),
    sugar: toGrams(sugarMatch),
    fat: toGrams(fatMatch),
    satFat: toGrams(satFatMatch),
    polyFat: toGrams(polyFatMatch),
    monoFat: toGrams(monoFatMatch),
    transFat: toGrams(transFatMatch),
    cholesterol: toMilligrams(cholesterolMatch),
    sodium: toMilligrams(sodiumMatch),
    potassium: toMilligrams(potassiumMatch),
    vitaminA: toMicrograms(vitaminAMatch),
    vitaminC: toMilligrams(vitaminCMatch),
    calcium: toMilligrams(calciumMatch),
    iron: toMilligrams(ironMatch),
  };
}

async function handleLabelPhotoScan(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!window.Tesseract) {
    setText("mealStatus", "OCR engine unavailable on this device.");
    return;
  }

  setText("mealStatus", "Scanning nutrition label...");

  try {
    const result = await window.Tesseract.recognize(file, "eng", { logger: () => {} });
    const ocrText = result?.data?.text || "";
    let parsed = parseNutritionLabel(ocrText);

    if (parsed.kcal == null && parsed.protein == null && parsed.carbs == null && parsed.fat == null) {
      const aiParsed = await parseNutritionLabelWithAI(ocrText).catch(() => null);
      if (aiParsed) {
        parsed = {
          kcal: aiParsed.kcal,
          protein: aiParsed.protein,
          carbs: aiParsed.carbs,
          fiber: aiParsed.fiber,
          sugar: aiParsed.sugar,
          fat: aiParsed.fat,
          satFat: aiParsed.satFat,
          polyFat: aiParsed.polyFat,
          monoFat: aiParsed.monoFat,
          transFat: aiParsed.transFat,
          cholesterol: aiParsed.cholesterol,
          sodium: aiParsed.sodium,
          potassium: aiParsed.potassium,
          vitaminA: aiParsed.vitaminA,
          vitaminC: aiParsed.vitaminC,
          calcium: aiParsed.calcium,
          iron: aiParsed.iron,
        };
      }
    }

    if (parsed.kcal == null && parsed.protein == null && parsed.carbs == null && parsed.fat == null) {
      setText("mealStatus", "Could not read nutrition values clearly. Try a sharper photo.");
      return;
    }

    const labelEstimate = {
      kcal: parsed.kcal ?? 0,
      protein: parsed.protein ?? 0,
      carbs: parsed.carbs ?? 0,
      fiber: parsed.fiber ?? 0,
      sugar: parsed.sugar ?? 0,
      fat: parsed.fat ?? 0,
      satFat: parsed.satFat ?? 0,
      polyFat: parsed.polyFat ?? 0,
      monoFat: parsed.monoFat ?? 0,
      transFat: parsed.transFat ?? 0,
      cholesterol: parsed.cholesterol ?? 0,
      sodium: parsed.sodium ?? 0,
      potassium: parsed.potassium ?? 0,
      vitaminA: parsed.vitaminA ?? 0,
      vitaminC: parsed.vitaminC ?? 0,
      calcium: parsed.calcium ?? 0,
      iron: parsed.iron ?? 0,
    };

    if (!labelEstimate.kcal) {
      labelEstimate.kcal = estimateCaloriesFromNutrition(labelEstimate);
    }

    fillMealFormFromEstimate(labelEstimate);

    setText("mealStatus", "Label scanned. Verify and save meal.");
  } catch {
    setText("mealStatus", "OCR failed. Please fill values manually.");
  }
}

function handleMealFormSubmit(e) {
  e.preventDefault();

  const description = select("mealDescription")?.value.trim();
  if (!description) {
    alert("Please enter food description.");
    return;
  }

  const qtyInput = parseOptionalNumber("mealQty");
  const qty = Number(qtyInput || inferQuantityFromDescription(description, 100) || 100);

  const manualKcal = parseOptionalNumber("mealCalories");
  const estimated = normalizeNutrition(estimateFromFoodDb(description, qty));

  const finalNutrition = {};
  nutrientFields.forEach((field) => {
    const inputId = nutrientInputIds[field];
    const manualValue = inputId ? parseOptionalNumber(inputId) : null;
    finalNutrition[field] = Number(manualValue ?? estimated[field] ?? 0);
  });

  const correctedNutrition = applyMealSpecificSanityAdjustments(description, {
    ...finalNutrition,
    kcal: Number(manualKcal ?? estimateCaloriesFromNutrition(finalNutrition)),
  }, qty);
  const kcal = Number(manualKcal ?? correctedNutrition.kcal ?? estimateCaloriesFromNutrition(correctedNutrition));

  const editingId = state.editingMealId;
  const existingMeal = editingId ? getDayMeals().find((m) => m.id === editingId) : null;

  const meal = {
    id: existingMeal?.id || uid("meal"),
    slot: select("mealSlot")?.value || "breakfast",
    name: description,
    description,
    qty,
    kcal,
  };

  nutrientFields.forEach((field) => {
    meal[field] = Number(correctedNutrition[field] || 0);
  });

  if (existingMeal) {
    Object.assign(existingMeal, meal);
  } else {
    getDayMeals().push(meal);
  }

  persistMealHistoryEntry(meal);

  saveState();

  const wasEditing = Boolean(existingMeal);
  clearMealInputFields();
  setText(
    "mealStatus",
    `${wasEditing ? "Meal updated" : "Meal saved"} with full nutrient profile (${Math.round(qty)}g).`
  );
  renderAll();
}

function getSpeechErrorMessage(errorCode) {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission denied. Allow mic access in browser settings.";
    case "audio-capture":
      return "No microphone detected. Connect a microphone and retry.";
    case "network":
      return "Voice service network issue. Check internet and try again.";
    case "no-speech":
      return "No speech detected. Speak clearly and try again.";
    case "aborted":
      return "Voice capture stopped. Tap voice again to retry.";
    default:
      return "Could not capture voice. Try again in a quieter environment.";
  }
}

function readPermissionGranted(result) {
  if (!result) return false;
  if (typeof result.permission === "boolean") return result.permission;
  if (typeof result.permission === "string") return result.permission.toLowerCase() === "granted";
  if (typeof result.speechRecognition === "string") return result.speechRecognition.toLowerCase() === "granted";
  if (typeof result.granted === "boolean") return result.granted;
  return false;
}

async function applyVoiceMealAndRunEstimate(input, transcript, sourceLabel) {
  input.value = transcript;
  input.dispatchEvent(new Event("input", { bubbles: true }));

  if (input.id !== "mealDescription") {
    setText("mealStatus", `${sourceLabel} captured.`);
    return;
  }

  setText("mealStatus", `${sourceLabel} captured. Running AI estimate...`);
  showToast(`${sourceLabel} captured. Estimating meal...`, "success");
  await aiEstimateMeal();
}

async function startNativeVoiceInput(targetInputId = "mealDescription") {
  const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
  const speechPlugin = window.Capacitor?.Plugins?.SpeechRecognition;
  const input = select(targetInputId);
  if (!isNativeApp || !speechPlugin || !input) return false;

  try {
    const availability = await speechPlugin.available();
    if (!availability?.available) {
      const message = "Speech recognition is not available on this device.";
      showToast(message, "error");
      setText("mealStatus", message);
      return true;
    }

    let hasPermissionResult = null;
    if (typeof speechPlugin.hasPermission === "function") {
      hasPermissionResult = await speechPlugin.hasPermission();
    } else if (typeof speechPlugin.checkPermissions === "function") {
      hasPermissionResult = await speechPlugin.checkPermissions();
    }

    let granted = readPermissionGranted(hasPermissionResult);
    if (!granted) {
      let requested = null;
      if (typeof speechPlugin.requestPermission === "function") {
        requested = await speechPlugin.requestPermission();
      } else if (typeof speechPlugin.requestPermissions === "function") {
        requested = await speechPlugin.requestPermissions();
      }
      granted = readPermissionGranted(requested);
    }

    if (!granted) {
      const message = "Microphone permission denied. Enable it in app permissions.";
      showToast(message, "error");
      setText("mealStatus", message);
      return true;
    }

    setText("mealStatus", "Listening with native microphone... speak your meal now.");

    const transcript = await new Promise((resolve, reject) => {
      let settled = false;
      let timer = null;
      let listener = null;
      let bestTranscript = "";

      const cleanup = async () => {
        if (timer) clearTimeout(timer);
        try {
          await speechPlugin.stop();
        } catch {}
        if (listener?.remove) {
          try {
            await listener.remove();
          } catch {}
        }
      };

      const resolveOnce = async (value) => {
        if (settled) return;
        settled = true;
        await cleanup();
        resolve(value);
      };

      const rejectOnce = async (error) => {
        if (settled) return;
        settled = true;
        await cleanup();
        reject(error);
      };

      (async () => {
        try {
          listener = await speechPlugin.addListener("partialResults", (event) => {
            const first = String(event?.matches?.[0] || "").trim();
            if (first) {
              if (first.length > bestTranscript.length) bestTranscript = first;
            }
          });

          timer = setTimeout(() => {
            if (bestTranscript) {
              resolveOnce(bestTranscript);
            } else {
              rejectOnce(new Error("no-speech"));
            }
          }, 18000);

          const started = await speechPlugin.start({
            language: "en-IN",
            maxResults: 1,
            partialResults: true,
            popup: true,
            prompt: "Describe your meal",
          });

          const direct = String(started?.matches?.[0] || "").trim();
          if (direct) {
            resolveOnce(direct);
          } else if (bestTranscript) {
            resolveOnce(bestTranscript);
          }
        } catch (error) {
          rejectOnce(error);
        }
      })();
    });

    const finalText = String(transcript || "").trim();
    if (!finalText) {
      const message = "No speech captured. Try again and speak clearly.";
      showToast(message, "error");
      setText("mealStatus", message);
      return true;
    }

    await applyVoiceMealAndRunEstimate(input, finalText, "Native voice");
    return true;
  } catch (error) {
    console.warn("Native speech recognition failed", error);
    const message = "Native speech recognition failed. Trying browser voice fallback.";
    setText("mealStatus", message);
    return false;
  }
}

async function startVoiceInput(targetInputId = "mealDescription") {
  const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());

  const nativeHandled = await startNativeVoiceInput(targetInputId);
  if (nativeHandled) return;

  if (!isNativeApp && !window.isSecureContext && location.hostname !== "localhost") {
    showToast("Voice input needs HTTPS.", "error");
    setText("mealStatus", "Voice input requires HTTPS connection.");
    return;
  }

  const input = select(targetInputId);
  if (!input) return;

  // Request microphone permission first so Android app settings show mic access.
  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "SecurityError";
      const unavailable = error?.name === "NotFoundError";
      const message = denied
        ? "Microphone permission denied. Enable it and try again."
        : unavailable
          ? "No microphone device found."
          : "Unable to access microphone.";
      showToast(message, "error");
      setText("mealStatus", message);
      return;
    }
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    const message = isNativeApp
      ? "Microphone permission is granted, but speech recognition is unavailable on this Android WebView."
      : "Voice input is not supported on this browser.";
    showToast(message, "error");
    setText("mealStatus", message);
    return;
  }

  if (activeSpeechRecognition) {
    activeSpeechRecognition.stop();
    activeSpeechRecognition = null;
  }

  const recog = new SpeechRecognition();
  activeSpeechRecognition = recog;
  recog.lang = "en-IN";
  recog.interimResults = true;
  recog.continuous = false;
  recog.maxAlternatives = 1;

  let finalTranscript = "";
  let latestTranscript = "";
  let hadError = false;

  setText("mealStatus", "Listening... describe your meal now.");

  recog.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) {
        finalTranscript += `${transcript} `;
      } else {
        interim += transcript;
      }
      if (transcript.trim().length > latestTranscript.length) {
        latestTranscript = transcript.trim();
      }
    }
    if (interim.trim()) {
      setText("mealStatus", `Listening... ${interim.trim()}`);
    }
  };

  recog.onerror = (event) => {
    hadError = true;
    const message = getSpeechErrorMessage(event.error);
    showToast(message, "error");
    setText("mealStatus", message);
  };

  recog.onend = async () => {
    if (activeSpeechRecognition === recog) {
      activeSpeechRecognition = null;
    }

    if (hadError) return;

    const transcript = finalTranscript.trim() || latestTranscript.trim();
    if (!transcript) {
      const message = "No speech captured. Try again and speak a little louder.";
      showToast(message, "error");
      setText("mealStatus", message);
      return;
    }

    await applyVoiceMealAndRunEstimate(input, transcript, "Voice");
  };

  try {
    recog.start();
  } catch {
    activeSpeechRecognition = null;
    const message = "Microphone is busy. Close other voice apps and retry.";
    showToast(message, "error");
    setText("mealStatus", message);
  }
}

function renderWeeklyPlan() {
  const container = select("weeklyPlanContainer");
  if (!container) return;

  if (!state.weeklyPlan) state.weeklyPlan = getDefaultWeeklyPlan();

  const introText = currentUser?.isAdmin
    ? "Your easy repeatable weekly plan is preloaded. Edit anything anytime."
    : "Create your own weekly plan. Type directly or use voice fill.";
  setText("weeklyPlanIntro", introText);

  select("planBuilderHint")?.classList.toggle("hidden", Boolean(currentUser?.isAdmin));

  container.innerHTML = daysOrder
    .map((day) => {
      const p = state.weeklyPlan[day] || { breakfast: "", lunch: "", snacks: "", dinner: "", notes: "" };
      return `
        <div class="day-plan">
          <h3>${day}</h3>
          <label>Breakfast<input data-plan="${day}:breakfast" value="${escapeHtml(p.breakfast)}" /></label>
          <label>Lunch<input data-plan="${day}:lunch" value="${escapeHtml(p.lunch)}" /></label>
          <label>Snacks<input data-plan="${day}:snacks" value="${escapeHtml(p.snacks)}" /></label>
          <label>Dinner<input data-plan="${day}:dinner" value="${escapeHtml(p.dinner)}" /></label>
          <label>Notes<textarea rows="2" data-plan="${day}:notes">${escapeHtml(p.notes || "")}</textarea></label>
        </div>
      `;
    })
    .join("");
}

function saveWeeklyPlan() {
  document.querySelectorAll("[data-plan]").forEach((el) => {
    const key = el.getAttribute("data-plan");
    const [day, field] = key.split(":");
    if (!state.weeklyPlan[day]) state.weeklyPlan[day] = {};
    state.weeklyPlan[day][field] = el.value;
  });
  saveState();
  showToast("Weekly plan saved!", "success");
}

function resetWeeklyPlan() {
  state.weeklyPlan = getDefaultWeeklyPlan();
  saveState();
  renderWeeklyPlan();
  showToast("Weekly plan reset.");
}

function startWeeklyPlanWizard() {
  const breakfast = prompt("Enter breakfast you can arrange daily:");
  if (!breakfast) return;
  const lunch = prompt("Enter lunch you can arrange daily:");
  if (!lunch) return;
  const snacks = prompt("Enter snacks you can arrange daily:");
  if (!snacks) return;
  const dinner = prompt("Enter dinner you can arrange daily:");
  if (!dinner) return;

  const notes = prompt("Any note for this plan? (optional)") || "Custom plan from wizard.";

  const generated = {};
  daysOrder.forEach((day) => {
    generated[day] = { breakfast, lunch, snacks, dinner, notes };
  });

  state.weeklyPlan = generated;
  saveState();
  renderWeeklyPlan();
  showToast("Custom weekly plan created!", "success");
}

function startWeeklyVoiceFill() {
  const dayInput = prompt(`Enter day name (${daysOrder.join(", ")}):`);
  if (!dayInput) return;
  const mealInput = prompt("Enter meal slot (breakfast, lunch, snacks, dinner, notes):");
  if (!mealInput) return;

  const day = daysOrder.find((d) => d.toLowerCase() === dayInput.trim().toLowerCase());
  const slot = mealInput.trim().toLowerCase();
  const validSlots = ["breakfast", "lunch", "snacks", "dinner", "notes"];

  if (!day || !validSlots.includes(slot)) {
    alert("Invalid day or slot.");
    return;
  }

  const target = document.querySelector(`[data-plan="${day}:${slot}"]`);
  if (!target) {
    alert("Could not find that field.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recog = new SpeechRecognition();
  recog.lang = "en-IN";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (event) => {
    target.value = event.results[0][0].transcript;
  };

  recog.onerror = () => {
    alert("Voice capture failed.");
  };

  recog.start();
}

function handleMorningSubmit(e) {
  e.preventDefault();
  const log = ensureGymLogForDate();

  log.morningActivityType = select("morningActivityType")?.value || "running";
  log.morningMinutes = Number(select("morningMinutes")?.value || 0);
  log.morningDone = Boolean(select("morningDone")?.checked);
  log.absDone = Boolean(select("absDone")?.checked);
  log.morningNotes = select("morningNotes")?.value || "";
  log.morningCustomActivity = String(select("morningCustomActivity")?.value || "").trim();
  log.morningCustomMet = Number(select("morningCustomMet")?.value || 6.5);

  saveState();
  renderCalorieRing();
  renderHeaderStats();
  renderDashboard();
  renderBurnPage();
  showToast("Morning check-in saved! 🌅", "success");
}

function renderMorningForm() {
  const log = ensureGymLogForDate();

  if (select("morningActivityType")) select("morningActivityType").value = log.morningActivityType || "running";
  if (select("morningMinutes")) select("morningMinutes").value = log.morningMinutes || "";
  if (select("morningDone")) select("morningDone").checked = Boolean(log.morningDone);
  if (select("absDone")) select("absDone").checked = Boolean(log.absDone);
  if (select("morningNotes")) select("morningNotes").value = log.morningNotes || "";
  if (select("morningCustomActivity")) select("morningCustomActivity").value = log.morningCustomActivity || "";
  if (select("morningCustomMet")) select("morningCustomMet").value = log.morningCustomMet || "";
}

function openMorningActivityGuide() {
  const log = ensureGymLogForDate();
  const activityType = select("morningActivityType")?.value || log.morningActivityType || "running";
  const config = morningActivityCatalog[activityType] || morningActivityCatalog.running;
  const customActivityInput = String(select("morningCustomActivity")?.value || log.morningCustomActivity || "").trim();

  const label =
    activityType === "custom" && customActivityInput
      ? customActivityInput
      : config.label;

  openExerciseModal({
    name: label,
    sets: `${Math.max(0, Number(log.morningMinutes || 20)) || 20} min`,
    cues: "Warm up first, keep posture upright, and maintain controlled breathing.",
    gifQuery: config.gifQuery,
  });
}

function handleBurnSubmit(e) {
  e.preventDefault();

  const selectedDate = select("burnDate")?.value || todayDate();
  const log = ensureGymLogForDate(selectedDate);

  log.steps = Math.max(0, Number(select("stepCount")?.value || 0));
  log.sleepHours = Math.max(0, Number(select("sleepHours")?.value || 0));

  saveState();
  renderCalorieRing();
  renderHeaderStats();
  renderBurnPage(selectedDate);
  showToast("Burn tracker updated.", "success");
}

function renderBurnPage(date = null) {
  const selectedDate = date || select("burnDate")?.value || todayDate();
  const log = ensureGymLogForDate(selectedDate);

  if (select("burnDate")) select("burnDate").value = selectedDate;
  if (select("stepCount")) select("stepCount").value = log.steps || "";
  if (select("sleepHours")) select("sleepHours").value = log.sleepHours || "";

  const burn = calculateDailyBurn(selectedDate);
  const summary = select("burnSummaryGrid");
  if (summary) {
    summary.innerHTML = `
      <div class="summary-box"><div>Morning Session</div><div>${formatNum(burn.morning, 0)} kcal</div></div>
      <div class="summary-box"><div>Abs Circuit</div><div>${formatNum(burn.abs, 0)} kcal</div></div>
      <div class="summary-box"><div>Evening Session</div><div>${formatNum(burn.evening, 0)} kcal</div></div>
      <div class="summary-box"><div>Steps Burn</div><div>${formatNum(burn.steps, 0)} kcal</div></div>
      <div class="summary-box"><div>Sleep Burn</div><div>${formatNum(burn.sleep, 0)} kcal</div></div>
      <div class="summary-box"><div>Total Burn</div><div>${formatNum(burn.total, 0)} kcal</div></div>
    `;
  }

  const insight = select("burnInsight");
  if (insight) {
    insight.textContent = `${burn.dayName}: calories burnt includes completed morning/evening workouts, abs, steps, and sleep.`;
  }
}

function handleWeightSubmit(e) {
  e.preventDefault();

  const date = select("weightDate")?.value;
  const weight = Number(select("weightValue")?.value || 0);

  if (!date || !weight) {
    alert("Please enter date and weight.");
    return;
  }

  const existing = state.weightEntries.find((w) => w.date === date);
  if (existing) {
    existing.weight = weight;
  } else {
    state.weightEntries.push({ id: uid("weight"), date, weight });
  }

  state.weightEntries = state.weightEntries.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  renderAll();
  showToast("Weight recorded! 📊", "success");
}

function renderWeightSummary() {
  const box = select("weightSummary");
  if (!box) return;

  const entries = state.weightEntries;
  if (!entries.length) {
    box.innerHTML = `<p class="muted">No weight entries yet.</p>`;
    return;
  }

  const first = entries[0];
  const last = entries[entries.length - 1];
  const change = Number(first.weight) - Number(last.weight);

  box.innerHTML = `
    <div class="summary-box"><div>Start</div><div>${formatNum(first.weight, 1)} kg</div></div>
    <div class="summary-box"><div>Current</div><div>${formatNum(last.weight, 1)} kg</div></div>
    <div class="summary-box"><div>Change</div><div style="color:${change > 0 ? "var(--success)" : "var(--danger)"};">${change > 0 ? "-" : "+"}${formatNum(Math.abs(change), 1)} kg</div></div>
  `;
}

function drawWeightChart() {
  const canvas = select("weightChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const entries = [...state.weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length < 2) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px Sora";
    ctx.fillText("Add at least 2 entries to view chart", 20, canvas.height / 2);
    return;
  }

  const weights = entries.map((e) => Number(e.weight));
  const minW = Math.min(...weights) - 0.4;
  const maxW = Math.max(...weights) + 0.4;
  const range = Math.max(0.2, maxW - minW);
  const xStep = (canvas.width - 40) / (entries.length - 1);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = 10 + (i * (canvas.height - 20)) / 4;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(canvas.width - 10, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#ff5a2a";
  ctx.lineWidth = 3;
  ctx.beginPath();

  entries.forEach((entry, i) => {
    const x = 30 + i * xStep;
    const y = 10 + ((maxW - Number(entry.weight)) / range) * (canvas.height - 20);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#0f3460";
  entries.forEach((entry, i) => {
    const x = 30 + i * xStep;
    const y = 10 + ((maxW - Number(entry.weight)) / range) * (canvas.height - 20);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressDataUrlImage(dataUrl, maxSide = 1280, quality = 0.84) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      let { width, height } = image;
      const longest = Math.max(width, height);
      if (longest > maxSide) {
        const ratio = maxSide / longest;
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed || dataUrl);
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function fileToOptimizedDataUrl(file) {
  const raw = await fileToDataUrl(file);
  return compressDataUrlImage(raw, 1024, 0.8);
}

function normalizePhotoDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return todayDate();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function analyzePhotoDataUrlWithAI(dataUrl, contextText = "") {
  const prompt = contextText
    ? `Analyze this fitness progress photo. Context: ${contextText}. Give concise practical feedback in 5 lines: posture, visible progress, focus areas, next-week action, motivation.`
    : "Analyze this fitness progress photo and give concise practical feedback in 5 lines: posture, visible progress, focus areas, next-week action, motivation.";

  const preferredModel = (state.settings.aiModel || "").trim() || "openai/gpt-4o";
  const modelCandidates = [preferredModel, "openai/gpt-4o", "openai/gpt-4o-mini"]
    .filter(Boolean)
    .filter((value, idx, arr) => arr.indexOf(value) === idx);

  let lastError = null;
  for (const model of modelCandidates) {
    try {
      const result = await callOpenRouter(
        [
          {
            role: "system",
            content:
              "You are a fitness coach. Give concise practical feedback in 5 lines: posture, visible progress, focus areas, next-week action, motivation.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        model
      );

      if (result && String(result).trim()) return result;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return "AI did not return text. Please try again.";
}

async function analyzePhotoWithAI() {
  if (!ensureApiKey("AI photo analysis")) return;

  const selectedFile = select("photoInput")?.files?.[0];
  const latestSaved = Array.isArray(state.photoEntries) && state.photoEntries.length ? state.photoEntries[0] : null;

  if (!selectedFile && !latestSaved) {
    setText("photoAiFeedback", "Select a photo first (or save one), then tap AI Analyze Photo.");
    return;
  }

  setText("photoAiFeedback", "AI is analyzing your progress photo...");

  try {
    const dataUrl = selectedFile
      ? await fileToOptimizedDataUrl(selectedFile)
      : latestSaved.image;

    const context = selectedFile
      ? `Type: ${select("photoType")?.value || "body"}; Date: ${normalizePhotoDate(select("photoDate")?.value || todayDate())}; Note: ${String(select("photoNote")?.value || "").trim() || "none"}`
      : `Saved photo. Type: ${latestSaved.type}; Date: ${normalizePhotoDate(latestSaved.date)}; Note: ${latestSaved.note || "none"}`;

    const result = await analyzePhotoDataUrlWithAI(dataUrl, context);
    setText("photoAiFeedback", result);
  } catch (error) {
    console.warn("AI photo analysis failed", error);
    setText("photoAiFeedback", "AI analysis failed. Please check API key/model or internet.");
  }
}

async function analyzeSavedPhoto(photoId) {
  const photo = (state.photoEntries || []).find((entry) => entry.id === photoId);
  if (!photo) {
    showToast("Photo not found.", "error");
    return;
  }

  if (!ensureApiKey("AI photo analysis")) return;
  setText("photoAiFeedback", "AI is analyzing selected saved photo...");

  try {
    const context = `Saved photo. Type: ${photo.type}; Date: ${normalizePhotoDate(photo.date)}; Note: ${photo.note || "none"}`;
    const result = await analyzePhotoDataUrlWithAI(photo.image, context);
    setText("photoAiFeedback", result);
    showToast("Saved photo analyzed.", "success");
  } catch (error) {
    console.warn("Saved photo analysis failed", error);
    setText("photoAiFeedback", "AI analysis failed for this saved photo.");
  }
}

function deletePhotoEntry(photoId) {
  state.photoEntries = (state.photoEntries || []).filter((entry) => entry.id !== photoId);
  saveState();
  renderPhotoSection();
  showToast("Photo deleted.", "success");
}

async function handlePhotoSubmit(e) {
  e.preventDefault();

  const file = select("photoInput")?.files?.[0];
  if (!file) {
    alert("Please select a photo first.");
    return;
  }

  try {
    const image = await fileToOptimizedDataUrl(file);
    const photoDate = normalizePhotoDate(select("photoDate")?.value || todayDate());

    state.photoEntries.unshift({
      id: uid("photo"),
      date: photoDate,
      capturedAt: new Date().toISOString(),
      type: select("photoType")?.value || "body",
      note: select("photoNote")?.value || "",
      image,
    });

    saveState();
    select("photoForm")?.reset();
    if (select("photoDate")) select("photoDate").value = todayDate();
    renderPhotoSection();
    showToast("Photo saved! 📸", "success");
  } catch (error) {
    console.warn("Photo save failed", error);
    showToast("Photo save failed. Try a smaller image.", "error");
  }
}

function renderPhotoSection() {
  const gallery = select("photoGallery");
  if (!gallery) return;

  if (!state.photoEntries.length) {
    gallery.innerHTML = `<p class="muted">No photos yet. Upload to track progress.</p>`;
    return;
  }

  gallery.innerHTML = state.photoEntries
    .map((p) => {
      const date = normalizePhotoDate(p.date);
      const typeLabel = p.type === "body" ? "Body" : "Scale";
      return `
        <div class="photo-card">
          <h3>${typeLabel} | ${date}</h3>
          <img src="${p.image}" alt="${escapeHtml(typeLabel)}" />
          <p class="muted" style="padding: 10px 10px 12px;">${escapeHtml(p.note || "No note")}</p>
          <div style="display:flex;gap:8px;padding: 0 10px 12px;">
            <button class="btn-small" onclick="analyzeSavedPhoto('${p.id}')">AI Analyze</button>
            <button class="btn-small" style="color:#f44336;" onclick="deletePhotoEntry('${p.id}')">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function handleProfileSubmit(e) {
  e.preventDefault();

  syncProfileTargetsFromFormInputs(true);
}

function syncProfileTargetsFromFormInputs(shouldPersist = false) {
  if (!state || !state.profile) return;

  state.profile.currentWeight = Number(select("currentWeight")?.value || state.profile.currentWeight);
  state.profile.goalWeight = Number(select("goalWeight")?.value || state.profile.goalWeight);
  state.profile.age = Number(select("age")?.value || state.profile.age);
  state.profile.heightCm = Number(select("heightCm")?.value || state.profile.heightCm);
  state.profile.weeklyLoss = Math.abs(Number(select("weeklyLoss")?.value || state.profile.weeklyLoss));

  const calorieOverride = parseOptionalNumber("calorieTarget");
  state.profile.manualCalorieTarget =
    calorieOverride && calorieOverride >= 1000 ? Number(calorieOverride) : 0;

  calculateTargetsFromProfile();

  if (shouldPersist) {
    saveState();
    renderAll();
    showToast("Goals updated! 🎯", "success");
    return;
  }

  renderProfileTargetsSummary();
  renderHeaderStats();
  renderDashboard();
  renderCalorieRing();
  renderNutrientSummary();
}

function handleProfileInputRecalc() {
  syncProfileTargetsFromFormInputs(false);
}

function renderProfileForm() {
  if (select("currentWeight")) select("currentWeight").value = state.profile.currentWeight;
  if (select("goalWeight")) select("goalWeight").value = state.profile.goalWeight;
  if (select("age")) select("age").value = state.profile.age;
  if (select("heightCm")) select("heightCm").value = state.profile.heightCm;
  if (select("weeklyLoss")) select("weeklyLoss").value = state.profile.weeklyLoss;
  if (select("calorieTarget")) {
    select("calorieTarget").value = state.profile.manualCalorieTarget ? Number(state.profile.manualCalorieTarget) : "";
  }

  renderProfileTargetsSummary();
}

function renderProfileTargetsSummary() {
  if (!state || !state.profile) return;

  if (select("calorieTarget")) {
    select("calorieTarget").placeholder = `Auto: ${formatNum(state.profile.recommendedCalories || state.profile.calorieTarget || 0, 0)} kcal`;
  }

  const p = state.profile;
  const box = select("targetSummary");
  if (!box) return;

  const modeLabel =
    p.goalMode === "gain" ? "Gain Target" : p.goalMode === "loss" ? "Cut Target" : "Maintenance Target";

  box.innerHTML = `
    <div class="summary-box"><div>Maintenance</div><div>${formatNum(p.maintenanceCalories, 0)} kcal</div></div>
    <div class="summary-box"><div>${modeLabel}</div><div>${formatNum(p.recommendedCalories || p.calorieTarget, 0)} kcal</div></div>
    <div class="summary-box"><div>Active Calories</div><div>${formatNum(p.calorieTarget, 0)} kcal</div></div>
    <div class="summary-box"><div>Protein</div><div>${formatNum(p.macros.proteinG, 0)} g</div></div>
    <div class="summary-box"><div>Carbs</div><div>${formatNum(p.macros.carbsG, 0)} g</div></div>
    <div class="summary-box"><div>Fat</div><div>${formatNum(p.macros.fatG, 0)} g</div></div>
  `;
}

function autoCalculateTargets() {
  state.profile.manualCalorieTarget = 0;
  calculateTargetsFromProfile();
  saveState();
  renderAll();
}

function renderApiSettings() {
  if (select("apiKeyInput")) select("apiKeyInput").value = state.settings.apiKey || "";
  const modelSelect = select("aiModelInput");
  if (modelSelect) {
    const preferredModel = String(state.settings.aiModel || DEFAULT_AI_MODEL);
    const hasOption = Array.from(modelSelect.options || []).some((option) => option.value === preferredModel);
    modelSelect.value = hasOption ? preferredModel : DEFAULT_AI_MODEL;
  }

  const status = state.settings.apiKey
    ? "API key is saved for this account."
    : "No API key saved. Core app works without AI.";
  setText("apiStatus", status);
}

function handleApiFormSubmit(e) {
  e.preventDefault();

  const apiKey = (select("apiKeyInput")?.value || "").trim();
  if (apiKey && !apiKey.startsWith("sk-or-v1-")) {
    showToast("API key should start with sk-or-v1-", "error");
    return;
  }

  state.settings.apiKey = apiKey;
  state.settings.aiModel = (select("aiModelInput")?.value || DEFAULT_AI_MODEL).trim();
  if (!state.settings.aiModel) state.settings.aiModel = DEFAULT_AI_MODEL;

  saveState();
  if (apiKey) {
    closeApiPromptModal(true);
  }
  renderApiSettings();
  showToast("AI settings saved!", "success");
}

function exportData() {
  const payload = {
    app: APP_NAME,
    userEmail: currentUser?.email,
    exportedAt: new Date().toISOString(),
    state,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dad-bod-${todayDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed?.state ? parsed.state : parsed;
      const base = currentUser?.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
      state = mergeState(base, importedState);
      saveState();
      renderAll();
      showToast("Data imported successfully!", "success");
    } catch {
      alert("Invalid JSON file format.");
    }
  };
  reader.readAsText(file);
}

function clearToday() {
  if (!confirm("Clear today's meals?")) return;
  state.mealsByDate[todayDate()] = [];
  saveState();
  renderAll();
}

function formatTimerClock(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds || 0)));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function renderWorkoutTimer() {
  const startBtn = select("timerStartBtn");
  const pauseBtn = select("timerPauseBtn");
  const resumeBtn = select("timerResumeBtn");
  const resetBtn = select("timerResetBtn");

  if (!activeWorkoutTimer) {
    setText("timerExerciseLabel", "No active timer. Tap Start Timer on any exercise.");
    setText("timerDisplay", "00:00");
    if (startBtn) startBtn.textContent = lastWorkoutTimerPreset ? "Start Last Timer" : "Start";
    if (pauseBtn) pauseBtn.disabled = true;
    if (resumeBtn) resumeBtn.disabled = true;
    if (resetBtn) resetBtn.disabled = true;
    if (startBtn) startBtn.disabled = false;
    return;
  }

  const stateLabel = activeWorkoutTimer.paused ? "paused" : "running";
  setText("timerExerciseLabel", `${activeWorkoutTimer.label} (${stateLabel})`);
  setText("timerDisplay", formatTimerClock(activeWorkoutTimer.remainingSec));
  if (startBtn) {
    startBtn.textContent = activeWorkoutTimer.paused ? "Restart" : "Restart";
    startBtn.disabled = false;
  }
  if (pauseBtn) pauseBtn.disabled = activeWorkoutTimer.paused;
  if (resumeBtn) resumeBtn.disabled = !activeWorkoutTimer.paused;
  if (resetBtn) resetBtn.disabled = false;
}

function clearWorkoutTimerState() {
  if (workoutTimerInterval) {
    clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;
  }
  activeWorkoutTimer = null;
  renderWorkoutTimer();
}

function startExerciseTimer(encodedName, seconds) {
  const label = decodeURIComponent(encodedName || "Exercise");
  const durationSec = Math.max(10, Math.round(Number(seconds || 45)));

  lastWorkoutTimerPreset = { label, durationSec };

  if (workoutTimerInterval) {
    clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;
  }

  activeWorkoutTimer = {
    label,
    initialSec: durationSec,
    remainingSec: durationSec,
    paused: false,
  };

  renderWorkoutTimer();

  workoutTimerInterval = setInterval(() => {
    if (!activeWorkoutTimer || activeWorkoutTimer.paused) return;
    activeWorkoutTimer.remainingSec -= 1;
    if (activeWorkoutTimer.remainingSec <= 0) {
      clearWorkoutTimerState();
      showToast(`${label} timer complete.`, "success");
      return;
    }
    renderWorkoutTimer();
  }, 1000);
}

function startCurrentWorkoutTimer() {
  if (activeWorkoutTimer) {
    startExerciseTimer(encodeURIComponent(activeWorkoutTimer.label), activeWorkoutTimer.initialSec || activeWorkoutTimer.remainingSec || 45);
    return;
  }

  if (lastWorkoutTimerPreset) {
    startExerciseTimer(encodeURIComponent(lastWorkoutTimerPreset.label), lastWorkoutTimerPreset.durationSec);
    return;
  }

  startExerciseTimer(encodeURIComponent("Workout Timer"), 45);
}

function pauseWorkoutTimer() {
  if (!activeWorkoutTimer) return;
  activeWorkoutTimer.paused = true;
  renderWorkoutTimer();
}

function resumeWorkoutTimer() {
  if (!activeWorkoutTimer) return;
  activeWorkoutTimer.paused = false;
  renderWorkoutTimer();
}

function resetWorkoutTimer() {
  clearWorkoutTimerState();
}

function exportStrengthCsv() {
  const rows = [];
  const entries = Object.entries(state.gymLogsByDate || {}).sort((a, b) => a[0].localeCompare(b[0]));

  entries.forEach(([date, log]) => {
    const dayName = dayNameFromDate(date);
    const workout = getEveningWorkoutForDay(dayName);
    if (!workout || workout.isOff) return;

    workout.exercises.forEach((exercise, idx) => {
      const key = `${dayName}-${idx}`;
      const done = Boolean(log?.exerciseDone?.[key]);
      const loadKg = Number(log?.exerciseWeights?.[key] || 0);
      const parsed = parseSetPrescription(exercise.sets);
      const reps = Number(parsed.repsPerSet || 0);
      const estOneRm = loadKg > 0 && reps > 0 ? loadKg * (1 + reps / 30) : 0;

      rows.push({
        date,
        day: dayName,
        split: workout.title,
        exercise: exercise.name,
        setsReps: exercise.sets,
        weightKg: loadKg > 0 ? formatNum(loadKg, 1) : "",
        completed: done ? "Yes" : "No",
        estOneRmKg: estOneRm > 0 ? formatNum(estOneRm, 1) : "",
      });
    });
  });

  if (!rows.length) {
    showToast("No strength workout data available yet.", "error");
    return;
  }

  const toCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = ["Date", "Day", "Split", "Exercise", "Prescription", "Weight (kg)", "Completed", "Est. 1RM (kg)"];
  const lines = [header.map(toCell).join(",")];

  rows.forEach((row) => {
    lines.push([
      row.date,
      row.day,
      row.split,
      row.exercise,
      row.setsReps,
      row.weightKg,
      row.completed,
      row.estOneRmKg,
    ].map(toCell).join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dad-bod-strength-${todayDate()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast("Strength CSV exported for Excel.", "success");
}

function openExerciseGuide(encodedName) {
  const exerciseName = decodeURIComponent(encodedName || "");
  const workout = findTodayWorkout();
  const exercise = workout.exercises.find((e) => e.name === exerciseName);
  if (!exercise) return;
  openExerciseModal(exercise);
}

function openAbsGuide(encodedName) {
  const exerciseName = decodeURIComponent(encodedName || "");
  const exercise = absCircuit.find((e) => e.name === exerciseName);
  if (!exercise) return;
  openExerciseModal(exercise);
}

function getExerciseSearchQuery(exerciseName) {
  const key = normalizeFoodKey(exerciseName);
  if (exerciseGifQueryOverrides[key]) return exerciseGifQueryOverrides[key];
  return `${exerciseName} exercise form`;
}

function scoreGifResult(query, result) {
  const q = normalizeFoodKey(query);
  const queryTokens = tokenizeFoodText(q);
  const title = normalizeFoodKey(result?.title || "");
  const tags = Array.isArray(result?.tags) ? result.tags.join(" ") : "";
  const desc = normalizeFoodKey(result?.content_description || "");
  const searchable = `${title} ${normalizeFoodKey(tags)} ${desc}`;

  let score = 0;
  queryTokens.forEach((token) => {
    if (searchable.includes(token)) score += 5;
  });

  if (/exercise|workout|fitness|form|training|gym/.test(searchable)) score += 12;

  if (q.includes("mountain climbers") && /cliff|hiking|everest|snow|alpinism/.test(searchable)) {
    score -= 20;
  }

  if (q.includes("march in place") && /high knees|indoor|cardio|warm up/.test(searchable)) {
    score += 10;
  }

  if (exerciseGifBlockedKeywords.some((word) => searchable.includes(word)) && !/exercise|workout|fitness/.test(searchable)) {
    score -= 8;
  }

  return score;
}

function openExerciseModal(exercise) {
  setText("modalTitle", exercise.name);
  setText("modalCues", `${exercise.sets} | ${exercise.cues}`);
  setText("modalLoading", "Loading GIF guide...");

  const gifEl = select("modalGif");
  if (gifEl) {
    gifEl.style.display = "none";
    gifEl.src = "";
    gifEl.alt = `${exercise.name} guide`;
  }

  const query = exercise.gifQuery || getExerciseSearchQuery(exercise.name);
  const videoBtn = select("modalVideoBtn");
  if (videoBtn) videoBtn.dataset.query = query;

  const modal = select("exerciseModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
  document.body.classList.add("modal-open");

  loadExerciseGif(query);
}

function closeExerciseModal() {
  const modal = select("exerciseModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");
}

async function getExerciseGifUrl(query) {
  if (gifCache[query]) return gifCache[query];

  const endpoint = `https://g.tenor.com/v1/search?q=${encodeURIComponent(
    query
  )}&key=${TENOR_PUBLIC_KEY}&limit=8&media_filter=minimal&contentfilter=high`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`GIF lookup failed: ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  const gifUrl = results
    .map((result) => ({
      url: result?.media?.[0]?.gif?.url,
      score: scoreGifResult(query, result),
    }))
    .filter((entry) => typeof entry.url === "string" && entry.url.startsWith("http"))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.url)[0];

  if (!gifUrl) throw new Error("No GIF found");

  gifCache[query] = gifUrl;
  return gifUrl;
}

function showGifFallback(query) {
  const gifEl = select("modalGif");
  if (gifEl) {
    gifEl.onload = null;
    gifEl.onerror = null;
    gifEl.src = "assets/exercise-fallback.svg";
    gifEl.style.display = "block";
  }

  const videoBtn = select("modalVideoBtn");
  if (videoBtn) videoBtn.dataset.query = query;

  setText("modalLoading", "GIF unavailable on this network. Tap Open Video Guide.");
}

async function loadExerciseGif(query) {
  const gifEl = select("modalGif");
  if (!gifEl) return;

  try {
    const gifUrl = await getExerciseGifUrl(query);

    gifEl.onload = () => {
      gifEl.style.display = "block";
      setText("modalLoading", "GIF loaded. Watch form carefully.");
    };

    gifEl.onerror = () => {
      showGifFallback(query);
    };

    gifEl.src = gifUrl;
  } catch {
    showGifFallback(query);
  }
}

function openModalVideoGuide() {
  const query = select("modalVideoBtn")?.dataset?.query || "bodyweight workout exercise form";
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  window.open(url, "_blank");
}

function renderAll() {
  if (!state) return;

  updateDateTime();
  updateBranding();
  renderHeaderStats();
  renderDashboard();
  renderCalorieRing();
  renderStreak();
  renderDietForm();
  renderMealsList();
  renderNutrientSummary();
  renderWeeklyPlan();
  renderWorkoutPreferences();
  renderTodayWorkout();
  renderAbsCircuit();
  renderMorningForm();
  renderBurnPage();
  renderWorkoutTimer();

  if (select("weightDate")) select("weightDate").value = todayDate();
  if (select("photoDate") && !select("photoDate").value) select("photoDate").value = todayDate();
  renderWeightSummary();
  drawWeightChart();
  renderPhotoSection();
  renderProfileForm();
  renderApiSettings();
}

function bindAppEvents() {
  if (appEventsBound) return;
  appEventsBound = true;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showTab(btn.getAttribute("data-tab"));
    });
  });

  select("profileForm")?.addEventListener("submit", handleProfileSubmit);
  select("autoTargetBtn")?.addEventListener("click", autoCalculateTargets);
  ["currentWeight", "goalWeight", "age", "heightCm", "weeklyLoss", "calorieTarget"].forEach((inputId) => {
    select(inputId)?.addEventListener("input", handleProfileInputRecalc);
    select(inputId)?.addEventListener("change", handleProfileInputRecalc);
  });
  select("mealForm")?.addEventListener("submit", handleMealFormSubmit);
  select("mealCancelEditBtn")?.addEventListener("click", cancelEditMeal);
  select("mealDescription")?.addEventListener("input", handleMealDescriptionInput);
  select("mealDescription")?.addEventListener("keydown", handleMealDescriptionKeydown);
  select("mealDescription")?.addEventListener("focus", handleMealDescriptionInput);
  select("mealDescription")?.addEventListener("blur", () => {
    setTimeout(() => {
      hideMealSuggestions();
    }, 120);
  });
  select("mealSuggestionBox")?.addEventListener("click", (event) => {
    const target = event.target;
    const btn = target && typeof target.closest === "function"
      ? target.closest("[data-suggestion-index]")
      : null;
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-suggestion-index"));
    if (!Number.isFinite(idx)) return;
    const selected = mealSuggestionResults[idx];
    if (selected) applyMealSuggestion(selected);
  });
  select("voiceBtn")?.addEventListener("click", () => startVoiceInput("mealDescription"));
  select("aiEstimateMealBtn")?.addEventListener("click", aiEstimateMeal);
  select("labelPhotoInput")?.addEventListener("change", handleLabelPhotoScan);

  select("savePlanBtn")?.addEventListener("click", saveWeeklyPlan);
  select("resetPlanBtn")?.addEventListener("click", resetWeeklyPlan);
  select("planWizardBtn")?.addEventListener("click", startWeeklyPlanWizard);
  select("planVoiceBtn")?.addEventListener("click", startWeeklyVoiceFill);

  select("workoutPrefsForm")?.addEventListener("submit", handleWorkoutPrefsSubmit);
  select("morningForm")?.addEventListener("submit", handleMorningSubmit);
  select("morningGuideBtn")?.addEventListener("click", openMorningActivityGuide);
  select("burnForm")?.addEventListener("submit", handleBurnSubmit);
  select("burnDate")?.addEventListener("change", () => renderBurnPage(select("burnDate")?.value || todayDate()));

  select("exportStrengthBtn")?.addEventListener("click", exportStrengthCsv);
  select("timerStartBtn")?.addEventListener("click", startCurrentWorkoutTimer);
  select("timerPauseBtn")?.addEventListener("click", pauseWorkoutTimer);
  select("timerResumeBtn")?.addEventListener("click", resumeWorkoutTimer);
  select("timerResetBtn")?.addEventListener("click", resetWorkoutTimer);

  select("weightForm")?.addEventListener("submit", handleWeightSubmit);
  select("photoForm")?.addEventListener("submit", handlePhotoSubmit);
  select("aiPhotoAnalyzeBtn")?.addEventListener("click", analyzePhotoWithAI);

  select("apiForm")?.addEventListener("submit", handleApiFormSubmit);

  select("importInput")?.addEventListener("change", importData);
  select("getApiKeyBtn")?.addEventListener("click", () => {
    window.open("https://openrouter.ai/keys", "_blank");
  });

  select("exportBtn")?.addEventListener("click", exportData);
  select("userSheetExportBtn")?.addEventListener("click", exportUserDirectoryCsv);
  select("clearDayBtn")?.addEventListener("click", clearToday);

  select("logoutBtn")?.addEventListener("click", logoutCurrentUser);

  select("modalCloseBtn")?.addEventListener("click", closeExerciseModal);
  select("modalCloseBtnBottom")?.addEventListener("click", closeExerciseModal);
  select("modalBackdrop")?.addEventListener("click", closeExerciseModal);
  select("modalVideoBtn")?.addEventListener("click", openModalVideoGuide);

  /* Policy modal */
  select("policyModalCloseBtn")?.addEventListener("click", closePolicyModal);
  select("policyModalDoneBtn")?.addEventListener("click", closePolicyModal);
  select("policyModalBackdrop")?.addEventListener("click", closePolicyModal);

  select("apiPromptCloseBtn")?.addEventListener("click", () => closeApiPromptModal(true));
  select("apiPromptDismissBtn")?.addEventListener("click", () => closeApiPromptModal(true));
  select("apiPromptSetupBtn")?.addEventListener("click", handleApiPromptGoToSetup);
  select("apiPromptBackdrop")?.addEventListener("click", () => closeApiPromptModal(true));

  /* Settings items */
  select("settingsAbout")?.addEventListener("click", openAbout);
  select("settingsHelp")?.addEventListener("click", openHelp);
  select("settingsPrivacy")?.addEventListener("click", openPrivacyPolicy);
  select("settingsTerms")?.addEventListener("click", openTerms);
  select("settingsRate")?.addEventListener("click", () => {
    showToast("Thank you! Rating will be available on Play Store soon. ⭐");
  });

  const morningAccordion = select("morningSessionAccordion");
  const eveningAccordion = select("eveningSessionAccordion");
  [morningAccordion, eveningAccordion].forEach((accordion) => {
    accordion?.addEventListener("toggle", () => {
      if (!accordion.open) return;
      [morningAccordion, eveningAccordion].forEach((other) => {
        if (other && other !== accordion) other.open = false;
      });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeExerciseModal();
      closePolicyModal();
      closeApiPromptModal(false);
    }
  });
}

function bindOnboardingEvents() {
  if (onboardingEventsBound) return;
  onboardingEventsBound = true;

  select("welcomeForm")?.addEventListener("submit", handleWelcomeSubmit);
}

function exposeWindowActions() {
  window.scrollToTab = scrollToTab;
  window.toggleExercise = toggleExercise;
  window.toggleAbsExercise = toggleAbsExercise;
  window.updateExerciseWeight = updateExerciseWeight;
  window.startExerciseTimer = startExerciseTimer;
  window.startEditMeal = startEditMeal;
  window.cancelEditMeal = cancelEditMeal;
  window.deleteMeal = deleteMeal;
  window.analyzeSavedPhoto = analyzeSavedPhoto;
  window.deletePhotoEntry = deletePhotoEntry;
  window.openExerciseGuide = openExerciseGuide;
  window.openAbsGuide = openAbsGuide;
}

function init() {
  bindOnboardingEvents();
  bindAppEvents();
  exposeWindowActions();

  loadFoodDatasetIfNeeded().catch(() => {});

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }

  const activeUser = authStore.users.find((u) => u.id === authStore.activeUserId);

  /* Splash screen timing */
  setTimeout(() => {
    hideSplash();
    if (activeUser) {
      activateUser(activeUser);
    } else {
      showAuthShell();
    }
  }, 1200);

  setInterval(updateDateTime, 30000);
}

init();
