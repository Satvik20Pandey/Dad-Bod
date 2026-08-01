/* Dad Bod — Overpass / OpenStreetMap: gyms, fitness centres, and parks near the
 * user, with automatic mirror failover. */

import { API } from "../config.js";
import { fetchWithTimeout, readCache, writeCache, isOnline } from "./http.js";
import { haversineKm } from "../utils.js";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

function buildQuery(lat, lon, radiusM) {
  return `[out:json][timeout:20];(
  node["leisure"="fitness_centre"](around:${radiusM},${lat},${lon});
  way["leisure"="fitness_centre"](around:${radiusM},${lat},${lon});
  node["leisure"="sports_centre"]["sport"~"fitness|gym|multi",i](around:${radiusM},${lat},${lon});
  way["leisure"="sports_centre"]["sport"~"fitness|gym|multi",i](around:${radiusM},${lat},${lon});
  node["leisure"="park"](around:${radiusM},${lat},${lon});
  way["leisure"="park"](around:${radiusM},${lat},${lon});
);out center 60;`;
}

function classifyElement(tags) {
  const leisure = String(tags?.leisure || "");
  if (leisure === "park") return "park";
  return "gym";
}

export async function findNearby(lat, lon, radiusM = 4000) {
  if (!isOnline()) return { status: "offline", places: [] };

  const cacheKey = `overpass:${lat.toFixed(3)}:${lon.toFixed(3)}:${radiusM}`;
  const cached = readCache(cacheKey, CACHE_TTL_MS);
  if (cached) return cached;

  const query = buildQuery(lat, lon, radiusM);
  let payload = null;

  for (const endpoint of API.overpass.endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        timeoutMs: 20000,
      });
      if (!response.ok) continue;
      payload = await response.json();
      break;
    } catch (error) {
      console.warn("Overpass endpoint failed, trying mirror", error?.message || error);
    }
  }

  if (!payload) return { status: "error", places: [] };

  const seen = new Set();
  const places = (payload.elements || [])
    .map((element) => {
      const tags = element.tags || {};
      const plat = element.lat ?? element.center?.lat;
      const plon = element.lon ?? element.center?.lon;
      if (plat == null || plon == null) return null;

      const type = classifyElement(tags);
      const name = String(tags.name || (type === "park" ? "Park" : "Fitness Centre")).trim();
      const dedupeKey = `${name.toLowerCase()}:${plat.toFixed(4)}:${plon.toFixed(4)}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      return {
        id: `${element.type}-${element.id}`,
        name,
        type,
        lat: plat,
        lon: plon,
        distanceKm: haversineKm(lat, lon, plat, plon),
        address: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", "),
        opening: tags.opening_hours || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 30);

  const result = { status: "ok", places, source: "OpenStreetMap via Overpass API" };
  writeCache(cacheKey, result);
  return result;
}

export function mapsLinkFor(place) {
  return `geo:${place.lat},${place.lon}?q=${place.lat},${place.lon}(${encodeURIComponent(place.name)})`;
}

export function webMapsLinkFor(place) {
  return `https://www.google.com/maps/search/?api=1&query=${place.lat}%2C${place.lon}`;
}
