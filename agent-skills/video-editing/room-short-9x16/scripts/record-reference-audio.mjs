// node record-reference-audio.mjs <video page URL> : plays it muted to the speakers and saves the page's own audio as ref.webm, to measure tempo and level
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ channel: 'chromium', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
await p.screenshot({ path: 'page.jpg', type: 'jpeg', quality: 70 });
p.on('console',m=>{});const info = await p.evaluate(async () => {
  const v = document.querySelector('video'); if (!v) return { err: 'no video', text: document.body.innerText.slice(0, 300) };
  try { await v.play(); } catch (e) {}
  await new Promise(r => setTimeout(r, 1500));
  if (v.readyState < 2) return { err: 'not playing', text: document.body.innerText.slice(0, 300) };
  v.currentTime = 0; v.muted = false; v.volume = 1;
  const s = v.captureStream(); const a = new MediaStream(s.getAudioTracks());
  if (!a.getAudioTracks().length) return { err: 'no audio track' };
  const r = new MediaRecorder(a, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 }); const parts = [];
  r.ondataavailable = e => parts.push(e.data); r.start(500);
  await new Promise(res => { v.onended = res; setTimeout(res, 45000); });
  r.stop(); await new Promise(r2 => setTimeout(r2, 800));
  const buf = new Uint8Array(await new Blob(parts).arrayBuffer()); let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return { b64: btoa(bin), dur: v.duration, title: document.title };
});
if (info.b64) { fs.writeFileSync('ref.webm', Buffer.from(info.b64, 'base64')); console.log('ok', info.dur, info.title); } else console.log(info);
await b.close();
