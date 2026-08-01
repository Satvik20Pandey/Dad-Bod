/* Dad Bod — nutrition model: tracked nutrient fields, units, dynamic daily targets, scaling. */

export const nutrientFields = [
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

export const nutrientLabels = {
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

export const nutrientUnits = {
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

export const baseNutrientTargets = {
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

export function withNutritionDefaults(values) {
  const source = values || {};
  const normalized = { kcal: Number(source.kcal || 0) };
  nutrientFields.forEach((field) => {
    normalized[field] = Number(source[field] || 0);
  });
  return normalized;
}

export function zeroNutritionTotals() {
  return withNutritionDefaults({});
}

function readNutrientValue(source, field) {
  const aliases = nutrientFieldAliases[field] || [field];
  for (const key of aliases) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

export function normalizeNutrition(source) {
  const normalized = { kcal: Number(source?.kcal || source?.calories || 0) };
  nutrientFields.forEach((field) => {
    normalized[field] = readNutrientValue(source, field);
  });
  return normalized;
}

export function addNutritionTotals(target, addition) {
  const dest = target || zeroNutritionTotals();
  const source = normalizeNutrition(addition || {});
  dest.kcal += Number(source.kcal || 0);
  nutrientFields.forEach((field) => {
    dest[field] += Number(source[field] || 0);
  });
  return dest;
}

/* Scale a per-100g (or per-serving) profile to a gram amount. */
export function scaleNutrition(per100, grams, meta = null) {
  const base = normalizeNutrition(per100);
  const scaled = zeroNutritionTotals();

  if (meta?.perServing) {
    const servings = Math.max(1, Number(grams || meta.servingG || 1)) / Math.max(1, Number(meta.servingG || 1));
    scaled.kcal = base.kcal * servings;
    nutrientFields.forEach((field) => {
      scaled[field] = Number(base[field] || 0) * servings;
    });
    return scaled;
  }

  const factor = Math.max(1, Number(grams || 100)) / 100;
  scaled.kcal = base.kcal * factor;
  nutrientFields.forEach((field) => {
    scaled[field] = Number(base[field] || 0) * factor;
  });
  return scaled;
}

export function estimateCaloriesFromNutrition(nutrition) {
  const protein = Number(nutrition.protein || 0);
  const carbs = Number(nutrition.carbs || 0);
  const fat = Number(nutrition.fat || 0);
  return protein * 4 + carbs * 4 + fat * 9;
}

export function formatNutrientValue(field, value) {
  const unit = nutrientUnits[field] || "";
  const digits = unit === "g" ? 1 : 0;
  const n = Number(value || 0);
  return `${n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}${unit}`;
}

/* Daily micronutrient targets tuned to the user's calorie target and goal direction. */
export function calculateDynamicNutrientTargets(profile) {
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

export function getNutrientTarget(profile, field) {
  if (!profile) return baseNutrientTargets[field] ?? null;
  if (field === "protein") return Number(profile.macros?.proteinG || 0);
  if (field === "carbs") return Number(profile.macros?.carbsG || 0);
  if (field === "fat") return Number(profile.macros?.fatG || 0);
  const dynamicTargets = profile.nutrientTargets || calculateDynamicNutrientTargets(profile);
  return Number(dynamicTargets[field] ?? baseNutrientTargets[field] ?? 0);
}
