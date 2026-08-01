/* Dad Bod — barcode resolution chain (no keys):
 *   1. Open Food Facts v2  → full nutrition
 *   2. Open Food Facts v0  → legacy records missed by v2
 *   3. UPCItemDB (trial)   → product name only, estimated via food search
 * The UI never dead-ends: name-only results flow into the food estimator,
 * and unknown codes fall back to name search / manual entry. */

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

function buildOkResult(code, product, sourceLabel) {
  const per100g = mapOffNutriments(product.nutriments);
  const hasData = per100g.kcal > 0 || per100g.protein > 0 || per100g.carbs > 0 || per100g.fat > 0;
  if (!hasData) return null;

  return {
    status: "ok",
    code,
    name: String(product.product_name || "Packaged food").trim(),
    brand: String(product.brands || "").split(",")[0].trim(),
    image: product.image_front_small_url || null,
    servingSize: product.serving_size || null,
    servingG: Number(product.serving_quantity || 0) || null,
    per100g,
    source: sourceLabel,
  };
}

async function tryOffEndpoint(url, cacheKey) {
  try {
    const payload = await fetchJson(url, { timeoutMs: 9000, cacheKey, cacheTtlMs: CACHE_TTL_MS });
    if (!payload || payload.status === 0 || !payload.product) return null;
    return payload.product;
  } catch {
    return null;
  }
}

/* Name-only fallback for codes missing from Open Food Facts. */
async function tryUpcItemDb(code) {
  try {
    const payload = await fetchJson(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`,
      { timeoutMs: 9000, cacheKey: `upcdb:${code}`, cacheTtlMs: CACHE_TTL_MS }
    );
    const item = payload?.items?.[0];
    if (!item?.title) return null;
    return {
      status: "name_only",
      code,
      name: String(item.title).trim(),
      brand: String(item.brand || "").trim(),
      source: "UPCItemDB product directory",
    };
  } catch {
    return null;
  }
}

export async function lookupBarcode(rawCode) {
  const code = String(rawCode || "").replace(/\D/g, "");
  if (code.length < 6) return { status: "invalid" };
  if (!isOnline()) return { status: "offline" };

  const v2Product = await tryOffEndpoint(
    `${API.openFoodFacts.base}/${encodeURIComponent(code)}.json?fields=${FIELDS}`,
    `off:${code}`
  );
  if (v2Product) {
    const result = buildOkResult(code, v2Product, "Open Food Facts");
    if (result) return result;
  }

  const v0Product = await tryOffEndpoint(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`,
    `offv0:${code}`
  );
  if (v0Product) {
    const result = buildOkResult(code, v0Product, "Open Food Facts (legacy)");
    if (result) return result;
    if (v0Product.product_name) {
      return {
        status: "name_only",
        code,
        name: String(v0Product.product_name).trim(),
        brand: String(v0Product.brands || "").split(",")[0].trim(),
        source: "Open Food Facts",
      };
    }
  }

  const upcResult = await tryUpcItemDb(code);
  if (upcResult) return upcResult;

  return { status: "not_found", code };
}
