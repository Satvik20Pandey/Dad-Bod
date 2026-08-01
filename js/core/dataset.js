/* Dad Bod — food knowledge base: 5,200+ item Indian dataset, indexing, and fuzzy matching. */

import { withNutritionDefaults } from "./nutrition.js";

/* Compact built-in staples — instant answers even before the dataset loads. */
export const builtInFoodDb = {
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
  "indian curry gravy": { kcal: 118, protein: 2.8, carbs: 7.5, fiber: 1.5, sugar: 2.5, fat: 8.2, satFat: 2.1, polyFat: 2.4, monoFat: 3.2, transFat: 0.05, cholesterol: 0, sodium: 280, potassium: 180, vitaminA: 85, vitaminC: 6, calcium: 28, iron: 0.9 },
  "paneer curry": { kcal: 176.52, protein: 7.8, carbs: 8.4, fiber: 1.4, sugar: 6.29, fat: 12.38, satFat: 4.2, polyFat: 1.8, monoFat: 3.6, transFat: 0.05, cholesterol: 18, sodium: 216, potassium: 120, vitaminA: 45, vitaminC: 20, calcium: 189, iron: 0.81 },
  "boiled rice": { kcal: 130, protein: 2.7, carbs: 28, fiber: 0.4, sugar: 0.1, fat: 0.3, satFat: 0.1, polyFat: 0.1, monoFat: 0.1, transFat: 0, cholesterol: 0, sodium: 1, potassium: 35, vitaminA: 0, vitaminC: 0, calcium: 10, iron: 1.2 },
  "chicken breast cooked": { kcal: 165, protein: 31, carbs: 0, fiber: 0, sugar: 0, fat: 3.6, satFat: 1, polyFat: 0.8, monoFat: 1.2, transFat: 0.05, cholesterol: 85, sodium: 74, potassium: 256, vitaminA: 13, vitaminC: 0, calcium: 15, iron: 1 },
  "dal cooked": { kcal: 116, protein: 9, carbs: 20, fiber: 8, sugar: 1.8, fat: 0.4, satFat: 0.1, polyFat: 0.2, monoFat: 0.1, transFat: 0, cholesterol: 0, sodium: 2, potassium: 369, vitaminA: 8, vitaminC: 1.5, calcium: 19, iron: 3.3 },
  chicken: { kcal: 239, protein: 27, carbs: 0, fiber: 0, sugar: 0, fat: 14, satFat: 3.8, polyFat: 3.2, monoFat: 6.4, transFat: 0.1, cholesterol: 88, sodium: 82, potassium: 223, vitaminA: 13, vitaminC: 0, calcium: 15, iron: 1.3 },
  potato: { kcal: 87, protein: 1.9, carbs: 20.1, fiber: 1.8, sugar: 0.9, fat: 0.1, satFat: 0, polyFat: 0.1, monoFat: 0, transFat: 0, cholesterol: 0, sodium: 6, potassium: 379, vitaminA: 0, vitaminC: 13, calcium: 5, iron: 0.8 },
  curd: { kcal: 63, protein: 3.5, carbs: 4.7, fiber: 0, sugar: 4.7, fat: 3.3, satFat: 2.1, polyFat: 0.1, monoFat: 0.9, transFat: 0.1, cholesterol: 13, sodium: 46, potassium: 141, vitaminA: 27, vitaminC: 0, calcium: 121, iron: 0.1 },
  oil: { kcal: 884, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 100, satFat: 14, polyFat: 34, monoFat: 43, transFat: 0.5, cholesterol: 0, sodium: 0, potassium: 0, vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0 },
  ghee: { kcal: 900, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 100, satFat: 61, polyFat: 4, monoFat: 28, transFat: 0, cholesterol: 256, sodium: 0, potassium: 0, vitaminA: 840, vitaminC: 0, calcium: 0, iron: 0 },
  chapati: { kcal: 297, protein: 11, carbs: 58, fiber: 9.6, sugar: 2.8, fat: 3.6, satFat: 0.7, polyFat: 1.3, monoFat: 0.8, transFat: 0, cholesterol: 0, sodium: 12, potassium: 405, vitaminA: 0, vitaminC: 0, calcium: 29, iron: 3.9 },
  fish: { kcal: 136, protein: 20, carbs: 0, fiber: 0, sugar: 0, fat: 6, satFat: 1.2, polyFat: 1.8, monoFat: 2.2, transFat: 0, cholesterol: 55, sodium: 90, potassium: 350, vitaminA: 30, vitaminC: 0, calcium: 15, iron: 0.5 },
  mutton: { kcal: 294, protein: 25, carbs: 0, fiber: 0, sugar: 0, fat: 21, satFat: 9, polyFat: 1.5, monoFat: 9, transFat: 0, cholesterol: 97, sodium: 72, potassium: 315, vitaminA: 0, vitaminC: 0, calcium: 17, iron: 2.5 },
};

