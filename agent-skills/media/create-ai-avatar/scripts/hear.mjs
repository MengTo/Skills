#!/usr/bin/env node
/* Writes down what a line of audio, or a render, actually says (ElevenLabs
   Scribe), so a dropped or misread word is caught before anyone watches it.
   It hears words, not likeness: still listen to the voice yourself.

   node scripts/hear.mjs line.mp3 render.mp4 */

import fs from 'node:fs';
import path from 'node:path';
import { key } from './keys.mjs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/hear.mjs <audio or video> [more …]');
  process.exit(1);
}
for (const f of files) {
  const form = new FormData();
  form.append('model_id', 'scribe_v2');
  form.append('tag_audio_events', 'true');
  const type = /\.mp4$|\.mov$|\.webm$/i.test(f) ? 'video/mp4' : 'audio/mpeg';
  form.append('file', new Blob([fs.readFileSync(f)], { type }), path.basename(f));
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': key('ELEVENLABS_API_KEY') },
    body: form,
  });
  const d = await r.json().catch(() => ({}));
  console.log(`${path.basename(f)}: ${r.ok ? d.text : `${r.status} ${JSON.stringify(d).slice(0, 200)}`}`);
}
