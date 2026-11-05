#!/usr/bin/env node
// node render.mjs <scene.html> <outBase> [--mode light|dark] [--pair <fontPair>] [--t key=words]… [--times a,b,…] [--port 5212]
// Renders through the lab (lab/server.mjs + its runner tab). The 12 sheet frames follow the scene's own length (fil:duration):
// 4, 12, 20, 28 / 36, 44, 52, 60 / 68, 76, 84, 98 % of it (for 5 s: 0.2 … 4.2, 4.9).
// Writes <outBase>/f*.jpg, <outBase>.jpg (a 4×3 sheet, left to right, top to bottom) and <outBase>-final.jpg (the last frame).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const a = process.argv.slice(2); const file = path.resolve(a[0]), base = path.resolve(a[1]);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const t = {}; a.forEach((x, i) => { if (x === '--t') { const [k, ...r] = a[i + 1].split('='); t[k] = r.join('='); } });
const PORT = opt('--port', process.env.LAB_PORT || 5212);
const dur = +(fs.readFileSync(file, 'utf8').match(/name="fil:duration"\s+content="([\d.]+)"/)?.[1] || 5);
const FR = [0.04, 0.12, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68, 0.76, 0.84, 0.98];
const times = opt('--times') ? opt('--times').split(',').map(Number) : FR.map((f) => Math.round(f * dur * 100) / 100);
fs.rmSync(base, { recursive: true, force: true });
const r = await (await fetch(`http://127.0.0.1:${PORT}/render`, { method: 'POST', body: JSON.stringify({ file, out: base, times, mode: opt('--mode'), pair: opt('--pair'), t, w: +opt('--w', 1280), h: +opt('--h', 720) }) })).json();
if (r.error) { console.error('RENDER ERROR', r.error); process.exit(1); }
const cols = times.length <= 6 ? 3 : 4, tw = 480, th = Math.round(tw * (+opt('--h', 720) / +opt('--w', 1280)));
const rows = []; for (let i = 0; i < r.frames.length; i += cols) { const row = base + `/_r${i}.jpg`; execFileSync('magick', [...r.frames.slice(i, i + cols), '-resize', `${tw}x${th}`, '-bordercolor', '#333', '-border', '3', '+append', row]); rows.push(row); }
execFileSync('magick', [...rows, '-background', '#333', '-append', '-quality', '86', base + '.jpg']); rows.forEach((x) => fs.rmSync(x));
fs.copyFileSync(r.frames[r.frames.length - 1], base + '-final.jpg');
console.log(JSON.stringify({ sheet: base + '.jpg', final: base + '-final.jpg', duration: dur, times, startMs: r.startMs, avgMs: r.avgMs }));
