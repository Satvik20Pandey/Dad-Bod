#!/usr/bin/env node
/* Dad Bod — auth + backup unit tests.
 *
 * Covers the two areas where a bug would silently destroy user data:
 *   • the encryption envelope (round-trip, wrong passphrase, tampering)
 *   • Google account linking / local-profile migration
 *
 * Runs the real modules against a minimal browser-storage shim.
 * Run: npm run test:auth */

import assert from "node:assert/strict";

/* ---- Browser shims (store.js touches localStorage at import time) ---- */

function installShims() {
  const store = new Map();
  globalThis.localStorage = {
    get length() {
      return store.size;
    },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  globalThis.window = globalThis.window || {};
  return store;
}

installShims();

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

/* Fresh store module per scenario — module state is per-instance. */
let storeSeq = 0;
async function freshStore() {
  globalThis.localStorage.clear();
  storeSeq += 1;
  return import(`../js/core/store.js?case=${storeSeq}`);
}

const backup = await import("../js/services/backup.js");

console.log("Encrypted backup envelope");

await test("round-trips state through encrypt → decrypt", async () => {
  const data = { meals: [{ name: "paneer", kcal: 265 }], rewards: { coins: 1250 } };
  const envelope = await backup.encryptPayload(data, "correct horse battery");
  assert.equal(envelope.kdf, "PBKDF2-SHA256");
  assert.ok(envelope.ct.length > 0);
  assert.notEqual(envelope.ct, JSON.stringify(data));

  const restored = await backup.decryptPayload(envelope, "correct horse battery");
  assert.deepEqual(restored, data);
});

await test("rejects a wrong passphrase instead of returning garbage", async () => {
  const envelope = await backup.encryptPayload({ secret: 42 }, "right-passphrase");
  await assert.rejects(
    () => backup.decryptPayload(envelope, "wrong-passphrase"),
    (error) => error.wrongPassphrase === true
  );
});

await test("detects tampered ciphertext (AES-GCM auth tag)", async () => {
  const envelope = await backup.encryptPayload({ weight: 82.5 }, "passphrase-1234");
  const bytes = Buffer.from(envelope.ct, "base64");
  bytes[Math.floor(bytes.length / 2)] ^= 0xff;
  await assert.rejects(() => backup.decryptPayload({ ...envelope, ct: bytes.toString("base64") }, "passphrase-1234"));
});

await test("uses a unique salt and IV per backup", async () => {
  const a = await backup.encryptPayload({ x: 1 }, "same-passphrase");
  const b = await backup.encryptPayload({ x: 1 }, "same-passphrase");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ct, b.ct);
});

console.log("Backup payload shaping");

await test("keeps photos when the payload is small", () => {
  const state = { photoEntries: [{ id: "p1", image: "data:image/jpeg;base64,AAAA" }] };
  const payload = backup.buildBackupPayload(state, { includePhotos: true });
  assert.equal(payload.photosIncluded, true);
  assert.equal(payload.data.photoEntries[0].image, "data:image/jpeg;base64,AAAA");
});

await test("drops photo images when the payload would exceed the document limit", () => {
  const bigImage = `data:image/jpeg;base64,${"A".repeat(500000)}`;
  const state = {
    photoEntries: [
      { id: "p1", date: "2026-08-01", image: bigImage },
      { id: "p2", date: "2026-08-02", image: bigImage },
    ],
  };
  const payload = backup.buildBackupPayload(state, { includePhotos: true });
  assert.equal(payload.photosIncluded, false, "photos should be stripped");
  assert.equal(payload.data.photoEntries[0].image, null);
  assert.equal(payload.data.photoEntries[0].imageOmitted, true);
  assert.equal(payload.data.photoEntries[0].date, "2026-08-01", "photo metadata is preserved");
  assert.equal(payload.data.photoEntries.length, 2);
  assert.ok(!payload.tooLarge, "payload fits after stripping");
});

await test("never mutates the caller's state", () => {
  const state = { photoEntries: [{ id: "p1", image: "keep-me" }] };
  backup.buildBackupPayload(state, { includePhotos: false });
  assert.equal(state.photoEntries[0].image, "keep-me");
});

console.log("Google account linking + migration");

