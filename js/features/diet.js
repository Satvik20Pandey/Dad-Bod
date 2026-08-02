/* Dad Bod — Diet: search-first food logging.
 *
 * Resolution chain: on-device dataset (5,200+ Indian foods) → Edamam natural-
 * language parsing for unmatched portions → Open Food Facts for barcodes →
 * manual entry. Every estimate stays editable before saving.
 */

import { MEAL_SLOTS, MEAL_SLOT_LABELS, PLAN_DAYS_ORDER } from "../config.js";
import {
  select,
  setText,
  setHtml,
  escapeHtml,
  formatNum,
  todayDate,
  uid,
  debounce,
  parseOptionalNumber,
} from "../utils.js";
import {
  nutrientFields,
  nutrientLabels,
  nutrientUnits,
  normalizeNutrition,
  withNutritionDefaults,
  estimateCaloriesFromNutrition,
  getNutrientTarget,
  formatNutrientValue,
  scaleNutrition,
} from "../core/nutrition.js";
import {
  state,
  currentUser,
  saveState,
  getDayMeals,
  ensureFoodHistory,
  normalizeMealPhrase,
  persistMealHistoryEntry,
  getDefaultWeeklyPlan,
} from "../core/store.js";
import { loadFoodDatasetIfNeeded, isDatasetLoaded, getMergedFoodDb } from "../core/dataset.js";
import {
  parseMealQuantity,
  resolveMealQuantityInput,
  inferQuantityFromDescription,
  buildHybridMealComponents,
  composeEstimationFromHybrid,
  needsOnlineFallback,
  formatHybridBreakdown,
  applyMealSpecificSanityAdjustments,
  buildDatasetMealSuggestions,
  estimateFromFoodDb,
} from "../core/resolver.js";
import { analyzeMealDescription } from "../services/edamam.js";
import { lookupBarcode } from "../services/openfoodfacts.js";
import { isOnline } from "../services/http.js";
import { dailyTotals } from "../core/metrics.js";
import { icon } from "../ui/icons.js";
import {
  showToast,
  openLayer,
  closeLayer,
  haptic,
  HAPTIC,
  emptyState,
  skeletonCards,
} from "../ui/components.js";
import { drawMacroDonut } from "../ui/charts.js";
import { renderApp, goToScreen } from "../core/bus.js";
import { startVoiceInput, scanLabelFile, startBarcodeCamera, stopBarcodeCamera, barcodeCameraSupported } from "./capture.js";

const nutrientInputIds = {
  protein: "mealProtein",
  carbs: "mealCarbs",
  fiber: "mealFiber",
  sugar: "mealSugar",
  fat: "mealFat",
  satFat: "mealSaturatedFat",
  polyFat: "mealPolyunsaturatedFat",
  monoFat: "mealMonounsaturatedFat",
  transFat: "mealTransFat",
  cholesterol: "mealCholesterol",
  sodium: "mealSodium",
  potassium: "mealPotassium",
  vitaminA: "mealVitaminA",
  vitaminC: "mealVitaminC",
  calcium: "mealCalcium",
  iron: "mealIron",
};

let activeSlot = "breakfast";
let searchItems = [];

