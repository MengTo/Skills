#!/usr/bin/env node
// A film page (HTMLExplainer.film) to pictures: every frame is __frame(t), a
// wait for paint and a screenshot, so it's exact whatever the machine's speed.
//
//   render.mjs <page.html | URL> [options]
//     --scene hook,step1 | all   one MP4 per scene into --out (a folder), for the edit
//     --whole                    the whole film as one MP4 at --out (a file), for a preview
//     --stills 0,1.2,33.4        stills at those film seconds, and a sheet, into --out
//     --look NAME --shape 16:9 --camera on|off --captions on   any of the film's inputs
//     --fps 60 --scale 2         60 fps at 2× for the edit; 30 and 1 for a draft
//     --alpha                    see-through background, ProRes 4444 .mov
//     --test                     prints how long a frame takes, draws 5, and stops
//
// A still is reached by stepping there, so anything that depends on the frame
// before it would show. Uses Playwright's own Chromium, never your Chrome:
// npm i playwright && npx playwright install chromium, in this folder or the one
// you run from. Films are H.264 yuv420p, BT.709 limited range, +faststart. Run
// long renders niced, one at a time, in the background.
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    scene: { type: 'string' }, whole: { type: 'boolean' }, stills: { type: 'string' },
    look: { type: 'string' }, shape: { type: 'string' }, camera: { type: 'string' }, captions: { type: 'string' },
    fps: { type: 'string' }, scale: { type: 'string' }, alpha: { type: 'boolean' }, out: { type: 'string' },
    cols: { type: 'string', default: '4' }, width: { type: 'string', default: '480' }, test: { type: 'boolean' }, quality: { type: 'string' },
  },
});
if (positionals.length !== 1 || !(o.scene || o.whole || o.stills || o.test)) {
  const head = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1).filter((l) => l.startsWith('//')).map((l) => l.slice(3));
  console.log(head.join('\n'));
  process.exit(1);
}

async function chromium() {
  for (const n of ['playwright', 'playwright-core']) try { const m = await import(n); return m.chromium || m.default.chromium; } catch {}
  const req = createRequire(path.join(process.cwd(), 'x.js'));
  for (const n of ['playwright', 'playwright-core']) try { const m = await import(pathToFileURL(req.resolve(n)).href); return m.chromium || m.default.chromium; } catch {}
  throw new Error('playwright not found: npm i playwright && npx playwright install chromium');
}

const page0 = positionals[0];
const base = /^[a-z]+:\/\//i.test(page0) ? page0 : pathToFileURL(path.resolve(page0)).href;
const urlFor = (extra = {}) => {
  const u = new URL(base);
  for (const k of ['look', 'shape', 'camera', 'captions']) if (o[k]) u.searchParams.set(k, o[k]);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.href;
};

const scale = +(o.scale || (o.stills ? 1 : 2));
const fps = +(o.fps || 60);
const browser = await (await chromium()).launch({
  channel: 'chromium',
  args: ['--hide-scrollbars', '--mute-audio', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-lcd-text', '--allow-file-access-from-files'],
});

/** A page at the film's own size, ready for its first frame. */
async function open(extra) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: scale, bypassCSP: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  page.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
  await page.addInitScript(() => { window.__driven = true; });
  await page.goto(urlFor(extra), { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction('window.__film !== undefined', null, { timeout: 90000 });
  const film = await page.evaluate(() => window.__film);
  await page.setViewportSize({ width: film.W, height: film.H });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.evaluate(() => window.__ready());
  if (o.alpha) await page.addStyleTag({ content: 'html,body,#stage,.x-scene{background:transparent!important}' });
  return { page, film, ctx };
}

const paint = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/** Frames a to b into an MP4 (or a .mov with --alpha). */
async function encode(page, a, b, file) {
  const n = Math.max(1, Math.round((b - a) * fps));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const crf = o.quality || (scale >= 2 ? '17' : '20');
  const enc = o.alpha
    ? ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', file]
    : ['-vf', 'scale=out_range=tv:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', file];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', o.alpha ? 'png' : 'mjpeg', '-framerate', String(fps), '-i', '-', ...enc], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error('ffmpeg exited ' + c)) : res())));
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((x) => window.__frame(x), a + i / fps);
    const buf = await page.screenshot(o.alpha ? { type: 'png', omitBackground: true } : { type: 'jpeg', quality: 97 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (fps * 4) === 0) console.log(path.basename(file), `${i}/${n}`, Math.round((Date.now() - t0) / (i + 1)) + ' ms/frame');
  }
  ff.stdin.end();
  await done;
  console.log('done', file, (fs.statSync(file).size / 1e6).toFixed(1) + ' MB');
}

try {
  if (o.test) {
    const { page, film } = await open();
    const t0 = Date.now();
    for (let i = 0; i < 5; i++) {
      await page.evaluate((x) => window.__frame(x), film.a + i * 2);
      await page.screenshot({ type: 'jpeg', quality: 97 });
    }
    console.log(`${film.W} × ${film.H} at ${scale}×:`, Math.round((Date.now() - t0) / 5), 'ms a frame;', film.scenes.map((s) => `${s.id} ${s.a.toFixed(2)}–${s.b.toFixed(2)}`).join(' · '));
  } else if (o.stills) {
    const out = o.out || 'stills';
    fs.mkdirSync(out, { recursive: true });
    const { page, film } = await open();
    const list = o.stills.split(',').map(Number).sort((x, y) => x - y);
    for (const f of fs.readdirSync(out)) if (/^t\d.*\.jpg$/.test(f)) fs.rmSync(path.join(out, f));
    let at = 0;
    for (const t of list) {
      for (; at < t; at += 1 / 15) await page.evaluate((x) => window.__frame(x), at);
      await page.evaluate((x) => window.__frame(x), t);
      at = t;
      await paint(page);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 88 });
    }
    const cols = Math.min(+o.cols, list.length);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(out, 't*.jpg'), '-vf', `scale=${o.width}:-1,tile=${cols}x${Math.ceil(list.length / cols)}:padding=4:color=0x777777`, '-frames:v', '1', '-update', '1', path.join(out, 'sheet.jpg')]);
    console.log('stills', list.length, '->', path.join(out, 'sheet.jpg'), `${film.W} × ${film.H}`);
  } else if (o.whole) {
    const { page, film } = await open();
    await encode(page, film.a, film.b, path.resolve(o.out || 'film.mp4'));
  } else {
    const out = path.resolve(o.out || 'scenes');
    const { page, film, ctx } = await open();
    await ctx.close();
    const names = o.scene === 'all' ? film.scenes.map((s) => s.id) : o.scene.split(',');
    for (const id of names) {
      const s = film.scenes.find((x) => x.id === id);
      if (!s) throw new Error('no scene ' + id);
      const one = await open({ scene: id });
      await encode(one.page, s.a, s.b, path.join(out, `${id}${o.alpha ? '.mov' : '.mp4'}`));
      await one.ctx.close();
    }
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
}
