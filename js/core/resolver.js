/* Dad Bod — meal resolution engine.
 *
 * Turns a free-text meal description ("200g paneer with 2 roti") into a full
 * nutrition estimate by decomposing it into measured, counted, and named
 * components, matching each against the food dataset, and applying
 * dish-specific sanity caps. Purely local — no network required.
 */

import {
  nutrientFields,
  normalizeNutrition,
  withNutritionDefaults,
  zeroNutritionTotals,
  addNutritionTotals,
  scaleNutrition,
  estimateCaloriesFromNutrition,
} from "./nutrition.js";
import {
  normalizeFoodKey,
  tokenizeFoodText,
  findBestFoodMatch,
  findTopFoodMatches,
  getBestFoodMatchScore,
  getFoodMetaForKey,
  getFoodDisplayName,
  getDefaultPortionGrams,
  getMergedFoodDb,
  genericFoodTokens,
} from "./dataset.js";

const massDefaultFoodPattern = /(paneer|chicken|fish|mutton|lamb|beef|pork|rice|dal|lentil|curd|yogurt|milk|tofu|soya|soy|meat|cheese|potato|oats|besan|atta|maida|semolina|suji|poha|upma|khichdi|biryani|pulao)/i;

const countBasedFoodPattern = /(eggs?|rotis?|chapatis?|chappatis?|slices?|bananas?|tablets?|capsules?|scoops?)\b/i;

const STAPLE_INGREDIENT_RESOLVERS = [
  { test: /^(paneer|cottage cheese|indian cottage cheese)$/, key: "paneer", block: /(curry|masala|bhurji|tikka|korma|biryani|roll|sandwich|salad|paratha|kofta|handi|do pyaza|jalfrezi|palak|matar|butter|cutlet|kheer|samosa)/ },
  { test: /^(egg|eggs|anda|whole egg|boiled egg)$/, key: "egg", block: /(curry|bhurji|omelet|omlette|omelette|roll|sandwich|biryani|fried)/ },
  { test: /^(chicken breast|chicken|murgh|grilled chicken|boiled chicken)$/, key: "chicken breast cooked", fallback: "chicken", block: /(curry|biryani|tikka|korma|roll|sandwich|soup|fried|manchurian|65)/ },
  { test: /^(fish|rohu|bangda|surmai|pomfret)$/, key: "fish", block: /(curry|fry|biryani|roll|fried|manchurian)/ },
  { test: /^(mutton|lamb|goat|keema)$/, key: "mutton", block: /(curry|biryani|roll|korma|kebab)/ },
  { test: /^(tofu|soya|soy)$/, key: "tofu", block: /(curry|roll|manchurian|fried)/ },
  { test: /^(rice|chawal|boiled rice|cooked rice|steamed rice)$/, key: "boiled rice", fallback: "rice", block: /(biryani|pulao|fried|lemon|jeera|curd)/ },
  { test: /^(dal|lentil|arhar|toor|moong dal|masoor dal)$/, key: "dal cooked", fallback: "dal", block: /(biryani|pakora|vada|halwa)/ },
];

/* ---- Quantity parsing ---- */

export function parseMealQuantity(rawValue, description = "") {
  const raw = String(rawValue ?? "").trim();
  if (!raw) return null;

  const unitMatch = raw.match(/^\s*(\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms|g|gram|grams|gm|ml|l|litre|liter|tablet|tablets|tab|capsule|capsules|cap|scoop|scoops|piece|pieces|count)?\s*$/i);
  if (unitMatch) {
    const value = Number(unitMatch[1]);
    if (!Number.isFinite(value) || value <= 0) return null;
    const unitToken = String(unitMatch[2] || "").toLowerCase();
    if (unitToken === "kg" || unitToken === "kilogram" || unitToken === "kilograms") {
      return { value: value * 1000, unit: "g", rawValue: value, rawUnit: unitToken };
    }
    if (["g", "gram", "grams", "gm", "ml", "l", "litre", "liter"].includes(unitToken)) {
      const grams = unitToken === "l" || unitToken === "litre" || unitToken === "liter" ? value * 1000 : value;
      return { value: grams, unit: "g", rawValue: value, rawUnit: unitToken || "g" };
    }
    if (["tablet", "tablets", "tab", "capsule", "capsules", "cap", "scoop", "scoops", "piece", "pieces", "count"].includes(unitToken)) {
      return { value, unit: "count", rawValue: value, rawUnit: unitToken };
    }
    return { value, unit: null, rawValue: value, rawUnit: null };
  }

  const numericOnly = Number(raw);
  if (Number.isFinite(numericOnly) && numericOnly > 0) {
    return { value: numericOnly, unit: null, rawValue: numericOnly, rawUnit: null };
  }

  return null;
}

