/* Dad Bod — Train: the workout experience. Split hero, exercise cards with
 * load/rep logging, a full-screen rest timer, session celebrations, cardio +
 * abs tracking, and the wger exercise library. */

import { select, setText, setHtml, escapeHtml, formatNum, todayDate, currentDayName, formatClock, debounce } from "../utils.js";
import { state, currentUser, saveState, ensureGymLogForDate } from "../core/store.js";
import { getWorkoutPreferences } from "../core/profile.js";
import {
  absCircuit,
  morningActivityCatalog,
  resolveExerciseGif,
  SCIENCE_RULES,
  parseSetPrescription,
  estimateWorkoutMinutes,
} from "../core/program.js";
import { workoutCompletion, calculateDailyBurn, getWorkoutForDay } from "../core/metrics.js";
import { searchExercises, getExerciseDetail } from "../services/wger.js";
import { icon } from "../ui/icons.js";
import {
  showToast,
  openLayer,
  closeLayer,
  haptic,
  HAPTIC,
  celebrate,
  setRingProgress,
  skeletonCards,
  emptyState,
  bindSegmented,
} from "../ui/components.js";
import { renderApp } from "../core/bus.js";

let activePanel = "strength";

/* ---- Rest timer engine ---- */

const timer = {
  label: "",
  totalSec: 0,
  remainingSec: 0,
  paused: false,
  interval: null,
};

export function startRestTimer(label, seconds) {
  timer.label = label || "Rest";
  timer.totalSec = Math.max(10, Math.round(Number(seconds || 45)));
  timer.remainingSec = timer.totalSec;
  timer.paused = false;

  clearInterval(timer.interval);
  timer.interval = setInterval(tickTimer, 1000);

  openLayer("timerOverlay");
  renderTimer();
  haptic(HAPTIC.tap);
}

function tickTimer() {
  if (timer.paused) return;
  timer.remainingSec -= 1;

  if (timer.remainingSec <= 0) {
    stopTimer();
    haptic(HAPTIC.timerDone);
    showToast(`${timer.label} — rest complete. Next set!`, "success");
    return;
  }

  if (timer.remainingSec <= 3) haptic(8);
  renderTimer();
}

function stopTimer() {
  clearInterval(timer.interval);
  timer.interval = null;
  closeLayer("timerOverlay");
}

function renderTimer() {
  setText("timerLabel", timer.label);
  setText("timerValue", formatClock(timer.remainingSec));
  setRingProgress(select("timerRing"), timer.totalSec > 0 ? timer.remainingSec / timer.totalSec : 0);
  const toggle = select("timerToggleBtn");
  if (toggle) toggle.innerHTML = timer.paused ? icon("play", "", 22) : icon("pause", "", 22);
}

/* ---- Init ---- */

export function initWorkout() {
  bindSegmented("trainSeg", (panel) => {
    activePanel = panel;
    updatePanels();
  });

  select("exerciseList")?.addEventListener("click", handleExerciseListClick);
  select("exerciseList")?.addEventListener("change", handleExerciseListChange);
  select("absList")?.addEventListener("click", handleAbsListClick);

  select("startWorkoutBtn")?.addEventListener("click", () => {
    activePanel = "strength";
    syncSegButtons();
    updatePanels();
    const first = select("exerciseList")?.querySelector(".exercise-card:not(.done)");
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    haptic(HAPTIC.tap);
  });

  /* Timer overlay controls */
  select("timerToggleBtn")?.addEventListener("click", () => {
    timer.paused = !timer.paused;
    renderTimer();
    haptic(HAPTIC.tap);
  });
  select("timerMinusBtn")?.addEventListener("click", () => {
    timer.remainingSec = Math.max(1, timer.remainingSec - 15);
    renderTimer();
  });
  select("timerPlusBtn")?.addEventListener("click", () => {
    timer.remainingSec += 15;
    timer.totalSec = Math.max(timer.totalSec, timer.remainingSec);
    renderTimer();
  });
  select("timerSkipBtn")?.addEventListener("click", () => {
    stopTimer();
    haptic(HAPTIC.tap);
  });

  /* Cardio + activity forms */
  select("morningForm")?.addEventListener("submit", handleMorningSubmit);
  select("morningGuideBtn")?.addEventListener("click", openMorningActivityGuide);
  select("activityForm")?.addEventListener("submit", handleActivitySubmit);

  /* Library */
  select("exerciseSearchInput")?.addEventListener("input", debounce(handleLibrarySearch, 350));
  select("exerciseSearchResults")?.addEventListener("click", handleLibraryResultClick);

  select("exerciseSheetBody")?.addEventListener("click", (event) => {
    const videoBtn = event.target.closest("[data-video-query]");
    if (videoBtn) {
      const query = videoBtn.getAttribute("data-video-query");
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank");
    }
  });
}

