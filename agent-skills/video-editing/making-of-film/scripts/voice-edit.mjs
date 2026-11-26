#!/usr/bin/env node
// Cuts sentences out of the voice, opens pauses in it and drops new takes into old lines, and
// moves every word time to match, so the scenes (timed by word names) follow without a change.
//   node voice-edit.mjs <project>/tools/voice-edits.json   (paths inside it are relative to that file)
// From the Greymourn tutorial (lothric/docs/tutorial/tools/voice-edits.json is a worked example).
// The words it reads are the film's clock: the voice file starts at film time 0 (the cold open's
// silence in front), so a word's time in the file is its time in the film.
// voice-edits.json: { "voice": "../film/voice-meng-v1.m4a", "words": "words-voice1.json",
//   "out": "../film/voice-d3.m4a", "wav": "<a .wav for the mix>",
//   "edits": [ { "cut": [a, b], "why": "…" }, { "gap": [at, seconds], "why": "…" },
//              { "replace": [a, b], "take": "<audio>", "from": [ta, tb], "words": "<take words.json>",
//                "len": seconds, "gain": dB, "why": "…" } ] }
// A cut takes out the audio from a to b (both inside pauses) and every word that starts in it;
// ("dropFrom": words that start from there are dropped too, where the word times run early);
// a gap puts that many seconds of silence at `at` (inside a pause). A replace puts the take's
// audio from ta to tb (both inside its pauses) where a to b was, its tempo changed so it lasts
// `len` (default: as it is; a len equal to b - a leaves every later word where it was), and
// gives the old words in a..b the take's times: a word the take says differently stays behind
// as a marker of no length, so every later word keeps its name (T.nine4 is still the fourth
// "nine" when "Twenty nine" becomes "Twenty seven"). Splices get 10 ms fades.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (!process.argv[2]) { console.log('voice-edit.mjs <voice-edits.json>'); process.exit(1); }
const cfgPath = path.resolve(process.argv[2]);
const here = path.dirname(cfgPath); // every relative path in the config is relative to the config
void fileURLToPath;
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const rel = (p) => (path.isAbsolute(p) ? p : path.join(here, p.replace(/^~(?=\/)/, process.env.HOME)));
const abs = (p) => (p.startsWith('~/') ? path.join(process.env.HOME, p.slice(2)) : rel(p));
const W = JSON.parse(fs.readFileSync(abs(cfg.words), 'utf8'));
const probe = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
const dur = probe(abs(cfg.voice));
const span = (e) => e.cut || e.replace;
const startOf = (e) => (span(e) ? span(e)[0] : e.gap[0]);
const edits = [...cfg.edits].sort((x, y) => startOf(x) - startOf(y));
for (const e of edits) if (e.replace) {
  e.len = e.len ?? e.from[1] - e.from[0];
  e.tempo = (e.from[1] - e.from[0]) / e.len;
  if (e.tempo < 0.85 || e.tempo > 1.15) throw new Error(`replace at ${e.replace[0]}: tempo ${e.tempo.toFixed(3)} is past ±15 %`);
  e.takeWords = JSON.parse(fs.readFileSync(abs(e.words), 'utf8')).filter((w) => w[1] >= e.from[0] && w[1] < e.from[1]);
}

// the audio as kept segments, inserted silences and takes, in order
const parts = [];
let at = 0;
for (const e of edits) {
  if (e.cut) { parts.push({ a: at, b: e.cut[0] }); at = e.cut[1]; }
  else if (e.replace) { parts.push({ a: at, b: e.replace[0] }); parts.push({ take: e }); at = e.replace[1]; }
  else { parts.push({ a: at, b: e.gap[0] }); parts.push({ silence: e.gap[1] }); at = e.gap[0]; }
}
parts.push({ a: at, b: dur });

