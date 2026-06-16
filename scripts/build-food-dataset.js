#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LEGACY_PATH = path.join(ROOT, "assets", "food-dataset.json");
const OUT_PATH = path.join(ROOT, "assets", "food-dataset.json");
const CANONICAL_PATH = path.join(ROOT, "data", "food-sources", "canonical-staples.json");
const SUPPLEMENTS_PATH = path.join(ROOT, "data", "food-sources", "supplements.json");

const CANONICAL_STAPLE_KEYS = new Set([
  "egg", "eggs", "anda", "paneer", "rice", "dal", "roti", "chapati", "phulka", "paratha",
  "bread", "milk", "curd", "yogurt", "ghee", "oil", "butter", "chicken", "fish", "mutton",
  "potato", "onion", "tomato", "banana", "apple", "oats", "besan", "atta", "maida", "tofu",
  "soy", "whey", "idli", "dosa", "poha", "upma", "sambar", "rajma", "chole", "chana",
  "moong", "masoor", "toor", "urad", "indian curry gravy", "curry gravy", "boiled rice",
  "chawal", "chicken breast", "murgh", "dal cooked", "cooked dal",
]);

const DISH_PROFILES = {
  biryani: { kcal: 185, protein: 8.5, carbs: 24, fiber: 1.2, sugar: 1.5, fat: 6.5, category: "rice_dish", defaultPortionG: 250 },
  curry: { kcal: 145, protein: 9, carbs: 8, fiber: 2, sugar: 2, fat: 9, category: "curry", defaultPortionG: 200 },
  dal: { kcal: 105, protein: 7, carbs: 14, fiber: 4, sugar: 1.5, fat: 2.5, category: "dal", defaultPortionG: 180 },
  bread: { kcal: 290, protein: 9, carbs: 48, fiber: 4, sugar: 2, fat: 7, category: "bread", defaultPortionG: 80 },
  snack: { kcal: 320, protein: 6, carbs: 32, fiber: 2, sugar: 4, fat: 18, category: "snack", defaultPortionG: 100 },
  sweet: { kcal: 380, protein: 5, carbs: 52, fiber: 1, sugar: 35, fat: 16, category: "sweet", defaultPortionG: 80 },
  beverage: { kcal: 55, protein: 2.5, carbs: 7, fiber: 0, sugar: 6, fat: 1.8, category: "beverage", defaultPortionG: 240 },
  salad: { kcal: 95, protein: 4, carbs: 10, fiber: 2.5, sugar: 3, fat: 4.5, category: "salad", defaultPortionG: 150 },
  soup: { kcal: 75, protein: 3.5, carbs: 9, fiber: 1.5, sugar: 2, fat: 2.8, category: "soup", defaultPortionG: 250 },
  grill: { kcal: 210, protein: 22, carbs: 3, fiber: 0.5, sugar: 1, fat: 12, category: "grill", defaultPortionG: 150 },
};

