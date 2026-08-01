/* Dad Bod — Recipes: the USDA MyPlate Kitchen collection (1,000+ recipes),
 * searchable by food group, loggable straight into the diet. */

import { select, setText, setHtml, escapeHtml, formatNum, debounce } from "../utils.js";
import { searchRecipes, getRecipe, RECIPE_FOOD_GROUPS } from "../services/myplate.js";
import { icon } from "../ui/icons.js";
import { openLayer, closeLayer, skeletonCards, emptyState, haptic, HAPTIC, showToast } from "../ui/components.js";

let activeGroup = "";
let onLogRecipe = null;
let loadedOnce = false;

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

  document.addEventListener("layeropen", (event) => {
    if (event.detail?.id === "recipesSheet") onRecipesSheetOpen();
  });
}

/* Called whenever the recipes sheet opens. */
export function onRecipesSheetOpen() {
  if (loadedOnce) return;
  loadedOnce = true;
  runSearch();
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
    .map(
      (recipe) => `
      <button type="button" class="recipe-row" data-recipe-slug="${escapeHtml(recipe.slug)}">
        ${recipe.image
          ? `<img class="recipe-thumb" src="${escapeHtml(recipe.image)}" alt="" loading="lazy" onerror="this.classList.add('hidden')" />`
          : `<span class="recipe-thumb placeholder">${icon("chef", "", 18)}</span>`}
        <span class="recipe-body">
          <span class="recipe-name">${escapeHtml(recipe.name)}</span>
          <span class="recipe-meta">
            ${recipe.calories > 0 ? `${formatNum(recipe.calories, 0)} kcal/serving` : "USDA recipe"}${recipe.rating > 0 ? ` · ★ ${formatNum(recipe.rating, 1)}` : ""}${recipe.category ? ` · ${escapeHtml(recipe.category)}` : ""}
          </span>
        </span>
        ${icon("chevronRight", "row-chevron", 17)}
      </button>`
    )
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

  const n = recipe.nutrition;
  const logPayload = JSON.stringify({
    description: `${recipe.name} (1 serving)`,
    kcal: n.kcal,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
  }).replace(/"/g, "&quot;");

  body.innerHTML = `
    <h2 class="sheet-title">${escapeHtml(recipe.name)}</h2>
    <div class="chip-row">
      ${n.kcal > 0 ? `<span class="chip accent">${formatNum(n.kcal, 0)} kcal/serving</span>` : ""}
      ${n.protein > 0 ? `<span class="chip protein">P ${formatNum(n.protein, 0)}g</span>` : ""}
      ${recipe.servings ? `<span class="chip">${escapeHtml(recipe.servings)}</span>` : ""}
      ${recipe.rating > 0 ? `<span class="chip">★ ${formatNum(recipe.rating, 1)}</span>` : ""}
    </div>
    ${recipe.servingSize ? `<p class="sheet-sub">Serving: ${escapeHtml(recipe.servingSize)}</p>` : ""}
    ${recipe.ingredients.length
      ? `<div class="guide-block"><h4>${icon("list", "", 15)} Ingredients</h4><ul class="recipe-list">${recipe.ingredients
          .slice(0, 20)
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}</ul></div>`
      : ""}
    ${recipe.steps.length
      ? `<div class="guide-block"><h4>${icon("bookOpen", "", 15)} Directions</h4><ol class="recipe-list">${recipe.steps
          .slice(0, 15)
          .map((step) => `<li>${escapeHtml(step)}</li>`)
          .join("")}</ol></div>`
      : ""}
    ${n.carbs > 0 || n.fat > 0
      ? `<div class="guide-block"><h4>${icon("target", "", 15)} Per serving</h4><p>P ${formatNum(n.protein, 1)}g · C ${formatNum(n.carbs, 1)}g · F ${formatNum(n.fat, 1)}g${n.fiber ? ` · Fiber ${formatNum(n.fiber, 1)}g` : ""}</p></div>`
      : ""}
    <p class="source-line">${escapeHtml(recipe.source)}</p>
    ${n.kcal > 0 ? `<button type="button" class="btn-primary full-width" data-log-recipe="${logPayload}">${icon("plus", "", 17)} Log 1 Serving as a Meal</button>` : ""}
  `;
}

export function notifyRecipeLogged(title) {
  showToast(`${title} added to your meal log.`, "success");
}
