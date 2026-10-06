// Grainy-gouache toolkit for illustration-grainy-gouache cards. Seeded, no dependencies.
//
// The style is: flat no-outline shapes filled with soft 3-4 stop gradients, then a fine dark
// multiply grain (an SVG filter) that gathers toward each shape's edges and into its darker
// tones, on a hot-pink card with cream sparkles and grained autumn leaves. This module prints
// the shared <defs> (filters, leaf/sparkle symbols, the common gradient ramps and knit patterns)
// with your id prefix, and gives the few repeated builders (tapered limb tubes, the glossy eye,
// the chalky pooled shadow, background decor).
//
//   node scripts/gouache.mjs defs wk-            print the shared <defs> content for prefix wk-
//   node scripts/gouache.mjs --demo demo.svg     write a small test card using every builder
//
//   import * as G from './gouache.mjs';
//   const p = 'wk-';
//   const body = [G.background(p, { seed: 3 }), G.leaves(p, [['oak', 64, 62, 30, 0.95]]), ...].join('\n');
//   fs.writeFileSync('card.svg', G.card(p, G.defs(p) + myDefs, body, 'Title, Grainy gouache style'));
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const BG = '#FF81BE', CREAM = '#FDD5A8';
export const f = v => { const s = (Math.round(v * 100) / 100).toString(); return s === '-0' ? '0' : s; };

// ---------- shared defs ----------
// grain: speckle density 1.08 for characters/props; grainL (k1 0.75, k3 0.06) for big light planes
// (window frames, desk tops) so they don't go dirty.
export function grainFilter(p, { name = 'grain', seed = 5, dens = 1.08, k1 = 1.9, k3 = 0.15 } = {}) {
  return `<filter id="${p}${name}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="2.1" numOctaves="1" seed="${seed}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.08  0 0 0 0 0.14  0 -2.0 0 0 ${dens}" result="dk"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="b"/>
      <feComposite in="SourceAlpha" in2="b" operator="arithmetic" k1="0" k2="2.0" k3="-1.8" k4="0" result="w"/>
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.66 -1.3 -0.24 0 1.82" result="dw"/>
      <feComposite in="w" in2="dw" operator="arithmetic" k1="${k1}" k2="0" k3="${k3}" k4="0" result="wt"/>
      <feComposite in="wt" in2="SourceAlpha" operator="in" result="wm"/>
      <feComposite in="dk" in2="wm" operator="in" result="g"/>
      <feBlend in="g" in2="SourceGraphic" mode="multiply"/>
    </filter>`;
}

