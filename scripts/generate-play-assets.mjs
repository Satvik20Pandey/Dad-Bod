#!/usr/bin/env node
/**
 * Generate Play Store media assets:
 *   assets/play-store/phone/          — 6 HD 9:16 screenshots (1440×2560)
 *   assets/play-store/tablet-7/       — 3 HD screenshots (1200×1920)
 *   assets/play-store/tablet-10/      — 3 HD screenshots (1600×2560)
 *   assets/feature-graphic.png        — exact 1024×500 (rendered @2× then downscaled)
 *
 * Run: node scripts/generate-play-assets.mjs
 */
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");
const phoneDir = path.join(assets, "play-store", "phone");
const tab7Dir = path.join(assets, "play-store", "tablet-7");
const tab10Dir = path.join(assets, "play-store", "tablet-10");
const tmpDir = path.join(root, "scripts", "screenshots");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

for (const dir of [phoneDir, tab7Dir, tab10Dir, tmpDir]) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath.slice(1));
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;
console.log(`Serving ${base}`);

const browser = await chromium.launch();

async function cleanUi(page) {
  await page.evaluate(() => {
    document.querySelector("#splashScreen")?.remove();
    document.querySelectorAll(".toast").forEach((el) => el.remove());
  });
}

async function onboardAndSeed(page) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector("#authShell:not(.hidden)", { timeout: 15000 });
  await page.click("#offlineToggleBtn");
  await page.waitForSelector("#offlinePanel:not(.hidden)");
  await page.fill("#welcomeName", "Satvik");
  await page.fill("#welcomeEmail", "satvik@dadbod.app");
  await page.click("#welcomeSubmitBtn");
  await page.waitForSelector("#appShell:not(.hidden)", { timeout: 10000 });
  await page.waitForTimeout(800);

  /* Seed diet */
  await page.click('.nav-btn[data-screen="diet"]');
  await page.waitForSelector("#screen-diet.active");

  const meals = ["paneer butter masala", "2 eggs and 1 roti", "greek yogurt"];
  for (const q of meals) {
    await page.fill("#foodSearchInput", q);
    try {
      if (q.includes("eggs")) {
        await page.waitForTimeout(250);
        await page.press("#foodSearchInput", "Enter");
      } else {
        await page.waitForSelector("#searchResults .search-row", { timeout: 8000 });
        await page.locator("#searchResults .search-row").first().click();
      }
      await page.waitForSelector("#foodSheet.open", { timeout: 6000 });
      await page.waitForTimeout(350);
      await page.click("#mealSubmitBtn");
      await page.waitForTimeout(500);
    } catch (err) {
      console.warn(`  seed skip "${q}":`, err.message);
      await page.click("#mealCancelEditBtn").catch(() => {});
    }
  }

  await page.click('.nav-btn[data-screen="home"]');
  await page.waitForSelector("#screen-home.active");
  await page.waitForTimeout(400);
  const addWater = page.locator('#bentoGrid button[data-water="1"]');
  if (await addWater.count()) {
    for (let i = 0; i < 8; i++) {
      await addWater.click();
      await page.waitForTimeout(80);
    }
  }
  await page.waitForTimeout(500);
  await cleanUi(page);
}

/** Capture full viewport PNG buffer at native pixels, then letterbox/scale to exact W×H. */
async function exportExact(page, outPath, width, height) {
  const shot = await page.screenshot({ type: "png", fullPage: false });
  const helper = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const b64 = shot.toString("base64");
  await helper.setContent(`<!doctype html>
<html><body style="margin:0;background:#F7F8FA;width:${width}px;height:${height}px;overflow:hidden">
<canvas id="c" width="${width}" height="${height}"></canvas>
<script>
const img = new Image();
img.onload = () => {
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F7F8FA';
  ctx.fillRect(0,0,${width},${height});
  const scale = Math.max(${width}/img.width, ${height}/img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (${width} - w) / 2;
  const y = 0; /* pin top — keep header/score in frame */
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, w, h);
  document.title = 'ok';
};
img.src = 'data:image/png;base64,${b64}';
</script></body></html>`);
  await helper.waitForFunction(() => document.title === "ok", { timeout: 15000 });
  const buf = await helper.evaluate(() => {
    const c = document.getElementById("c");
    return c.toDataURL("image/png").split(",")[1];
  });
  await writeFile(outPath, Buffer.from(buf, "base64"));
  await helper.close();
  console.log(`  ✓ ${path.relative(root, outPath)}`);
}

