// Capture the viewer's four views from one page by reading the canvas.
// Usage: node capture.mjs <page-url> <out-dir> [chrome-executable]
// Needs: npm i playwright-core. The viewer must set window.__ready and have [data-v] view buttons.
import { chromium } from 'playwright-core';
import fs from 'fs';
import os from 'os';
import path from 'path';
const [,, url, out, exeArg] = process.argv;
const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const exe = exeArg || fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().map(d =>
  path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')).filter(fs.existsSync).pop();
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
let code = 0;
try {
  const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  const sep = url.includes('?') ? '&' : '?';
  await p.goto(`${url}${sep}hud=0&still=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  // Poll with evaluate: waitForFunction polls on rAF and stalls on a heavy skinned mesh.
  for (let i = 0; i < 120 && !(await p.evaluate('window.__ready===true')); i++) await p.waitForTimeout(1000);
  const seen = new Set();
  for (const v of ['full', 'half', 'back', 'face']) {
    await p.evaluate(v => document.querySelector(`[data-v="${v}"]`).click(), v);
    await p.waitForTimeout(6000);
    const d = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
    if (seen.has(d.length)) console.log('WARN', v, 'matches an earlier frame: the render loop stalled, capture again');
    seen.add(d.length);
    fs.writeFileSync(path.join(out, `${v}.png`), Buffer.from(d.split(',')[1], 'base64'));
    console.log('shot', v);
  }
} catch (e) { console.log('FAIL', e.message.split('\n')[0]); code = 1; }
await b.close(); process.exit(code);
