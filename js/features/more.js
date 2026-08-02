/* Dad Bod — Control Center: goals, training setup, data ownership, and app info. */

import { APP_NAME, APP_VERSION } from "../config.js";
import { select, setText, setHtml, escapeHtml, formatNum, todayDate, downloadBlob, toCsv, parseOptionalNumber } from "../utils.js";
import {
  state,
  currentUser,
  authStore,
  saveState,
  mergeState,
  replaceState,
  getDefaultStateFor,
} from "../core/store.js";
import { calculateTargetsFromProfile, ACTIVITY_LEVELS } from "../core/profile.js";
import { getCoins, todaysEarned, REWARD_RULES, STREAK_MILESTONES, recentLedger } from "../core/rewards.js";
import { initTrainingSetup, renderTrainingSetupEditor } from "./training-setup.js";
import { renderAccount } from "./account.js";
import { getBmi, getCalorieNeeds, getWaterTargetMl } from "../services/myplate.js";
import { isOnline } from "../services/http.js";
import { icon } from "../ui/icons.js";
import { showToast, openLayer, haptic, HAPTIC } from "../ui/components.js";
import { renderApp, goToScreen } from "../core/bus.js";

let onLogout = null;

export function initMore(logoutCallback) {
  onLogout = logoutCallback;
  initTrainingSetup();

  /* Control-center rows that open sheets */
  document.querySelectorAll("[data-open-sheet]").forEach((el) => {
    el.addEventListener("click", () => {
      haptic(HAPTIC.tap);
      const sheet = el.getAttribute("data-open-sheet");
      openLayer(sheet);
      if (sheet === "workoutSetupSheet") renderTrainingSetupEditor();
      if (sheet === "rewardsSheet") renderRewards();
    });
  });

  document.querySelectorAll("[data-go-screen]").forEach((el) => {
    el.addEventListener("click", () => {
      haptic(HAPTIC.tap);
      goToScreen(el.getAttribute("data-go-screen"));
    });
  });

  /* Goals */
  select("profileForm")?.addEventListener("submit", handleProfileSubmit);
  select("autoTargetBtn")?.addEventListener("click", autoCalculateTargets);
  ["currentWeight", "goalWeight", "age", "heightCm", "weeklyLoss", "calorieTarget"].forEach((inputId) => {
    select(inputId)?.addEventListener("input", () => syncProfileFromInputs(false));
    select(inputId)?.addEventListener("change", () => syncProfileFromInputs(false));
  });
  select("sexInput")?.addEventListener("change", () => syncProfileFromInputs(false));
  select("activityInput")?.addEventListener("change", () => syncProfileFromInputs(false));
  select("usdaVerifyBtn")?.addEventListener("click", runUsdaVerification);

  /* Workout setup */
  select("workoutPrefsForm")?.addEventListener("submit", handleWorkoutPrefsSubmit);

  /* Data */
  select("exportBtn")?.addEventListener("click", exportData);
  select("importInput")?.addEventListener("change", importData);
  select("userSheetExportBtn")?.addEventListener("click", exportUserDirectoryCsv);
  select("clearDayBtn")?.addEventListener("click", clearToday);

  /* App info */
  select("settingsAbout")?.addEventListener("click", openAbout);
  select("settingsHelp")?.addEventListener("click", openHelp);
  select("settingsPrivacy")?.addEventListener("click", openPrivacyPolicy);
  select("settingsTerms")?.addEventListener("click", openTerms);
  select("settingsRate")?.addEventListener("click", () => {
    showToast("Thank you! Rating opens once we're live on the Play Store.");
  });

  select("logoutBtn")?.addEventListener("click", () => {
    haptic(HAPTIC.warn);
    if (onLogout) onLogout();
  });
}

/* ---- Goals ---- */

function syncProfileFromInputs(persist) {
  if (!state?.profile) return;

  state.profile.currentWeight = Number(select("currentWeight")?.value || state.profile.currentWeight);
  state.profile.goalWeight = Number(select("goalWeight")?.value || state.profile.goalWeight);
  state.profile.age = Number(select("age")?.value || state.profile.age);
  state.profile.heightCm = Number(select("heightCm")?.value || state.profile.heightCm);
  state.profile.sex = select("sexInput")?.value === "female" ? "female" : "male";
  state.profile.activityLevel = select("activityInput")?.value || state.profile.activityLevel;
  state.profile.weeklyLoss = Math.abs(Number(select("weeklyLoss")?.value || state.profile.weeklyLoss));

  const calorieOverride = parseOptionalNumber("calorieTarget");
  state.profile.manualCalorieTarget = calorieOverride && calorieOverride >= 1000 ? Number(calorieOverride) : 0;

  const waterTarget = parseOptionalNumber("waterTargetInput");
  if (waterTarget && waterTarget >= 1000 && waterTarget <= 8000) {
    state.profile.waterTargetMl = Math.round(waterTarget);
  }

  calculateTargetsFromProfile();

  if (persist) {
    saveState();
    renderApp();
    showToast("Goals updated.", "success");
    haptic(HAPTIC.success);
    return;
  }

  renderTargetSummary();
}

