/* Dad Bod — Firebase transport.
 *
 * Two backends, one interface:
 *   • Native (Android/iOS) — the @capacitor-firebase/authentication plugin,
 *     reached through the Capacitor runtime bridge so no bundler is needed.
 *   • Web — the Firebase JS SDK, lazy-loaded from gstatic only when the user
 *     actually taps "Continue with Google".
 *
 * Everything degrades to null/false rather than throwing at import time, so the
 * app always boots — offline mode must never depend on Firebase being reachable.
 */

import { FIREBASE_CONFIG } from "../firebase-config.js";

const WEB_SDK_VERSION = "10.14.1";

let webAuthPromise = null;

/* ---- Backend detection ---- */

export function isNativePlatform() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

function nativePlugin() {
  return window.Capacitor?.Plugins?.FirebaseAuthentication || null;
}

export function googleSignInAvailability() {
  if (isNativePlatform()) {
    return nativePlugin()
      ? { available: true, backend: "native" }
      : { available: false, reason: "The sign-in module is missing from this build." };
  }
  if (!FIREBASE_CONFIG.apiKey) {
    return { available: false, reason: "Firebase is not configured for this build." };
  }
  return { available: true, backend: "web" };
}

/* ---- Web SDK (lazy) ---- */

async function loadWebAuth() {
  if (webAuthPromise) return webAuthPromise;

  webAuthPromise = (async () => {
    const [{ initializeApp, getApps }, authModule] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${WEB_SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${WEB_SDK_VERSION}/firebase-auth.js`),
    ]);

    const config = {
      apiKey: FIREBASE_CONFIG.apiKey,
      authDomain: FIREBASE_CONFIG.authDomain,
      projectId: FIREBASE_CONFIG.projectId,
    };
    if (FIREBASE_CONFIG.webAppId) config.appId = FIREBASE_CONFIG.webAppId;
    if (FIREBASE_CONFIG.storageBucket) config.storageBucket = FIREBASE_CONFIG.storageBucket;
    if (FIREBASE_CONFIG.messagingSenderId) config.messagingSenderId = FIREBASE_CONFIG.messagingSenderId;

    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const auth = authModule.getAuth(app);
    await authModule.setPersistence(auth, authModule.browserLocalPersistence).catch(() => {});
    return { auth, authModule };
  })().catch((error) => {
    webAuthPromise = null;
    throw error;
  });

  return webAuthPromise;
}

/* ---- User normalization ---- */

function normalizeUser(raw) {
  if (!raw?.uid) return null;
  return {
    uid: String(raw.uid),
    email: String(raw.email || "").trim().toLowerCase(),
    name: String(raw.displayName || raw.name || "").trim(),
    photoUrl: raw.photoUrl || raw.photoURL || null,
    emailVerified: Boolean(raw.emailVerified),
  };
}

/* ---- Error mapping ---- */

/* Turns provider error codes into something a human can act on. Code 10 is the
 * classic Android SHA-1 mismatch and is worth naming explicitly. */
export function describeAuthError(error) {
  const raw = String(error?.message || error?.code || error || "");
  const lower = raw.toLowerCase();

  if (/(^|\D)10(\D|$)/.test(raw) && /developer|error 10|status/i.test(raw)) {
    return "Sign-in rejected by Google (error 10). The app's signing certificate isn't registered in Firebase yet.";
  }
  if (lower.includes("popup_closed") || lower.includes("popup-closed") || lower.includes("cancel")) {
    return "Sign-in cancelled.";
  }
  if (lower.includes("popup-blocked")) {
    return "Your browser blocked the sign-in popup. Allow popups and try again.";
  }
  if (lower.includes("unauthorized-domain") || lower.includes("unauthorized_domain")) {
    return "This domain isn't authorized in Firebase Authentication settings.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Network problem reaching Google. Check your connection and retry.";
  }
  if (lower.includes("configuration-not-found") || lower.includes("operation-not-allowed")) {
    return "Google sign-in isn't enabled for this Firebase project yet.";
  }
  if (lower.includes("api-key-not-valid") || lower.includes("invalid-api-key")) {
    return "Firebase configuration is invalid for this build.";
  }
  return raw ? `Sign-in failed: ${raw.slice(0, 140)}` : "Sign-in failed. Please try again.";
}

/* ---- Public API ---- */

export async function signInWithGoogle() {
  const availability = googleSignInAvailability();
  if (!availability.available) {
    const error = new Error(availability.reason);
    error.friendly = availability.reason;
    throw error;
  }

  if (availability.backend === "native") {
    const plugin = nativePlugin();
    const result = await plugin.signInWithGoogle({ scopes: ["profile", "email"] });
    const user = normalizeUser(result?.user);
    if (!user) throw new Error("Google returned no account details.");
    return user;
  }

  if (!FIREBASE_CONFIG.webAppId) {
    const reason =
      "Browser sign-in needs a Web app registered in Firebase. Use the Android app, or continue offline.";
    const error = new Error(reason);
    error.friendly = reason;
    throw error;
  }

  const { auth, authModule } = await loadWebAuth();
  const provider = new authModule.GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  const credential = await authModule.signInWithPopup(auth, provider);
  const user = normalizeUser(credential?.user);
  if (!user) throw new Error("Google returned no account details.");
  return user;
}

/* Restores a persisted session on launch. Returns null when signed out. */
export async function getCurrentUser() {
  try {
    if (isNativePlatform()) {
      const plugin = nativePlugin();
      if (!plugin) return null;
      const result = await plugin.getCurrentUser();
      return normalizeUser(result?.user);
    }

    /* Only touch the web SDK if a session could plausibly exist — avoids a
     * network fetch on every cold start for offline-only users. */
    if (!FIREBASE_CONFIG.webAppId || !hasWebSessionHint()) return null;

    const { auth, authModule } = await loadWebAuth();
    const user = await new Promise((resolve) => {
      const unsubscribe = authModule.onAuthStateChanged(
        auth,
        (value) => {
          unsubscribe();
          resolve(value);
        },
        () => {
          unsubscribe();
          resolve(null);
        }
      );
      setTimeout(() => resolve(auth.currentUser || null), 4000);
    });
    return normalizeUser(user);
  } catch (error) {
    console.warn("Firebase session restore failed", error?.message || error);
    return null;
  }
}

function hasWebSessionHint() {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("firebase:authUser:")) return true;
    }
  } catch {}
  return false;
}

export async function signOutFirebase() {
  try {
    if (isNativePlatform()) {
      await nativePlugin()?.signOut();
      return;
    }
    if (!webAuthPromise) return;
    const { auth, authModule } = await loadWebAuth();
    await authModule.signOut(auth);
  } catch (error) {
    console.warn("Firebase sign-out failed", error?.message || error);
  }
}

/* Fresh ID token for authenticated Firestore REST calls. */
export async function getIdToken(forceRefresh = false) {
  try {
    if (isNativePlatform()) {
      const result = await nativePlugin()?.getIdToken({ forceRefresh });
      return result?.token || null;
    }
    const { auth } = await loadWebAuth();
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (error) {
    console.warn("Could not get ID token", error?.message || error);
    return null;
  }
}
