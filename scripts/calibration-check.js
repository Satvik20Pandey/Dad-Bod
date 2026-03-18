const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "assets", "food-dataset.json"), "utf8"));
const foods = Array.isArray(data.foods) ? data.foods : [];

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s) {
  const stop = new Set([
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

  return normalize(s)
    .split(" ")
    .filter((x) => x && x.length > 1 && !stop.has(x));
}

function mapN(food) {
  return {
    kcal: Number(food.kcal || 0),
    protein: Number(food.protein || 0),
    carbs: Number(food.carbs || 0),
    fat: Number(food.fat || 0),
    fiber: Number(food.fiber || 0),
    sugar: Number(food.sugar || 0),
  };
}

const db = {};
for (const f of foods) {
  const aliases = [f.name, f.key, ...(Array.isArray(f.aliases) ? f.aliases : [])]
    .map(normalize)
    .filter(Boolean);
  const n = mapN(f);
  for (const a of aliases) {
    if (!db[a]) db[a] = n;
  }
}

const fallback = {
  egg: { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5, fiber: 0, sugar: 0.4 },
  "egg curry": { kcal: 171, protein: 11.5, carbs: 5.7, fat: 11.2, fiber: 1.1, sugar: 2.1 },
  rice: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1 },
  dal: { kcal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, sugar: 1.8 },
  paneer: { kcal: 265, protein: 18.3, carbs: 1.2, fat: 20.8, fiber: 0, sugar: 0.5 },
  chicken: { kcal: 239, protein: 27, carbs: 0, fat: 14, fiber: 0, sugar: 0 },
  roti: { kcal: 297, protein: 11, carbs: 58, fat: 3.6, fiber: 9.6, sugar: 2.8 },
};
for (const [k, v] of Object.entries(fallback)) db[normalize(k)] = v;

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

function scoreMatch(text, key) {
  if (text === key) return 100;
  const tks = tokenize(text);
  const kts = key.split(" ").filter(Boolean);
  const overlapTokens = kts.filter((t) => tks.includes(t));
  const overlap = overlapTokens.length;
  let score = 0;
  if (text.includes(key)) score += 60;
  if (key.includes(text)) score += 30;
  score += overlap * 9;
  if (kts.length > 1 && overlap === kts.length) score += 18;

  if (kts.length === 1 && tks.length >= 2) {
    const token = kts[0];
    if (genericFoodTokens.has(token)) score -= 22;
    if (!tks.includes(token)) score -= 30;
  }

  if (kts.length >= 2) {
    const overlapRatio = overlap / kts.length;
    if (overlapRatio >= 0.6) score += 16;
    if (overlapRatio < 0.35 && !text.includes(key)) score -= 14;
  }

  return score;
}

function findMatch(segment) {
  const t = normalize(segment);
  const tks = tokenize(t);
  let best = null;
  let bestScore = 0;
  for (const k of Object.keys(db)) {
    const s = scoreMatch(t, k);
    if (s > bestScore) {
      bestScore = s;
      best = k;
    }
  }

  if (best) {
    const kts = best.split(" ").filter(Boolean);
    if (kts.length === 1 && tks.length >= 2 && genericFoodTokens.has(kts[0])) {
      return null;
    }
  }

  return bestScore >= 16 ? best : null;
}

function inferQty(desc, fallbackQty = 100) {
  const text = String(desc || "").toLowerCase();
  const u = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|ml|l|litre|liter|cup|cups|tbsp|tablespoon|tsp|teaspoon)\b/i);
  if (u) {
    const v = Number(u[1]);
    const unit = u[2].toLowerCase();
    if (unit === "kg") return v * 1000;
    if (unit === "l" || unit === "litre" || unit === "liter") return v * 1000;
    if (unit === "cup" || unit === "cups") return v * 240;
    if (unit === "tbsp" || unit === "tablespoon") return v * 15;
    if (unit === "tsp" || unit === "teaspoon") return v * 5;
    return v;
  }

  const c = text.match(/(\d+(?:\.\d+)?)\s*(egg|eggs|roti|rotis|chapati|chapatis|slice|slices|banana|bananas|piece|pieces)\b/i);
  if (c) {
    const n = Number(c[1]);
    const unit = c[2].toLowerCase();
    const per = unit.includes("egg")
      ? 50
      : unit.includes("roti") || unit.includes("chapati")
        ? 40
        : unit.includes("slice")
          ? 30
          : unit.includes("banana")
            ? 118
            : 60;
    return n * per;
  }

  return fallbackQty;
}

function scale(n, g) {
  const f = Math.max(1, Number(g || 100)) / 100;
  return {
    kcal: n.kcal * f,
    protein: n.protein * f,
    carbs: n.carbs * f,
    fat: n.fat * f,
    fiber: n.fiber * f,
    sugar: n.sugar * f,
  };
}

