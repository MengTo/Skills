// Drawing kit for vintage emblem cards. No dependencies; seeded where random.
//
//   import * as K from './emblem-kit.mjs'
//   node scripts/emblem-kit.mjs demo.svg      writes a small self-test card that uses every helper
//
// Coordinates are card px inside the lockup group (480 x 360 card, centre x 240). Numbers in the defaults are
// the ones the shipped cards use: sun r 88 at (240, 114), crop at y 229, outline 3.6, keyline stroke 15.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { wordmark, taglineText } from './wordmark.mjs';

export const INK = '#1f2b25', CREAM = '#f8f0e3', TERRA = '#c8693f', SAND = '#d9a873', TAN = '#b5824f', PALE = '#ecd2a8', TEAL = '#3f8273';
export const OUT = 3.6;          // outline width of every subject shape
export const KEY = 15;           // keyline stroke: a 7.5 px cream gap around the subject's silhouette
export const CROP = 229;         // the hard horizontal edge that slices the scene
export const SUN = [240, 114, 88];
export const f = n => (Math.round(n * 100) / 100).toString();
export const PI = Math.PI;
const rad = d => d * PI / 180;
export function rng(seed = 7) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// ---------- primitive marks ----------
// gull "m" silhouette, wingspan 2s, centred on (x, y); flip -1 mirrors
export function gull(x, y, s, flip = 1) {
  const X = dx => f(x + dx * s * flip), Y = dy => f(y + dy * s);
  return `M${X(-1)} ${Y(0.22)} C${X(-0.8)} ${Y(-0.3)} ${X(-0.3)} ${Y(-0.48)} ${X(0)} ${Y(-0.02)} C${X(0.3)} ${Y(-0.5)} ${X(0.8)} ${Y(-0.34)} ${X(1)} ${Y(0.14)} C${X(0.72)} ${Y(0.02)} ${X(0.32)} ${Y(-0.06)} ${X(0.01)} ${Y(0.44)} C${X(-0.32)} ${Y(-0.04)} ${X(-0.72)} ${Y(0.06)} ${X(-1)} ${Y(0.22)}Z`;
}
// teardrop: round end at (x, y) radius r, tail toward angle ang (deg, 0 = up), tail length len x r
export function drop(x, y, r, ang, len = 2.6) {
  const L = r * len, t = rad(ang);
  const T = (X, Y) => `${f(x + X * Math.cos(t) - Y * Math.sin(t))} ${f(y + X * Math.sin(t) + Y * Math.cos(t))}`;
  return `M${T(-r, 0)} A${r} ${r} 0 0 0 ${T(r, 0)} Q${T(r * 0.7, -L * 0.55)} ${T(0, -L)} Q${T(-r * 0.7, -L * 0.55)} ${T(-r, 0)}Z`;
}
// woodcut gouge: blunt round base at (x0, y0) of width w, sharp tip at (x1, y1), bowed sideways by bend x length
export function wedge(x0, y0, x1, y1, w, bend = 0) {
  const L = Math.hypot(x1 - x0, y1 - y0), d = [(x1 - x0) / L, (y1 - y0) / L], n = [-d[1], d[0]], h = w / 2;
  const c = [(x0 + x1) / 2 + n[0] * bend * L, (y0 + y1) / 2 + n[1] * bend * L];
  const a = [x0 + n[0] * h, y0 + n[1] * h], b = [x0 - n[0] * h, y0 - n[1] * h];
  return `M${f(a[0])} ${f(a[1])}Q${f(c[0] + n[0] * h * 0.9)} ${f(c[1] + n[1] * h * 0.9)} ${f(x1)} ${f(y1)}Q${f(c[0] - n[0] * h * 0.9)} ${f(c[1] - n[1] * h * 0.9)} ${f(b[0])} ${f(b[1])}A${f(h)} ${f(h)} 0 0 1 ${f(a[0])} ${f(a[1])}Z`;
}
// highlight streak: both ends sharp, half-width w at the middle, bowed by bend
export function streak(x0, y0, x1, y1, w, bend = 0) {
  const L = Math.hypot(x1 - x0, y1 - y0), d = [(x1 - x0) / L, (y1 - y0) / L], n = [-d[1], d[0]];
  const c = [(x0 + x1) / 2 + n[0] * bend * L, (y0 + y1) / 2 + n[1] * bend * L];
  return `M${f(x0)} ${f(y0)}Q${f(c[0] + n[0] * w)} ${f(c[1] + n[1] * w)} ${f(x1)} ${f(y1)}Q${f(c[0] - n[0] * w)} ${f(c[1] - n[1] * w)} ${f(x0)} ${f(y0)}Z`;
}
// crescent hugging the inside of circle (cx, cy, r) from angle a0 to a1 (deg, y down), max thickness t
export function crescent(cx, cy, r, a0, a1, t) {
  const P = (a, rr) => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))];
  const p0 = P(a0, r), p1 = P(a1, r);
  const chord = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const big = (a1 - a0) > 180 ? 1 : 0;
  const sag = big ? r + Math.sqrt(Math.max(r * r - chord * chord / 4, 0)) : r - Math.sqrt(Math.max(r * r - chord * chord / 4, 0));
  const s2 = Math.max(sag - t, 0.5);
  const r2 = (chord * chord / 4 + s2 * s2) / (2 * s2);
  return `M${f(p0[0])} ${f(p0[1])}A${f(r)} ${f(r)} 0 ${big} 1 ${f(p1[0])} ${f(p1[1])}A${f(r2)} ${f(r2)} 0 0 0 ${f(p0[0])} ${f(p0[1])}Z`;
}
export const circ = (pts, extra = '') => pts.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"${extra}/>`).join('');
// smooth closed blob through points (Catmull-Rom -> cubic); tension < 1 tightens corners (rocks 0.6, mounds 0.9)
export function blob(pts, tension = 1) {
  const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}
