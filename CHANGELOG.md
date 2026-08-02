# Changelog

All notable changes to Dad Bod.

## [1.0.0] — 2026-08-02 · Public Play Store launch

- Home: cleaner date line (`Sunday, 02 Aug`); removed score hint copy.
- Train: inline exercise guides (GIF + prescription + form cues) with sets pill;
  load / reps / rest kept; less hero clutter.
- Toasts: white text on dark surface for readable save confirmations.
- Custom Training Setup, HQ spacing, solid-red destructive actions, and premium
  home polish from the 1.0 UI pass.

### Product

- **Home — Daily Mission**: animated Dad Physique Score, contextual hero action,
  Dad Coins + streak chips, calorie + burn rings, and a bento grid.
- **Diet**: 5,277-food Indian dataset (offline), Edamam parsing, barcode + label
  OCR, macros + micronutrients, weekly meal plan.
- **Scan**: fullscreen scanner with BarcodeDetector → ZXing → manual fallback;
  Open Food Facts → UPCItemDB → estimate.
- **Train**: weekly splits with inline form guides/GIFs, load/rep logging, rest
  timer, cardio + abs, 700+ exercise library, customizable plan in HQ.
- **Progress**: weight trends, photo compare, consistency heatmap, strength PRs.
- **Dad Bod HQ**: account, rewards, goals, Training Setup, nearby, recipes,
  encrypted backup, Help / Privacy / Terms.
- **Dad Coins**: earned by completing missions — never by opening the app.

### Accounts & privacy

- Optional Google Sign-In or Continue Offline.
- End-to-end encrypted cloud backup (AES-GCM-256). See `docs/FIREBASE.md`.

### Architecture

- Zero-framework PWA (ES modules: core / services / ui / features) wrapped with
  Capacitor for Android. Offline-first food dataset + cached API clients.
