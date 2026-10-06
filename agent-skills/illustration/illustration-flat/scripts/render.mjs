// Headless renders for hand-written SVG illustration cards. Never opens a window.
//
//   node render.mjs card.svg card.png                     whole card at 2x
//   node render.mjs card.svg hand.png --zoom 210,180,60,45 --scale 8
//                                                         re-render one region (SVG units) at 8x
//   node render.mjs --sheet sheet.png ref-a.svg ref-b.svg new.svg
//                                                         cards side by side at 1x, labelled, for the
//                                                         "does it belong to the set?" check
//
// Needs `playwright` or `playwright-core` (npm i -D playwright-core) and a Chromium.
// Chromium is found in this order: $CHROME_PATH, Playwright's own download, the newest
// ~/Library/Caches/ms-playwright/chromium-*, then a system Chrome.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

// Resolve Playwright next to this script, then from the current folder, then from the global npm root,
// so the script works from an installed skill folder as well as from a project.
async function loadPlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try { return norm(await import(name)); } catch {}
    for (const base of [process.cwd(), globalRoot()]) {
      if (!base) continue;
      try { return norm(await import(pathToFileURL(createRequire(path.join(base, 'noop.js')).resolve(name)).href)); } catch {}
    }
  }
  console.error('Install playwright-core first: npm i -D playwright-core (in this folder or globally)');
  process.exit(1);
}
function norm(m) { return m.chromium ? m : m.default; }
function globalRoot() { try { return execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } }
const pw = await loadPlaywright();

function findChrome() {
  const tries = [process.env.CHROME_PATH];
  try { tries.push(pw.chromium.executablePath()); } catch {}
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (fs.existsSync(cache)) {
    for (const d of fs.readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => b.split('-')[1] - a.split('-')[1])) {
      tries.push(path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'));
      tries.push(path.join(cache, d, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'));
      tries.push(path.join(cache, d, 'chrome-linux/chrome'));
    }
  }
  tries.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium');
  return tries.find(p => p && fs.existsSync(p));
}

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const scale = Number(opt('--scale', 2));
const zoom = opt('--zoom', null);
const sheet = opt('--sheet', null);

const browser = await pw.chromium.launch({ headless: true, executablePath: findChrome() });
const errors = [];

async function shot(html, w, h, out, dpr) {
  const page = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: dpr });
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.setContent(html);
  await page.screenshot({ path: out });
  await page.close();
}

const read = f => fs.readFileSync(f, 'utf8').replace(/^<\?xml[^>]*>\s*/, '');

if (sheet) {
  const files = args;
  const cells = files.map(f => `<figure><div class="c">${read(f).replace(/<svg /, '<svg style="display:block;width:480px;height:360px" ')}</div><figcaption>${path.basename(f)}</figcaption></figure>`).join('');
  const w = files.length * 480 + (files.length + 1) * 16;
  await shot(`<!doctype html><body style="margin:0;background:#f6f6f8;font:13px ui-monospace,monospace;color:#555">
    <div style="display:flex;gap:16px;padding:16px">${cells}</div>
    <style>figure{margin:0}.c{width:480px;height:360px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px #0000000f}figcaption{margin-top:6px}</style></body>`,
    w, 360 + 16 * 2 + 24, sheet, 1);
  console.log('sheet', sheet);
} else {
  const [inp, out] = args;
  if (!inp || !out) { console.error('usage: node render.mjs in.svg out.png [--scale 2] [--zoom x,y,w,h]'); process.exit(1); }
  let svg = read(inp);
  let w = 480, h = 360;
  if (zoom) {
    const [x, y, zw, zh] = zoom.split(',').map(Number);
    svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${zw} ${zh}"`);
    w = zw; h = zh;
  }
  svg = svg.replace(/<svg /, `<svg style="display:block;width:${w}px;height:${h}px" preserveAspectRatio="xMidYMid meet" `);
  await shot(`<!doctype html><body style="margin:0;background:#fff">${svg}</body>`, w, h, out, scale);
  console.log('ok', out);
}
if (errors.length) console.log('console errors:', errors);
await browser.close();
