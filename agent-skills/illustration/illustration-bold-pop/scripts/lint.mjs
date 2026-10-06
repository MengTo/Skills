// Checks a card against the file contract before it goes anywhere near a page.
//
//   node lint.mjs card.svg --prefix rk-                 contract only
//   node lint.mjs card.svg --prefix rk- --palette ../style.json
//                                                       also lists colours that are not in the style's palette
//
// Fails (exit 1) on: wrong viewBox, <style>/class/<script>/<image>/external href, an id without the
// prefix, or a url(#id) / href="#id" that points at nothing. Off-palette colours are a warning:
// a deliberate tint is fine, an accidental #333 is not.
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i < 0 ? null : args.splice(i, 2)[1]; };
const prefix = opt('--prefix');
const paletteFile = opt('--palette');
const file = args[0];
if (!file) { console.error('usage: node lint.mjs card.svg --prefix xx- [--palette style.json]'); process.exit(1); }
const svg = fs.readFileSync(file, 'utf8');

const errors = [];
const warn = [];
if (!/<svg[^>]*viewBox="0 0 480 360"/.test(svg)) errors.push('root <svg> must have viewBox="0 0 480 360"');
if (!/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg)) errors.push('root <svg> needs xmlns');
for (const [re, msg] of [[/<style[\s>]/, '<style> element'], [/\sclass=/, 'class attribute'], [/<script[\s>]/, '<script>'], [/<image[\s>]/, '<image>'],
  [/<foreignObject/, '<foreignObject>'], [/(?:xlink:)?href="(?!#)[^"]+"/, 'external href'], [/url\((?!#)[^)]*\)/, 'external url()']]) {
  if (re.test(svg)) errors.push(`not allowed: ${msg}`);
}
const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const idSet = new Set(ids);
if (prefix) for (const id of ids) if (!id.startsWith(prefix)) errors.push(`id "${id}" does not start with "${prefix}"`);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) errors.push(`duplicate ids: ${[...new Set(dup)].join(', ')}`);
for (const m of svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)) {
  const ref = m[1] || m[2];
  if (!idSet.has(ref)) errors.push(`reference to missing id "#${ref}"`);
}

if (paletteFile) {
  const style = JSON.parse(fs.readFileSync(paletteFile, 'utf8'));
  const norm = h => { h = h.toLowerCase(); return h.length === 4 ? '#' + [...h.slice(1)].map(c => c + c).join('') : h; };
  const allowed = new Set((style.palette || []).map(p => norm(p.hex)).concat(['#ffffff', '#000000']));
  const used = {};
  for (const m of svg.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) { const h = norm(m[0]); used[h] = (used[h] || 0) + 1; }
  const off = Object.entries(used).filter(([h]) => !allowed.has(h)).sort((a, b) => b[1] - a[1]);
  if (off.length) warn.push('off-palette colours (hex x uses): ' + off.map(([h, n]) => `${h} x${n}`).join(', '));
}

const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
for (const e of errors) console.log('ERROR', e);
for (const w of warn) console.log('WARN ', w);
console.log(errors.length ? `FAIL ${file} (${kb} KB)` : `PASS ${file} (${kb} KB, ${ids.length} ids)`);
process.exit(errors.length ? 1 : 0);