function syncSegButtons() {
  select("trainSeg")
    ?.querySelectorAll("[data-seg]")
    .forEach((el) => el.classList.toggle("active", el.getAttribute("data-seg") === activePanel));
}

function updatePanels() {
  select("trainStrengthPanel")?.classList.toggle("hidden", activePanel !== "strength");
  select("trainCardioPanel")?.classList.toggle("hidden", activePanel !== "cardio");
  select("trainLibraryPanel")?.classList.toggle("hidden", activePanel !== "library");
}

/* ---- Strength ---- */

function handleExerciseListClick(event) {
  const videoBtn = event.target.closest("[data-video-query]");
  if (videoBtn) {
    const query = videoBtn.getAttribute("data-video-query");
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank");
    return;
  }

  const timerBtn = event.target.closest("[data-timer]");
  if (timerBtn) {
    startRestTimer(timerBtn.getAttribute("data-exercise-name"), Number(timerBtn.getAttribute("data-timer")));
    return;
  }

  const guideBtn = event.target.closest("[data-guide]");
  if (guideBtn) {
    openExerciseGuide(Number(guideBtn.getAttribute("data-guide")));
    return;
  }

  const toggleTarget = event.target.closest("[data-toggle-exercise]");
  if (toggleTarget && !event.target.closest("input, label, a, button:not(.exercise-main)")) {
    toggleExercise(Number(toggleTarget.getAttribute("data-toggle-exercise")));
  }
}

function handleExerciseListChange(event) {
  const input = event.target;
  const idx = Number(input.getAttribute("data-idx"));
  if (!Number.isFinite(idx)) return;

  const day = currentDayName();
  const log = ensureGymLogForDate(todayDate());
  const key = `${day}-${idx}`;

  if (input.hasAttribute("data-weight-input")) {
    const value = Number(input.value || 0);
    if (Number.isFinite(value) && value > 0) log.exerciseWeights[key] = value;
    else delete log.exerciseWeights[key];
    saveState();
    renderApp();
    return;
  }

  if (input.hasAttribute("data-reps-input")) {
    const value = String(input.value || "").trim();
    if (value) log.exerciseReps[key] = value;
    else delete log.exerciseReps[key];
    saveState();
    return;
  }

  if (input.hasAttribute("data-done-input")) {
    toggleExercise(idx);
  }
}

function toggleExercise(idx) {
  const day = currentDayName();
  const log = ensureGymLogForDate(todayDate());
  const key = `${day}-${idx}`;
  const wasDone = Boolean(log.exerciseDone[key]);
  log.exerciseDone[key] = !wasDone;
  saveState();
  haptic(wasDone ? HAPTIC.tap : HAPTIC.success);

  const completion = workoutCompletion();
  if (!wasDone && completion.gymTotal > 0 && completion.gymDone === completion.gymTotal && !log.sessionCelebratedAt) {
    log.sessionCelebratedAt = new Date().toISOString();
    saveState();
    const burn = calculateDailyBurn();
    celebrate({
      title: "Session Complete",
      subtitle: completion.workout.title,
      statLine: `${completion.gymTotal} exercises · ~${formatNum(burn.evening + burn.abs, 0)} kcal burnt`,
    });
  }

  renderApp();
}

function handleAbsListClick(event) {
  const timerBtn = event.target.closest("[data-timer]");
  if (timerBtn) {
    startRestTimer(timerBtn.getAttribute("data-exercise-name"), Number(timerBtn.getAttribute("data-timer")));
    return;
  }

  const guideBtn = event.target.closest("[data-abs-guide]");
  if (guideBtn) {
    const exercise = absCircuit[Number(guideBtn.getAttribute("data-abs-guide"))];
    if (exercise) showExerciseSheet(exercise);
    return;
  }

  const item = event.target.closest("[data-toggle-abs]");
  if (!item) return;

  const idx = Number(item.getAttribute("data-toggle-abs"));
  const log = ensureGymLogForDate(todayDate());
  const key = `abs-${idx}`;
  log.exerciseDone[key] = !log.exerciseDone[key];
  const completedAbs = absCircuit.filter((_, i) => Boolean(log.exerciseDone?.[`abs-${i}`])).length;
  log.absDone = completedAbs === absCircuit.length && absCircuit.length > 0;
  saveState();
  haptic(HAPTIC.tap);
  renderApp();
}

