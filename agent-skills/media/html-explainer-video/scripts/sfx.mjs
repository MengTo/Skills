#!/usr/bin/env node
// The film's sound cues (window.SFX: [t, name, duration?], t being the frame the
// thing happens) as placed, levelled takes from sounds/: each role has a measured
// sync point (a click leads the picture by 11 ms, a pop-in lands 30 ms after, a
// whoosh's peak lands 37 ms after), a level over the music bed and a smallest gap
// in a run. A big sound swallows a small one within 70 ms.
//
//   sfx.mjs <page.html> [--out sfx.json] [--assets assets.json]
//
// Prints the rate; about 1 a second is the aim, and never more than two in 150 ms.
// With --assets (each take's file → its asset id in Fil, from upload_file) it
// also writes sfx-commands.json: the edit_video commands, 60 to a call.
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const { values: o, positionals } = parseArgs({ allowPositionals: true, options: { out: { type: 'string', default: 'sfx.json' }, assets: { type: 'string' }, lane: { type: 'string' } } });
if (positionals.length !== 1) { console.log('sfx.mjs <page.html> [--out sfx.json] [--assets assets.json]'); process.exit(1); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = JSON.parse(fs.readFileSync(path.join(HERE, '../sounds/kit.json'), 'utf8')).roles;

// What each moment is, by its name in the cues.
const MAP = {
  click: 'click', button: 'click', toggle: 'click', tap: 'land.light', key: 'key.return', typing: 'key',
  'pop-soft': 'pop', pop: 'land', drop: 'land', message: 'pop', notify: 'click.confirm', success: 'click.confirm',
  ting: 'bell', chime: 'bell', sparkle: 'bell', blip: 'tick.crisp', scroll: 'tick.crisp',
  'whoosh-soft': 'whoosh.short', whoosh: 'whoosh.short', swish: 'whoosh.short', swipe: 'whoosh.short',
  'whoosh-heavy': 'whoosh.long', riser: 'riser', 'riser-short': 'riser', 'reverse-whoosh': 'swell',
  snap: 'snap', shutter: 'snap', hit: 'hit', impact: 'hit', sub: 'drop',
};
// Accents win over what lands right beside them.
const RANK = { hit: 9, drop: 9, 'whoosh.long': 8, swell: 7, riser: 7, bell: 6, 'click.confirm': 6, 'whoosh.short': 5, land: 5, snap: 5, pop: 4, click: 4, 'key.return': 3, key: 2, 'land.light': 2, 'tick.crisp': 1 };
const BELLS = ['A4', 'C5', 'E5'];

async function readCues(page0) {
  const req = createRequire(path.join(process.cwd(), 'x.js'));
  let chromium;
  for (const n of ['playwright', 'playwright-core']) {
    try { const m = await import(n); chromium = m.chromium || m.default.chromium; break; } catch {}
    try { const m = await import(pathToFileURL(req.resolve(n)).href); chromium = m.chromium || m.default.chromium; break; } catch {}
  }
  if (!chromium) throw new Error('playwright not found: npm i playwright && npx playwright install chromium');
  const b = await chromium.launch({ channel: 'chromium', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.addInitScript(() => { window.__driven = true; });
  await p.goto(/^[a-z]+:\/\//i.test(page0) ? page0 : pathToFileURL(path.resolve(page0)).href);
  const cues = await p.evaluate(() => window.SFX || []);
  await b.close();
  return cues;
}

let seed = 7;
const jitter = () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647 - 0.5) * 0.024; };

const raw = await readCues(positionals[0]);
let cues = [];
for (const row of raw) {
  const [t, name, dur] = row;
  const role = MAP[name];
  if (!role || !Number.isFinite(t)) { console.log('no role for', name); continue; }
  if (name === 'typing') {
    const n = Math.max(2, Math.floor((dur || 0.6) / 0.11));
    for (let i = 0; i < n; i++) cues.push([t + (i * (dur || 0.6)) / n + jitter(), 'key']);
  } else cues.push([t, role]);
}
cues.sort((a, b) => a[0] - b[0]);
let kept = [];
for (const [t, role] of cues) {
  const near = kept.filter((k) => Math.abs(k[0] - t) < 0.07);
  if (near.length && Math.max(...near.map((k) => RANK[k[1]])) >= RANK[role]) continue;
  kept = kept.filter((k) => !(Math.abs(k[0] - t) < 0.07));
  kept.push([t, role]);
}
const last = {}, turn = {};
const out = [];
for (let [t, role] of kept.sort((a, b) => a[0] - b[0])) {
  const r = KIT[role];
  const gap = (r.min_gap_ms || 0) / 1000;
  if (role in last && t - last[role] < gap) t = last[role] + gap;
  last[role] = t;
  const i = (turn[role] = (turn[role] ?? -1) + 1);
  const take = role === 'bell' ? r.takes.find((x) => x.file.includes(BELLS[i % BELLS.length])) || r.takes[0] : r.takes[i % r.takes.length];
  const sync = r.align === 'peak' ? take.peak : take.onset;
  out.push({ cue: +t.toFixed(3), role, file: take.file, at: +Math.max(0, t + r.offset_ms / 1000 - sync).toFixed(3), volume: take.volume, dur: take.dur });
}
fs.writeFileSync(o.out, JSON.stringify(out, null, 0));
const span = out.at(-1).cue - out[0].cue || 1;
let stacked = 0;
for (let i = 2; i < out.length; i++) if (out[i].cue - out[i - 2].cue < 0.15) stacked++;
console.log(`${raw.length} cues → ${out.length} sounds, ${(out.length / span).toFixed(2)} a second, ${stacked} stacked past two in 150 ms, ${new Set(out.map((x) => x.file)).size} takes -> ${o.out}`);
if (o.assets) {
  const ids = JSON.parse(fs.readFileSync(o.assets, 'utf8'));
  const cmds = out.map((x) => ({ op: 'add', file: ids[x.file], at: x.at, ...(o.lane ? { lane: o.lane } : {}), set: { volume: x.volume, sound: 'effect', under_voices: 0.9 } }));
  const missing = out.filter((x) => !ids[x.file]).map((x) => x.file);
  if (missing.length) console.log('not uploaded yet:', [...new Set(missing)].join(' '));
  fs.writeFileSync(path.join(path.dirname(o.out), 'sfx-commands.json'), JSON.stringify(cmds, null, 0));
  console.log(`${cmds.length} commands, ${Math.ceil(cmds.length / 60)} calls -> sfx-commands.json`);
}
