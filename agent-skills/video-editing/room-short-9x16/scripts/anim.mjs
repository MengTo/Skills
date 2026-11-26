// node room3d/anim.mjs OUT_DIR '{"frames":N,"clips":[{"seq":"hero","n":287}],"cam":{"from":{dist,up,side,ty},"to":{...},"fov":36},"look":{...},"start":0,"only":[a,b]}'
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'src');
const [,, out, optJson] = process.argv; const opt = JSON.parse(optJson); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.css': 'text/css' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); const f = p.endsWith('/') ? p + 'index.html' : p;
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok)); const port = srv.address().port;
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 }); page.setDefaultTimeout(90000);
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?capture&tod=night&nogo&dpr=2${opt.hide ? '&nomerge' : ''}`, { waitUntil: 'load' });
console.log('loaded', Date.now() % 1e6); await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 120000 }); console.log('ready', Date.now() % 1e6);
await page.addStyleTag({ content: '#panel,#hint{display:none!important}' });
await page.evaluate(() => window.__room.bakeGI()); console.log('baked', Date.now() % 1e6);
await page.evaluate((o) => {
  const R = window.__room, T = R.THREE; R.hold(true); R.mode('photo'); if (o.look) R.setLook(o.look);
  let scr = null; R.scene.traverse((x) => { if (o.screen === 'wd' ? (x.material && x.material.name === 'wd_screen') : (x.userData && x.userData.screen)) { if (!scr) scr = x; } if (o.hide && o.hide.includes(x.name)) x.visible = false; });
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; const cx = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 16; scr.material.emissiveMap = tex; scr.material.emissiveIntensity = o.glow ?? 1.8; scr.material.needsUpdate = true;
  scr.updateWorldMatrix(true, false); const P = new T.Vector3(); scr.getWorldPosition(P); const q = new T.Quaternion(); scr.getWorldQuaternion(q);
  const N = new T.Vector3(0, 0, 1).applyQuaternion(q), X = new T.Vector3(1, 0, 0).applyQuaternion(q);
  // dust: small additive points drifting in front of the screen, lit by it; a pure function of the frame number
  const ND = o.dust ?? 420, pos = new Float32Array(ND * 3), seed = new Float32Array(ND * 4); let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < ND; i++) { seed[i * 4] = rnd(); seed[i * 4 + 1] = rnd(); seed[i * 4 + 2] = rnd(); seed[i * 4 + 3] = rnd(); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
  const dc = document.createElement('canvas'); dc.width = dc.height = 64; const dx = dc.getContext('2d'); const gr = dx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = gr; dx.fillRect(0, 0, 64, 64);
  const pm = new T.PointsMaterial({ map: new T.CanvasTexture(dc), size: o.dustSize ?? 0.012, sizeAttenuation: true, transparent: true, opacity: o.dustOp ?? 0.55, depthWrite: false, blending: T.AdditiveBlending, color: new T.Color(o.dustColor ?? '#bcd4ff') });
  const pts = new T.Points(g, pm); pts.frustumCulled = false; R.scene.add(pts);
  const near = []; R.scene.traverse((x) => { if (x.isLight) { const w = new T.Vector3(); x.getWorldPosition(w); near.push([x.type, x.name, +x.intensity.toFixed(2), +w.distanceTo(P).toFixed(2)]); if (o.barScale != null && w.distanceTo(P) < 0.6) x.intensity *= o.barScale; if (o.white && x.color) x.color.lerp(new T.Color(o.whiteTo ?? '#eef2ff'), o.white); } });
  window.__lights = { D: { xL: R.D.xL, xR: R.D.xR, zB: R.D.zB, zF: R.D.zF, H: R.D.H }, P: P.toArray() }; const sm = document.createElement('canvas'); sm.width = 32; sm.height = 18; const sx = sm.getContext('2d', { willReadFrequently: true });
  const lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);
  window.__shot = async (n, total, src) => {
    const bmp = await createImageBitmap(await (await fetch(src)).blob()); cx.drawImage(bmp, 0, 0, 1920, 1080); sx.drawImage(bmp, 0, 0, 32, 18); bmp.close(); tex.needsUpdate = true;
    { const d = sx.getImageData(0, 0, 32, 18).data; let m = 0; for (let i = 0; i < d.length; i += 4) m += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; m /= 576; scr.material.emissiveIntensity = (o.glow ?? 1.8) * Math.max(0.5, Math.min(1, (o.level ?? 0.42) / Math.max(m, 0.05))); }
    const t = ease(total > 1 ? n / (total - 1) : 0), a = o.cam.from, b = o.cam.to, c = R.camera;
    c.position.copy(P).addScaledVector(N, lerp(a.dist, b.dist, t)).addScaledVector(X, lerp(a.side || 0, b.side || 0, t)); c.position.y += lerp(a.up || 0, b.up || 0, t);
    const tg = P.clone(); tg.y += lerp(a.ty || 0, b.ty || 0, t); tg.addScaledVector(X, lerp(a.tx || 0, b.tx || 0, t)); c.lookAt(tg); if (a.pos) { c.position.set(lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t)); c.lookAt(lerp(a.tgt[0], b.tgt[0], t), lerp(a.tgt[1], b.tgt[1], t), lerp(a.tgt[2], b.tgt[2], t)); } c.fov = o.cam.fov ?? 36; c.updateProjectionMatrix();
    const time = n / 60;
    for (let i = 0; i < ND; i++) { const a0 = seed[i * 4], a1 = seed[i * 4 + 1], a2 = seed[i * 4 + 2], a3 = seed[i * 4 + 3];
      const x = (a0 - 0.5) * 1.6 + Math.sin(time * 0.25 + a3 * 40) * 0.03, y = ((a1 + time * (0.006 + a3 * 0.012)) % 1) * 1.3 - 0.75, z = 0.05 + a2 * 1.9 + Math.cos(time * 0.2 + a0 * 30) * 0.03;
      pos[i * 3] = P.x + X.x * x + N.x * z; pos[i * 3 + 1] = P.y + y; pos[i * 3 + 2] = P.z + X.z * x + N.z * z; }
    g.attributes.position.needsUpdate = true;
    R.step(1 / 60);
  };
}, opt);
console.log(JSON.stringify(await page.evaluate(() => window.__lights)));
console.log('setup', Date.now() % 1e6);
const plan = []; for (const c of opt.clips) for (let i = 1; i <= c.n; i++) plan.push(`seq/${c.seq}/${String(i).padStart(4, '0')}.jpg`);
const total = opt.frames ?? plan.length; const [a, b] = opt.only ?? [0, total]; const t0 = Date.now();
for (let n = a; n < b; n++) { await page.evaluate(([n, total, src]) => window.__shot(n, total, src), [n, total, plan[Math.min(n, plan.length - 1)]]);
  if (n === a) await page.evaluate(([n, total, src]) => window.__shot(n, total, src), [n, total, plan[n]]);
  await page.screenshot({ path: path.join(out, String(n + 1).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 95 }); }
console.log('frames', b - a, 'ms each', Math.round((Date.now() - t0) / (b - a)));
await browser.close(); srv.close();
