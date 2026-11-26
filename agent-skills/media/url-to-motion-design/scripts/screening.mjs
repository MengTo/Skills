#!/usr/bin/env node
// node screening.mjs <list.json> <out.html> [--title "Paper and Galaxy Screening"] [--group "Paper and galaxy, in film order"] [--canvas <url>]
// One self-contained page that plays every scene live at full speed with its sound cues (Fil's soundPlan and sound library),
// thumbnails and sounds inlined, for an Artifact (no doctype or head: the Artifact publish wraps it). Test it on localhost first.
// list.json: [{ "id", "name", "file": "<scene.html>", "final": "<last frame .jpg>", "score": 8, "judges": "8, 8", "good": "…", "weak": "…" }, …]
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname), lab = path.join(path.dirname(here), 'lab');
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const [listFile, outFile] = a;
const REPO = process.env.FIL_REPO || path.join(os.homedir(), 'Downloads/Projects/facet-studio');
const { sceneCues, soundPlan } = await import(REPO + '/src/backend/video/sceneSound.js');
const rows = JSON.parse(fs.readFileSync(listFile, 'utf8')), base = path.dirname(path.resolve(listFile));
const abs = (f) => (path.isAbsolute(f) ? f : path.join(base, f));
const GROUP = opt('--group', 'In film order'), S = [], SC = {}, TH = {}, SX = {}, used = new Set();
for (const r of rows) {
  const html = fs.readFileSync(abs(r.file), 'utf8'); SC[r.id] = html;
  const dur = +(/name="fil:duration" content="([\d.]+)"/.exec(html)?.[1] || 5);
  const plan = soundPlan([{ at: 0, dur, cues: sceneCues(html, dur) }], dur, 'dense'); plan.forEach((c) => used.add(c.id));
  S.push({ id: r.id, name: r.name, style: GROUP, score: r.score ?? '–', judges: r.judges || '', good: String(r.good || '').replace(/\.+$/, ''), weak: String(r.weak || '').replace(/\.+$/, ''), dur, cues: plan.map((c) => ({ id: c.id, at: c.at, vol: c.vol })) });
  TH[r.id] = 'data:image/jpeg;base64,' + execFileSync('magick', [abs(r.final), '-resize', '200x', '-quality', '74', 'jpg:-']).toString('base64');
}
for (const id of used) SX[id] = fs.readFileSync(`${REPO}/public/video-kit/3/sfx/${id}.mp3`).toString('base64');
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');
let page = fs.readFileSync(path.join(lab, 'screening.html'), 'utf8');
const swap = (from, to) => { if (!page.includes(from)) throw new Error('not in page: ' + from); page = page.split(from).join(to); };
swap('<title>Motion Scenes Screening</title>', `<title>${opt('--title', 'Motion Scenes Screening')}</title>`);
swap('/*MANIFEST*/[]', js(S));
swap('const $ = (id)', `const SC = ${js(SC)};\nconst TH = ${js(TH)};\nconst SX = ${js(SX)};\nconst bytes = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0)).buffer;\nconst $ = (id)`);
swap('src="thumbs/${s.id}.jpg"', 'src="${TH[s.id]}"');
swap("fetch('sfx/' + id + '.mp3').then((r) => r.arrayBuffer()).then((d) => ctx.decodeAudioData(d))", 'ctx.decodeAudioData(bytes(SX[id]))');
swap("old.src = 'about:blank';", "old.removeAttribute('srcdoc'); old.src = 'about:blank';");
swap('    warm(S[(i + 1) % S.length].id);\n', '');
swap("back.src = 'scenes/' + s.id + '.html';", 'back.srcdoc = SC[s.id];');
swap("frames[0].src = 'scenes/' + S[0].id + '.html';", 'frames[0].srcdoc = SC[S[0].id];');
swap("$('score').textContent = s.score + '/10';", "$('score').textContent = s.score + '/10' + (s.judges ? ' · judges ' + s.judges : '');");
swap('<span class="time" id="time">0.0 / 5.0 s</span>', `<span class="time" id="time">0.0 / ${S[0].dur.toFixed(1)} s</span>`);
const canvas = opt('--canvas'), where = canvas ? `as it is now on the <a href="${canvas}">canvas</a>` : 'as it is now';
swap(/<p class="foot">[\s\S]*?<\/p>/.exec(page)[0], `<p class="foot">${S.length} motion scenes for Fil, played live from their own pages in your browser ${where}, with the sounds each one marks. Scores come from two fresh blind judges who saw 12 stills, the lower score counting; nobody has scored them at speed. Keys: space replays, left and right change scene.</p>`);
fs.writeFileSync(outFile, page);
console.log(S.length, 'scenes,', used.size, 'sounds,', (fs.statSync(outFile).size / 1048576).toFixed(2), 'MB →', outFile);