function handleProfileSubmit(e) {
  e.preventDefault();
  syncProfileFromInputs(true);
}

function autoCalculateTargets() {
  state.profile.manualCalorieTarget = 0;
  if (select("calorieTarget")) select("calorieTarget").value = "";
  calculateTargetsFromProfile();
  saveState();
  renderApp();
  showToast("Targets recalculated automatically.", "success");
}

function renderGoalsForm() {
  const profile = state.profile;
  if (select("currentWeight")) select("currentWeight").value = profile.currentWeight;
  if (select("goalWeight")) select("goalWeight").value = profile.goalWeight;
  if (select("age")) select("age").value = profile.age;
  if (select("heightCm")) select("heightCm").value = profile.heightCm;
  if (select("sexInput")) select("sexInput").value = profile.sex === "female" ? "female" : "male";
  if (select("weeklyLoss")) select("weeklyLoss").value = profile.weeklyLoss;
  if (select("calorieTarget")) {
    select("calorieTarget").value = profile.manualCalorieTarget ? Number(profile.manualCalorieTarget) : "";
  }
  if (select("waterTargetInput")) select("waterTargetInput").value = Number(profile.waterTargetMl || 2500);

  const activitySelect = select("activityInput");
  if (activitySelect && !activitySelect.options.length) {
    activitySelect.innerHTML = ACTIVITY_LEVELS.map(
      (level) => `<option value="${level.key}">${level.label}</option>`
    ).join("");
  }
  if (activitySelect) activitySelect.value = profile.activityLevel || "light";

  renderTargetSummary();
}

function renderTargetSummary() {
  const p = state.profile;
  if (select("calorieTarget")) {
    select("calorieTarget").placeholder = `Auto: ${formatNum(p.recommendedCalories || p.calorieTarget || 0, 0)} kcal`;
  }

  const modeLabel = p.goalMode === "gain" ? "Gain Target" : p.goalMode === "loss" ? "Cut Target" : "Maintain";
  setHtml(
    "targetSummary",
    `
    <div class="summary-box"><span>Maintenance</span><b>${formatNum(p.maintenanceCalories, 0)}</b></div>
    <div class="summary-box"><span>${modeLabel}</span><b>${formatNum(p.recommendedCalories || p.calorieTarget, 0)}</b></div>
    <div class="summary-box"><span>Active Target</span><b>${formatNum(p.calorieTarget, 0)}</b></div>
    <div class="summary-box protein"><span>Protein</span><b>${formatNum(p.macros.proteinG, 0)}g</b></div>
    <div class="summary-box carbs"><span>Carbs</span><b>${formatNum(p.macros.carbsG, 0)}g</b></div>
    <div class="summary-box fat"><span>Fat</span><b>${formatNum(p.macros.fatG, 0)}g</b></div>`
  );
}

