#!/usr/bin/env node
// rects.mjs <film.html> <t> <selector,selector,…> [--cam]
// Boxes (in 1920 × 1080 stage px) of elements at film time t, stepping there from 3 s before so anything that
// depends on the frames before it is drawn. --cam adds the camera window's box at t. Use it to put an edge on the
// grid (the content's 120 px margins, the camera's edges and middle line) by numbers instead of by eye, and to
// prove nothing runs under the camera: run it every 0.25 s over a scene. Headless only, never the visible browser.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const [file, t0, list] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!list && !process.argv.includes('--cam')) { console.log('rects.mjs <film.html> <t> <selector,…> [--cam]'); process.exit(1); }
const t = +t0, sels = (list || '').split(',').filter(Boolean);
if (process.argv.includes('--cam')) sels.push('.x-cam');

async function chromium() {
  const tries = [(process.env.PLAYWRIGHT_CORE || 'playwright'), 'playwright', 'playwright-core'];
  for (const n of tries) try { const m = await import(n); return m.chromium || m.default.chromium; } catch {}
  const req = createRequire(path.join(process.cwd(), 'x.js'));
  for (const n of ['playwright', 'playwright-core']) try { const m = await import(pathToFileURL(req.resolve(n)).href); return m.chromium || m.default.chromium; } catch {}
  throw new Error('playwright not found: npm i playwright && npx playwright install chromium');
}
const cft = process.env.CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await (await chromium()).launch({ headless: true, ...(fs.existsSync(cft) ? { executablePath: cft } : {}), args: ['--allow-file-access-from-files'] });
try {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.addInitScript(() => { window.__driven = true; });
  await p.goto(pathToFileURL(path.resolve(file)).href);
  await p.waitForFunction('window.__film !== undefined', null, { timeout: 60000 });
  await p.evaluate(() => { window.dispatchEvent(new Event('resize')); return window.__ready && window.__ready(); });
  for (let a = Math.max(0, t - 3); a < t; a += 0.25) await p.evaluate((x) => window.__frame(x), a);
  await p.evaluate((x) => window.__frame(x), t);
  const r = await p.evaluate((sels) => {
    const st = document.getElementById('stage').getBoundingClientRect(), k = 1920 / st.width;
    return sels.map((s) => [...document.querySelectorAll(s)].filter((e) => getComputedStyle(e).visibility !== 'hidden').map((e) => {
      const q = e.getBoundingClientRect();
      return `${s}: x ${((q.left - st.left) * k).toFixed(0)}–${((q.right - st.left) * k).toFixed(0)}  y ${((q.top - st.top) * k).toFixed(0)}–${((q.bottom - st.top) * k).toFixed(0)}  (opacity ${getComputedStyle(e).opacity})`;
    }).join('\n') || `${s}: not on screen`).join('\n');
  }, sels);
  console.log(`t ${t}\n${r}`);
} finally { await b.close(); }
