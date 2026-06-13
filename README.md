# Dad Bod - Built Dream Physique

A premium mobile-first fitness and nutrition tracker with structured workouts, AI-powered meal estimation, progress tracking, and optional photo analysis.

## Live Features

- Luxury dark UI with compact, professional layout
- Multi-user sign in and sign up flow (local storage based)
- AI meal estimation via OpenRouter (GPT-4o Mini recommended)
- Manual nutrient entry for users who know exact values
- Voice meal description capture with live preview
- 7-day structured workout split with timers and form cues
- Diet logging with full macro and micronutrient tracking
- Weight chart, progress photos, and daily workout completion
- PWA support (manifest + service worker)

## Optional Admin Bootstrap (Secure)

No admin credentials are hardcoded in source.

If you need an admin account bootstrap for local testing, configure runtime security values in browser local storage:

```js
localStorage.setItem(
	"dadbod_security_config_v1",
	JSON.stringify({
		adminEmail: "your-admin@gmail.com",
		adminPasskey: "your-strong-passkey",
		bootstrapApiKey: ""
	})
);
```

Then reload the app.

## Quick Start (Web)

```bash
git clone https://github.com/Satvik20Pandey/Dad-Bod.git
cd Dad-Bod
npm install
python -m http.server 8080
```

Open http://localhost:8080

## Build Mobile Artifacts

First-time setup (installs portable JDK 21 + Android SDK locally):

```powershell
npm run setup:android
. .\.android-env.ps1
```

Build signed release APK + AAB (copied to `release/`):

```powershell
npm run build:android
```

Outputs:
- `release/DadBod-v1.1.0-signed.apk`
- `release/DadBod-v1.1.0-signed.aab`
- `release/DadBod-latest-signed.apk` / `.aab`

Play Store upload checklist: see `release/PLAYSTORE_LISTING.txt`

Optional keystore password override (PKCS12 uses one password for store + key):

```powershell
$env:DADBOD_STORE_PASSWORD = "your-store-password"
npm run build:android
```

## Signed Artifacts In This Repo

Generated files are committed in `release/`:

- `release/DadBod-v1.1.0-signed.apk`
- `release/DadBod-v1.1.0-signed.aab`
- `release/DadBod-latest-signed.apk`
- `release/DadBod-latest-signed.aab`

## OpenRouter API Key Setup

Recommended model: **GPT-4o Mini** (`openai/gpt-4o-mini`) — best balance of accuracy and cost for nutrition estimation.

In the app:

1. Open More tab
2. Click `Get OpenRouter API Key`
3. Create/copy key from OpenRouter
4. Paste in `OpenRouter API Key` field, select model, and save

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
- `app.js` - Main app logic
- `styles.css` - Premium responsive UI
- `assets/icon.svg` - Improved DB brand logo
- `scripts/build-dist.js` - Dist sync helper for Capacitor
- `scripts/setup-android-sdk.ps1` - Local Android SDK setup helper
- `release/` - Signed APK and AAB

## Notes

- Android SDK is configured at `C:\Users\Admin\Android\Sdk` on this machine.
- Capacitor uses `dist/` as webDir (`capacitor.config.json`).