await test("links a local profile with the same email, keeping its data", async () => {
  const store = await freshStore();
  const local = store.createOfflineProfile("Satvik", "athlete@example.com");
  store.authStore.userStates[local.id].mealsByDate = { "2026-08-01": [{ id: "m1", kcal: 500 }] };

  const { user, migration } = store.resolveGoogleAccount({
    uid: "google-uid-1",
    email: "athlete@example.com",
    name: "Satvik Pandey",
    photoUrl: "https://example.com/p.jpg",
  });

  assert.equal(migration, "linked-by-email");
  assert.equal(user.id, local.id, "same profile record is reused");
  assert.equal(user.googleUid, "google-uid-1");
  assert.equal(user.photoUrl, "https://example.com/p.jpg");
  assert.equal(store.authStore.userStates[user.id].mealsByDate["2026-08-01"].length, 1, "meals survived");
});

await test("adopts the active local profile when the Google email differs", async () => {
  const store = await freshStore();
  const local = store.createOfflineProfile("Satvik", "old.name@device.local");
  store.authStore.userStates[local.id].weightEntries = [{ id: "w1", date: "2026-08-01", weight: 82.5 }];
  store.authStore.userStates[local.id].rewards = { coins: 900, byDate: {}, ledger: [], streakKeys: {} };
  store.authStore.activeUserId = local.id;

  const { user, migration } = store.resolveGoogleAccount({
    uid: "google-uid-2",
    email: "satvik@gmail.com",
    name: "Satvik",
  });

  assert.equal(migration, "adopted-local");
  assert.equal(user.id, local.id);
  assert.equal(user.email, "satvik@gmail.com");
  assert.ok(user.previousEmails.includes("old.name@device.local"), "old email retained for traceability");
  assert.equal(store.authStore.userStates[user.id].weightEntries.length, 1, "weight history survived");
  assert.equal(store.authStore.userStates[user.id].rewards.coins, 900, "Dad Coins survived");
});

await test("reuses the same profile on a second sign-in", async () => {
  const store = await freshStore();
  const first = store.resolveGoogleAccount({ uid: "google-uid-3", email: "a@gmail.com", name: "A" });
  store.authStore.userStates[first.user.id].mealsByDate = { "2026-08-01": [{ id: "m1" }] };

  const second = store.resolveGoogleAccount({ uid: "google-uid-3", email: "a@gmail.com", name: "A" });
  assert.equal(second.migration, "existing-account");
  assert.equal(second.user.id, first.user.id);
  assert.equal(store.authStore.userStates[second.user.id].mealsByDate["2026-08-01"].length, 1);
});

await test("starts a clean profile when there is nothing to adopt", async () => {
  const store = await freshStore();
  const { user, migration } = store.resolveGoogleAccount({
    uid: "google-uid-4",
    email: "brand.new@gmail.com",
    name: "Brand New",
  });
  assert.equal(migration, "new-account");
  assert.ok(store.authStore.userStates[user.id], "state initialised");
  assert.equal(Object.keys(store.authStore.userStates[user.id].mealsByDate).length, 0);
});

await test("does not adopt an empty profile", async () => {
  const store = await freshStore();
  store.createOfflineProfile("Empty", "empty@device.local");

  const { migration } = store.resolveGoogleAccount({ uid: "google-uid-5", email: "someone@gmail.com", name: "Someone" });
  assert.equal(migration, "new-account", "empty profiles are left alone");
});

await test("does not adopt a profile already linked to another Google account", async () => {
  const store = await freshStore();
  const first = store.resolveGoogleAccount({ uid: "uid-A", email: "a@gmail.com", name: "A" });
  store.authStore.userStates[first.user.id].weightEntries = [{ id: "w1", date: "2026-08-01", weight: 80 }];
  store.authStore.activeUserId = first.user.id;

  const second = store.resolveGoogleAccount({ uid: "uid-B", email: "b@gmail.com", name: "B" });
  assert.equal(second.migration, "new-account");
  assert.notEqual(second.user.id, first.user.id, "the other account keeps its own data");
  assert.equal(store.authStore.userStates[first.user.id].weightEntries.length, 1);
});

await test("marks offline profiles as offline", async () => {
  const store = await freshStore();
  const user = store.createOfflineProfile("Solo", "solo@device.local");
  assert.equal(user.provider, "offline");
  assert.equal(user.googleUid, undefined);
});

if (process.exitCode) {
  console.error("\nAuth/backup tests FAILED.");
} else {
  console.log(`\nAll ${passed} auth/backup tests passed.`);
}