const EXTRA_DISH_NAMES = [
  ["chicken biryani", "mutton biryani", "egg biryani", "veg biryani", "paneer biryani", "fish biryani", "hyderabadi biryani", "lucknowi biryani", "ambur biryani", "dum biryani"],
  ["butter chicken", "chicken tikka masala", "kadhai chicken", "chicken korma", "chicken chettinad", "chicken malai curry", "chicken do pyaza", "chicken lababdar", "chicken handi", "chicken sukha"],
  ["paneer butter masala", "kadhai paneer", "palak paneer", "shahi paneer", "paneer tikka masala", "paneer lababdar", "paneer korma", "paneer bhurji", "paneer pasanda", "paneer handi"],
  ["dal makhani", "dal tadka", "moong dal", "masoor dal", "toor dal", "chana dal", "urad dal", "mix dal", "dal fry", "panchmel dal"],
  ["rajma masala", "chole masala", "chana masala", "lobia curry", "kala chana curry", "white chana curry", "chickpea curry", "kidney bean curry", "matki curry", "lobia masala"],
  ["masala dosa", "plain dosa", "rava dosa", "onion dosa", "ghee roast dosa", "paper dosa", "set dosa", "mysore masala dosa", "cheese dosa", "egg dosa"],
  ["idli", "rava idli", "kanchipuram idli", "thatte idli", "mini idli", "sambar idli", "ghee idli", "vegetable idli", "oats idli", "brown rice idli"],
  ["poha", "batata poha", "kanda poha", "indori poha", "avalakki", "chivda poha", "vegetable poha", "peanut poha", "lemon poha", "corn poha"],
  ["upma", "rava upma", "vegetable upma", "oats upma", "bread upma", "quinoa upma", "tomato upma", "masala upma", "semiya upma", "broken wheat upma"],
  ["aloo paratha", "gobi paratha", "paneer paratha", "methi paratha", "onion paratha", "mooli paratha", "mix paratha", "laccha paratha", "ajwain paratha", "stuffed paratha"],
  ["samosa", "kachori", "vada pav", "pav bhaji", "dahi puri", "bhel puri", "sev puri", "pani puri", "ragda pattice", "misal pav"],
  ["jalebi", "gulab jamun", "rasgulla", "rasmalai", "kheer", "halwa", "ladoo", "barfi", "peda", "soan papdi"],
  ["lassi", "mango lassi", "sweet lassi", "salted lassi", "masala chaas", "masala chai", "filter coffee", "cold coffee", "nimbu pani", "jal jeera"],
  ["fish curry", "prawn curry", "egg curry", "mutton curry", "lamb rogan josh", "keema curry", "goat curry", "tandoori chicken", "chicken tikka", "seekh kebab"],
  ["lemon rice", "tomato rice", "curd rice", "tamarind rice", "coconut rice", "jeera rice", "veg pulao", "peas pulao", "mushroom pulao", "paneer pulao"],
  ["palak soup", "tomato soup", "sweet corn soup", "hot and sour soup", "manchow soup", "lemon coriander soup", "mushroom soup", "mixed veg soup", "chicken soup", "mutton soup"],
  ["green salad", "fruit salad", "sprout salad", "chicken salad", "paneer salad", "greek salad", "cucumber salad", "beetroot salad", "corn salad", "protein salad"],
  ["naan", "tandoori roti", "kulcha", "bhatura", "thepla", "missi roti", "makki roti", "bajra roti", "rumali roti", "tandoori naan"],
  ["medu vada", "masala vada", "sabudana vada", "dahi vada", "batata vada", "mirchi vada", "parippu vada", "keema samosa", "onion samosa", "mini samosa"],
  ["dhokla", "khandvi", "handvo", "patra", "fafda", "gathiya", "khakra", "mathri", "shakarpara", "namak pare"],
  ["chole bhature", "chana kulcha", "rajma chawal", "kadhi chawal", "curd rice meal", "sambar rice", "rasam rice", "tamarind rice meal", "lemon rice meal", "veg thali"],
  ["mutton biryani boneless", "chicken dum biryani", "fish biryani kerala", "prawn biryani", "mushroom biryani", "soya biryani", "jeera pulao meal", "kashmiri pulao", "tava pulao", "matar pulao meal"],
  ["hakka noodles", "schezwan noodles", "chow mein", "veg fried rice", "chicken fried rice", "egg fried rice", "manchurian gravy", "gobi manchurian", "paneer manchurian", "chilli chicken dry"],
  ["grilled sandwich", "veg sandwich", "paneer sandwich", "egg sandwich", "chicken sandwich", "cheese sandwich", "club sandwich", "grilled cheese", "mayo sandwich", "brown bread sandwich"],
  ["oats porridge", "daliya porridge", "suji halwa", "atta halwa", "moong dal halwa", "gajar halwa", "lauki halwa", "besan halwa", "suji upma meal", "oats upma meal"],
  ["grilled fish", "fish fry", "prawn fry", "crab curry", "surmai curry", "bangda fry", "rohu curry", "katla fish curry", "fish tikka", "tandoori pomfret"],
  ["anda bhurji", "boiled eggs meal", "egg paratha", "egg roll", "egg sandwich meal", "poached eggs", "scrambled eggs meal", "omelette meal", "egg toast", "egg maggi"],
  ["maggi noodles", "instant noodles", "cup noodles", "masala maggi", "veg maggi", "egg maggi meal", "cheese maggi", "paneer maggi", "chicken maggi", "soya maggi"],
  ["sattu drink", "aam panna", "butter milk meal", "sweet lassi meal", "mango shake", "banana shake", "chocolate shake", "cold coffee meal", "iced tea", "coconut water"],
  ["peanut chutney", "coconut chutney", "tomato chutney", "mint chutney", "tamarind chutney", "garlic chutney", "onion chutney", "coriander chutney", "pickle meal", "mixed pickle"],
  ["stuffed capsicum", "stuffed tomato", "stuffed karela", "stuffed parwal", "stuffed baingan", "mix veg sabzi", "aloo gobi", "aloo matar", "aloo beans", "aloo methi"],
  ["mushroom matar", "mushroom do pyaza", "mushroom masala", "soya chunks curry", "soya keema", "soya tikka", "soya chaap", "soya curry", "soya biryani meal", "soya roll"],
  ["paneer roll", "chicken roll", "egg roll meal", "kathi roll", "frankie roll", "veg frankie", "paneer kathi roll", "mutton roll", "seekh roll", "tikka roll"],
  ["fruit chaat", "aloo chaat", "papdi chaat", "samosa chaat", "palak chaat", "corn chaat", "sprout chaat", "chana chaat", "dahi bhalla", "raj kachori"],
  ["mysore pak", "milk cake", "kalakand", "rabri", "phirni", "sheera", "basundi", "malpua", "imarti", "balushahi"],
  ["chicken soup meal", "tomato shorba", "mutton shorba", "rasam soup", "lemon soup meal", "veg clear soup", "sweet corn veg soup", "hot sour veg soup", "noodle soup", "thukpa soup"],
];

