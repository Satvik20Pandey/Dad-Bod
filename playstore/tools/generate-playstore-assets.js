const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const baseDir = path.resolve(__dirname, "..", "..");
const outputDir = path.join(baseDir, "playstore", "assets");
const phoneDir = path.join(outputDir, "screenshots", "phone");
const tabletDir = path.join(outputDir, "screenshots", "tablet");
const iconDir = path.join(outputDir, "icon");
const featureDir = path.join(outputDir, "feature-graphic");
const serverPort = 4173;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function filePathFromUrl(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const resolved = cleanPath === "/" ? "/index.html" : cleanPath;
  const fullPath = path.normalize(path.join(baseDir, resolved));
  if (!fullPath.startsWith(baseDir)) return null;
  return fullPath;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const filePath = filePathFromUrl(req.url || "/");
      if (!filePath) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
        res.writeHead(200);
        res.end(data);
      });
    });

    server.listen(serverPort, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

async function loginAndSeedDemo(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);

  await page.fill("#welcomeName", "Demo User");
  await page.fill("#welcomeEmail", "demo.user.fitness@gmail.com");
  await page.click("#welcomeForm button[type='submit']");

  await page.waitForFunction(() => {
    const app = document.getElementById("appShell");
    return app && !app.classList.contains("hidden");
  });
  await page.waitForTimeout(1200);

  await page.click("[data-tab='diet']");
  await page.waitForTimeout(250);
  await page.fill("#mealDescription", "2 eggs + 1 roti + 1 banana");
  await page.fill("#mealCalories", "520");
  await page.fill("#mealProtein", "28");
  await page.fill("#mealCarbs", "52");
  await page.fill("#mealFat", "18");
  await page.click("#mealSubmitBtn");
  await page.waitForTimeout(400);

  await page.click("[data-tab='progress']");
  await page.waitForTimeout(250);
  const weightValue = await page.locator("#weightValue");
  await weightValue.fill("81.4");
  await page.click("#weightForm button[type='submit']");
  await page.waitForTimeout(350);
}

async function capturePhoneScreenshots(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1080, height: 2400 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await loginAndSeedDemo(page, baseUrl);

  await page.click("[data-tab='home']");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(phoneDir, "01-home.png") });

  await page.click("[data-tab='diet']");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(phoneDir, "02-diet.png") });

  await page.click("[data-tab='gym']");
  await page.waitForTimeout(250);
  await page.click("#morningSessionAccordion summary");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(phoneDir, "03-workout-morning.png") });

  await page.click("#eveningSessionAccordion summary");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(phoneDir, "04-workout-evening.png") });

  await page.click("[data-tab='progress']");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(phoneDir, "05-progress.png") });

  await page.click("[data-tab='settings']");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(phoneDir, "06-more.png") });

  await context.close();
}

async function captureTabletScreenshots(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 2560 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await loginAndSeedDemo(page, baseUrl);

  await page.click("[data-tab='home']");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(tabletDir, "01-home-tablet.png") });

  await page.click("[data-tab='gym']");
  await page.waitForTimeout(250);
  await page.click("#eveningSessionAccordion summary");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(tabletDir, "02-workout-tablet.png") });

  await context.close();
}

async function captureIcon(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.setContent(`
    <html>
      <body style="margin:0; display:grid; place-items:center; width:512px; height:512px; background:#ffffff;">
        <img src="${baseUrl}/assets/icon.svg" alt="Dad Bod icon" style="width:440px; height:440px;" />
      </body>
    </html>
  `);

  await page.screenshot({ path: path.join(iconDir, "app-icon-512.png") });
  await context.close();

  fs.copyFileSync(
    path.join(baseDir, "assets", "icon.svg"),
    path.join(iconDir, "app-icon-source.svg")
  );
}

async function captureFeatureGraphic(browser) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.setContent(`
    <html>
      <body style="margin:0; width:1024px; height:500px; font-family:Arial,sans-serif; background:linear-gradient(135deg,#fff7ed 0%,#e8f4ff 45%,#e8fff4 100%); color:#0f1419;">
        <div style="position:relative; width:100%; height:100%; overflow:hidden;">
          <div style="position:absolute; top:-120px; right:-120px; width:360px; height:360px; border-radius:50%; background:rgba(255,107,53,0.18);"></div>
          <div style="position:absolute; bottom:-80px; left:-80px; width:300px; height:300px; border-radius:50%; background:rgba(0,200,150,0.16);"></div>
          <div style="position:absolute; left:72px; top:70px; display:flex; align-items:center; gap:20px;">
            <img src="/assets/icon.svg" alt="Dad Bod" style="width:86px; height:86px; border-radius:20px; background:#fff; padding:8px; box-shadow:0 8px 24px rgba(0,0,0,0.12);" />
            <div>
              <div style="font-size:46px; font-weight:800; line-height:1; letter-spacing:-0.02em;">Dad Bod</div>
              <div style="font-size:18px; margin-top:10px; color:#334155;">Track meals, workouts, and progress in one app</div>
            </div>
          </div>
          <div style="position:absolute; left:72px; bottom:84px; display:flex; gap:14px;">
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:12px 16px; font-size:16px; font-weight:700;">Calorie + Macro Tracking</div>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:12px 16px; font-size:16px; font-weight:700;">Morning + Evening Workouts</div>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:12px 16px; font-size:16px; font-weight:700;">Progress Analytics</div>
          </div>
        </div>
      </body>
    </html>
  `);

  await page.screenshot({ path: path.join(featureDir, "feature-graphic-1024x500.png") });
  await context.close();
}

async function main() {
  ensureDir(phoneDir);
  ensureDir(tabletDir);
  ensureDir(iconDir);
  ensureDir(featureDir);

  const server = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  const browser = await chromium.launch({ headless: true });

  try {
    await capturePhoneScreenshots(browser, baseUrl);
    await captureTabletScreenshots(browser, baseUrl);
    await captureIcon(browser, baseUrl);
    await captureFeatureGraphic(browser);
    console.log("Play Store assets generated successfully.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
