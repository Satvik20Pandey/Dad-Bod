/* Dad Bod — Progress: weight trend, photo timeline with A/B compare slider,
 * strength PRs, and the consistency heatmap. */

import {
  select,
  setText,
  setHtml,
  escapeHtml,
  formatNum,
  todayDate,
  uid,
  normalizeDateInput,
  dayNameFromDate,
  fileToOptimizedDataUrl,
  downloadBlob,
  toCsv,
} from "../utils.js";
import { state, saveState, ensureGymLogForDate } from "../core/store.js";
import { activityHeatmap, getWorkoutForDay, calculateStreak } from "../core/metrics.js";
import { parseSetPrescription } from "../core/program.js";
import { icon } from "../ui/icons.js";
import { showToast, openLayer, closeLayer, haptic, HAPTIC, emptyState, bindSegmented } from "../ui/components.js";
import { drawWeightChart, renderHeatmap } from "../ui/charts.js";
import { renderApp } from "../core/bus.js";

let activePanel = "weight";
let compareSelection = [];

export function initProgress() {
  bindSegmented("progressSeg", (panel) => {
    activePanel = panel;
    updatePanels();
    renderProgress();
  });

  select("weightForm")?.addEventListener("submit", handleWeightSubmit);
  select("photoForm")?.addEventListener("submit", handlePhotoSubmit);
  select("photoGallery")?.addEventListener("click", handleGalleryClick);
  select("exportStrengthBtn")?.addEventListener("click", exportStrengthCsv);

  select("compareRange")?.addEventListener("input", (event) => {
    const pct = Number(event.target.value);
    const afterWrap = select("compareAfterWrap");
    if (afterWrap) afterWrap.style.width = `${pct}%`;
  });
  select("compareCloseBtn")?.addEventListener("click", () => closeLayer("compareSheet"));
}

function updatePanels() {
  select("progressWeightPanel")?.classList.toggle("hidden", activePanel !== "weight");
  select("progressPhotosPanel")?.classList.toggle("hidden", activePanel !== "photos");
  select("progressStrengthPanel")?.classList.toggle("hidden", activePanel !== "strength");
}

/* ---- Weight ---- */

function handleWeightSubmit(e) {
  e.preventDefault();

  const date = select("weightDate")?.value;
  const weight = Number(select("weightValue")?.value || 0);

  if (!date || !weight) {
    showToast("Enter a date and weight.", "error");
    return;
  }

  const existing = state.weightEntries.find((w) => w.date === date);
  if (existing) {
    existing.weight = weight;
  } else {
    state.weightEntries.push({ id: uid("weight"), date, weight });
  }

  state.weightEntries = state.weightEntries.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  haptic(HAPTIC.success);
  showToast("Weight recorded.", "success");
  if (select("weightValue")) select("weightValue").value = "";
  renderApp();
}

function deltaSince(daysAgo) {
  const entries = state.weightEntries;
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const reference = [...entries].reverse().find((entry) => entry.date <= cutoffKey);
  if (!reference || reference === latest) return null;
  return Number(latest.weight) - Number(reference.weight);
}

function renderWeightPanel() {
  const entries = state.weightEntries;
  const profile = state.profile;
  const latest = entries.length ? Number(entries[entries.length - 1].weight) : Number(profile.currentWeight || 0);
  const start = entries.length ? Number(entries[0].weight) : latest;
  const totalDelta = latest - start;
  const weekDelta = deltaSince(7);

  const deltaChip = (value) => {
    if (value == null) return `<span class="delta-chip flat">—</span>`;
    const sign = value > 0 ? "+" : "";
    const cls = value < 0 ? "down" : value > 0 ? "up" : "flat";
    return `<span class="delta-chip ${cls}">${sign}${formatNum(value, 1)} kg</span>`;
  };

  setHtml(
    "weightHero",
    `
    <div class="weight-hero-main">
      <span class="weight-big">${formatNum(latest, 1)}<small> kg</small></span>
      <span class="weight-goal">${icon("target", "", 14)} Goal ${formatNum(Number(profile.goalWeight || 0), 1)} kg</span>
    </div>
    <div class="weight-deltas">
      <div><span class="delta-label">7 days</span>${deltaChip(weekDelta)}</div>
      <div><span class="delta-label">Total</span>${deltaChip(entries.length > 1 ? totalDelta : null)}</div>
      <div><span class="delta-label">Entries</span><span class="delta-chip flat">${entries.length}</span></div>
    </div>`
  );

  if (select("weightDate") && !select("weightDate").value) select("weightDate").value = todayDate();

  requestAnimationFrame(() => {
    drawWeightChart(select("weightChart"), entries, Number(profile.goalWeight || 0));
  });

  setText("heatmapStreakLabel", `${calculateStreak()}-day logging streak`);
  requestAnimationFrame(() => renderHeatmap(select("heatmapGrid"), activityHeatmap(15)));
}