export function initDiet() {
  const searchInput = select("foodSearchInput");
  searchInput?.addEventListener("input", debounce(handleSearchInput, 160));
  searchInput?.addEventListener("focus", handleSearchInput);
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const text = searchInput.value.trim();
      if (text) openFoodSheetWithText(text);
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest?.(".search-hero")) hideSearchResults();
  });

  select("searchResults")?.addEventListener("click", handleSearchResultClick);

  select("voiceBtn")?.addEventListener("click", () => {
    startVoiceInput("foodSearchInput", "searchStatus", async (transcript) => {
      const input = select("foodSearchInput");
      if (input) input.value = transcript;
      openFoodSheetWithText(transcript);
      await runEstimate();
    });
  });

  select("barcodeBtn")?.addEventListener("click", openScanner);
  select("labelScanBtn")?.addEventListener("click", () => select("labelPhotoInput")?.click());
  select("labelPhotoInput")?.addEventListener("change", handleLabelScan);

  /* Food sheet */
  select("slotSeg")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-slot]");
    if (!btn) return;
    activeSlot = btn.getAttribute("data-slot");
    select("slotSeg").querySelectorAll("[data-slot]").forEach((el) => el.classList.toggle("active", el === btn));
    haptic(HAPTIC.tap);
  });
  select("estimateBtn")?.addEventListener("click", runEstimate);
  select("onlineSearchBtn")?.addEventListener("click", runOnlineEstimate);
  select("mealForm")?.addEventListener("submit", handleMealFormSubmit);
  select("mealCancelEditBtn")?.addEventListener("click", () => {
    resetFoodSheet();
    closeLayer("foodSheet");
  });

  /* Fullscreen scanner */
  select("scanLookupBtn")?.addEventListener("click", () => {
    const code = select("scanManualInput")?.value || "";
    if (code.trim()) handleBarcodeDetected(code);
  });
  select("scanManualInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const code = select("scanManualInput")?.value || "";
      if (code.trim()) handleBarcodeDetected(code);
    }
  });
  select("scanCloseBtn")?.addEventListener("click", closeScanner);
  select("scanSearchNameBtn")?.addEventListener("click", () => {
    closeScanner();
    goToScreen("diet");
    setTimeout(() => select("foodSearchInput")?.focus(), 350);
  });

  /* Meal timeline actions */
  select("mealTimeline")?.addEventListener("click", handleTimelineClick);

  /* Weekly plan sheet */
  select("openPlanBtn")?.addEventListener("click", () => {
    renderWeeklyPlan();
    openLayer("planSheet");
  });
  select("savePlanBtn")?.addEventListener("click", saveWeeklyPlan);
  select("resetPlanBtn")?.addEventListener("click", resetWeeklyPlan);
  select("planApplyAllBtn")?.addEventListener("click", applyFirstPlanDayToAll);

  loadFoodDatasetIfNeeded().catch(() => {});
}

/* ---- Search ---- */

function getMealSuggestions(inputText) {
  const query = normalizeMealPhrase(inputText);
  if (!query || query.length < 2) return [];

  const history = ensureFoodHistory();
  const historyMatches = history
    .filter((entry) => {
      const normalized = normalizeMealPhrase(entry?.description);
      return normalized.startsWith(query) || normalized.includes(query);
    })
    .sort((a, b) => Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0));

  const mappedHistory = historyMatches.slice(0, 4).map((entry) => ({
    description: String(entry.description || ""),
    qty: Number(entry.qty || 0),
    kcal: Number(entry.kcal || 0),
    protein: Number(entry.protein || 0),
    carbs: Number(entry.carbs || 0),
    fat: Number(entry.fat || 0),
    nutrients: withNutritionDefaults(entry.nutrients || entry),
    source: "history",
  }));

  const historyKeys = new Set(mappedHistory.map((entry) => normalizeMealPhrase(entry.description)));
  const datasetMatches = buildDatasetMealSuggestions(query, 6).filter(
    (entry) => !historyKeys.has(normalizeMealPhrase(entry.description))
  );

  return [...mappedHistory, ...datasetMatches].slice(0, 7);
}

function handleSearchInput() {
  const text = select("foodSearchInput")?.value || "";
  const box = select("searchResults");
  if (!box) return;

  const query = text.trim();
  if (query.length < 2) {
    renderRecentChips(box);
    return;
  }

  searchItems = getMealSuggestions(query);

  const rows = searchItems
    .map((item, idx) => {
      const sourceLabel = item.source === "dataset" ? "Dataset" : "Recent";
      return `
        <button type="button" class="search-row" data-idx="${idx}">
          <span class="search-row-icon">${icon(item.source === "dataset" ? "utensils" : "clock", "", 17)}</span>
          <span class="search-row-body">
            <span class="search-row-title">${escapeHtml(item.description)}</span>
            <span class="search-row-meta">${formatNum(item.kcal, 0)} kcal · P ${formatNum(item.protein, 0)} · C ${formatNum(item.carbs, 0)} · F ${formatNum(item.fat, 0)}</span>
          </span>
          <span class="search-row-chip">${sourceLabel}</span>
        </button>`;
    })
    .join("");

  const onlineRow = isOnline()
    ? `<button type="button" class="search-row action" data-online="1">
        <span class="search-row-icon accent">${icon("sparkles", "", 17)}</span>
        <span class="search-row-body"><span class="search-row-title">Search online for “${escapeHtml(query)}”</span>
        <span class="search-row-meta">Edamam natural-language nutrition</span></span>
      </button>`
    : "";

  const manualRow = `<button type="button" class="search-row action" data-manual="1">
      <span class="search-row-icon">${icon("pencil", "", 17)}</span>
      <span class="search-row-body"><span class="search-row-title">Log “${escapeHtml(query)}”</span>
      <span class="search-row-meta">Estimate locally, then fine-tune</span></span>
    </button>`;

  box.innerHTML = rows + onlineRow + manualRow;
  box.classList.remove("hidden");
}

