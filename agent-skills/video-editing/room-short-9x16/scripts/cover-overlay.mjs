import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chromium', headless: true });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.cwd() + '/cover.html'); await p.waitForSelector('body[data-ready]');
await p.addStyleTag({ content: 'html,body,#c{background:transparent!important} img.bg{display:none!important}' }); await p.waitForTimeout(500);
await p.screenshot({ path: 'overlay.png', omitBackground: true }); await b.close();
