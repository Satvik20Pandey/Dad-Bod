/* Dad Bod — Recipes: the USDA MyPlate Kitchen collection (1,000+ recipes),
 * searchable by food group, loggable straight into the diet. */

import { select, setText, setHtml, escapeHtml, formatNum, debounce } from "../utils.js";
import { searchRecipes, getRecipe, RECIPE_FOOD_GROUPS } from "../services/myplate.js";
import { icon } from "../ui/icons.js";
import { openLayer, closeLayer, skeletonCards, emptyState, haptic, HAPTIC, showToast } from "../ui/components.js";

let activeGroup = "";
let onLogRecipe = null;

export function initRecipes(logRecipeCallback) {
  onLogRecipe = logRecipeCallback;

  const groupSeg = select("recipeGroupSeg");
  if (groupSeg) {
    groupSeg.innerHTML = RECIPE_FOOD_GROUPS.map(
      (group) =>
        `<button type="button" class="seg-chip ${group.key === activeGroup ? "active" : ""}" data-group="${group.key}">${group.label}</button>`
    ).join("");
    groupSeg.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-group]");
      if (!btn) return;
      activeGroup = btn.getAttribute("data-group");
      groupSeg.querySelectorAll("[data-group]").forEach((el) => el.classList.toggle("active", el === btn));
      haptic(HAPTIC.tap);
      runSearch();
    });
  }

  select("recipeQuery")?.addEventListener("input", debounce(runSearch, 380));
  select("recipeResults")?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-recipe-slug]");
    if (row) openRecipeDetail(row.getAttribute("data-recipe-slug"));
  });
  select("recipeDetailBody")?.addEventListener("click", (event) => {
    const logBtn = event.target.closest("[data-log-recipe]");
    if (!logBtn) return;
    try {
      const payload = JSON.parse(logBtn.getAttribute("data-log-recipe"));
      closeLayer("recipeDetailSheet");
      closeLayer("recipesSheet");
      if (onLogRecipe) onLogRecipe(payload);
    } catch {}
  });

  select("recipesSheet")?.addEventListener("transitionend", () => {
    const sheet = select("recipesSheet");
    if (sheet?.classList.contains("open") && !sheet.dataset.loaded) {
      sheet.dataset.loaded = "1";
      runSearch();
    }
  });
}

async function runSearch() {
  const container = select("recipeResults");
  if (!container) return;

  container.innerHTML = skeletonCards(4);
  const query = select("recipeQuery")?.value.trim() || "";
  const { recipes, offline, error } = await searchRecipes({ query, foodGroup: activeGroup, limit: 14 });

  if (offline) {
    container.innerHTML = emptyState("chef", "You're offline", "Recipes need an internet connection.");
    return;
  }
  if (error) {
    container.innerHTML = emptyState("chef", "Recipes unavailable", "MyPlate.food could not be reached. Try again shortly.");
    return;
  }
  if (!recipes.length) {
    container.innerHTML = emptyState("search", "No recipes found", "Try a simpler search like “chicken” or “oats”.");
    return;
  }

  container.innerHTML = recipes
    .map((recipe) => {
      const kcal = Number(recipe?.nutrition?.calories ?? recipe?.calories ?? 0);
      const protein = Number(recipe?.nutrition?.protein_g ?? recipe?.protein ?? 0);
      const rating = Number(recipe?.rating || 0);
      return `
      <button type="button" class="recipe-row" data-recipe-slug="${escapeHtml(String(recipe.slug || ""))}">
        ${recipe.image ? `<img class="recipe-thumb" src="${escapeHtml(String(recipe.image))}" alt="" loading="lazy" onerror="this.classList.add('hidden')" />` : `<span class="recipe-thumb placeholder">${icon("chef", "", 18)}</span>`}
        <span class="recipe-body">
          <span class="recipe-name">${escapeHtml(String(recipe.title || recipe.name || "Recipe"))}</span>
          <span class="recipe-meta">
            ${kcal > 0 ? `${formatNum(kcal, 0)} kcal` : "USDA recipe"}${protein > 0 ? ` · P ${formatNum(protein, 0)}g` : ""}${rating > 0 ? ` · ★ ${formatNum(rating, 1)}` : ""}
          </span>
        </span>
        ${icon("chevronRight", "row-chevron", 17)}
      </button>`;
    })
    .join("");
}

async function openRecipeDetail(slug) {
  const body = select("recipeDetailBody");
  if (!body) return;
  haptic(HAPTIC.tap);

  body.innerHTML = `${skeletonCards(3)}`;
  openLayer("recipeDetailSheet");

  const recipe = await getRecipe(slug);
  if (!recipe) {
    body.innerHTML = emptyState("chef", "Recipe unavailable", "Could not load this recipe right now.");
    return;
  }

  const title = String(recipe.title || recipe.name || "Recipe");
  const serves = recipe.servings || recipe.yield || null;
  const nutrition = recipe.nutrition || {};
  const kcal = Number(nutrition.calories ?? 0);
  const protein = Number(nutrition.protein_g ?? nutrition.protein ?? 0);
  const carbs = Number(nutrition.carbohydrates_g ?? nutrition.carbs ?? 0);
  const fat = Number(nutrition.total_fat_g ?? nutrition.fat ?? 0);

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const directions = Array.isArray(recipe.directions)
    ? recipe.directions
    : Array.isArray(recipe.instructions)
      ? recipe.instructions
      : [];

  const logPayload = JSON.stringify({
    description: `${title} (1 serving)`,
    kcal,
    protein,
    carbs,
    fat,
  }).replace(/"/g, "&quot;");

  body.innerHTML = `
    <h2 class="sheet-title">${escapeHtml(title)}</h2>
    <div class="chip-row">
      ${kcal > 0 ? `<span class="chip accent">${formatNum(kcal, 0)} kcal/serving</span>` : ""}
      ${protein > 0 ? `<span class="chip protein">P ${formatNum(protein, 0)}g</span>` : ""}
      ${serves ? `<span class="chip">Serves ${escapeHtml(String(serves))}</span>` : ""}
    </div>
    ${ingredients.length
      ? `<div class="guide-block"><h4>${icon("list", "", 15)} Ingredients</h4><ul class="recipe-list">${ingredients
          .slice(0, 20)
          .map((item) => `<li>${escapeHtml(typeof item === "string" ? item : item?.text || item?.name || "")}</li>`)
          .join("")}</ul></div>`
      : ""}
    ${directions.length
      ? `<div class="guide-block"><h4>${icon("bookOpen", "", 15)} Directions</h4><ol class="recipe-list">${directions
          .slice(0, 15)
          .map((step) => `<li>${escapeHtml(typeof step === "string" ? step : step?.text || "")}</li>`)
          .join("")}</ol></div>`
      : ""}
    <p class="source-line">Source: ${escapeHtml(String(recipe.source || "USDA MyPlate Kitchen"))}</p>
    ${kcal > 0 ? `<button type="button" class="btn-primary full-width" data-log-recipe="${logPayload}">${icon("plus", "", 17)} Log 1 Serving as a Meal</button>` : ""}
  `;
}

export function notifyRecipeLogged(title) {
  showToast(`${title} added to your meal log.`, "success");
}