export const CANONICAL_STAPLE_KEYS = new Set([
  ...Object.keys(builtInFoodDb),
  "anda", "phulka", "paratha", "idli", "dosa", "poha", "upma", "sambar",
  "rajma", "rajmah", "chole", "chana", "moong", "masoor", "toor", "urad",
  "soy", "whey", "indian curry gravy", "curry gravy", "boiled rice", "chawal",
  "chicken breast", "murgh", "dal cooked", "cooked dal",
]);

export const MISLEADING_DISH_TOKENS = new Set([
  "salad", "samosa", "sandwich", "roll", "kheer", "cutlet", "smoothie", "shake",
  "cake", "cookie", "biscuit", "namkeen", "pakora", "fries", "chips", "juice",
  "candy", "ice", "cream", "pastry", "muffin", "donut",
]);

export const genericFoodTokens = new Set([
  "oil", "ghee", "butter", "sauce", "masala", "gravy", "pickle", "spice", "salt", "sugar",
]);

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
  fish: 120,
  mutton: 120,
  curd: 120,
  potato: 150,
  dryfruits: 30,
  besan: 50,
};

/* ---- Dataset state ---- */
let externalFoodDb = {};
let externalFoodMeta = {};
let foodDatasetEntries = [];
let foodCanonicalKeys = [];
let foodDisplayNames = {};
let foodExactAliasToKey = {};
let foodInvertedIndex = {};
let foodDatasetLoaded = false;
let foodDatasetLoadPromise = null;

/* A merged-db provider is injected by the store so user-saved foods join the index. */
let userFoodLibraryProvider = () => ({});
export function setUserFoodLibraryProvider(fn) {
  userFoodLibraryProvider = typeof fn === "function" ? fn : () => ({});
}

export function isDatasetLoaded() {
  return foodDatasetLoaded;
}

export function normalizeFoodKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeFoodText(value) {
  const stopWords = new Set([
    "with", "without", "and", "plus", "for", "the", "in", "of", "a", "an",
    "ml", "gram", "grams", "g", "restaurant", "homemade",
  ]);
  return normalizeFoodKey(value)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

export function isCanonicalStapleKey(key) {
  const normalized = normalizeFoodKey(key);
  if (!normalized) return false;
  if (CANONICAL_STAPLE_KEYS.has(normalized)) return true;
  return normalized.split(" ").some((token) => CANONICAL_STAPLE_KEYS.has(token));
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

export async function loadFoodDatasetIfNeeded() {
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
      if (!foods.length) throw new Error("dataset has no foods");

      const index = {};
      const metaIndex = {};
      const entries = [];
      const canonicalKeys = [];
      const displayNames = {};
      const exactAliasToKey = {};
      const aliasConfidenceMap = {};
      const invertedIndex = {};

      const registerAlias = (alias, canonicalKey, confidence = 0.85) => {
        if (!alias || !canonicalKey) return;
        if (CANONICAL_STAPLE_KEYS.has(alias) && alias !== canonicalKey && canonicalKey.split(" ").length > 1) {
          return;
        }
        const existingConfidence = Number(aliasConfidenceMap[alias] || 0);
        if (!exactAliasToKey[alias] || confidence >= existingConfidence) {
          exactAliasToKey[alias] = canonicalKey;
          aliasConfidenceMap[alias] = confidence;
        }
        alias.split(" ").filter((token) => token.length > 1).forEach((token) => {
          if (!invertedIndex[token]) invertedIndex[token] = new Set();
          invertedIndex[token].add(canonicalKey);
        });
      };

      foods.forEach((food) => {
        const nutrition = mapFoodPayloadToNutrition(food);
        const canonicalKey = normalizeFoodKey(food?.key || food?.name || "");
        const aliases = [food?.name, food?.key, ...(Array.isArray(food?.aliases) ? food.aliases : [])]
          .map((alias) => normalizeFoodKey(alias))
          .filter(Boolean);

        if (!aliases.length) return;

        const meta = {
          key: canonicalKey,
          category: String(food?.category || "dish"),
          defaultPortionG: Number(food?.defaultPortionG || 0) || null,
          servingG: Number(food?.servingG || 0) || null,
          perServing: Boolean(food?.perServing),
          confidence: Number(food?.confidence || 0.85),
        };

        canonicalKeys.push(canonicalKey);
        displayNames[canonicalKey] = String(food?.name || canonicalKey);

        aliases.forEach((alias) => {
          if (CANONICAL_STAPLE_KEYS.has(alias) && alias !== canonicalKey && canonicalKey.split(" ").length > 1) {
            return;
          }
          if (!index[alias]) {
            index[alias] = nutrition;
            metaIndex[alias] = meta;
          }
          registerAlias(alias, canonicalKey, meta.confidence);
        });

        registerAlias(canonicalKey, canonicalKey, meta.confidence);

        entries.push({
          name: String(food?.name || food?.key || aliases[0]),
          key: canonicalKey || aliases[0],
          nutrition,
          category: meta.category,
          confidence: meta.confidence,
        });
      });

      Object.keys(invertedIndex).forEach((token) => {
        invertedIndex[token] = [...invertedIndex[token]];
      });

      externalFoodDb = index;
      externalFoodMeta = metaIndex;
      foodDatasetEntries = entries;
      foodCanonicalKeys = [...new Set(canonicalKeys)];
      foodDisplayNames = displayNames;
      foodExactAliasToKey = exactAliasToKey;
      foodInvertedIndex = invertedIndex;
      foodDatasetLoaded = true;
    } catch (error) {
      console.warn("Food dataset load failed, using built-in DB only.", error);
      externalFoodDb = {};
      externalFoodMeta = {};
      foodDatasetEntries = [];
      foodCanonicalKeys = [];
      foodDisplayNames = {};
      foodExactAliasToKey = {};
      foodInvertedIndex = {};
      foodDatasetLoaded = false;
    } finally {
      foodDatasetLoadPromise = null;
    }
  })();

  await foodDatasetLoadPromise;
}

