/* Dad Bod — MyPlate.food service: USDA calculators (BMI, calorie needs, water)
 * and the MyPlate Kitchen recipe collection. No key; every response is cited. */

import { API } from "../config.js";
import { fetchJson, isOnline } from "./http.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVITY_MAP = {
  sedentary: "sedentary",
  light: "lightly-active",
  moderate: "moderately-active",
  active: "active",
};

function profileParams(profile) {
  const params = new URLSearchParams();
  params.set("age", String(Math.max(10, Math.round(Number(profile.age || 24)))));
  params.set("sex", profile.sex === "female" ? "female" : "male");
  params.set("activity", ACTIVITY_MAP[profile.activityLevel] || "lightly-active");
  params.set("height_cm", String(Math.max(120, Number(profile.heightCm || 170))));
  params.set("weight_kg", String(Math.max(30, Number(profile.currentWeight || 70))));
  return params;
}

export async function getBmi(profile) {
  if (!isOnline()) return null;
  const heightCm = Math.max(120, Number(profile.heightCm || 170));
  const weightKg = Math.max(30, Number(profile.currentWeight || 70));
  try {
    return await fetchJson(
      `${API.myplate.base}/calculate/bmi?height_cm=${heightCm}&weight_kg=${weightKg}`,
      { timeoutMs: 8000, cacheKey: `myplate:bmi:${heightCm}:${weightKg}`, cacheTtlMs: 7 * DAY_MS }
    );
  } catch {
    return null;
  }
}

/* Full energy picture: BMR, TDEE table, deficit tiers, macro splits, protein range. */
export async function getCalorieNeeds(profile) {
  if (!isOnline()) return null;
  const params = profileParams(profile);
  try {
    return await fetchJson(`${API.myplate.base}/calculate/calorie-needs?${params}`, {
      timeoutMs: 9000,
      cacheKey: `myplate:needs:${params.toString()}`,
      cacheTtlMs: 7 * DAY_MS,
    });
  } catch {
    return null;
  }
}

export async function getWaterTargetMl(profile) {
  if (!isOnline()) return null;
  const weightKg = Math.max(30, Number(profile.currentWeight || 70));
  try {
    const payload = await fetchJson(`${API.myplate.base}/calculate/water-intake?weight=${weightKg}`, {
      timeoutMs: 8000,
      cacheKey: `myplate:water:${weightKg}`,
      cacheTtlMs: 30 * DAY_MS,
    });
    const liters = Number(
      payload?.liters ?? payload?.water_liters ?? payload?.recommended_liters ?? payload?.daily_intake_liters ?? 0
    );
    if (liters > 0.5 && liters < 10) return Math.round(liters * 1000);
    const ml = Number(payload?.ml ?? payload?.water_ml ?? 0);
    if (ml >= 500 && ml <= 10000) return Math.round(ml);
    return null;
  } catch {
    return null;
  }
}

export const RECIPE_FOOD_GROUPS = [
  { key: "", label: "All Groups" },
  { key: "protein-foods", label: "Protein" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruits", label: "Fruits" },
  { key: "grains", label: "Grains" },
  { key: "dairy", label: "Dairy" },
];

export async function searchRecipes({ query = "", foodGroup = "", maxCalories = 0, limit = 12 } = {}) {
  if (!isOnline()) return { recipes: [], offline: true };
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (foodGroup) params.set("food_group", foodGroup);
  if (maxCalories > 0) params.set("max_calories", String(maxCalories));
  params.set("limit", String(limit));

  try {
    const payload = await fetchJson(`${API.myplate.base}/recipes?${params}`, {
      timeoutMs: 9000,
      cacheKey: `myplate:recipes:${params.toString()}`,
      cacheTtlMs: 7 * DAY_MS,
    });
    const recipes = Array.isArray(payload?.recipes) ? payload.recipes : Array.isArray(payload) ? payload : [];
    return { recipes, source: payload?.source || "USDA MyPlate Kitchen" };
  } catch (error) {
    console.warn("MyPlate recipe search failed", error?.message || error);
    return { recipes: [], error: true };
  }
}

export async function getRecipe(slug) {
  if (!slug || !isOnline()) return null;
  try {
    return await fetchJson(`${API.myplate.base}/recipes/${encodeURIComponent(slug)}`, {
      timeoutMs: 9000,
      cacheKey: `myplate:recipe:${slug}`,
      cacheTtlMs: 30 * DAY_MS,
    });
  } catch {
    return null;
  }
}
