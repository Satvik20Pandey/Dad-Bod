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
} from "./core/store.js";
import { calculateTargetsFromProfile } from "./core/profile.js";
import { loadFoodDatasetIfNeeded } from "./core/dataset.js";
import { getWaterTargetMl } from "./services/myplate.js";
import { mountStaticIcons } from "./ui/icons.js";
import { bindLayerDismissal, openLayer, closeLayer, dismissCelebration, haptic, HAPTIC } from "./ui/components.js";
import { initOnboarding, showAuthShell, showAppShell } from "./features/onboarding.js";
import { initHome, renderHome, adjustWater } from "./features/home.js";
import { initDiet, renderDiet, quickLogMeal, logPrefilledMeal } from "./features/diet.js";
import { initWorkout, renderWorkout } from "./features/workout.js";
import { initProgress, renderProgress } from "./features/progress.js";
import { initNearby } from "./features/nearby.js";
import { initRecipes, notifyRecipeLogged } from "./features/recipes.js";
import { initMore, renderMore } from "./features/more.js";

const SCREENS = ["home", "diet", "train", "progress", "more"];
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
}

/* ---- Global render ---- */

function renderAll() {
  if (!state) return;
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

function logout() {
  clearActiveUser();
  showAuthShell();
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

/* ---- Quick actions (FAB) ---- */

function bindQuickActions() {
  select("fabBtn")?.addEventListener("click", () => {
    haptic(HAPTIC.tap);
    openLayer("quickSheet");
  });

  select("quickSheet")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-quick]");
    if (!btn) return;
    const action = btn.getAttribute("data-quick");
    closeLayer("quickSheet");

    if (action === "meal") {
      showScreen("diet");
      quickLogMeal();
    } else if (action === "water") {
      adjustWater(250);
    } else if (action === "weight") {
      showScreen("progress");
      setTimeout(() => select("weightValue")?.focus(), 350);
    } else if (action === "photo") {
      showScreen("progress");
      document.querySelector('#progressSeg [data-seg="photos"]')?.click();
    } else if (action === "workout") {
      showScreen("train");
    }
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
  bindQuickActions();

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

  hydratePersistentStorage().finally(() => {
    const activeUser = authStore.users.find((u) => u.id === authStore.activeUserId);

    setTimeout(() => {
      hideSplash();
      if (activeUser) {
        activateUser(activeUser);
      } else {
        showAuthShell();
      }
    }, 1300);
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
