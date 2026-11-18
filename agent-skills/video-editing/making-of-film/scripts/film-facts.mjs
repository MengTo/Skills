#!/usr/bin/env node
// film-facts.mjs <film.html> [--yt]
// The numbers a making-of film is checked and released by, read from the page itself (headless, no clicks):
// its length, every scene's start and length, the chapters as YouTube wants them (from window.CHAPTERS:
// [[seconds, 'title'], …]), and how much of the film the camera is on screen, by layout (from the engine's
// cameraPlan), with the twin's stretches (window.TWIN) if there are any.
// --yt prints only the chapter list, ready to paste into a description.
// Checks it reports: the first chapter at 0:00, every chapter at least 10 s (YouTube's rule), at least three.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.log('film-facts.mjs <film.html> [--yt]'); process.exit(1); }
const yt = args.includes('--yt');

async function chromium() {
  const tries = [(process.env.PLAYWRIGHT_CORE || 'playwright'), 'playwright', 'playwright-core'];
  for (const n of tries) try { const m = await import(n); return m.chromium || m.default.chromium; } catch {}
  const req = createRequire(path.join(process.cwd(), 'x.js'));
  for (const n of ['playwright', 'playwright-core']) try { const m = await import(pathToFileURL(req.resolve(n)).href); return m.chromium || m.default.chromium; } catch {}
  throw new Error('playwright not found: npm i playwright && npx playwright install chromium');
}
const cft = process.env.CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await (await chromium()).launch({ headless: true, ...(fs.existsSync(cft) ? { executablePath: cft } : {}), args: ['--allow-file-access-from-files'] });
const mmss = (x) => Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0');
try {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.addInitScript(() => { window.__driven = true; });
  await p.goto(pathToFileURL(path.resolve(file)).href + '?bg=off');
  await p.waitForFunction('window.__film !== undefined', null, { timeout: 60000 });
  const F = await p.evaluate(() => ({ film: window.__film && { a: window.__film.a, b: window.__film.b, scenes: window.__film.scenes, plan: window.__film.cameraPlan }, ch: window.CHAPTERS || null, twin: window.TWIN || null }));
  const { a, b: end, scenes, plan } = F.film;
  const ch = (F.ch || []).map(([t, name]) => [Math.max(0, t), name]);
  if (yt) { for (const [t, name] of ch) console.log(`${mmss(t)} ${name}`); process.exitCode = 0; }
  else {
    console.log(`length ${end.toFixed(2)} s (${mmss(end)}), ${scenes.length} scenes`);
    for (const s of scenes) console.log(`  ${s.id.padEnd(10)} ${s.a.toFixed(2).padStart(7)}  ${(s.b - s.a).toFixed(2).padStart(6)} s`);
    console.log(`\nchapters (${ch.length})`);
    ch.forEach(([t, name], i) => { const next = i + 1 < ch.length ? ch[i + 1][0] : end; console.log(`  ${mmss(t).padStart(5)} ${name}  (${(next - t).toFixed(1)} s)`); });
    const warn = [];
    if (!ch.length) warn.push('no window.CHAPTERS on the page');
    else {
      if (Math.floor(ch[0][0]) !== 0) warn.push('the first chapter is not at 0:00');
      if (ch.length < 3) warn.push('YouTube needs at least three chapters');
      ch.forEach(([t, name], i) => { const next = i + 1 < ch.length ? ch[i + 1][0] : end; if (next - t < 10) warn.push(`"${name}" is ${(next - t).toFixed(1)} s (YouTube's minimum is 10)`); });
    }
    if (plan && plan.length) {
      const sum = {};
      plan.forEach(([t, lay], i) => { const from = Math.max(a, t), to = Math.min(end, i + 1 < plan.length ? plan[i + 1][0] : end); if (to > from) sum[lay] = (sum[lay] || 0) + (to - from); });
      const on = Object.entries(sum).filter(([k]) => k !== 'hidden').reduce((s, [, v]) => s + v, 0);
      console.log(`\ncamera on screen ${on.toFixed(1)} s = ${((100 * on) / (end - a)).toFixed(1)} % of the film`);
      for (const [k, v] of Object.entries(sum)) console.log(`  ${k.padEnd(7)} ${v.toFixed(1).padStart(6)} s  ${((100 * v) / (end - a)).toFixed(1).padStart(5)} %`);
    } else console.log('\nno camera plan (camera off)');
    if (F.twin && F.twin.length) {
      const tw = F.twin.reduce((s, k) => s + (Math.min(k.to, end) - k.from), 0);
      console.log(`\ntwin stretches ${F.twin.length}, ${tw.toFixed(1)} s = ${((100 * tw) / (end - a)).toFixed(1)} %: ` + F.twin.map((k) => `${k.from.toFixed(2)}–${Math.min(k.to, end).toFixed(2)}`).join(', '));
    }
    if (warn.length) { console.log('\nCHECK:'); for (const w of warn) console.log('  ' + w); }
  }
} finally { await b.close(); }