// open smooth curve through points
export function curve(pts, tension = 1) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
// tapered tube along sampled points; wfn(t, s) gives the full width at fraction t / arc length s
export function sampleCubics(segs, step = 1.5) {
  const pts = [];
  for (const [a, b, c, d] of segs) {
    const L = Math.hypot(d[0] - a[0], d[1] - a[1]) + Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.3;
    const n = Math.max(4, Math.ceil(L / step));
    for (let i = pts.length ? 1 : 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]);
    }
  }
  return pts;
}
export function tube(pts, wfn) {
  const n = pts.length, left = [], right = [];
  let acc = 0; const s = [0];
  for (let i = 1; i < n; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); s.push(acc); }
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, w = wfn(s[i] / acc, s[i]) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  const all = [...left, ...right.reverse()];
  return { d: 'M' + all.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z', left, right: right.reverse(), len: acc };
}
export const gline = (x0, y0, x1, y1) => [[x0, y0], [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3], [x0 + (x1 - x0) * 2 / 3, y0 + (y1 - y0) * 2 / 3], [x1, y1]];
export const gstep = (x0, y0, x1, y1) => [[x0, y0], [x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2], [x1, y1]];   // vertical tangents both ends

// ---------- outline + keyline ----------
// one shape with its own ink outline
export const outlined = (d, fill, w = OUT) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
// several shapes under ONE outline (no seams where they join): ink underlay at 2x width, then the fills
export const unionOutline = (ds, fill, w = OUT) =>
  `<g fill="${INK}" stroke="${INK}" stroke-width="${f(w * 2)}" stroke-linejoin="round">${ds.map(d => `<path d="${d}"/>`).join('')}</g>` +
  `<g fill="${fill}">${ds.map(d => `<path d="${d}"/>`).join('')}</g>`;
// cream keyline: the subject's silhouette shapes, filled and stroked cream at 15, drawn over the sun and before the subject
export const keyline = (inner, id) => `<g${id ? ` id="${id}"` : ''} fill="${CREAM}" stroke="${CREAM}" stroke-width="${KEY}" stroke-linejoin="round">${inner}</g>`;

