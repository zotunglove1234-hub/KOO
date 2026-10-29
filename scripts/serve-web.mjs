#!/usr/bin/env node
/**
 * Serve the exported KOO web build (`dist/`) over HTTP for local preview.
 *
 *   node scripts/serve-web.mjs                # http://localhost:8081
 *   node scripts/serve-web.mjs --port 5000    # different port
 *
 * `npx expo export --platform web` writes a fully static site to `dist/`, with one
 * HTML file per route. This server adds the two things a plain file listing does
 * not: extension-less routes resolve to their HTML (`/cart` -> `cart.html`), and any
 * unknown path falls back to `index.html` so client-side navigation and deep links
 * keep working. Deploy settings must do the same, or a refresh on a nested route
 * returns 404.
 *
 * No dependencies on purpose: everything here is Node built-ins.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? fallback : argv[index + 1] ?? fallback;
};

const PORT = Number(flag('port', 8081));
const DIR = resolve(ROOT, flag('dir', 'dist'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

/** Map a URL path to a file inside DIR, or null when nothing sensible matches. */
function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  // normalize collapses ../ segments; then re-check we stayed inside DIR.
  const relative = normalize(decoded).replace(/^([/\\])+/, '');
  const candidate = join(DIR, relative);
  if (candidate !== DIR && !candidate.startsWith(DIR + sep)) return null;

  const attempts = [];
  if (extname(candidate)) attempts.push(candidate);
  else {
    attempts.push(`${candidate}.html`, join(candidate, 'index.html'), candidate);
  }
  for (const path of attempts) {
    if (existsSync(path) && statSync(path).isFile()) return path;
  }
  return null;
}

if (!existsSync(join(DIR, 'index.html'))) {
  console.error(`No web build at ${DIR}.`);
  console.error('Run:  npx expo export --platform web');
  process.exit(1);
}

createServer((req, res) => {
  const file = resolveFile(req.url === '/' ? '/index.html' : req.url) ?? join(DIR, 'index.html');
  const type = MIME[extname(file)] ?? 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': statSync(file).size,
    'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`KOO web build: ${DIR}`);
  console.log(`Serving http://localhost:${PORT}  (Ctrl+C to stop)`);
});