export function descriptionHasExplicitGrams(description) {
  return /(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|ml|l|litre|liter)\b/i.test(String(description || ""));
}

export function descriptionHasExplicitCount(description) {
  return /(\d+(?:\.\d+)?)\s*(?:(?:whole\s+wheat|wheat|plain|buttered|tandoori)\s+)?(egg|eggs|roti|rotis|chapati|chapatis|chappati|chappatis|slice|slices|banana|bananas|piece|pieces)\b/i.test(
    String(description || "")
  );
}

export function describesCountBasedFood(description) {
  return /(eggs?|roti|rotis|chapati|chapatis|chappati|chappatis|slice|slices|banana|bananas)\b/i.test(
    String(description || "")
  );
}

export function resolveMealQuantityInput(description, qtyInput) {
  const parsed = typeof qtyInput === "object" && qtyInput !== null
    ? qtyInput
    : parseMealQuantity(qtyInput, description);
  if (!parsed) return null;

  const explicitQty = Number(parsed.value);
  if (!Number.isFinite(explicitQty) || explicitQty <= 0) return null;

  const text = String(description || "").trim();
  if (descriptionHasExplicitGrams(text)) return explicitQty;

  if (parsed.unit === "g") return explicitQty;
  if (parsed.unit === "count") {
    if (/^(eggs?|anda)\s*$/i.test(normalizeFoodKey(text))) return explicitQty * 50;
    if (/^(roti|rotis|chapati|chapatis|chappati|chappatis|phulka)\s*$/i.test(normalizeFoodKey(text))) {
      return explicitQty * 40;
    }
    if (/^bananas?\s*$/i.test(normalizeFoodKey(text))) return explicitQty * 118;
    const meta = getFoodMetaForKey(text);
    if (meta?.perServing && meta?.servingG) return explicitQty * Number(meta.servingG);
    if (countBasedFoodPattern.test(text) && explicitQty <= 30) {
      if (/\beggs?\b|\banda\b/i.test(text)) return explicitQty * 50;
      if (/(roti|chapati|chappati|phulka)/i.test(text)) return explicitQty * 40;
    }
    return explicitQty;
  }

  const normalized = normalizeFoodKey(text);
  const hasCountInText = descriptionHasExplicitCount(text);

  if (!hasCountInText && explicitQty <= 30 && Number.isInteger(explicitQty)) {
    if (/^eggs?\s*$|^anda\s*$/i.test(normalized)) return explicitQty * 50;
    if (/^(roti|rotis|chapati|chapatis|chappati|chappatis|phulka)\s*$/i.test(normalized)) return explicitQty * 40;
    if (/^bananas?\s*$/i.test(normalized)) return explicitQty * 118;
    if (/\beggs?\b|\banda\b/i.test(normalized) && !/\d/.test(normalized.replace(/\beggs?\b|\banda\b/gi, "")) && explicitQty <= 12) {
      return explicitQty * 50;
    }
    if (countBasedFoodPattern.test(text) && describesCountBasedFood(text)) {
      if (/\beggs?\b|\banda\b/i.test(normalized)) return explicitQty * 50;
      if (/(roti|chapati|chappati|phulka)/i.test(normalized)) return explicitQty * 40;
    }
  }

  if (hasCountInText && explicitQty >= 50) return explicitQty;

  if (!hasCountInText && explicitQty <= 30 && describesCountBasedFood(text)) {
    if (/\beggs?\b|\banda\b/i.test(normalized)) return explicitQty * 50;
    if (/(roti|chapati|chappati|phulka)/i.test(normalized)) return explicitQty * 40;
  }

  return explicitQty;
}

