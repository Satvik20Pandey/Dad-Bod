#!/usr/bin/env node
/**
 * Builds a premium Play Store feature graphic (1024×500) from a live Home
 * screenshot inside a phone frame — Apple/Notion-style, not a logo poster.
 * Output: assets/feature-graphic.png
 */
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "assets");
const tmpDir = path.join(root, "scripts", "screenshots");
const shotPath = path.join(tmpDir, "feature-home.png");
const outPath = path.join(outDir, "feature-graphic.png");

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

if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath.slice(1));
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const base = `http://localhost:${port}`;
console.log(`Serving at ${base}`);

const browser = await chromium.launch();

try {
  /* ---------- 1) Capture a rich Home screen ---------- */
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector("#authShell:not(.hidden)", { timeout: 12000 });
  await page.click("#offlineToggleBtn");
  await page.waitForSelector("#offlinePanel:not(.hidden)");
  await page.fill("#welcomeName", "Satvik");
  await page.fill("#welcomeEmail", "satvik@dadbod.app");
  await page.click("#welcomeSubmitBtn");
  await page.waitForSelector("#appShell:not(.hidden)", { timeout: 8000 });
  await page.waitForTimeout(700);

  /* Seed meals + water so Home looks alive */
  await page.click('.nav-btn[data-screen="diet"]');
  await page.waitForSelector("#screen-diet.active");
  await page.fill("#foodSearchInput", "paneer butter masala");
  await page.waitForSelector("#searchResults .search-row", { timeout: 10000 });
  await page.locator("#searchResults .search-row").first().click();
  await page.waitForSelector("#foodSheet.open");
  await page.waitForTimeout(350);
  await page.click("#mealSubmitBtn");
  await page.waitForTimeout(600);

  await page.fill("#foodSearchInput", "2 eggs and 1 roti");
  await page.waitForTimeout(300);
  await page.press("#foodSearchInput", "Enter");
  await page.waitForSelector("#foodSheet.open", { timeout: 6000 });
  await page.waitForTimeout(500);
  await page.click("#mealSubmitBtn");
  await page.waitForTimeout(500);

  await page.click('.nav-btn[data-screen="home"]');
  await page.waitForSelector("#screen-home.active");
  await page.waitForTimeout(500);

  /* Fill water so Home rings look alive */
  const addWater = page.locator('#bentoGrid button[data-water="1"]');
  if (await addWater.count()) {
    for (let i = 0; i < 6; i++) {
      await addWater.click();
      await page.waitForTimeout(120);
    }
  }

  await page.waitForTimeout(700);

  /* Hide splash remnants / toast if any */
  await page.evaluate(() => {
    document.querySelector("#splashScreen")?.remove();
    document.querySelectorAll(".toast").forEach((el) => el.remove());
  });

  const home = page.locator("#appShell");
  await home.screenshot({ path: shotPath, type: "png" });
  console.log(`Home shot → ${shotPath}`);
  await page.close();

  /* ---------- 2) Compose premium Play Store banner ---------- */
  const iconB64 = (await readFile(path.join(outDir, "icon-192.png"))).toString("base64");
  const shotB64 = (await readFile(shotPath)).toString("base64");

  const composeHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #060A12;
    font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .stage {
    position: relative;
    width: 1024px;
    height: 500px;
    overflow: hidden;
    background: #060A12;
  }
  /* Near-invisible depth — never loud AI orbs */
  .glow {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(48px);
  }
  .glow-a {
    width: 340px; height: 340px;
    right: 40px; top: 40px;
    background: rgba(59, 130, 246, 0.09);
  }
  .glow-b {
    width: 280px; height: 280px;
    right: 120px; bottom: -40px;
    background: rgba(139, 92, 246, 0.07);
  }

  .copy {
    position: absolute;
    left: 52px;
    top: 0;
    bottom: 0;
    width: 455px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 28px 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 26px;
  }
  .brand img {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    box-shadow: 0 8px 22px rgba(0,0,0,0.32);
  }
  .brand span {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.26em;
    color: rgba(255,255,255,0.92);
  }
  h1 {
    font-size: 46px;
    font-weight: 800;
    letter-spacing: -0.038em;
    line-height: 1.08;
    color: #FFFFFF;
    margin-bottom: 12px;
  }
  h1 .accent {
    background: linear-gradient(105deg, #60A5FA 0%, #818CF8 45%, #A78BFA 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .eyebrow {
    font-size: 15px;
    font-weight: 600;
    color: rgba(186, 198, 222, 0.72);
    margin-bottom: 28px;
  }
  .features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  }
  .feature {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    border-radius: 14px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .feature-icon {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .feature-icon svg { width: 18px; height: 18px; display: block; }
  .fi-n { background: rgba(59, 130, 246, 0.16); color: #60A5FA; }
  .fi-t { background: rgba(139, 92, 246, 0.16); color: #A78BFA; }
  .fi-p { background: rgba(34, 197, 94, 0.14); color: #4ADE80; }
  .feature-text strong {
    display: block;
    font-size: 13.5px;
    font-weight: 700;
    color: rgba(255,255,255,0.94);
    letter-spacing: -0.01em;
    margin-bottom: 2px;
  }
  .feature-text span {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: rgba(148, 163, 184, 0.78);
    line-height: 1.3;
  }

  .phone-wrap {
    position: absolute;
    right: 48px;
    top: 50%;
    transform: translateY(-48%) rotate(2.8deg);
    z-index: 3;
    filter: drop-shadow(0 36px 56px rgba(0,0,0,0.55));
  }
  .phone {
    width: 278px;
    height: 568px;
    border-radius: 42px;
    background: linear-gradient(160deg, #1a1f2e 0%, #05070D 100%);
    padding: 11px;
    border: 1.5px solid rgba(255,255,255,0.16);
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.06),
      0 0 0 1px rgba(0,0,0,0.5);
    position: relative;
    overflow: hidden;
  }
  .phone::before {
    content: "";
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 82px;
    height: 22px;
    background: #03050A;
    border-radius: 14px;
    z-index: 5;
  }
  .screen {
    width: 100%;
    height: 100%;
    border-radius: 32px;
    overflow: hidden;
    background: #F7F8FA;
  }
  .screen img {
    width: 100%;
    height: auto;
    min-height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
    transform: scale(1.015);
    transform-origin: top center;
  }
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
          <div class="feature-icon fi-n">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          </div>
          <div class="feature-text">
            <strong>Nutrition</strong>
            <span>Track every meal easily.</span>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon fi-t">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
          </div>
          <div class="feature-text">
            <strong>Training</strong>
            <span>Log workouts &amp; stay strong.</span>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon fi-p">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <div class="feature-text">
            <strong>Progress</strong>
            <span>Measure, improve &amp; see results.</span>
          </div>
        </div>
      </div>
    </div>
    <div class="phone-wrap">
      <div class="phone">
        <div class="screen">
          <img src="data:image/png;base64,${shotB64}" alt="Dad Bod Home" />
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const exactPage = await browser.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  await exactPage.setContent(composeHtml, { waitUntil: "networkidle" });
  await exactPage.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await exactPage.waitForTimeout(1000);

  const tmpOut = path.join(tmpDir, "feature-graphic-tmp.png");
  await exactPage.screenshot({ path: tmpOut, type: "png" });
  await exactPage.close();

  /* Enforce exact 1024×500 (Play Store requirement) */
  const verifyPage = await browser.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  const rawB64 = (await readFile(tmpOut)).toString("base64");
  await verifyPage.setContent(`<!doctype html><html><body style="margin:0;width:1024px;height:500px;overflow:hidden;background:#060A12">
    <canvas id="c" width="1024" height="500"></canvas>
    <script>
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 1024, 500);
        document.title = 'ready';
      };
      img.src = 'data:image/png;base64,${rawB64}';
    </script>
  </body></html>`);
  await verifyPage.waitForFunction(() => document.title === "ready", { timeout: 10000 });
  await verifyPage.locator("#c").screenshot({ path: outPath, type: "png" });
  await verifyPage.close();
  console.log(`Feature graphic → ${outPath}`);
} finally {
  await browser.close();
  server.close();
}