function renderRecentChips(box) {
  const history = ensureFoodHistory()
    .slice()
    .sort((a, b) => Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0))
    .slice(0, 6);

  if (!history.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  searchItems = history.map((entry) => ({
    description: String(entry.description || ""),
    qty: Number(entry.qty || 0),
    kcal: Number(entry.kcal || 0),
    protein: Number(entry.protein || 0),
    carbs: Number(entry.carbs || 0),
    fat: Number(entry.fat || 0),
    nutrients: withNutritionDefaults(entry.nutrients || entry),
    source: "history",
  }));

  box.innerHTML = `<p class="search-heading">Recent</p>${searchItems
    .map(
      (item, idx) => `
      <button type="button" class="search-row" data-idx="${idx}">
        <span class="search-row-icon">${icon("clock", "", 17)}</span>
        <span class="search-row-body">
          <span class="search-row-title">${escapeHtml(item.description)}</span>
          <span class="search-row-meta">${formatNum(item.kcal, 0)} kcal · P ${formatNum(item.protein, 0)}g</span>
        </span>
      </button>`
    )
    .join("")}`;
  box.classList.remove("hidden");
}

function hideSearchResults() {
  const box = select("searchResults");
  if (box) {
    box.classList.add("hidden");
    box.innerHTML = "";
  }
}

function handleSearchResultClick(event) {
  const row = event.target.closest(".search-row");
  if (!row) return;
  const query = select("foodSearchInput")?.value.trim() || "";
  hideSearchResults();
  haptic(HAPTIC.tap);

  if (row.hasAttribute("data-online")) {
    openFoodSheetWithText(query);
    runOnlineEstimate();
    return;
  }
  if (row.hasAttribute("data-manual")) {
    openFoodSheetWithText(query);
    runEstimate();
    return;
  }

  const item = searchItems[Number(row.getAttribute("data-idx"))];
  if (!item) return;
  openFoodSheet();
  select("mealDescription").value = item.description || "";
  if (Number(item.qty || 0) > 0) select("mealQty").value = Math.round(Number(item.qty));
  fillMealFormFromEstimate(withNutritionDefaults(item.nutrients || item));
  setText("mealStatus", item.source === "dataset" ? "Matched from the food dataset. Review and save." : "Autofilled from your history. Review and save.");
}

/* ---- Food sheet ---- */

function openFoodSheet() {
  resetFoodSheet(false);
  setText("foodSheetTitle", state.editingMealId ? "Edit Meal" : "Log Meal");
  openLayer("foodSheet");
}

function openFoodSheetWithText(text) {
  state.editingMealId = null;
  openFoodSheet();
  const desc = select("mealDescription");
  if (desc) desc.value = text;
  runEstimate();
}

function resetFoodSheet(clearEditing = true) {
  select("mealForm")?.reset();
  if (clearEditing) state.editingMealId = null;
  setText("mealStatus", "");
  setText("foodSheetTitle", "Log Meal");
  const submitBtn = select("mealSubmitBtn");
  if (submitBtn) submitBtn.textContent = "Save Meal";
  setSlot(activeSlot || "breakfast");
}

function setSlot(slot) {
  activeSlot = MEAL_SLOTS.includes(slot) ? slot : "breakfast";
  select("slotSeg")
    ?.querySelectorAll("[data-slot]")
    .forEach((el) => el.classList.toggle("active", el.getAttribute("data-slot") === activeSlot));
}