export function inferQuantityFromDescription(description, fallback = null) {
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
    /(\d+(?:\.\d+)?)\s*(?:(?:whole\s+wheat|wheat|plain|buttered|tandoori)\s+)?(egg|eggs|roti|rotis|chapati|chapatis|chappati|chappatis|slice|slices|banana|bananas|piece|pieces)\b/i
  );
  if (countMatch) {
    const count = Number(countMatch[1]);
    const unit = countMatch[2].toLowerCase();
    const perUnit =
      unit.includes("egg") ? 50 :
      unit.includes("roti") || unit.includes("chapati") || unit.includes("chappati") ? 40 :
      unit.includes("slice") ? 30 :
      unit.includes("banana") ? 118 :
      60;
    return count * perUnit;
  }

  const halfMatch = text.match(/half\s+(egg|roti|chapati|banana|cup)/i);
  if (halfMatch) {
    const unit = halfMatch[1].toLowerCase();
    return unit.includes("egg") ? 25 :
      unit.includes("roti") || unit.includes("chapati") ? 20 :
      unit.includes("banana") ? 59 :
      unit.includes("cup") ? 120 :
      50;
  }

  if (Number.isFinite(Number(fallback)) && Number(fallback) > 0) return Number(fallback);
  return null;
}

export function inferTopLevelMealQuantity(description) {
  const text = String(description || "").trim().toLowerCase();
  if (!text) return null;

  const topLevelMatch = text.match(/^\s*(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|ml|l|litre|liter|cup|cups|tbsp|tablespoon|tsp|teaspoon)\b/i);
  if (!topLevelMatch) return null;
  return inferQuantityFromDescription(topLevelMatch[0], null);
}

/* ---- Unknown-food heuristics ---- */

export function estimateUnknownFood(description, grams) {
  const text = String(description || "").toLowerCase();
  let profile = withNutritionDefaults({
    kcal: 195, protein: 9, carbs: 22, fiber: 2, sugar: 3, fat: 7, satFat: 2,
    polyFat: 1.2, monoFat: 2.8, transFat: 0.05, cholesterol: 18, sodium: 220,
    potassium: 220, vitaminA: 60, vitaminC: 4, calcium: 70, iron: 1.5,
  });

  if (/(salad|vegetable|veggie|soup)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 85, protein: 3.5, carbs: 13, fiber: 3.5, sugar: 3.5, fat: 1.8,
      satFat: 0.3, polyFat: 0.5, monoFat: 0.6, transFat: 0, cholesterol: 0,
      sodium: 130, potassium: 280, vitaminA: 180, vitaminC: 14, calcium: 55, iron: 1.2,
    });
  } else if (/(cooking oil|oil\/butter|butter|ghee)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 884, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 100, satFat: 45,
      polyFat: 12, monoFat: 38, transFat: 0, cholesterol: 0, sodium: 2,
      potassium: 0, vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0,
    });
  } else if (/(chicken|fish|egg|paneer|tofu|dal|lentil|bean|protein)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 170, protein: 19, carbs: 8, fiber: 2, sugar: 1.8, fat: 7, satFat: 2,
      polyFat: 1.5, monoFat: 2.8, transFat: 0.05, cholesterol: 55, sodium: 180,
      potassium: 320, vitaminA: 90, vitaminC: 4, calcium: 95, iron: 2.2,
    });
  } else if (/(fried|pakora|samosa|fries|chips|burger|pizza)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 290, protein: 8, carbs: 24, fiber: 2, sugar: 3, fat: 18, satFat: 5,
      polyFat: 4.5, monoFat: 6.2, transFat: 0.3, cholesterol: 35, sodium: 430,
      potassium: 220, vitaminA: 50, vitaminC: 3, calcium: 75, iron: 1.4,
    });
  } else if (/(fruit|apple|orange|banana|papaya|berries|mango)/i.test(text)) {
    profile = withNutritionDefaults({
      kcal: 90, protein: 1.2, carbs: 23, fiber: 2.8, sugar: 14, fat: 0.5,
      satFat: 0.1, polyFat: 0.1, monoFat: 0.1, transFat: 0, cholesterol: 0,
      sodium: 5, potassium: 260, vitaminA: 40, vitaminC: 24, calcium: 25, iron: 0.6,
    });
  }

  return scaleNutrition(profile, grams);
}

