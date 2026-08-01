/* Dad Bod — Dad Coins: rewards for real healthy behavior, not just app opens.
 * Awards are evaluated against the day's actual logs and granted once per day
 * per category, with streak milestone bonuses. All local, all deterministic. */

import { todayDate, localDateString, uid } from "../utils.js";
import { state, saveState } from "./store.js";
import { dailyMissions, workoutCompletion, calculateStreak } from "./metrics.js";

export const REWARD_RULES = [
  { key: "login", label: "Daily check-in", coins: 100, icon: "zap" },
  { key: "workout", label: "Workout completed", coins: 250, icon: "dumbbell" },
  { key: "protein", label: "Protein goal hit", coins: 150, icon: "target" },
  { key: "calories", label: "Calories on target", coins: 120, icon: "flame" },
  { key: "water", label: "Hydration goal", coins: 100, icon: "droplet" },
  { key: "weight", label: "Weight logged", coins: 50, icon: "scale" },
  { key: "photo", label: "Progress photo", coins: 80, icon: "camera" },
];

export const STREAK_MILESTONES = [
  { days: 7, coins: 700, label: "7-day streak" },
  { days: 30, coins: 5000, label: "30-day streak" },
];

export function ensureRewards() {
  if (!state.rewards || typeof state.rewards !== "object") {
    state.rewards = { coins: 0, byDate: {}, ledger: [], streakKeys: {} };
  }
  const r = state.rewards;
  if (!Number.isFinite(Number(r.coins))) r.coins = 0;
  if (!r.byDate || typeof r.byDate !== "object") r.byDate = {};
  if (!Array.isArray(r.ledger)) r.ledger = [];
  if (!r.streakKeys || typeof r.streakKeys !== "object") r.streakKeys = {};
  return r;
}

export function getCoins() {
  return state ? ensureRewards().coins : 0;
}

export function recentLedger(limit = 6) {
  return ensureRewards().ledger.slice(0, limit);
}

function grant(rewards, date, key, label, coins) {
  rewards.coins += coins;
  if (!rewards.byDate[date]) rewards.byDate[date] = {};
  rewards.byDate[date][key] = coins;
  rewards.ledger.unshift({ id: uid("coin"), date, key, label, coins, at: new Date().toISOString() });
  if (rewards.ledger.length > 200) rewards.ledger = rewards.ledger.slice(0, 200);
}

/* Evaluate today's behavior and grant anything newly earned.
 * Returns { granted: [{label, coins}], total } — caller decides how to celebrate. */
export function evaluateRewards() {
  if (!state) return { granted: [], total: 0 };

  const rewards = ensureRewards();
  const date = todayDate();
  const today = rewards.byDate[date] || {};
  const granted = [];

  const missions = dailyMissions(date);
  const missionDone = Object.fromEntries(missions.map((m) => [m.key, m.done]));
  const completion = workoutCompletion(date);

  const facts = {
    login: true,
    workout: !completion.isRestDay && completion.gymComplete && completion.gymTotal > 0,
    protein: Boolean(missionDone.protein),
    calories: Boolean(missionDone.calories),
    water: Boolean(missionDone.water),
    weight: (state.weightEntries || []).some((entry) => entry.date === date),
    photo: (state.photoEntries || []).some((entry) => String(entry.date) === date),
  };

  REWARD_RULES.forEach((rule) => {
    if (today[rule.key] != null) return;
    if (!facts[rule.key]) return;
    grant(rewards, date, rule.key, rule.label, rule.coins);
    granted.push({ label: rule.label, coins: rule.coins });
  });

  /* Streak milestones — awarded once per distinct streak run. */
  const streak = calculateStreak();
  if (streak > 0) {
    const start = new Date();
    start.setDate(start.getDate() - (streak - 1));
    const streakStart = localDateString(start);

    STREAK_MILESTONES.forEach((milestone) => {
      if (streak < milestone.days) return;
      const runKey = `${milestone.days}:${streakStart}`;
      if (rewards.streakKeys[runKey]) return;
      rewards.streakKeys[runKey] = date;
      grant(rewards, date, `streak${milestone.days}`, milestone.label, milestone.coins);
      granted.push({ label: milestone.label, coins: milestone.coins });
    });
  }

  if (granted.length) saveState();

  return { granted, total: granted.reduce((sum, g) => sum + g.coins, 0) };
}

export function todaysEarned() {
  const today = ensureRewards().byDate[todayDate()] || {};
  return Object.values(today).reduce((sum, coins) => sum + Number(coins || 0), 0);
}
