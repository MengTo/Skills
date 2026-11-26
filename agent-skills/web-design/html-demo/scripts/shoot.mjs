#!/usr/bin/env node
/* Screenshots of a demo window at chosen moments, at 2×, to compare with
   the real app's references.

   node shoot.mjs <url> <out-prefix> [--at 1,2.5,4] [--width 1000] [--height 760]
                  [--selector .hd-win] [--frozen] [--reduced] [--light]

   Without --frozen it waits in real time and shoots at each second after
   load (the page's clock plays). With --frozen it seeks instead: the page
   must expose its clock as window.__hd (useStepClock's value, or the
   vanilla HTMLDemo.mount() controls), and each frame is shot 1.1 s after
   the seek so CSS transitions settle. Prints page errors, or "no errors".

   Needs Playwright: npm i -D playwright (or point PLAYWRIGHT at an install). */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) {
  console.error('node shoot.mjs <url> <out-prefix> [--at 1,2.5] [--frozen]');
  process.exit(1);
}
const opt = (name, d) => {
  const i = rest.indexOf(`--${name}`);
  return i < 0 ? d : rest[i + 1];
};
const flag = (name) => rest.includes(`--${name}`);
const at = opt('at', '1').split(',').map(Number);

const browser = await chromium.launch({
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: +opt('width', 1000), height: +opt('height', 760) },
  deviceScaleFactor: 2,
  colorScheme: flag('light') ? 'light' : 'dark',
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const target = opt('selector', '') ? page.locator(opt('selector')) : page;

let last = 0;
for (const s of at) {
  if (flag('frozen')) {
    await page.evaluate((s) => {
      window.__hd.pause();
      window.__hd.seek(s);
    }, s);
    await page.waitForTimeout(1100);
  } else {
    await page.waitForTimeout((s - last) * 1000);
    last = s;
  }
  await target.screenshot({ path: `${out}-${s}.png` });
}
console.log(errors.join('\n') || 'no errors');
await browser.close();
