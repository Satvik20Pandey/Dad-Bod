/* Dad Bod — wger open exercise database: search the global exercise library
 * with images and muscle data. Public API, cached aggressively. */

import { API } from "../config.js";
import { fetchJson, isOnline } from "./http.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function searchExercises(term) {
  const query = String(term || "").trim();
  if (query.length < 2) return { results: [] };
  if (!isOnline()) return { results: [], offline: true };

  try {
    const payload = await fetchJson(
      `${API.wger.base}/exercise/search/?language=english&format=json&term=${encodeURIComponent(query)}`,
      { timeoutMs: 9000, cacheKey: `wger:search:${query.toLowerCase()}`, cacheTtlMs: 30 * DAY_MS }
    );

    const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
    const results = suggestions.slice(0, 20).map((item) => ({
      id: item?.data?.base_id || item?.data?.id,
      name: String(item?.data?.name || item?.value || "Exercise"),
      category: String(item?.data?.category || ""),
      image: item?.data?.image
        ? item.data.image.startsWith("http") ? item.data.image : `${API.wger.site}${item.data.image}`
        : null,
      thumbnail: item?.data?.image_thumbnail
        ? item.data.image_thumbnail.startsWith("http") ? item.data.image_thumbnail : `${API.wger.site}${item.data.image_thumbnail}`
        : null,
    }));

    return { results, source: "wger.de exercise database" };
  } catch (error) {
    console.warn("wger search failed", error?.message || error);
    return { results: [], error: true };
  }
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = String(html || "");
  return (div.textContent || "").replace(/\s+/g, " ").trim();
}

export async function getExerciseDetail(baseId) {
  if (!baseId || !isOnline()) return null;
  try {
    const payload = await fetchJson(`${API.wger.base}/exercisebaseinfo/${baseId}/?format=json`, {
      timeoutMs: 9000,
      cacheKey: `wger:base:${baseId}`,
      cacheTtlMs: 30 * DAY_MS,
    });

    const english = (payload?.exercises || []).find((entry) => Number(entry?.language) === 2)
      || (payload?.exercises || [])[0];

    return {
      id: baseId,
      name: String(english?.name || "Exercise"),
      description: stripHtml(english?.description || ""),
      muscles: (payload?.muscles || []).map((m) => String(m?.name_en || m?.name || "")).filter(Boolean),
      musclesSecondary: (payload?.muscles_secondary || []).map((m) => String(m?.name_en || m?.name || "")).filter(Boolean),
      equipment: (payload?.equipment || []).map((e) => String(e?.name || "")).filter(Boolean),
      images: (payload?.images || [])
        .map((img) => (img?.image?.startsWith("http") ? img.image : img?.image ? `${API.wger.site}${img.image}` : null))
        .filter(Boolean),
      source: "wger.de exercise database",
    };
  } catch (error) {
    console.warn("wger detail failed", error?.message || error);
    return null;
  }
}
