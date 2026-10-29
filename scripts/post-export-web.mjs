#!/usr/bin/env node
/**
 * Post-process the exported web build so deep links survive a deploy.
 *
 *   node scripts/post-export-web.mjs
 *   node scripts/post-export-web.mjs --dir dist
 *
 * `expo export --platform web` with `output: "static"` pre-renders one HTML file
 * per route, and a dynamic route only exists for the ids that were rendered — so
 * `/product/earbuds-pro` has a file but `/product/anything-else` does not, and
 * `/profile` is only ever `/profile.html`. Static hosts answer an unknown path
 * with their own 404 page instead of the app, which breaks refreshes and shared
 * links.
 *
 * Two small files fix that on both hosts KOO uses:
 *   `_redirects`  — Cloudflare Pages / Netlify syntax: serve index.html for any
 *                   path the app owns, with a 200 so React Router takes over.
 *   `404.html`    — GitHub Pages has no `_redirects`; it renders this file, so it
 *                   gets the same copy of the app shell.
 *
 * Written by `npm run export:web` so a rebuilt `dist/` never silently loses them.
 * No dependencies on purpose: everything here is Node built-ins.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? fallback : argv[index + 1] ?? fallback;
};
const DIR = resolve(ROOT, flag('dir', 'dist'));

const index = join(DIR, 'index.html');
if (!existsSync(index)) {
  console.error(`No web build at ${DIR} (index.html is missing).`);
  console.error('Run:  npm run export:web');
  process.exit(1);
}

// Cloudflare Pages reads rules in this file before it looks for a file on disk.
writeFileSync(
  join(DIR, '_redirects'),
  ['# SPA fallback: let the app route anything the export did not pre-render.', '/*    /index.html   200', ''].join(
    '\n'
  ),
  'utf8'
);
console.log(`  wrote  ${join(DIR, '_redirects')}`);

// GitHub Pages has no redirect file; its 404 page is the only hook.
copyFileSync(index, join(DIR, '404.html'));
console.log(`  copied index.html -> ${join(DIR, '404.html')}`);