// ---------- puffs: leafy crowns, clouds, smoke (two-tone offset shading + carved curls) ----------
// one clump = ellipse + a ring of bump circles. rb = bump radius (9-12)
export function puff(cx, cy, rx, ry, rb, rnd) {
  const bumps = [];
  const per = PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const n = Math.max(6, Math.round(per / (rb * 1.25)));
  const a0 = rnd() * PI * 2;
  for (let i = 0; i < n; i++) {
    const t = a0 + i / n * PI * 2 + (rnd() - 0.5) * 0.18;
    const r = rb * (0.86 + rnd() * 0.3);
    bumps.push([cx + (rx - r * 0.5) * Math.cos(t), cy + (ry - r * 0.5) * Math.sin(t), r, t]);
  }
  return { cx, cy, rx, ry, bumps };
}
export const puffShape = (c, grow = 0) => `<ellipse cx="${f(c.cx)}" cy="${f(c.cy)}" rx="${f(c.rx + grow)}" ry="${f(c.ry + grow)}"/>` + circ(c.bumps.map(([x, y, r]) => [x, y, r + grow]));
// draw clumps back -> front. Each: ink silhouette grown by OUT, then inside its clip a dark tone and a light tone
// shifted up-left (so the dark tone shows as a crescent on the lower right), then ink curls under the top bumps
// and up to 3 gouges from the lower bumps. Returns { defs, svg }.
// merge: true draws ONE outline round all clumps (a cloud billow or smoke bank). Without it every clump keeps its own
// outline, which suits a tree crown but turns a cloud bank into bubble wrap.
export function puffs(list, { prefix, dark = TAN, light = SAND, shift = [[-1, -3.2], [-2.6, -7.6]], curls = true, gouges = true, merge = false } = {}) {
  let defs = '', svg = '';
  if (merge) {
    const all = list.map(c => puffShape(c)).join('');
    defs += `<clipPath id="${prefix}puffs">${all}</clipPath>`;
    let carve = '';
    list.forEach(c => {
      if (curls) carve += c.bumps.filter(b => Math.sin(b[3]) < -0.25).map(([x, y, r]) => crescent(x, y, r * 0.98, 25, 125, 2)).join('');
    });
    svg += `<g fill="${INK}">${list.map(c => puffShape(c, OUT)).join('')}</g><g clip-path="url(#${prefix}puffs)">` +
      `<g fill="${dark}" transform="translate(${shift[0][0]} ${shift[0][1]})">${all}</g><g fill="${light}" transform="translate(${shift[1][0]} ${shift[1][1]})">${all}</g>` +
      (carve ? `<path d="${carve}" fill="${INK}"/>` : '') + '</g>';
    return { defs, svg };
  }
  list.forEach((c, i) => {
    const id = `${prefix}puff${i}`;
    defs += `<clipPath id="${id}">${puffShape(c)}</clipPath>`;
    svg += `<g fill="${INK}">${puffShape(c, OUT)}</g><g clip-path="url(#${id})">`;
    svg += `<g fill="${dark}" transform="translate(${shift[0][0]} ${shift[0][1]})">${puffShape(c)}</g><g fill="${light}" transform="translate(${shift[1][0]} ${shift[1][1]})">${puffShape(c)}</g>`;
    let carve = '';
    if (curls) carve += c.bumps.filter(b => Math.sin(b[3]) < -0.25).map(([x, y, r]) => crescent(x, y, r * 0.98, 25, 125, 2)).join('');
    if (gouges) carve += c.bumps.filter(b => Math.sin(b[3]) > 0.25 && Math.cos(b[3]) > -0.35).sort((p, q) => q[3] - p[3]).slice(0, 3).map(([x, y, r, t], k) => {
      const bx = x + r * 0.75 * Math.cos(t), by = y + r * 0.75 * Math.sin(t);
      const tx = c.cx - c.rx * 0.15, ty = c.cy - c.ry * 0.35, L = Math.hypot(tx - bx, ty - by), len = c.ry * (0.95 - k * 0.15);
      return wedge(bx, by, bx + (tx - bx) / L * len, by + (ty - by) / L * len, 3.4, 0.1);
    }).join('');
    svg += (carve ? `<path d="${carve}" fill="${INK}"/>` : '') + '</g>';
  });
  return { defs, svg };
}

