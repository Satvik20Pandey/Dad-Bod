/* Dad Bod — Home: the Daily Mission. Physique Score hero, calorie/burn rings,
 * and the bento grid that routes into every corner of the app. */

import { WATER_GLASS_ML } from "../config.js";
import { select, setText, escapeHtml, formatNum, todayDate, greetingForHour, currentDayName } from "../utils.js";
import { state, currentUser, saveState, getWaterMl, setWaterMl, ensureGymLogForDate } from "../core/store.js";
import {
  dailyTotals,
  calculateDailyBurn,
  calculateStreak,
  dailyMissions,
  physiqueScore,
  workoutCompletion,
  activityHeatmap,
} from "../core/metrics.js";
import { getCoins } from "../core/rewards.js";
import { icon } from "../ui/icons.js";
import { setRingProgress, animateNumber, haptic, HAPTIC, openLayer, fireConfetti, showToast } from "../ui/components.js";
import { drawSparkline, renderHeatmap } from "../ui/charts.js";
import { renderApp, goToScreen } from "../core/bus.js";

let waterCelebratedFor = "";

export function initHome() {
  select("bentoGrid")?.addEventListener("click", handleBentoClick);
  bindChip("coinsChip", () => {
    haptic(HAPTIC.tap);
    openLayer("rewardsSheet");
  });
  bindChip("streakChip", () => {
    haptic(HAPTIC.tap);
    goToScreen("progress");
    requestAnimationFrame(() => {
      select("heatmapGrid")?.closest(".heatmap-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  select("missionCard")?.addEventListener("click", (event) => {
    const cta = event.target.closest("[data-cta-screen]");
    if (cta) {
      haptic(HAPTIC.tap);
      goToScreen(cta.getAttribute("data-cta-screen"));
      return;
    }
    const target = event.target.closest("[data-mission]");
    if (!target) return;
    const key = target.getAttribute("data-mission");
    if (key === "protein" || key === "calories") goToScreen("diet");
    if (key === "workout") goToScreen("train");
  });
}

function bindChip(id, onActivate) {
  const el = select(id);
  if (!el) return;
  el.addEventListener("click", onActivate);
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  });
}

function handleBentoClick(event) {
  const waterBtn = event.target.closest("[data-water]");
  if (waterBtn) {
    const delta = Number(waterBtn.getAttribute("data-water")) * WATER_GLASS_ML;
    adjustWater(delta);
    return;
  }

  const tile = event.target.closest("[data-tile]");
  if (!tile) return;
  const kind = tile.getAttribute("data-tile");
  haptic(HAPTIC.tap);

  if (kind === "workout") goToScreen("train");
  else if (kind === "weight") goToScreen("progress");
  else if (kind === "macros") goToScreen("diet");
  else if (kind === "activity") goToScreen("train");
  else if (kind === "streak") goToScreen("progress");
  else if (kind === "nearby") openLayer("nearbySheet");
  else if (kind === "recipes") openLayer("recipesSheet");
}

export function adjustWater(deltaMl) {
  const date = todayDate();
  const target = Math.max(1000, Number(state.profile.waterTargetMl || 2500));
  const before = getWaterMl(date);
  const after = Math.max(0, before + deltaMl);
  setWaterMl(date, after);
  saveState();
  haptic(HAPTIC.tap);

  if (before < target && after >= target && waterCelebratedFor !== date) {
    waterCelebratedFor = date;
    fireConfetti(1400);
    showToast("Hydration goal complete!", "success");
    haptic(HAPTIC.success);
  }

  renderApp();
}

export function renderHome() {
  if (!state) return;

  renderGreeting();
  renderMission();
  renderRings();
  renderBento();
}

function renderGreeting() {
  setText("greetingText", `${greetingForHour()},`);
  setText("greetingName", currentUser?.name?.split(" ")[0] || "Athlete");
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleDateString("en-US", { month: "short" });
  setText("dateTimeText", `${weekday}, ${day} ${month}`);

  const streak = calculateStreak();
  setText("streakCount", String(streak));
  select("streakChip")?.classList.toggle("hot", streak >= 3);

  animateNumber(select("coinsCount"), getCoins(), { digits: 0 });
  renderAvatar();
}

function renderAvatar() {
  const el = select("avatarInitial");
  if (!el) return;

  const initial = (currentUser?.name || "A").trim().charAt(0).toUpperCase();
  const photo = currentUser?.photoUrl || "";

  /* Only touch the DOM when the identity actually changes. */
  if (el.dataset.photo === photo && el.dataset.initial === initial) return;
  el.dataset.photo = photo;
  el.dataset.initial = initial;

  if (photo) {
    el.classList.add("has-photo");
    el.innerHTML = `<img src="${escapeHtml(photo)}" alt="" referrerpolicy="no-referrer" />`;
    const img = el.querySelector("img");
    if (img) {
      img.onerror = () => {
        el.classList.remove("has-photo");
        el.textContent = initial;
      };
    }
    return;
  }

  el.classList.remove("has-photo");
  el.textContent = initial;
}

function renderMission() {
  const missions = dailyMissions();
  const score = physiqueScore();

  const scoreEl = select("scoreValue");
  animateNumber(scoreEl, score, { digits: 0 });
  setRingProgress(select("scoreRing"), score / 100);

  const hint = select("missionHint");
  if (hint) {
    hint.textContent = "";
    hint.classList.add("hidden");
    hint.setAttribute("aria-hidden", "true");
  }

  const list = select("missionList");
  if (!list) return;
  list.innerHTML = missions
    .map(
      (mission) => `
      <button type="button" class="mission-item ${mission.done ? "done" : ""}" data-mission="${mission.key}">
        <span class="mission-check">${mission.done ? icon("check", "", 13) : ""}</span>
        <span class="mission-body">
          <span class="mission-label">${escapeHtml(mission.label)}</span>
          <span class="mission-detail">${escapeHtml(mission.detail)}</span>
        </span>
        <span class="mission-bar"><i style="width:${Math.round(mission.progress * 100)}%"></i></span>
      </button>`
    )
    .join("");

  renderMissionCta(missions);
}

/* One contextual next action — the thing that moves the score most right now. */
function renderMissionCta(missions) {
  const container = select("missionCta");
  if (!container) return;

  const completion = workoutCompletion();
  const proteinDone = missions.find((m) => m.key === "protein")?.done;

  let cta;
  if (!completion.isRestDay && !completion.gymComplete && completion.gymTotal > 0) {
    cta = {
      screen: "train",
      iconName: "play",
      label: completion.gymDone > 0 ? "Continue Workout" : "Start Today's Workout",
      sub: completion.workout.title,
    };
  } else if (!proteinDone) {
    cta = { screen: "diet", iconName: "utensils", label: "Log Your Next Meal", sub: "Protein builds the physique" };
  } else {
    cta = { screen: "progress", iconName: "trending", label: "Review Your Progress", sub: "See how far you've come" };
  }

  container.innerHTML = `
    <button type="button" class="mission-cta" data-cta-screen="${cta.screen}">
      <span class="cta-icon">${icon(cta.iconName, "", 18)}</span>
      <span class="cta-body"><b>${escapeHtml(cta.label)}</b><small>${escapeHtml(cta.sub)}</small></span>
      ${icon("chevronRight", "", 17)}
    </button>`;
}

function renderRings() {
  const totals = dailyTotals();
  const burn = calculateDailyBurn();
  const profile = state.profile;
  const target = Number(profile.calorieTarget || 2000);
  const remaining = Math.max(0, target - totals.kcal);
  const burnTarget = Math.max(1200, Number(profile.maintenanceCalories || 2200));

  setRingProgress(select("calRing"), target > 0 ? totals.kcal / target : 0);
  animateNumber(select("calRingValue"), remaining, { digits: 0 });
  setText("calRingSub", `${formatNum(totals.kcal, 0)} / ${formatNum(target, 0)} kcal`);

  setRingProgress(select("burnRing"), burnTarget > 0 ? burn.total / burnTarget : 0);
  animateNumber(select("burnRingValue"), burn.total, { digits: 0 });
  /* Outer caption stays "Activity" — covers workouts, steps, sleep without clutter. */

  const log = ensureGymLogForDate(todayDate());
  animateNumber(select("heroSteps"), Number(log.steps || 0), { digits: 0 });
  animateNumber(select("heroBurn"), burn.total, { digits: 0 });
  animateNumber(select("heroEaten"), totals.kcal, { digits: 0 });

  const macros = [
    { id: "pillProtein", barId: "barProtein", value: totals.protein, target: profile.macros.proteinG },
    { id: "pillCarbs", barId: "barCarbs", value: totals.carbs, target: profile.macros.carbsG },
    { id: "pillFat", barId: "barFat", value: totals.fat, target: profile.macros.fatG },
  ];
  macros.forEach((macro) => {
    setText(macro.id, `${formatNum(macro.value, 0)} / ${formatNum(macro.target, 0)}g`);
    const bar = select(macro.barId);
    if (bar) bar.style.width = `${Math.min(100, Math.round((macro.value / Math.max(1, macro.target)) * 100))}%`;
  });
}

function renderBento() {
  const grid = select("bentoGrid");
  if (!grid) return;

  const completion = workoutCompletion();
  const water = getWaterMl(todayDate());
  const waterTarget = Math.max(1000, Number(state.profile.waterTargetMl || 2500));
  const glasses = Math.round(water / WATER_GLASS_ML);
  const latestWeight = state.weightEntries.length
    ? Number(state.weightEntries[state.weightEntries.length - 1].weight)
    : Number(state.profile.currentWeight || 0);
  const goalWeight = Number(state.profile.goalWeight || 0);
  const log = ensureGymLogForDate(todayDate());
  const totals = dailyTotals();
  const streak = calculateStreak();

  const workoutStatus = completion.isRestDay
    ? "Recovery day — grow while you rest"
    : `${completion.gymDone}/${completion.gymTotal} exercises done`;
  const workoutPct = completion.isRestDay
    ? 100
    : completion.gymTotal
      ? Math.round((completion.gymDone / completion.gymTotal) * 100)
      : 0;

  grid.innerHTML = `
    <button type="button" class="bento-tile tile-wide tile-workout" data-tile="workout">
      <div class="tile-top">
        <span class="tile-icon accent">${icon("dumbbell")}</span>
        <span class="tile-kicker">${escapeHtml(currentDayName())} Session</span>
      </div>
      <h3 class="tile-title">${escapeHtml(completion.workout.title)}</h3>
      <p class="tile-sub">${escapeHtml(workoutStatus)}</p>
      <div class="tile-progress"><i style="width:${workoutPct}%"></i></div>
      <span class="tile-cta">${completion.isRestDay ? "View plan" : "Start training"} ${icon("chevronRight", "", 15)}</span>
    </button>

    <div class="bento-tile tile-water" data-tile="water">
      <div class="tile-top">
        <span class="tile-icon water">${icon("droplet")}</span>
        <span class="tile-kicker">Water</span>
      </div>
      <h3 class="tile-title">${(water / 1000).toFixed(1)}<small> / ${(waterTarget / 1000).toFixed(1)} L</small></h3>
      <div class="water-glasses">${renderWaterGlasses(water, waterTarget)}</div>
      <div class="water-actions">
        <button type="button" class="water-btn" data-water="-1" aria-label="Remove a glass">${icon("minus", "", 16)}</button>
        <span class="water-count">${glasses} glasses</span>
        <button type="button" class="water-btn add" data-water="1" aria-label="Add a glass">${icon("plus", "", 16)}</button>
      </div>
    </div>

    <button type="button" class="bento-tile tile-weight" data-tile="weight">
      <div class="tile-top">
        <span class="tile-icon mint">${icon("scale")}</span>
        <span class="tile-kicker">Weight</span>
      </div>
      <h3 class="tile-title">${formatNum(latestWeight, 1)}<small> kg</small></h3>
      <p class="tile-sub">Goal ${formatNum(goalWeight, 1)} kg</p>
      <canvas id="weightSpark" class="tile-spark"></canvas>
    </button>

    <button type="button" class="bento-tile tile-macros" data-tile="macros">
      <div class="tile-top">
        <span class="tile-icon protein">${icon("zap")}</span>
        <span class="tile-kicker">Macros</span>
      </div>
      ${renderMacroRows(totals)}
    </button>

    <button type="button" class="bento-tile tile-activity" data-tile="activity">
      <div class="tile-top">
        <span class="tile-icon warm">${icon("footprints")}</span>
        <span class="tile-kicker">Activity</span>
      </div>
      <div class="activity-rows">
        <span>${icon("footprints", "", 15)} ${formatNum(Number(log.steps || 0), 0)} steps</span>
        <span>${icon("moon", "", 15)} ${formatNum(Number(log.sleepHours || 0), 1)} h sleep</span>
      </div>
      <span class="tile-cta">Log activity ${icon("chevronRight", "", 15)}</span>
    </button>

    <button type="button" class="bento-tile tile-streak" data-tile="streak">
      <div class="tile-top">
        <span class="tile-icon flame">${icon("flame")}</span>
        <span class="tile-kicker">Consistency</span>
      </div>
      <h3 class="tile-title">${streak}<small> day streak</small></h3>
      <div class="mini-heatmap" id="miniHeatmap"></div>
    </button>

    <button type="button" class="bento-tile tile-nearby" data-tile="nearby">
      <span class="tile-icon blue">${icon("mapPin")}</span>
      <h3 class="tile-mini-title">Gyms Nearby</h3>
      <p class="tile-sub">Find gyms & parks around you</p>
    </button>

    <button type="button" class="bento-tile tile-recipes" data-tile="recipes">
      <span class="tile-icon gold">${icon("chef")}</span>
      <h3 class="tile-mini-title">Recipes</h3>
      <p class="tile-sub">1,000+ USDA healthy recipes</p>
    </button>
  `;

  const sparkValues = state.weightEntries.slice(-14).map((entry) => Number(entry.weight));
  if (sparkValues.length >= 2) {
    requestAnimationFrame(() => drawSparkline(select("weightSpark"), sparkValues));
  }

  requestAnimationFrame(() => {
    renderHeatmap(select("miniHeatmap"), activityHeatmap(8));
  });
}

function renderWaterGlasses(water, target) {
  const totalGlasses = Math.max(4, Math.round(target / WATER_GLASS_ML));
  const filled = Math.min(totalGlasses, Math.round(water / WATER_GLASS_ML));
  let html = "";
  for (let i = 0; i < totalGlasses; i += 1) {
    html += `<span class="glass-dot ${i < filled ? "filled" : ""}"></span>`;
  }
  return html;
}

function renderMacroRows(totals) {
  const profile = state.profile;
  const rows = [
    { label: "P", cls: "protein", value: totals.protein, target: profile.macros.proteinG },
    { label: "C", cls: "carbs", value: totals.carbs, target: profile.macros.carbsG },
    { label: "F", cls: "fat", value: totals.fat, target: profile.macros.fatG },
  ];
  return `<div class="macro-rows">${rows
    .map(
      (row) => `
      <div class="macro-row">
        <span class="macro-tag ${row.cls}">${row.label}</span>
        <div class="macro-track"><i class="${row.cls}" style="width:${Math.min(100, Math.round((row.value / Math.max(1, row.target)) * 100))}%"></i></div>
        <span class="macro-val">${formatNum(row.value, 0)}g</span>
      </div>`
    )
    .join("")}</div>`;
}
