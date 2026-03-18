const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const filesToCopy = [
  "index.html",
  "styles.css",
  "app-new.js",
  "service-worker.js",
  "manifest.webmanifest",
];

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

ensureDir(distDir);
filesToCopy.forEach(copyFile);
copyDirectory("assets", "assets");

console.log("Dist folder updated successfully.");
