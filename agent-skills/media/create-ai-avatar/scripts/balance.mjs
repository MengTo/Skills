#!/usr/bin/env node
/* What's left in the HeyGen wallet. Say it before and after anything paid:
   the wallet is the account's, so other apps on the same key spend from it.

   node scripts/balance.mjs */

import { balance } from './keys.mjs';

console.log(`$${(await balance()).toFixed(2)}`);
