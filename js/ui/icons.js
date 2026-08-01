/* Dad Bod — inline icon set (Lucide-style strokes, no external font/CDN). */

const PATHS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  utensils: '<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M16 3c-1.5 1.5-2 4-2 6 0 2 .5 3 2 3v9"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  trending: '<path d="M3 17l6-6 4 4 7-7M14 8h6v6"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  flame: '<path d="M12 3c2 4 4.5 6 4.5 9.5a4.5 4.5 0 1 1-9 0C7.5 9 10 7 12 3z"/><path d="M12 13c.8 1.2 1.4 2 1.4 3.1a1.9 1.9 0 1 1-3.8 0c0-1.1.9-2 2.4-3.1z"/>',
  droplet: '<path d="M12 3.5c3 3.8 6 6.9 6 10.3a6 6 0 1 1-12 0c0-3.4 3-6.5 6-10.3z"/>',
  footprints: '<path d="M7 5.5c1.4 0 2.5 1.8 2.5 3.6 0 1.3-.6 1.9-.6 3.1H5.1c0-1.2-.6-1.8-.6-3.1C4.5 7.3 5.6 5.5 7 5.5zM5.3 14.2h3.4v1.3a1.7 1.7 0 0 1-3.4 0z"/><path d="M17 10.5c-1.4 0-2.5 1.8-2.5 3.6 0 1.3.6 1.9.6 3.1h3.8c0-1.2.6-1.8.6-3.1 0-1.8-1.1-3.6-2.5-3.6zM15.3 19.2h3.4v1.3a1.7 1.7 0 0 1-3.4 0z"/>',
  moon: '<path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z"/>',
  scale: '<path d="M12 3v3M7 21h10M12 6a7 7 0 0 1 7 7v5H5v-5a7 7 0 0 1 7-7z"/><path d="M12 11v2"/>',
  camera: '<path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  mic: '<path d="M12 14.5a3 3 0 0 0 3-3v-5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"/><path d="M19 11.5a7 7 0 0 1-14 0M12 18.5V21"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h1.5M11 12h2M16 12h1"/><path d="M7 8.5h10M7 15.5h10" opacity="0.45"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.8-3.8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.8l2.4 1.4M9.5 3h5"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  chevronRight: '<path d="m9 5.5 6.5 6.5L9 18.5"/>',
  chevronDown: '<path d="m5.5 9 6.5 6.5L18.5 9"/>',
  chevronLeft: '<path d="M15 5.5 8.5 12l6.5 6.5"/>',
  mapPin: '<path d="M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.4"/>',
  chef: '<path d="M8 21h8M8.5 17.5h7M6.8 8.2A3.3 3.3 0 0 1 7 1.7a3.3 3.3 0 0 1 5-1.2 3.3 3.3 0 0 1 5 1.2 3.3 3.3 0 0 1 .2 6.5V14H6.8z" transform="translate(0 3)"/>',
  heart: '<path d="M12 20s-7.5-4.7-7.5-10A4.4 4.4 0 0 1 12 7.3 4.4 4.4 0 0 1 19.5 10c0 5.3-7.5 10-7.5 10z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/>',
  zap: '<path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M16 3v4M8 3v4M3.5 10.5h17"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4 19h16"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 19h16"/>',
  trash: '<path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5"/>',
  pencil: '<path d="m4 20 .8-3.4L15.5 6a2.1 2.1 0 0 1 3 3L7.8 19.6z"/>',
  logout: '<path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M15.5 16.5 20 12l-4.5-4.5M20 12H9.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.6v.2"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6z"/>',
  fileText: '<path d="M13.5 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8.5z"/><path d="M13.5 3v5.5H19M8.5 12.5h7M8.5 16h7"/>',
  star: '<path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16l-4.6 2.5.9-5.2-3.8-3.7 5.2-.7z"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.6M12 18.9v2.6M4.3 6.9l2.2 1.3M17.5 15.8l2.2 1.3M2.5 12h2.6M18.9 12h2.6M4.3 17.1l2.2-1.3M17.5 8.2l2.2-1.3"/>',
  sparkles: '<path d="M12 4.5 13.6 9 18 10.5 13.6 12 12 16.5 10.4 12 6 10.5 10.4 9z"/><path d="M19 15.5 19.7 17.5 21.5 18.2 19.7 18.9 19 21 18.3 18.9 16.5 18.2 18.3 17.5z"/><path d="M5 3.5 5.6 5.2 7.2 5.8 5.6 6.4 5 8 4.4 6.4 2.8 5.8 4.4 5.2z"/>',
  bookOpen: '<path d="M12 6.5c-1.7-1.7-4.2-2-8-2v13c3.8 0 6.3.3 8 2 1.7-1.7 4.2-2 8-2v-13c-3.8 0-6.3.3-8 2zM12 6.5v13"/>',
  activity: '<path d="M3 12h4l2.5-6.5 5 13L17 12h4"/>',
  award: '<circle cx="12" cy="9.5" r="5.5"/><path d="m8.8 14 -1.3 6 4.5-2.5L16.5 20l-1.3-6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5"/>',
  externalLink: '<path d="M14 4h6v6M20 4l-9.5 9.5M10 6H5.5A1.5 1.5 0 0 0 4 7.5v11A1.5 1.5 0 0 0 5.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"/>',
  layers: '<path d="m12 3.5 8.5 4.5L12 12.5 3.5 8z"/><path d="m4.5 12.5 7.5 4 7.5-4M4.5 16.5l7.5 4 7.5-4" opacity="0.6"/>',
  list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12M4 6h.2M4 12h.2M4 18h.2"/>',
  weight: '<path d="M9 3.5h6l1 3H8zM6 6.5h12l2 13.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="12" cy="13" r="2.4"/>',
  glass: '<path d="M7 3h10l-1.2 16a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8z"/><path d="M7.8 11h8.4" opacity="0.6"/>',
  compare: '<path d="M12 3v18M5 7h4v10H5zM15 7h4v10h-4z"/>',
  gauge: '<path d="M4 14a8 8 0 1 1 16 0M12 14l3.5-3.5"/><path d="M12 14h.2"/>',
  medal: '<path d="m8 4 1.5 5M16 4l-1.5 5M9 3h6"/><circle cx="12" cy="14" r="5.5"/><path d="m12 11.6.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
};

export function icon(name, cls = "", size = 22) {
  const path = PATHS[name] || PATHS.sparkles;
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

/* Replace every <i data-icon="name"> placeholder in the document with inline SVG. */
export function mountStaticIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.getAttribute("data-icon");
    const size = Number(el.getAttribute("data-icon-size") || 22);
    el.outerHTML = icon(name, el.className || "", size);
  });
}
