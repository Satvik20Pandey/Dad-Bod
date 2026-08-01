#!/usr/bin/env node
/* Dad Bod — service mapper unit tests.
 * Validates the pure mapping functions that translate Edamam and Open Food
 * Facts payloads into the app's nutrition model, plus resolver/quantity logic,
 * using fixture payloads (no network). Run: npm run test:services */

import assert from "node:assert/strict";

const { mapEdamamNutrients } = await import("../js/services/edamam.js");
const { mapOffNutriments } = await import("../js/services/openfoodfacts.js");
const { parseMealQuantity, resolveMealQuantityInput, inferQuantityFromDescription } = await import(
  "../js/core/resolver.js"
);
const { withNutritionDefaults, estimateCaloriesFromNutrition, scaleNutrition } = await import(
  "../js/core/nutrition.js"
);

let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

console.log("Edamam mapper");

test("maps totalNutrients to the app model", () => {
  const payload = {
    calories: 155,
    totalWeight: 100,
    totalNutrients: {
      PROCNT: { quantity: 12.6, unit: "g" },
      CHOCDF: { quantity: 1.1, unit: "g" },
      FAT: { quantity: 10.6, unit: "g" },
      FASAT: { quantity: 3.3, unit: "g" },
      CHOLE: { quantity: 373, unit: "mg" },
      NA: { quantity: 124, unit: "mg" },
      FE: { quantity: 1.2, unit: "mg" },
    },
  };
  const nutrition = mapEdamamNutrients(payload);
  assert.equal(nutrition.kcal, 155);
  assert.equal(nutrition.protein, 12.6);
  assert.equal(nutrition.satFat, 3.3);
  assert.equal(nutrition.cholesterol, 373);
  assert.equal(nutrition.iron, 1.2);
});

test("derives kcal from macros when calories are missing", () => {
  const nutrition = mapEdamamNutrients({
    totalNutrients: { PROCNT: { quantity: 10 }, CHOCDF: { quantity: 20 }, FAT: { quantity: 5 } },
  });
  assert.equal(nutrition.kcal, Math.round(10 * 4 + 20 * 4 + 5 * 9));
});

console.log("Open Food Facts mapper");

test("maps nutriments with unit conversion (g → mg)", () => {
  const per100g = mapOffNutriments({
    "energy-kcal_100g": 539,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    sugars_100g: 56.3,
    fat_100g: 30.9,
    "saturated-fat_100g": 10.6,
    sodium_100g: 0.107,
    calcium_100g: 0.108,
  });
  assert.equal(per100g.kcal, 539);
  assert.equal(per100g.protein, 6.3);
  assert.ok(Math.abs(per100g.sodium - 107) < 0.001);
  assert.ok(Math.abs(per100g.calcium - 108) < 0.001);
});

test("falls back to kJ conversion when kcal missing", () => {
  const per100g = mapOffNutriments({ energy_100g: 2092, proteins_100g: 10 });
  assert.ok(per100g.kcal >= 480 && per100g.kcal <= 520, `kcal was ${per100g.kcal}`);
});

console.log("Quantity resolution");

test("parses gram quantities", () => {
  const parsed = parseMealQuantity("200g");
  assert.equal(parsed.value, 200);
  assert.equal(parsed.unit, "g");
});

test("parses count with egg conversion (4 eggs → 200g)", () => {
  const grams = resolveMealQuantityInput("eggs", parseMealQuantity("4"));
  assert.equal(grams, 200);
});

test("kilogram converts to grams", () => {
  const parsed = parseMealQuantity("1.5kg");
  assert.equal(parsed.value, 1500);
});

test("infers quantity from description text", () => {
  assert.equal(inferQuantityFromDescription("2 eggs and 1 roti"), 100);
  assert.equal(inferQuantityFromDescription("250ml milk"), 250);
  assert.equal(inferQuantityFromDescription("1 cup rice"), 240);
});

console.log("Nutrition math");

test("scaleNutrition scales per-100g linearly", () => {
  const paneer = withNutritionDefaults({ kcal: 265, protein: 18.3, carbs: 1.2, fat: 20.8 });
  const scaled = scaleNutrition(paneer, 200);
  assert.ok(Math.abs(scaled.protein - 36.6) < 0.01);
  assert.ok(Math.abs(scaled.kcal - 530) < 0.01);
});

test("estimateCaloriesFromNutrition uses 4/4/9", () => {
  assert.equal(estimateCaloriesFromNutrition({ protein: 30, carbs: 40, fat: 10 }), 370);
});

if (process.exitCode) {
  console.error("\nService tests FAILED.");
} else {
  console.log(`\nAll ${passed} service tests passed.`);
}
