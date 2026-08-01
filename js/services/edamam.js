/* Dad Bod — Edamam Nutrition Analysis service.
 *
 * Natural-language food parsing for meals the local dataset cannot confidently
 * resolve. Responses are cached 7 days per normalized query to respect the
 * free-tier quota. Returns nutrition in the app's canonical model, or null.
 */

import { API } from "../config.js";
import { fetchJson, isOnline } from "./http.js";
import { withNutritionDefaults, estimateCaloriesFromNutrition } from "../core/nutrition.js";
import { splitMealDescription } from "../core/resolver.js";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeQuery(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/* Map Edamam's totalNutrients block to the app's nutrition model. */
export function mapEdamamNutrients(payload) {
  const total = payload?.totalNutrients || {};
  const value = (code) => Number(total?.[code]?.quantity || 0);

  const nutrition = withNutritionDefaults({
    kcal: Number(payload?.calories || 0) || value("ENERC_KCAL"),
    protein: value("PROCNT"),
    carbs: value("CHOCDF"),
    fiber: value("FIBTG"),
    sugar: value("SUGAR"),
    fat: value("FAT"),
    satFat: value("FASAT"),
    polyFat: value("FAPU"),
    monoFat: value("FAMS"),
    transFat: value("FATRN"),
    cholesterol: value("CHOLE"),
    sodium: value("NA"),
    potassium: value("K"),
    vitaminA: value("VITA_RAE"),
    vitaminC: value("VITC"),
    calcium: value("CA"),
    iron: value("FE"),
  });

  if (!nutrition.kcal) {
    nutrition.kcal = Math.round(estimateCaloriesFromNutrition(nutrition));
  }

  return nutrition;
}

function hasUsableData(nutrition, payload) {
  if (!nutrition) return false;
  const parsedWeight = Number(payload?.totalWeight || 0);
  const anyMacro = nutrition.kcal > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0;
  return anyMacro && (parsedWeight > 0 || nutrition.kcal > 0);
}

/* Analyze one ingredient line, e.g. "2 boiled eggs" or "150g grilled chicken". */
export async function analyzeIngredientLine(line) {
  const query = normalizeQuery(line);
  if (!query || !isOnline()) return null;

  const url =
    `${API.edamam.base}?app_id=${encodeURIComponent(API.edamam.appId)}` +
    `&app_key=${encodeURIComponent(API.edamam.appKey)}` +
    `&nutrition-type=logging&ingr=${encodeURIComponent(query)}`;

  try {
    const payload = await fetchJson(url, {
      timeoutMs: 9000,
      cacheKey: `edamam:${query}`,
      cacheTtlMs: CACHE_TTL_MS,
    });
    const nutrition = mapEdamamNutrients(payload);
    if (!hasUsableData(nutrition, payload)) return null;
    return {
      nutrition,
      totalWeightG: Number(payload?.totalWeight || 0),
      source: "Edamam Nutrition Analysis",
    };
  } catch (error) {
    console.warn("Edamam lookup failed", error?.message || error);
    return null;
  }
}

/* Analyze a full meal description by summing its component lines.
 * "2 eggs + 1 cup rice" → two parallel single-ingredient calls. */
export async function analyzeMealDescription(description) {
  const segments = splitMealDescription(description).slice(0, 5);
  if (!segments.length) return null;

  const results = await Promise.all(segments.map((segment) => analyzeIngredientLine(segment)));
  const usable = results.filter(Boolean);
  if (!usable.length) return null;

  const combined = withNutritionDefaults({});
  let totalWeightG = 0;
  usable.forEach((result) => {
    Object.keys(combined).forEach((field) => {
      combined[field] += Number(result.nutrition[field] || 0);
    });
    totalWeightG += Number(result.totalWeightG || 0);
  });

  return {
    nutrition: combined,
    totalWeightG,
    matchedSegments: usable.length,
    totalSegments: segments.length,
    source: "Edamam Nutrition Analysis",
  };
}
