#!/usr/bin/env node
/* Says a line in your own voice on ElevenLabs, as an MP3 to lip-sync. HeyGen
   can't use an ElevenLabs voice by its id, so the line is made here and the
   audio goes to HeyGen (render.mjs). A professional clone sounds like you
   only on the models it's tuned for: check its card in My Voices.

   node scripts/voice.mjs "Hey, it's Ada. This is my digital twin." line.mp3
     --voice <voice_id>   your clone (or ELEVENLABS_VOICE_ID)
     --model eleven_v4    the model it reads on
     --stability 0.5      lower reads livelier; the calm default read won */

import fs from 'node:fs';
import { key } from './keys.mjs';

const pos = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--'));
const arg = (name, or) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : or;
};
const [text, out = 'line.mp3'] = pos;
if (!text) {
  console.error('Usage: node scripts/voice.mjs "<line>" [out.mp3] [--voice <id>] [--model eleven_v4] [--stability 0.5]');
  process.exit(1);
}
const voice = arg('voice') || key('ELEVENLABS_VOICE_ID');
const stability = arg('stability');
const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
  method: 'POST',
  headers: { 'xi-api-key': key('ELEVENLABS_API_KEY'), 'content-type': 'application/json' },
  body: JSON.stringify({
    text,
    model_id: arg('model', 'eleven_v4'),
    ...(stability != null ? { voice_settings: { stability: Number(stability), similarity_boost: 0.8 } } : {}),
  }),
});
const buf = Buffer.from(await r.arrayBuffer());
if (!r.ok) {
  console.error(`ElevenLabs: ${r.status} ${buf.toString().slice(0, 300)}`);
  process.exit(1);
}
fs.writeFileSync(out, buf);
console.log(`${out}: ${(buf.length / 1000).toFixed(0)} KB. Listen to it before it goes anywhere.`);
