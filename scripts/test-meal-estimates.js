#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.join(__dirname, "..", "assets", "food-dataset.json");

const BUILT_IN = {
  paneer: { kcal: 265, protein: 18.3, carbs: 1.2, fat: 20.8 },
  egg: { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5 },
};

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function buildMergedDb(payload) {
  const merged = { ...BUILT_IN };
  (payload.foods || []).forEach((food) => {
    const key = normalizeKey(food.key);
    if (!key) return;
    merged[key] = food;
    (food.aliases || []).map(normalizeKey).forEach((alias) => {
      if (CANONICAL.has(alias) && key.split(" ").length > 1) return;
      if (!merged[alias]) merged[alias] = food;
    });
  });
  return merged;
}

const CANONICAL = new Set(["paneer", "egg", "eggs", "anda", "roti", "chapati"]);

function scale(per100, grams) {
  const factor = grams / 100;
  return {
    kcal: per100.kcal * factor,
    protein: per100.protein * factor,
    carbs: per100.carbs * factor,
    fat: per100.fat * factor,
  };
}

function assertApprox(label, actual, expected, tolerance) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ~${expected}, got ${actual.toFixed(1)}`);
  }
}

function main() {
  const payload = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
  const db = buildMergedDb(payload);

  const paneer200 = scale(db.paneer, 200);
  assertApprox("Paneer 200g protein", paneer200.protein, 36.6, 2);
  assertApprox("Paneer 200g carbs", paneer200.carbs, 2.4, 1.5);

  const eggs4 = scale(db.egg, 200);
  assertApprox("4 eggs protein", eggs4.protein, 26, 2);

  console.log("Meal estimate regression checks passed.");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
