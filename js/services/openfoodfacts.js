/* Dad Bod — Open Food Facts barcode lookup (no key required).
 * Maps a scanned or typed barcode to per-100g nutrition + serving info. */

import { API } from "../config.js";
import { fetchJson, isOnline } from "./http.js";
import { withNutritionDefaults, estimateCaloriesFromNutrition } from "../core/nutrition.js";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const FIELDS = [
  "product_name",
  "brands",
  "nutriments",
  "serving_size",
  "serving_quantity",
  "image_front_small_url",
].join(",");

function gramsToMg(value) {
  return Number(value || 0) * 1000;
}

/* OFF stores most nutrients as grams per 100g; minerals need mg, vitamin A mcg. */
export function mapOffNutriments(nutriments) {
  const n = nutriments || {};
  const num = (key) => Number(n[key] || 0);

  const nutrition = withNutritionDefaults({
    kcal: num("energy-kcal_100g") || num("energy-kcal") || Math.round(num("energy_100g") / 4.184),
    protein: num("proteins_100g"),
    carbs: num("carbohydrates_100g"),
    fiber: num("fiber_100g"),
    sugar: num("sugars_100g"),
    fat: num("fat_100g"),
    satFat: num("saturated-fat_100g"),
    polyFat: num("polyunsaturated-fat_100g"),
    monoFat: num("monounsaturated-fat_100g"),
    transFat: num("trans-fat_100g"),
    cholesterol: gramsToMg(num("cholesterol_100g")),
    sodium: gramsToMg(num("sodium_100g")),
    potassium: gramsToMg(num("potassium_100g")),
    vitaminA: num("vitamin-a_100g") * 1e6,
    vitaminC: gramsToMg(num("vitamin-c_100g")),
    calcium: gramsToMg(num("calcium_100g")),
    iron: gramsToMg(num("iron_100g")),
  });

  if (!nutrition.kcal) {
    nutrition.kcal = Math.round(estimateCaloriesFromNutrition(nutrition));
  }

  return nutrition;
}

export async function lookupBarcode(rawCode) {
  const code = String(rawCode || "").replace(/\D/g, "");
  if (code.length < 6) return { status: "invalid" };
  if (!isOnline()) return { status: "offline" };

  try {
    const payload = await fetchJson(
      `${API.openFoodFacts.base}/${encodeURIComponent(code)}.json?fields=${FIELDS}`,
      { timeoutMs: 9000, cacheKey: `off:${code}`, cacheTtlMs: CACHE_TTL_MS }
    );

    if (!payload || payload.status === 0 || !payload.product) {
      return { status: "not_found", code };
    }

    const product = payload.product;
    const per100g = mapOffNutriments(product.nutriments);
    const servingG = Number(product.serving_quantity || 0) || null;

    const hasData = per100g.kcal > 0 || per100g.protein > 0 || per100g.carbs > 0 || per100g.fat > 0;
    if (!hasData) return { status: "no_nutrition", code, name: product.product_name || "" };

    return {
      status: "ok",
      code,
      name: String(product.product_name || "Packaged food").trim(),
      brand: String(product.brands || "").split(",")[0].trim(),
      image: product.image_front_small_url || null,
      servingSize: product.serving_size || null,
      servingG,
      per100g,
      source: "Open Food Facts",
    };
  } catch (error) {
    console.warn("Open Food Facts lookup failed", error?.message || error);
    return { status: "error", code };
  }
}
