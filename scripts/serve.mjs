// Tiny local server that sends the same security headers as vercel.json.
// Use it to check that nothing is blocked by the Content Security Policy: npm start
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname, resolve, sep } from 'node:path';

const ROOT = resolve('public');
const PORT = Number(process.env.PORT || 4173);
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};
const rules = config.headers.map((r) => ({
  re: new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*').replace(/\((\w+(\|\w+)*)\)/g, '($1)') + '$'),
  headers: r.headers,
}));

createServer((req, res) => {
  let path = decodeURIComponent((req.url || '/').split('?')[0]);
  if (path.endsWith('/')) path += 'index.html';
  let file = normalize(join(ROOT, path));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end('Forbidden'); return; }
  if (!extname(file) && existsSync(file + '.html')) file += '.html';
  const found = existsSync(file) && statSync(file).isFile();
  if (!found) file = join(ROOT, '404.html');
  const headers = { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' };
  for (const r of rules) if (r.re.test(path)) for (const h of r.headers) headers[h.key] = h.value;
  // localhost is plain http, so skip the two headers that only make sense on https
  delete headers['Strict-Transport-Security'];
  if (headers['Content-Security-Policy']) headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');
  res.writeHead(found ? 200 : 404, headers).end(readFileSync(file));
}).listen(PORT, () => console.log(`Preview with security headers: http://localhost:${PORT}`));
