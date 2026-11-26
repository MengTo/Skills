#!/usr/bin/env node
// node video.mjs <list.json> <outDir> [--fps 30] [--w 1280 --h 720] [--port 5212] [--keep-frames]
// Real MP4s of the scenes: every frame drawn through Fil's scene runtime by the lab (40-frame chunks, 3 at a time, resumable),
// each scene's sound cues mixed in with ffmpeg (Fil's soundPlan and sound library), plus 00-reel.mp4 of them all in order.
// list.json: [{ "id", "name", "file": "<scene.html>" }, …] (the same list screening.mjs takes). About 12 minutes for 59 s at 720p.
// Keep the runner tab awake while it runs (see references/lab.md).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const [listFile, outArg] = a;
const REPO = process.env.FIL_REPO || path.join(os.homedir(), 'Downloads/Projects/facet-studio');
const { sceneCues, soundPlan } = await import(REPO + '/src/backend/video/sceneSound.js');
const OUT = path.resolve(outArg), FPS = +opt('--fps', 30), W = +opt('--w', 1280), H = +opt('--h', 720), PORT = opt('--port', process.env.LAB_PORT || 5212), CHUNK = 40, PAR = 3;
const base = path.dirname(path.resolve(listFile)), abs = (f) => (path.isAbsolute(f) ? f : path.join(base, f));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const SCENES = JSON.parse(fs.readFileSync(listFile, 'utf8')).map((r, k) => ({ ...r, file: abs(r.file), stem: `${String(k + 1).padStart(2, '0')}-${slug(r.name || r.id)}` }));
fs.mkdirSync(OUT + '/_frames', { recursive: true });
const durOf = (html) => +(/name="fil:duration" content="([\d.]+)"/.exec(html)?.[1] || 5);
const jobs = [];
for (const s of SCENES) {
  const n = Math.round(durOf(fs.readFileSync(s.file, 'utf8')) * FPS), dir = `${OUT}/_frames/${s.stem}`; fs.mkdirSync(dir, { recursive: true });
  for (let i0 = 0; i0 < n; i0 += CHUNK) {
    const idx = []; for (let i = i0; i < Math.min(n, i0 + CHUNK); i++) idx.push(i);
    if (!idx.every((i) => fs.existsSync(`${dir}/${String(i).padStart(5, '0')}.jpg`))) jobs.push({ s, dir, idx });
  }
}
console.log(jobs.length, 'chunks to render');
let done = 0;
async function run(job, tries = 0) {
  const tmp = job.dir + '/_c' + job.idx[0], times = job.idx.map((i) => Math.round((i / FPS) * 10000) / 10000);
  try {
    const r = await (await fetch(`http://127.0.0.1:${PORT}/render`, { method: 'POST', body: JSON.stringify({ file: job.s.file, out: tmp, times, w: W, h: H }) })).json();
    if (r.error || !r.frames || r.frames.length !== times.length || r.frames.some((f) => !f)) throw new Error(r.error || 'missing frames');
    r.frames.forEach((f, k) => fs.renameSync(f, `${job.dir}/${String(job.idx[k]).padStart(5, '0')}.jpg`));
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`${++done}/${jobs.length} ${job.s.stem} ${job.idx[0]}-${job.idx.at(-1)}`);
  } catch (e) {
    if (tries < 3) { console.log('retry', job.s.stem, job.idx[0], String(e.message || e)); return run(job, tries + 1); }
    throw e;
  }
}
const queue = [...jobs];
await Promise.all(Array.from({ length: PAR }, async () => { while (queue.length) await run(queue.shift()); }));
const parts = [];
for (const s of SCENES) {
  const html = fs.readFileSync(s.file, 'utf8'), dur = durOf(html);
  const plan = soundPlan([{ at: 0, dur, cues: sceneCues(html, dur) }], dur, 'dense');
  const args = ['-nostdin', '-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${OUT}/_frames/${s.stem}/%05d.jpg`, '-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo'];
  plan.forEach((c) => args.push('-i', `${REPO}/public/video-kit/3/sfx/${c.id}.mp3`));
  const fl = plan.map((c, k) => `[${k + 2}:a]aresample=48000,adelay=${Math.round(c.at * 1000)}:all=1,volume=${c.vol}[s${k}]`);
  fl.push(`[1:a]${plan.map((_, k) => `[s${k}]`).join('')}amix=inputs=${plan.length + 1}:normalize=0:duration=first,atrim=0:${dur}[a]`);
  args.push('-filter_complex', fl.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(dur), `${OUT}/${s.stem}.mp4`);
  execFileSync('ffmpeg', args); parts.push(`${OUT}/${s.stem}.mp4`);
  console.log('encoded', s.stem, dur + ' s,', plan.length, 'sounds');
}
fs.writeFileSync(OUT + '/_list.txt', parts.map((p) => `file '${p}'`).join('\n'));
execFileSync('ffmpeg', ['-nostdin', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', OUT + '/_list.txt', '-c', 'copy', '-movflags', '+faststart', OUT + '/00-reel.mp4']);
fs.rmSync(OUT + '/_list.txt'); if (!a.includes('--keep-frames')) fs.rmSync(OUT + '/_frames', { recursive: true, force: true });
console.log('reel done:', OUT + '/00-reel.mp4');
