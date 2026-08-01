/* Dad Bod — profile target engine: BMR, maintenance, calorie target, and macro split. */

import { WEEK_DAYS } from "../config.js";
import { calculateDynamicNutrientTargets } from "./nutrition.js";
import { state } from "./store.js";

export const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "Sedentary — desk day, little exercise", factor: 1.25 },
  { key: "light", label: "Lightly Active — training 1-3 days/week", factor: 1.4 },
  { key: "moderate", label: "Moderately Active — training 4-5 days/week", factor: 1.55 },
  { key: "active", label: "Very Active — training 6-7 days/week", factor: 1.7 },
];

export function activityFactor(levelKey) {
  const found = ACTIVITY_LEVELS.find((level) => level.key === levelKey);
  return found ? found.factor : 1.4;
}

export function mifflinBmr({ weightKg, heightCm, age, sex }) {
  const sexConstant = sex === "female" ? -161 : 5;
  return Math.max(
    sex === "female" ? 1000 : 1100,
    Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant)
  );
}

export function calculateTargetsFromProfile() {
  if (!state) return;

  const profile = state.profile;
  const currentWeight = Math.max(30, Number(profile.currentWeight || 70));
  const goalWeight = Math.max(30, Number(profile.goalWeight || currentWeight));
  const age = Math.max(10, Number(profile.age || 24));
  const heightCm = Math.max(120, Number(profile.heightCm || 170));
  const sex = profile.sex === "female" ? "female" : "male";
  const weeklyChangeKg = Math.max(0.1, Math.abs(Number(profile.weeklyLoss || 0.5)));
  const goalGapKg = Math.abs(goalWeight - currentWeight);
  const goalMode =
    goalWeight > currentWeight ? "gain" : goalWeight < currentWeight ? "loss" : "maintain";
  const factor = activityFactor(profile.activityLevel);

  const bmrEstimate = mifflinBmr({ weightKg: currentWeight, heightCm, age, sex });
  const maintenance = Math.max(1300, Math.round(bmrEstimate * factor));

  const goalBmrEstimate = mifflinBmr({ weightKg: goalWeight, heightCm, age, sex });
  const goalMaintenance = Math.max(1200, Math.round(goalBmrEstimate * factor));

  const rawDailyAdjustment = Math.round((weeklyChangeKg * 7700) / 7);
  const maxDeficit = Math.max(250, Math.round(maintenance * 0.35));
  const maxSurplus = Math.max(200, Math.round(maintenance * 0.25));
  const boundedDailyAdjustment =
    goalMode === "loss"
      ? Math.max(150, Math.min(maxDeficit, rawDailyAdjustment))
      : goalMode === "gain"
        ? Math.max(120, Math.min(maxSurplus, rawDailyAdjustment))
        : 0;

  /* Blend current and goal maintenance so the target shifts as the goal changes,
   * and ease the adjustment as the user closes in on the goal. */
  const adaptiveMaintenance =
    goalMode === "maintain"
      ? maintenance
      : Math.round(maintenance * 0.6 + goalMaintenance * 0.4);
  const goalGapFactor = Math.min(1, Math.max(0.25, goalGapKg / 12));
  const dailyAdjustment = Math.round(boundedDailyAdjustment * (0.75 + 0.25 * goalGapFactor));

  const recommendedCalories =
    goalMode === "gain"
      ? adaptiveMaintenance + dailyAdjustment
      : goalMode === "loss"
        ? Math.max(1200, adaptiveMaintenance - dailyAdjustment)
        : adaptiveMaintenance;

  const manualTarget = Number(profile.manualCalorieTarget || 0);
  const hasManualTarget = Number.isFinite(manualTarget) && manualTarget >= 1000;
  const activeCalorieTarget = hasManualTarget ? manualTarget : recommendedCalories;

  profile.currentWeight = currentWeight;
  profile.goalWeight = goalWeight;
  profile.age = age;
  profile.heightCm = heightCm;
  profile.sex = sex;
  profile.weeklyLoss = weeklyChangeKg;
  profile.goalMode = goalMode;
  profile.maintenanceCalories = maintenance;
  profile.recommendedCalories = recommendedCalories;
  profile.calorieTarget = activeCalorieTarget;
  profile.deficitCalories = goalMode === "loss" ? Math.max(0, maintenance - recommendedCalories) : 0;
  profile.surplusCalories = goalMode === "gain" ? Math.max(0, recommendedCalories - maintenance) : 0;

  const proteinPerKg = goalMode === "gain" ? 1.9 : 1.8;
  const proteinReferenceWeight = goalMode === "loss" ? currentWeight : goalWeight;
  const proteinG = Math.max(100, Math.round(proteinReferenceWeight * proteinPerKg));

  let fatG = Math.max(40, Math.round(currentWeight * 0.75));
  let carbsG = Math.round((activeCalorieTarget - proteinG * 4 - fatG * 9) / 4);

  if (carbsG < 80) {
    carbsG = 80;
    fatG = Math.max(35, Math.round((activeCalorieTarget - proteinG * 4 - carbsG * 4) / 9));
  }

  profile.macros = {
    proteinG,
    fatG: Math.max(35, fatG),
    carbsG: Math.max(80, carbsG),
  };

  if (!WEEK_DAYS.includes(profile.gymClosedDay)) profile.gymClosedDay = "Sunday";
  if (!WEEK_DAYS.includes(profile.trainingStartDay)) profile.trainingStartDay = "Monday";
  if (!["morning", "evening"].includes(profile.gymSessionSlot)) profile.gymSessionSlot = "morning";
  if (!["morning", "evening"].includes(profile.cardioSessionSlot)) {
    profile.cardioSessionSlot = profile.gymSessionSlot === "morning" ? "evening" : "morning";
  }
  if (!Number.isFinite(Number(profile.waterTargetMl)) || Number(profile.waterTargetMl) < 1000) {
    profile.waterTargetMl = 2500;
  }

  profile.nutrientTargets = calculateDynamicNutrientTargets(profile);
}

export function getWorkoutPreferences() {
  const profile = state.profile;
  const closedDay = WEEK_DAYS.includes(profile.gymClosedDay) ? profile.gymClosedDay : "Sunday";
  const trainingStartDay = WEEK_DAYS.includes(profile.trainingStartDay) ? profile.trainingStartDay : "Monday";
  const gymSessionSlot = profile.gymSessionSlot === "evening" ? "evening" : "morning";
  const cardioSessionSlot = profile.cardioSessionSlot === "morning" ? "morning" : "evening";
  return { closedDay, trainingStartDay, gymSessionSlot, cardioSessionSlot };
}
