#!/usr/bin/env node
// Everything a viewer sees wrong that a thumbnail can't show, measured from the
// page across every scene. Run it in each look and shape you'll render, and with
// the camera on if it's on.
//
//   check-film.mjs <page.html> [--look NAME] [--shape 16:9] [--camera on] [--samples 12]
//
// - pictures: drawn larger than their real pixels. At a 2× render a picture may
//   read up to 2.0 (its pixels 1:1 on a 1× frame); above that it's enlarged.
// - soft: anything under perspective or preserve-3d drawn larger than its layout
//   size. Chromium rasterises those at layout size and stretches the bitmap, so
//   they go soft however good the file is. Limit 1.04. A rotated square reads high
//   from its bounding box without being enlarged: look before changing it.
// - heads: two headlines on screen together.
// - edges: words cut by the frame, or within 16 px of its sides.
// - camera: words or pointer targets under the corner the camera takes.
// - repeat: a frame drawn twice at the same t must be the same picture. A browser's
//   rasteriser can round a few pixels by one level, which no eye sees, so it's
//   measured with ffmpeg: under 60 dB of difference is a real change.
// Exits 1 if anything fails.
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { values: o, positionals } = parseArgs({ allowPositionals: true, options: { look: { type: 'string' }, shape: { type: 'string' }, camera: { type: 'string' }, samples: { type: 'string', default: '12' }, scale: { type: 'string', default: '2' } } });
if (positionals.length !== 1) { console.log('check-film.mjs <page.html> [--look NAME] [--shape 16:9] [--camera on] [--samples 12]'); process.exit(1); }
const req = createRequire(path.join(process.cwd(), 'x.js'));
let chromium;
for (const n of ['playwright', 'playwright-core']) {
  try { const m = await import(n); chromium = m.chromium || m.default.chromium; break; } catch {}
  try { const m = await import(pathToFileURL(req.resolve(n)).href); chromium = m.chromium || m.default.chromium; break; } catch {}
}
if (!chromium) { console.error('playwright not found: npm i playwright && npx playwright install chromium'); process.exit(1); }
const page0 = positionals[0];
const u = new URL(/^[a-z]+:\/\//i.test(page0) ? page0 : pathToFileURL(path.resolve(page0)).href);
for (const k of ['look', 'shape', 'camera']) if (o[k]) u.searchParams.set(k, o[k]);
const browser = await chromium.launch({ channel: 'chromium', args: ['--font-render-hinting=none', '--allow-file-access-from-files', '--hide-scrollbars'] });
const scale = +o.scale;
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: scale })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.addInitScript(() => { window.__driven = true; });
await page.goto(u.href, { waitUntil: 'load', timeout: 90000 });
await page.waitForFunction('window.__film !== undefined');
const film = await page.evaluate(() => window.__film);
await page.setViewportSize({ width: film.W, height: film.H });
await page.evaluate(() => window.dispatchEvent(new Event('resize')));
await page.evaluate(() => window.__ready());

