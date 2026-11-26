#!/usr/bin/env node
// A local preview of the whole film as the edit will play it: one pass of the
// page with its captions (and a stand-in where the camera goes, when it's on),
// mixed with the voice, the music bed and the placed sounds, at -14 LUFS, with a
// contact sheet beside it. Judge it here: a change costs a minute, an export a wait.
//
//   preview.mjs <page.html> --out preview.mp4 [--voice voice.mp3] [--music bed.mp3] [--sfx sfx.json]
//               [--look NAME] [--shape 16:9] [--camera on] [--fps 30] [--scale 1] [--no-captions] [--video film.mp4]
//
// --video skips the render and mixes over a picture you already have.
import { execFileSync, spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string', default: 'preview.mp4' }, voice: { type: 'string' }, music: { type: 'string' }, sfx: { type: 'string' }, video: { type: 'string' },
    look: { type: 'string' }, shape: { type: 'string' }, camera: { type: 'string' }, fps: { type: 'string', default: '30' }, scale: { type: 'string', default: '1' },
    'no-captions': { type: 'boolean' }, quality: { type: 'string' }, 'music-volume': { type: 'string', default: '0.07' },
  },
});
if (positionals.length !== 1) { console.log('preview.mjs <page.html> --out preview.mp4 [--voice v.mp3] [--music m.mp3] [--sfx sfx.json] [--look --shape --camera]'); process.exit(1); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(o.out);
const stem = out.replace(/\.[a-z0-9]+$/i, '');
const silent = o.video ? path.resolve(o.video) : stem + '-picture.mp4';

if (!o.video) {
  const args = [path.join(HERE, 'render.mjs'), positionals[0], '--whole', '--fps', o.fps, '--scale', o.scale, '--out', silent];
  if (!o['no-captions']) args.push('--captions', 'on');
  for (const k of ['look', 'shape', 'camera', 'quality']) if (o[k]) args.push('--' + k, o[k]);
  const r = spawnSync('nice', ['-n', '10', process.execPath, ...args], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', silent]).toString());
const inputs = ['-i', silent];
const chains = [];
const mix = [];
let n = 1;
if (o.voice) {
  inputs.push('-i', path.resolve(o.voice));
  chains.push(`[${n}:a]aformat=channel_layouts=stereo[va]`);
  mix.push('[va]');
  n++;
}
if (o.music) {
  inputs.push('-i', path.resolve(o.music));
  chains.push(`[${n}:a]aformat=channel_layouts=stereo,volume=${o['music-volume']},atrim=0:${dur.toFixed(3)},afade=t=out:st=${Math.max(0, dur - 1.5).toFixed(3)}:d=1.5[ma]`);
  mix.push('[ma]');
  n++;
}
if (o.sfx) {
  const sounds = path.join(HERE, '../sounds');
  for (const x of JSON.parse(fs.readFileSync(o.sfx, 'utf8'))) {
    inputs.push('-i', path.join(sounds, x.file));
    const ms = Math.round(x.at * 1000);
    chains.push(`[${n}:a]aformat=channel_layouts=stereo,volume=${x.volume},adelay=${ms}|${ms}[x${n}]`);
    mix.push(`[x${n}]`);
    n++;
  }
}
const args = ['-y', '-loglevel', 'error', ...inputs];
if (mix.length) {
  chains.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:duration=longest,atrim=0:${dur.toFixed(3)},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`);
  args.push('-filter_complex', chains.join(';'), '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '160k');
} else args.push('-map', '0:v');
args.push('-c:v', 'copy', '-movflags', '+faststart', '-t', dur.toFixed(3), out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-vf', `fps=1/${(dur / 24).toFixed(3)},scale=360:-1,tile=6x4:padding=3`, '-frames:v', '1', '-update', '1', stem + '-sheet.jpg']);
console.log('preview ->', out, (fs.statSync(out).size / 1e6).toFixed(1) + ' MB,', dur.toFixed(1) + ' s; sheet ->', stem + '-sheet.jpg');
