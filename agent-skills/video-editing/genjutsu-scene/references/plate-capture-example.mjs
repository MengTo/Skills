// EXAMPLE ONLY (Greymourn thread A4, 19 Nov 2026): clean eye-level plates from the game itself, headless Chrome for Testing,
// the player and HUD hidden, enemies removed near the spot, the camera set by position / look point / fov per candidate
// (plates.json: {"name":"P2-stair-gate-wide","pos":[86.6,17.62,57.0],"look":[85.0,18.6,75],"fov":36}). It relies on the game's
// own test hooks (window.__t, __ready); write the same few lines for another game or three.js page.
// A4: clean eye-level plates (no player) to stand Meng's camera cut-out in. Headless, port 8273, GPU lock held by the caller.
import fs from 'node:fs';
const HOME = process.env.HOME, CACHE = HOME + '/Library/Caches/<project>';
const { chromium } = await import(CACHE + '/node_modules/playwright-core/index.mjs');
const PORT = process.env.PORT || 8273, W = +(process.env.W || 3840), H = +(process.env.H || 2160), OUT = process.argv[2], CANDS = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const exe = HOME + '/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const bad = [];
try {
  const page = await b.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => { bad.push(e.message); console.log('[pageerror]', e.message.slice(0, 200)); });
  page.on('console', (m) => { const t = m.text(); if (/greybox|VALIDATE_STATUS|failed to import|no vfx module|no dressing/i.test(t)) { bad.push(t); console.log('[bad]', t.slice(0, 200)); } });
  await page.goto(`http://localhost:${PORT}/lothric/index.html?test=1&mute=1`);
  await page.waitForFunction('window.__ready', null, { timeout: 240000 });
  await page.addStyleTag({ content: '#hud,#menu,.hud,#title,#start,#load,#loading{display:none!important;opacity:0!important}' });
  await page.clock.install(); await page.clock.pauseAt(Date.now() + 2000);
  const cdp = await page.context().newCDPSession(page);
  for (const c of CANDS) {
    await page.evaluate((c) => { const T = __t, G = T.game, P = G.player; G.wyvern = () => {}; for (const e of G.enemies) e.ai.update = () => {};
      for (const n of ['dress-crows', 'dress-farbirds']) { const o = T.scene.getObjectByName(n); if (o) o.visible = false; }
      for (const e of G.enemies) if (!e.removed && !e.dead && Math.hypot(e.pos.x - c.pos[0], e.pos.z - c.pos[2]) < 45) e.remove();
      T.tp(c.pos[0], c.pos[1] - 1.6, c.pos[2] - 0.5, 0); P.rig.root.visible = false;
      T.cam.override = [...c.pos, ...c.look]; T.camera.fov = c.fov; T.camera.updateProjectionMatrix();
      for (let i = 0; i < 120; i++) { T.step(1); P.rig.root.visible = false; T.draw(1 / 60); } }, c);
    await page.clock.runFor(16);
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
    fs.writeFileSync(`${OUT}/${c.name}.jpg`, Buffer.from(r.data, 'base64')); console.log(c.name);
  }
  if (bad.length) process.exitCode = 2;
} finally { await b.close(); }