/* ---- Photos ---- */

async function handlePhotoSubmit(e) {
  e.preventDefault();

  const file = select("photoInput")?.files?.[0];
  if (!file) {
    showToast("Choose or take a photo first.", "error");
    return;
  }

  try {
    const image = await fileToOptimizedDataUrl(file);
    const photoDate = normalizeDateInput(select("photoDate")?.value || todayDate());

    state.photoEntries.unshift({
      id: uid("photo"),
      date: photoDate,
      capturedAt: new Date().toISOString(),
      type: select("photoType")?.value || "body",
      note: select("photoNote")?.value || "",
      image,
    });

    saveState();
    select("photoForm")?.reset();
    if (select("photoDate")) select("photoDate").value = todayDate();
    haptic(HAPTIC.success);
    showToast("Photo added to your timeline.", "success");
    renderApp();
  } catch (error) {
    console.warn("Photo save failed", error);
    showToast("Photo save failed. Try a smaller image.", "error");
  }
}

function handleGalleryClick(event) {
  const deleteBtn = event.target.closest("[data-photo-delete]");
  if (deleteBtn) {
    const id = deleteBtn.getAttribute("data-photo-delete");
    state.photoEntries = (state.photoEntries || []).filter((entry) => entry.id !== id);
    compareSelection = compareSelection.filter((selectedId) => selectedId !== id);
    saveState();
    showToast("Photo deleted.");
    renderApp();
    return;
  }

  const card = event.target.closest("[data-photo-id]");
  if (!card) return;

  const id = card.getAttribute("data-photo-id");
  haptic(HAPTIC.tap);

  if (compareSelection.includes(id)) {
    compareSelection = compareSelection.filter((selectedId) => selectedId !== id);
  } else {
    compareSelection.push(id);
    if (compareSelection.length > 2) compareSelection = compareSelection.slice(-2);
  }

  if (compareSelection.length === 2) {
    openCompareSheet();
  }
  renderPhotosPanel();
}

function openCompareSheet() {
  const photos = compareSelection
    .map((id) => (state.photoEntries || []).find((entry) => entry.id === id))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (photos.length !== 2) return;

  const [before, after] = photos;
  const beforeImg = select("compareBeforeImg");
  const afterImg = select("compareAfterImg");
  if (beforeImg) beforeImg.src = before.image;
  if (afterImg) afterImg.src = after.image;
  setText("compareBeforeLabel", before.date);
  setText("compareAfterLabel", after.date);

  const beforeWeight = getWeightForDate(before.date);
  const afterWeight = getWeightForDate(after.date);
  const deltaText =
    Number.isFinite(beforeWeight) && Number.isFinite(afterWeight)
      ? ` · ${formatNum(afterWeight - beforeWeight, 1)} kg change`
      : "";
  setText("compareMeta", `${daysBetween(before.date, after.date)} days apart${deltaText}`);

  const range = select("compareRange");
  if (range) range.value = "50";
  const afterWrap = select("compareAfterWrap");
  if (afterWrap) afterWrap.style.width = "50%";

  openLayer("compareSheet");
}

