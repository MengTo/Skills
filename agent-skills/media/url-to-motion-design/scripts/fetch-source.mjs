#!/usr/bin/env node
// node fetch-source.mjs <url> <dir>
// Gets the source film into <dir>/source.mp4 and writes <dir>/source.json (text, author, date, duration, size).
// X / Twitter posts: the post's own video through api.fxtwitter.com (highest bitrate it lists).
// YouTube, Vimeo and other pages: yt-dlp (must be installed; best ≤1080p mp4).
// A direct .mp4/.mov link: downloaded as is.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [url, dirArg] = process.argv.slice(2);
if (!url || !dirArg) { console.error('usage: node fetch-source.mjs <url> <dir>'); process.exit(1); }
const dir = path.resolve(dirArg); fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, 'source.mp4'), meta = { url };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const get = async (u) => { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(r.status + ' ' + u); return r; };
const x = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([^/]+)\/status\/(\d+)/i.exec(url);
if (x) {
  const d = await (await get(`https://api.fxtwitter.com/${x[1]}/status/${x[2]}`)).json();
  const t = d.tweet || {}; const vids = t.media?.videos || [];
  Object.assign(meta, { kind: 'x', text: t.text, author: t.author?.name, handle: t.author?.screen_name, date: t.created_at });
  if (!vids.length) throw new Error('that post has no video (photos: ' + (t.media?.photos?.length || 0) + ')');
  const v = vids.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
  fs.writeFileSync(out, Buffer.from(await (await get(v.url)).arrayBuffer()));
} else if (/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url)) {
  Object.assign(meta, { kind: 'file' });
  fs.writeFileSync(out, Buffer.from(await (await get(url)).arrayBuffer()));
} else {
  Object.assign(meta, { kind: 'page' });
  execFileSync('yt-dlp', ['-f', 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]/b', '--merge-output-format', 'mp4', '-o', out, '--no-playlist', url], { stdio: 'inherit' });
  try { const j = JSON.parse(execFileSync('yt-dlp', ['-J', '--no-playlist', url], { encoding: 'utf8', maxBuffer: 64 << 20 })); Object.assign(meta, { text: j.title + (j.description ? '\n\n' + j.description.slice(0, 600) : ''), author: j.uploader, date: j.upload_date }); } catch {}
}
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_type', '-of', 'json', out], { encoding: 'utf8' }));
const vs = probe.streams.find((s) => s.codec_type === 'video') || {};
Object.assign(meta, { file: out, duration: +(+probe.format.duration).toFixed(2), width: vs.width, height: vs.height, bytes: fs.statSync(out).size });
fs.writeFileSync(path.join(dir, 'source.json'), JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta, null, 1));