/* Cross-check local targets against USDA equations served by MyPlate.food. */
async function runUsdaVerification() {
  const box = select("usdaCheck");
  if (!box) return;

  if (!isOnline()) {
    box.innerHTML = `<p class="muted">Offline — verification needs internet.</p>`;
    return;
  }

  box.innerHTML = `<p class="muted">Checking against USDA equations…</p>`;

  const [bmi, needs, waterMl] = await Promise.all([
    getBmi(state.profile),
    getCalorieNeeds(state.profile),
    getWaterTargetMl(state.profile),
  ]);

  if (waterMl) {
    state.profile.waterTargetMl = waterMl;
    if (select("waterTargetInput")) select("waterTargetInput").value = waterMl;
    saveState();
  }

  if (!bmi && !needs) {
    box.innerHTML = `<p class="muted">MyPlate.food could not be reached. Try again shortly.</p>`;
    return;
  }

  const rows = [];
  if (bmi?.bmi) {
    rows.push(`<div class="usda-row"><span>BMI</span><b>${formatNum(Number(bmi.bmi), 1)} · ${escapeHtml(String(bmi.classification_label || bmi.classification || ""))}</b></div>`);
  }
  const bmr = Number(needs?.bmr ?? 0);
  if (bmr > 0) rows.push(`<div class="usda-row"><span>BMR (Mifflin-St Jeor)</span><b>${formatNum(bmr, 0)} kcal</b></div>`);
  const tdee = Number(needs?.tdee ?? 0);
  if (tdee > 0) rows.push(`<div class="usda-row"><span>TDEE</span><b>${formatNum(tdee, 0)} kcal</b></div>`);
  const standardCut = (needs?.weight_loss_targets || []).find((t) => t?.key === "standard");
  if (standardCut?.intake) {
    rows.push(`<div class="usda-row"><span>Standard cut (-0.45 kg/wk)</span><b>${formatNum(Number(standardCut.intake), 0)} kcal</b></div>`);
  }
  if (waterMl) rows.push(`<div class="usda-row"><span>Water target</span><b>${(waterMl / 1000).toFixed(1)} L/day</b></div>`);

  const source = String(bmi?.source || needs?.source || "USDA equations via myplate.food");
  box.innerHTML = rows.length
    ? `${rows.join("")}<p class="source-line">${escapeHtml(source)}</p>`
    : `<p class="muted">No comparable values returned.</p>`;
}

/* ---- Workout setup ---- */

function handleWorkoutPrefsSubmit(e) {
  e.preventDefault();
  const closedDay = select("gymClosedDay")?.value;
  const trainingStartDay = select("trainingStartDay")?.value;
  const gymSessionSlot = select("gymSessionSlot")?.value;
  const cardioSessionSlot = select("cardioSessionSlot")?.value;

  if (closedDay) state.profile.gymClosedDay = closedDay;
  if (trainingStartDay) state.profile.trainingStartDay = trainingStartDay;
  if (["morning", "evening"].includes(gymSessionSlot)) state.profile.gymSessionSlot = gymSessionSlot;
  if (["morning", "evening"].includes(cardioSessionSlot)) state.profile.cardioSessionSlot = cardioSessionSlot;

  calculateTargetsFromProfile();
  saveState();
  showToast("Training setup updated.", "success");
  haptic(HAPTIC.success);
  renderApp();
}

function renderWorkoutPrefsForm() {
  const profile = state.profile;
  if (select("gymClosedDay")) select("gymClosedDay").value = profile.gymClosedDay || "Sunday";
  if (select("trainingStartDay")) select("trainingStartDay").value = profile.trainingStartDay || "Monday";
  if (select("gymSessionSlot")) select("gymSessionSlot").value = profile.gymSessionSlot || "morning";
  if (select("cardioSessionSlot")) select("cardioSessionSlot").value = profile.cardioSessionSlot || "evening";
}

/* ---- Data ---- */

function exportData() {
  const payload = {
    app: APP_NAME,
    version: APP_VERSION,
    userEmail: currentUser?.email,
    exportedAt: new Date().toISOString(),
    state,
  };
  downloadBlob(JSON.stringify(payload, null, 2), `dad-bod-${todayDate()}.json`, "application/json");
  showToast("Backup exported.", "success");
}

function importData(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed?.state ? parsed.state : parsed;
      const base = getDefaultStateFor(currentUser);
      replaceState(mergeState(base, importedState));
      calculateTargetsFromProfile();
      saveState();
      renderApp();
      showToast("Data imported successfully.", "success");
    } catch {
      showToast("Invalid backup file.", "error");
    }
  };
  reader.readAsText(file);
}

function exportUserDirectoryCsv() {
  if (!currentUser?.isAdmin) {
    showToast("Only the owner profile can export the user sheet.", "error");
    return;
  }

  const rows = Array.isArray(authStore.userDirectory) ? authStore.userDirectory : [];
  if (!rows.length) {
    showToast("No user entries recorded yet.", "error");
    return;
  }

  const csv = toCsv(
    ["Name", "Email", "Admin", "First Seen", "Last Seen"],
    rows.map((entry) => [entry.name, entry.email, entry.isAdmin ? "Yes" : "No", entry.firstSeenAt, entry.lastSeenAt])
  );
  downloadBlob(csv, `dad-bod-users-${todayDate()}.csv`, "text/csv;charset=utf-8");
  showToast("Users sheet exported.", "success");
}

