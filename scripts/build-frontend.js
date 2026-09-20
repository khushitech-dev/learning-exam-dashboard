'use strict';
/**
 * Staged Netlify build: assembles the static frontend into dist/.
 * Publishes only index.html, assets/ and exam/ (never .env, src/, etc.).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      copy(path.join(src, entry.name), path.join(dest, entry.name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const item of ['index.html', 'assets', 'exam']) {
  const src = path.join(ROOT, item);
  if (fs.existsSync(src)) copy(src, path.join(DIST, item));
}

console.log('[netlify-build] staged dist/ with index.html, assets/, exam/');