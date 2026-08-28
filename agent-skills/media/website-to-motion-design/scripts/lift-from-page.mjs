#!/usr/bin/env node
/* Lift the reusable parts of a page into a new self-contained motion frame.
 *
 *   node lift-from-page.mjs --from page.html --out frame.html \
 *     --style "font-family:'Outfit'" \
 *     --script "Three.js Authors" --script "window.__ASSET =" \
 *     --body frame-body.html --js frame.js [--title "..."] [--head "<script src=...>"]
 *
 * --style / --script take a SUBSTRING that identifies the block to lift. Matching
 * by content rather than by index matters: a page gains and loses <script> tags,
 * and an index-based extractor silently lifts the wrong one the next time it runs.
 *
 * Blocks are emitted in the order given. --body is markup for <body>, --js is the
 * frame's own timeline script and always goes last.                          */
import fs from 'node:fs';

const argv = process.argv.slice(2);
const many = (flag) => argv.reduce((out, a, i) => (a === flag ? [...out, argv[i + 1]] : out), []);
const one = (flag, fallback) => { const i = argv.indexOf(flag); return i < 0 ? fallback : argv[i + 1]; };

const from = one('--from'), out = one('--out');
if (!from || !out) { console.error('usage: lift-from-page.mjs --from page.html --out frame.html …'); process.exit(1); }

const src = fs.readFileSync(from, 'utf8');
const blocksOf = (tag) => [...src.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1]);
const styles = blocksOf('style'), scripts = blocksOf('script');

const pick = (pool, needle, kind) => {
  const hits = pool.filter((b) => b.includes(needle));
  if (!hits.length) { console.error(`no ${kind} block contains ${JSON.stringify(needle)}`); process.exit(1); }
  if (hits.length > 1) console.error(`warning: ${hits.length} ${kind} blocks match ${JSON.stringify(needle)}; taking the first`);
  return hits[0];
};

const liftedStyles = many('--style').map((n) => pick(styles, n, 'style'));
const liftedScripts = many('--script').map((n) => pick(scripts, n, 'script'));
const bodyFile = one('--body'), jsFile = one('--js');
const body = bodyFile ? fs.readFileSync(bodyFile, 'utf8') : '';
const js = jsFile ? fs.readFileSync(jsFile, 'utf8') : '';
const title = one('--title', 'Motion frame');
const extraHead = many('--head').join('\n');

/* Built as an array of lines rather than by patching a template: string surgery on
   a finished document is how the markup ends up above </head>. */
const doc = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  `<title>${title}</title>`,
  extraHead,
  ...liftedStyles.map((s) => `<style>\n${s}</style>`),
  '</head>',
  '<body>',
  body,
  ...liftedScripts.map((s) => `<script>\n${s}\n</script>`),
  js ? `<script>\n${js}\n</script>` : '',
  '</body>',
  '</html>',
  '',
].filter((line) => line !== '').join('\n');

fs.writeFileSync(out, doc);

/* fail loudly rather than shipping a document the browser will silently repair */
const headEnd = doc.indexOf('</head>'), bodyStart = doc.indexOf('<body>');
if (!(headEnd < bodyStart) || doc.indexOf('</head>', headEnd + 1) >= 0) {
  console.error('document order is wrong — check for a stray </head>'); process.exit(1);
}
const n = (s) => (s / 1024 / 1024).toFixed(2);
console.log(`${out}  ${n(doc.length)} MB  ·  ${liftedStyles.length} style + ${liftedScripts.length} script blocks lifted from ${from}`);
for (const s of liftedScripts) console.log(`   script ${String(Math.round(s.length / 1024)).padStart(5)} KB`);
