/* Dad Bod — Nearby: gyms, fitness centres, and parks around the user,
 * powered by OpenStreetMap via the Overpass API. */

import { setHtml, setText, select, escapeHtml, formatNum } from "../utils.js";
import { getCurrentPosition, findNearby, webMapsLinkFor } from "../services/overpass.js";
import { icon } from "../ui/icons.js";
import { emptyState, skeletonCards, haptic, HAPTIC } from "../ui/components.js";

let loading = false;

export function initNearby() {
  select("nearbyRefreshBtn")?.addEventListener("click", () => loadNearby(true));
  document.addEventListener("layeropen", (event) => {
    if (event.detail?.id !== "nearbySheet") return;
    const sheet = select("nearbySheet");
    if (sheet && !sheet.dataset.loaded) {
      sheet.dataset.loaded = "1";
      loadNearby(false);
    }
  });
  select("nearbyList")?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-maps-url]");
    if (!row) return;
    haptic(HAPTIC.tap);
    window.open(row.getAttribute("data-maps-url"), "_blank");
  });
}

export async function loadNearby(force) {
  if (loading) return;
  loading = true;

  const list = select("nearbyList");
  setText("nearbyStatus", "Finding your location…");
  if (list) list.innerHTML = skeletonCards(4);

  try {
    const position = await getCurrentPosition();
    setText("nearbyStatus", "Searching gyms and parks within 4 km…");

    const result = await findNearby(position.lat, position.lon, 4000);

    if (result.status === "offline") {
      setText("nearbyStatus", "You're offline.");
      if (list) list.innerHTML = emptyState("mapPin", "No connection", "Nearby search needs internet.");
      return;
    }

    if (result.status !== "ok" || !result.places.length) {
      setText("nearbyStatus", "");
      if (list) {
        list.innerHTML = emptyState(
          "mapPin",
          "Nothing found nearby",
          "No mapped gyms or parks within 4 km. OpenStreetMap coverage varies by area."
        );
      }
      return;
    }

    const gyms = result.places.filter((place) => place.type === "gym");
    const parks = result.places.filter((place) => place.type === "park");
    setText("nearbyStatus", `${gyms.length} gyms · ${parks.length} parks · ${escapeHtml(result.source)}`);

    if (list) {
      list.innerHTML = result.places
        .map(
          (place) => `
          <button type="button" class="nearby-row" data-maps-url="${webMapsLinkFor(place)}">
            <span class="nearby-icon ${place.type}">${icon(place.type === "park" ? "activity" : "dumbbell", "", 18)}</span>
            <span class="nearby-body">
              <span class="nearby-name">${escapeHtml(place.name)}</span>
              <span class="nearby-meta">${place.type === "park" ? "Park · outdoor workout" : "Gym / fitness centre"}${place.address ? ` · ${escapeHtml(place.address)}` : ""}</span>
            </span>
            <span class="nearby-distance">${place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)} m` : `${formatNum(place.distanceKm, 1)} km`}</span>
          </button>`
        )
        .join("");
    }
  } catch (error) {
    const denied = error?.code === 1;
    setText("nearbyStatus", "");
    if (list) {
      list.innerHTML = emptyState(
        "mapPin",
        denied ? "Location permission needed" : "Couldn't get your location",
        denied ? "Allow location access to find gyms and parks around you." : "Check GPS and try again."
      );
    }
  } finally {
    loading = false;
  }
}