function fillMealFormFromEstimate(estimation) {
  const normalized = normalizeNutrition(estimation);
  if (select("mealCalories")) select("mealCalories").value = Math.round(normalized.kcal || 0);

  nutrientFields.forEach((field) => {
    const inputId = nutrientInputIds[field];
    if (!inputId || !select(inputId)) return;
    const unit = nutrientUnits[field] || "";
    const digits = unit === "g" ? 1 : 0;
    select(inputId).value = Number(normalized[field] || 0).toFixed(digits);
  });
}

async function runEstimate() {
  const description = select("mealDescription")?.value.trim();
  if (!description) {
    setText("mealStatus", "Describe the meal first — e.g. “200g paneer with 2 roti”.");
    return;
  }

  await loadFoodDatasetIfNeeded();

  const qtyParsed = parseMealQuantity(select("mealQty")?.value, description);
  const db = getMergedFoodDb();
  const hybrid = buildHybridMealComponents(description, qtyParsed, db);
  let estimation = composeEstimationFromHybrid(hybrid, description, qtyParsed);
  let status = isDatasetLoaded() ? "Estimated from the Indian food dataset." : "Estimated with built-in food intelligence.";

  const knownCount = hybrid.components.filter((component) => component.source === "dataset").length;
  const unknownCount = hybrid.unknownComponents.length;

  if (needsOnlineFallback(hybrid, description, db) && isOnline()) {
    setText("mealStatus", "Partial dataset match — asking Edamam about the rest…");
    const online = await analyzeMealDescription(description).catch(() => null);
    if (online) {
      estimation = blendOnlineEstimate(description, hybrid, estimation, online, qtyParsed);
      status = `Dataset matched ${knownCount} part(s); Edamam resolved ${unknownCount} more. Review before saving.`;
    } else {
      status = `Dataset matched ${knownCount} part(s); ${unknownCount} estimated heuristically.`;
    }
  } else if (knownCount > 0) {
    const breakdown = formatHybridBreakdown(hybrid);
    status = `From dataset: ${breakdown}. Protein ~${Number(estimation.protein || 0).toFixed(1)}g.`;
  }

  fillMealFormFromEstimate(estimation);

  const qtyInputEl = select("mealQty");
  if (qtyInputEl && !qtyInputEl.value && hybrid.totalGrams) {
    qtyInputEl.value = Math.round(hybrid.totalGrams);
  }

  setText("mealStatus", status);
}

async function runOnlineEstimate() {
  const description = select("mealDescription")?.value.trim();
  if (!description) {
    setText("mealStatus", "Describe the meal first.");
    return;
  }
  if (!isOnline()) {
    setText("mealStatus", "You're offline — using the on-device dataset instead.");
    return runEstimate();
  }

  setText("mealStatus", "Searching Edamam…");
  const online = await analyzeMealDescription(description).catch(() => null);
  if (!online) {
    setText("mealStatus", "Online search couldn't parse that — using the local estimate.");
    return runEstimate();
  }

  const qtyParsed = parseMealQuantity(select("mealQty")?.value, description);
  const db = getMergedFoodDb();
  const hybrid = buildHybridMealComponents(description, qtyParsed, db);
  const heuristic = composeEstimationFromHybrid(hybrid, description, qtyParsed);
  const blended = blendOnlineEstimate(description, hybrid, heuristic, online, qtyParsed);

  fillMealFormFromEstimate(blended);
  const qtyInputEl = select("mealQty");
  if (qtyInputEl && !qtyInputEl.value && (online.totalWeightG || hybrid.totalGrams)) {
    qtyInputEl.value = Math.round(online.totalWeightG || hybrid.totalGrams);
  }
  setText(
    "mealStatus",
    `Edamam parsed ${online.matchedSegments}/${online.totalSegments} part(s). Review before saving.`
  );
}

