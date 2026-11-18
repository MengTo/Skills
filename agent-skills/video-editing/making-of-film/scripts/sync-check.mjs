// sync-check.mjs <twin render.mp4> <film voice> <film/twin.js>
// Lip-sync check for the digital twin: the twin render's own audio (what HeyGen moved his mouth to) against the
// film's voice, stretch by stretch (twin.js's S: [film from, film to, seconds into the render at `from`]), as 10 ms
// energy envelopes cross-correlated over ±400 ms. "lag 0 ms, r 1.00" = his mouth is on the film's own words.
// From the Greymourn tutorial (draft 4g): 0 ms, r 1.00 on all eight stretches.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [render, voice, twinjs] = process.argv.slice(2);
if (!twinjs) { console.log('sync-check.mjs <twin render.mp4> <film voice> <film/twin.js>'); process.exit(1); }
const src = fs.readFileSync(twinjs, 'utf8');
const S = JSON.parse(src.match(/const S = (\[[\s\S]*?\]);/)[1].replace(/\s/g, '').replace(',]', ']'));
const len = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
const vEnd = len(voice) - 0.05;
const pcm = (file, at, dur) => { const b = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(at), '-t', String(dur), '-i', file, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 }); return new Int16Array(b.buffer, b.byteOffset, b.length >> 1); };
const env = (x) => { const n = Math.floor(x.length / 80), e = new Float64Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < 80; j++) s += x[i * 80 + j] ** 2; e[i] = Math.log1p(Math.sqrt(s / 80)); } const m = e.reduce((a, b) => a + b, 0) / n; return e.map((v) => v - m); };
for (const [from, to, off] of S) {
  const dur = Math.min(to, vEnd) - from;
  const a = env(pcm(voice, from, dur)), b = env(pcm(render, off, dur));
  let best = -1e9, lag = 0;
  for (let L = -40; L <= 40; L++) { let s = 0; for (let i = 0; i < a.length; i++) { const j = i + L; if (j >= 0 && j < b.length) s += a[i] * b[j]; } if (s > best) { best = s; lag = L; } }
  let na = 0, nb = 0; for (const v of a) na += v * v; for (const v of b) nb += v * v;
  console.log(`${from.toFixed(2)}–${to.toFixed(2)}  lag ${(lag * 10).toString().padStart(4)} ms  r ${(best / Math.sqrt(na * nb)).toFixed(2)}`);
}
