/* Dad Bod — daily derived metrics: totals, burn, streak, missions, and the Physique Score. */

import { todayDate, dayNameFromDate, currentDayName, localDateString } from "../utils.js";
import { nutrientFields, normalizeNutrition, zeroNutritionTotals } from "./nutrition.js";
import { state, currentUser, getDayMeals, ensureGymLogForDate, getWaterMl, saveState } from "./store.js";
import { getWorkoutPreferences } from "./profile.js";
import {
  ADMIN_GYM_SPLIT,
  GENERIC_GYM_SPLIT,
  absCircuit,
  morningActivityCatalog,
  buildProgramWeeklySchedule,
  parseSetPrescription,
} from "./program.js";
import { mifflinBmr } from "./profile.js";

/* ---- Nutrition totals ---- */

export function dailyTotals(date = todayDate()) {
  const list = getDayMeals(date);
  return list.reduce((acc, meal) => {
    const nutrition = normalizeNutrition(meal);
    acc.kcal += nutrition.kcal;
    nutrientFields.forEach((field) => {
      acc[field] += Number(nutrition[field] || 0);
    });
    return acc;
  }, zeroNutritionTotals());
}

/* ---- Workout schedule ---- */

export function getActiveSplit() {
  return currentUser?.isAdmin ? ADMIN_GYM_SPLIT : GENERIC_GYM_SPLIT;
}

export function buildWeeklySchedule() {
  const { closedDay, trainingStartDay } = getWorkoutPreferences();
  return buildProgramWeeklySchedule(getActiveSplit(), closedDay, trainingStartDay);
}

export function getWorkoutForDay(day = currentDayName()) {
  const { trainingStartDay } = getWorkoutPreferences();
  const schedule = buildWeeklySchedule();
  const base = schedule[day] || schedule[trainingStartDay] || getActiveSplit()[0];
  return applyWorkoutOverride(day, base);
}

/** Merge a user-customized exercise list onto the scheduled day template. */
function applyWorkoutOverride(day, workout) {
  const override = state?.workoutOverrides?.[day];
  if (!override || typeof override !== "object") return workout;

  const next = {
    ...workout,
    exercises: Array.isArray(override.exercises)
      ? override.exercises.map((ex) => ({ ...ex }))
      : (workout.exercises || []).map((ex) => ({ ...ex })),
  };

  if (typeof override.title === "string" && override.title.trim()) {
    next.title = override.title.trim();
  }
  if (typeof override.note === "string") {
    next.note = override.note;
  }

  /* Custom plan can turn a closed/rest day into a training day if exercises exist. */
  if (next.exercises.length > 0) {
    next.isOff = false;
  } else if (override.isOff === true) {
    next.isOff = true;
  }

  return next;
}

export function getEditableWorkoutForDay(day = currentDayName()) {
  return getWorkoutForDay(day);
}

export function setDayExercises(day, exercises) {
  if (!state) return;
  if (!state.workoutOverrides || typeof state.workoutOverrides !== "object") {
    state.workoutOverrides = {};
  }
  const list = Array.isArray(exercises) ? exercises.map((ex) => ({ ...ex })) : [];
  state.workoutOverrides[day] = {
    ...(state.workoutOverrides[day] || {}),
    exercises: list,
    isOff: list.length === 0 ? Boolean(state.workoutOverrides[day]?.isOff) : false,
  };
  saveState();
}

export function clearDayExerciseOverride(day) {
  if (!state?.workoutOverrides?.[day]) return;
  delete state.workoutOverrides[day];
  saveState();
}

export function clearAllExerciseOverrides() {
  if (!state) return;
  state.workoutOverrides = {};
  saveState();
}

