// Capture the viewer's four views from one page by reading the canvas.
// Usage: node capture.mjs <page-url> <out-dir> [views, default full,tq,back,face,half] [chrome-executable]
// Run it from a folder where `npm i playwright-core` was done (resolved from the working directory,
// not from this script's folder). The viewer must set window.__ready and have [data-v] view buttons.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright-core')); }
catch { console.log('FAIL playwright-core not found from', process.cwd(), '- run `npm i playwright-core` there first'); process.exit(1); }
const [,, url, out, viewArg, exeArg] = process.argv;
const VIEWS = (viewArg || 'full,tq,back,face,half').split(',');
const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const exe = exeArg || fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().map(d =>
  path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')).filter(fs.existsSync).pop();
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
let code = 0;
try {
  const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  let errs = 0;
  p.on('pageerror', e => { errs++; console.log('PAGEERR', e.message); });
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { if (m.type() === 'error') errs++; console.log(m.type().toUpperCase(), m.text()); } });
  const sep = url.includes('?') ? '&' : '?';
  await p.goto(`${url}${sep}hud=0&still=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  // Poll with evaluate: waitForFunction polls on rAF and stalls on a heavy skinned mesh.
  for (let i = 0; i < 180 && !(await p.evaluate('window.__ready===true')); i++) await p.waitForTimeout(1000);
  if (!(await p.evaluate('window.__ready===true'))) throw new Error('viewer never set __ready (model failed to load?)');
  console.log('arms', JSON.stringify(await p.evaluate('window.__arms')), '·', await p.evaluate("document.querySelector('#msg').textContent"));
  const seen = new Set();
  for (const v of VIEWS) {
    await p.evaluate(v => document.querySelector(`[data-v="${v}"]`).click(), v);
    await p.waitForTimeout(6000);
    const d = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
    if (seen.has(d.length)) console.log('WARN', v, 'matches an earlier frame: the render loop stalled, capture again');
    seen.add(d.length);
    fs.writeFileSync(path.join(out, `${v}.png`), Buffer.from(d.split(',')[1], 'base64'));
    console.log('shot', v);
  }
  console.log(errs ? `ERRORS ${errs}` : 'no console errors'); if (errs) code = 1;
} catch (e) { console.log('FAIL', e.message.split('\n')[0]); code = 1; }
await b.close(); process.exit(code);
