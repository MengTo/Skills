#!/usr/bin/env node
/* A twin's consent: where it stands, and a fresh link (valid 24 hours) for
   the person in the footage to record their statement. A twin renders only
   once its look is completed and its group's consent is accepted.

   node scripts/consent.mjs <group_id> */

import { heygen } from './keys.mjs';

const group = process.argv[2];
if (!group) {
  console.error('Usage: node scripts/consent.mjs <group_id>');
  process.exit(1);
}
const g = await heygen(`v3/avatars/${group}`);
const status = g.consent_status ?? g.avatar_group?.consent_status;
console.log(`${g.name ?? g.avatar_group?.name ?? group}: consent ${status}`);
if (status !== 'accepted') {
  const c = await heygen(`v3/avatars/${group}/consent`, { method: 'POST', body: {} });
  console.log(c.url ? `Open within 24 hours: ${c.url}` : 'Submitted for review.');
}
