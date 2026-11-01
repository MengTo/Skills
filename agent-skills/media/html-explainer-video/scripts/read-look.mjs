#!/usr/bin/env node
// A page's look, measured, as a film's look: what it really draws, read from the
// browser, never guessed from a screenshot. Writes <name>.css (the --x- variables
// and the fonts it loads) and <name>.md (what was measured, and what's left for you).
//
//   read-look.mjs <url | page.html> --name brand [--out demo/looks] [--wait 2500]
//
// It reads the ground, the ink, the second ink, the accent (the strongest colour
// on buttons and links), panels, corners, edges, shadows, the headline and body
// faces with their weights, tracking and case, and how fast its transitions run.
// A face that isn't on Google Fonts can't be loaded here: <name>.md says so, and
// you name the closest one (or the person's own font file) before rendering.
// Check it against the page by eye before using it: a dark hero on a light site
// reads as the site's ground. Motion can't be measured from a still page, so
// --x-motion is a first guess from its transitions: set it yourself.
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { values: o, positionals } = parseArgs({ allowPositionals: true, options: { name: { type: 'string', default: 'brand' }, out: { type: 'string', default: '.' }, wait: { type: 'string', default: '2500' } } });
if (positionals.length !== 1) { console.log('read-look.mjs <url | page.html> --name brand [--out dir]'); process.exit(1); }
const req = createRequire(path.join(process.cwd(), 'x.js'));
let chromium;
for (const n of ['playwright', 'playwright-core']) {
  try { const m = await import(n); chromium = m.chromium || m.default.chromium; break; } catch {}
  try { const m = await import(pathToFileURL(req.resolve(n)).href); chromium = m.chromium || m.default.chromium; break; } catch {}
}
if (!chromium) { console.error('playwright not found: npm i playwright && npx playwright install chromium'); process.exit(1); }
const src = positionals[0];
const url = /^[a-z]+:\/\//i.test(src) ? src : pathToFileURL(path.resolve(src)).href;
const browser = await chromium.launch({ channel: 'chromium', args: ['--allow-file-access-from-files'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(+o.wait);
const m = await page.evaluate(() => {
  const parse = (c) => {
    const x = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!x) return null;
    const p = x[1].split(/[ ,/]+/).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const sat = (c) => { const a = Math.max(c.r, c.g, c.b), b = Math.min(c.r, c.g, c.b); return a ? (a - b) / a : 0; };
  const lum = (c) => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
  const seen = (el) => { const r = el.getBoundingClientRect(), c = getComputedStyle(el); return r.width > 2 && r.height > 2 && c.visibility !== 'hidden' && c.display !== 'none' && +c.opacity > 0.05 && r.top < 2600; };
  const tally = (map, key, n) => map.set(key, (map.get(key) || 0) + n);
  const grounds = new Map(), inks = new Map(), radii = new Map(), edges = new Map();
  const all = [...document.querySelectorAll('body, body *')].filter(seen);
  for (const el of all) {
    const c = getComputedStyle(el), r = el.getBoundingClientRect(), area = r.width * Math.min(r.height, 1600);
    const bg = parse(c.backgroundColor);
    if (bg && bg.a > 0.9) tally(grounds, hex(bg), area);
    if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      const ink = parse(c.color);
      if (ink) tally(inks, hex(ink), el.textContent.trim().length * parseFloat(c.fontSize));
    }
    if (parseFloat(c.borderTopLeftRadius) > 0 && area > 2000 && area < 800000) tally(radii, c.borderTopLeftRadius, 1);
    if (parseFloat(c.borderTopWidth) > 0) tally(edges, c.borderTopWidth, 1);
  }
  const rank = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  const body = parse(getComputedStyle(document.body).backgroundColor);
  const html = parse(getComputedStyle(document.documentElement).backgroundColor);
  const groundList = rank(grounds);
  const ground = body && body.a > 0.9 ? hex(body) : html && html.a > 0.9 ? hex(html) : groundList[0] || '#ffffff';
  const inkList = rank(inks);
  const accents = new Map();
  for (const el of all.filter((e) => e.matches('a, button, [role=button], .btn, [class*=button], [class*=cta]'))) {
    const c = getComputedStyle(el);
    for (const v of [parse(c.backgroundColor), parse(c.color)]) if (v && v.a > 0.9 && sat(v) > 0.3) tally(accents, hex(v), 1);
  }
  for (const [k, v] of grounds) { const p = parse(`rgb(${parseInt(k.slice(1, 3), 16)},${parseInt(k.slice(3, 5), 16)},${parseInt(k.slice(5, 7), 16)})`); if (sat(p) > 0.4 && v < 400000) tally(accents, k, 0.5); }
  const style = (el) => { if (!el) return null; const c = getComputedStyle(el); return { text: el.textContent.trim().slice(0, 60), font: c.fontFamily, size: parseFloat(c.fontSize), weight: c.fontWeight, track: parseFloat(c.letterSpacing) / parseFloat(c.fontSize) || 0, leading: parseFloat(c.lineHeight) / parseFloat(c.fontSize) || 1.1, case: c.textTransform }; };
  const biggest = (sel) => all.filter((e) => e.matches(sel) && e.textContent.trim().length > 3).sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
  const first = (sel) => all.find((e) => e.matches(sel) && e.textContent.trim().length > 20);
  const btn = all.find((e) => e.matches('button, [role=button], .btn, a[class*=btn], a[class*=button]') && e.textContent.trim());
  const durations = new Map();
  for (const el of all.slice(0, 800)) { const d = parseFloat(getComputedStyle(el).transitionDuration); if (d > 0) tally(durations, d, 1); }
  const shadows = all.map((e) => getComputedStyle(e).boxShadow).filter((s) => s !== 'none');
  const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
  const googled = [...document.querySelectorAll('link[href*="fonts.googleapis.com"]')].map((l) => l.href);
  return { ground, grounds: groundList.slice(0, 6), inks: inkList.slice(0, 6), accents: rank(accents).slice(0, 6), radii: rank(radii).slice(0, 6), edges: rank(edges).slice(0, 4), head: style(biggest('h1, h2, [class*=title], [class*=headline]')), body: style(first('p, li')), btn: btn ? { ...style(btn), radius: getComputedStyle(btn).borderTopLeftRadius } : null, durations: rank(durations).slice(0, 4), shadow: shadows[0] || 'none', shadows: shadows.length, loaded: [...new Set(loaded)], googled, title: document.title };
});
await page.screenshot({ path: path.join(o.out, `${o.name}.png`) });
await browser.close();

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
const near = (a, b, t) => { const [x, y] = [rgb(a), rgb(b)]; return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) < t; };
const shade = (h, k) => '#' + rgb(h).map((v) => Math.round(v + (k > 0 ? 255 - v : v) * k).toString(16).padStart(2, '0')).join('');
const dark = lum(m.ground) < 0.45;
const ink = m.inks.find((c) => !near(c, m.ground, 200)) || (dark ? '#ffffff' : '#111111');
const dim = m.inks.find((c) => c !== ink && !near(c, m.ground, 120) && !near(c, ink, 60)) || (dark ? shade(ink, -0.45) : shade(ink, 0.45));
const accent = m.accents.find((c) => !near(c, m.ground, 90)) || ink;
const panel = m.grounds.find((c) => c !== m.ground && near(c, m.ground, 90) && lum(c) >= lum(m.ground) - 0.02) || shade(m.ground, dark ? 0.06 : -0.03);
const family = (s) => (s || '').split(',')[0].replace(/["']/g, '').trim();
const headFace = family(m.head?.font), bodyFace = family(m.body?.font);
const generic = /^(system-ui|ui-sans-serif|ui-serif|-apple-system|BlinkMacSystemFont|sans-serif|serif|Arial|Helvetica|Helvetica Neue|Times|Times New Roman)$/i;
const onGoogle = (f) => m.googled.some((h) => decodeURIComponent(h).replace(/\+/g, ' ').includes(`family=${f}`));
const radius = Math.min(24, parseFloat(m.btn?.radius) || parseFloat(m.radii[0]) || 0);
const radiusBig = Math.min(40, parseFloat(m.radii[0]) || radius);
const edge = Math.min(6, parseFloat(m.edges[0]) || 1);
const moves = m.durations[0] != null && +m.durations[0] < 0.12 ? 'snap' : m.durations[0] != null && +m.durations[0] > 0.45 ? 'fade' : 'rise';
const accentInk = lum(accent) > 0.5 ? '#111111' : '#ffffff';
const size = (px) => Math.round(Math.min(150, Math.max(90, px || 110)));
// The two faces as Google Fonts asks for them: if one isn't there it just doesn't load, and <name>.md says to check.
const faces = [...new Set([headFace, bodyFace])].filter((f) => f && !generic.test(f));
const googleLink = faces.length ? `https://fonts.googleapis.com/css2?${faces.map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')}&display=block` : null;
const said = /^[a-z]+:\/\//i.test(src) ? src : path.basename(src);
const css = `/* ${o.name}: measured from ${said} (scripts/read-look.mjs). Check it against the page; set --x-motion by eye. */
${googleLink ? `@import url('${googleLink}');\n` : ''}[data-look='${o.name}'] {
  --x-ground: ${m.ground};
  --x-ground-image: linear-gradient(transparent, transparent);
  --x-panel: ${panel};
  --x-panel-2: ${shade(panel, dark ? 0.05 : -0.03)};
  --x-ink: ${ink};
  --x-dim: ${dim};
  --x-line: ${ink}${dark ? '24' : '30'};
  --x-accent: ${accent};
  --x-accent-ink: ${accentInk};
  --x-ring: ${accent};
  --x-head-font: '${headFace}', ${generic.test(headFace) ? '' : "system-ui, "}sans-serif;
  --x-head-weight: ${m.head?.weight || 600};
  --x-head-size: 62px;
  --x-head-line: ${Math.min(1.2, Math.max(0.95, m.head?.leading || 1.06)).toFixed(2)};
  --x-head-track: ${(m.head?.track || 0).toFixed(3)}em;
  --x-head-case: ${m.head?.case || 'none'};
  --x-hero-size: ${size(m.head?.size)}px;
  --x-hero-track: ${(m.head?.track || 0).toFixed(3)}em;
  --x-body-font: '${bodyFace}', ${generic.test(bodyFace) ? '' : "system-ui, "}sans-serif;
  --x-label-font: '${bodyFace}', ${generic.test(bodyFace) ? '' : "system-ui, "}sans-serif;
  --x-label-weight: 500;
  --x-radius: ${radiusBig}px;
  --x-radius-s: ${radius}px;
  --x-edge: ${edge}px;
  --x-shadow: ${m.shadows ? m.shadow : 'none'};
  --x-bar: ${panel};
  --x-light-1: ${dim};
  --x-light-2: ${dim};
  --x-light-3: ${dim};
  --x-motion: ${moves};
  --x-motion-dur: ${moves === 'snap' ? 0.2 : moves === 'fade' ? 0.8 : 0.55};
  --x-cap-font: '${bodyFace}', sans-serif;
  --x-cap-ink: ${ink};
  --x-cap-word: ${accent};
  --x-cap-edge: ${m.ground};
  --x-name-face: ${headFace};
  --x-name-moves: ${moves === 'snap' ? 'Snappy' : moves === 'fade' ? 'Slow' : 'Calm'};
}
`;
const missing = [headFace, bodyFace].filter((f) => f && !generic.test(f) && !m.googled.length && !onGoogle(f));
const md = `# Look: ${o.name}

Measured from ${said}${m.title ? ` (“${m.title}”)` : ''}. Screenshot: ${o.name}.png

| what | read | candidates |
| --- | --- | --- |
| Mode | ${dark ? 'dark' : 'light'} | |
| Ground | ${m.ground} | ${m.grounds.join(', ')} |
| Ink | ${ink} | ${m.inks.join(', ')} |
| Second ink | ${dim} | |
| Accent | ${accent} | ${m.accents.join(', ') || 'none found on buttons or links'} |
| Panel | ${panel} | |
| Headline | ${headFace} ${m.head?.weight}, ${m.head?.size} px on the page, tracking ${(m.head?.track || 0).toFixed(3)} em, case ${m.head?.case} | “${m.head?.text || ''}” |
| Body | ${bodyFace} ${m.body?.weight}, ${m.body?.size} px | |
| Corners | ${radius} px small, ${radiusBig} px large | ${m.radii.join(', ')} |
| Edges | ${edge} px | ${m.edges.join(', ')} |
| Shadow | ${m.shadows ? m.shadow : 'none'} | ${m.shadows} elements |
| Moves | ${moves}: a first guess from its transitions (${m.durations.join(', ') || 'none'} s) | |
| Fonts loaded | ${m.loaded.join(', ') || 'none named'} | |

## Left for you

- **Fonts:** ${faces.join(' and ') || 'none named'}, asked of Google Fonts. Check they load: if one isn't there, add a @font-face from the person's own files, or name the closest. Fil's captions list has 42 faces: pick the closest for the captions.
- **Compare** ${o.name}.png with a still of the film in this look. A dark hero on a light site reads as the site's ground: fix --x-ground by hand.
- **Motion:** watch the page and set --x-motion (rise, fade, snap or wipe) and --x-motion-dur.
- **Ground:** --x-ground-image is flat here; bring across the page's gradient, grain or grid if it has one.
- **Real logos and real pictures only:** copy them from the person's own files. Never redraw a mark.
`;
fs.mkdirSync(o.out, { recursive: true });
fs.writeFileSync(path.join(o.out, `${o.name}.css`), css);
fs.writeFileSync(path.join(o.out, `${o.name}.md`), md);
console.log(`${o.name}: ${dark ? 'dark' : 'light'}, ground ${m.ground}, ink ${ink}, accent ${accent}, ${headFace} ${m.head?.weight}, corners ${radius}/${radiusBig} px, ${moves}${missing.length ? `; fonts to name: ${missing.join(', ')}` : ''} -> ${path.join(o.out, o.name + '.css')}`);
