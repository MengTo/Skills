#!/usr/bin/env node
/* Uploads a file to HeyGen as an asset (direct upload, up to 200 MB) and
   prints its asset_id: footage to train a twin from, a line of audio to
   lip-sync, a photo to make talk. The id is also kept beside the file as
   <file>.asset.json, so a retry reuses it instead of uploading again.

   node scripts/upload.mjs footage.mp4 */

import fs from 'node:fs';
import path from 'node:path';
import { heygen } from './keys.mjs';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/upload.mjs <file>');
  process.exit(1);
}
const kept = `${file}.asset.json`;
if (fs.existsSync(kept)) {
  console.log(JSON.parse(fs.readFileSync(kept, 'utf8')).asset_id);
  process.exit(0);
}
const TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const type = TYPES[path.extname(file).toLowerCase()];
if (!type) {
  console.error(`HeyGen takes mp4, webm, mov, mp3, wav, jpg, png or webp, not ${path.extname(file)}.`);
  process.exit(1);
}
const buf = fs.readFileSync(file);
if (buf.length > 200e6) {
  console.error(`${(buf.length / 1e6).toFixed(0)} MB is over the 200 MB a direct upload takes: export it at a lower bitrate (scripts/prep-footage.sh).`);
  process.exit(1);
}
const up = await heygen('v3/assets/direct-uploads', {
  method: 'POST',
  body: { filename: path.basename(file), content_type: type, size_bytes: buf.length },
});
const put = await fetch(up.upload_url, { method: 'PUT', headers: up.upload_headers, body: buf });
if (!put.ok) {
  console.error(`The upload itself failed: ${put.status}.`);
  process.exit(1);
}
await heygen(`v3/assets/${up.asset_id}/complete`, { method: 'POST', body: {} });
fs.writeFileSync(kept, JSON.stringify({ asset_id: up.asset_id }));
console.error(`${path.basename(file)}: ${(buf.length / 1e6).toFixed(1)} MB uploaded`);
console.log(up.asset_id);
