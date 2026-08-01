/* Dad Bod — landing + profile onboarding. Local, instant, no passwords:
 * a name and an email create (or reopen) an on-device profile. */

import { ONBOARDING_QUOTES } from "../config.js";
import { select, setText, normalizeEmail, isValidEmail } from "../utils.js";
import {
  authStore,
  upsertUserProfile,
  isConfiguredAdminEmail,
  adminPasskeyRequired,
  verifyAdminPasskey,
} from "../core/store.js";
import { showToast, haptic, HAPTIC } from "../ui/components.js";

let onActivate = null;

export function initOnboarding(activateCallback) {
  onActivate = activateCallback;
  select("welcomeForm")?.addEventListener("submit", handleWelcomeSubmit);
}

export function showAuthShell(prefillUser = null) {
  select("authShell")?.classList.remove("hidden");
  select("appShell")?.classList.add("hidden");
  select("welcomeForm")?.reset();
  setOnboardingQuote();
  prefillOnboardingForm(prefillUser);
}

export function showAppShell() {
  select("authShell")?.classList.add("hidden");
  select("appShell")?.classList.remove("hidden");
}

function setOnboardingQuote() {
  const idx = Math.floor(Math.random() * ONBOARDING_QUOTES.length);
  setText("welcomeQuote", `"${ONBOARDING_QUOTES[idx]}"`);
}

function prefillOnboardingForm(user = null) {
  const candidate = user || authStore.users.find((u) => u.id === authStore.activeUserId) || null;
  if (!candidate) return;
  if (select("welcomeName")) select("welcomeName").value = candidate.name || "";
  if (select("welcomeEmail")) select("welcomeEmail").value = candidate.email || "";
}

function handleWelcomeSubmit(e) {
  e.preventDefault();

  const name = String(select("welcomeName")?.value || "").trim();
  const email = normalizeEmail(select("welcomeEmail")?.value);

  if (!name || !email) {
    showToast("Enter your name and email to begin.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showToast("That email doesn't look right.", "error");
    return;
  }

  if (isConfiguredAdminEmail(email) && adminPasskeyRequired()) {
    const passkey = prompt("Owner passkey required for this profile:");
    if (!verifyAdminPasskey(passkey)) {
      showToast("Incorrect passkey.", "error");
      return;
    }
  }

  const user = upsertUserProfile(name, email);
  haptic(HAPTIC.success);
  if (onActivate) onActivate(user);
  showToast(`Welcome, ${user.name}!`, "success");
}