/* Reconcile an online estimate against the trusted local dataset portions. */
function blendOnlineEstimate(description, hybrid, heuristic, online, qtyParsed) {
  const adjusted = normalizeNutrition(online.nutrition || {});
  const known = normalizeNutrition(hybrid.knownTotals || {});
  const local = normalizeNutrition(heuristic || {});
  const grams = Math.max(
    1,
    Number(hybrid.totalGrams || online.totalWeightG || inferQuantityFromDescription(description, 100) || 100)
  );

  /* Dataset-matched components are ground truth — online numbers may only add. */
  ["protein", "carbs", "fat"].forEach((field) => {
    adjusted[field] = Math.max(Number(adjusted[field] || 0), Number(known[field] || 0));
  });

  if (adjusted.kcal <= 0 && local.kcal > 0) adjusted.kcal = local.kcal;

  if (local.kcal > 0 && adjusted.kcal > 0) {
    const minKcal = local.kcal * 0.6;
    const maxKcal = local.kcal * 1.6;
    adjusted.kcal = Math.max(minKcal, Math.min(maxKcal, adjusted.kcal));
  }

  const fatBreakdownTotal = Number(adjusted.satFat || 0) + Number(adjusted.polyFat || 0) + Number(adjusted.monoFat || 0);
  if (adjusted.fat > 0 && fatBreakdownTotal <= 0) {
    adjusted.satFat = Math.max(Number(known.satFat || 0), adjusted.fat * 0.32);
    adjusted.polyFat = Math.max(Number(known.polyFat || 0), adjusted.fat * 0.26);
    adjusted.monoFat = Math.max(Number(known.monoFat || 0), adjusted.fat * 0.38);
  }

  return applyMealSpecificSanityAdjustments(description, adjusted, grams);
}

/* ---- Save ---- */

function handleMealFormSubmit(e) {
  e.preventDefault();

  const description = select("mealDescription")?.value.trim();
  if (!description) {
    setText("mealStatus", "Please describe the meal.");
    return;
  }

  const qtyParsed = parseMealQuantity(select("mealQty")?.value, description);
  const resolvedQty = qtyParsed ? resolveMealQuantityInput(description, qtyParsed) : null;
  const qty = Number(resolvedQty || inferQuantityFromDescription(description, 100) || 100);

  const manualKcal = parseOptionalNumber("mealCalories");
  const estimated = normalizeNutrition(estimateFromFoodDb(description, qtyParsed));

  const finalNutrition = {};
  nutrientFields.forEach((field) => {
    const inputId = nutrientInputIds[field];
    const manualValue = inputId ? parseOptionalNumber(inputId) : null;
    finalNutrition[field] = Number(manualValue ?? estimated[field] ?? 0);
  });

  const correctedNutrition = applyMealSpecificSanityAdjustments(
    description,
    { ...finalNutrition, kcal: Number(manualKcal ?? estimateCaloriesFromNutrition(finalNutrition)) },
    qty
  );
  const kcal = Number(manualKcal ?? correctedNutrition.kcal ?? estimateCaloriesFromNutrition(correctedNutrition));

  const editingId = state.editingMealId;
  const existingMeal = editingId ? getDayMeals(todayDate()).find((m) => m.id === editingId) : null;

  const meal = {
    id: existingMeal?.id || uid("meal"),
    slot: activeSlot,
    name: description,
    description,
    qty,
    kcal,
  };

  nutrientFields.forEach((field) => {
    meal[field] = Number(correctedNutrition[field] || 0);
  });

  if (existingMeal) {
    Object.assign(existingMeal, meal);
  } else {
    getDayMeals(todayDate()).push(meal);
  }

  persistMealHistoryEntry(meal, nutrientFields);
  saveState();

  const wasEditing = Boolean(existingMeal);
  resetFoodSheet();
  closeLayer("foodSheet");
  const searchInput = select("foodSearchInput");
  if (searchInput) searchInput.value = "";
  haptic(HAPTIC.success);
  showToast(wasEditing ? "Meal updated." : `${MEAL_SLOT_LABELS[meal.slot]} logged · ${Math.round(kcal)} kcal`, "success");
  renderApp();
}

/* Quick-action entry points (FAB, recipes) */

export function quickLogMeal() {
  state.editingMealId = null;
  openFoodSheet();
}

export function logPrefilledMeal({ description, kcal = 0, protein = 0, carbs = 0, fat = 0 }) {
  state.editingMealId = null;
  openFoodSheet();
  const desc = select("mealDescription");
  if (desc) desc.value = description || "";
  fillMealFormFromEstimate(withNutritionDefaults({ kcal, protein, carbs, fat }));
  setText("mealStatus", "Prefilled from USDA MyPlate Kitchen (per serving). Review and save.");
}

