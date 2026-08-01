/* Dad Bod — landing and sign-in.
 *
 * Two doors, both first-class: sign in with Google (identity + encrypted cloud
 * backup), or continue offline (nothing leaves the device, ever). Offline never
 * depends on Firebase being configured, reachable, or enabled.
 */

import { ONBOARDING_QUOTES } from "../config.js";
import { select, setText, normalizeEmail, isValidEmail } from "../utils.js";
import {
  authStore,
  createOfflineProfile,
  resolveGoogleAccount,
  isConfiguredAdminEmail,
  adminPasskeyRequired,
  verifyAdminPasskey,
} from "../core/store.js";
import { signInWithGoogle, googleSignInAvailability, describeAuthError } from "../services/firebase.js";
import { showToast, haptic, HAPTIC } from "../ui/components.js";

let onActivate = null;
let signingIn = false;

const MIGRATION_MESSAGES = {
  "linked-by-email": "Welcome back — your existing progress is linked to this account.",
  "adopted-local": "Your existing progress has been moved into this account.",
  "existing-account": "",
  "new-account": "",
};

export function initOnboarding(activateCallback) {
  onActivate = activateCallback;

  select("googleSignInBtn")?.addEventListener("click", handleGoogleSignIn);
  select("offlineToggleBtn")?.addEventListener("click", showOfflineForm);
  select("offlineBackBtn")?.addEventListener("click", hideOfflineForm);
  select("welcomeForm")?.addEventListener("submit", handleOfflineSubmit);
}

export function showAuthShell(prefillUser = null) {
  select("authShell")?.classList.remove("hidden");
  select("appShell")?.classList.add("hidden");
  select("welcomeForm")?.reset();
  hideOfflineForm();
  setOnboardingQuote();
  prefillOnboardingForm(prefillUser);
  setText("authStatus", "");
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

/* ---- Offline ---- */

function showOfflineForm() {
  haptic(HAPTIC.tap);
  select("authChoices")?.classList.add("hidden");
  select("offlinePanel")?.classList.remove("hidden");
  setTimeout(() => select("welcomeName")?.focus(), 220);
}

function hideOfflineForm() {
  select("offlinePanel")?.classList.add("hidden");
  select("authChoices")?.classList.remove("hidden");
}

function handleOfflineSubmit(e) {
  e.preventDefault();

  const name = String(select("welcomeName")?.value || "").trim();
  const email = normalizeEmail(select("welcomeEmail")?.value);

  if (!name) {
    setText("authStatus", "Enter your name to continue.");
    return;
  }
  if (email && !isValidEmail(email)) {
    setText("authStatus", "That email doesn't look right — or leave it blank.");
    return;
  }

  const profileEmail = email || `${slugify(name)}@device.local`;

  if (isConfiguredAdminEmail(profileEmail) && adminPasskeyRequired()) {
    const passkey = prompt("Owner passkey required for this profile:");
    if (!verifyAdminPasskey(passkey)) {
      setText("authStatus", "Incorrect passkey.");
      return;
    }
  }

  const user = createOfflineProfile(name, profileEmail);
  haptic(HAPTIC.success);
  if (onActivate) onActivate(user);
  showToast(`Welcome, ${user.name}!`, "success");
}

function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "") || "athlete"
  );
}

/* ---- Google ---- */

async function handleGoogleSignIn() {
  if (signingIn) return;

  const availability = googleSignInAvailability();
  if (!availability.available) {
    setText("authStatus", `${availability.reason} You can continue offline instead.`);
    showOfflineForm();
    return;
  }

  signingIn = true;
  setSigningInState(true);
  setText("authStatus", "Opening Google…");
  haptic(HAPTIC.tap);

  try {
    const googleUser = await signInWithGoogle();
    const { user, migration } = resolveGoogleAccount(googleUser);

    haptic(HAPTIC.success);
    if (onActivate) onActivate(user);

    const note = MIGRATION_MESSAGES[migration];
    showToast(note || `Welcome, ${user.name.split(" ")[0]}!`, "success");
  } catch (error) {
    const message = error?.friendly || describeAuthError(error);
    setText("authStatus", message);
    if (!/cancel/i.test(message)) showToast(message, "error");
  } finally {
    signingIn = false;
    setSigningInState(false);
  }
}

function setSigningInState(busy) {
  const btn = select("googleSignInBtn");
  if (!btn) return;
  btn.disabled = busy;
  btn.classList.toggle("busy", busy);
}