/* ---- Sanity adjustments ---- */

export function applyMealSpecificSanityAdjustments(description, nutrition, gramsHint) {
  const adjusted = normalizeNutrition(nutrition);
  const text = normalizeFoodKey(description);
  const totalGrams = Math.max(1, Number(gramsHint || inferQuantityFromDescription(description, 100) || 100));

  const massBasedProteinCap = (totalGrams / 100) * 28;
  if (adjusted.protein > massBasedProteinCap) adjusted.protein = massBasedProteinCap;

  const massBasedFatCap = (totalGrams / 100) * 45;
  if (adjusted.fat > massBasedFatCap) adjusted.fat = massBasedFatCap;

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
  const rotiCountMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(?:(?:whole\s+wheat|wheat|plain|buttered|tandoori)\s+)?(roti|rotis|chapati|chapatis|chappati|chappatis)\b/i
  );
  const rotiCount = rotiCountMatch ? Number(rotiCountMatch[1]) : 0;

  if (eggCount > 0 && /egg curry/.test(text)) {
    const gravyAllowance = Math.min(4, Math.max(1, totalGrams / 200));
    const realisticProteinCap = eggCount * 6.5 + gravyAllowance;
    if (adjusted.protein > realisticProteinCap) {
      adjusted.protein = realisticProteinCap;
    }
  }

  if (eggCount > 0 && /(omelet|omlette|omelette|bhurji|scramble|fried egg|egg fry)/i.test(text)) {
    const realisticProteinCap = eggCount * 6.5 + rotiCount * 3 + 2;
    const realisticFatCap = eggCount * 5.5 + rotiCount * 1.5 + 14;
    const realisticKcalCap = eggCount * 72 + rotiCount * 120 + 130;
    if (adjusted.protein > realisticProteinCap) adjusted.protein = realisticProteinCap;
    if (adjusted.fat > realisticFatCap) adjusted.fat = realisticFatCap;
    if (adjusted.kcal > realisticKcalCap * 1.12) adjusted.kcal = Math.round(realisticKcalCap);
  } else if (eggCount > 0 && !/curry/.test(text)) {
    const plainEggProteinCap = eggCount * 6.5 + rotiCount * 3 + 1;
    const plainEggFatCap = eggCount * 5.5 + rotiCount * 1.5 + 2;
    if (adjusted.protein > plainEggProteinCap) adjusted.protein = plainEggProteinCap;
    if (adjusted.fat > plainEggFatCap) adjusted.fat = plainEggFatCap;
  }

  if (/^(paneer|cottage cheese)$/i.test(text.trim()) || (/\bpaneer\b/i.test(text) && !/(curry|masala|bhurji|tikka|korma|biryani|roll|sandwich|salad|paratha)/i.test(text))) {
    const paneerProteinCap = (totalGrams / 100) * 20;
    const paneerCarbCap = (totalGrams / 100) * 4;
    const paneerFatCap = (totalGrams / 100) * 24;
    if (adjusted.protein > paneerProteinCap) adjusted.protein = paneerProteinCap;
    if (adjusted.carbs > paneerCarbCap) adjusted.carbs = paneerCarbCap;
    if (adjusted.fat > paneerFatCap) adjusted.fat = paneerFatCap;
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

/* ---- Measured / counted component extraction ---- */

const MEASURED_UNIT_PATTERN = "(?:kg|kilogram|kilograms|g|gram|grams|gm|ml|l|litre|liter|cup|cups|tbsp|tablespoons?|tsp|teaspoons?)";

function parseMeasuredUnitToGrams(value, unit) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const token = String(unit || "").toLowerCase();
  if (token === "kg" || token === "kilogram" || token === "kilograms") return amount * 1000;
  if (token === "l" || token === "litre" || token === "liter") return amount * 1000;
  if (token === "cup" || token === "cups") return amount * 240;
  if (token === "tbsp" || token === "tablespoon" || token === "tablespoons") return amount * 15;
  if (token === "tsp" || token === "teaspoon" || token === "teaspoons") return amount * 5;
  return amount;
}

