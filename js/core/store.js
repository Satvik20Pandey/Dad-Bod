/* Dad Bod — persistence and session state.
 *
 * All data lives on-device: localStorage for fast sync access, mirrored into
 * IndexedDB so records survive WebView storage pressure. Keys are stable across
 * app versions — existing users upgrade in place.
 */

import { AUTH_KEY, LEGACY_STATE_KEY, SECURITY_CONFIG_KEY, IDB_NAME, PLAN_DAYS_ORDER } from "../config.js";
import { clone, uid, normalizeEmail, deriveNameFromEmail } from "../utils.js";
import { setUserFoodLibraryProvider } from "./dataset.js";

/* Owner profile — ships with the founder's preloaded plan. The optional passkey
 * gate is configured at runtime via localStorage (never hardcoded in source):
 * localStorage.setItem("dadbod_security_config_v1", JSON.stringify({ adminEmail, adminPasskey })) */
const DEFAULT_ADMIN_EMAIL = "satvikofficial20@gmail.com";

function loadSecurityConfig() {
  let fromStorage = null;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(SECURITY_CONFIG_KEY) : null;
    if (raw) fromStorage = JSON.parse(raw);
  } catch {
    fromStorage = null;
  }
  const fromWindow = typeof window !== "undefined" && window.__DADBOD_SECURITY_CONFIG
    ? window.__DADBOD_SECURITY_CONFIG
    : null;
  const source = (fromWindow && typeof fromWindow === "object" ? fromWindow : null)
    || (fromStorage && typeof fromStorage === "object" ? fromStorage : null)
    || {};

  return {
    adminEmail: normalizeEmail(source.adminEmail || DEFAULT_ADMIN_EMAIL),
    adminPasskey: String(source.adminPasskey || "").trim(),
  };
}

export const securityConfig = loadSecurityConfig();
export const ADMIN_EMAIL = securityConfig.adminEmail;

/* ---- Default states ---- */

const adminDailyDiet = {
  breakfast: "Oats 40g + Milk 500ml + Dry Fruits Mix 10g",
  lunch: "3 egg omelette + mixed vegetables + 1 roti",
  snacks: "Protein shake + banana",
  dinner: "Besan chilla + vegetables + tofu 100g",
  notes: "Simple repeatable plan with foods you can arrange daily.",
};

export function buildAdminWeeklyPlan() {
  const plan = {};
  PLAN_DAYS_ORDER.forEach((day) => {
    plan[day] = {
      ...adminDailyDiet,
      notes:
        day === "Wednesday"
          ? "Recovery day. Keep same simple diet and do light mobility."
          : "Same simple meal structure for consistency.",
    };
  });
  return plan;
}

export function buildBlankWeeklyPlan() {
  const plan = {};
  PLAN_DAYS_ORDER.forEach((day) => {
    plan[day] = { breakfast: "", lunch: "", snacks: "", dinner: "", notes: "" };
  });
  return plan;
}

const sharedProfileDefaults = {
  sex: "male",
  activityLevel: "light",
  gymClosedDay: "Sunday",
  trainingStartDay: "Monday",
  gymSessionSlot: "morning",
  cardioSessionSlot: "evening",
  manualCalorieTarget: 0,
  waterTargetMl: 2500,
};

const adminDefaultState = {
  profile: {
    ...sharedProfileDefaults,
    currentWeight: 82,
    goalWeight: 71,
    age: 22,
    heightCm: 180.3,
    adminPlanVersion: 2,
    weeklyLoss: 1,
    goalMode: "loss",
    calorieTarget: 1800,
    recommendedCalories: 1800,
    maintenanceCalories: 2460,
    deficitCalories: 1800,
    surplusCalories: 0,
    macros: { proteinG: 149, fatG: 57, carbsG: 189 },
  },
  settings: {},
  mealsByDate: {},
  foodLibrary: {},
  foodHistory: [],
  weeklyPlan: buildAdminWeeklyPlan(),
  gymLogsByDate: {},
  waterByDate: {},
  weightEntries: [],
  photoEntries: [],
  rewards: { coins: 0, byDate: {}, ledger: [], streakKeys: {} },
  editingMealId: null,
};

