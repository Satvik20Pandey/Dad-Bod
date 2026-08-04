/* Dad Bod — offline cache. Version bump invalidates all previous caches. */

const CACHE_NAME = "dad-bod-cache-v31";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/components.css",
  "./styles/screens.css",
  "./js/main.js",
  "./js/config.js",
  "./js/firebase-config.js",
  "./js/utils.js",
  "./js/core/bus.js",
  "./js/core/nutrition.js",
  "./js/core/program.js",
  "./js/core/dataset.js",
  "./js/core/resolver.js",
  "./js/core/store.js",
  "./js/core/profile.js",
  "./js/core/metrics.js",
  "./js/core/rewards.js",
  "./js/services/http.js",
  "./js/services/edamam.js",
  "./js/services/openfoodfacts.js",
  "./js/services/myplate.js",
  "./js/services/wger.js",
  "./js/services/overpass.js",
  "./js/services/firebase.js",
  "./js/services/backup.js",
  "./js/ui/icons.js",
  "./js/ui/components.js",
  "./js/ui/charts.js",
  "./js/features/onboarding.js",
  "./js/features/home.js",
  "./js/features/capture.js",
  "./js/features/diet.js",
  "./js/features/workout.js",
  "./js/features/progress.js",
  "./js/features/nearby.js",
  "./js/features/recipes.js",
  "./js/features/more.js",
  "./js/features/training-setup.js",
  "./js/features/account.js",
  "./assets/icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/splash-hero.svg",
  "./assets/hero-body.png",
  "./assets/food-dataset.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  /* Never cache API calls — the app layers its own TTL cache over them. */
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