const VEGETABLE_STAPLES = [
  ["bhindi", "okra", 33, 1.9, 7.5], ["cauliflower", "gobi", 25, 1.9, 5], ["cabbage", "patta gobi", 25, 1.3, 6],
  ["carrot", "gajar", 41, 0.9, 10], ["beans", "french beans", 31, 1.8, 7], ["peas", "matar", 81, 5.4, 14],
  ["capsicum", "shimla mirch", 31, 1, 6], ["cucumber", "kheera", 15, 0.7, 3.6], ["beetroot", "chukandar", 43, 1.6, 10],
  ["bottle gourd", "lauki", 14, 0.6, 3.4], ["bitter gourd", "karela", 34, 3.6, 7], ["ridge gourd", "turai", 18, 0.6, 3.4],
  ["eggplant", "baingan", 25, 1, 6], ["mushroom", "button mushroom", 22, 3.1, 3.3], ["broccoli", "broccoli", 34, 2.8, 7],
  ["pumpkin", "kaddu", 26, 1, 6.5], ["sweet potato", "shakarkandi", 86, 1.6, 20], ["corn", "makka", 86, 3.3, 19],
  ["garlic", "lahsun", 149, 6.4, 33], ["ginger", "adrak", 80, 1.8, 18], ["green chilli", "hari mirch", 40, 2, 9],
  ["radish", "mooli", 16, 0.7, 3.4], ["papaya", "papita", 43, 0.5, 11], ["orange", "santra", 47, 0.9, 12],
  ["grapes", "angoor", 69, 0.7, 18], ["pomegranate", "anaar", 83, 1.7, 19], ["watermelon", "tarbooj", 30, 0.6, 8],
  ["guava", "amrud", 68, 2.6, 14], ["pineapple", "ananas", 50, 0.5, 13], ["dates", "khajoor", 282, 2.5, 75],
  ["almond", "badam", 579, 21, 22], ["walnut", "akhrot", 654, 15, 14], ["cashew", "kaju", 553, 18, 30],
  ["peanut", "mungfali", 567, 26, 16], ["pistachio", "pista", 562, 20, 28], ["raisin", "kishmish", 299, 3.1, 79],
  ["sesame", "til", 573, 18, 23], ["soy chunks", "nutrela", 345, 52, 33], ["jaggery", "gur", 383, 0.4, 98],
  ["sugar", "cheeni", 387, 0, 100], ["honey", "shahad", 304, 0.3, 82], ["butter", "makhan", 717, 0.9, 0.1],
  ["cream", "malai", 340, 2.1, 2.8], ["atta", "whole wheat flour", 340, 13, 72], ["maida", "refined flour", 364, 10, 76],
  ["semolina", "suji", 360, 13, 73], ["poha dry", "flattened rice dry", 360, 6.6, 77], ["sabudana", "tapioca pearls", 358, 0.2, 88],
];

const REGIONAL_PREFIXES = ["homemade", "restaurant style", "dhaba style", "south indian", "north indian", "punjabi", "bengali", "gujarati", "maharashtrian", "hyderabadi"];

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateCalories(food) {
  return Number(food.protein || 0) * 4 + Number(food.carbs || 0) * 4 + Number(food.fat || 0) * 9;
}

