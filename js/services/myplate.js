/* Dad Bod — MyPlate.food service: USDA calculators (BMI, calorie needs, water)
 * and the MyPlate Kitchen recipe collection. No key; every response is cited.
 * Mappers follow the live API shapes (verified 2026-08). */

import { API } from "../config.js";
import { fetchJson, isOnline } from "./http.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/* Live enum: sedentary | moderately-active | active | very-active */
const ACTIVITY_MAP = {
  sedentary: "sedentary",
  light: "moderately-active",
  moderate: "moderately-active",
  active: "active",
};

function profileParams(profile) {
  const params = new URLSearchParams();
  params.set("age", String(Math.max(10, Math.round(Number(profile.age || 24)))));
  params.set("sex", profile.sex === "female" ? "female" : "male");
  params.set("activity", ACTIVITY_MAP[profile.activityLevel] || "moderately-active");
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

/* Flat payload: { bmr, bmr_harris_benedict, tdee, tdee_by_activity[], ... } */
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

/* Payload: { result: { headline: { value: "2.6", unit: "liters/day" } } } */
export async function getWaterTargetMl(profile) {
  if (!isOnline()) return null;
  const weightKg = Math.max(30, Number(profile.currentWeight || 70));
  try {
    const payload = await fetchJson(`${API.myplate.base}/calculate/water-intake?weight=${weightKg}`, {
      timeoutMs: 8000,
      cacheKey: `myplate:water:${weightKg}`,
      cacheTtlMs: 30 * DAY_MS,
    });
    const liters = Number(payload?.result?.headline?.value || 0);
    if (liters > 0.5 && liters < 10) return Math.round(liters * 1000);
    return null;
  } catch {
    return null;
  }
}

export const RECIPE_FOOD_GROUPS = [
  { key: "", label: "All" },
  { key: "protein-foods", label: "Protein" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruits", label: "Fruits" },
  { key: "grains", label: "Grains" },
  { key: "dairy", label: "Dairy" },
];

/* List payload: { results: [{ slug, name, description, category, food_groups,
 * calories, rating: {value,count}, image_url }], total, source } */
export async function searchRecipes({ query = "", foodGroup = "", maxCalories = 0, limit = 14 } = {}) {
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
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const recipes = results.map((item) => ({
      slug: String(item.slug || ""),
      name: String(item.name || "Recipe"),
      category: String(item.category || ""),
      calories: Number(item.calories || 0),
      rating: Number(item?.rating?.value || 0),
      image: item.image_url || null,
      foodGroups: Array.isArray(item.food_groups) ? item.food_groups : [],
    }));
    return { recipes, total: Number(payload?.total || recipes.length), source: payload?.source || "USDA MyPlate Kitchen" };
  } catch (error) {
    console.warn("MyPlate recipe search failed", error?.message || error);
    return { recipes: [], error: true };
  }
}

function nutritionRowAmount(rows, key) {
  const row = (rows || []).find((entry) => entry?.key === key);
  return row ? Number(row.amount || 0) : 0;
}

/* Detail payload: { slug, name, serving_size, yield, ingredients: [{text,note}],
 * directions: "one string", nutrition: [{name,key,amount,unit,indent}], ... } */
export async function getRecipe(slug) {
  if (!slug || !isOnline()) return null;
  try {
    const payload = await fetchJson(`${API.myplate.base}/recipes/${encodeURIComponent(slug)}`, {
      timeoutMs: 9000,
      cacheKey: `myplate:recipe:${slug}`,
      cacheTtlMs: 30 * DAY_MS,
    });
    if (!payload?.name) return null;

    const rows = Array.isArray(payload.nutrition) ? payload.nutrition : [];
    const directionsText = String(payload.directions || "").trim();
    const steps = directionsText
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .map((step) => step.trim())
      .filter((step) => step.length > 3);

    return {
      slug: String(payload.slug || slug),
      name: String(payload.name),
      description: String(payload.description || ""),
      servingSize: String(payload.serving_size || ""),
      servings: String(payload.yield || ""),
      rating: Number(payload?.rating?.value || 0),
      ingredients: (Array.isArray(payload.ingredients) ? payload.ingredients : []).map((item) =>
        [item?.text, item?.note ? `(${item.note})` : ""].filter(Boolean).join(" ")
      ),
      steps: steps.length ? steps : directionsText ? [directionsText] : [],
      nutrition: {
        kcal: nutritionRowAmount(rows, "total_calories"),
        protein: nutritionRowAmount(rows, "protein"),
        carbs: nutritionRowAmount(rows, "carbohydrates") || nutritionRowAmount(rows, "total_carbohydrate"),
        fat: nutritionRowAmount(rows, "total_fat"),
        fiber: nutritionRowAmount(rows, "dietary_fiber"),
        sodium: nutritionRowAmount(rows, "sodium"),
      },
      source: "USDA MyPlate Kitchen via myplate.food",
    };
  } catch {
    return null;
  }
}
