# Firebase setup — Dad Bod

Project: **dadbod-2026** · Package: **com.dadbod.app**

Dad Bod uses Firebase for exactly two things: **Google Sign-In** and storing an
**opaque encrypted backup blob**. No analytics, no Crashlytics, no ad IDs, and
no readable user data ever leaves the device.

---

## 1. Files and how they connect

| File | Role | Committed? |
| --- | --- | --- |
| `android/app/google-services.json` | Source of truth, from Firebase Console | No (`android/` is gitignored) |
| `js/firebase-config.js` | Generated mirror the web layer reads | Yes |
| `capacitor.config.json` | Declares the `FirebaseAuthentication` provider list | Yes |
| `android/variables.gradle` | `rgcfaIncludeGoogle = true` | Yes |

Regenerate the mirror any time you replace `google-services.json`:

```bash
npm run sync:firebase
```

`npm run build:dist` runs this automatically, so a release build can never ship
a stale config.

> Firebase client API keys are **public identifiers**, not secrets. Security is
> enforced by Firestore rules, not by hiding the key.

---

## 2. Required console setup

1. **Authentication → Sign-in method → Google** — enabled.
2. **Project settings → Your apps → Android → SHA certificate fingerprints** —
   add every key that will ever sign the app:

   | Key | SHA-1 | When |
   | --- | --- | --- |
   | Release (upload) | `84:B0:04:E6:66:F8:8E:6D:79:44:52:78:11:F6:6D:4D:EC:77:A4:3A` | Now |
   | Play App Signing | `B3:34:CD:C3:90:68:CE:86:25:A0:2B:2A:16:B6:CF:85:15:31:25:32` | Registered |
   | Debug | from `~/.android/debug.keystore` | Only if you run debug builds |

   **Re-download `google-services.json` after adding any fingerprint**, replace
   the file, and run `npm run sync:firebase`.

   `npm run sync:firebase` prints a warning if the file contains no Android
   OAuth client (`client_type` 1), which is the usual sign the fingerprint was
   added after the file was downloaded.

### Why Play App Signing matters

Google Play re-signs your app with its own key. Sign-in will work on your
side-loaded APK and fail for everyone who installs from the Play Store with
**error code 10** until the Play app-signing SHA-1 is registered too.

---

## 3. Cloud backup (optional)

Backup is inert until Firestore exists. The app degrades with a clear message
rather than failing silently, so you can ship without it.

1. **Firestore Database → Create database → Production mode.**
2. Publish these rules — a signed-in user can only ever touch their own
   document, and everything else is denied:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /backups/{uid} {
      allow read, write, delete: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### How the encryption works

```
passphrase ──PBKDF2-SHA256 (210k iters, random 16-byte salt)──▶ AES-GCM-256 key
state JSON ──AES-GCM encrypt (random 12-byte IV)──▶ ciphertext
{ v, kdf, iterations, salt, iv, ct }  ──Firestore REST──▶  backups/{uid}
```

- The passphrase is **never stored or transmitted** — it lives in memory for the
  session only. Persisting it would defeat the purpose.
- A wrong passphrase fails the AES-GCM authentication tag, so the app reports
  "wrong passphrase" instead of returning corrupt data.
- **Forgotten passphrase = unrecoverable backup.** That is by design.
- Progress photos are base64 and dominate the payload. If the document would
  exceed Firestore's 1 MiB limit, photo *images* are dropped (metadata kept) and
  the user is told. Photos always remain on the device; use Export for a full
  local archive.
- Restore **merges** rather than overwrites, and never clears local photos.

---

## 4. Verifying on a real device

```powershell
npm run build:android
# install release/DadBod-v1.0.0-signed.apk
```

Expected: tapping **Continue with Google** opens the native account sheet, and
the home avatar becomes your Google profile photo.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Error 10 / DEVELOPER_ERROR | SHA-1 not registered, or stale `google-services.json` | Add SHA-1, re-download, `npm run sync:firebase`, rebuild |
| Sheet opens then closes instantly | Google provider disabled | Enable it in Authentication |
| Works side-loaded, fails from Play | Play App Signing key missing | Add the Play SHA-1 |
| Backup: "Firestore isn't enabled" | No database | Create it (production mode) |
| Backup: "rules rejected" | Default deny-all rules | Publish the rules above |

Sign-in requires a real device or an emulator **with Google Play Services** —
it cannot be exercised in the headless Playwright suite, which covers the
offline path and the account UI instead.