function clearToday() {
  if (!confirm("Clear all meals logged today?")) return;
  state.mealsByDate[todayDate()] = [];
  saveState();
  renderApp();
  showToast("Today's meals cleared.");
}

/* ---- Policies ---- */

function openPolicyModal(title, bodyHtml) {
  setText("policyModalTitle", title);
  setHtml("policyModalBody", bodyHtml);
  openLayer("policyModal");
}

function openAbout() {
  openPolicyModal(
    "About Dad Bod",
    `<p><strong>${APP_NAME} — The Dad Physique OS</strong></p>
     <p>Version ${APP_VERSION}</p>
     <p>Dad Bod is a free, all-in-one physique companion: calories, macros and 16 nutrients, structured training, hydration, weight trends, and progress photos — with no subscription and no premium wall.</p>
     <p><strong>Powered by open data:</strong></p>
     <ul>
       <li>5,200+ food Indian nutrition dataset (on-device)</li>
       <li>Edamam natural-language food parsing</li>
       <li>Open Food Facts barcode database</li>
       <li>USDA MyPlate calculators & recipes (myplate.food)</li>
       <li>wger open exercise database</li>
       <li>OpenStreetMap nearby gyms & parks</li>
     </ul>
     <p><strong>Developer:</strong> Satvik Pandey</p>
     <p>© 2024-2026 Dad Bod. All rights reserved.</p>`
  );
}

function openHelp() {
  openPolicyModal(
    "Help & Support",
    `<p>We're here for you.</p>
     <h3>Contact</h3>
     <p>Email: <a href="mailto:satvikofficial20@gmail.com">satvikofficial20@gmail.com</a></p>
     <h3>FAQ</h3>
     <p><strong>Is Dad Bod really free?</strong><br/>Yes. Every feature — tracking, workouts, recipes, progress, custom training plans — is free.</p>
     <p><strong>Do I need an account or API key?</strong><br/>No. Continue Offline keeps everything on-device. Google Sign-In is optional for encrypted backup.</p>
     <p><strong>Where is my data stored?</strong><br/>On your device. Use HQ → Your Data → Export for backups, or optional encrypted cloud backup when signed in.</p>
     <p><strong>Can I customize my workouts?</strong><br/>Yes. HQ → Training Setup → Weekly exercise plan. Pick a day, remove moves, and search the same library as Train → Library to add exercises.</p>
     <p><strong>Does it work offline?</strong><br/>Yes — logging, workouts, and the Indian food dataset are offline. Online search, barcodes, recipes, nearby places, and first-time exercise catalog sync need internet.</p>
     <p><strong>Coins & streaks</strong><br/>Tap the coin or streak chips on Home to open rewards and consistency. Coins are earned by completing missions, not by opening the app.</p>`
  );
}

function openPrivacyPolicy() {
  openPolicyModal(
    "Privacy Policy",
    `<p><em>Last updated: August 2, 2026</em></p>
     <h3>Your data stays on your device</h3>
     <p>Meal logs, workouts (including custom exercise plans), weight entries, photos, and profile details are stored locally on your device. Dad Bod has no analytics SDKs and no server of its own for day-to-day tracking.</p>
     <h3>Sign-in (optional)</h3>
     <p>Signing in with Google shares your name, email, and profile photo with the app to identify your profile. Choosing "Continue Offline" skips this entirely — no account is created and nothing is uploaded.</p>
     <h3>Cloud backup (optional)</h3>
     <p>If you enable backup, your data is encrypted on this device with a passphrase only you know (AES-GCM-256) before upload. We store an unreadable blob and cannot decrypt it. Delete it any time from Dad Bod HQ.</p>
     <h3>Network services</h3>
     <p>Some features contact public nutrition and fitness APIs with the minimum data needed, and only when you use them:</p>
     <ul>
       <li><strong>Edamam</strong> — the food text you search online</li>
       <li><strong>Open Food Facts / UPCItemDB</strong> — barcodes you scan</li>
       <li><strong>MyPlate.food</strong> — age, sex, height, weight, activity for USDA calculations; recipe searches</li>
       <li><strong>wger.de</strong> — exercise catalog used by Train → Library and Training Setup search</li>
       <li><strong>Overpass / OpenStreetMap</strong> — your approximate location, only when you open Nearby</li>
     </ul>
     <p>No personal identifiers are attached to these requests. Location is never collected in the background.</p>
     <h3>Permissions</h3>
     <p>Camera (barcode &amp; label scanning, progress photos), microphone (voice logging), and location (nearby gyms) are requested only when you use those features.</p>
     <h3>Data deletion</h3>
     <p>Clear Today, Export/Import, Switch Profile, clear app storage, or uninstall. Uninstalling removes local data.</p>
     <p>Questions: <a href="mailto:satvikofficial20@gmail.com">satvikofficial20@gmail.com</a></p>`
  );
}

