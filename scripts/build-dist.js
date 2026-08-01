/* Dad Bod — dist builder: mirrors the web app into dist/ for Capacitor. */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const filesToCopy = [
  "index.html",
  "service-worker.js",
  "manifest.webmanifest",
];

const dirsToCopy = ["styles", "js", "assets"];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(relativePath) {
  const src = path.join(rootDir, relativePath);
  const dest = path.join(distDir, relativePath);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirectory(srcRelative, destRelative) {
  const src = path.join(rootDir, srcRelative);
  const dest = path.join(distDir, destRelative);
  ensureDir(dest);

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(path.join(srcRelative, entry.name), path.join(destRelative, entry.name));
    } else {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/* Start clean so removed files never linger in the shipped bundle. */
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

ensureDir(distDir);
filesToCopy.forEach(copyFile);
dirsToCopy.forEach((dir) => copyDirectory(dir, dir));

console.log("dist/ rebuilt successfully.");