/* ---- Fullscreen premium scanner ---- */

export function openScanner() {
  openLayer("scanOverlay");
  select("scanOverlay")?.classList.remove("locked", "missed");
  const manual = select("scanManualInput");
  if (manual) manual.value = "";
  select("scanFallbackRow")?.classList.add("hidden");
  setText("scanStatus", barcodeCameraSupported() ? "Starting camera…" : "Type the barcode number below.");
  startBarcodeCamera("scanVideo", "scanStatus", handleBarcodeDetected);
}

export function closeScanner() {
  stopBarcodeCamera("scanVideo");
  closeLayer("scanOverlay");
}

async function handleBarcodeDetected(code) {
  const overlay = select("scanOverlay");
  overlay?.classList.remove("missed");
  overlay?.classList.add("locked");
  haptic(HAPTIC.success);
  setText("scanStatus", `Found ${String(code).trim()} — looking up…`);

  const result = await lookupBarcode(code);

  if (result.status === "ok") {
    setTimeout(() => {
      closeScanner();
      const grams = Number(result.servingG || 100);
      const scaled = scaleNutrition(result.per100g, grams);
      state.editingMealId = null;
      openFoodSheet();
      select("mealDescription").value = [result.name, result.brand].filter(Boolean).join(" — ");
      select("mealQty").value = Math.round(grams);
      fillMealFormFromEstimate(scaled);
      setText(
        "mealStatus",
        `${result.source}${result.servingSize ? ` · serving ${result.servingSize}` : " · per 100g"}. Adjust quantity and save.`
      );
    }, 420);
    return;
  }

  if (result.status === "name_only") {
    setTimeout(async () => {
      closeScanner();
      state.editingMealId = null;
      openFoodSheet();
      const label = [result.name, result.brand && !result.name.includes(result.brand) ? result.brand : ""]
        .filter(Boolean)
        .join(" — ");
      select("mealDescription").value = label;
      setText("mealStatus", `Identified via ${result.source} — estimating nutrition from the name…`);
      await runEstimate();
    }, 420);
    return;
  }

  /* No product anywhere — keep the user moving, never dead-end. */
  overlay?.classList.remove("locked");
  overlay?.classList.add("missed");
  haptic(HAPTIC.warn);
  const messages = {
    invalid: "That doesn't look like a valid barcode. Try again or type it below.",
    offline: "You're offline — barcode lookup needs internet.",
    not_found: "Not in any product database yet. Search it by name instead — it takes 5 seconds.",
    error: "Lookup failed. Check your connection, retry, or search by name.",
  };
  setText("scanStatus", messages[result.status] || messages.error);
  select("scanFallbackRow")?.classList.remove("hidden");

  /* Re-arm the camera for another attempt, keeping the guidance text visible. */
  stopBarcodeCamera("scanVideo");
  startBarcodeCamera("scanVideo", null, handleBarcodeDetected);
}

/* ---- Label scan ---- */

async function handleLabelScan(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  state.editingMealId = null;
  openFoodSheet();
  const estimate = await scanLabelFile(file, "mealStatus");
  if (estimate) fillMealFormFromEstimate(estimate);
}

/* ---- Timeline ---- */

function handleTimelineClick(event) {
  const addBtn = event.target.closest("[data-add-slot]");
  if (addBtn) {
    state.editingMealId = null;
    openFoodSheet();
    setSlot(addBtn.getAttribute("data-add-slot"));
    return;
  }

  const actionBtn = event.target.closest("[data-meal-action]");
  if (!actionBtn) return;
  const action = actionBtn.getAttribute("data-meal-action");
  const mealId = actionBtn.getAttribute("data-meal-id");

  if (action === "delete") {
    state.mealsByDate[todayDate()] = getDayMeals(todayDate()).filter((m) => m.id !== mealId);
    saveState();
    haptic(HAPTIC.warn);
    showToast("Meal removed.");
    renderApp();
    return;
  }

  if (action === "edit") {
    const meal = getDayMeals(todayDate()).find((m) => m.id === mealId);
    if (!meal) return;
    state.editingMealId = mealId;
    openFoodSheet();
    setText("foodSheetTitle", "Edit Meal");
    select("mealDescription").value = meal.description || meal.name || "";
    select("mealQty").value = meal.qty || 100;
    setSlot(meal.slot);
    fillMealFormFromEstimate(meal);
    const submitBtn = select("mealSubmitBtn");
    if (submitBtn) submitBtn.textContent = "Update Meal";
    setText("mealStatus", "Editing saved meal — adjust and update.");
  }
}

