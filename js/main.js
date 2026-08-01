/* Dad Bod — composition root: boots the app, wires navigation, and owns the
 * global render cycle. */

import { select, setText } from "./utils.js";
import { setRenderer, setScreenSwitcher } from "./core/bus.js";
import {
  authStore,
  currentUser,
  state,
  hydratePersistentStorage,
  loadStateForUser,
  setActiveUser,
  clearActiveUser,
  saveState,
  buildAdminWeeklyPlan,
  resolveGoogleAccount,
} from "./core/store.js";
import { getCurrentUser, signOutFirebase } from "./services/firebase.js";
import { calculateTargetsFromProfile } from "./core/profile.js";
import { loadFoodDatasetIfNeeded } from "./core/dataset.js";
import { getWaterTargetMl } from "./services/myplate.js";
import { evaluateRewards } from "./core/rewards.js";
import { mountStaticIcons } from "./ui/icons.js";
import { bindLayerDismissal, dismissCelebration, haptic, HAPTIC, showToast, fireConfetti } from "./ui/components.js";
import { initOnboarding, showAuthShell, showAppShell } from "./features/onboarding.js";
import { initHome, renderHome } from "./features/home.js";
import { initDiet, renderDiet, logPrefilledMeal, openScanner } from "./features/diet.js";
import { initWorkout, renderWorkout } from "./features/workout.js";
import { initProgress, renderProgress } from "./features/progress.js";
import { initNearby } from "./features/nearby.js";
import { initRecipes, notifyRecipeLogged } from "./features/recipes.js";
import { initMore, renderMore } from "./features/more.js";
import { initAccount } from "./features/account.js";

const SCREENS = ["home", "diet", "train", "progress", "more"];
const SCREEN_RENDERERS = {
  home: renderHome,
  diet: renderDiet,
  train: renderWorkout,
  progress: renderProgress,
  more: renderMore,
};
let activeScreen = "home";

/* ---- Screen switching ---- */

function showScreen(name) {
  activeScreen = SCREENS.includes(name) ? name : "home";

  SCREENS.forEach((screen) => {
    const el = select(`screen-${screen}`);
    if (!el) return;
    const isActive = screen === activeScreen;
    el.classList.toggle("active", isActive);
    el.hidden = !isActive;
  });

  document.querySelectorAll(".nav-btn[data-screen]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-screen") === activeScreen);
  });

  window.scrollTo({ top: 0, behavior: "auto" });

  /* Re-render the now-visible screen: canvases measured while hidden are 0×0. */
  if (state) requestAnimationFrame(() => SCREEN_RENDERERS[activeScreen]?.());
}

/* ---- Global render ---- */

function renderAll() {
  if (!state) return;

  const { granted, total } = evaluateRewards();
  if (total > 0) {
    const headline = granted.length === 1 ? granted[0].label : `${granted.length} goals hit`;
    showToast(`+${total.toLocaleString()} Dad Coins · ${headline}`, "success");
    if (granted.some((g) => g.coins >= 700)) fireConfetti(2000);
  }

  renderHome();
  renderDiet();
  renderWorkout();
  renderProgress();
  renderMore();
}

/* ---- Session lifecycle ---- */

function activateUser(user) {
  const userState = loadStateForUser(user);
  setActiveUser(user, userState);

  if (user.isAdmin) {
    const version = Number(state.profile.adminPlanVersion || 0);
    if (version < 2) {
      state.weeklyPlan = buildAdminWeeklyPlan();
      state.profile.adminPlanVersion = 2;
    }
    state.profile.gymClosedDay = "Sunday";
    state.profile.trainingStartDay = "Monday";
    state.profile.gymSessionSlot = "morning";
    state.profile.cardioSessionSlot = "evening";
  }

  calculateTargetsFromProfile();
  saveState();

  showAppShell();
  showScreen("home");
  renderAll();
  refreshWaterTargetQuietly();
}

async function logout() {
  await signOutFirebase();
  clearActiveUser();
  showAuthShell();
}

/* Which profile should open on launch?
 * A live Google session wins; otherwise the last profile used on this device.
 * Firebase is given a bounded window so a slow network can never block boot. */
async function resolveStartupUser() {
  const localUser = authStore.users.find((u) => u.id === authStore.activeUserId) || null;

  try {
    const googleUser = await Promise.race([
      getCurrentUser(),
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    if (googleUser?.uid) {
      const { user } = resolveGoogleAccount(googleUser);
      return user;
    }
  } catch (error) {
    console.warn("Session restore failed, falling back to local profile", error?.message || error);
  }

  return localUser;
}

/* Personalize the hydration goal from USDA water-intake once per profile weight. */
async function refreshWaterTargetQuietly() {
  try {
    const profile = state?.profile;
    if (!profile) return;
    const key = `water:${Math.round(Number(profile.currentWeight || 0))}`;
    if (profile.waterTargetSyncKey === key) return;
    const ml = await getWaterTargetMl(profile);
    if (ml && state?.profile) {
      state.profile.waterTargetMl = ml;
      state.profile.waterTargetSyncKey = key;
      saveState();
      renderAll();
    }
  } catch {}
}

/* ---- Splash ---- */

function hideSplash() {
  const splash = select("splashScreen");
  if (!splash) return;
  splash.classList.add("fade-out");
  setTimeout(() => splash.remove(), 550);
}

/* ---- Center nav action: the scanner is the hero feature ---- */

function bindScanAction() {
  select("scanBtn")?.addEventListener("click", () => {
    haptic(HAPTIC.tap);
    openScanner();
  });
}

/* ---- Boot ---- */

function init() {
  mountStaticIcons();
  bindLayerDismissal();

  setRenderer(renderAll);
  setScreenSwitcher(showScreen);

  initOnboarding(activateUser);
  initHome();
  initDiet();
  initWorkout();
  initProgress();
  initNearby();
  initRecipes((payload) => {
    showScreen("diet");
    logPrefilledMeal(payload);
    notifyRecipeLogged(payload.description);
  });
  initMore(logout);
  initAccount();
  bindScanAction();

  document.querySelectorAll(".nav-btn[data-screen]").forEach((btn) => {
    btn.addEventListener("click", () => {
      haptic(HAPTIC.tap);
      showScreen(btn.getAttribute("data-screen"));
    });
  });

  select("celebrationCloseBtn")?.addEventListener("click", dismissCelebration);

  loadFoodDatasetIfNeeded().catch(() => {});

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }

  /* Restore the session while the splash plays, so sign-in costs no extra wait. */
  const splashHold = new Promise((resolve) => setTimeout(resolve, 1300));
  const session = hydratePersistentStorage()
    .catch(() => {})
    .then(() => resolveStartupUser())
    .catch(() => null);

  Promise.all([splashHold, session]).then(([, user]) => {
    hideSplash();
    if (user) {
      activateUser(user);
    } else {
      showAuthShell();
    }
  });

  setInterval(() => {
    if (!state) return;
    setText(
      "dateTimeText",
      new Date().toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" })
    );
  }, 30000);
}

init();