function splitMeal(text) {
  return String(text || "")
    .split(/\+|,|\sand\s|\s&\s|\swith\s/i)
    .map((x) => x.trim())
    .filter(Boolean);
}

function sum(a, b) {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
    sugar: a.sugar + b.sugar,
  };
}

function adjustSanity(desc, n, grams) {
  const t = normalize(desc);
  const out = { ...n };
  const g = Math.max(1, Number(grams || 100));
  const proteinCap = (g / 100) * 28;
  if (out.protein > proteinCap) out.protein = proteinCap;

  const fatCap = (g / 100) * 45;
  if (out.fat > fatCap) out.fat = fatCap;

  const hasProteinHeavySignals = /(chicken|fish|egg|paneer|tofu|soy|dal|rajma|chana|lentil|keema|mutton)/i.test(t);
  const carbHeavyDish = /(idli|dosa|rice|chawal|pulao|biryani|poha|upma|paratha|chapati|roti|bread|khichdi|noodles)/i.test(t);
  if (carbHeavyDish && !hasProteinHeavySignals) {
    const carbDishProteinCap = (g / 100) * 10;
    if (out.protein > carbDishProteinCap) out.protein = carbDishProteinCap;
  }

  const eggMatch = t.match(/(\d+(?:\.\d+)?)\seggs?\b/i);
  const eggCount = eggMatch ? Number(eggMatch[1]) : 0;
  if (eggCount > 0 && t.includes("egg curry")) {
    const gravyAllowance = Math.min(4, Math.max(1, g / 200));
    const cap = eggCount * 6.5 + gravyAllowance;
    if (out.protein > cap) out.protein = cap;
  }

  const macroKcal = out.protein * 4 + out.carbs * 4 + out.fat * 9;
  if (!out.kcal || out.kcal < macroKcal * 0.72 || out.kcal > macroKcal * 1.45) {
    out.kcal = Math.round(macroKcal);
  }
  return out;
}

function estimateMeal(desc, explicitQty = null) {
  const parts = splitMeal(desc);
  if (!parts.length) return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };

  let total = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
  let inferredTotal = 0;

  for (const p of parts) {
    const key = findMatch(p);
    const qty = inferQty(p, 100);
    inferredTotal += qty;
    const base = key ? db[key] : { kcal: 195, protein: 9, carbs: 22, fat: 7, fiber: 2, sugar: 3 };
    total = sum(total, scale(base, qty));
  }

  if (explicitQty && inferredTotal > 0) {
    const s = explicitQty / inferredTotal;
    total = {
      kcal: total.kcal * s,
      protein: total.protein * s,
      carbs: total.carbs * s,
      fat: total.fat * s,
      fiber: total.fiber * s,
      sugar: total.sugar * s,
    };
    inferredTotal = explicitQty;
  }

  return adjustSanity(desc, total, inferredTotal);
}

function calcTargets(currentWeight, goalWeight, weeklyChange, age, heightCm) {
  const mode = goalWeight > currentWeight ? "gain" : goalWeight < currentWeight ? "loss" : "maintain";
  const bmr = Math.max(1100, Math.round(10 * currentWeight + 6.25 * heightCm - 5 * age + 5));
  const maintenance = Math.max(1300, Math.round(bmr * 1.4));
  const dailyAdj = Math.max(150, Math.min(700, Math.round((Math.abs(weeklyChange) * 7700) / 7)));
  const recommended =
    mode === "gain"
      ? maintenance + dailyAdj
      : mode === "loss"
        ? Math.max(1200, maintenance - dailyAdj)
        : maintenance;
  return { mode, maintenance, recommended };
}

const mealCases = [
  "250 ml egg curry with 2 eggs restaurant",
  "250 ml egg curry with 2 eggs homemade",
  "2 eggs + 1 roti + 200ml milk",
  "paneer butter masala 250g restaurant",
  "dal rice 350 g",
  "3 chapati + chicken curry 200 g",
  "oats 40g + milk 300ml + banana",
  "veg pulao 300g restaurant",
  "rajma chawal 350g",
  "idli sambar 250g",
];

console.log("=== MEAL CALIBRATION SNAPSHOT ===");
for (const c of mealCases) {
  const n = estimateMeal(c);
  console.log(`${c} => kcal ${n.kcal.toFixed(0)}, P ${n.protein.toFixed(1)}g, C ${n.carbs.toFixed(1)}g, F ${n.fat.toFixed(1)}g`);
}

console.log("\n=== TARGET CALC SNAPSHOT ===");
const t1 = calcTargets(82, 71, 1, 22, 180.3);
console.log(`82->71, 1kg/week => mode ${t1.mode}, maintenance ${t1.maintenance}, recommended ${t1.recommended}`);
const t2 = calcTargets(55, 80, 0.5, 24, 170);
console.log(`55->80, 0.5kg/week => mode ${t2.mode}, maintenance ${t2.maintenance}, recommended ${t2.recommended}`);
