// node room3d/shot.mjs OUT.png '{"tex":"shots/tarnfield-hero.jpg","dist":1.1,"up":0.05,"side":0,"fov":28,"look":{...}}'
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'src');
const [,, out, optJson = '{}'] = process.argv; const opt = JSON.parse(optJson);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.css': 'text/css', '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); const f = p.endsWith('/') ? p + 'index.html' : p;
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok)); const port = srv.address().port;
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
const errs = []; page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?capture&tod=night&nogo&dpr=2`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 120000 }).catch(() => errs.push('not ready'));
await page.addStyleTag({ content: '#panel,#hint{display:none!important}' });
await page.evaluate(() => window.__room.bakeGI());
const info = await page.evaluate(async (o) => {
  const R = window.__room, T = R.THREE; R.hold(true); R.mode('photo');
  let scr = null; R.scene.traverse((x) => { if (x.userData && x.userData.screen && !scr) scr = x; });
  if (!scr) return 'no screen';
  if (o.tex) { const t = await new T.TextureLoader().loadAsync(o.tex); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16; scr.material.emissiveMap = t; scr.material.emissiveIntensity = o.glow ?? 1.6; scr.material.needsUpdate = true; }
  if (o.look) R.setLook(o.look);
  scr.updateWorldMatrix(true, false); const P = new T.Vector3(); scr.getWorldPosition(P); const q = new T.Quaternion(); scr.getWorldQuaternion(q);
  const N = new T.Vector3(0, 0, 1).applyQuaternion(q), X = new T.Vector3(1, 0, 0).applyQuaternion(q);
  const c = R.camera; c.position.copy(P).addScaledVector(N, o.dist ?? 1.2).addScaledVector(X, o.side ?? 0); c.position.y += o.up ?? 0;
  const tgt = P.clone(); tgt.y += o.ty ?? 0; c.lookAt(tgt); c.fov = o.fov ?? 30; c.updateProjectionMatrix();
  R.step(1 / 60); R.step(1 / 60);
  return { P: P.toArray(), N: N.toArray(), cam: c.position.toArray(), geo: scr.geometry.parameters };
}, opt);
await page.waitForTimeout(200); await page.evaluate(() => { window.__room.step(1 / 60); });
await page.screenshot({ path: out }); console.log(JSON.stringify(info), errs.slice(0, 5).join('\n'));
await browser.close(); srv.close();
