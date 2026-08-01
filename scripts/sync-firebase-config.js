#!/usr/bin/env node
/* Dad Bod — generate js/firebase-config.js from android/app/google-services.json.
 *
 * The Android config file is the single source of truth (and is gitignored with
 * the rest of android/). This script mirrors the few values the web layer needs
 * into a committed module so the app and the Firebase project can never drift.
 *
 * Firebase client API keys are public identifiers, not secrets — access is
 * controlled by Firebase Security Rules, so committing them is expected.
 *
 * Run: npm run sync:firebase
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "android", "app", "google-services.json");
const outputPath = path.join(root, "js", "firebase-config.js");

function fail(message) {
  console.error(`sync-firebase-config: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
  fail(
    "android/app/google-services.json not found.\n" +
      "  Download it from Firebase Console → Project settings → Your apps → Android."
  );
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
} catch (error) {
  fail(`could not parse google-services.json (${error.message})`);
}

const projectId = payload?.project_info?.project_id;
const projectNumber = payload?.project_info?.project_number;
const storageBucket = payload?.project_info?.storage_bucket || null;

const client = (payload.client || []).find(
  (entry) => entry?.client_info?.android_client_info?.package_name === "com.dadbod.app"
);

if (!projectId || !client) {
  fail("google-services.json has no client for package com.dadbod.app");
}

const apiKey = client?.api_key?.[0]?.current_key || null;
const oauthClients = client.oauth_client || [];
const webClient = oauthClients.find((entry) => Number(entry.client_type) === 3);
const androidClients = oauthClients.filter((entry) => Number(entry.client_type) === 1);

if (!apiKey) fail("no api_key found in google-services.json");
if (!webClient?.client_id) {
  fail(
    "no web OAuth client (client_type 3) found.\n" +
      "  Enable Authentication → Sign-in method → Google in the Firebase Console,\n" +
      "  then re-download google-services.json."
  );
}

const banner = `/* GENERATED FILE — do not edit by hand.
 * Source: android/app/google-services.json
 * Regenerate: npm run sync:firebase
 *
 * These are public Firebase client identifiers, not secrets. Access to data is
 * governed by Firebase Security Rules (see docs/FIREBASE.md).
 */`;

const contents = `${banner}

export const FIREBASE_CONFIG = {
  projectId: ${JSON.stringify(projectId)},
  apiKey: ${JSON.stringify(apiKey)},
  authDomain: ${JSON.stringify(`${projectId}.firebaseapp.com`)},
  storageBucket: ${JSON.stringify(storageBucket)},
  messagingSenderId: ${JSON.stringify(String(projectNumber || ""))},

  /* OAuth web client — used as the serverClientId for native Google sign-in. */
  webClientId: ${JSON.stringify(webClient.client_id)},

  /* Set once a Web app is registered in the Firebase Console. Browser sign-in
   * stays disabled (with a clear message) until this is present; the Android
   * app does not need it. */
  webAppId: ${JSON.stringify(process.env.DADBOD_FIREBASE_WEB_APP_ID || null)},
};

/* Firestore REST endpoint used by the encrypted backup service. */
export const FIRESTORE_BASE = ${JSON.stringify(
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
)};
`;

fs.writeFileSync(outputPath, contents, "utf8");

console.log(`Wrote js/firebase-config.js for project "${projectId}".`);
console.log(`  web OAuth client : ${webClient.client_id}`);
console.log(
  `  android clients  : ${
    androidClients.length
      ? androidClients.map((entry) => entry.android_info?.certificate_hash).join(", ")
      : "NONE — see warning below"
  }`
);

if (!androidClients.length) {
  console.warn(
    "\n  WARNING: google-services.json contains no Android OAuth client (client_type 1).\n" +
      "  This happens when the file was downloaded BEFORE the release SHA-1 was added.\n" +
      "  Native Google sign-in will fail with error code 10 (DEVELOPER_ERROR).\n" +
      "  Fix: Firebase Console → Project settings → Your apps → Android → download\n" +
      "  google-services.json again, replace android/app/google-services.json, and\n" +
      "  re-run: npm run sync:firebase\n"
  );
}