async function captureSet({ label, dir, cssW, cssH, dpr, files }) {
  console.log(`\n=== ${label} (${cssW * dpr}×${cssH * dpr} target via ${cssW}×${cssH}@${dpr}x) ===`);
  const page = await browser.newPage({
    viewport: { width: cssW, height: cssH },
    deviceScaleFactor: dpr,
  });
  await onboardAndSeed(page);

  const shots = [];

  /* 01 Home */
  await page.click('.nav-btn[data-screen="home"]');
  await page.waitForSelector("#screen-home.active");
  await page.waitForTimeout(700);
  await cleanUi(page);
  shots.push(["01-home.png", async () => {}]);

  /* 02 Diet logged */
  shots.push([
    "02-diet.png",
    async () => {
      await page.click('.nav-btn[data-screen="diet"]');
      await page.waitForSelector("#screen-diet.active");
      await page.waitForTimeout(600);
    },
  ]);

  /* 03 Diet search */
  shots.push([
    "03-diet-search.png",
    async () => {
      await page.fill("#foodSearchInput", "dal");
      await page.waitForSelector("#searchResults .search-row", { timeout: 8000 });
      await page.waitForTimeout(400);
    },
  ]);

  /* 04 Train */
  shots.push([
    "04-train.png",
    async () => {
      await page.click("#mealCancelEditBtn").catch(() => {});
      await page.click('.nav-btn[data-screen="train"]');
      await page.waitForSelector("#screen-train.active");
      await page.waitForTimeout(700);
    },
  ]);

  /* 05 Progress */
  shots.push([
    "05-progress.png",
    async () => {
      await page.click("#mealCancelEditBtn").catch(() => {});
      await page.click('.nav-btn[data-screen="more"]');
      await page.waitForSelector("#screen-more.active");
      await page.waitForTimeout(300);
      await page.click("#openProgressFromHq");
      await page.waitForSelector("#screen-progress.active");
      await page.waitForTimeout(500);
      /* Seed a weight entry so the chart looks alive */
      if (await page.locator("#weightValue").count()) {
        await page.fill("#weightValue", "74.8");
        await page.click('#weightForm button[type="submit"]').catch(() => {});
        await page.waitForTimeout(400);
      }
    },
  ]);

  /* 06 HQ */
  shots.push([
    "06-hq.png",
    async () => {
      await page.click('.nav-btn[data-screen="more"]');
      await page.waitForSelector("#screen-more.active");
      await page.waitForTimeout(700);
    },
  ]);

  const outW = cssW * dpr;
  const outH = cssH * dpr;
  const selected = files || shots.map((s) => s[0]);

  for (const [name, prep] of shots) {
    if (!selected.includes(name)) continue;
    await prep();
    await cleanUi(page);
    await page.waitForTimeout(350);
    await exportExact(page, path.join(dir, name), outW, outH);
  }

  await page.close();
}

