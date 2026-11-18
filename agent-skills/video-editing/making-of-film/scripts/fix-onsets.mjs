#!/usr/bin/env node
// Moves word starts that sit inside a silence of the voice to the end of that silence.
// Whisper (-ml 1) hands the pause before a word to the word itself, so "Step" read 1 s early.
// Input: the list from the watch-through (index, word, t, silence a-b, late_by), as a TSV.
//   node fix-onsets.mjs <onsets.tsv> <film/words.js> <film/words.json>
// Rewrites both word files in place. Words that share one silence follow each other:
// the first starts where the silence ends, each next one a letter-length later.
import fs from 'node:fs';

const [tsv, js, json] = process.argv.slice(2);
if (!tsv || !js || !json) { console.log('fix-onsets.mjs <onsets.tsv> <words.js> <words.json>'); process.exit(1); }
const src = fs.readFileSync(js, 'utf8');
const win = {};
new Function('window', src)(win);
const W = win.WORDS.map((w) => [...w]);
const rows = fs.readFileSync(tsv, 'utf8').split('\n').filter((l) => /^\d/.test(l)).map((l) => {
  const [i, word, t, sil] = l.split('\t');
  const [a, b] = sil.split('-').map(Number);
  return { i: +i, word, t: +t, a, b };
});
let moved = 0;
let prev = null;
for (const r of rows) {
  const w = W[r.i];
  if (!w || w[0] !== r.word) throw new Error(`word ${r.i} is ${w && w[0]}, list says ${r.word}`);
  let at = r.b - 0.02;
  // a word after another in the same silence follows it
  if (prev && prev.b === r.b && prev.i === r.i - 1) at = W[prev.i][1] + Math.max(0.1, 0.06 * prev.word.replace(/\W/g, '').length);
  if (at > w[1]) {
    w[1] = +at.toFixed(3);
    if (w[2] < w[1] + 0.08) w[2] = +(w[1] + 0.12).toFixed(3);
    moved++;
  }
  prev = r;
}
// a word the list missed but that now starts before the moved one follows it, a letter-length later
let pushed = 0;
const orig = win.WORDS;
for (let i = 1; i < W.length; i++) {
  const prevMoved = W[i - 1][1] !== orig[i - 1][1];
  const need = W[i - 1][1] + Math.max(0.06, 0.045 * String(W[i - 1][0]).replace(/\W/g, '').length);
  if (prevMoved && W[i][1] < need) { W[i][1] = +need.toFixed(3); if (W[i][2] < W[i][1] + 0.08) W[i][2] = +(W[i][1] + 0.1).toFixed(3); pushed++; }
  if (W[i][1] < W[i - 1][1]) throw new Error('order broken at ' + i + ' ' + W[i][0]);
}
if (pushed) console.log('followed', pushed);
fs.writeFileSync(js, src.replace(/window\.WORDS=\[[\s\S]*?\]\];/, 'window.WORDS=' + JSON.stringify(W).replace(/","/g, '", "').replace(/,(?=[\d"\[])/g, ', ') + ';'));
fs.writeFileSync(json, JSON.stringify(W).replace(/,(?=[\d"\[])/g, ', '));
console.log('moved', moved, 'of', rows.length);
