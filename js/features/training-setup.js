/* Dad Bod — Training Setup plan editor.
 * Customize which exercises run on which weekday; search the same wger library
 * used by Train → Library. Overrides live in state.workoutOverrides and are
 * applied by getWorkoutForDay() so Train/Home/Progress stay in sync. */

import { WEEK_DAYS } from "../config.js";
import { select, escapeHtml, debounce, currentDayName, uid } from "../utils.js";
import { state, saveState } from "../core/store.js";
import {
  getWorkoutForDay,
  setDayExercises,
  clearDayExerciseOverride,
  clearAllExerciseOverrides,
  getActiveSplit,
} from "../core/metrics.js";
import { searchExercises } from "../services/wger.js";
import { icon } from "../ui/icons.js";
import { showToast, haptic, HAPTIC } from "../ui/components.js";
import { renderApp } from "../core/bus.js";

let editorDay = "Monday";
let searchToken = 0;

export function initTrainingSetup() {
  const root = select("planEditor");
  if (!root) return;

  select("planDaySeg")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-plan-day]");
    if (!btn) return;
    editorDay = btn.getAttribute("data-plan-day");
    renderPlanEditor();
  });

  root.addEventListener("click", handlePlanClick);
  root.addEventListener("change", handlePlanChange);

  select("planSearchInput")?.addEventListener(
    "input",
    debounce(() => runPlanSearch(), 320)
  );
  select("planSearchResults")?.addEventListener("click", handleSearchPick);

  select("planResetDayBtn")?.addEventListener("click", () => {
    clearDayExerciseOverride(editorDay);
    haptic(HAPTIC.tap);
    showToast(`${editorDay} restored to default plan.`);
    renderPlanEditor();
    renderApp();
  });

  select("planResetAllBtn")?.addEventListener("click", () => {
    if (!window.confirm("Reset every customized training day to the default split?")) return;
    clearAllExerciseOverrides();
    haptic(HAPTIC.warn);
    showToast("Full split restored to defaults.", "success");
    renderPlanEditor();
    renderApp();
  });
}

export function renderTrainingSetupEditor() {
  if (!select("planEditor")) return;
  if (!WEEK_DAYS.includes(editorDay)) editorDay = currentDayName();
  renderDayChips();
  renderPlanEditor();
}

function renderDayChips() {
  const seg = select("planDaySeg");
  if (!seg) return;
  seg.innerHTML = WEEK_DAYS.map((day) => {
    const short = day.slice(0, 3);
    const active = day === editorDay ? "active" : "";
    const customized = state?.workoutOverrides?.[day] ? "customized" : "";
    return `<button type="button" class="plan-day-chip ${active} ${customized}" data-plan-day="${day}">${short}</button>`;
  }).join("");
}

function currentEditableExercises() {
  return (getWorkoutForDay(editorDay).exercises || []).map((ex) => ({ ...ex }));
}

function persistExercises(list) {
  setDayExercises(editorDay, list);
  renderPlanEditor();
  renderApp();
}

function renderPlanEditor() {
  const panel = select("planEditor");
  if (!panel || !state) return;

  renderDayChips();
  const workout = getWorkoutForDay(editorDay);
  const exercises = workout.exercises || [];
  const isCustom = Boolean(state.workoutOverrides?.[editorDay]);
  const meta = select("planDayMeta");
  if (meta) {
    meta.textContent =
      workout.isOff && !exercises.length
        ? `${workout.title} · rest / closed`
        : `${workout.title} · ${exercises.length} exercise${exercises.length === 1 ? "" : "s"}${isCustom ? " · customized" : ""}`;
  }

  if (workout.isOff && !exercises.length) {
    panel.innerHTML = `
      <div class="plan-empty">
        <p><b>Rest day</b></p>
        <p>Add an exercise below to turn ${escapeHtml(editorDay)} into a training day, or pick another day.</p>
      </div>`;
    return;
  }

  panel.innerHTML = exercises
    .map((ex, idx) => {
      return `
        <article class="plan-ex-row" data-ex-index="${idx}">
          <div class="plan-ex-main">
            <b>${escapeHtml(ex.name)}</b>
            <label class="plan-sets-field">
              <span>Sets</span>
              <input type="text" data-plan-sets="${idx}" value="${escapeHtml(ex.sets || "3 x 10")}" maxlength="24" />
            </label>
          </div>
          <div class="plan-ex-actions">
            <button type="button" class="icon-btn plan-move" data-plan-move="up" data-ex-index="${idx}" aria-label="Move up" ${idx === 0 ? "disabled" : ""}>${icon("chevronLeft", "plan-chevron-up", 16)}</button>
            <button type="button" class="icon-btn plan-move" data-plan-move="down" data-ex-index="${idx}" aria-label="Move down" ${idx === exercises.length - 1 ? "disabled" : ""}>${icon("chevronLeft", "plan-chevron-down", 16)}</button>
            <button type="button" class="icon-btn danger" data-plan-remove="${idx}" aria-label="Remove">${icon("trash", "", 16)}</button>
          </div>
        </article>`;
    })
    .join("");
}

