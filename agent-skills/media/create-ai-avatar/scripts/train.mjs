#!/usr/bin/env node
/* Trains a digital twin from uploaded footage, waits for it, and asks for
   consent when the person hasn't given it yet. Training costs about $2.13 on
   HeyGen's API and takes a few minutes. It prints the look id you render with
   and the group id consent belongs to, and keeps both in twin.json.

   node scripts/train.mjs --footage <asset_id> --name "Ada · March takes"
   node scripts/train.mjs --footage <asset_id> --name "…" --group <group_id>

   --group adds the twin to a character you already have: only the same
   person, since consent is the group's. Without it a new character starts,
   and its consent link is printed for that person to open. */

import fs from 'node:fs';
import { balance, clock, heygen, wait } from './keys.mjs';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const footage = arg('footage');
const name = arg('name');
const group = arg('group');
if (!footage || !name) {
  console.error('Usage: node scripts/train.mjs --footage <asset_id> --name "<name>" [--group <group_id>]');
  process.exit(1);
}
const before = await balance();
console.log(`Wallet: $${before.toFixed(2)}. A twin costs about $2.13.`);
if (before < 2.13) {
  console.error('Not enough to train one. Top up at platform.heygen.com first.');
  process.exit(1);
}
const made = await heygen('v3/avatars', {
  method: 'POST',
  // The same footage and name train once, however often this runs.
  idem: `twin-${footage}-${name}`.replace(/[^\w:.-]/g, '-').slice(0, 255),
  body: {
    type: 'digital_twin',
    name,
    file: { type: 'asset_id', asset_id: footage },
    ...(group ? { avatar_group_id: group } : {}),
  },
});
const look = made.avatar_item.id;
const groupId = made.avatar_group.id;
console.log(`Training look ${look} in group ${groupId}…`);
let item;
for (const start = Date.now(); ; ) {
  item = await heygen(`v3/avatars/looks/${look}`);
  console.log(clock(), item.status);
  if (item.status !== 'processing' && item.status !== 'pending') break;
  if (Date.now() - start > 40 * 60e3) {
    console.error('Still training after 40 minutes: check it later with GET /v3/avatars/looks/' + look);
    process.exit(1);
  }
  await wait(30);
}
if (item.status !== 'completed') {
  console.error(`Training ${item.status}: ${item.error?.code || ''} ${item.error?.message || ''}`);
  process.exit(1);
}
const twin = {
  look,
  group: groupId,
  name,
  size: `${item.image_width}×${item.image_height}`,
  engines: item.supported_api_engines,
  // HeyGen clones a voice from the footage too, as its own resource.
  footageVoice: made.avatar_item.default_voice_id,
  consent: made.avatar_group.consent_status,
};
fs.writeFileSync('twin.json', JSON.stringify(twin, null, 2));
console.log(JSON.stringify(twin, null, 2));
if (twin.consent !== 'accepted') {
  const c = await heygen(`v3/avatars/${groupId}/consent`, { method: 'POST', body: {} });
  console.log(`\nConsent is ${c.avatar_group?.consent_status || twin.consent}. The person in the footage opens this link within 24 hours and records a short statement on camera:\n${c.url}`);
}
console.log(`\nWallet now: $${(await balance()).toFixed(2)}`);