function isValidFood(food) {
  const kcal = Number(food.kcal || 0);
  const protein = Number(food.protein || 0);
  const carbs = Number(food.carbs || 0);
  const fat = Number(food.fat || 0);
  if (food.perServing) return kcal >= 0 && protein >= 0 && carbs >= 0 && fat >= 0;
  if (kcal <= 0) return false;
  if (kcal < 20 && protein > 25) return false;
  if (protein > 45 && kcal < 120) return false;
  if (carbs > 90 && kcal < 80) return false;
  const macroKcal = estimateCalories(food);
  if (macroKcal > 0) {
    const ratio = kcal / macroKcal;
    if (ratio < 0.55 || ratio > 1.55) return false;
  }
  return true;
}

function sanitizeFood(raw, source = "curated") {
  const key = normalizeKey(raw.key || raw.name);
  if (!key) return null;
  const food = {
    key,
    name: String(raw.name || key),
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(normalizeKey).filter(Boolean) : [key],
    source: raw.source || source,
    category: raw.category || "dish",
    defaultPortionG: Number(raw.defaultPortionG || 0) || null,
    servingG: Number(raw.servingG || 0) || null,
    perServing: Boolean(raw.perServing),
    confidence: Number(raw.confidence || 0.85),
    kcal: Number(raw.kcal || 0),
    protein: Number(raw.protein || 0),
    carbs: Number(raw.carbs || 0),
    fiber: Number(raw.fiber || 0),
    sugar: Number(raw.sugar || 0),
    fat: Number(raw.fat || 0),
    satFat: Number(raw.satFat || 0),
    polyFat: Number(raw.polyFat || 0),
    monoFat: Number(raw.monoFat || 0),
    transFat: Number(raw.transFat || 0),
    cholesterol: Number(raw.cholesterol || 0),
    sodium: Number(raw.sodium || 0),
    potassium: Number(raw.potassium || 0),
    vitaminA: Number(raw.vitaminA || 0),
    vitaminC: Number(raw.vitaminC || 0),
    calcium: Number(raw.calcium || 0),
    iron: Number(raw.iron || 0),
  };
  food.aliases = [...new Set([key, ...food.aliases])];
  if (!isValidFood(food)) return null;
  return food;
}

function profileForDish(name) {
  const lower = name.toLowerCase();
  if (lower.includes("biryani") || lower.includes("pulao") || lower.includes("rice")) return DISH_PROFILES.biryani;
  if (lower.includes("paratha") || lower.includes("roti") || lower.includes("naan") || lower.includes("bread")) return DISH_PROFILES.bread;
  if (lower.includes("dal") || lower.includes("rajma") || lower.includes("chole") || lower.includes("chana")) return DISH_PROFILES.dal;
  if (lower.includes("dosa") || lower.includes("idli") || lower.includes("vada") || lower.includes("samosa") || lower.includes("pav")) return DISH_PROFILES.snack;
  if (lower.includes("jalebi") || lower.includes("jamun") || lower.includes("kheer") || lower.includes("halwa") || lower.includes("ladoo") || lower.includes("barfi")) return DISH_PROFILES.sweet;
  if (lower.includes("lassi") || lower.includes("chai") || lower.includes("coffee") || lower.includes("pani")) return DISH_PROFILES.beverage;
  if (lower.includes("salad")) return DISH_PROFILES.salad;
  if (lower.includes("soup")) return DISH_PROFILES.soup;
  if (lower.includes("tikka") || lower.includes("kebab") || lower.includes("grill")) return DISH_PROFILES.grill;
  if (lower.includes("curry") || lower.includes("masala") || lower.includes("korma") || lower.includes("handi")) return DISH_PROFILES.curry;
  return DISH_PROFILES.curry;
}

function generateVegetableStaples() {
  return VEGETABLE_STAPLES.map(([key, alias, kcal, protein, carbs]) =>
    sanitizeFood({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      aliases: [key, alias.toLowerCase()],
      source: "canonical",
      category: "vegetable",
      defaultPortionG: 100,
      confidence: 0.93,
      kcal,
      protein,
      carbs,
      fiber: Math.min(8, carbs * 0.12),
      sugar: Math.min(12, carbs * 0.15),
      fat: Math.max(0.1, kcal * 0.02),
    }, "canonical")
  ).filter(Boolean);
}

