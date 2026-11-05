#!/usr/bin/env node
// Two steps around picking the shots by eye.
//
// node shots.mjs scan <source.mp4> <dir>
//   Cut times (hard cuts at scene>0.25 and soft ones at >0.08) into <dir>/cuts.txt, and 1-frame-per-second contact sheets,
//   6×5 tiles per 30 s, into <dir>/sheets/1fps_<start>.jpg (tile k of a sheet is second start+k). Read every sheet.
//
// node shots.mjs pick <source.mp4> <picks.json> <dir>
//   picks.json: [{ "id": "pg-pile", "name": "Partner collage", "a": 24.3, "b": 33.5, "hero": 32.6, "what": "one line on what moves" }, …]
//   Writes, per pick: shots/<nn>-<id>.jpg (full-size hero still), clips/<nn>-<id>.mp4 (the shot, re-encoded), refs/<id>.jpg
//   (8 frames across the shot, for builders), and overview.jpg (3 columns of hero stills, labelled) plus README.md (a table).
//   Check every hero still by eye: a frame mid-transition (two captions crossfading, motion blur) needs another time.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync, spawnSync } from 'node:child_process';
const [cmd, src, a2, a3] = process.argv.slice(2);
const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', ...args]);
const FONT = '/System/Library/Fonts/Supplemental/Arial.ttf';
if (cmd === 'scan') {
  const dir = path.resolve(a2); fs.mkdirSync(dir + '/sheets', { recursive: true });
  // one pass on a small copy of the picture: every change with a scene score over 0.08, hard cuts over 0.25
  const scores = dir + '/scene-scores.txt';
  spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', src, '-an', '-vf', `scale=320:-2,select='gt(scene,0.08)',metadata=print:file=${scores}`, '-f', 'null', '-']);
  const marks = [...fs.readFileSync(scores, 'utf8').matchAll(/pts_time:([\d.]+)[\s\S]*?scene_score=([\d.]+)/g)].map((m) => ({ t: +(+m[1]).toFixed(2), s: +m[2] }));
  const hard = marks.filter((m) => m.s > 0.25).map((m) => m.t), soft = marks.filter((m) => m.s <= 0.25).map((m) => m.t);
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], { encoding: 'utf8' });
  fs.writeFileSync(dir + '/cuts.txt', `duration ${dur.toFixed(2)}\nhard ${hard.join(' ')}\nsoft ${soft.join(' ')}\n`);
  for (let s = 0; s < dur; s += 30) ff(['-ss', String(s), '-t', '30', '-i', src, '-vf', 'fps=1,scale=480:-1,tile=6x5:padding=4:color=white', '-frames:v', '1', '-q:v', '4', `${dir}/sheets/1fps_${String(s).padStart(4, '0')}.jpg`]);
  console.log(fs.readFileSync(dir + '/cuts.txt', 'utf8') + 'sheets: ' + fs.readdirSync(dir + '/sheets').length + ' in ' + dir + '/sheets');
} else if (cmd === 'pick') {
  const picks = JSON.parse(fs.readFileSync(a2, 'utf8')), dir = path.resolve(a3);
  for (const d of ['shots', 'clips', 'refs', '_t']) fs.mkdirSync(dir + '/' + d, { recursive: true });
  const rows = [];
  picks.forEach((p, k) => {
    const nn = String(k + 1).padStart(2, '0'), len = +(p.b - p.a).toFixed(2);
    ff(['-ss', String(p.hero), '-i', src, '-frames:v', '1', '-q:v', '2', `${dir}/shots/${nn}-${p.id}.jpg`]);
    ff(['-ss', String(p.a), '-to', String(p.b), '-i', src, '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', `${dir}/clips/${nn}-${p.id}.mp4`]);
    ff(['-ss', String(p.a), '-t', String(len), '-i', src, '-vf', `fps=8/${len},scale=480:-1,tile=4x2:padding=4:color=0x333333`, '-frames:v', '1', '-q:v', '3', `${dir}/refs/${p.id}.jpg`]);
    execFileSync('magick', [`${dir}/shots/${nn}-${p.id}.jpg`, '-resize', '640x360', '-gravity', 'southwest', '-background', '#111', '-splice', '0x36', '-fill', 'white', '-font', FONT, '-pointsize', '20', '-annotate', '+12+8', `${nn}  ${p.name}  ·  ${len} s`, `${dir}/_t/${nn}.jpg`]);
    const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    rows.push(`| ${nn} | ${p.id} | ${p.name} | ${mmss(p.a)}–${mmss(p.b)} (${p.a}–${p.b}) | ${len} s | ${p.what || ''} |`);
  });
  execFileSync('magick', ['montage', ...fs.readdirSync(dir + '/_t').sort().map((f) => `${dir}/_t/${f}`), '-font', FONT, '-tile', '3x', '-geometry', '+6+6', '-background', '#222', '-quality', '88', `${dir}/overview.jpg`]);
  fs.rmSync(dir + '/_t', { recursive: true, force: true });
  fs.writeFileSync(dir + '/README.md', `# Picked shots\n\nSource: ${src}\n\n| # | id | Shot | Time | Length | What moves |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\nshots/ = one full-size frame each; clips/ = the shot cut from the source (reference only, not ours to publish); refs/ = 8 frames across each shot for builders.\n`);
  console.log(`${picks.length} picks → ${dir} (overview.jpg, shots/, clips/, refs/, README.md)`);
} else { console.error('usage: node shots.mjs scan <video> <dir> | pick <video> <picks.json> <dir>'); process.exit(1); }