// ---------- the foam band along the crop ----------
// Dark band from x0 to x1 sitting on the crop line, with lobes (mirrored about 240), cream holes cut into the dark,
// teardrops flung outward and a few loose specks. Pass your own arrays to vary it; the defaults are the Debug Club band.
export function foam({
  x0 = 100, x1 = 380, y = 224, crest = 219,
  lobes = [[104, 226, 8], [120, 220.5, 11], [142, 217, 13], [165, 220.5, 9.5], [184, 223, 6.5]],
  holes = [[136, 220, 3.2], [126, 226.4, 1.4], [150, 225.6, 2], [113, 224, 1.8], [143, 211, 1.2], [196, 225, 1.1]],
  flung = [[96, 204, 2.8, -48], [86, 216, 1.8, -68], [156, 194, 2, -24]],
  spray = [[146, 186, 1.2], [200, 200, 1.4]],
  mirror = true, cx = 240,
} = {}) {
  const m = a => mirror ? [...a, ...a.map(([x, ...r]) => [2 * cx - x, ...r])] : a;
  const mf = a => mirror ? [...a, ...a.map(([x, yy, r, ang]) => [2 * cx - x, yy, r, -ang])] : a;
  const base = `M${f(x0)} 236 C${f(x0 - 1)} 230 ${f(x0 + 1)} 226 ${f(x0 + 6)} ${y} C${f(x0 + 50)} ${f(crest + 2)} ${f(cx - 40)} ${crest} ${cx} ${crest} C${f(cx + 40)} ${crest} ${f(x1 - 50)} ${f(crest + 2)} ${f(x1 - 6)} ${y} C${f(x1 - 1)} 226 ${f(x1 + 1)} 230 ${f(x1)} 236Z`;
  const L = m(lobes).map(([x, yy, r]) => [x, yy, r + OUT]);
  return {
    // silhouette for the keyline group
    keyline: `<path d="${base}"/>${circ(L)}`,
    ink: `<path d="${base}"/>${circ(L)}${mf(flung).map(([x, yy, r, a]) => `<path d="${drop(x, yy, r, a)}"/>`).join('')}${circ(m(spray))}`,
    holes: circ(m(holes)),
  };
}

// ---------- the card shell ----------
// Centres the lockup between the top of the emblem (sun top unless the subject rises higher) and the tagline baseline.
export function card({ prefix, label, defs = '', sun = SUN, keyline: key = '', emblem = '', word, tag, wmScale, wmMaxWidth = 290, wmTop = 258, top, scale = 0.97, tweak = {} }) {
  const unit = wordmark(word, 0, 0, 1).width;
  const s = wmScale ?? +Math.min(0.95, wmMaxWidth / unit).toFixed(3);
  const wm = wordmark(word, 240, wmTop, s, tweak);
  const tagBase = wmTop + wm.height + 19;
  const t = top ?? sun[1] - sun[2];
  const cy = (t + tagBase) / 2;
  return `<svg role="img" aria-label="${label}, Vintage emblem style" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
<defs>
<clipPath id="${prefix}crop"><rect x="0" y="0" width="480" height="${CROP}"/></clipPath>
${defs}
</defs>
<rect id="${prefix}card" x="0" y="0" width="480" height="360" fill="${CREAM}"/>
<g id="${prefix}lockup" transform="translate(240 180) scale(${scale}) translate(-240 ${f(-cy)})">
<g id="${prefix}emblem" clip-path="url(#${prefix}crop)">
  <circle id="${prefix}sun" cx="${sun[0]}" cy="${sun[1]}" r="${sun[2]}" fill="${TERRA}"/>
  ${keyline(key, `${prefix}keyline`)}
${emblem}
</g>
<g id="${prefix}wordmark" fill="${INK}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round">${wm.svg}</g>
${taglineText(tag, 240, tagBase, `${prefix}tagline`)}
</g>
</svg>
`;
}

// ---------- self-test ----------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = process.argv[2] || 'emblem-kit-demo.svg';
  const P = 'kd-', rnd = rng(11);
  const cl = [puff(240, 96, 40, 24, 12, rnd), puff(196, 118, 30, 18, 11, rnd), puff(284, 118, 30, 18, 11, rnd), puff(240, 132, 34, 18, 11, rnd)];
  const pf = puffs(cl, { prefix: P });
  const fo = foam();
  const svg = card({
    prefix: P, label: 'Kit demo', defs: pf.defs, word: 'KIT DEMO', tag: 'PUFF • FOAM • GULL',
    keyline: cl.map(c => puffShape(c, OUT)).join('') + fo.keyline,
    emblem: `<g fill="${INK}"><path d="${gull(150, 60, 9)}"/><path d="${gull(330, 70, 7, -1)}"/></g>
  ${pf.svg}<path d="${streak(214, 82, 236, 76, 2.2, -0.12)}" fill="${PALE}"/>
  <g fill="${INK}">${fo.ink}</g><g fill="${CREAM}">${fo.holes}</g>`,
  });
  fs.writeFileSync(out, svg);
  console.log('wrote', out, svg.length, 'bytes');
}