export function workoutCompletion(date = todayDate()) {
  const day = dayNameFromDate(date);
  const workout = getWorkoutForDay(day);
  const log = ensureGymLogForDate(date);

  const gymTotal = workout.isOff ? 0 : workout.exercises.length;
  const gymDone = workout.isOff
    ? 0
    : workout.exercises.filter((_, idx) => Boolean(log.exerciseDone?.[`${day}-${idx}`])).length;

  const absTotal = absCircuit.length;
  const absDone = absCircuit.filter((_, i) => Boolean(log.exerciseDone?.[`abs-${i}`])).length;

  return {
    workout,
    log,
    day,
    gymTotal,
    gymDone,
    absTotal,
    absDone,
    total: gymTotal + absTotal,
    done: gymDone + absDone,
    gymComplete: gymTotal > 0 ? gymDone === gymTotal : Boolean(workout.isOff),
    isRestDay: Boolean(workout.isOff),
  };
}

/* ---- Calorie burn ---- */

export function estimateExerciseCalories(exercise, bodyWeightKg, loadKg = 0) {
  const parsed = parseSetPrescription(exercise?.sets || "");
  const sets = Math.max(1, Number(parsed.sets || 1));
  const loadFactor = 1 + Math.min(1.8, Math.max(0, Number(loadKg || 0)) / 60);

  let minutes = 0;
  if (parsed.secondsPerSet) {
    minutes = (sets * parsed.secondsPerSet) / 60;
  } else if (parsed.repsPerSet) {
    minutes = Math.max(3, (sets * parsed.repsPerSet) / 12 + sets * 1.2);
  } else {
    minutes = Math.max(3, sets * 2.5);
  }

  const met = 5.6 + Math.min(2.4, Math.max(0, Number(loadKg || 0)) / 40);
  const kcal = (met * 3.5 * Math.max(30, Number(bodyWeightKg || 70)) * minutes) / 200;
  return Math.max(0, kcal * loadFactor);
}

function estimateMorningCalories(log, bodyWeightKg) {
  if (!log.morningDone) return 0;
  const minutes = Math.max(0, Number(log.morningMinutes || 0));
  if (minutes <= 0) return 0;

  const activityType = log.morningActivityType || "running";
  const defaultConfig = morningActivityCatalog[activityType] || morningActivityCatalog.running;
  const customMet = Number(log.morningCustomMet || 0);
  const met = activityType === "custom" && customMet >= 2 ? customMet : Number(defaultConfig.met || 0);

  return (Math.max(2, met) * 3.5 * Math.max(30, Number(bodyWeightKg || 70)) * minutes) / 200;
}

function estimateAbsCalories(log, bodyWeightKg) {
  const completedKeys = absCircuit
    .map((_, idx) => `abs-${idx}`)
    .filter((key) => Boolean(log.exerciseDone?.[key]));

  if (!completedKeys.length && !log.absDone) return 0;

  const indexes = completedKeys.length
    ? completedKeys.map((key) => Number(key.split("-")[1])).filter((n) => Number.isFinite(n))
    : absCircuit.map((_, idx) => idx);

  return indexes.reduce((sum, idx) => {
    const exercise = absCircuit[idx];
    if (!exercise) return sum;
    return sum + estimateExerciseCalories(exercise, bodyWeightKg, 0);
  }, 0);
}

function estimateEveningCalories(dayName, log, bodyWeightKg) {
  const workout = getWorkoutForDay(dayName);
  if (!workout || workout.isOff) return 0;

  return workout.exercises.reduce((sum, exercise, idx) => {
    const key = `${dayName}-${idx}`;
    if (!log.exerciseDone?.[key]) return sum;
    const load = Number(log.exerciseWeights?.[key] || 0);
    return sum + estimateExerciseCalories(exercise, bodyWeightKg, load);
  }, 0);
}

function estimateStepsCalories(steps, bodyWeightKg) {
  return Math.max(0, Number(steps || 0)) * Math.max(30, Number(bodyWeightKg || 70)) * 0.0005;
}

function estimateSleepCalories(hours, profile) {
  const sleepHours = Math.max(0, Number(hours || 0));
  if (!sleepHours) return 0;

  const bmr = mifflinBmr({
    weightKg: Math.max(30, Number(profile?.currentWeight || 70)),
    heightCm: Math.max(120, Number(profile?.heightCm || 170)),
    age: Math.max(10, Number(profile?.age || 24)),
    sex: profile?.sex === "female" ? "female" : "male",
  });
  return (bmr / 24) * sleepHours * 0.95;
}

