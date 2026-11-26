// Headless visual check of one build: serves its folder on a local port, loads index.html
// in Playwright's own Chromium (never real Chrome), collects console errors and failed requests,
// takes viewport stills down the page and one full-page still.
// usage: node check-build.mjs <buildDir> <outDir> [width height]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [dir, out, W = '1440', H = '900'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(path.resolve(dir)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': types[path.extname(p).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise((r) => server.on('listening', r));
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
page.on('requestfailed', (r) => errors.push('failed: ' + r.url().replace(`http://127.0.0.1:${port}`, '') + ' ' + (r.failure() || {}).errorText));
page.on('response', (r) => { if (r.status() >= 400) errors.push('http ' + r.status() + ': ' + r.url().replace(`http://127.0.0.1:${port}`, '')); });
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(3500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const shots = [];
const n = Math.max(2, Math.min(10, Math.ceil(total / +H)));
for (let i = 0; i < n; i++) {
  const y = Math.round(((total - +H) * i) / (n - 1));
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await page.waitForTimeout(1300);
  const f = path.join(out, `view-${String(i).padStart(2, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 80 });
  shots.push(f);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(out, 'full.jpg'), type: 'jpeg', quality: 75, fullPage: true }).catch((e) => errors.push('full: ' + e.message));
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ port, total, errors: [...new Set(errors)].slice(0, 60), shots }, null, 1));
console.log(JSON.stringify({ total, errors: [...new Set(errors)].length, first: [...new Set(errors)].slice(0, 8) }));
await browser.close();
server.close();
