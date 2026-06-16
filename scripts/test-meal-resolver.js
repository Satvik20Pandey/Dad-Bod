#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.join(__dirname, "..", "assets", "food-dataset.json");

const BUILT_IN = {
  paneer: { kcal: 265, protein: 18.3, carbs: 1.2, fat: 20.8 },
  egg: { kcal: 143, protein: 13, carbs: 0.7, fat: 9.5 },
  "indian curry gravy": { kcal: 118, protein: 2.8, carbs: 7.5, fat: 8.2 },
  "paneer curry": { kcal: 176.52, protein: 7.8, carbs: 8.4, fat: 12.38 },
  "boiled rice": { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "chicken breast cooked": { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  "dal cooked": { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  chicken: { kcal: 239, protein: 27, carbs: 0, fat: 14 },
  rice: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  dal: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
};

const CANONICAL = new Set([
  "paneer", "egg", "eggs", "anda", "roti", "chapati", "indian curry gravy", "paneer curry",
  "boiled rice", "chicken breast", "dal cooked", "chicken", "rice", "dal",
]);

const MISLEADING = new Set(["salad", "samosa", "sandwich", "roll", "kheer", "cutlet"]);
const GENERIC = new Set(["oil", "ghee", "butter", "sauce", "masala", "gravy", "pickle", "spice", "salt", "sugar"]);

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value) {
  const stop = new Set(["with", "without", "and", "plus", "for", "the", "in", "of", "a", "an", "g", "gram", "grams", "ml"]);
  return normalizeKey(value).split(" ").filter((t) => t.length > 1 && !stop.has(t));
}

function buildMergedDb(payload) {
  const merged = { ...BUILT_IN };
  const meta = {};
  (payload.foods || []).forEach((food) => {
    const key = normalizeKey(food.key);
    if (!key) return;
    merged[key] = food;
    meta[key] = { confidence: Number(food.confidence || 0.85), key };
    (food.aliases || []).map(normalizeKey).forEach((alias) => {
      if (CANONICAL.has(alias) && key.split(" ").length > 1) return;
      if (!merged[alias]) merged[alias] = food;
      if (!meta[alias]) meta[alias] = meta[key];
    });
  });
  return { merged, meta };
}

function scoreMatch(normalizedText, textTokens, dbKey, meta) {
  if (normalizedText === dbKey) return 120;
  const dbTokens = dbKey.split(" ").filter(Boolean);
  const overlap = dbTokens.filter((t) => textTokens.includes(t)).length;
  let score = Number(meta[dbKey]?.confidence || 0.85) * 14;
  if (normalizedText.includes(dbKey)) score += 62;
  if (dbKey.includes(normalizedText) && normalizedText.length >= 4) score += 34;
  score += overlap * 11;
  dbTokens.filter((t) => !textTokens.includes(t)).forEach((t) => {
    if (MISLEADING.has(t)) score -= 38;
    if (!GENERIC.has(t)) score -= 9;
  });
  return Math.max(0, score);
}

function findBest(text, db, meta) {
  const normalized = normalizeKey(text);
  if (db[normalized]) return normalized;
  const tokens = tokenize(normalized);
  const ranked = Object.keys(db)
    .filter((key) => !key.includes(" ") || key.split(" ").every((t) => normalized.includes(t) || tokens.includes(t)))
    .map((key) => ({ key, score: scoreMatch(normalized, tokens, key, meta) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 24 ? ranked[0].key : null;
}

function scale(per100, grams) {
  const f = grams / 100;
  return {
    protein: per100.protein * f,
    carbs: per100.carbs * f,
    fat: per100.fat * f,
    kcal: per100.kcal * f,
  };
}

function parsePaneerCurryMeal(description, db) {
  const text = String(description || "");
  let paneerG = 0;
  let gravyG = 0;
  const paneerMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|gm)\s*(?:of\s+)?paneer/i);
  if (paneerMatch) paneerG = Number(paneerMatch[1]);
  const gravyMatch = text.match(/paneer curry\s+(\d+(?:\.\d+)?)\s*ml/i);
  if (gravyMatch) gravyG = Number(gravyMatch[1]);
  const paneer = scale(db.paneer, paneerG);
  const gravy = scale(db["indian curry gravy"], gravyG);
  return {
    protein: paneer.protein + gravy.protein,
    carbs: paneer.carbs + gravy.carbs,
    fat: paneer.fat + gravy.fat,
    kcal: paneer.kcal + gravy.kcal,
  };
}

function assertApprox(label, actual, expected, tolerance) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ~${expected}, got ${actual.toFixed(2)}`);
  }
}

function main() {
  const payload = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
  const { merged: db, meta } = buildMergedDb(payload);

  const paneerKey = findBest("paneer", db, meta);
  if (paneerKey !== "paneer") {
    throw new Error(`Paneer query matched wrong key: ${paneerKey}`);
  }

  const paneerCurry = parsePaneerCurryMeal("Paneer curry 250 ml with 200 gm of paneer", db);
  assertApprox("Paneer curry composite protein", paneerCurry.protein, 43.6, 3);
  assertApprox("Paneer curry composite kcal", paneerCurry.kcal, 825, 80);

  const eggs4 = scale(db.egg, 200);
  assertApprox("4 eggs protein", eggs4.protein, 26, 2);

  const eggCurryKey = findBest("egg curry", db, meta);
  if (!eggCurryKey || !eggCurryKey.includes("egg")) {
    throw new Error(`egg curry match failed: ${eggCurryKey}`);
  }

  console.log("Meal resolver regression checks passed.");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
