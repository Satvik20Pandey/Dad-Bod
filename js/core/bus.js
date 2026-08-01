/* Dad Bod — tiny render bus: features request app-wide re-renders without
 * importing the composition root (avoids circular module graphs). */

let renderer = null;
let screenSwitcher = null;

export function setRenderer(fn) {
  renderer = fn;
}

export function renderApp() {
  if (typeof renderer === "function") renderer();
}

export function setScreenSwitcher(fn) {
  screenSwitcher = fn;
}

export function goToScreen(name) {
  if (typeof screenSwitcher === "function") screenSwitcher(name);
}