function handlePlanClick(event) {
  const removeBtn = event.target.closest("[data-plan-remove]");
  if (removeBtn) {
    const idx = Number(removeBtn.getAttribute("data-plan-remove"));
    const list = currentEditableExercises();
    list.splice(idx, 1);
    haptic(HAPTIC.tap);
    persistExercises(list);
    showToast("Exercise removed.");
    return;
  }

  const moveBtn = event.target.closest("[data-plan-move]");
  if (moveBtn) {
    const idx = Number(moveBtn.getAttribute("data-ex-index"));
    const dir = moveBtn.getAttribute("data-plan-move");
    const list = currentEditableExercises();
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    haptic(HAPTIC.tap);
    persistExercises(list);
  }
}

function handlePlanChange(event) {
  const input = event.target.closest("[data-plan-sets]");
  if (!input) return;
  const idx = Number(input.getAttribute("data-plan-sets"));
  const list = currentEditableExercises();
  if (!list[idx]) return;
  list[idx] = { ...list[idx], sets: String(input.value || "3 x 10").trim() || "3 x 10" };
  setDayExercises(editorDay, list);
  saveState();
}

async function runPlanSearch() {
  const input = select("planSearchInput");
  const container = select("planSearchResults");
  if (!input || !container) return;

  const term = input.value.trim();
  const token = ++searchToken;
  if (term.length < 2) {
    container.innerHTML = `<p class="plan-search-hint">Search the exercise library (same as Train → Library).</p>`;
    return;
  }

  container.innerHTML = `<p class="plan-search-hint">Searching…</p>`;
  const { results, offline } = await searchExercises(term);
  if (token !== searchToken) return;

  let rows = results || [];

  if (!rows.length) {
    const local = localExerciseMatches(term);
    rows = local;
    if (!local.length) {
      container.innerHTML = offline
        ? `<p class="plan-search-hint">Library needs a connection the first time. Try a built-in name like “bench”.</p>`
        : `<p class="plan-search-hint">No matches. Try another name.</p>`;
      return;
    }
  }

  container.innerHTML = rows
    .slice(0, 12)
    .map((result) => {
      const name = result.name || result;
      const id = result.id || "";
      const meta = [result.category, (result.muscles || []).slice(0, 2).join(", ")].filter(Boolean).join(" · ");
      return `
        <button type="button" class="plan-search-row" data-add-name="${escapeHtml(name)}" data-add-id="${escapeHtml(String(id))}">
          <span class="plan-search-icon">${icon("dumbbell", "", 16)}</span>
          <span class="plan-search-body">
            <b>${escapeHtml(name)}</b>
            ${meta ? `<small>${escapeHtml(meta)}</small>` : ""}
          </span>
          <span class="plan-add-pill">Add</span>
        </button>`;
    })
    .join("");
}

function localExerciseMatches(term) {
  const q = term.toLowerCase();
  const seen = new Set();
  const out = [];
  getActiveSplit().forEach((day) => {
    (day.exercises || []).forEach((ex) => {
      const name = ex.name;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      if (!key.includes(q)) return;
      seen.add(key);
      out.push({ id: "", name, category: day.title || "", muscles: day.muscles || [] });
    });
  });
  return out;
}

function handleSearchPick(event) {
  const btn = event.target.closest("[data-add-name]");
  if (!btn) return;
  const name = btn.getAttribute("data-add-name");
  const wgerId = btn.getAttribute("data-add-id") || "";
  if (!name) return;

  const list = currentEditableExercises();
  if (list.some((ex) => String(ex.name).toLowerCase() === name.toLowerCase())) {
    showToast("Already on this day.");
    return;
  }

  list.push({
    id: uid(),
    name,
    sets: "3 x 10",
    cues: "Control the eccentric. Leave 1–2 reps in reserve.",
    timerSec: 90,
    trackWeight: true,
    wgerId: wgerId || undefined,
  });

  haptic(HAPTIC.success);
  persistExercises(list);
  showToast(`Added ${name} to ${editorDay}.`, "success");
}