function hasSeparateIngredientWeight(mealContext, ingredientToken) {
  const token = String(ingredientToken || "").trim();
  if (!token) return false;
  const pattern = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\s*(?:kg|g|gram|grams|gm|ml|l|litre|liter)\\s*(?:of\\s+)?${token}\\b`,
    "i"
  );
  return pattern.test(String(mealContext || ""));
}

function resolveStapleIngredientKey(foodText, db) {
  const food = normalizeFoodKey(foodText);
  for (const resolver of STAPLE_INGREDIENT_RESOLVERS) {
    if (!resolver.test.test(food)) continue;
    if (resolver.block.test(food)) continue;
    if (db[resolver.key]) return resolver.key;
    if (resolver.fallback && db[resolver.fallback]) return resolver.fallback;
  }
  return null;
}

function resolveMeasuredFoodKey(foodText, mealContext, db) {
  const food = normalizeFoodKey(foodText);
  if (!food) return null;

  const stapleKey = resolveStapleIngredientKey(food, db);
  if (stapleKey) return stapleKey;

  const sauceDish = /curry|gravy|masala|salan|sabzi/.test(food);
  if (sauceDish) {
    if (/paneer/.test(food) && hasSeparateIngredientWeight(mealContext, "paneer")) {
      return findBestFoodMatch("indian curry gravy", db) || "indian curry gravy";
    }
    if (/chicken/.test(food) && hasSeparateIngredientWeight(mealContext, "chicken")) {
      return findBestFoodMatch("indian curry gravy", db) || "indian curry gravy";
    }
    if (/(egg|anda)/.test(food) && hasSeparateIngredientWeight(mealContext, "egg")) {
      return findBestFoodMatch("indian curry gravy", db) || "indian curry gravy";
    }
    if (/paneer/.test(food)) return findBestFoodMatch("paneer curry", db) || "paneer curry";
    if (/(egg|anda)/.test(food)) return findBestFoodMatch("egg curry", db) || "egg curry";
    if (/chicken/.test(food)) return findBestFoodMatch("chicken curry", db) || findBestFoodMatch("butter chicken", db);
    if (/fish/.test(food)) return findBestFoodMatch("fish curry", db);
    if (/mutton|lamb|goat/.test(food)) return findBestFoodMatch("mutton curry", db);
    if (/dal|lentil/.test(food)) return findBestFoodMatch("dal cooked", db) || "dal cooked";
    const gravy = findBestFoodMatch("indian curry gravy", db) || "indian curry gravy";
    if (db[gravy]) return gravy;
  }

  const direct = findBestFoodMatch(food, db);
  if (direct) return direct;

  const tokens = tokenizeFoodText(food);
  if (tokens.length === 1) return findBestFoodMatch(tokens[0], db);
  return null;
}

function pushMeasuredComponent(components, foodLabel, grams, mealContext, db) {
  const safeGrams = Math.max(1, Number(grams || 0));
  const matchedKey = resolveMeasuredFoodKey(foodLabel, mealContext, db);
  if (matchedKey && db[matchedKey]) {
    const meta = getFoodMetaForKey(matchedKey);
    components.push({
      source: "dataset",
      label: `${foodLabel.trim()} (${Math.round(safeGrams)}g)`,
      grams: safeGrams,
      matchedKey,
      nutrition: scaleNutrition(db[matchedKey], safeGrams, meta),
    });
    return;
  }

  components.push({
    source: "unknown",
    label: String(foodLabel || "unknown").trim(),
    grams: safeGrams,
  });
}

function trimMeasuredFoodLabel(rawLabel) {
  return String(rawLabel || "")
    .replace(/\s+(with|and|plus|of|in)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractExplicitMeasuredComponents(description, db) {
  const text = String(description || "");
  const components = [];
  const matchedRanges = [];

  const markRange = (start, end) => {
    matchedRanges.push([start, end]);
  };

  const overlapsExisting = (start, end) =>
    matchedRanges.some(([s, e]) => start < e && end > s);

  const qtyFirstPattern = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\s*(${MEASURED_UNIT_PATTERN})\\s*(?:of\\s+)?([a-z][a-z0-9\\s/-]{1,55})`,
    "gi"
  );
  let match = qtyFirstPattern.exec(text);
  while (match) {
    const [full, qtyText, unit, foodText] = match;
    const start = match.index;
    const end = start + full.length;
    if (!overlapsExisting(start, end)) {
      const grams = parseMeasuredUnitToGrams(qtyText, unit);
      const food = trimMeasuredFoodLabel(foodText);
      if (food && grams > 0) {
        pushMeasuredComponent(components, food, grams, text, db);
        markRange(start, end);
      }
    }
    match = qtyFirstPattern.exec(text);
  }

  const foodFirstPattern = new RegExp(
    `([a-z][a-z0-9\\s/-]{2,55}?)\\s+(\\d+(?:\\.\\d+)?)\\s*(${MEASURED_UNIT_PATTERN})\\b`,
    "gi"
  );
  match = foodFirstPattern.exec(text);
  while (match) {
    const [full, foodText, qtyText, unit] = match;
    const start = match.index;
    const end = start + full.length;
    if (!overlapsExisting(start, end)) {
      const grams = parseMeasuredUnitToGrams(qtyText, unit);
      const food = String(foodText || "").trim();
      if (food && grams > 0 && !/^(with|and|of|plus)$/i.test(food)) {
        pushMeasuredComponent(components, food, grams, text, db);
        markRange(start, end);
      }
    }
    match = foodFirstPattern.exec(text);
  }

  let remainder = text;
  matchedRanges
    .sort((a, b) => b[0] - a[0])
    .forEach(([start, end]) => {
      remainder = `${remainder.slice(0, start)} ${remainder.slice(end)}`;
    });

  remainder = remainder
    .replace(/\bwith\b/gi, " ")
    .replace(/\band\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { components, remainder };
}

