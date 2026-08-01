/* Dad Bod — account panel and encrypted cloud backup controls. */

import { APP_VERSION } from "../config.js";
import { select, setText, setHtml, escapeHtml } from "../utils.js";
import {
  state,
  currentUser,
  saveState,
  mergeState,
  replaceState,
  getDefaultStateFor,
} from "../core/store.js";
import { calculateTargetsFromProfile } from "../core/profile.js";
import { encryptPayload, decryptPayload, buildBackupPayload, uploadBackup, downloadBackup, deleteBackup } from "../services/backup.js";
import { isOnline } from "../services/http.js";
import { icon } from "../ui/icons.js";
import { showToast, openLayer, closeLayer, haptic, HAPTIC } from "../ui/components.js";
import { renderApp } from "../core/bus.js";

/* Held in memory only for the current session so a backup + restore round trip
 * doesn't re-prompt. Never persisted — persisting it would defeat E2E encryption. */
let sessionPassphrase = "";

export function initAccount() {
  select("backupOpenBtn")?.addEventListener("click", () => {
    haptic(HAPTIC.tap);
    renderBackupSheet();
    openLayer("backupSheet");
  });

  select("backupRunBtn")?.addEventListener("click", runBackup);
  select("backupRestoreBtn")?.addEventListener("click", runRestore);
  select("backupDeleteBtn")?.addEventListener("click", runDelete);
}

/* ---- Account card ---- */

export function renderAccount() {
  const card = select("accountCard");
  if (!card || !currentUser) return;

  const isGoogle = currentUser.provider === "google";
  const initial = (currentUser.name || "A").trim().charAt(0).toUpperCase();
  const avatar = currentUser.photoUrl
    ? `<img class="account-avatar" src="${escapeHtml(currentUser.photoUrl)}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'avatar large',textContent:'${escapeHtml(initial)}'}))" />`
    : `<div class="avatar large">${escapeHtml(initial)}</div>`;

  card.innerHTML = `
    ${avatar}
    <div class="profile-body">
      <b>${escapeHtml(currentUser.name || "Athlete")}</b>
      <small>${escapeHtml(currentUser.email || "On this device")}</small>
      <span class="account-badge ${isGoogle ? "google" : "offline"}">
        ${icon(isGoogle ? "shield" : "user", "", 13)} ${isGoogle ? "Google account" : "Offline profile"}
      </span>
    </div>
    ${currentUser.isAdmin ? `<span class="chip accent">Owner</span>` : ""}`;

  const backupRow = select("backupOpenBtn");
  if (backupRow) {
    const sub = backupRow.querySelector("small");
    if (sub) {
      sub.textContent = isGoogle
        ? state.backupMeta?.lastBackupAt
          ? `Last backup ${new Date(state.backupMeta.lastBackupAt).toLocaleDateString()}`
          : "Encrypted backup — not set up yet"
        : "Sign in with Google to enable";
    }
  }
}

/* ---- Backup sheet ---- */

function renderBackupSheet() {
  const isGoogle = currentUser?.provider === "google";
  const meta = state.backupMeta || {};

  setHtml(
    "backupIntro",
    isGoogle
      ? `<p>Your backup is encrypted on this device with a passphrase only you know. We store an unreadable blob — nobody can decrypt it without your passphrase, including us.</p>
         <p class="backup-warn">${icon("info", "", 14)} If you forget the passphrase, the backup cannot be recovered.</p>`
      : `<p>Cloud backup needs a Google account so your data can be restored on a new phone.</p>
         <p class="backup-warn">${icon("info", "", 14)} You're on an offline profile. Use Export in Your Data for a local backup file.</p>`
  );

  ["backupRunBtn", "backupRestoreBtn", "backupDeleteBtn"].forEach((id) => {
    const btn = select(id);
    if (btn) btn.disabled = !isGoogle;
  });

  const field = select("backupPassphrase");
  if (field) {
    field.disabled = !isGoogle;
    field.value = sessionPassphrase;
  }

  setText(
    "backupStatus",
    meta.lastBackupAt
      ? `Last backup ${new Date(meta.lastBackupAt).toLocaleString()}${meta.photosIncluded === false ? " (photos kept on device)" : ""}`
      : ""
  );
}