export function defs(p) {
  return `
    ${grainFilter(p)}
    ${grainFilter(p, { name: 'grainL', dens: 1.0, k1: 0.75, k3: 0.06 })}
    <filter id="${p}chalk" x="-10%" y="-80%" width="120%" height="260%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="fine"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="b"/>
      <feDisplacementMap in="b" in2="fine" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.22 0.5" numOctaves="3" seed="12" result="mott"/>
      <feColorMatrix in="mott" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.3 0 0 0 0.3" result="ma"/>
      <feComposite in="d" in2="ma" operator="in"/>
    </filter>
    <filter id="${p}speck" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.74  3.2 0 0 0 -1.25" result="s"/>
      <feComposite in="s" in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <linearGradient id="${p}gIvyLeaf" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#16592C"/><stop offset="0.5" stop-color="#0F4A23"/><stop offset="0.5" stop-color="#0C3F1D"/><stop offset="1" stop-color="#082F15"/>
    </linearGradient>
    <linearGradient id="${p}gOak" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#E08A1C"/><stop offset="0.5" stop-color="#D47A0C"/><stop offset="0.5" stop-color="#C96E05"/><stop offset="1" stop-color="#A85A05"/>
    </linearGradient>
    <linearGradient id="${p}gOlv" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7A7318"/><stop offset="0.5" stop-color="#6A6416"/><stop offset="0.5" stop-color="#524810"/><stop offset="1" stop-color="#3C350C"/>
    </linearGradient>
    <g id="${p}ivy">
      <path d="M0 6 C0 3 0.4 0 0 -1" fill="none" stroke="#0A1A0E" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M0 -1 C-4 2 -9 3.5 -13 2.5 C-12.5 -1 -15.5 -5 -21 -10.5 C-16 -13 -12 -13.5 -8.5 -13 C-9.5 -18.5 -5.5 -23.5 0 -27 C5.5 -23.5 9.5 -18.5 8.5 -13 C12 -13.5 16 -13 21 -10.5 C15.5 -5 12.5 -1 13 2.5 C9 3.5 4 2 0 -1 Z" fill="url(#${p}gIvyLeaf)"/>
      <path d="M0 -1 L0 -23 M0 -1 L-17 -10 M0 -1 L17 -10 M0 -1 L-10 1.6 M0 -1 L10 1.6 M0 -9 L-4 -14 M0 -9 L4 -14" fill="none" stroke="#06150A" stroke-width="0.7" stroke-linecap="round"/>
    </g>
    <g id="${p}oak">
      <path d="M0 7 C0.3 4 0 1 0 -1" fill="none" stroke="#3A1404" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M0 -1 Q-6 -1.5 -8 -5 Q-13.5 -6 -9.5 -10 Q-15.5 -13 -9.5 -17 Q-14.5 -21.5 -7.5 -24.5 Q-9.5 -30.5 0 -32 Q9.5 -30.5 7.5 -24.5 Q14.5 -21.5 9.5 -17 Q15.5 -13 9.5 -10 Q13.5 -6 8 -5 Q6 -1.5 0 -1 Z" fill="url(#${p}gOak)"/>
      <path d="M0 -1 L0 -29 M0 -5 L-9 -6.5 M0 -10 L-11 -13 M0 -16 L-10.5 -19.5 M0 -21 L-6 -25 M0 -5 L9 -6.5 M0 -10 L11 -13 M0 -16 L10.5 -19.5 M0 -21 L6 -25" fill="none" stroke="#3A1404" stroke-width="0.7" stroke-linecap="round"/>
    </g>
    <g id="${p}olv">
      <path d="M0 7 C0 4 0 1 0 0" fill="none" stroke="#1C1804" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M0 0 C-7.5 -7 -7.5 -22 0 -31 C7.5 -22 7.5 -7 0 0 Z" fill="url(#${p}gOlv)"/>
      <path d="M0 0 L0 -28 M0 -5 L-4 -9 M0 -10 L-4.8 -14.5 M0 -15 L-4.6 -19.5 M0 -20 L-3.4 -24 M0 -5 L4 -9 M0 -10 L4.8 -14.5 M0 -15 L4.6 -19.5 M0 -20 L3.4 -24" fill="none" stroke="#1C1804" stroke-width="0.6" stroke-linecap="round"/>
    </g>
    <path id="${p}star" d="M0 -7 C0.9 -2.2 2.2 -0.9 7 0 C2.2 0.9 0.9 2.2 0 7 C-0.9 2.2 -2.2 0.9 -7 0 C-2.2 -0.9 -0.9 -2.2 0 -7 Z" fill="${CREAM}"/>
    <g id="${p}burst" stroke="${CREAM}" stroke-width="1.3" stroke-linecap="round">
      <path d="M0 -2 L0 -11 M0 2 L0 10 M2 0 L11 0 M-2 0 L-10 0 M1.5 -1.5 L7.5 -7.5 M-1.5 1.5 L-7 7 M1.5 1.5 L7 7 M-1.5 -1.5 L-7.5 -7.5"/>
    </g>
    <path id="${p}drop" d="M0 -6 C2.6 -2.4 3.6 -0.6 3.6 1.4 C3.6 3.5 2 5 0 5 C-2 5 -3.6 3.5 -3.6 1.4 C-3.6 -0.6 -2.6 -2.4 0 -6 Z"/>
    <linearGradient id="${p}gBlack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3A2E31"/><stop offset="1" stop-color="#0D0809"/>
    </linearGradient>
    <linearGradient id="${p}gMaroon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8A220A"/><stop offset="0.45" stop-color="#701001"/><stop offset="1" stop-color="#4A0901"/>
    </linearGradient>
    <linearGradient id="${p}gOchre" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E38C1E"/><stop offset="0.5" stop-color="#C96E05"/><stop offset="1" stop-color="#9E5004"/>
    </linearGradient>
    <linearGradient id="${p}gTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F0A23C"/><stop offset="1" stop-color="#D98418"/>
    </linearGradient>
    <linearGradient id="${p}gEnds" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1A0402" stop-opacity="0.45"/><stop offset="0.07" stop-color="#1A0402" stop-opacity="0"/>
      <stop offset="0.93" stop-color="#1A0402" stop-opacity="0"/><stop offset="1" stop-color="#1A0402" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="${p}gBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5A0E02" stop-opacity="0"/><stop offset="1" stop-color="#5A0E02" stop-opacity="0.5"/>
    </linearGradient>
    <radialGradient id="${p}gScreen" cx="0.42" cy="0.4" r="0.75">
      <stop offset="0" stop-color="#8A2632"/><stop offset="0.55" stop-color="#621626"/><stop offset="1" stop-color="#3A0A14"/>
    </radialGradient>
    <linearGradient id="${p}gDeck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3A2E31"/><stop offset="1" stop-color="#0D0809"/>
    </linearGradient>
    <radialGradient id="${p}gCream" cx="0.5" cy="0.3" r="0.75">
      <stop offset="0" stop-color="#FFE6C4"/><stop offset="0.7" stop-color="#FCD9AE"/><stop offset="1" stop-color="#F0BF88"/>
    </radialGradient>
    <linearGradient id="${p}gVerm" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#B02B08"/><stop offset="0.22" stop-color="#F2440F"/><stop offset="0.45" stop-color="#FF5A24"/><stop offset="0.75" stop-color="#F0420E"/><stop offset="1" stop-color="#9C2306"/>
    </linearGradient>
    <linearGradient id="${p}gOliveCyl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3C350C"/><stop offset="0.22" stop-color="#5E5712"/><stop offset="0.45" stop-color="#7A7318"/><stop offset="0.75" stop-color="#5E5712"/><stop offset="1" stop-color="#352F0A"/>
    </linearGradient>
    <linearGradient id="${p}gCreamCyl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#E2A872"/><stop offset="0.22" stop-color="#FAD4A6"/><stop offset="0.45" stop-color="#FFE6C6"/><stop offset="0.75" stop-color="#F6CC98"/><stop offset="1" stop-color="#D89A62"/>
    </linearGradient>
    <linearGradient id="${p}gCone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF" stop-opacity="0.75"/><stop offset="1" stop-color="#FFF" stop-opacity="0.12"/>
    </linearGradient>
    <pattern id="${p}pKnit" patternUnits="userSpaceOnUse" width="7" height="6">
      <rect width="7" height="6" fill="#EE430F"/>
      <path d="M1.2 1.2 L3.5 4.4 L5.8 1.2" fill="none" stroke="#C2320A" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"/>
    </pattern>
    <pattern id="${p}pKnitD" patternUnits="userSpaceOnUse" width="7" height="6">
      <rect width="7" height="6" fill="#D2360B"/>
      <path d="M1.2 1.2 L3.5 4.4 L5.8 1.2" fill="none" stroke="#A42807" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"/>
    </pattern>
    <pattern id="${p}pRib" patternUnits="userSpaceOnUse" width="3.2" height="10">
      <rect width="3.2" height="10" fill="#E03A0C"/>
      <rect x="2.2" width="1" height="10" fill="#A8290A"/>
    </pattern>`;
}