/* ---- Guide sheet ---- */

function openExerciseGuide(idx) {
  const workout = getWorkoutForDay(currentDayName());
  const exercise = workout.exercises[idx];
  if (exercise) showExerciseSheet(exercise);
}

function showExerciseSheet(exercise) {
  const gifUrl = resolveExerciseGif(exercise.name);
  const showScience = Boolean(currentUser?.isAdmin && exercise.science);
  const videoQuery = `${exercise.name} proper form gym technique`;

  setHtml(
    "exerciseSheetBody",
    `
    <h2 class="sheet-title">${escapeHtml(exercise.name)}</h2>
    ${gifUrl ? `<div class="guide-media"><img src="${gifUrl}" alt="${escapeHtml(exercise.name)} demonstration" loading="lazy" onerror="this.parentElement.remove()" /></div>` : ""}
    <div class="guide-block">
      <h4>${icon("list", "", 15)} Prescription</h4>
      <p>${escapeHtml(exercise.sets || "—")}</p>
    </div>
    <div class="guide-block">
      <h4>${icon("target", "", 15)} Form Cues</h4>
      <p>${escapeHtml(exercise.cues || "Controlled tempo, full range of motion.")}</p>
    </div>
    ${showScience ? `<div class="guide-block science"><h4>${icon("sparkles", "", 15)} Why it works</h4><p>${escapeHtml(exercise.science)}</p></div>` : ""}
    ${exercise.tips ? `<div class="guide-block"><h4>${icon("info", "", 15)} Coaching Notes</h4><p>${escapeHtml(exercise.tips)}</p></div>` : ""}
    <button type="button" class="btn-secondary full-width" data-video-query="${escapeHtml(exercise.videoQuery || videoQuery)}">
      ${icon("externalLink", "", 17)} Watch Form Videos
    </button>`
  );
  openLayer("exerciseSheet");
}

/* ---- Cardio + activity ---- */

function handleMorningSubmit(e) {
  e.preventDefault();
  const log = ensureGymLogForDate(todayDate());

  log.morningActivityType = select("morningActivityType")?.value || "running";
  log.morningMinutes = Number(select("morningMinutes")?.value || 0);
  log.morningDone = Boolean(select("morningDone")?.checked);
  log.absDone = Boolean(select("absDone")?.checked);
  log.morningNotes = select("morningNotes")?.value || "";
  log.morningCustomActivity = String(select("morningCustomActivity")?.value || "").trim();
  log.morningCustomMet = Number(select("morningCustomMet")?.value || 6.5);

  saveState();
  haptic(HAPTIC.success);
  showToast("Cardio check-in saved.", "success");
  renderApp();
}

function handleActivitySubmit(e) {
  e.preventDefault();
  const log = ensureGymLogForDate(todayDate());
  log.steps = Math.max(0, Number(select("activityStepsInput")?.value || 0));
  log.sleepHours = Math.max(0, Number(select("activitySleepInput")?.value || 0));
  saveState();
  haptic(HAPTIC.success);
  showToast("Activity updated.", "success");
  renderApp();
}

function openMorningActivityGuide() {
  const log = ensureGymLogForDate(todayDate());
  const activityType = select("morningActivityType")?.value || log.morningActivityType || "running";
  const config = morningActivityCatalog[activityType] || morningActivityCatalog.running;
  const customName = String(select("morningCustomActivity")?.value || log.morningCustomActivity || "").trim();
  const label = activityType === "custom" && customName ? customName : config.label;

  showExerciseSheet({
    name: label,
    sets: `${Math.max(0, Number(log.morningMinutes || 20)) || 20} minutes`,
    cues: "Warm up 5 minutes. Maintain controlled breathing and upright posture throughout.",
    tips: config.tips || morningActivityCatalog.running.tips,
    videoQuery: `${label} cardio form technique`,
  });
}

/* ---- Library (wger) ---- */

