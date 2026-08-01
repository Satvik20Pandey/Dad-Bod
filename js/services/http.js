/* Dad Bod — resilient HTTP layer: timeouts, in-flight dedupe, and a TTL response cache
 * so free-tier API quotas stretch further and repeated lookups work offline. */

import { API_CACHE_KEY } from "../config.js";

const inFlight = new Map();

function cacheStorageKey(key) {
  return `${API_CACHE_KEY}:${key}`;
}

export function readCache(key, ttlMs) {
  try {
    const raw = localStorage.getItem(cacheStorageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (ttlMs > 0 && Date.now() - Number(parsed.t || 0) > ttlMs) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

export function writeCache(key, value) {
  try {
    localStorage.setItem(cacheStorageKey(key), JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    /* Storage full — evict the oldest cached responses and retry once. */
    try {
      pruneCache(20);
      localStorage.setItem(cacheStorageKey(key), JSON.stringify({ t: Date.now(), v: value }));
    } catch {}
  }
}

export function pruneCache(keep = 60) {
  const entries = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(`${API_CACHE_KEY}:`)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      entries.push({ key, t: Number(parsed?.t || 0) });
    } catch {
      entries.push({ key, t: 0 });
    }
  }
  if (entries.length <= keep) return;
  entries
    .sort((a, b) => a.t - b.t)
    .slice(0, entries.length - keep)
    .forEach((entry) => localStorage.removeItem(entry.key));
}

export async function fetchWithTimeout(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 10000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(url, {
      method: options.method || "GET",
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* JSON fetch with optional TTL cache. Returns parsed JSON or throws. */
export async function fetchJson(url, options = {}) {
  const { cacheKey, cacheTtlMs = 0 } = options;

  if (cacheKey) {
    const cached = readCache(cacheKey, cacheTtlMs);
    if (cached != null) return cached;
  }

  const flightKey = cacheKey || `${options.method || "GET"}:${url}`;
  if (inFlight.has(flightKey)) return inFlight.get(flightKey);

  const promise = (async () => {
    const response = await fetchWithTimeout(url, options);
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    if (cacheKey) writeCache(cacheKey, data);
    return data;
  })();

  inFlight.set(flightKey, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(flightKey);
  }
}

export function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}
