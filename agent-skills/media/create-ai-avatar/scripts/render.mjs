#!/usr/bin/env node
/* Renders one line on a twin (or a photo) on one engine, waits for it and
   saves the MP4. The line is your audio (a file, an asset_id or a public
   link), or a script read in a HeyGen voice. It says the price before it
   starts and the wallet when it's done.

   node scripts/render.mjs --look <look_id> --audio line.mp3
   node scripts/render.mjs --photo me.jpg --audio line.mp3
   node scripts/render.mjs --look <look_id> --script "Hi, it's Ada." --voice <heygen_voice_id>
     --engine avatar_v | avatar_iv | avatar_iii   (a twin or photo avatar; default avatar_v)
     --out twin-avatar_iv.mp4
     --res 1080p | 720p

   Each engine and each line gets its own Idempotency-Key, so a new render is
   new: the same key would hand back the video it made before. */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { balance, clock, heygen, wait } from './keys.mjs';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const look = arg('look');
const photo = arg('photo');
const audio = arg('audio');
const script = arg('script');
const engine = arg('engine') || 'avatar_v';
if ((!look && !photo) || (!audio && !script) || (script && !arg('voice'))) {
  console.error('Usage: node scripts/render.mjs (--look <id> | --photo <file>) (--audio <file|asset_id|url> | --script "<line>" --voice <id>) [--engine avatar_iv] [--out file.mp4]');
  process.exit(1);
}
// HeyGen's API prices, a second of video (developers.heygen.com/docs/pricing).
const PER_SECOND = { avatar_v: 0.12, avatar_iv: 0.0805, avatar_iii: 0.01, photo: 0.0385 };
const rate = photo ? PER_SECOND.photo : PER_SECOND[engine];
if (!rate) {
  console.error(`No engine ${engine}: avatar_v, avatar_iv or avatar_iii.`);
  process.exit(1);
}

/** A local file as a HeyGen asset, through upload.mjs (it keeps the id). */
const asset = (file) =>
  execFileSync(process.execPath, [fileURLToPath(new URL('./upload.mjs', import.meta.url)), file], { encoding: 'utf8' }).trim();

let seconds = null;
let source = {};
if (audio) {
  if (/^https:\/\//.test(audio)) source = { audio_url: audio };
  else if (fs.existsSync(audio)) {
    seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio], { encoding: 'utf8' }));
    source = { audio_asset_id: asset(audio) };
  } else source = { audio_asset_id: audio };
} else {
  source = { script, voice_id: arg('voice') };
  // About 15 characters a second read aloud.
  seconds = script.length / 15;
}
const subject = photo
  ? { type: 'image', image: { type: 'asset_id', asset_id: fs.existsSync(photo) ? asset(photo) : photo } }
  : { type: 'avatar', avatar_id: look, engine: { type: engine } };
const tag = createHash('sha1').update(JSON.stringify([subject, source])).digest('hex').slice(0, 16);
const before = await balance();
console.log(`${photo ? 'Photo on Avatar IV' : engine}: ${seconds ? `about $${(seconds * rate).toFixed(2)} for ${seconds.toFixed(1)} s` : `$${rate} a second`}. Wallet $${before.toFixed(2)}.`);
const started = await heygen('v3/videos', {
  method: 'POST',
  idem: `render-${tag}`,
  body: { ...subject, ...source, resolution: arg('res') || '1080p', aspect_ratio: 'auto', title: `Twin · ${photo ? 'photo' : engine}` },
});
const id = started.video_id;
console.log(`Video ${id}…`);
let v;
for (;;) {
  await wait(20);
  v = await heygen(`v3/videos/${id}`);
  console.log(clock(), v.status, v.duration ?? '');
  if (v.status === 'completed' || v.status === 'failed') break;
}
if (v.status === 'failed') {
  console.error(`Failed: ${v.failure_message || v.failure_code || 'no reason given'}`);
  process.exit(1);
}
const out = arg('out') || `twin-${photo ? 'photo' : engine}.mp4`;
fs.writeFileSync(out, Buffer.from(await (await fetch(v.video_url)).arrayBuffer()));
const after = await balance();
console.log(`${out}: ${Number(v.duration).toFixed(2)} s. It cost $${(before - after).toFixed(2)}; wallet $${after.toFixed(2)}.`);
