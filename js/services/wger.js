/* Dad Bod — wger open exercise database.
 *
 * The public /exercise/search endpoint was retired upstream, so this service
 * downloads the full English catalog once (paged /exerciseinfo), compacts it
 * to ~250 KB, caches it for 30 days, and searches client-side — which also
 * makes the library work offline after first load. */

import { API } from "../config.js";
import { fetchJson, isOnline, readCache, writeCache } from "./http.js";

const CATALOG_CACHE_KEY = "wger:catalog:v1";
const CATALOG_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ENGLISH = 2;

let catalogPromise = null;

function compactExercise(item) {
  const translation =
    (item.translations || []).find((t) => Number(t?.language) === ENGLISH) ||
    (item.translations || [])[0];
  if (!translation?.name) return null;

  const mainImage = (item.images || []).find((img) => img?.is_main) || (item.images || [])[0];

  const stripHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = String(html || "");
    return (div.textContent || "").replace(/\s+/g, " ").trim();
  };

  return {
    id: item.id,
    name: String(translation.name).trim(),
    category: String(item?.category?.name || ""),
    muscles: (item.muscles || []).map((m) => String(m?.name_en || m?.name || "")).filter(Boolean),
    musclesSecondary: (item.muscles_secondary || []).map((m) => String(m?.name_en || m?.name || "")).filter(Boolean),
    equipment: (item.equipment || []).map((e) => String(e?.name || "")).filter(Boolean),
    image: mainImage?.image || null,
    thumb: mainImage?.thumbnails?.small || mainImage?.image || null,
    description: stripHtml(translation.description).slice(0, 350),
  };
}

async function fetchCatalog() {
  const cached = readCache(CATALOG_CACHE_KEY, CATALOG_TTL_MS);
  if (Array.isArray(cached) && cached.length) return cached;

  if (!isOnline()) return [];

  const catalog = [];
  let url = `${API.wger.base}/exerciseinfo/?format=json&language=${ENGLISH}&limit=100`;
  let guard = 0;

  while (url && guard < 12) {
    guard += 1;
    const payload = await fetchJson(url, { timeoutMs: 15000 });
    (payload?.results || []).forEach((item) => {
      const compact = compactExercise(item);
      if (compact) catalog.push(compact);
    });
    url = payload?.next || null;
  }

  if (catalog.length) writeCache(CATALOG_CACHE_KEY, catalog);
  return catalog;
}

export function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetchCatalog().catch((error) => {
      console.warn("wger catalog load failed", error?.message || error);
      catalogPromise = null;
      return [];
    });
  }
  return catalogPromise;
}

export function isCatalogCached() {
  const cached = readCache(CATALOG_CACHE_KEY, CATALOG_TTL_MS);
  return Array.isArray(cached) && cached.length > 0;
}

export async function searchExercises(term) {
  const query = String(term || "").trim().toLowerCase();
  if (query.length < 2) return { results: [] };

  const catalog = await getCatalog();
  if (!catalog.length) {
    return { results: [], offline: !isOnline() };
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const scored = [];

  for (const exercise of catalog) {
    const name = exercise.name.toLowerCase();
    const haystack = `${name} ${exercise.category.toLowerCase()} ${exercise.muscles.join(" ").toLowerCase()}`;
    let score = 0;
    if (name === query) score += 100;
    else if (name.startsWith(query)) score += 60;
    else if (name.includes(query)) score += 40;
    const tokenHits = tokens.filter((token) => haystack.includes(token)).length;
    if (tokenHits === tokens.length) score += 20 + tokenHits * 4;
    if (score > 0) {
      if (exercise.image) score += 6;
      scored.push({ exercise, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.exercise.name.length - b.exercise.name.length);
  return {
    results: scored.slice(0, 24).map((entry) => entry.exercise),
    source: "wger.de open exercise database",
  };
}

export async function getExerciseDetail(id) {
  const catalog = await getCatalog();
  const found = catalog.find((exercise) => String(exercise.id) === String(id));
  if (!found) return null;
  return { ...found, source: "wger.de open exercise database" };
}