/* ---- Render ---- */

export function renderDiet() {
  if (!state) return;
  renderSummaryStrip();
  renderTimeline();
  renderNutritionPanel();
}

function renderSummaryStrip() {
  const totals = dailyTotals();
  const profile = state.profile;
  const remaining = Math.max(0, Number(profile.calorieTarget || 0) - totals.kcal);

  setHtml(
    "dietSummaryStrip",
    `
    <div class="strip-stat"><b>${formatNum(remaining, 0)}</b><span>kcal left</span></div>
    <div class="strip-divider"></div>
    <div class="strip-stat protein"><b>${formatNum(totals.protein, 0)}g</b><span>protein</span></div>
    <div class="strip-stat carbs"><b>${formatNum(totals.carbs, 0)}g</b><span>carbs</span></div>
    <div class="strip-stat fat"><b>${formatNum(totals.fat, 0)}g</b><span>fat</span></div>`
  );
}

function renderTimeline() {
  const container = select("mealTimeline");
  if (!container) return;

  const meals = getDayMeals(todayDate());

  container.innerHTML = MEAL_SLOTS.map((slot) => {
    const items = meals.filter((m) => m.slot === slot);
    const slotKcal = items.reduce((sum, m) => sum + Number(m.kcal || 0), 0);

    const itemsHtml = items.length
      ? items
          .map((m) => {
            const nutrition = normalizeNutrition(m);
            const qty = Number(m.qty || 0);
            const detailsFields = nutrientFields.filter((field) => !["protein", "carbs", "fat"].includes(field));
            const nutrientDetails = detailsFields
              .map((field) => `<span><b>${nutrientLabels[field]}</b>${formatNutrientValue(field, nutrition[field])}</span>`)
              .join("");

            return `
            <div class="meal-item">
              <div class="meal-item-main">
                <p class="meal-item-title">${escapeHtml(mealDisplayName(m))}</p>
                <p class="meal-item-meta">${qty > 0 ? `${formatNum(qty, 0)}g · ` : ""}${formatNum(nutrition.kcal, 0)} kcal · P ${formatNum(nutrition.protein, 1)} · C ${formatNum(nutrition.carbs, 1)} · F ${formatNum(nutrition.fat, 1)}</p>
                <details class="meal-more">
                  <summary>Full nutrients</summary>
                  <div class="meal-nutrient-grid">${nutrientDetails}</div>
                </details>
              </div>
              <div class="meal-item-actions">
                <button type="button" class="icon-btn" data-meal-action="edit" data-meal-id="${m.id}" aria-label="Edit meal">${icon("pencil", "", 16)}</button>
                <button type="button" class="icon-btn danger" data-meal-action="delete" data-meal-id="${m.id}" aria-label="Delete meal">${icon("trash", "", 16)}</button>
              </div>
            </div>`;
          })
          .join("")
      : `<p class="slot-empty">Nothing logged</p>`;

    return `
      <section class="slot-section">
        <header class="slot-header">
          <h3>${MEAL_SLOT_LABELS[slot]}</h3>
          <div class="slot-side">
            ${items.length ? `<span class="slot-kcal">${formatNum(slotKcal, 0)} kcal</span>` : ""}
            <button type="button" class="slot-add" data-add-slot="${slot}" aria-label="Add to ${MEAL_SLOT_LABELS[slot]}">${icon("plus", "", 16)}</button>
          </div>
        </header>
        ${itemsHtml}
      </section>`;
  }).join("");
}

function mealDisplayName(meal) {
  const text = String(meal?.description || meal?.name || "Meal").trim();
  return text.length <= 90 ? text : `${text.slice(0, 87)}…`;
}

