# Dad Bod - Built Dream Physique

A premium mobile-first fitness and nutrition tracker with room-only workouts, meal logging, progress tracking, and optional AI features.

## Live Features

- Multi-user sign in and sign up flow (local storage based)
- Admin preset account with default profile and weekly diet plan
- 7-day room-only no-equipment workout split
- Exercise GIF guides with Tenor API fallback handling
- Diet logging with full nutrient tracking (macros + fats + vitamins + minerals)
- Voice-based meal description capture with improved estimation
- Verified Google sign-in flow with one-time code step
- Weight chart, progress photos, and daily workout completion
- Optional OpenRouter AI features with in-app API key shortcut
- PWA support (manifest + service worker)

## Admin Account

- Email: satvikofficial20@gmail.com
- Password: Satvik123

## Quick Start (Web)

```bash
git clone https://github.com/Satvik20Pandey/Dad-Bod.git
cd Dad-Bod
npm install
python -m http.server 8080
```

Open http://localhost:8080

## Build Mobile Artifacts

```bash
npm run build:dist
npm run sync
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

## Signed Artifacts In This Repo

Generated files are committed in `release/`:

- `release/DadBod-latest-signed.apk`
- `release/DadBod-latest-signed.aab`
- `release/DadBod-v1.0.2-signed.apk`
- `release/DadBod-v1.0.2-signed.aab`
- `release/DadBod-v1.0.1-signed.apk`
- `release/DadBod-v1.0.1-signed.aab`

## OpenRouter API Key Setup

In the app:

1. Open Settings tab
2. Click `Get Free API Key`
3. Create/copy key from OpenRouter
4. Paste in `OpenRouter API Key` field and save

Core app features work even without an API key.

## Deployment

### Vercel (recommended)

This repo includes `vercel.json` for static deployment.

1. Import this GitHub repo in Vercel dashboard
2. Deploy the `main` branch
3. Redeploy after each push

If using CLI, login first:

```bash
npx vercel login
npx vercel --prod
```

## Project Structure

- `index.html` - App shell and tabs
- `app-new.js` - Main app logic
- `styles.css` - Premium responsive UI
- `assets/icon.svg` - Improved DB brand logo
- `scripts/build-dist.js` - Dist sync helper for Capacitor
- `scripts/setup-android-sdk.ps1` - Local Android SDK setup helper
- `release/` - Signed APK and AAB

## Notes

- Android SDK is configured at `C:\Users\Admin\Android\Sdk` on this machine.
- Capacitor uses `dist/` as webDir (`capacitor.config.json`).
