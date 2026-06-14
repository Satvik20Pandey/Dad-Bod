#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.join(__dirname, "..", "assets", "food-dataset.json");
const CANONICAL_STAPLE_KEYS = new Set([
  "egg", "eggs", "anda", "paneer", "rice", "dal", "roti", "chapati", "phulka", "paratha",
  "bread", "milk", "curd", "yogurt", "ghee", "oil", "butter", "chicken", "fish", "mutton",
]);

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function estimateCalories(food) {
  return Number(food.protein || 0) * 4 + Number(food.carbs || 0) * 4 + Number(food.fat || 0) * 9;
}

function main() {
  const payload = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
  const foods = Array.isArray(payload.foods) ? payload.foods : [];
  const errors = [];
  const aliasMap = {};

  if (foods.length < 2500) {
    errors.push(`Expected at least 2500 foods, found ${foods.length}`);
  }

  foods.forEach((food) => {
    const key = normalizeKey(food.key);
    if (!key) {
      errors.push("Found food without key");
      return;
    }

    const kcal = Number(food.kcal || 0);
    const macroKcal = estimateCalories(food);
    if (!food.perServing && kcal > 0 && macroKcal > 0) {
      const ratio = kcal / macroKcal;
      if (ratio < 0.55 || ratio > 1.55) {
        errors.push(`Macro/kcal mismatch for ${key} (${ratio.toFixed(2)})`);
      }
    }

    (food.aliases || [key]).map(normalizeKey).forEach((alias) => {
      if (!aliasMap[alias]) aliasMap[alias] = [];
      aliasMap[alias].push(key);
    });
  });

  Object.entries(aliasMap).forEach(([alias, owners]) => {
    if (!CANONICAL_STAPLE_KEYS.has(alias)) return;
    const badOwners = owners.filter((owner) => {
      if (owner === alias) return false;
      if (owner === `${alias} cooked` || owner === `${alias} breast cooked`) return false;
      if (owner === "chapati roti" && ["chapati", "roti", "phulka"].includes(alias)) return false;
      if (owner === "cooking oil" && alias === "oil") return false;
      if (owner === "moong dal cooked" && alias === "dal") return false;
      if (owner === "fish cooked" && alias === "fish") return false;
      if (owner === "mutton cooked" && alias === "mutton") return false;
      if (owner === "ghee cow" && alias === "ghee") return false;
      if (owner === "curd" && (alias === "yogurt" || alias === "dahi")) return false;
      if (owner.startsWith("cooked ") && alias === "rice") return false;
      return owner.split(" ").length > 1 || Number(foods.find((f) => normalizeKey(f.key) === owner)?.protein || 0) < 10;
    });
    if (badOwners.length) {
      errors.push(`Canonical alias "${alias}" stolen by: ${badOwners.join(", ")}`);
    }
  });

  const paneer = foods.find((food) => normalizeKey(food.key) === "paneer");
  if (!paneer) {
    errors.push("Missing canonical paneer entry");
  } else if (Number(paneer.protein) < 15) {
    errors.push(`Paneer protein too low: ${paneer.protein}`);
  }

  const egg = foods.find((food) => normalizeKey(food.key) === "egg");
  if (!egg || Number(egg.protein) < 10) {
    errors.push("Missing or invalid canonical egg entry");
  }

  if (errors.length) {
    console.error("Dataset validation failed:");
    errors.slice(0, 20).forEach((error) => console.error(` - ${error}`));
    process.exit(1);
  }

  console.log(`Dataset validation passed (${foods.length} foods).`);
}

main();