export function getFoodMetaForKey(key) {
  const normalized = normalizeFoodKey(key);
  if (externalFoodMeta[normalized]) return externalFoodMeta[normalized];
  const canonical = foodExactAliasToKey[normalized];
  if (canonical && externalFoodMeta[canonical]) return externalFoodMeta[canonical];
  const match = Object.values(externalFoodMeta).find((meta) => meta?.key === normalized);
  return match || null;
}

export function getFoodDisplayName(key) {
  return foodDisplayNames[key] || key;
}

export function getExactAliasCanonical(normalizedText) {
  return foodExactAliasToKey[normalizedText] || null;
}

export function findFoodPortionHint(foodKey) {
  const key = String(foodKey || "").toLowerCase();
  const hintKey = Object.keys(portionHintByKeyword).find((item) => key.includes(item));
  return hintKey ? portionHintByKeyword[hintKey] : 100;
}

export function getDefaultPortionGrams(key) {
  const meta = getFoodMetaForKey(key);
  if (meta?.perServing && meta?.servingG) return Number(meta.servingG);
  if (meta?.defaultPortionG) return Number(meta.defaultPortionG);
  return findFoodPortionHint(key);
}

export function getMergedFoodDb() {
  const merged = {};
  const addSource = (source, options = {}) => {
    const protectStaples = Boolean(options.protectStaples);
    Object.entries(source || {}).forEach(([rawKey, values]) => {
      const key = normalizeFoodKey(rawKey);
      if (!key) return;
      if (protectStaples && merged[key] && isCanonicalStapleKey(key)) return;
      merged[key] = withNutritionDefaults(values);
    });
  };

  addSource(builtInFoodDb);
  addSource(externalFoodDb, { protectStaples: true });
  addSource(userFoodLibraryProvider() || {});

  return merged;
}

function getFoodSearchKeys(db) {
  const builtInKeys = Object.keys(builtInFoodDb || {});
  if (foodCanonicalKeys.length) {
    return [...new Set([...builtInKeys, ...foodCanonicalKeys])];
  }
  return Object.keys(db || {});
}

function getCandidateKeysForQuery(normalizedText, textTokens) {
  if (!textTokens.length) return getFoodSearchKeys(getMergedFoodDb());

  const candidateSet = new Set();
  textTokens.forEach((token) => {
    (foodInvertedIndex[token] || []).forEach((key) => candidateSet.add(key));
  });

  if (candidateSet.size) return [...candidateSet];

  const db = getMergedFoodDb();
  return getFoodSearchKeys(db).filter((key) =>
    textTokens.some((token) => key.includes(token) || token.includes(key))
  );
}

