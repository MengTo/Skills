import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chromium', headless: true });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.cwd() + '/cover.html'); await p.waitForSelector('body[data-ready]'); await p.waitForTimeout(800);
await p.screenshot({ path: 'cover.jpg', type: 'jpeg', quality: 93 });
console.log(await p.evaluate(() => [...document.querySelectorAll('.row,.big')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round) })));
await b.close();