function renderNutritionPanel() {
  const totals = dailyTotals();
  const profile = state.profile || {};

  requestAnimationFrame(() => {
    drawMacroDonut(select("macroDonut"), [
      { value: totals.protein * 4, color: "#FF4D6D" },
      { value: totals.carbs * 4, color: "#F6C453" },
      { value: totals.fat * 9, color: "#5DA9FF" },
    ]);
  });
  setText("donutKcal", formatNum(totals.kcal, 0));

  const macros = [
    { key: "protein", id: "legendProtein", bar: "legendBarProtein" },
    { key: "carbs", id: "legendCarbs", bar: "legendBarCarbs" },
    { key: "fat", id: "legendFat", bar: "legendBarFat" },
  ];
  macros.forEach(({ key, id, bar }) => {
    const value = Number(totals[key] || 0);
    const target = Number(getNutrientTarget(profile, key) || 0);
    setText(id, target > 0 ? `${formatNum(value, 0)}/${formatNum(target, 0)}g` : `${formatNum(value, 0)}g`);
    const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    const barEl = select(bar);
    if (barEl) {
      requestAnimationFrame(() => {
        barEl.style.width = `${pct}%`;
      });
    }
  });

  const container = select("microPanel");
  if (!container) return;

  const microFields = nutrientFields.filter((field) => !["protein", "carbs", "fat"].includes(field));
  container.innerHTML = microFields
    .map((field) => {
      const value = Number(totals[field] || 0);
      const target = Number(getNutrientTarget(state.profile, field) || 0);
      const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
      return `
      <div class="micro-row">
        <span class="micro-label">${nutrientLabels[field]}</span>
        <div class="micro-track"><i style="width:${pct}%"></i></div>
        <span class="micro-value">${formatNutrientValue(field, value)}${target > 0 ? ` <em>/ ${formatNutrientValue(field, target)}</em>` : ""}</span>
      </div>`;
    })
    .join("");
}

/* ---- Weekly plan ---- */

function renderWeeklyPlan() {
  const container = select("weeklyPlanContainer");
  if (!container) return;

  if (!state.weeklyPlan) state.weeklyPlan = getDefaultWeeklyPlan();

  setText(
    "weeklyPlanIntro",
    currentUser?.isAdmin
      ? "Your repeatable weekly plan is preloaded. Edit anything, anytime."
      : "Plan simple repeatable meals you can actually arrange every day."
  );

  container.innerHTML = PLAN_DAYS_ORDER.map((day) => {
    const p = state.weeklyPlan[day] || { breakfast: "", lunch: "", snacks: "", dinner: "", notes: "" };
    return `
      <div class="plan-day">
        <h3>${day}</h3>
        <label>Breakfast<input data-plan="${day}:breakfast" value="${escapeHtml(p.breakfast)}" /></label>
        <label>Lunch<input data-plan="${day}:lunch" value="${escapeHtml(p.lunch)}" /></label>
        <label>Snacks<input data-plan="${day}:snacks" value="${escapeHtml(p.snacks)}" /></label>
        <label>Dinner<input data-plan="${day}:dinner" value="${escapeHtml(p.dinner)}" /></label>
        <label>Notes<textarea rows="2" data-plan="${day}:notes">${escapeHtml(p.notes || "")}</textarea></label>
      </div>`;
  }).join("");
}

function saveWeeklyPlan() {
  document.querySelectorAll("[data-plan]").forEach((el) => {
    const [day, field] = el.getAttribute("data-plan").split(":");
    if (!state.weeklyPlan[day]) state.weeklyPlan[day] = {};
    state.weeklyPlan[day][field] = el.value;
  });
  saveState();
  showToast("Weekly plan saved.", "success");
  haptic(HAPTIC.success);
}

function resetWeeklyPlan() {
  state.weeklyPlan = getDefaultWeeklyPlan();
  saveState();
  renderWeeklyPlan();
  showToast("Weekly plan reset.");
}

function applyFirstPlanDayToAll() {
  const first = PLAN_DAYS_ORDER[0];
  const template = { ...(state.weeklyPlan[first] || {}) };
  PLAN_DAYS_ORDER.forEach((day) => {
    state.weeklyPlan[day] = { ...template };
  });
  saveState();
  renderWeeklyPlan();
  showToast(`${first}'s meals copied to the whole week.`, "success");
}