async function handleLibrarySearch() {
  const term = select("exerciseSearchInput")?.value.trim() || "";
  const container = select("exerciseSearchResults");
  if (!container) return;

  if (term.length < 2) {
    container.innerHTML = emptyState("dumbbell", "Search the global exercise library", "700+ exercises with images from wger.de");
    return;
  }

  container.innerHTML = skeletonCards(3);
  const { results, offline } = await searchExercises(term);

  if (offline) {
    container.innerHTML = emptyState("dumbbell", "You're offline", "Exercise library needs an internet connection.");
    return;
  }

  if (!results.length) {
    container.innerHTML = emptyState("search", "No exercises found", "Try a different name — e.g. “bench press”.");
    return;
  }

  container.innerHTML = results
    .map(
      (result) => `
      <button type="button" class="library-row" data-ex-id="${result.id}" data-name="${escapeHtml(result.name)}">
        ${result.thumb || result.image
          ? `<img class="library-thumb" src="${result.thumb || result.image}" alt="" loading="lazy" onerror="this.classList.add('hidden')" />`
          : `<span class="library-thumb placeholder">${icon("dumbbell", "", 18)}</span>`}
        <span class="library-body">
          <span class="library-name">${escapeHtml(result.name)}</span>
          ${result.category || result.muscles.length
            ? `<span class="library-cat">${escapeHtml([result.category, result.muscles.slice(0, 2).join(", ")].filter(Boolean).join(" · "))}</span>`
            : ""}
        </span>
        ${icon("chevronRight", "row-chevron", 17)}
      </button>`
    )
    .join("");
}

async function handleLibraryResultClick(event) {
  const row = event.target.closest("[data-ex-id]");
  if (!row) return;
  haptic(HAPTIC.tap);

  const name = row.getAttribute("data-name") || "Exercise";
  setHtml("exerciseSheetBody", `<h2 class="sheet-title">${escapeHtml(name)}</h2>${skeletonCards(2)}`);
  openLayer("exerciseSheet");

  const detail = await getExerciseDetail(row.getAttribute("data-ex-id"));
  if (!detail) {
    showExerciseSheet({ name, sets: "—", cues: "Details unavailable right now.", videoQuery: `${name} proper form` });
    return;
  }

  setHtml(
    "exerciseSheetBody",
    `
    <h2 class="sheet-title">${escapeHtml(detail.name)}</h2>
    ${detail.image ? `<div class="guide-media"><img src="${detail.image}" alt="${escapeHtml(detail.name)}" loading="lazy" onerror="this.parentElement.remove()" /></div>` : ""}
    ${detail.muscles.length || detail.musclesSecondary.length
      ? `<div class="chip-row">${detail.muscles.map((m) => `<span class="chip protein">${escapeHtml(m)}</span>`).join("")}${detail.musclesSecondary.map((m) => `<span class="chip">${escapeHtml(m)}</span>`).join("")}</div>`
      : ""}
    ${detail.equipment.length ? `<div class="guide-block"><h4>${icon("dumbbell", "", 15)} Equipment</h4><p>${escapeHtml(detail.equipment.join(", "))}</p></div>` : ""}
    ${detail.description ? `<div class="guide-block"><h4>${icon("list", "", 15)} How to perform</h4><p>${escapeHtml(detail.description)}</p></div>` : ""}
    <p class="source-line">Source: ${escapeHtml(detail.source)}</p>
    <button type="button" class="btn-secondary full-width" data-video-query="${escapeHtml(detail.name)} proper form gym technique">
      ${icon("externalLink", "", 17)} Watch Form Videos
    </button>`
  );
}

/* ---- Render ---- */

export function renderWorkout() {
  if (!state) return;
  syncSegButtons();
  updatePanels();
  renderHero();
  renderExerciseList();
  renderAbsList();
  renderCardioForms();
  renderBurnBreakdown();
}