const found = { pictures: new Map(), soft: new Map(), heads: [], edges: new Map(), camera: new Map() };
const n = +o.samples;
for (const s of film.scenes) {
  for (let i = 0; i < n; i++) {
    const t = s.a + ((s.b - s.a) * (i + 0.5)) / n;
    await page.evaluate((x) => window.__frame(x), t);
    const r = await page.evaluate(({ scale, film, t }) => {
      const stage = document.getElementById('stage');
      const seen = (el) => {
        for (let e = el; e && e !== stage; e = e.parentElement) {
          const c = getComputedStyle(e);
          if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.25) return false;
        }
        return true;
      };
      const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
      const out = { pictures: [], soft: [], heads: 0, edges: [], camera: [] };
      for (const el of stage.querySelectorAll('img')) {
        if (!el.naturalWidth || !seen(el)) continue;
        const b = el.getBoundingClientRect();
        if (b.width < 40 || b.right < 0 || b.left > film.W || b.bottom < 0 || b.top > film.H) continue;
        const sx = (el.offsetWidth * scale) / el.naturalWidth, sy = (el.offsetHeight * scale) / el.naturalHeight;
        const fit = getComputedStyle(el).objectFit;
        out.pictures.push({ what: el.getAttribute('src').split('/').pop(), s: +(fit === 'contain' ? Math.min(sx, sy) : Math.max(sx, sy)).toFixed(2), w: Math.round(el.offsetWidth) });
      }
      for (const el of stage.querySelectorAll('img, video, p, b, span, h1, h2, h3, li, small, dd, dt')) {
        if (!el.offsetWidth || el.offsetWidth < 16 || !seen(el)) continue;
        let three = false;
        for (let e = el; e && e !== stage; e = e.parentElement) {
          const c = getComputedStyle(e);
          if (c.transform.startsWith('matrix3d') || c.perspective !== 'none' || c.transformStyle === 'preserve-3d') { three = true; break; }
        }
        if (!three) continue;
        const s = el.getBoundingClientRect().width / el.offsetWidth;
        if (s > 1.04) out.soft.push({ what: name(el), s: +s.toFixed(2) });
      }
      const heads = [...stage.querySelectorAll('.x-scene .x-head, .x-scene .hk-title')].filter(seen);
      out.heads = heads.length;
      // The corner only counts while the camera's there: hidden or full frame, nothing's under a corner.
      const at = film.camera && film.cameraPlan ? window.HTMLExplainer.cameraAt(film.cameraPlan, t, film.frame) : null;
      const cam = film.camera && (!at || (at.o > 0 && at.w < film.W)) ? film.frame.cam : null;
      const textLeaves = [...stage.querySelectorAll('.x-scene *')].filter((e) => !e.children.length && e.textContent.trim() && seen(e) && !e.closest('.x-cam'));
      for (const el of textLeaves) {
        if (el.closest('.hk-stack')) continue; // laid out at the frame's size and pushed back
        const b = el.getBoundingClientRect();
        if (b.width < 2) continue;
        if (b.left < 16 - 0.5 || b.right > film.W - 16 + 0.5 || b.top < 0 || b.bottom > film.H) out.edges.push({ what: name(el), text: el.textContent.trim().slice(0, 24) });
        if (cam && b.right > cam.x && b.left < cam.x + cam.w && b.bottom > cam.y && b.top < cam.y + cam.h) out.camera.push({ what: name(el), text: el.textContent.trim().slice(0, 24) });
      }
      return out;
    }, { scale, film, t });
    for (const p of r.pictures) { const q = found.pictures.get(p.what); if (!q || p.s > q.s) found.pictures.set(p.what, { ...p, scene: s.id, t: +t.toFixed(2) }); }
    for (const p of r.soft) { const q = found.soft.get(s.id); if (!q || p.s > q.s) found.soft.set(s.id, { ...p, t: +t.toFixed(2) }); }
    if (r.heads > 1) found.heads.push(`${s.id} at ${t.toFixed(2)}: ${r.heads} headlines`);
    for (const p of r.edges) found.edges.set(s.id + ' ' + p.text, { ...p, scene: s.id, t: +t.toFixed(2) });
    for (const p of r.camera) found.camera.set(s.id + ' ' + p.text, { ...p, scene: s.id, t: +t.toFixed(2) });
  }
}
// The same t, drawn after going elsewhere, must be the same picture.
const mid = film.scenes[Math.floor(film.scenes.length / 2)];
const shot = async (t) => {
  await page.evaluate((x) => window.__frame(x), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.screenshot({ type: 'png' });
};
const T = (mid.a + mid.b) / 2;
await shot(T);
await page.waitForTimeout(400);
const h1 = await shot(T);
await shot(mid.a + 0.1);
const h2 = await shot(T);
await browser.close();
/** How far apart two PNGs are, in dB: Infinity when they're the same bytes. */
function apart(a, b) {
  if (a.equals(b)) return Infinity;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-film-'));
  fs.writeFileSync(path.join(dir, 'a.png'), a);
  fs.writeFileSync(path.join(dir, 'b.png'), b);
  const out = spawnSync('ffmpeg', ['-hide_banner', '-i', path.join(dir, 'a.png'), '-i', path.join(dir, 'b.png'), '-lavfi', 'psnr', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  fs.rmSync(dir, { recursive: true, force: true });
  const m = /average:([\d.]+|inf)/.exec(out);
  return m ? (m[1] === 'inf' ? Infinity : +m[1]) : 0;
}
const same = apart(h1, h2);

let bad = 0;
const fail = (line) => { bad++; console.log('  FAIL', line); };
console.log(`${u.searchParams.get('look') || film.look} · ${film.shape} · camera ${film.camera ? 'on' : 'off'} · ${film.scenes.length} scenes`);
const pics = [...found.pictures.values()].sort((a, b) => b.s - a.s);
console.log('pictures', pics.length ? pics.slice(0, 4).map((p) => `${p.what} ${p.s}`).join(', ') : 'none');
for (const p of pics) if (p.s > 2.0) fail(`${p.what} reads ${p.s} (${p.w} px wide) in ${p.scene} at ${p.t}: enlarged past its pixels`);
console.log('soft', found.soft.size ? '' : 'clean');
for (const [k, v] of found.soft) fail(`${k} at ${v.t}: ${v.what} drawn ${v.s}× its layout size under 3D`);
console.log('headlines', found.heads.length ? '' : 'one at a time');
for (const l of found.heads) fail(l);
console.log('edges', found.edges.size ? '' : 'clear');
for (const [, v] of found.edges) fail(`${v.scene} at ${v.t}: “${v.text}” (${v.what}) cut by the frame or within 16 px of its side`);
if (film.camera) {
  console.log('camera', found.camera.size ? '' : 'corner clear');
  for (const [, v] of found.camera) fail(`${v.scene} at ${v.t}: “${v.text}” (${v.what}) under the camera`);
}
console.log('repeat', same >= 60 ? 'the same picture' : '');
if (same < 60) fail(`${mid.id} at ${T.toFixed(2)} drew differently the second time (${same.toFixed(1)} dB): something keeps its own time`);
for (const e of errors) fail('page error: ' + e);
console.log(bad ? `${bad} to fix` : 'all clear');
process.exitCode = bad ? 1 : 0;