function daysBetween(a, b) {
  const ms = Math.abs(new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`));
  return Math.round(ms / 86400000);
}

function getWeightForDate(dateText) {
  const target = normalizeDateInput(dateText);
  const entries = [...(state.weightEntries || [])].sort((a, b) => a.date.localeCompare(b.date));
  const exact = entries.find((entry) => normalizeDateInput(entry.date) === target);
  if (exact) return Number(exact.weight);

  let latest = null;
  entries.forEach((entry) => {
    if (entry.date <= target) latest = entry;
  });
  return latest ? Number(latest.weight) : null;
}

function renderPhotosPanel() {
  const gallery = select("photoGallery");
  if (!gallery) return;

  if (select("photoDate") && !select("photoDate").value) select("photoDate").value = todayDate();

  setText(
    "compareHint",
    compareSelection.length === 1
      ? "Tap one more photo to compare."
      : "Tap two photos to open the before/after slider."
  );

  if (!state.photoEntries?.length) {
    gallery.innerHTML = emptyState("camera", "No photos yet", "Add a weekly photo — future you will thank you.");
    return;
  }

  const sorted = [...state.photoEntries].sort((a, b) => {
    const dateDiff = normalizeDateInput(b.date).localeCompare(normalizeDateInput(a.date));
    if (dateDiff !== 0) return dateDiff;
    return String(b.capturedAt || "").localeCompare(String(a.capturedAt || ""));
  });

  gallery.innerHTML = sorted
    .map((photo, index) => {
      const date = normalizeDateInput(photo.date);
      const weight = getWeightForDate(date);
      const selected = compareSelection.includes(photo.id);
      return `
      <figure class="photo-card ${selected ? "selected" : ""}" data-photo-id="${photo.id}">
        <img src="${photo.image}" alt="${photo.type === "body" ? "Body" : "Scale"} photo from ${date}" loading="lazy" />
        <figcaption>
          <span class="photo-date">${date}</span>
          <span class="photo-meta">${photo.type === "body" ? "Body" : "Scale"}${Number.isFinite(weight) ? ` · ${formatNum(weight, 1)} kg` : ""}${index === 0 ? " · Latest" : ""}</span>
          ${photo.note ? `<span class="photo-note">${escapeHtml(photo.note)}</span>` : ""}
        </figcaption>
        ${selected ? `<span class="photo-pick">${icon("check", "", 14)}</span>` : ""}
        <button type="button" class="photo-delete" data-photo-delete="${photo.id}" aria-label="Delete photo">${icon("trash", "", 14)}</button>
      </figure>`;
    })
    .join("");
}

/* ---- Strength ---- */

function collectStrengthRows() {
  const rows = [];
  const entries = Object.entries(state.gymLogsByDate || {}).sort((a, b) => a[0].localeCompare(b[0]));

  entries.forEach(([date, log]) => {
    const dayName = dayNameFromDate(date);
    const workout = getWorkoutForDay(dayName);
    if (!workout || workout.isOff) return;

    workout.exercises.forEach((exercise, idx) => {
      const key = `${dayName}-${idx}`;
      const done = Boolean(log?.exerciseDone?.[key]);
      const loadKg = Number(log?.exerciseWeights?.[key] || 0);
      if (!done && loadKg <= 0) return;
      const parsed = parseSetPrescription(exercise.sets);
      const reps = Number(parsed.repsPerSet || 0);
      const estOneRm = loadKg > 0 && reps > 0 ? loadKg * (1 + reps / 30) : 0;

      rows.push({
        date,
        day: dayName,
        split: workout.title,
        exercise: exercise.name,
        setsReps: exercise.sets,
        loggedReps: String(log?.exerciseReps?.[key] || ""),
        weightKg: loadKg,
        completed: done,
        estOneRm,
      });
    });
  });

  return rows;
}

function renderStrengthPanel() {
  const container = select("strengthList");
  if (!container) return;

  const rows = collectStrengthRows();
  if (!rows.length) {
    container.innerHTML = emptyState("medal", "No lifts logged yet", "Log loads during workouts to build your PR board.");
    return;
  }

  const prByExercise = new Map();
  rows.forEach((row) => {
    if (row.weightKg <= 0) return;
    const current = prByExercise.get(row.exercise);
    if (!current || row.weightKg > current.weightKg) prByExercise.set(row.exercise, row);
  });

  const prs = [...prByExercise.values()].sort((a, b) => b.weightKg - a.weightKg).slice(0, 12);

  container.innerHTML = prs
    .map(
      (pr) => `
      <div class="pr-row">
        <span class="pr-icon">${icon("medal", "", 18)}</span>
        <span class="pr-body">
          <span class="pr-name">${escapeHtml(pr.exercise)}</span>
          <span class="pr-meta">${escapeHtml(pr.split)} · ${pr.date}</span>
        </span>
        <span class="pr-value">${formatNum(pr.weightKg, 1)} kg${pr.estOneRm > 0 ? `<small>1RM ~${formatNum(pr.estOneRm, 0)}</small>` : ""}</span>
      </div>`
    )
    .join("");
}

function exportStrengthCsv() {
  const rows = collectStrengthRows();
  if (!rows.length) {
    showToast("No strength data to export yet.", "error");
    return;
  }

  const csv = toCsv(
    ["Date", "Day", "Split", "Exercise", "Prescription", "Reps Logged", "Weight (kg)", "Completed", "Est. 1RM (kg)"],
    rows.map((row) => [
      row.date,
      row.day,
      row.split,
      row.exercise,
      row.setsReps,
      row.loggedReps,
      row.weightKg > 0 ? formatNum(row.weightKg, 1) : "",
      row.completed ? "Yes" : "No",
      row.estOneRm > 0 ? formatNum(row.estOneRm, 1) : "",
    ])
  );

  downloadBlob(csv, `dad-bod-strength-${todayDate()}.csv`, "text/csv;charset=utf-8");
  showToast("Strength CSV exported.", "success");
}

/* ---- Render ---- */

export function renderProgress() {
  if (!state) return;
  updatePanels();
  if (activePanel === "weight") renderWeightPanel();
  if (activePanel === "photos") renderPhotosPanel();
  if (activePanel === "strength") renderStrengthPanel();
}