export function calculateDailyBurn(date = todayDate()) {
  const log = ensureGymLogForDate(date);
  const dayName = dayNameFromDate(date);
  const bodyWeightKg = Math.max(30, Number(state.profile.currentWeight || 70));

  const morning = estimateMorningCalories(log, bodyWeightKg);
  const abs = estimateAbsCalories(log, bodyWeightKg);
  const evening = estimateEveningCalories(dayName, log, bodyWeightKg);
  const steps = estimateStepsCalories(log.steps, bodyWeightKg);
  const sleep = estimateSleepCalories(log.sleepHours, state.profile);
  const total = morning + abs + evening + steps + sleep;

  return { morning, abs, evening, steps, sleep, total, dayName };
}

/* ---- Streak ---- */

export function calculateStreak() {
  if (!state) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDateString(d);
    const meals = state.mealsByDate[key];
    if (meals && meals.length > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

/* Days with any activity (meals, workout, weight) for the heatmap. */
export function activityHeatmap(weeks = 15) {
  const cells = [];
  const today = new Date();
  const totalDays = weeks * 7;

  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDateString(d);
    const meals = (state.mealsByDate[key] || []).length;
    const log = state.gymLogsByDate[key];
    const workoutDone = log ? Object.values(log.exerciseDone || {}).filter(Boolean).length : 0;
    const weight = state.weightEntries.some((entry) => entry.date === key) ? 1 : 0;
    const score = Math.min(4, (meals > 0 ? 1 : 0) + (meals >= 3 ? 1 : 0) + (workoutDone > 0 ? 1 : 0) + weight);
    cells.push({ date: key, level: score });
  }

  return cells;
}

/* ---- Daily Mission + Dad Physique Score ---- */

export function dailyMissions(date = todayDate()) {
  const totals = dailyTotals(date);
  const profile = state.profile;
  const proteinTarget = Math.max(1, Number(profile.macros?.proteinG || 0));
  const calorieTarget = Math.max(1, Number(profile.calorieTarget || 2000));
  const waterTarget = Math.max(1000, Number(profile.waterTargetMl || 2500));
  const water = getWaterMl(date);
  const completion = workoutCompletion(date);

  const calorieRatio = totals.kcal / calorieTarget;
  const missions = [
    {
      key: "protein",
      label: "Protein",
      detail: `${Math.round(totals.protein)} / ${Math.round(proteinTarget)} g`,
      progress: Math.min(1, totals.protein / proteinTarget),
      done: totals.protein >= proteinTarget * 0.9,
    },
    {
      key: "calories",
      label: "Calories",
      detail: `${Math.round(totals.kcal)} / ${Math.round(calorieTarget)} kcal`,
      progress: Math.min(1, calorieRatio),
      done: calorieRatio >= 0.6 && calorieRatio <= 1.1,
    },
    {
      key: "workout",
      label: completion.isRestDay ? "Recovery" : "Workout",
      detail: completion.isRestDay
        ? "Rest day"
        : `${completion.gymDone} / ${completion.gymTotal} lifts`,
      progress: completion.isRestDay ? 1 : completion.gymTotal ? completion.gymDone / completion.gymTotal : 0,
      done: completion.isRestDay || completion.gymComplete,
    },
    {
      key: "water",
      label: "Water",
      detail: `${(water / 1000).toFixed(1)} / ${(waterTarget / 1000).toFixed(1)} L`,
      progress: Math.min(1, water / waterTarget),
      done: water >= waterTarget,
    },
  ];

  return missions;
}

export function physiqueScore(date = todayDate()) {
  const missions = dailyMissions(date);
  const weights = { protein: 30, calories: 25, workout: 25, water: 10 };
  let score = 0;

  missions.forEach((mission) => {
    const weight = weights[mission.key] ?? 0;
    score += weight * Math.min(1, Math.max(0, mission.progress));
  });

  const streak = calculateStreak();
  score += Math.min(10, streak);

  return Math.round(Math.min(100, score));
}