async function generateFeatureGraphicHd() {
  console.log("\n=== Feature graphic 1024×500 (HD render) ===");
  /* Reuse phone home raw capture if present; else take a fresh one */
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  await onboardAndSeed(phone);
  await phone.click('.nav-btn[data-screen="home"]');
  await phone.waitForSelector("#screen-home.active");
  await phone.waitForTimeout(600);
  await cleanUi(phone);
  const homeShot = path.join(tmpDir, "feature-home-hd.png");
  await phone.locator("#appShell").screenshot({ path: homeShot, type: "png" });
  await phone.close();

  const iconB64 = (await readFile(path.join(assets, "icon-192.png"))).toString("base64");
  const shotB64 = (await readFile(homeShot)).toString("base64");

  const composeHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 2048px; height: 1000px; overflow: hidden; background: #060A12;
    font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; -webkit-font-smoothing: antialiased; }
  .stage { position: relative; width: 2048px; height: 1000px; overflow: hidden; background: #060A12; }
  .glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(96px); }
  .glow-a { width: 680px; height: 680px; right: 80px; top: 80px; background: rgba(59,130,246,0.09); }
  .glow-b { width: 560px; height: 560px; right: 240px; bottom: -80px; background: rgba(139,92,246,0.07); }
  .copy { position: absolute; left: 104px; top: 0; bottom: 0; width: 910px; z-index: 2;
    display: flex; flex-direction: column; justify-content: center; padding: 56px 0; }
  .brand { display: flex; align-items: center; gap: 24px; margin-bottom: 52px; }
  .brand img { width: 76px; height: 76px; border-radius: 20px; box-shadow: 0 16px 44px rgba(0,0,0,0.32); }
  .brand span { font-size: 26px; font-weight: 700; letter-spacing: 0.26em; color: rgba(255,255,255,0.92); }
  h1 { font-size: 92px; font-weight: 800; letter-spacing: -0.038em; line-height: 1.08; color: #fff; margin-bottom: 24px; }
  h1 .accent { background: linear-gradient(105deg, #60A5FA 0%, #818CF8 45%, #A78BFA 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  .eyebrow { font-size: 30px; font-weight: 600; color: rgba(186,198,222,0.72); margin-bottom: 56px; }
  .features { display: flex; flex-direction: column; gap: 20px; max-width: 800px; }
  .feature { display: flex; align-items: center; gap: 28px; padding: 20px 28px; border-radius: 28px;
    background: rgba(255,255,255,0.035); border: 2px solid rgba(255,255,255,0.06); }
  .feature-icon { width: 72px; height: 72px; border-radius: 22px; display: grid; place-items: center; flex-shrink: 0; }
  .feature-icon svg { width: 36px; height: 36px; }
  .fi-n { background: rgba(59,130,246,0.16); color: #60A5FA; }
  .fi-t { background: rgba(139,92,246,0.16); color: #A78BFA; }
  .fi-p { background: rgba(34,197,94,0.14); color: #4ADE80; }
  .feature-text strong { display: block; font-size: 27px; font-weight: 700; color: rgba(255,255,255,0.94); margin-bottom: 4px; }
  .feature-text span { display: block; font-size: 24px; font-weight: 500; color: rgba(148,163,184,0.78); }
  .phone-wrap { position: absolute; right: 96px; top: 50%; transform: translateY(-48%) rotate(2.8deg); z-index: 3;
    filter: drop-shadow(0 72px 112px rgba(0,0,0,0.55)); }
  .phone { width: 556px; height: 1136px; border-radius: 84px;
    background: linear-gradient(160deg, #1a1f2e 0%, #05070D 100%); padding: 22px;
    border: 3px solid rgba(255,255,255,0.16); position: relative; overflow: hidden; }
  .phone::before { content: ""; position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
    width: 164px; height: 44px; background: #03050A; border-radius: 28px; z-index: 5; }
  .screen { width: 100%; height: 100%; border-radius: 64px; overflow: hidden; background: #F7F8FA; }
  .screen img { width: 100%; height: auto; min-height: 100%; object-fit: cover; object-position: top center; display: block; }
</style>
</head>
<body>
  <div class="stage">
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>
    <div class="copy">
      <div class="brand">
        <img src="data:image/png;base64,${iconB64}" alt="" />
        <span>DAD BOD</span>
      </div>
      <h1>Build a <span class="accent">stronger</span><br/>physique.</h1>
      <p class="eyebrow">Fitness &amp; Nutrition Tracker</p>
      <div class="features">
        <div class="feature">
          <div class="feature-icon fi-n"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>
          <div class="feature-text"><strong>Nutrition</strong><span>Track every meal easily.</span></div>
        </div>
        <div class="feature">
          <div class="feature-icon fi-t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg></div>
          <div class="feature-text"><strong>Training</strong><span>Log workouts &amp; stay strong.</span></div>
        </div>
        <div class="feature">
          <div class="feature-icon fi-p"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
          <div class="feature-text"><strong>Progress</strong><span>Measure, improve &amp; see results.</span></div>
        </div>
      </div>
    </div>
    <div class="phone-wrap"><div class="phone"><div class="screen">
      <img src="data:image/png;base64,${shotB64}" alt="Dad Bod Home" />
    </div></div></div>
  </div>
</body>
</html>`;

  /* Render at 2× (2048×1000) then high-quality downscale to exact 1024×500 */
  const hi = await browser.newPage({
    viewport: { width: 2048, height: 1000 },
    deviceScaleFactor: 1,
  });
  await hi.setContent(composeHtml, { waitUntil: "networkidle" });
  await hi.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await hi.waitForTimeout(1200);
  const hiPng = await hi.screenshot({ type: "png" });
  await hi.close();

  const lo = await browser.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  const hiB64 = hiPng.toString("base64");
  await lo.setContent(`<!doctype html><html><body style="margin:0;width:1024px;height:500px;overflow:hidden;background:#060A12">
<canvas id="c" width="1024" height="500"></canvas>
<script>
const img = new Image();
img.onload = () => {
  const ctx = document.getElementById('c').getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, 1024, 500);
  document.title = 'ready';
};
img.src = 'data:image/png;base64,${hiB64}';
</script></body></html>`);
  await lo.waitForFunction(() => document.title === "ready");
  const out = path.join(assets, "feature-graphic.png");
  const finalB64 = await lo.evaluate(() => document.getElementById("c").toDataURL("image/png").split(",")[1]);
  await writeFile(out, Buffer.from(finalB64, "base64"));
  await lo.close();
  console.log(`  ✓ assets/feature-graphic.png (1024×500 HD)`);
}

try {
  /* Phone: 720×1280 CSS @2x = 1440×2560 — HD 9:16, both sides ≥1080 */
  await captureSet({
    label: "Phone HD",
    dir: phoneDir,
    cssW: 720,
    cssH: 1280,
    dpr: 2,
    files: [
      "01-home.png",
      "02-diet.png",
      "03-diet-search.png",
      "04-train.png",
      "05-progress.png",
      "06-hq.png",
    ],
  });

  /* 7-inch tablet: 600×1067 @2x = 1200×2134 (exact 9:16) */
  await captureSet({
    label: "7-inch tablet",
    dir: tab7Dir,
    cssW: 600,
    cssH: 1067,
    dpr: 2,
    files: ["01-home.png", "02-diet.png", "04-train.png"],
  });

  /* 10-inch tablet: 800×1422 @2x = 1600×2844 (exact 9:16, sides ≥1080) */
  await captureSet({
    label: "10-inch tablet",
    dir: tab10Dir,
    cssW: 800,
    cssH: 1422,
    dpr: 2,
    files: ["01-home.png", "02-diet.png", "04-train.png"],
  });

  await generateFeatureGraphicHd();
} finally {
  await browser.close();
  server.close();
}

console.log("\nDone. Upload from assets/play-store/ and assets/feature-graphic.png");