// ---------- small builders ----------
export const use = (p, name, x, y, rot = 0, s = 1, extra = '') =>
  `<use href="#${p}${name}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"${extra}/>`;

// seeded RNG (Park-Miller) so a re-run gives the same card
export function rng(seed = 7) { let s = seed; return () => (s = (s * 16807) % 2147483647, (s - 1) / 2147483646); }

function catmull(pts, n = 14) {
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// smooth open (or closed) path through points, e.g. a vine, steam or a tail
export function smooth(pts, closed = false, n = 10) {
  let c;
  if (closed) { const P = [...pts, ...pts.slice(0, 3)]; c = catmull(P, n).slice(n, n * (pts.length + 1)); } else c = catmull(pts, n);
  return 'M' + c.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (closed ? ' Z' : '');
}
// filled tapered tube along a Catmull-Rom centre-line: limbs, tails, fingers, lamp arms.
// widths: one per control point. cap0 / cap1: round the start / end.
export function tube(pts, widths, { n = 14, cap0 = true, cap1 = true } = {}) {
  const c = catmull(pts, n), m = c.length, W = [];
  for (let i = 0; i < m; i++) {
    const u = i / (m - 1) * (widths.length - 1), k = Math.min(Math.floor(u), widths.length - 2);
    let t = u - k; t = t * t * (3 - 2 * t);
    W.push(widths[k] * (1 - t) + widths[k + 1] * t);
  }
  const L = [], R = [];
  for (let i = 0; i < m; i++) {
    const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, m - 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const ln = Math.hypot(tx, ty) || 1; tx /= ln; ty /= ln;
    const w = W[i] / 2;
    L.push([c[i][0] - ty * w, c[i][1] + tx * w]); R.push([c[i][0] + ty * w, c[i][1] - tx * w]);
  }
  const out = [...L];
  if (cap1) { const [x, y] = c[m - 1], a = c[m - 2], ang = Math.atan2(y - a[1], x - a[0]), w = W[m - 1] / 2; for (let k = 1; k < 8; k++) { const th = ang + Math.PI / 2 - Math.PI * k / 8; out.push([x + Math.cos(th) * w, y + Math.sin(th) * w]); } }
  out.push(...R.reverse());
  if (cap0) { const [x, y] = c[0], b = c[1], ang = Math.atan2(y - b[1], x - b[0]), w = W[0] / 2; for (let k = 1; k < 8; k++) { const th = ang + Math.PI / 2 - Math.PI * k / 8; out.push([x + Math.cos(th) * w, y + Math.sin(th) * w]); } }
  return 'M' + out.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z';
}

// the glossy eye: cream ring, near-black pupil shifted toward the look direction, a cream 4-point
// star highlight on the look side, a small cream dot on the other. r = ring radius (10-12 at 480).
export function eye(p, cx, cy, r, look = [1, 0.4]) {
  const [lx, ly] = look, pr = r * 0.81, ox = lx * r * 0.22, oy = ly * r * 0.22;
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#F7D6A6"/><circle cx="${f(cx + ox)}" cy="${f(cy + oy)}" r="${f(pr)}" fill="#0D0809"/>`
    + use(p, 'star', cx + ox + lx * r * 0.32, cy + oy - r * 0.3, 0, r * 0.052)
    + `<circle cx="${f(cx + ox - lx * r * 0.38)}" cy="${f(cy + oy + r * 0.36)}" r="${f(r * 0.135)}" fill="${CREAM}"/>`;
}
export const blush = (cx, cy, rx = 5, ry = 2.8) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#FF7FB0" opacity="0.6"/>`;

// chalky purple-pink pool under the whole group: an outer #B95A93 blob plus a darker #A04A80 core
// under the heaviest object. x0..x1 = width of the pool, y = the floor line it sits on.
export function shadow(p, x0, x1, y, { core = [x0 + 12, x1 - 20] } = {}) {
  const cx = (x0 + x1) / 2, [c0, c1] = core, cc = (c0 + c1) / 2;
  return `<path d="M${f(x0 + 4)} ${f(y)} C${f(x0 + 12)} ${f(y - 8)} ${f(cx - 80)} ${f(y - 8)} ${f(cx)} ${f(y - 8)} C${f(cx + 80)} ${f(y - 8)} ${f(x1 - 12)} ${f(y - 9)} ${f(x1 - 2)} ${f(y - 2)} C${f(x1 + 6)} ${f(y + 5)} ${f(x1 - 14)} ${f(y + 11)} ${f(x1 - 66)} ${f(y + 12)} C${f(cx + 30)} ${f(y + 15)} ${f(cx - 80)} ${f(y + 14)} ${f(x0 + 38)} ${f(y + 12)} C${f(x0 + 14)} ${f(y + 11)} ${f(x0)} ${f(y + 7)} ${f(x0 + 4)} ${f(y)} Z" fill="#B95A93" filter="url(#${p}chalk)"/>
<path d="M${f(c0 + 4)} ${f(y - 1)} C${f(cc - 60)} ${f(y - 4)} ${f(cc + 60)} ${f(y - 4)} ${f(c1 - 6)} ${f(y - 2)} C${f(c1 + 2)} ${f(y + 2)} ${f(c1 - 6)} ${f(y + 6)} ${f(cc + 40)} ${f(y + 7)} C${f(cc)} ${f(y + 8)} ${f(cc - 60)} ${f(y + 8)} ${f(c0 + 14)} ${f(y + 6)} C${f(c0 + 2)} ${f(y + 5)} ${f(c0)} ${f(y + 1)} ${f(c0 + 4)} ${f(y - 1)} Z" fill="#A04A80" filter="url(#${p}chalk)" opacity="0.8"/>`;
}

// background: full-bleed pink, then sparse cream decor kept in the margins.
// bursts/stars: [x, y, scale(, rot)]; dots: [x, y] (r 1.0-1.4 chosen by the seeded rng)
export function background(p, { bursts = [[30, 40, 0.85], [450, 150, 0.8, 12]], stars = [[112, 28, 0.9], [84, 168, 0.65], [392, 30, 0.75], [458, 252, 0.6], [30, 230, 0.8], [380, 336, 0.6], [132, 334, 0.55]],
  dots = [[60, 22], [150, 16], [22, 96], [126, 92], [50, 196], [196, 20], [300, 18], [352, 40], [428, 22], [468, 92], [414, 116], [440, 214], [20, 280], [60, 330], [240, 344], [330, 340], [452, 330], [470, 286]], seed = 7 } = {}) {
  const r = rng(seed);
  return `<rect x="0" y="0" width="480" height="360" fill="${BG}"/>
<g>${bursts.map(([x, y, s, rot = 0]) => use(p, 'burst', x, y, rot, s)).join('')}${stars.map(([x, y, s]) => use(p, 'star', x, y, 0, s)).join('')}<g fill="${CREAM}">${dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${[1.0, 1.1, 1.2, 1.3, 1.4][Math.floor(r() * 5)]}"/>`).join('')}</g></g>`;
}
// falling leaves, grained: [kind ('ivy' | 'oak' | 'olv'), x, y, rotDeg, scale]
export const leaves = (p, list) => `<g filter="url(#${p}grain)">${list.map(([k, x, y, rot, s]) => use(p, k, x, y, rot, s)).join('')}</g>`;
// wrap shapes in the grain filter (use grainL for big light planes)
export const grained = (p, inner, name = 'grain') => `<g filter="url(#${p}${name})">${inner}</g>`;

export const card = (p, defsStr, body, label = '') =>
  `<svg${label ? ` role="img" aria-label="${label}"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
  <defs>${defsStr}
  </defs>
${body}
</svg>
`;

// ---------- CLI ----------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'defs') { console.log(defs(arg || 'xx-')); }
  else if (cmd === '--demo') {
    const p = 'gd-', out = arg || 'gouache-demo.svg';
    const body = [
      background(p),
      leaves(p, [['oak', 64, 62, 30, 0.95], ['olv', 26, 120, -50, 0.75], ['ivy', 424, 120, 18, 1.15], ['olv', 46, 300, -30, 0.95], ['ivy', 444, 280, -14, 0.8]]),
      shadow(p, 120, 360, 292, { core: [140, 300] }),
      grained(p, `<path d="M150 236 L310 236 L310 280 C310 286 306 290 300 290 L160 290 C154 290 150 286 150 280 Z" fill="url(#${p}gMaroon)"/><path d="M150 236 L310 236 L310 280 C310 286 306 290 300 290 L160 290 C154 290 150 286 150 280 Z" fill="url(#${p}gEnds)"/>`),
      grained(p, `<path d="${tube([[230, 236], [212, 206], [214, 170]], [44, 50, 46])}" fill="url(#${p}pKnit)"/>`),
      grained(p, `<circle cx="214" cy="140" r="34" fill="url(#${p}gOchre)"/>`),
      `<g>${eye(p, 202, 138, 10.5, [1, 0.3])}${eye(p, 230, 138, 10, [1, 0.3])}${blush(190, 156)}${blush(240, 156, 4.4, 2.6)}</g>`,
      grained(p, `<path d="M330 248 L330 282 C330 286 337 288 348 288 C359 288 366 286 366 282 L366 248 Z" fill="url(#${p}gVerm)"/><ellipse cx="348" cy="248" rx="18" ry="4.4" fill="#FF6A3A"/><ellipse cx="348" cy="248.5" rx="15" ry="3.2" fill="#4A1405"/>`),
      `<path d="${smooth([[344, 240], [340, 228], [346, 218], [342, 206]])}" fill="none" stroke="${CREAM}" stroke-width="1.25" stroke-linecap="round"/>`,
    ].join('\n');
    fs.writeFileSync(out, card(p, defs(p), body, 'gouache helper demo'));
    console.log('wrote', out);
  } else console.log('usage: node gouache.mjs defs <prefix> | --demo out.svg');
}