function renderHero() {
  const completion = workoutCompletion();
  const workout = completion.workout;
  const { closedDay, trainingStartDay } = getWorkoutPreferences();
  const hero = select("workoutHero");
  if (!hero) return;

  if (completion.isRestDay) {
    hero.innerHTML = `
      <div class="hero-rest">
        <span class="hero-rest-icon">${icon("moon", "", 28)}</span>
        <h2>${escapeHtml(workout.title)}</h2>
        <p class="hero-cycle">${escapeHtml(trainingStartDay)} start · Closed ${escapeHtml(closedDay)}</p>
      </div>`;
    return;
  }

  const minutes = estimateWorkoutMinutes(workout);
  const pct = completion.gymTotal ? Math.round((completion.gymDone / completion.gymTotal) * 100) : 0;

  hero.innerHTML = `
    <div class="hero-top">
      <span class="hero-day">${escapeHtml(currentDayName())}</span>
      <span class="hero-progress">${completion.gymDone}/${completion.gymTotal}</span>
    </div>
    <h2 class="hero-title">${escapeHtml(workout.title)}</h2>
    ${workout.muscles?.length ? `<div class="chip-row">${workout.muscles.map((m) => `<span class="chip accent">${escapeHtml(m)}</span>`).join("")}</div>` : ""}
    <div class="hero-stats">
      <span>${icon("clock", "", 15)} ~${minutes} min</span>
      <span>${icon("layers", "", 15)} ${completion.gymTotal} exercises</span>
    </div>
    <div class="tile-progress hero-bar"><i style="width:${pct}%"></i></div>
    <button type="button" class="btn-primary hero-cta" id="startWorkoutBtn">
      ${completion.gymComplete ? `${icon("check", "", 18)} Session Complete` : `${icon("play", "", 18)} ${completion.gymDone > 0 ? "Continue Workout" : "Start Workout"}`}
    </button>`;

  select("startWorkoutBtn")?.addEventListener("click", () => {
    activePanel = "strength";
    syncSegButtons();
    updatePanels();
    const first = select("exerciseList")?.querySelector(".exercise-card:not(.done)");
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function renderExerciseList() {
  const list = select("exerciseList");
  if (!list) return;

  const completion = workoutCompletion();
  const workout = completion.workout;
  const day = completion.day;
  const log = completion.log;
  const isAdmin = Boolean(currentUser?.isAdmin);

  renderTodaysTip();

  if (workout.isOff) {
    list.innerHTML = emptyState("moon", "Recovery day", "Hydrate, stretch lightly, and sleep well.");
    return;
  }

  list.innerHTML = workout.exercises
    .map((exercise, idx) => {
      const key = `${day}-${idx}`;
      const done = Boolean(log.exerciseDone[key]);
      const trackWeight = exercise.trackWeight !== false;
      const load = trackWeight ? Number(log.exerciseWeights?.[key] || 0) : 0;
      const reps = String(log.exerciseReps?.[key] || "");
      const timerSec = Math.max(20, Number(exercise.timerSec || parseSetPrescription(exercise.sets).secondsPerSet || 60));
      const gifUrl = resolveExerciseGif(exercise.name);
      const showScience = Boolean(isAdmin && exercise.science);
      const videoQuery = `${exercise.name} proper form gym technique`;
      const cues = exercise.cues || "Controlled tempo, full range of motion.";

      return `
      <article class="exercise-card rich ${done ? "done" : ""}">
        <button type="button" class="exercise-main" data-toggle-exercise="${idx}">
          <span class="exercise-check">${done ? icon("check", "", 15) : ""}</span>
          <span class="exercise-info">
            <span class="exercise-name">${escapeHtml(exercise.name)}</span>
          </span>
          <span class="exercise-sets-pill">${escapeHtml(exercise.sets || "—")}</span>
        </button>

        ${gifUrl
          ? `<div class="guide-media exercise-gif"><img src="${gifUrl}" alt="${escapeHtml(exercise.name)} demonstration" loading="lazy" onerror="this.parentElement.remove()" /></div>`
          : ""}

        <div class="exercise-guide-inline">
          <div class="guide-block">
            <h4>${icon("list", "", 15)} Prescription</h4>
            <p>${escapeHtml(exercise.sets || "—")}</p>
          </div>
          <div class="guide-block">
            <h4>${icon("target", "", 15)} Form Cues</h4>
            <p>${escapeHtml(cues)}</p>
          </div>
          ${showScience
            ? `<div class="guide-block science"><h4>${icon("sparkles", "", 15)} Why it works</h4><p>${escapeHtml(exercise.science)}</p></div>`
            : ""}
          ${exercise.tips
            ? `<div class="guide-block"><h4>${icon("info", "", 15)} Coaching Notes</h4><p>${escapeHtml(exercise.tips)}</p></div>`
            : ""}
          <button type="button" class="btn-secondary full-width" data-video-query="${escapeHtml(exercise.videoQuery || videoQuery)}">
            ${icon("externalLink", "", 17)} Watch Form Videos
          </button>
        </div>

        ${trackWeight
          ? `<div class="exercise-inputs">
              <label>Load kg<input type="number" min="0" step="0.5" inputmode="decimal" value="${load > 0 ? load : ""}" placeholder="35" data-weight-input data-idx="${idx}" /></label>
              <label>Reps<input type="text" value="${escapeHtml(reps)}" placeholder="8,8,7" data-reps-input data-idx="${idx}" /></label>
            </div>`
          : ""}
        <div class="exercise-actions">
          <button type="button" class="btn-chip accent" data-timer="${timerSec}" data-exercise-name="${escapeHtml(exercise.name)}">${icon("timer", "", 15)} ${Math.round(timerSec)}s Rest</button>
        </div>
      </article>`;
    })
    .join("");
}

function renderAbsList() {
  const list = select("absList");
  if (!list) return;

  const log = ensureGymLogForDate(todayDate());

  list.innerHTML = absCircuit
    .map((exercise, idx) => {
      const key = `abs-${idx}`;
      const done = Boolean(log.exerciseDone[key]);
      const timerSec = Math.max(20, Number(exercise.timerSec || 45));
      return `
      <article class="exercise-card compact ${done ? "done" : ""}">
        <button type="button" class="exercise-main" data-toggle-abs="${idx}">
          <span class="exercise-check">${done ? icon("check", "", 15) : ""}</span>
          <span class="exercise-info">
            <span class="exercise-name">${escapeHtml(exercise.name)}</span>
          </span>
          <span class="exercise-sets-pill">${escapeHtml(exercise.sets)}</span>
        </button>
        <div class="exercise-guide-inline compact">
          <div class="guide-block">
            <h4>${icon("target", "", 15)} Form Cues</h4>
            <p>${escapeHtml(exercise.cues || "Controlled tempo, brace your core.")}</p>
          </div>
        </div>
        <div class="exercise-actions">
          <button type="button" class="btn-chip accent" data-timer="${timerSec}" data-exercise-name="${escapeHtml(exercise.name)}">${icon("timer", "", 15)} ${timerSec}s Rest</button>
        </div>
      </article>`;
    })
    .join("");
}

/* One rotating coaching cue per day — replaces the wall of science text. */
const DAILY_TIPS = [
  ...SCIENCE_RULES,
  "Warm up with 2 lighter ramp-up sets before your first heavy set of each lift.",
  "Grip the floor with your feet on presses — full-body tension adds reps.",
  "Log the load immediately after the set. Memory lies; the PR board doesn't.",
  "Hit protein within a couple of hours around training — total daily intake still matters most.",
];

function renderTodaysTip() {
  const box = select("todaysTip");
  if (!box) return;
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  const tip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
  box.innerHTML = `
    <span class="tip-icon">${icon("sparkles", "", 17)}</span>
    <span class="tip-body"><b>Today's Tip</b><p>${escapeHtml(tip)}</p></span>`;
}

function renderCardioForms() {
  const log = ensureGymLogForDate(todayDate());

  if (select("morningActivityType")) select("morningActivityType").value = log.morningActivityType || "running";
  if (select("morningMinutes")) select("morningMinutes").value = log.morningMinutes || "";
  if (select("morningDone")) select("morningDone").checked = Boolean(log.morningDone);
  if (select("absDone")) select("absDone").checked = Boolean(log.absDone);
  if (select("morningNotes")) select("morningNotes").value = log.morningNotes || "";
  if (select("morningCustomActivity")) select("morningCustomActivity").value = log.morningCustomActivity || "";
  if (select("morningCustomMet")) select("morningCustomMet").value = log.morningCustomMet || "";
  if (select("activityStepsInput")) select("activityStepsInput").value = log.steps || "";
  if (select("activitySleepInput")) select("activitySleepInput").value = log.sleepHours || "";
}

function renderBurnBreakdown() {
  const container = select("burnBreakdown");
  if (!container) return;

  const burn = calculateDailyBurn();
  const rows = [
    { label: "Cardio session", value: burn.morning, iconName: "activity" },
    { label: "Abs circuit", value: burn.abs, iconName: "zap" },
    { label: "Gym session", value: burn.evening, iconName: "dumbbell" },
    { label: "Steps", value: burn.steps, iconName: "footprints" },
    { label: "Sleep", value: burn.sleep, iconName: "moon" },
  ];

  container.innerHTML = `
    ${rows
      .map(
        (row) => `
      <div class="burn-row">
        <span class="burn-label">${icon(row.iconName, "", 15)} ${row.label}</span>
        <span class="burn-value">${formatNum(row.value, 0)} kcal</span>
      </div>`
      )
      .join("")}
    <div class="burn-row total">
      <span class="burn-label">${icon("flame", "", 15)} Total burnt</span>
      <span class="burn-value">${formatNum(burn.total, 0)} kcal</span>
    </div>`;
}
