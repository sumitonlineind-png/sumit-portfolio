// Copies src/ to public/ and fills in the placeholders (site URL, build date, file hashes).
// No dependencies. Runs on Vercel through "buildCommand" in vercel.json.
import { cpSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';

const SRC = 'src';
const OUT = 'public';

// 1. Work out the public address of the site.
//    SITE_URL (set it in Vercel > Settings > Environment Variables) wins.
//    Otherwise Vercel gives us the production domain in VERCEL_PROJECT_PRODUCTION_URL.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
const fromVercel = vercelHost ? `https://${vercelHost}` : '';
let site = (process.env.SITE_URL || fromVercel).trim().replace(/\/+$/, '');
if (!site) {
  if (process.env.VERCEL) {
    throw new Error('[build] Could not work out your site address. In Vercel go to Settings > Environment Variables and add SITE_URL = https://your-domain.com, then redeploy.');
  }
  site = 'http://localhost:4173';
  console.warn('[build] No SITE_URL found, using http://localhost:4173 (fine for local preview only).');
}
if (!/^https?:\/\/[A-Za-z0-9.:-]+$/.test(site)) {
  throw new Error(`[build] SITE_URL must look like https://example.com (got "${site}")`);
}

// 2. Copy the source folder.
rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

// 3. Short content hashes so a changed CSS/JS file is never served from an old cache.
const hash = (file) =>
  createHash('sha256').update(readFileSync(join(OUT, file))).digest('hex').slice(0, 10);

const tokens = {
  '%%SITE_URL%%': site,
  '%%BUILD_DATE%%': new Date().toISOString().slice(0, 10),
  '%%V_CSS%%': hash('assets/css/style.css'),
  '%%V_JS%%': hash('assets/js/main.js'),
  '%%V_BOOT%%': hash('assets/js/boot.js'),
};

// 4. Replace the placeholders in text files only (never in images).
const TEXT = new Set(['.html', '.xml', '.txt', '.json', '.webmanifest']);
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

let touched = 0;
for (const file of walk(OUT)) {
  if (!TEXT.has(extname(file)) && !file.endsWith('security.txt')) continue;
  let body = readFileSync(file, 'utf8');
  const before = body;
  for (const [token, value] of Object.entries(tokens)) body = body.split(token).join(value);
  if (/%%[A-Z_]+%%/.test(body)) throw new Error(`[build] Unreplaced placeholder left in ${file}`);
  if (body !== before) { writeFileSync(file, body); touched++; }
}

console.log(`[build] Done. ${touched} files updated. Site URL: ${site}`);