const genericDefaultState = {
  profile: {
    ...sharedProfileDefaults,
    currentWeight: 75,
    goalWeight: 68,
    age: 24,
    heightCm: 170,
    weeklyLoss: 0.5,
    goalMode: "loss",
    calorieTarget: 1900,
    recommendedCalories: 1900,
    maintenanceCalories: 2250,
    deficitCalories: 1900,
    surplusCalories: 0,
    macros: { proteinG: 136, fatG: 54, carbsG: 197 },
  },
  settings: {},
  mealsByDate: {},
  foodLibrary: {},
  foodHistory: [],
  weeklyPlan: buildBlankWeeklyPlan(),
  gymLogsByDate: {},
  waterByDate: {},
  weightEntries: [],
  photoEntries: [],
  rewards: { coins: 0, byDate: {}, ledger: [], streakKeys: {} },
  editingMealId: null,
};

/* ---- IndexedDB mirror ---- */

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function idbGet(key) {
  const db = await openDb().catch(() => null);
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb().catch(() => null);
  if (!db) return false;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/* ---- Auth store ---- */

export let authStore = loadAuthStore();
export let currentUser = null;
export let state = null;

setUserFoodLibraryProvider(() => state?.foodLibrary || {});

function loadAuthStore() {
  const raw = localStorage.getItem(AUTH_KEY);
  let parsed = { users: [], userStates: {}, activeUserId: null, userDirectory: [] };
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { users: [], userStates: {}, activeUserId: null, userDirectory: [] };
    }
  }

  if (!Array.isArray(parsed.users)) parsed.users = [];
  if (!parsed.userStates || typeof parsed.userStates !== "object") parsed.userStates = {};
  if (!Array.isArray(parsed.userDirectory)) parsed.userDirectory = [];

  return ensureAdminUser(parsed);
}

export function saveAuthStore() {
  const payload = JSON.stringify(authStore);
  localStorage.setItem(AUTH_KEY, payload);
  idbSet(AUTH_KEY, payload).catch(() => {});
}