// new time of an old one (null: inside a cut or a replace)
const map = (t) => {
  let shift = 0;
  for (const e of edits) {
    if (e.cut) { if (t >= e.cut[1]) shift -= e.cut[1] - e.cut[0]; else if (t >= (e.dropFrom ?? e.cut[0])) return null; }
    else if (e.replace) { if (t >= e.replace[1]) shift += e.len - (e.replace[1] - e.replace[0]); else if (t >= e.replace[0]) return null; }
    else if (t >= e.gap[0]) shift += e.gap[1];
  }
  return t + shift;
};
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9]/g, '');
const out = [];
let dropped = [];
const swapped = [];
for (let i = 0; i < W.length; i++) {
  const w = W[i];
  const rep = edits.find((e) => e.replace && w[1] >= e.replace[0] && w[1] < e.replace[1]);
  if (rep) {
    // the whole line at once: the old words in a..b against the take's words, in order
    const old = [];
    while (i < W.length && W[i][1] >= rep.replace[0] && W[i][1] < rep.replace[1]) old.push(W[i++]);
    i--;
    const s = map(rep.replace[0] - 1e-6) + 1e-6; // where the take starts in the new voice
    const tt = (x) => +(s + (x - rep.from[0]) / rep.tempo).toFixed(3);
    const nw = rep.takeWords;
    const paired = old.length === nw.length;
    old.forEach((o, k) => {
      if (paired && norm(o[0]) === norm(nw[k][0])) return;
      out.push([o[0], +s.toFixed(3), +s.toFixed(3), 'cut']);
    });
    nw.forEach((n, k) => {
      const keep = paired && norm(old[k][0]) === norm(n[0]);
      if (!keep) swapped.push(`${paired ? old[k][0] : '…'} -> ${n[0]}`);
      out.push([keep ? old[k][0] : n[0], tt(n[1]), +Math.max(tt(n[1]) + 0.05, tt(n[2])).toFixed(3)]);
    });
    continue;
  }
  const a = map(w[1]);
  // a cut word stays as a marker of no length where the cut is, so every later word keeps its
  // name (T.one4 is still the fourth "one") and no scene has to be renamed
  if (a == null) { dropped.push(w[0]); const c = edits.find((e) => e.cut && w[1] >= (e.dropFrom ?? e.cut[0]) && w[1] < e.cut[1]); const at = map(c.cut[1]); out.push([w[0], +at.toFixed(3), +at.toFixed(3), 'cut']); continue; }
  const b = map(w[2]) ?? a + 0.1;
  out.push([w[0], +a.toFixed(3), +Math.max(a + 0.05, b).toFixed(3)]);
}
// ffmpeg: trim each kept stretch with 10 ms fades at the splices, silence for the gaps, the takes
// at their tempo and gain, concat
const takes = [...new Set(edits.filter((e) => e.replace).map((e) => abs(e.take)))];
const fmt = 'aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
const f = [];
parts.forEach((p, i) => {
  if (p.silence) f.push(`anullsrc=r=48000:cl=stereo,atrim=0:${p.silence.toFixed(3)},${fmt}[p${i}]`);
  else if (p.take) {
    const e = p.take;
    const n = 1 + takes.indexOf(abs(e.take));
    f.push(`[${n}:a]atrim=${e.from[0].toFixed(3)}:${e.from[1].toFixed(3)},asetpts=PTS-STARTPTS,${fmt},atempo=${e.tempo.toFixed(5)},apad=whole_dur=${e.len.toFixed(3)},volume=${(e.gain || 0).toFixed(2)}dB,atrim=0:${e.len.toFixed(3)},afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, e.len - 0.01).toFixed(3)}:d=0.01[p${i}]`);
  } else {
    const len = p.b - p.a;
    f.push(`[0:a]atrim=${p.a.toFixed(3)}:${p.b.toFixed(3)},asetpts=PTS-STARTPTS,${fmt},afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, len - 0.01).toFixed(3)}:d=0.01[p${i}]`);
  }
});
f.push(parts.map((_, i) => `[p${i}]`).join('') + `concat=n=${parts.length}:v=0:a=1[out]`);
const wav = abs(cfg.wav);
fs.mkdirSync(path.dirname(wav), { recursive: true });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', abs(cfg.voice), ...takes.flatMap((t) => ['-i', t]), '-filter_complex', f.join(';'), '-map', '[out]', '-ar', '48000', '-c:a', 'pcm_s24le', wav]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', abs(cfg.out)]);

// the words, as the film reads them
const filmDir = path.dirname(abs(cfg.out));
const paras = out.filter((w, i) => !w[3] && (i === 0 || /[.!?]$/.test(out[i - 1][0]) && w[1] - out[i - 1][2] > 0.9)).map((w) => w[1]);
fs.writeFileSync(path.join(filmDir, 'words.js'), 'window.WORDS=' + JSON.stringify(out).replace(/,(?=[\d"\[])/g, ', ') + ';\nwindow.PARAS=' + JSON.stringify(paras) + ';\n// ' + path.basename(abs(cfg.out)) + ', from ' + path.basename(abs(cfg.voice)) + ' by tools/voice-edit.mjs\n');
fs.writeFileSync(path.join(filmDir, 'words.json'), JSON.stringify(out).replace(/,(?=[\d"\[])/g, ', '));
const nd = probe(wav);
console.log(`voice ${dur.toFixed(2)} s -> ${nd.toFixed(2)} s; words ${W.length} -> ${out.length}; dropped: ${dropped.join(' ')}${swapped.length ? '; said anew: ' + swapped.join(', ') : ''}`);
for (const e of edits) console.log(e.cut ? `cut ${e.cut[0]}-${e.cut[1]} (${(e.cut[1] - e.cut[0]).toFixed(2)} s)` : e.replace ? `replace ${e.replace[0]}-${e.replace[1]} with ${path.basename(e.take)} ${e.from[0]}-${e.from[1]} at tempo ${e.tempo.toFixed(3)} (${(e.len - (e.replace[1] - e.replace[0])).toFixed(2)} s later after it)` : `gap ${e.gap[1]} s at ${e.gap[0]}`, '·', e.why || '');