function deriveCountBasedFoodConfig(unitText) {
  const unit = String(unitText || "").toLowerCase();
  if (unit.includes("egg")) return { foodLookup: "egg", gramsPerUnit: 50 };
  if (unit.includes("roti") || unit.includes("chapati") || unit.includes("chappati")) {
    return { foodLookup: "roti", gramsPerUnit: 40 };
  }
  if (unit.includes("slice")) return { foodLookup: "bread", gramsPerUnit: 30 };
  if (unit.includes("banana")) return { foodLookup: "banana", gramsPerUnit: 118 };
  return null;
}

function extractCountBasedComponents(segmentText, db) {
  let working = String(segmentText || "");
  const components = [];

  const countPattern = /(\d+(?:\.\d+)?)\s*(?:(?:whole\s+wheat|wheat|plain|buttered|tandoori)\s+)?(eggs?|rotis?|chapatis?|chappatis?|slices?|bananas?)\b/gi;
  working = working.replace(countPattern, (fullMatch, countText, unitText) => {
    const config = deriveCountBasedFoodConfig(unitText);
    const count = Number(countText);
    if (!config || !Number.isFinite(count) || count <= 0) return " ";

    const matchedKey = findBestFoodMatch(config.foodLookup, db);
    if (!matchedKey || !db[matchedKey]) return " ";

    const grams = Math.max(1, count * config.gramsPerUnit);
    const itemMeta = getFoodMetaForKey(matchedKey);
    components.push({
      source: "dataset",
      label: `${count} ${unitText}`,
      grams,
      matchedKey,
      nutrition: scaleNutrition(db[matchedKey], grams, itemMeta),
    });

    return " ";
  });

  return {
    components,
    remainder: working.replace(/\s+/g, " ").trim(),
  };
}

