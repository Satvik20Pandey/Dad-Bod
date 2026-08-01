/* Dad Bod — end-to-end encrypted cloud backup.
 *
 * Your data is encrypted on the device with a key derived from a passphrase
 * only you know (PBKDF2-SHA256 → AES-GCM-256). The server stores an opaque
 * ciphertext blob: Google, Firebase, and we ourselves cannot read it. Lose the
 * passphrase and the backup is unrecoverable — that is the point.
 *
 * Transport is the Firestore REST API with the Firebase ID token, so no
 * Firestore SDK (and therefore no bundler) is required.
 */

import { FIRESTORE_BASE } from "../firebase-config.js";
import { getIdToken } from "./firebase.js";
import { fetchWithTimeout } from "./http.js";

const PBKDF2_ITERATIONS = 210000;
const SCHEMA_VERSION = 1;
/* Firestore caps a document at 1 MiB; stay well clear after base64 overhead. */
const MAX_PAYLOAD_CHARS = 900000;

/* ---- Encoding helpers ---- */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function cryptoApi() {
  const api = globalThis.crypto?.subtle;
  if (!api) throw new Error("Secure crypto is unavailable in this browser.");
  return api;
}

/* ---- Key derivation + envelope ---- */

async function deriveKey(passphrase, salt) {
  const subtle = cryptoApi();
  const baseKey = await subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPayload(data, passphrase) {
  const subtle = cryptoApi();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plaintext = encoder.encode(JSON.stringify(data));
  const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    v: SCHEMA_VERSION,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptPayload(envelope, passphrase) {
  if (!envelope?.ct || !envelope?.salt || !envelope?.iv) {
    throw new Error("Backup is malformed.");
  }
  const subtle = cryptoApi();
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const key = await deriveKey(passphrase, salt);

  let plaintext;
  try {
    plaintext = await subtle.decrypt({ name: "AES-GCM", iv }, key, fromBase64(envelope.ct));
  } catch {
    /* AES-GCM authentication failure — wrong passphrase or tampered blob. */
    const error = new Error("Wrong passphrase, or this backup is corrupted.");
    error.wrongPassphrase = true;
    throw error;
  }

  return JSON.parse(decoder.decode(plaintext));
}

/* ---- Payload shaping ----
 * Progress photos are base64 images and dominate the payload. They stay on the
 * device unless they fit comfortably, and the caller is told either way. */

export function buildBackupPayload(state, { includePhotos = true } = {}) {
  const clone = JSON.parse(JSON.stringify(state || {}));
  let photosIncluded = includePhotos;

  if (!includePhotos) {
    clone.photoEntries = stripPhotoImages(clone.photoEntries);
  }

  let serialized = JSON.stringify(clone);
  if (serialized.length > MAX_PAYLOAD_CHARS && photosIncluded) {
    clone.photoEntries = stripPhotoImages(clone.photoEntries);
    photosIncluded = false;
    serialized = JSON.stringify(clone);
  }

  return {
    data: clone,
    photosIncluded,
    approxBytes: serialized.length,
    tooLarge: serialized.length > MAX_PAYLOAD_CHARS,
  };
}

function stripPhotoImages(entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    ...entry,
    image: null,
    imageOmitted: true,
  }));
}

/* ---- Firestore REST transport ---- */

function backupUrl(uid) {
  return `${FIRESTORE_BASE}/backups/${encodeURIComponent(uid)}`;
}

function describeFirestoreError(status, bodyText) {
  const body = String(bodyText || "");
  if (status === 401) return "Session expired. Sign in again and retry.";
  if (status === 403) {
    if (/has not been used|disabled|SERVICE_DISABLED/i.test(body)) {
      return "Cloud Firestore isn't enabled for this project yet. Enable it in the Firebase Console, then retry.";
    }
    return "Firestore rules rejected the request. Publish the backup rules from docs/FIREBASE.md.";
  }
  if (status === 404) {
    return "No Firestore database found. Create one (production mode) in the Firebase Console, then retry.";
  }
  if (status === 429) return "Too many backup requests. Try again in a moment.";
  return `Backup service error (HTTP ${status}).`;
}

export async function uploadBackup(uid, envelope, meta = {}) {
  const token = await getIdToken(true);
  if (!token) return { ok: false, message: "You need to be signed in to back up." };

  const document = {
    fields: {
      payload: { stringValue: JSON.stringify(envelope) },
      updatedAt: { stringValue: new Date().toISOString() },
      appVersion: { stringValue: String(meta.appVersion || "") },
      photosIncluded: { booleanValue: Boolean(meta.photosIncluded) },
      approxBytes: { integerValue: String(meta.approxBytes || 0) },
    },
  };

  try {
    const response = await fetchWithTimeout(backupUrl(uid), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(document),
      timeoutMs: 25000,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, message: describeFirestoreError(response.status, text) };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: `Could not reach the backup service (${error?.message || "network error"}).` };
  }
}

export async function downloadBackup(uid) {
  const token = await getIdToken(true);
  if (!token) return { ok: false, message: "You need to be signed in to restore." };

  try {
    const response = await fetchWithTimeout(backupUrl(uid), {
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 25000,
    });

    if (response.status === 404) {
      return { ok: false, empty: true, message: "No cloud backup found for this account yet." };
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, message: describeFirestoreError(response.status, text) };
    }

    const body = await response.json();
    const raw = body?.fields?.payload?.stringValue;
    if (!raw) return { ok: false, empty: true, message: "The cloud backup is empty." };

    return {
      ok: true,
      envelope: JSON.parse(raw),
      updatedAt: body?.fields?.updatedAt?.stringValue || null,
      photosIncluded: Boolean(body?.fields?.photosIncluded?.booleanValue),
    };
  } catch (error) {
    return { ok: false, message: `Could not reach the backup service (${error?.message || "network error"}).` };
  }
}

export async function deleteBackup(uid) {
  const token = await getIdToken(true);
  if (!token) return { ok: false, message: "You need to be signed in." };

  try {
    const response = await fetchWithTimeout(backupUrl(uid), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 20000,
    });
    if (!response.ok && response.status !== 404) {
      const text = await response.text().catch(() => "");
      return { ok: false, message: describeFirestoreError(response.status, text) };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: `Could not reach the backup service (${error?.message || "network error"}).` };
  }
}
