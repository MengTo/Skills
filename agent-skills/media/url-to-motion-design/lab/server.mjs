// Scene lab: renders HTML scenes through Fil's own scene runtime in a browser tab (the runner).
// node lab/server.mjs [port] [repo]   (defaults 5212 and FIL_REPO or ~/Downloads/Projects/facet-studio)
// Clients POST /render {file, out, times, w, h, mode?, pair?, t?}; the runner page (GET /) takes jobs from /next and posts frames back.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const PORT = Number(process.argv[2] || process.env.LAB_PORT || 5212);
const REPO = process.argv[3] || process.env.FIL_REPO || path.join(os.homedir(), 'Downloads/Projects/facet-studio');
const require = createRequire(REPO + '/package.json');
const { sceneRuntime, withSceneRuntime } = await import(REPO + '/src/backend/video/sceneRuntime.js');
const { customize } = await import(REPO + '/src/backend/video/scene.js');
const { PAIR_BY_ID } = await import(REPO + '/src/data/sceneFonts.js');
const { DOMParser } = require('linkedom');
const shot = fs.readFileSync(REPO + '/node_modules/modern-screenshot/dist/index.js', 'utf8');
const here = path.dirname(new URL(import.meta.url).pathname);
const queue = [], jobs = new Map(), waiters = [];
let seq = 0, lastSeen = 0;
const body = (req) => new Promise((ok) => { const b = []; req.on('data', (d) => b.push(d)); req.on('end', () => ok(Buffer.concat(b))); });
const json = (res, o, code = 200) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(o)); };
const hand = (job, res) => { job.startedAt = Date.now(); json(res, { id: job.id, doc: job.doc, w: job.w, h: job.h, times: job.times }); };
setInterval(() => { // a job the runner lost goes back on the queue (twice), then fails
  for (const j of jobs.values()) if (j.startedAt && Date.now() - j.startedAt > 150000 && !j.done) {
    j.startedAt = 0; j.tries = (j.tries || 0) + 1;
    if (j.tries > 2) { j.done = true; j.reply({ error: 'timed out', file: j.file }); jobs.delete(j.id); }
    else if (waiters.length) hand(j, waiters.shift()); else queue.push(j);
  }
}, 5000);
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(fs.readFileSync(path.join(here, 'runner.html'))); }
    if (url.pathname === '/status') return json(res, { queued: queue.length, running: [...jobs.values()].filter((j) => j.startedAt).length, runnerSeenAgo: Date.now() - lastSeen });
    if (url.pathname === '/next') {
      lastSeen = Date.now();
      const j = queue.shift();
      if (j) return hand(j, res);
      waiters.push(res);
      res.on('close', () => { const i = waiters.indexOf(res); if (i >= 0) waiters.splice(i, 1); });
      setTimeout(() => { const i = waiters.indexOf(res); if (i >= 0) { waiters.splice(i, 1); res.writeHead(204); res.end(); } }, 15000);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/render') {
      const o = JSON.parse(await body(req));
      let html = fs.readFileSync(o.file, 'utf8');
      const custom = { t: o.t || {}, v: {}, vd: {}, f: {} };
      if (o.mode) custom.m = o.mode;
      if (o.pair) Object.assign(custom.f, PAIR_BY_ID[o.pair]?.fonts || {});
      html = customize(html, custom, new DOMParser());
      const job = { id: ++seq, file: o.file, out: o.out, w: o.w || 1280, h: o.h || 720, times: o.times, doc: withSceneRuntime(html, sceneRuntime(shot)), saved: [] };
      fs.mkdirSync(o.out, { recursive: true });
      job.reply = (r) => json(res, r);
      jobs.set(job.id, job);
      res.on('close', () => { if (!job.done) { job.done = true; jobs.delete(job.id); const i = queue.indexOf(job); if (i >= 0) queue.splice(i, 1); } });
      if (waiters.length) hand(job, waiters.shift()); else queue.push(job);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/frame') {
      const j = jobs.get(+url.searchParams.get('job')); if (!j) return json(res, { gone: true });
      const i = +url.searchParams.get('i');
      const name = path.join(j.out, `f${String(i).padStart(3, '0')}_${j.times[i].toFixed(2)}.jpg`);
      fs.writeFileSync(name, await body(req)); j.saved[i] = name;
      return json(res, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/finish') {
      const o = JSON.parse(await body(req)); const j = jobs.get(o.id); if (!j) return json(res, { gone: true });
      j.done = true; jobs.delete(o.id); j.reply({ frames: j.saved, error: o.error, startMs: o.startMs, avgMs: o.avgMs });
      return json(res, { ok: true });
    }
    res.writeHead(404); res.end();
  } catch (e) { console.error(e); try { json(res, { error: String(e) }, 500); } catch {} }
}).listen(PORT, '127.0.0.1', () => console.log('scene lab on ' + PORT + ' (repo ' + REPO + ')'));
