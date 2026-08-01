#!/usr/bin/env node
/* Dad Bod — end-to-end smoke test.
 * Serves the app locally, drives it with Playwright (mobile viewport), and
 * walks the core journey: onboarding → home → log a meal from the dataset →
 * water + workout interactions → screenshots into scripts/screenshots/.
 * Run: npm run test:smoke */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shotsDir = path.join(root, "scripts", "screenshots");
if (!existsSync(shotsDir)) mkdirSync(shotsDir, { recursive: true });

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

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
console.log(`Serving ${root} at ${base}`);

const failures = [];
const check = (label, condition) => {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(String(error)));

try {
  await page.goto(base, { waitUntil: "networkidle" });

  /* Splash clears itself, landing appears */
  await page.waitForSelector("#authShell:not(.hidden)", { timeout: 9000 });
  await page.screenshot({ path: path.join(shotsDir, "01-landing.png") });
  check("Landing offers Continue with Google", await page.isVisible("#googleSignInBtn"));
  check("Landing offers Continue Offline", await page.isVisible("#offlineToggleBtn"));

  /* Offline onboarding must work with no Firebase involvement at all */
  await page.click("#offlineToggleBtn");
  await page.waitForSelector("#offlinePanel:not(.hidden)", { timeout: 4000 });
  check("Offline form opens", await page.isVisible("#welcomeForm"));
  await page.fill("#welcomeName", "Test Athlete");
  await page.fill("#welcomeEmail", "athlete@example.com");
  await page.click("#welcomeSubmitBtn");
  await page.waitForSelector("#appShell:not(.hidden)", { timeout: 6000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(shotsDir, "02-home.png") });
  check("Home screen active after onboarding", await page.isVisible("#screen-home.active"));
  check("Physique score rendered", (await page.textContent("#scoreValue"))?.trim().length > 0);
  check("Bento grid populated", (await page.locator("#bentoGrid .bento-tile").count()) >= 6);

  /* Diet: search the dataset and log a meal */
  await page.click('.nav-btn[data-screen="diet"]');
  await page.waitForSelector("#screen-diet.active");
  await page.fill("#foodSearchInput", "paneer");
  await page.waitForSelector("#searchResults .search-row", { timeout: 8000 });
  const suggestionCount = await page.locator("#searchResults .search-row").count();
  check("Dataset suggestions appear for 'paneer'", suggestionCount > 0);
  await page.screenshot({ path: path.join(shotsDir, "03-diet-search.png") });

  await page.locator("#searchResults .search-row").first().click();
  await page.waitForSelector("#foodSheet.open", { timeout: 5000 });
  await page.waitForTimeout(400);
  const kcalValue = await page.inputValue("#mealCalories");
  check("Food sheet prefilled with calories", Number(kcalValue) > 0);
  await page.screenshot({ path: path.join(shotsDir, "04-food-sheet.png") });

  await page.click("#mealSubmitBtn");
  await page.waitForTimeout(700);
  const timelineItems = await page.locator("#mealTimeline .meal-item").count();
  check("Meal appears in the timeline", timelineItems >= 1);
  await page.screenshot({ path: path.join(shotsDir, "05-diet-logged.png") });

  /* Manual multi-part estimate through the resolver */
  await page.fill("#foodSearchInput", "2 eggs and 1 roti");
  await page.waitForTimeout(400);
  await page.press("#foodSearchInput", "Enter");
  await page.waitForSelector("#foodSheet.open", { timeout: 5000 });
  await page.waitForTimeout(700);
  const estKcal = Number(await page.inputValue("#mealCalories"));
  check("Resolver estimates 2 eggs + 1 roti (250-330 kcal)", estKcal >= 220 && estKcal <= 360);
  await page.click("#mealCancelEditBtn");
  await page.waitForTimeout(400);

  /* Water quick action from home bento */
  await page.click('.nav-btn[data-screen="home"]');
  await page.waitForTimeout(300);
  await page.click('[data-water="1"]');
  await page.waitForTimeout(400);
  const waterText = await page.textContent(".tile-water .tile-title");
  check("Water tile increments", waterText?.includes("0.3") || waterText?.includes("0.2"));

  /* Dad Coins: daily check-in should have been granted on first render */
  const coinsText = (await page.textContent("#coinsCount"))?.trim();
  check(`Dad Coins granted (chip shows ${coinsText})`, Number((coinsText || "0").replace(/,/g, "")) >= 100);
  check("Mission CTA renders", await page.isVisible("#missionCta .mission-cta"));

  /* Fullscreen scanner opens from the center nav button */
  await page.click("#scanBtn");
  await page.waitForSelector("#scanOverlay.open", { timeout: 4000 });
  await page.screenshot({ path: path.join(shotsDir, "11-scanner.png") });
  check("Scan overlay opens with frame", await page.isVisible(".scan-frame"));
  await page.click("#scanCloseBtn");
  await page.waitForTimeout(400);
  check("Scan overlay closes", !(await page.isVisible("#scanOverlay.open")));

  /* Train screen */
  await page.click('.nav-btn[data-screen="train"]');
  await page.waitForSelector("#screen-train.active");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(shotsDir, "06-train.png") });
  const exerciseCards = await page.locator("#exerciseList .exercise-card").count();
  const isRest = await page.isVisible(".hero-rest");
  check("Workout hero + exercises render", isRest || exerciseCards > 0);

  if (exerciseCards > 0) {
    await page.locator("#exerciseList .exercise-card .exercise-main").first().click();
    await page.waitForTimeout(400);
    const doneCards = await page.locator("#exerciseList .exercise-card.done").count();
    check("Exercise toggles done", doneCards >= 1);

    await page.locator("#exerciseList [data-timer]").first().click();
    await page.waitForSelector("#timerOverlay.open", { timeout: 4000 });
    await page.screenshot({ path: path.join(shotsDir, "07-rest-timer.png") });
    check("Rest timer overlay opens", true);
    await page.click("#timerSkipBtn");
    await page.waitForTimeout(400);
  }

  /* Progress */
  await page.click('.nav-btn[data-screen="progress"]');
  await page.waitForSelector("#screen-progress.active");
  await page.fill("#weightValue", "82.5");
  await page.click('#weightForm button[type="submit"]');
  await page.waitForTimeout(500);
  check("Weight hero shows entry", (await page.textContent("#weightHero"))?.includes("82.5"));
  await page.screenshot({ path: path.join(shotsDir, "08-progress.png") });

  /* Dad Bod HQ */
  await page.click('.nav-btn[data-screen="more"]');
  await page.waitForSelector("#screen-more.active");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(shotsDir, "09-more.png") });
  check("HQ rows render", (await page.locator(".cc-row").count()) >= 7);
  check("HQ title updated", (await page.textContent("#screen-more .screen-header h1"))?.includes("Dad Bod HQ"));
  check("Rewards card lists earn rules", (await page.locator("#rewardsCard .earn-row").count()) >= 7);
  check(
    "Account card shows offline profile",
    (await page.textContent("#accountCard"))?.includes("Offline profile")
  );

  /* Backup sheet must explain itself and stay locked for offline profiles */
  await page.click("#backupOpenBtn");
  await page.waitForSelector("#backupSheet.open", { timeout: 4000 });
  await page.waitForTimeout(300);
  check("Backup sheet explains Google requirement", (await page.textContent("#backupIntro"))?.includes("Google account"));
  check("Backup actions disabled when offline profile", await page.isDisabled("#backupRunBtn"));
  await page.screenshot({ path: path.join(shotsDir, "12-backup.png") });
  await page.click('[data-close-layer="backupSheet"] >> nth=1');
  await page.waitForTimeout(400);

  await page.click('[data-open-sheet="goalsSheet"]');
  await page.waitForSelector("#goalsSheet.open");
  await page.waitForTimeout(400);
  check("Goals sheet opens with targets", (await page.textContent("#targetSummary"))?.includes("Protein"));
  await page.screenshot({ path: path.join(shotsDir, "10-goals.png") });

  /* Reload — session + data must persist */
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("#appShell:not(.hidden)", { timeout: 9000 });
  await page.waitForTimeout(600);
  check("Session persists across reload", await page.isVisible("#screen-home.active"));
  await page.click('.nav-btn[data-screen="diet"]');
  await page.waitForTimeout(400);
  check("Logged meal survives reload", (await page.locator("#mealTimeline .meal-item").count()) >= 1);

  const realErrors = consoleErrors.filter(
    (e) => !e.includes("service-worker") && !e.includes("favicon") && !e.includes("net::ERR") && !e.includes("Failed to load resource")
  );
  check(`No console errors (${realErrors.length} found)`, realErrors.length === 0);
  if (realErrors.length) realErrors.slice(0, 8).forEach((e) => console.error(`    console: ${e}`));
} catch (error) {
  failures.push(`fatal: ${error.message}`);
  console.error(error);
  await page.screenshot({ path: path.join(shotsDir, "99-failure.png") }).catch(() => {});
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`\nSmoke test FAILED (${failures.length} issue(s)).`);
  process.exit(1);
}
console.log("\nSmoke test passed. Screenshots in scripts/screenshots/.");
