// node room3d/export-glb.mjs OUT.glb : the room scene (night) as a GLB for Blender; the monitor's screen mesh is named SCREEN
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'src'); const out = process.argv[2];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.css': 'text/css' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); const f = p.endsWith('/') ? p + 'index.html' : p;
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok)); const port = srv.address().port;
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 } }); page.setDefaultTimeout(240000);
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
const ws = fs.createWriteStream(out); await page.exposeFunction('__chunk', (b64) => { ws.write(Buffer.from(b64, 'base64')); });
await page.goto(`http://127.0.0.1:${port}/index.html?capture&tod=night&nogo&nogi`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 120000 }); console.log('ready');
const info = await page.evaluate(async () => {
  const R = window.__room, T = R.THREE; R.hold(true);
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const keep = new T.Scene(); let n = 0, skipped = 0; const lights = []; const big = [];
  R.scene.updateMatrixWorld(true);
  R.scene.traverse((x) => {
    if (x.isLight) { const w = new T.Vector3(); x.getWorldPosition(w); const tg = x.target ? x.target.getWorldPosition(new T.Vector3()).toArray() : null; lights.push({ type: x.type, pos: w.toArray(), tgt: tg, color: x.color ? x.color.getHex() : 0, i: x.intensity, angle: x.angle, dist: x.distance }); return; }
    if (!x.isMesh) return; if (x.isInstancedMesh || x.isBatchedMesh || x.isSkinnedMesh) { skipped++; return; } { let a = x, vis = true; while (a) { if (!a.visible) { vis = false; break; } a = a.parent; } if (!vis || !x.layers.test(R.camera.layers)) { skipped++; return; } }
    const m = Array.isArray(x.material) ? x.material[0] : x.material;
    if (!m || m.isShaderMaterial || m.isRawShaderMaterial || x.userData.sky || (!x.userData.screen && (m.transparent || m.alphaMap || m.depthWrite === false || m.blending !== T.NormalBlending || m.isMeshBasicMaterial || m.visible === false || m.colorWrite === false))) { skipped++; return; }
    { x.geometry.computeBoundingSphere(); const sc = new T.Vector3().setFromMatrixScale(x.matrixWorld); const rad = x.geometry.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z); if (rad > 0.5) big.push([x.name || m.name, m.type, +rad.toFixed(2), x.geometry.type]); }
    const c = new T.Mesh(x.geometry, x.material); c.applyMatrix4(x.matrixWorld); c.name = x.userData.screen ? 'SCREEN' : (x.name || m.name || 'mesh') ; keep.add(c); n++;
  });
  const buf = await new GLTFExporter().parseAsync(keep, { binary: true, maxTextureSize: 2048 });
  const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 3 * 262144) { let s = ''; const part = u.subarray(i, i + 3 * 262144); for (let j = 0; j < part.length; j += 0x8000) s += String.fromCharCode.apply(null, part.subarray(j, j + 0x8000)); await window.__chunk(btoa(s)); }
  return { n, skipped, bytes: u.length, lights, big };
});
await new Promise((ok) => ws.end(ok)); fs.writeFileSync(out.replace(/\.glb$/, '-lights.json'), JSON.stringify(info.lights, null, 1));
console.log(JSON.stringify(info.big)); console.log('meshes', info.n, 'skipped', info.skipped, 'MB', (info.bytes / 1048576).toFixed(1), 'lights', info.lights.length);
await browser.close(); srv.close();
