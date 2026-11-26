#!/usr/bin/env node
// node publish-list.mjs <out.json> <id>=<nodeId>=<file.html> …
// Writes the list a cheap helper agent copies into Fil nodes with write_file: each file's path, node id and JavaScript string
// length (what read_file's character count must equal afterwards), and refuses files Fil would mangle (\uXXXX escapes arrive
// decoded; a non-breaking space can be lost; pages over 30 KB are refused).
import fs from 'node:fs'; import path from 'node:path';
const [out, ...pairs] = process.argv.slice(2);
if (!out || !pairs.length) { console.error('usage: node publish-list.mjs <out.json> <id>=<nodeId>=<file.html> …'); process.exit(1); }
const list = pairs.map((p) => {
  const [id, node_id, f] = p.split('='); const file = path.resolve(f); const t = fs.readFileSync(file, 'utf8');
  const bad = [];
  if (/\\u[0-9a-fA-F]{4}/.test(t)) bad.push('\\uXXXX escape');
  if (t.includes(' ')) bad.push('non-breaking space');
  if (Buffer.byteLength(t) > 30000) bad.push('over 30 KB');
  if (/Math\.random|setInterval/.test(t)) bad.push('Math.random or setInterval');
  if (bad.length) throw new Error(`${id}: ${bad.join(', ')}`);
  return { id, node_id, file, chars: t.length };
});
fs.writeFileSync(out, JSON.stringify(list, null, 1));
console.log(list.map((x) => `${x.id} ${x.node_id} ${x.chars}`).join('\n'));