/* ---- Egg-dish helpers ---- */

function extractEggCount(normalizedText) {
  const match = normalizedText.match(/(\d+(?:\.\d+)?)\s*(?:eggs?|anda)\b/i);
  return match ? Number(match[1]) : 0;
}

export function isEggPreparedDish(description) {
  return /(omelet|omlette|omelette|bhurji|scrambled|fried egg|egg fry)/i.test(normalizeFoodKey(description));
}

function isOmeletteRemainder(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  return !cleaned || /^(omelet|omlette|omelette|with|and|wheat)$/i.test(cleaned);
}

export function splitMealDescription(description) {
  return String(description || "")
    .replace(/^\s*with\s+/i, "")
    .split(/\+|,|\sand\s|\s&\s|\swith\s/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/* ---- Hybrid composition ---- */

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

export function buildHybridMealComponents(description, qtyInput, db) {
  const rawText = String(description || "").trim();
  const parsedQty = typeof qtyInput === "object" && qtyInput !== null
    ? qtyInput
    : parseMealQuantity(qtyInput, rawText);
  const hasExplicitQty = Boolean(parsedQty && Number(parsedQty.value) > 0);
  const resolvedQty = hasExplicitQty ? resolveMealQuantityInput(rawText, parsedQty) : null;
  const topLevelMealQty = inferTopLevelMealQuantity(rawText);
  const hasTopLevelMealQty = Number.isFinite(topLevelMealQty) && topLevelMealQty > 0;

  const components = [];
  let workingText = rawText;
  const normalizedText = normalizeFoodKey(rawText);

  const measuredParts = extractExplicitMeasuredComponents(rawText, db);
  measuredParts.components.forEach((component) => components.push(component));
  if (measuredParts.components.length) {
    workingText = measuredParts.remainder || "";
  }

  let eggCount = extractEggCount(normalizedText);

  if (!eggCount && hasExplicitQty && parsedQty?.unit === "count" && /\beggs?\b|\banda\b/i.test(normalizedText)) {
    eggCount = Number(parsedQty.value);
  } else if (
    !eggCount &&
    hasExplicitQty &&
    parsedQty?.unit !== "g" &&
    Number.isInteger(Number(parsedQty.value)) &&
    Number(parsedQty.value) <= 12 &&
    /\beggs?\b|\banda\b/i.test(normalizedText)
  ) {
    eggCount = Number(parsedQty.value);
  }

  if (isEggPreparedDish(normalizedText) && eggCount > 0) {
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

    const fatGrams = Math.min(15, Math.max(8, eggCount * 3));
    components.push({
      source: "unknown",
      label: "cooking oil/butter",
      grams: fatGrams,
    });

    workingText = workingText
      .replace(/(\d+(?:\.\d+)?)\s*eggs?\b/gi, " ")
      .replace(/(omelet|omlette|omelette|bhurji|scrambled|fried egg|egg fry)/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

    const parsedQtyValue = Number(parsedQty?.value || 0);
    const inferredMealQty = Number(
      inferQuantityFromDescription(rawText, resolvedQty || (hasExplicitQty ? parsedQtyValue : eggGrams + 160)) ||
        resolvedQty ||
        (hasExplicitQty ? parsedQtyValue : eggGrams + 160)
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
    if (!segmentText || (isEggPreparedDish(normalizedText) && isOmeletteRemainder(segmentText))) return;

    const matchedKey = findBestFoodMatch(segmentText, db);
    const meta = matchedKey ? getFoodMetaForKey(matchedKey) : null;
    let grams = Math.max(
      1,
      Number(
        resolvedQty && segments.length === 1 && components.length === 0
          ? resolvedQty
          : inferQuantityFromDescription(segmentText, matchedKey ? getDefaultPortionGrams(matchedKey) : 100) || 100
      )
    );

    if (meta?.perServing && parsedQty?.unit === "count" && segments.length === 1 && components.length === 0) {
      grams = Math.max(1, Number(parsedQty.value) * Number(meta.servingG || 1));
    }

    if (matchedKey && db[matchedKey]) {
      components.push({
        source: "dataset",
        label: segmentText,
        grams,
        matchedKey,
        nutrition: scaleNutrition(db[matchedKey], grams, meta),
        category: meta?.category || null,
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
    const grams = Math.max(
      1,
      Number(resolvedQty || inferQuantityFromDescription(rawText, getDefaultPortionGrams(rawText)) || 100)
    );
    components.push({
      source: "unknown",
      label: rawText || "meal",
      grams,
    });
  }

  const preScaleSummary = summarizeMealComponents(components);
  const targetTotalQty = resolvedQty || (hasTopLevelMealQty ? topLevelMealQty : null);
  if (targetTotalQty && preScaleSummary.totalGrams > 0 && Math.abs(targetTotalQty - preScaleSummary.totalGrams) > 1) {
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

export function composeEstimationFromHybrid(hybrid, description, qtyInput = null) {
  const combined = zeroNutritionTotals();
  addNutritionTotals(combined, hybrid.knownTotals);

  hybrid.unknownComponents.forEach((component) => {
    addNutritionTotals(combined, estimateUnknownFood(component.label, component.grams));
  });

  const gramsHint = Math.max(
    1,
    Number(hybrid.totalGrams || inferQuantityFromDescription(description, qtyInput || 100) || qtyInput || 100)
  );

  return applyMealSpecificSanityAdjustments(description, combined, gramsHint);
}

/* Decide whether the description is understood well enough locally, or should be
 * sent to the online food parser (Edamam) for the unknown portions. */
export function needsOnlineFallback(hybrid, description, db) {
  const datasetComponents = (hybrid.components || []).filter((component) => component.source === "dataset");
  const unknownComponents = hybrid.unknownComponents || [];
  if (!unknownComponents.length) return false;

  if (!datasetComponents.length) {
    return getBestFoodMatchScore(description, db) < 24;
  }

  const unknownGrams = unknownComponents.reduce((sum, component) => sum + Number(component.grams || 0), 0);
  const totalGrams = Math.max(1, Number(hybrid.totalGrams || unknownGrams));
  if (unknownGrams / totalGrams >= 0.55) return true;

  return unknownComponents.some((component) => getBestFoodMatchScore(component.label, db) < 16);
}

export function formatHybridBreakdown(hybrid) {
  const parts = (hybrid?.components || []).map((component) => {
    const grams = Math.round(Number(component.grams || 0));
    if (component.source === "dataset") {
      const name = component.label || getFoodDisplayName(component.matchedKey) || component.matchedKey;
      return `${name} (${grams}g)`;
    }
    return `${component.label} (~${grams}g)`;
  });
  return parts.filter(Boolean).join(" + ");
}

/* One-call local estimation from a free-text description. */
export function estimateFromFoodDb(description, qtyInput = null) {
  const text = String(description || "").trim();
  const db = getMergedFoodDb();
  const hybrid = buildHybridMealComponents(text, qtyInput, db);
  return composeEstimationFromHybrid(hybrid, text, qtyInput);
}

/* Dataset-backed live search suggestions for the diet search field. */
export function buildDatasetMealSuggestions(query, limit = 6) {
  const db = getMergedFoodDb();
  const normalizedQuery = normalizeFoodKey(query);
  if (!normalizedQuery || normalizedQuery.length < 2) return [];

  const matches = findTopFoodMatches(normalizedQuery, db, limit);
  return matches
    .filter((match) => match.score >= 42)
    .map((match) => {
      const grams = Math.max(1, Number(getDefaultPortionGrams(match.key) || 100));
      const meta = getFoodMetaForKey(match.key);
      const nutrition = scaleNutrition(match.nutrition || db[match.key], grams, meta);
      const label = getFoodDisplayName(match.key);
      return {
        description: label,
        qty: grams,
        kcal: nutrition.kcal,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        nutrients: nutrition,
        source: "dataset",
        matchScore: match.score,
        matchedKey: match.key,
      };
    });
}
