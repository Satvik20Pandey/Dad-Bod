/* Dad Bod — hand-rolled canvas charts: animated weight trend, macro donut,
 * and the GitHub-style consistency heatmap. No chart library, 60fps. */

const CYAN = "#00E5FF";
const MINT = "#00D084";

function prepareCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.clientWidth;
  const height = rect.height || canvas.clientHeight;
  /* Hidden screens measure 0×0 — skip drawing; the screen switcher re-renders
   * every screen the moment it becomes visible. */
  if (!width || !height || width < 5 || height < 5) return null;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

/* Animated weight line with gradient fill and goal line. */
export function drawWeightChart(canvas, entries, goalWeight = null, animate = true) {
  if (!canvas) return;
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, width, height } = prepared;
  ctx.clearRect(0, 0, width, height);

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12.5px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Log at least 2 weigh-ins to see your trend", width / 2, height / 2);
    return;
  }

  const padL = 40;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const weights = sorted.map((e) => Number(e.weight));
  const allValues = goalWeight ? [...weights, Number(goalWeight)] : weights;
  const minW = Math.min(...allValues) - 0.6;
  const maxW = Math.max(...allValues) + 0.6;
  const range = Math.max(0.4, maxW - minW);

  const xFor = (i) => padL + (i / (sorted.length - 1)) * plotW;
  const yFor = (w) => padT + ((maxW - w) / range) * plotH;

  const render = (progress) => {
    ctx.clearRect(0, 0, width, height);

    /* Grid + labels */
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = padT + (i * plotH) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
      const label = (maxW - (i * range) / 4).toFixed(1);
      ctx.fillText(label, padL - 6, y + 3);
    }

    /* Date labels: first, middle, last */
    ctx.textAlign = "center";
    [0, Math.floor((sorted.length - 1) / 2), sorted.length - 1].forEach((i) => {
      const d = sorted[i].date.slice(5).replace("-", "/");
      ctx.fillText(d, xFor(i), height - 8);
    });

    /* Goal line */
    if (goalWeight) {
      const gy = yFor(Number(goalWeight));
      ctx.save();
      ctx.strokeStyle = "rgba(0,208,132,0.55)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(width - padR, gy);
      ctx.stroke();
      ctx.restore();
    }

    const visibleCount = Math.max(2, Math.ceil(sorted.length * progress));
    const partial = sorted.slice(0, visibleCount);

    /* Area fill */
    const gradient = ctx.createLinearGradient(0, padT, 0, height - padB);
    gradient.addColorStop(0, "rgba(0,229,255,0.28)");
    gradient.addColorStop(1, "rgba(0,229,255,0)");
    ctx.beginPath();
    partial.forEach((entry, i) => {
      const x = xFor(i);
      const y = yFor(Number(entry.weight));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xFor(partial.length - 1), height - padB);
    ctx.lineTo(padL, height - padB);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    /* Line */
    ctx.beginPath();
    partial.forEach((entry, i) => {
      const x = xFor(i);
      const y = yFor(Number(entry.weight));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0,229,255,0.5)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* Points (sparse for dense data) */
    const stride = Math.max(1, Math.floor(partial.length / 20));
    partial.forEach((entry, i) => {
      if (i % stride !== 0 && i !== partial.length - 1) return;
      const x = xFor(i);
      const y = yFor(Number(entry.weight));
      ctx.beginPath();
      ctx.arc(x, y, i === partial.length - 1 ? 4 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = i === partial.length - 1 ? "#fff" : CYAN;
      ctx.fill();
    });
  };

  if (!animate) {
    render(1);
    return;
  }

  const start = performance.now();
  const durationMs = 700;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / durationMs);
    render(1 - Math.pow(1 - t, 3));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* Macro donut: [{value, color}] with rounded gaps. */
export function drawMacroDonut(canvas, segments) {
  if (!canvas) return;
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, width, height } = prepared;
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const stroke = 13;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  ctx.lineCap = "round";

  if (total <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = stroke;
    ctx.stroke();
    return;
  }

  let angle = -Math.PI / 2;
  const gap = 0.09;
  segments.forEach((segment) => {
    const sweep = (Math.max(0, segment.value) / total) * (Math.PI * 2) - gap;
    if (sweep <= 0) {
      angle += gap;
      return;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle + gap / 2, angle + gap / 2 + sweep);
    ctx.strokeStyle = segment.color;
    ctx.lineWidth = stroke;
    ctx.stroke();
    angle += sweep + gap;
  });
}

/* GitHub-style heatmap rendered as a CSS grid of cells. */
export function renderHeatmap(container, cells) {
  if (!container) return;
  const columns = Math.ceil(cells.length / 7);
  container.style.setProperty("--heatmap-cols", String(columns));
  container.innerHTML = cells
    .map(
      (cell) =>
        `<span class="heat-cell l${cell.level}" title="${cell.date}"></span>`
    )
    .join("");
}

/* Tiny sparkline for bento tiles. */
export function drawSparkline(canvas, values, color = MINT) {
  if (!canvas || !values.length) return;
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, width, height } = prepared;
  ctx.clearRect(0, 0, width, height);
  if (values.length < 2) return;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.001, max - min);
  const pad = 4;

  ctx.beginPath();
  values.forEach((value, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + ((max - value) / range) * (height - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}
