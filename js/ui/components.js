/* Dad Bod — interactive UI primitives: toasts, haptics, sheets, rings,
 * count-up numbers, skeletons, and the celebration overlay. */

import { select } from "../utils.js";
import { icon } from "./icons.js";

/* ---- Haptics ---- */

export function haptic(pattern = 12) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}

export const HAPTIC = {
  tap: 10,
  success: [14, 60, 20],
  warn: [30, 40, 30],
  timerDone: [60, 80, 60, 80, 120],
};

/* ---- Toast ---- */

let toastTimer = null;

export function showToast(msg, type = "") {
  const t = select("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show" + (type ? " " + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.className = "toast";
  }, 2600);
}

/* ---- Sheets & modals ----
 * Any element with class "sheet" (bottom drawer) or "modal" (centered) and an
 * inner ".sheet-panel"/".modal-panel". Backdrop + Escape close them. */

const openLayers = [];

export function openLayer(id) {
  const layer = select(id);
  if (!layer) return;
  layer.classList.remove("hidden");
  requestAnimationFrame(() => layer.classList.add("open"));
  layer.setAttribute("aria-hidden", "false");
  document.body.classList.add("layer-open");
  if (!openLayers.includes(id)) openLayers.push(id);
  document.dispatchEvent(new CustomEvent("layeropen", { detail: { id } }));
  haptic(HAPTIC.tap);
}

export function closeLayer(id) {
  const layer = select(id);
  if (!layer) return;
  layer.classList.remove("open");
  layer.setAttribute("aria-hidden", "true");
  const idx = openLayers.indexOf(id);
  if (idx >= 0) openLayers.splice(idx, 1);
  if (!openLayers.length) document.body.classList.remove("layer-open");
  setTimeout(() => {
    if (!layer.classList.contains("open")) layer.classList.add("hidden");
  }, 280);
}

export function closeTopLayer() {
  const top = openLayers[openLayers.length - 1];
  if (top) closeLayer(top);
}

export function closeAllLayers() {
  [...openLayers].forEach((id) => closeLayer(id));
}

export function bindLayerDismissal() {
  document.addEventListener("click", (event) => {
    const backdrop = event.target.closest?.("[data-close-layer]");
    if (backdrop) {
      closeLayer(backdrop.getAttribute("data-close-layer"));
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeTopLayer();
  });
}

/* ---- Progress rings ---- */

export function ringMarkup({ size = 140, stroke = 10, cls = "", id = "" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `
    <svg class="ring ${cls}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" />
      <circle class="ring-fill" ${id ? `id="${id}"` : ""} cx="${size / 2}" cy="${size / 2}" r="${r}"
        stroke-width="${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c}"
        transform="rotate(-90 ${size / 2} ${size / 2})" />
    </svg>`;
}

export function setRingProgress(circleEl, pct, overClass = "over") {
  if (!circleEl) return;
  const r = Number(circleEl.getAttribute("r"));
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, Number(pct) || 0));
  circleEl.style.strokeDasharray = String(c);
  circleEl.style.strokeDashoffset = String(c * (1 - clamped));
  circleEl.classList.toggle(overClass, Number(pct) > 1);
}

/* ---- Count-up numbers ---- */

const countState = new WeakMap();

export function animateNumber(el, target, { digits = 0, ms = 650, suffix = "" } = {}) {
  if (!el) return;
  const to = Number(target) || 0;
  const from = countState.get(el) ?? 0;
  countState.set(el, to);

  if (Math.abs(to - from) < 0.5 || ms <= 0) {
    el.textContent = to.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) + suffix;
    return;
  }

  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = from + (to - from) * eased;
    el.textContent = value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---- Skeletons ---- */

export function skeletonLines(count = 3, cls = "") {
  return Array.from({ length: count })
    .map(() => `<div class="skeleton ${cls}"></div>`)
    .join("");
}

export function skeletonCards(count = 3) {
  return Array.from({ length: count })
    .map(() => `<div class="skeleton-card"><div class="skeleton" style="width:52%"></div><div class="skeleton" style="width:78%"></div></div>`)
    .join("");
}

/* ---- Confetti + celebration ---- */

export function fireConfetti(durationMs = 1800) {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ["#00E5FF", "#00D084", "#FF4D6D", "#F6C453", "#5DA9FF", "#ffffff"];
  const particles = Array.from({ length: 130 }).map(() => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight * 0.4,
    w: 5 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    vy: 2.2 + Math.random() * 3.4,
    vx: -1.6 + Math.random() * 3.2,
    rot: Math.random() * Math.PI,
    vr: -0.12 + Math.random() * 0.24,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const startedAt = performance.now();
  const tick = (now) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - (now - startedAt) / durationMs);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (now - startedAt < durationMs) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(tick);
}

export function celebrate({ title, subtitle = "", statLine = "" }) {
  let overlay = select("celebrationOverlay");
  if (!overlay) return;
  overlay.querySelector(".celebrate-title").textContent = title;
  overlay.querySelector(".celebrate-sub").textContent = subtitle;
  overlay.querySelector(".celebrate-stat").textContent = statLine;
  overlay.classList.remove("hidden");
  requestAnimationFrame(() => overlay.classList.add("open"));
  haptic(HAPTIC.success);
  fireConfetti(2200);
}

export function dismissCelebration() {
  const overlay = select("celebrationOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  setTimeout(() => overlay.classList.add("hidden"), 320);
}

/* ---- Segmented control ---- */

export function bindSegmented(containerId, onChange) {
  const container = select(containerId);
  if (!container) return;
  container.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-seg]");
    if (!btn) return;
    container.querySelectorAll("[data-seg]").forEach((el) => el.classList.toggle("active", el === btn));
    haptic(HAPTIC.tap);
    onChange(btn.getAttribute("data-seg"));
  });
}

export function emptyState(iconName, title, sub = "") {
  return `
    <div class="empty-state">
      ${icon(iconName, "empty-icon", 30)}
      <p class="empty-title">${title}</p>
      ${sub ? `<p class="empty-sub">${sub}</p>` : ""}
    </div>`;
}