export function scoreFoodKeyMatch(normalizedText, textTokens, dbKey) {
  if (!normalizedText || !dbKey) return 0;
  const dbTokens = dbKey.split(" ").filter(Boolean);
  const meta = getFoodMetaForKey(dbKey);
  const confidenceBoost = Number(meta?.confidence || 0.85) * 14;

  if (normalizedText === dbKey) {
    return (isCanonicalStapleKey(dbKey) ? 120 : 100) + confidenceBoost;
  }

  if (foodExactAliasToKey[normalizedText] === dbKey) {
    return 112 + confidenceBoost;
  }

  const overlapTokens = dbTokens.filter((token) => textTokens.includes(token));
  const overlap = overlapTokens.length;

  let score = confidenceBoost;

  if (normalizedText.includes(dbKey)) score += 62;
  if (dbKey.includes(normalizedText) && normalizedText.length >= 4) score += 34;

  score += overlap * 11;

  if (dbTokens.length > 1 && overlap === dbTokens.length && overlap === textTokens.length) {
    score += 28;
  } else if (dbTokens.length > 1 && overlap === dbTokens.length) {
    score += 16;
  }

  if (textTokens.length === 1 && dbTokens.length === 1 && textTokens[0] === dbTokens[0]) {
    score += isCanonicalStapleKey(dbKey) ? 30 : 14;
  }

  const extraDbTokens = dbTokens.filter((token) => !textTokens.includes(token));
  score -= extraDbTokens.filter((token) => !genericFoodTokens.has(token)).length * 9;

  if (textTokens.length <= 2 && dbTokens.length >= 4) score -= 24;
  if (textTokens.length <= 2 && dbTokens.length >= 3 && overlap < dbTokens.length) score -= 18;

  extraDbTokens.forEach((token) => {
    if (MISLEADING_DISH_TOKENS.has(token)) score -= 38;
  });

  if (dbTokens.length === 1 && textTokens.length >= 2) {
    const token = dbTokens[0];
    if (genericFoodTokens.has(token)) score -= 22;
    if (!textTokens.includes(token)) score -= 32;
  }

  if (dbTokens.length >= 2) {
    const overlapRatio = overlap / dbTokens.length;
    if (overlapRatio >= 0.75) score += 18;
    if (overlapRatio < 0.4 && !normalizedText.includes(dbKey)) score -= 20;
  }

  const prefixMatch = textTokens.length > 0 && dbKey.startsWith(textTokens.join(" "));
  if (prefixMatch) score += 12;

  return Math.max(0, score);
}

export function findTopFoodMatches(text, db, limit = 8) {
  const normalizedText = normalizeFoodKey(text);
  if (!normalizedText) return [];

  if (db[normalizedText]) {
    return [{ key: normalizedText, score: isCanonicalStapleKey(normalizedText) ? 120 : 100, nutrition: db[normalizedText] }];
  }

  const exactCanonical = foodExactAliasToKey[normalizedText];
  if (exactCanonical && db[exactCanonical]) {
    return [{ key: exactCanonical, score: 112, nutrition: db[exactCanonical] }];
  }

  const tokens = tokenizeFoodText(normalizedText);
  if (tokens.length === 1 && db[tokens[0]]) {
    return [{ key: tokens[0], score: isCanonicalStapleKey(tokens[0]) ? 118 : 96, nutrition: db[tokens[0]] }];
  }

  const candidateKeys = getCandidateKeysForQuery(normalizedText, tokens);
  const ranked = candidateKeys
    .map((key) => ({
      key,
      score: scoreFoodKeyMatch(normalizedText, tokens, key),
      nutrition: db[key],
    }))
    .filter((entry) => entry.score > 0 && entry.nutrition)
    .sort((a, b) => b.score - a.score || a.key.length - b.key.length);

  return ranked.slice(0, Math.max(1, limit));
}

export function findBestFoodMatch(text, db) {
  const normalizedText = normalizeFoodKey(text);
  if (!normalizedText) return null;

  if (db[normalizedText]) return normalizedText;

  const textTokens = tokenizeFoodText(normalizedText);
  if (textTokens.length === 1 && db[textTokens[0]]) return textTokens[0];

  const top = findTopFoodMatches(text, db, 3)[0];
  if (!top) return null;

  const keyTokens = String(top.key || "").split(" ").filter(Boolean);

  if (keyTokens.length === 1 && textTokens.length >= 2 && genericFoodTokens.has(keyTokens[0])) {
    return null;
  }

  if (textTokens.length <= 2 && keyTokens.length >= 3 && top.score < 90) {
    return null;
  }

  return top.score >= 24 ? top.key : null;
}

export function getBestFoodMatchScore(text, db) {
  const top = findTopFoodMatches(text, db, 1)[0];
  return top ? Number(top.score || 0) : 0;
}