function openTerms() {
  openPolicyModal(
    "Terms of Service",
    `<p><em>Last updated: August 2, 2026</em></p>
     <h3>Acceptance</h3>
     <p>By using Dad Bod you agree to these terms.</p>
     <h3>License</h3>
     <p>Dad Bod grants you a free, non-exclusive, non-transferable license for personal fitness tracking.</p>
     <h3>Not medical advice</h3>
     <p>Nutrition values, workout templates, and calculators are educational estimates from published equations and public databases. Always consult a healthcare professional before starting a diet or exercise program.</p>
     <h3>Custom training plans</h3>
     <p>You may customize exercises per weekday. You are responsible for choosing safe loads, form, and recovery. Default templates are starting points, not prescriptions.</p>
     <h3>Third-party data</h3>
     <p>Nutrition, recipe, exercise, and map data come from Edamam, Open Food Facts, MyPlate.food, wger, and OpenStreetMap under their respective terms.</p>
     <h3>Liability</h3>
     <p>Dad Bod is provided "as is" without warranties. We are not liable for health outcomes or data loss — keep backups via Export or encrypted cloud backup.</p>
     <p>Contact: <a href="mailto:satvikofficial20@gmail.com">satvikofficial20@gmail.com</a></p>`
  );
}

/* ---- Rewards ---- */

function renderRewards() {
  const card = select("rewardsCard");
  if (!card) return;

  const coins = getCoins();
  const today = todaysEarned();
  const ledger = recentLedger(8);

  card.innerHTML = `
    <div class="coins-hero">
      <span class="coins-badge">${icon("medal", "", 26)}</span>
      <div class="coins-hero-body">
        <b>${coins.toLocaleString()}</b>
        <span>Dad Coins${today > 0 ? ` · +${today.toLocaleString()} today` : " · earn by finishing missions"}</span>
      </div>
    </div>
    <h3 class="coins-section-title">How to earn</h3>
    <div class="earn-grid">
      ${REWARD_RULES.map(
        (rule) => `
        <div class="earn-row">
          <span class="earn-icon">${icon(rule.icon, "", 16)}</span>
          <span class="earn-label">${escapeHtml(rule.label)}</span>
          <span class="earn-coins">+${rule.coins}</span>
        </div>`
      ).join("")}
    </div>
    <h3 class="coins-section-title">Streak bonuses</h3>
    <div class="earn-grid earn-grid-milestones">
      ${STREAK_MILESTONES.map(
        (m) => `
        <div class="earn-row milestone">
          <span class="earn-icon">${icon("flame", "", 16)}</span>
          <span class="earn-label">${escapeHtml(m.label)}</span>
          <span class="earn-coins">+${m.coins.toLocaleString()}</span>
        </div>`
      ).join("")}
    </div>
    <h3 class="coins-section-title">Recent</h3>
    ${ledger.length
      ? `<div class="ledger">${ledger
          .map(
            (entry) => `
          <div class="ledger-row">
            <span class="ledger-label">${escapeHtml(entry.label)}</span>
            <span class="ledger-meta">${entry.date}</span>
            <b>+${Number(entry.coins).toLocaleString()}</b>
          </div>`
          )
          .join("")}</div>`
      : `<p class="muted coins-empty">Complete today's missions to start earning.</p>`}
    <p class="source-line">Coins unlock future premium coaching. Earned by doing, not by opening.</p>`;
}

/* ---- Render ---- */

export function renderMore() {
  if (!state) return;

  select("userSheetExportBtn")?.classList.toggle("hidden", !currentUser?.isAdmin);
  setText("versionFooter", `${APP_NAME} v${APP_VERSION} · Crafted by Satvik Pandey`);

  const coins = getCoins();
  const earnedToday = todaysEarned();
  setText(
    "rewardsRowSub",
    coins > 0
      ? `${coins.toLocaleString()} coins${earnedToday > 0 ? ` · +${earnedToday.toLocaleString()} today` : ""}`
      : "Earn by doing, not by opening"
  );

  renderAccount();
  renderRewards();
  renderGoalsForm();
  renderWorkoutPrefsForm();
  renderTrainingSetupEditor();
}
