/* The keys and the one HeyGen client every script uses. Keys come from the
   environment, else from a .env file: ENV_FILE if it's set, else .env.local
   or .env in the folder you run from. A key is never printed. */

import fs from 'node:fs';

let file = null;
function fromFile(name) {
  if (file === null) {
    const path = [process.env.ENV_FILE, '.env.local', '.env'].find((p) => p && fs.existsSync(p));
    file = path ? fs.readFileSync(path, 'utf8') : '';
  }
  const m = file.match(new RegExp(`^${name}=(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}

/** A key by name, or a stop that says where to put it. */
export function key(name) {
  const k = process.env[name] || fromFile(name);
  if (!k) {
    console.error(`Set ${name} in your environment or in .env.local (or name a file with ENV_FILE).`);
    process.exit(1);
  }
  return k;
}

const API = 'https://api.heygen.com/';

/** One HeyGen call: its `data`, or a stop with HeyGen's own words. `idem` is
    the Idempotency-Key: the same key returns the same result, so a new
    render needs a new one. */
export async function heygen(path, { method = 'GET', body, idem } = {}) {
  const r = await fetch(API + path, {
    method,
    headers: {
      'x-api-key': key('HEYGEN_API_KEY'),
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(idem ? { 'Idempotency-Key': idem } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: { message: text.slice(0, 200) } };
  }
  if (!r.ok) {
    const e = data.error;
    console.error(`HeyGen ${method} ${path}: ${r.status} ${typeof e === 'string' ? e : e?.code || ''} ${e?.message || ''}`.trim());
    process.exit(1);
  }
  return data.data ?? data;
}

/** What's left in the HeyGen wallet, in dollars. The wallet is the
    account's: anything else using the same key spends from it too. */
export async function balance() {
  const me = await heygen('v3/users/me');
  return Number(me?.wallet?.remaining_balance);
}

export const wait = (s) => new Promise((f) => setTimeout(f, s * 1000));
export const clock = () => new Date().toISOString().slice(11, 19);