function generateExtraDishes() {
  const foods = [];
  EXTRA_DISH_NAMES.forEach((group, groupIndex) => {
    group.forEach((name, itemIndex) => {
      const profile = profileForDish(name);
      const variance = 0.92 + ((groupIndex + itemIndex) % 7) * 0.025;
      const base = sanitizeFood({
        key: name,
        name,
        aliases: [name],
        source: "generated",
        category: profile.category,
        defaultPortionG: profile.defaultPortionG,
        confidence: 0.72,
        kcal: Math.round(profile.kcal * variance * 10) / 10,
        protein: Math.round(profile.protein * variance * 10) / 10,
        carbs: Math.round(profile.carbs * variance * 10) / 10,
        fiber: profile.fiber,
        sugar: profile.sugar,
        fat: Math.round(profile.fat * variance * 10) / 10,
      }, "generated");
      if (base) foods.push(base);

      REGIONAL_PREFIXES.forEach((prefix, prefixIndex) => {
        const regionalName = `${prefix} ${name}`;
        const regionalVariance = variance + (prefixIndex % 5) * 0.012;
        const regional = sanitizeFood({
          key: regionalName,
          name: regionalName,
          aliases: [regionalName, name],
          source: "generated",
          category: profile.category,
          defaultPortionG: profile.defaultPortionG,
          confidence: 0.68,
          kcal: Math.round(profile.kcal * regionalVariance * 10) / 10,
          protein: Math.round(profile.protein * regionalVariance * 10) / 10,
          carbs: Math.round(profile.carbs * regionalVariance * 10) / 10,
          fiber: profile.fiber,
          sugar: profile.sugar,
          fat: Math.round(profile.fat * regionalVariance * 10) / 10,
        }, "generated");
        if (regional) foods.push(regional);
      });
    });
  });
  return foods;
}

function loadJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mergeFoods(allFoods) {
  const byKey = new Map();
  const blockedAliases = new Set();
  const stats = {
    rejected: 0,
    blockedAliases: 0,
    duplicates: 0,
  };

  allFoods.forEach((rawFood) => {
    const food = sanitizeFood(rawFood, rawFood?.source || "merged");
    if (!food) {
      stats.rejected += 1;
      return;
    }
    if (byKey.has(food.key)) {
      stats.duplicates += 1;
    }
    byKey.set(food.key, food);
  });

  const aliasOwners = {};
  [...byKey.values()].forEach((food) => {
    food.aliases.forEach((alias) => {
      if (CANONICAL_STAPLE_KEYS.has(alias) && food.key !== alias && food.key.split(" ").length > 1) {
        stats.blockedAliases += 1;
        blockedAliases.add(`${alias} -> ${food.key}`);
        return;
      }
      if (!aliasOwners[alias] || food.confidence >= (aliasOwners[alias].confidence || 0)) {
        aliasOwners[alias] = food;
      }
    });
  });

  [...byKey.values()].forEach((food) => {
    food.aliases = [...new Set(food.aliases.map(normalizeKey).filter(Boolean))].filter((alias) => {
      if (CANONICAL_STAPLE_KEYS.has(alias) && food.key !== alias && food.key.split(" ").length > 1) {
        stats.blockedAliases += 1;
        blockedAliases.add(`${alias} -> ${food.key}`);
        return false;
      }
      return true;
    });
  });

  return {
    foods: [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)),
    stats,
    blockedAliases: [...blockedAliases],
    aliasOwners,
  };
}

function main() {
  const legacy = loadJson(LEGACY_PATH, { foods: [] });
  const canonical = loadJson(CANONICAL_PATH, []);
  const supplements = loadJson(SUPPLEMENTS_PATH, []);
  const generated = generateExtraDishes();
  const vegetableStaples = generateVegetableStaples();

  const legacyFoods = (Array.isArray(legacy.foods) ? legacy.foods : []).filter((food) =>
    ["csv", "xls", "csv+xls"].includes(String(food?.source || ""))
  );

  const mergedInput = [
    ...legacyFoods,
    ...generated,
    ...vegetableStaples,
    ...canonical,
    ...supplements,
  ];

  const { foods, stats, blockedAliases } = mergeFoods(mergedInput);

  const payload = {
    version: 2,
    generatedAt: new Date().toISOString(),
    sourceFiles: {
      legacy: "assets/food-dataset.json",
      canonical: "data/food-sources/canonical-staples.json",
      supplements: "data/food-sources/supplements.json",
      generated: "scripts/build-food-dataset.js",
    },
    stats: {
      totalFoods: foods.length,
      legacyRows: legacyFoods.length,
      canonicalRows: canonical.length,
      supplementRows: supplements.length,
      generatedRows: generated.length,
      vegetableRows: vegetableStaples.length,
      rejectedRows: stats.rejected,
      blockedAliases: stats.blockedAliases,
      duplicateKeys: stats.duplicates,
    },
    blockedAliases,
    foods,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Food dataset written: ${foods.length} foods -> ${OUT_PATH}`);
  console.log(JSON.stringify(payload.stats, null, 2));
}

main();