function readPassphrase() {
  const value = String(select("backupPassphrase")?.value || "");
  if (value.length < 8) {
    setText("backupStatus", "Use a passphrase of at least 8 characters.");
    return null;
  }
  sessionPassphrase = value;
  return value;
}

function busy(isBusy, label) {
  ["backupRunBtn", "backupRestoreBtn", "backupDeleteBtn"].forEach((id) => {
    const btn = select(id);
    if (btn) btn.disabled = isBusy || currentUser?.provider !== "google";
  });
  if (label) setText("backupStatus", label);
}

async function runBackup() {
  if (!currentUser?.googleUid) return;
  if (!isOnline()) {
    setText("backupStatus", "You're offline — connect and try again.");
    return;
  }

  const passphrase = readPassphrase();
  if (!passphrase) return;

  busy(true, "Encrypting…");
  try {
    const payload = buildBackupPayload(state, { includePhotos: true });
    const envelope = await encryptPayload(payload.data, passphrase);

    busy(true, "Uploading…");
    const result = await uploadBackup(currentUser.googleUid, envelope, {
      appVersion: APP_VERSION,
      photosIncluded: payload.photosIncluded,
      approxBytes: payload.approxBytes,
    });

    if (!result.ok) {
      setText("backupStatus", result.message);
      showToast("Backup failed.", "error");
      return;
    }

    state.backupMeta = {
      lastBackupAt: new Date().toISOString(),
      photosIncluded: payload.photosIncluded,
    };
    saveState();
    haptic(HAPTIC.success);
    showToast(
      payload.photosIncluded ? "Encrypted backup saved." : "Encrypted backup saved (photos kept on device).",
      "success"
    );
    renderBackupSheet();
    renderAccount();
  } catch (error) {
    setText("backupStatus", error?.message || "Backup failed.");
  } finally {
    busy(false);
  }
}

async function runRestore() {
  if (!currentUser?.googleUid) return;
  if (!isOnline()) {
    setText("backupStatus", "You're offline — connect and try again.");
    return;
  }

  const passphrase = readPassphrase();
  if (!passphrase) return;

  busy(true, "Fetching backup…");
  try {
    const result = await downloadBackup(currentUser.googleUid);
    if (!result.ok) {
      setText("backupStatus", result.message);
      return;
    }

    busy(true, "Decrypting…");
    const restored = await decryptPayload(result.envelope, passphrase);

    /* Merge rather than overwrite: photos live only on the device, so a restore
     * must never wipe the ones already here. */
    const base = getDefaultStateFor(currentUser);
    const merged = mergeState(base, restored);
    if (!restored.photoEntries?.some((entry) => entry.image)) {
      merged.photoEntries = state.photoEntries || [];
    }

    replaceState(merged);
    calculateTargetsFromProfile();
    saveState();
    renderApp();

    haptic(HAPTIC.success);
    showToast("Backup restored.", "success");
    setText(
      "backupStatus",
      `Restored from ${result.updatedAt ? new Date(result.updatedAt).toLocaleString() : "cloud backup"}.`
    );
    renderAccount();
  } catch (error) {
    setText("backupStatus", error?.message || "Restore failed.");
    if (error?.wrongPassphrase) haptic(HAPTIC.warn);
  } finally {
    busy(false);
  }
}

async function runDelete() {
  if (!currentUser?.googleUid) return;
  if (!confirm("Delete your encrypted cloud backup? Data on this device is not affected.")) return;

  busy(true, "Deleting…");
  const result = await deleteBackup(currentUser.googleUid);
  if (!result.ok) {
    setText("backupStatus", result.message);
  } else {
    state.backupMeta = null;
    saveState();
    setText("backupStatus", "Cloud backup deleted.");
    showToast("Cloud backup deleted.");
    renderAccount();
  }
  busy(false);
}