export async function hydratePersistentStorage() {
  try {
    const stored = await idbGet(AUTH_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    authStore = ensureAdminUser(parsed);
    localStorage.setItem(AUTH_KEY, JSON.stringify(authStore));
  } catch (error) {
    console.warn("IndexedDB hydrate failed", error);
  }
}

function ensureAdminUser(store) {
  if (ADMIN_EMAIL) {
    let admin = store.users.find((u) => normalizeEmail(u?.email) === ADMIN_EMAIL);

    if (!admin) {
      admin = {
        id: uid("user"),
        name: "Satvik",
        email: ADMIN_EMAIL,
        provider: "email-profile",
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };
      store.users.push(admin);
    }

    admin.email = ADMIN_EMAIL;
    admin.isAdmin = true;
    admin.provider = "email-profile";
    admin.name = admin.name || "Satvik";

    if (!store.userStates[admin.id]) {
      let adminState = clone(adminDefaultState);
      const legacyRaw = localStorage.getItem(LEGACY_STATE_KEY);
      if (legacyRaw) {
        try {
          adminState = mergeState(adminState, JSON.parse(legacyRaw));
        } catch {}
      }
      store.userStates[admin.id] = adminState;
    }
  }

  if (store.activeUserId && !store.users.some((u) => u.id === store.activeUserId)) {
    store.activeUserId = null;
  }

  return store;
}

export function mergeState(baseState, savedState) {
  const merged = {
    ...clone(baseState),
    ...(savedState || {}),
    profile: {
      ...clone(baseState.profile),
      ...(savedState?.profile || {}),
      macros: {
        ...clone(baseState.profile.macros),
        ...(savedState?.profile?.macros || {}),
      },
    },
    settings: {
      ...clone(baseState.settings),
      ...(savedState?.settings || {}),
    },
    mealsByDate: { ...(savedState?.mealsByDate || {}) },
    foodLibrary: { ...(savedState?.foodLibrary || {}) },
    foodHistory: Array.isArray(savedState?.foodHistory) ? savedState.foodHistory : [],
    gymLogsByDate: { ...(savedState?.gymLogsByDate || {}) },
    waterByDate: { ...(savedState?.waterByDate || {}) },
    weightEntries: Array.isArray(savedState?.weightEntries) ? savedState.weightEntries : [],
    photoEntries: Array.isArray(savedState?.photoEntries) ? savedState.photoEntries : [],
    rewards: savedState?.rewards && typeof savedState.rewards === "object"
      ? savedState.rewards
      : { coins: 0, byDate: {}, ledger: [], streakKeys: {} },
    weeklyPlan: savedState?.weeklyPlan ? savedState.weeklyPlan : clone(baseState.weeklyPlan),
  };

  /* v2 migration: retire the removed AI settings. */
  delete merged.settings.apiKey;
  delete merged.settings.aiModel;

  return merged;
}

/* ---- Users ---- */

export function isConfiguredAdminEmail(email) {
  if (!ADMIN_EMAIL) return false;
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export function adminPasskeyRequired() {
  return Boolean(securityConfig.adminPasskey);
}

export function verifyAdminPasskey(passkey) {
  if (!adminPasskeyRequired()) return true;
  return String(passkey || "") === securityConfig.adminPasskey;
}

export function findUserByEmail(email) {
  const lookup = normalizeEmail(email);
  return authStore.users.find((u) => (u.email || "").toLowerCase() === lookup) || null;
}

export function upsertUserProfile(name, email) {
  const normalizedEmail = normalizeEmail(email);
  let user = findUserByEmail(normalizedEmail);

  if (!user) {
    user = {
      id: uid("user"),
      name: name?.trim() || "Member",
      email: normalizedEmail,
      provider: "email-profile",
      isAdmin: isConfiguredAdminEmail(normalizedEmail),
      createdAt: new Date().toISOString(),
    };
    authStore.users.push(user);
    authStore.userStates[user.id] = user.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
    saveAuthStore();
    return user;
  }

  user.name = name?.trim() || user.name || "Member";
  if (!user.provider) user.provider = "email-profile";
  if (!user.isAdmin) user.isAdmin = isConfiguredAdminEmail(normalizedEmail);
  user.email = normalizedEmail;
  saveAuthStore();
  return user;
}

/* ---- Google account linking + local profile migration ----
 *
 * Signing in must never orphan existing data. Resolution order:
 *   1. Same Google account seen before      → reuse that profile
 *   2. Local profile with the same email    → link it in place (data untouched)
 *   3. One unlinked local profile with data → adopt it into this account
 *   4. Otherwise                            → start a fresh profile
 *
 * Profile records are only ever updated or added — nothing is deleted, so a
 * mistaken adoption stays recoverable through Export.
 */

export function findUserByGoogleUid(googleUid) {
  if (!googleUid) return null;
  return authStore.users.find((u) => u.googleUid === googleUid) || null;
}

export function hasMeaningfulData(userId) {
  const state = authStore.userStates[userId];
  if (!state) return false;

  const mealCount = Object.values(state.mealsByDate || {}).reduce(
    (sum, meals) => sum + (Array.isArray(meals) ? meals.length : 0),
    0
  );
  if (mealCount > 0) return true;

  const workoutLogged = Object.values(state.gymLogsByDate || {}).some((log) =>
    Object.values(log?.exerciseDone || {}).some(Boolean)
  );
  if (workoutLogged) return true;

  if ((state.weightEntries || []).length > 0) return true;
  if ((state.photoEntries || []).length > 0) return true;
  if (Number(state.rewards?.coins || 0) > 0) return true;

  return false;
}

function findAdoptableProfile() {
  const unlinked = authStore.users.filter((u) => !u.googleUid && hasMeaningfulData(u.id));
  if (!unlinked.length) return null;

  /* Prefer the profile in use right now — that is the one the person is
   * looking at when they decide to sign in. */
  const active = unlinked.find((u) => u.id === authStore.activeUserId);
  if (active) return active;

  return unlinked.length === 1 ? unlinked[0] : null;
}

export function resolveGoogleAccount(googleUser) {
  const email = normalizeEmail(googleUser.email);
  const name = String(googleUser.name || "").trim() || deriveNameFromEmail(email) || "Member";
  const now = new Date().toISOString();

  const applyIdentity = (user, migration) => {
    user.googleUid = googleUser.uid;
    user.email = email || user.email;
    user.name = name || user.name;
    user.photoUrl = googleUser.photoUrl || user.photoUrl || null;
    user.provider = "google";
    user.lastSignInAt = now;
    if (!user.isAdmin) user.isAdmin = isConfiguredAdminEmail(email);
    saveAuthStore();
    return { user, migration };
  };

  const byUid = findUserByGoogleUid(googleUser.uid);
  if (byUid) return applyIdentity(byUid, "existing-account");

  const byEmail = findUserByEmail(email);
  if (byEmail) return applyIdentity(byEmail, "linked-by-email");

  const adoptable = findAdoptableProfile();
  if (adoptable) {
    const previousEmail = adoptable.email;
    if (previousEmail && previousEmail !== email) {
      adoptable.previousEmails = [...new Set([...(adoptable.previousEmails || []), previousEmail])];
    }
    adoptable.migratedAt = now;
    return applyIdentity(adoptable, "adopted-local");
  }

  const user = {
    id: uid("user"),
    googleUid: googleUser.uid,
    name,
    email,
    photoUrl: googleUser.photoUrl || null,
    provider: "google",
    isAdmin: isConfiguredAdminEmail(email),
    createdAt: now,
    lastSignInAt: now,
  };
  authStore.users.push(user);
  authStore.userStates[user.id] = user.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
  saveAuthStore();
  return { user, migration: "new-account" };
}

/* Offline profiles are device-local and never touch the network. */
export function createOfflineProfile(name, email) {
  const user = upsertUserProfile(name, email);
  if (!user.googleUid) user.provider = "offline";
  user.lastSignInAt = new Date().toISOString();
  saveAuthStore();
  return user;
}

export function recordUserDirectoryEntry(user) {
  if (!user) return;
  if (!Array.isArray(authStore.userDirectory)) authStore.userDirectory = [];

  const normalizedEmail = normalizeEmail(user.email);
  const now = new Date().toISOString();
  const existing = authStore.userDirectory.find(
    (entry) => normalizeEmail(entry.email) === normalizedEmail
  );

  if (existing) {
    existing.name = user.name || existing.name;
    existing.lastSeenAt = now;
    existing.userId = user.id;
    existing.isAdmin = Boolean(user.isAdmin);
  } else {
    authStore.userDirectory.push({
      id: uid("directory"),
      userId: user.id,
      name: user.name,
      email: normalizedEmail,
      isAdmin: Boolean(user.isAdmin),
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  saveAuthStore();
}

export function getDefaultWeeklyPlan() {
  return currentUser?.isAdmin ? clone(buildAdminWeeklyPlan()) : clone(buildBlankWeeklyPlan());
}

export function getDefaultStateFor(user) {
  return user?.isAdmin ? clone(adminDefaultState) : clone(genericDefaultState);
}

export function loadStateForUser(user) {
  const base = getDefaultStateFor(user);
  const saved = authStore.userStates[user.id];
  const merged = mergeState(base, saved || {});
  if (!merged.weeklyPlan) merged.weeklyPlan = getDefaultWeeklyPlan();
  return merged;
}

export function setActiveUser(user, userState) {
  currentUser = user;
  state = userState;
  authStore.activeUserId = user ? user.id : null;
  saveAuthStore();
  if (user) recordUserDirectoryEntry(user);
}

export function clearActiveUser() {
  currentUser = null;
  state = null;
  authStore.activeUserId = null;
  saveAuthStore();
}

export function replaceState(newState) {
  state = newState;
}

export function saveState() {
  if (!currentUser || !state) return;
  authStore.userStates[currentUser.id] = state;
  saveAuthStore();

  if (currentUser.isAdmin) {
    localStorage.setItem(LEGACY_STATE_KEY, JSON.stringify(state));
  }

  idbSet(`${AUTH_KEY}:${currentUser.id}`, JSON.stringify(state)).catch(() => {});
}

/* ---- Day-level accessors ---- */

export function getDayMeals(date) {
  if (!state.mealsByDate[date]) state.mealsByDate[date] = [];
  return state.mealsByDate[date];
}

export function ensureGymLogForDate(date) {
  if (!state.gymLogsByDate[date]) {
    state.gymLogsByDate[date] = {
      morningActivityType: "running",
      morningMinutes: 20,
      morningDone: false,
      absDone: false,
      morningNotes: "",
      morningCustomActivity: "",
      morningCustomMet: 6.5,
      exerciseDone: {},
      exerciseWeights: {},
      exerciseReps: {},
      steps: 0,
      sleepHours: 0,
    };
  }

  const log = state.gymLogsByDate[date];
  if (!log.exerciseDone || typeof log.exerciseDone !== "object") log.exerciseDone = {};
  if (!log.exerciseWeights || typeof log.exerciseWeights !== "object") log.exerciseWeights = {};
  if (!log.exerciseReps || typeof log.exerciseReps !== "object") log.exerciseReps = {};
  if (!Number.isFinite(Number(log.steps))) log.steps = 0;
  if (!Number.isFinite(Number(log.sleepHours))) log.sleepHours = 0;
  if (!log.morningActivityType) log.morningActivityType = "running";
  if (!Number.isFinite(Number(log.morningCustomMet))) log.morningCustomMet = 6.5;

  return log;
}

export function getWaterMl(date) {
  return Math.max(0, Number(state?.waterByDate?.[date] || 0));
}

export function setWaterMl(date, ml) {
  if (!state.waterByDate || typeof state.waterByDate !== "object") state.waterByDate = {};
  state.waterByDate[date] = Math.max(0, Math.round(Number(ml) || 0));
}

/* ---- Food history ---- */

export function ensureFoodHistory() {
  if (!Array.isArray(state.foodHistory)) state.foodHistory = [];
  return state.foodHistory;
}

export function normalizeMealPhrase(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function persistMealHistoryEntry(meal, nutrientFieldList) {
  if (!meal) return;
  const description = String(meal.description || meal.name || "").trim();
  if (!description) return;

  const history = ensureFoodHistory();
  const key = normalizeMealPhrase(description);
  const now = Date.now();
  const existing = history.find((entry) => normalizeMealPhrase(entry?.description) === key);

  const nutrients = {};
  (nutrientFieldList || []).forEach((field) => {
    nutrients[field] = Number(meal[field] || 0);
  });

  const payload = {
    description,
    qty: Math.max(1, Number(meal.qty || 100)),
    kcal: Number(meal.kcal || 0),
    protein: Number(meal.protein || 0),
    carbs: Number(meal.carbs || 0),
    fat: Number(meal.fat || 0),
    nutrients,
    lastUsedAt: now,
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    history.push(payload);
  }

  if (history.length > 120) {
    history.sort((a, b) => Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0));
    state.foodHistory = history.slice(0, 120);
  }
}
