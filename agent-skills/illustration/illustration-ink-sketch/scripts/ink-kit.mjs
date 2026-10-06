// ink-kit.mjs: the brush library the three Ink sketch example cards were generated with, plus the
// grass patch, hand, limb-shading and sticker recipes lifted from those cards. No dependencies.
//
//   import * as K from './ink-kit.mjs';     then K.setPrefix('xx-'), draw, K.svgOut('card.svg', {label})
//   node ink-kit.mjs --demo out.svg          write a demo card that exercises every part (a self-test)
//
// Seeded: every mark takes a string key, and each key owns its own random stream, so editing one part
// never reshuffles another. Change a key to re-roll one mark. Numbers are SVG units at 480 wide.
// State: marks accumulate in module-level arrays (one card per process). Call reset() to start over.
import fs from 'node:fs';

export const INK = '#1d1a18';
export const deg = Math.PI / 180;
export const f1 = v => Math.round(v * 10) / 10;
export const sm = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// ---------- palette families: c = base, d = dark (streaks, mottle), l = light (lit streak), deep = darkest ----------
export const PAL = {
  red: { c: '#f0563d', d: '#b8311f', l: '#ff8a6a', deep: '#9a2414' },
  yellow: { c: '#ffc83d', d: '#ef9a24', l: '#fff1b0' },
  green: { c: '#5cb946', d: '#2f8a38', l: '#a6dc62' },
  blue: { c: '#66cdea', d: '#2a8fbf', l: '#bfe8f7' },
  teal: { c: '#2fb5a7', d: '#167a71', l: '#8fe3d6', deep: '#0f5c55' },
  wood: { c: '#eaa85c', d: '#b8722f', l: '#f8d6a0', deep: '#8a5320' },
};
// singles: blush disc, blush ticks, eye shade, paper, paper fold, mouth, petal, soil, coffee, soft shadow
export const C = {
  shell: PAL.red.c, shellD: PAL.red.d, shellL: PAL.red.l,
  body: PAL.yellow.c, bodyD: PAL.yellow.d, bodyL: PAL.yellow.l,
  grass: PAL.green.c, grassD: PAL.green.d, grassL: PAL.green.l,
  slime: PAL.blue.c, slimeD: PAL.blue.d,
  blush: '#ff7f86', blushTick: '#d9434f', white: '#ffffff', eyeS: '#c9d6ea',
  paper: '#fffaf0', paperFold: '#d9d2c4', mouth: '#3b1f1a', petal: '#ff8fa0', drop: '#bfe8f7',
  soil: '#5b3b2c', coffee: '#6b4330', softShadow: '#7f97ab',
};

// ---------- rng / noise (one stream per key so edits don't reshuffle other parts) ----------
function xmur(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^ h >>> 16) >>> 0; }
export function rng(key) { let a = xmur(key); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const R = (r, a, b) => a + (b - a) * r();
export function noise(r, n = 97) { const v = Array.from({ length: n }, () => r() * 2 - 1); return x => { x = ((x % n) + n) % n; const i = Math.floor(x), t = x - i, a = v[i], b = v[(i + 1) % n]; const u = t * t * (3 - 2 * t); return a + (b - a) * u; }; }

// ---------- curves ----------
// catmull: dense polyline through control points (n samples per segment)
export function catmull(pts, closed = false, n = 10) {
  const out = []; const m = pts.length;
  const get = i => closed ? pts[((i % m) + m) % m] : pts[Math.max(0, Math.min(m - 1, i))];
  const segs = closed ? m : m - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(closed ? out[0].slice() : pts[m - 1].slice());
  return out;
}
export function resample(pts, step = 1.3) {
  const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1]; const n = Math.max(2, Math.round(L / step)); const out = []; let j = 0;
  for (let k = 0; k <= n; k++) { const s = L * k / n; while (j < d.length - 2 && d[j + 1] < s) j++; const t = (s - d[j]) / ((d[j + 1] - d[j]) || 1); out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t]); }
  return out;
}
// slice a dense closed loop by fraction [a,b] (b may exceed 1 to wrap): outline a shape in separate strokes
export function loopSlice(loop, a, b) { const n = loop.length - 1; const out = []; const i0 = Math.round(a * n), i1 = Math.round(b * n); for (let i = i0; i <= i1; i++) out.push(loop[((i % n) + n) % n]); return out; }
// elliptical arc as points, angles in degrees (0 = right, 90 = down); rf(a) scales the radius per angle
export function arc(cx, cy, rx, ry, a0, a1, step = 5, rf = null) { const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step)); const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const k = rf ? rf(a) : 1; out.push([cx + rx * k * Math.cos(a * deg), cy + ry * k * Math.sin(a * deg)]); } return out; }
export const rot = (p, c, a) => { const s = Math.sin(a * deg), co = Math.cos(a * deg); const x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };
export const dstr = (poly, close = true) => 'M' + poly.map(p => f1(p[0]) + ',' + f1(p[1])).join('L') + (close ? 'Z' : '');
// extend an open polyline past its last point by d px: the outline overshoot
export const ext = (pts, d) => { const a = pts[pts.length - 2], b = pts[pts.length - 1]; const m = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [...pts, [b[0] + (b[0] - a[0]) / m * d, b[1] + (b[1] - a[1]) / m * d]]; };
export const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) c = !c; } return c; };
// the runs of a polyline that lie OUTSIDE a polygon: ink only the part of a limb's edge not covered by the body
export const runsOutside = (pts, poly, minLen = 4) => { const runs = []; let cur = []; for (const p of pts) { if (!inPoly(p, poly)) cur.push(p); else { if (cur.length >= minLen) runs.push(cur); cur = []; } } if (cur.length >= minLen) runs.push(cur); return runs; };

// ---------- brush: variable-width filled stroke ----------
// o: w max width, t0/t1 taper lengths (px), wob centreline wobble, wv width noise, nib pen-angle factor,
//    pen angle (deg), shade {c,d,k} thicker on the shadow side, wmul(t) width multiplier, dense (pts already dense),
//    press 0..1 pressure swell, pf pressure wavelength (px), min/max width clamps, step resample spacing
export function brush(key, pts, o = {}) {
  const r = rng('b:' + key);
  const w = o.w ?? 3, t0 = o.t0 ?? 8, t1 = o.t1 ?? 12, wob = o.wob ?? 0.5, wv = o.wv ?? 0.22, nib = o.nib ?? 0.38, pen = (o.pen ?? 50) * deg, min = o.min ?? 0.2;
  const P = resample(o.dense ? pts : catmull(pts, false, 12), o.step ?? 1.5);
  const N = P.length; const s = [0]; for (let i = 1; i < N; i++) s.push(s[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const L = s[N - 1];
  const nzA = noise(r), nzB = noise(r); const oA = r() * 90, oB = r() * 90; const nzP = noise(r), oP = r() * 90;
  const Lp = [], Rp = [], Cn = [];
  for (let i = 0; i < N; i++) {
    const a = P[Math.max(0, i - 2)], b = P[Math.min(N - 1, i + 2)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx;
    const wv0 = wob * nzA(oA + s[i] / (o.wf ?? 24));
    const cx = P[i][0] + nx * wv0, cy = P[i][1] + ny * wv0;
    const env = Math.pow(sm(s[i] / t0), 0.5) * Math.pow(sm((L - s[i]) / t1), 0.7);
    const th = Math.atan2(ty, tx);
    const dirf = 1 - nib + nib * Math.abs(Math.sin(th - pen));
    let shf = 1; if (o.shade) { const ux = P[i][0] - o.shade.c[0], uy = P[i][1] - o.shade.c[1]; const um = Math.hypot(ux, uy) || 1; shf = 1 + o.shade.k * (ux * o.shade.d[0] + uy * o.shade.d[1]) / um; }
    const wm = o.wmul ? o.wmul(s[i] / L) : 1;
    const pr = o.press ? (1 - o.press) + o.press * (0.5 + 0.5 * nzP(oP + s[i] / (o.pf ?? 30))) : 1;
    const ww = Math.max(min * Math.min(1, env * 3), Math.min(o.max ?? 99, w * env * dirf * shf * wm * pr * (1 + wv * nzB(oB + s[i] / (o.vf ?? 13))))) / 2;
    Lp.push([cx + nx * ww, cy + ny * ww]); Rp.push([cx - nx * ww, cy - ny * ww]); Cn.push([cx, cy, nx, ny]);
  }
  return { d: dstr([...Lp, ...Rp.reverse()]), C: Cn, L };
}

// ---------- card state ----------
export const el = [], defs = [];
let cid = 0, P = 'ik-', WS = 1;
export const add = s => el.push(s);
export const setPrefix = p => { P = p; };
export const prefix = () => P;
export const reset = () => { el.length = 0; defs.length = 0; cid = 0; WS = 1; };
// setWScale(1/s) while drawing inside a <g scale(s)> so line widths stay true at card size
export const setWScale = v => { WS = v; };
export const ink = (d, col = INK, op = 1) => `<path d="${d}" fill="${col}"${op < 1 ? ` fill-opacity="${op}"` : ''}/>`;
// stroke: draw one brush mark (ink by default). Returns {d, C, L}: C = centreline samples [x,y,nx,ny] for hairs()
export const stroke = (key, pts, o = {}, col = INK, op = 1) => { const oo = WS === 1 ? o : { ...o, w: (o.w ?? 3) * WS, max: o.max !== undefined ? o.max * WS : undefined, min: (o.min ?? 0.2) * WS }; const b = brush(key, pts, oo); add(ink(b.d, col, op)); return b; };
// outline brush preset: swells about 1 to 4.4 px with pressure, pen angle and the shadow side (down-right of c)
export const OUT = (c, k = 0.32) => ({ w: 4.6, max: 4.4, press: 0.4, pf: 26, nib: 0.3, wv: 0.1, min: 1.0, shade: { c, d: [0.45, 0.89], k } });

// short hair-like scratches leaving a contour (use the C returned by an outline stroke).
// o.c: a point inside the shape (hairs point away from it), or o.sign +1/-1; o.a/o.b: the slice of the stroke
export function hairs(key, Cn, n, o = {}) {
  const r = rng('h:' + key);
  for (let k = 0; k < n; k++) {
    const i = Math.floor(R(r, o.a ?? 0.06, o.b ?? 0.94) * Cn.length); const [x, y, nx0, ny0] = Cn[i];
    let nx = nx0, ny = ny0; if (o.c) { if ((x - o.c[0]) * nx + (y - o.c[1]) * ny < 0) { nx = -nx; ny = -ny; } } else if (o.sign) { nx *= o.sign; ny *= o.sign; }
    const ang = R(r, -0.75, 0.75) + (o.lean ?? 0); const dx = nx * Math.cos(ang) - ny * Math.sin(ang), dy = nx * Math.sin(ang) + ny * Math.cos(ang);
    const len = R(r, o.l0 ?? 3, o.l1 ?? 7); const bend = R(r, -0.25, 0.25) * len;
    const p0 = [x - dx * 1.2, y - dy * 1.2], p2 = [x + dx * len, y + dy * len], p1 = [x + dx * len * 0.5 - dy * bend, y + dy * len * 0.5 + dx * bend];
    stroke(key + ':' + k, [p0, p1, p2], { w: R(r, 0.9, o.wmax ?? 1.5), t0: 0.6, t1: len * 0.9, wob: 0.15, nib: 0.2 });
  }
}
// ink fleck: a tiny irregular blob floating near the subject (s = 0.8 to 1.7)
export function fleck(key, x, y, s = 1.4) { const r = rng('f:' + key); const pts = []; const n = 7; for (let i = 0; i < n; i++) { const a = i / n * 360 + R(r, -15, 15); const k = s * R(r, 0.65, 1.2); pts.push([x + Math.cos(a * deg) * k * R(r, 1, 1.5), y + Math.sin(a * deg) * k]); } add(ink(dstr(catmull(pts, true, 4)))); }
// hand hatching inside a CLOSED polygon (last point = first): lines stop near the edge with jittered ends, no clip.
// o: ang (deg, -55 default), sp spacing (2 to 4), w (1.0 to 1.15), inset/over end jitter, keep(x,y) 0..1 density map,
//    fade(t) density across the hatch, col/op
export function hatch(key, poly, o = {}) {
  const r = rng('ht:' + key); const ang = (o.ang ?? -55) * deg; const sp = (o.sp ?? 4) * WS;
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2; const H = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 2;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  let k = 0;
  for (let t = -H + R(r, 0, sp); t <= H; t += sp * R(r, 0.8, 1.2)) {
    const px = cx + nx * t, py = cy + ny * t; const us = [];
    for (let i = 0; i < poly.length - 1; i++) {
      const [ax, ay] = poly[i], [bx, by] = poly[i + 1]; const ex = bx - ax, ey = by - ay; const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
      const u = ((ax - px) * ey - (ay - py) * ex) / den; const v = ((ax - px) * dy - (ay - py) * dx) / den; if (v >= 0 && v < 1) us.push(u);
    }
    us.sort((a, b) => a - b);
    for (let j = 0; j + 1 < us.length; j += 2) {
      const u0 = us[j] + R(r, -(o.over ?? 1), o.inset ?? 2), u1 = us[j + 1] - R(r, -(o.over ?? 1), o.inset ?? 2);
      if (o.fade) { const keep = o.fade(t / H); if (r() > keep) continue; }
      if (u1 - u0 < 2) continue;
      const a = [px + dx * u0, py + dy * u0], b = [px + dx * u1, py + dy * u1];
      if (o.keep && r() > o.keep((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue;
      stroke(key + ':' + (k++), [a, [(a[0] + b[0]) / 2 + R(r, -0.4, 0.4), (a[1] + b[1]) / 2 + R(r, -0.4, 0.4)], b], { w: R(r, (o.w ?? 1.1) * 0.8, (o.w ?? 1.1) * 1.15), t0: Math.min(3, (u1 - u0) * 0.3), t1: Math.min(5, (u1 - u0) * 0.4), wob: 0.25, nib: 0.15, min: 0.3 }, o.col ?? INK, o.op ?? 1);
    }
  }
}
// loose fill: a jittered copy of a closed shape, slipped by o.off (2 to 3.6 px) so colour escapes the line.
// ctrl = control points (or a dense loop with dense:true). Returns the loop (use it for mottle and clipOpen).
export function fillShape(key, ctrl, col, o = {}) {
  const r = rng('fl:' + key); const [ox, oy] = o.off ?? [R(r, -1.5, 1.5), R(r, -1, 1.2)];
  const pts = ctrl.map(p => [p[0] + ox + R(r, -(o.j ?? 1.2), o.j ?? 1.2), p[1] + oy + R(r, -(o.j ?? 1.2), o.j ?? 1.2)]);
  const loop = o.dense ? pts : catmull(pts, true, 10);
  add(`<path d="${dstr(loop)}" fill="${col}"${o.op ? ` fill-opacity="${o.op}"` : ''}/>`);
  return loop;
}
// watercolour mottle: the dark colour at op 0.36 to 0.5 through the noise mask filter, over a fill
export function mottle(loop, col, op) { add(`<path d="${dstr(loop)}" fill="${col}" fill-opacity="${op}" filter="url(#${P}mottle)"/>`); }
// clip the next marks to a loop (shading streaks, gloss, hatching that must not leave the shape)
export function clipOpen(loop) { const id = P + 'c' + (cid++); defs.push(`<clipPath id="${id}"><path d="${dstr(loop)}"/></clipPath>`); add(`<g clip-path="url(#${id})">`); }
export const clipClose = () => add('</g>');

// dry-brush: a few thin bristle streaks that break up along a path (ragged ground ends, table ends)
export function dry(key, pts, wid, n, col, op) {
  const r = rng('dry:' + key);
  for (let i = 0; i < n; i++) {
    const off = (i / Math.max(1, n - 1) - 0.5) * wid; const a = R(r, 0, 0.35), b = R(r, 0.6, 1);
    const Pp = resample(catmull(pts, false, 8), 1); const i0 = Math.floor(a * Pp.length), i1 = Math.floor(b * (Pp.length - 1));
    if (i1 - i0 < 4) continue;
    const seg = Pp.slice(i0, i1).map(p => [p[0], p[1] + off]);
    stroke(key + i, seg, { dense: true, w: R(r, 0.7, 1.6), t0: 3, t1: 8, wob: 0.5, nib: 0.2 }, col, op * R(r, 0.6, 1));
  }
}
// one tall grass blade: green fill, dark streak, ink on the left edge, a lighter line on the right
export function blade(key, base, h, lean, wb, o = {}) {
  const r = rng('bl:' + key); const [bx, by] = base;
  const tip = [bx + lean, by - h]; const mid = [bx + lean * 0.35 + R(r, -1, 1), by - h * 0.55];
  const L = [[bx - wb / 2, by], [mid[0] - wb * 0.32, mid[1]], tip];
  const Rr = [tip, [mid[0] + wb * 0.28, mid[1]], [bx + wb / 2, by]];
  const loop = [...catmull(L, false, 8), ...catmull(Rr, false, 8).slice(1)];
  add(`<path d="${dstr(loop.map(p => [p[0] + 0.8, p[1]]))}" fill="${o.col ?? C.grass}"/>`);
  stroke(key + 'dk', [[bx + wb * 0.15, by], [mid[0] + wb * 0.18, mid[1]], [tip[0], tip[1] + 3]], { w: wb * 0.35, t0: 4, t1: h * 0.6 }, C.grassD, 0.55);
  stroke(key + 'iL', L, { w: o.w ?? 2.4, t0: 4, t1: 2, nib: 0.4, press: 0.4, pf: 10 });
  stroke(key + 'iR', [tip, [mid[0] + wb * 0.28, mid[1]], [bx + wb / 2, by - h * 0.15]], { w: (o.w ?? 2.4) * 0.55, t0: 2, t1: 8, nib: 0.3 });
}
// a tuft: spec = [[dx, height, lean, baseWidth], ...]; examples: 3 to 4 blades, heights 15 to 38
export function tuft(key, x, y, spec) { spec.forEach((s, i) => blade(key + i, [x + s[0], y], s[1], s[2], s[3])); }

// googly eye: white, pale shade crescent, variable rim with an overshoot, blob pupil, 2 speculars.
// c centre, rr radius (19 to 27.5), pup pupil centre (offset 4 to 10 px toward the gaze), pr pupil radius (rr * 0.5).
// o.lid {a (deg), h (0..1 from the top), col, colD}: a grumpy or sleepy lid in the body colour
export function eye(key, c, rr, pup, pr, o = {}) {
  const r = rng('eye:' + key);
  add(`<circle cx="${f1(c[0] + 0.8)}" cy="${f1(c[1] - 0.6)}" r="${f1(rr - 0.5)}" fill="#ffffff"/>`);
  clipOpen(arc(c[0], c[1], rr - 2, rr - 2, 0, 360, 10));
  stroke(key + 'sd', arc(c[0], c[1], rr - 3, rr - 3, 10, 120, 5), { w: Math.max(4, rr * 0.24), t0: 10, t1: 10, wob: 0.6 }, C.eyeS, 0.85);
  clipClose();
  const pp = []; for (let a = 0; a < 360; a += 30) pp.push([pup[0] + pr * Math.cos(a * deg) * R(r, 0.96, 1.04), pup[1] + pr * Math.sin(a * deg) * R(r, 0.96, 1.04)]);
  add(ink(dstr(catmull(pp, true, 6))));
  add(`<circle cx="${f1(pup[0] - pr * 0.36)}" cy="${f1(pup[1] - pr * 0.38)}" r="${f1(pr * 0.36)}" fill="#ffffff"/>`);
  add(`<circle cx="${f1(pup[0] + pr * 0.38)}" cy="${f1(pup[1] + pr * 0.34)}" r="${f1(pr * 0.15)}" fill="#ffffff"/>`);
  let lidLine = null;
  if (o.lid) {
    const { a, h, col, colD } = o.lid; const ca = Math.cos(a * deg), sa = Math.sin(a * deg);
    const d = rr * (1 - 2 * h); const nx = -sa, ny = ca; const half = Math.sqrt(Math.max(0, rr * rr - d * d));
    const p0 = [c[0] + nx * d - ca * half, c[1] + ny * d - sa * half], p1 = [c[0] + nx * d + ca * half, c[1] + ny * d + sa * half];
    const a0 = Math.atan2(p0[1] - c[1], p0[0] - c[0]) / deg, a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]) / deg;
    let A1 = a1; while (A1 > a0) A1 -= 360;
    const lid = [p0, ...arc(c[0], c[1], rr + 0.6, rr + 0.6, a0, A1, 6), p1];
    const mid = [(p0[0] + p1[0]) / 2 + nx * 2, (p0[1] + p1[1]) / 2 + ny * 2];
    add(`<path d="${dstr([...lid, ...catmull([p1, mid, p0], false, 6)])}" fill="${col}"/>`);
    if (colD) stroke(key + 'ld', [[p0[0] + nx * 2.5, p0[1] + ny * 2.5], [mid[0] - nx * 0.5, mid[1] - ny * 0.5], [p1[0] + nx * 2.5, p1[1] + ny * 2.5]].reverse(), { w: 4, t0: 3, t1: 3 }, colD, 0.4);
    lidLine = [[p0[0] - ca * 3, p0[1] - sa * 3], mid, [p1[0] + ca * 2, p1[1] + sa * 2]];
  }
  const o0 = []; const a0 = o.a0 ?? R(r, 215, 245); for (let a = a0; a <= a0 + 386; a += 4) { const k = rr + Math.max(0, a - a0 - 352) * 0.11; o0.push([c[0] + k * Math.cos(a * deg), c[1] + k * Math.sin(a * deg)]); }
  const st = stroke(key + 'O', o0, { w: o.w ?? 5.2, max: o.max ?? 4.5, t0: 10, t1: 20, nib: 0.3, press: 0.3, pf: 22, wv: 0.08, min: 0.8, shade: { c, d: o.sd ?? [0.5, 0.86], k: 0.5 } });
  if (lidLine) stroke(key + 'lid', lidLine, { w: 4.4, max: 4.2, t0: 3, t1: 6, nib: 0.4, press: 0.35, pf: 10 });
  if (o.hairs !== 0) hairs(key + 'H', st.C, o.hairs ?? 2, { c, a: 0.15, b: 0.45, l0: 2.5, l1: 5, wmax: 1.3 });
  return st;
}

// tube along a dense spine, width wf(t) for t = 0..1 along it, round caps. Returns P (spine), s, L, Lft, Rgt,
// nrm [nx,ny,tx,ty], W (half widths), loop (closed outline). Bodies, limbs, tails, worms, stalks.
export function tube(spine, wf, o = {}) {
  const Pp = resample(spine, o.step ?? 1.5); const N = Pp.length;
  const s = [0]; for (let i = 1; i < N; i++) s.push(s[i - 1] + Math.hypot(Pp[i][0] - Pp[i - 1][0], Pp[i][1] - Pp[i - 1][1])); const L = s[N - 1];
  const Lft = [], Rgt = [], nrm = [], W = [];
  for (let i = 0; i < N; i++) {
    const a = Pp[Math.max(0, i - 3)], b = Pp[Math.min(N - 1, i + 3)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx; const w = wf(s[i] / L) / 2; W.push(w);
    Lft.push([Pp[i][0] + nx * w, Pp[i][1] + ny * w]); Rgt.push([Pp[i][0] - nx * w, Pp[i][1] - ny * w]); nrm.push([nx, ny, tx, ty]);
  }
  const capAt = (i, dirSign) => { const [nx, ny] = nrm[i]; const w = W[i]; const out = []; const th0 = Math.atan2(ny, nx); for (let k = 1; k < 12; k++) { const th = th0 - dirSign * Math.PI * k / 12; out.push([Pp[i][0] + w * Math.cos(th), Pp[i][1] + w * Math.sin(th)]); } return out; };
  const headCap = capAt(N - 1, 1);
  const tip = Pp[N - 1], [, , htx, hty] = nrm[N - 1];
  const mc = headCap[5]; const fw = (mc[0] - tip[0]) * htx + (mc[1] - tip[1]) * hty;
  const hc = fw >= 0 ? headCap : capAt(N - 1, -1);
  const t0 = Pp[0], [, , ttx, tty] = nrm[0]; const tc0 = capAt(0, 1); const back = (tc0[5][0] - t0[0]) * ttx + (tc0[5][1] - t0[1]) * tty;
  const tc = back <= 0 ? tc0.reverse() : capAt(0, -1).reverse();
  const loop = [...Lft, ...hc, ...Rgt.slice().reverse(), ...tc]; loop.push(loop[0].slice());
  return { P: Pp, s, L, Lft, Rgt, nrm, W, loop, hc, tc };
}
// a point across a tube: k = +1 the Lft edge, -1 the Rgt edge, 0 the spine
export const across = (T, i, k) => { const [nx, ny] = T.nrm[i]; return [T.P[i][0] + nx * T.W[i] * k, T.P[i][1] + ny * T.W[i] * k]; };
export const acrossLine = (T, k, i0, i1, dk = () => 0) => { const out = []; for (let i = i0; i <= i1; i++) out.push(across(T, i, k + dk((i - i0) / Math.max(1, i1 - i0)))); return out; };

// the limb/body colour recipe (cactus arms, worm bodies): slipped fill, mottle, a dark marker streak on the
// shadow side (sh = +0.7 Lft side, -0.7 Rgt side), a white gloss swipe on the lit side, a faint ink rib.
// Returns the fill loop. Ink the outline yourself afterwards (see limbOutline).
export function shadeTube(key, T, fam, o = {}) {
  const fl = fillShape(key + 'f', T.loop, fam.c, { dense: true, j: 0, off: o.slip ?? [-2, -1.6] });
  mottle(fl, fam.d, o.mottle ?? 0.4);
  clipOpen(T.loop);
  const N = T.P.length, sh = o.sh ?? 0.7;
  stroke(key + 's1', acrossLine(T, sh, 2, N - 3), { dense: true, w: o.streak ?? 7, t0: 10, t1: 10, wob: 1 }, fam.d, 0.5);
  if (o.gloss !== false) stroke(key + 'g1', acrossLine(T, -sh * 0.85, Math.floor(N * (o.gl?.[0] ?? 0.25)), Math.floor(N * (o.gl?.[1] ?? 0.7))), { dense: true, w: o.glossW ?? 2.8, t0: 6, t1: 10 }, '#ffffff', 0.9);
  if (o.rib !== false) stroke(key + 'rb', acrossLine(T, 0.05, Math.floor(N * 0.2), N - 6), { dense: true, w: 1.2, t0: 8, t1: 8 }, INK, 0.6);
  clipClose();
  return fl;
}
// ink a tube's two edges, skipping any part hidden inside `under` (a body loop the limb grows out of)
export function limbOutline(key, T, { under = null, w = 4, max = 3.8, hairsN = 2 } = {}) {
  const N = T.P.length; const OS = OUT(T.P[Math.floor(N / 2)], 0.3);
  const sides = [T.Lft.slice(0, N - 1), T.Rgt.slice(0, N - 1)];
  const runs = under ? sides.flatMap(sd => runsOutside(sd, under)) : sides;
  const st = runs.map((run, i) => stroke(key + 'o' + i, ext(run, i === 0 ? 2 : 0), { ...OS, w, max, dense: true, t0: 5, t1: 7 }));
  stroke(key + 'cap', ext(T.hc, 1.5), { ...OS, w, max, dense: true, t0: 3, t1: 5 });
  if (hairsN && st[0]) hairs(key + 'h', st[0].C, hairsN, { sign: 1, l0: 2.5, l1: 4.5 });
  return st;
}

// a 3-or-4-finger cartoon hand (the waving cactus hand): capsule fingers in the limb colour, inked open at
// the knuckle, a thumb, knuckle creases. w = wrist point, ang = finger direction (deg), s = scale (1 to 1.25).
// fingers [[u (across the palm, -5..6), relAngle, length, width?], ...] index first; thumb [u, v, relAngle, length].
// Thumb side follows references/craft.md: put thumb u on the side the handedness table says.
export function hand(key, w, ang, s, fingers, thumb, o = {}) {
  const f = [Math.cos(ang * deg), Math.sin(ang * deg)], sv = [-Math.sin(ang * deg), Math.cos(ang * deg)];
  const Pt = (u, v) => [w[0] + (sv[0] * u + f[0] * v) * s, w[1] + (sv[1] * u + f[1] * v) * s];
  const capsule = (b, a, len, wd) => { const d = [Math.cos(a * deg), Math.sin(a * deg)], n = [-d[1], d[0]]; const tip = [b[0] + d[0] * len, b[1] + d[1] * len];
    const L = [[b[0] + n[0] * wd / 2, b[1] + n[1] * wd / 2], [tip[0] + n[0] * wd / 2 * 0.92, tip[1] + n[1] * wd / 2 * 0.92]];
    const Rr = [[tip[0] - n[0] * wd / 2 * 0.92, tip[1] - n[1] * wd / 2 * 0.92], [b[0] - n[0] * wd / 2, b[1] - n[1] * wd / 2]];
    const cap = []; const a0 = Math.atan2(n[1], n[0]) / deg; for (let k = 0; k <= 10; k++) { const aa = a0 - 180 * k / 10; cap.push([tip[0] + Math.cos(aa * deg) * wd / 2 * 0.92, tip[1] + Math.sin(aa * deg) * wd / 2 * 0.92]); }
    const mid = cap[5]; const fw = (mid[0] - tip[0]) * d[0] + (mid[1] - tip[1]) * d[1]; const capF = fw >= 0 ? cap : cap.map(p => [2 * tip[0] - p[0], 2 * tip[1] - p[1]]);
    return [...L, ...capF.slice(1, -1), ...Rr]; };
  const palm = [Pt(-6.6, -1), Pt(-8.6, 5), Pt(-8.4, 11.5), Pt(-4, 14), Pt(4, 14.2), Pt(8.4, 11.5), Pt(8.8, 5), Pt(6.8, -1)];
  const fs = fingers.map(([u, ra, len, wd]) => capsule(Pt(u, 11), ang + ra, len * s, (wd ?? 6.4) * s));
  const th = capsule(Pt(thumb[0], thumb[1]), ang + thumb[2], thumb[3] * s, 6.6 * s);
  const col = o.col ?? PAL.green;
  [palm, th, ...fs].forEach(sh => add(`<path d="${dstr(catmull(sh.map(p => [p[0] + (o.slip?.[0] ?? -1.2), p[1] + (o.slip?.[1] ?? -0.8)]), true, 4))}" fill="${col.c}"/>`));
  stroke(key + 'ps', [Pt(5.5, 1), Pt(6.5, 7), Pt(5, 12)], { w: 4.5 * s, t0: 3, t1: 3 }, col.d, 0.5);
  fs.forEach((sh, i) => { const n = sh.length; stroke(key + 'fs' + i, [sh[n - 1], sh[n - 2]], { w: 2.4 * s, t0: 2, t1: 4 }, col.d, 0.4); });
  const W = o.w ?? 2.5;
  fs.forEach((sh, i) => stroke(key + 'f' + i, catmull(sh, false, 4), { dense: false, w: W, max: W, t0: 2, t1: 3, nib: 0.35, press: 0.35, pf: 8, min: 0.7, step: 0.7 }));
  stroke(key + 'th', catmull(th, false, 4), { w: W, max: W, t0: 2, t1: 3, nib: 0.35, press: 0.35, pf: 8, min: 0.7, step: 0.7 });
  if (o.palmL !== false) stroke(key + 'pl', [Pt(-6.4, -2), Pt(-8.6, 4), Pt(-8.4, 7)], { w: W * 1.1, t0: 2, t1: 3, nib: 0.35 });
  if (o.palmR !== false) stroke(key + 'pr', [Pt(6.6, -2), Pt(8.8, 4.5), Pt(8.6, 10.5), Pt(fingers[fingers.length - 1][0] + 2.5, 12.5)], { w: W * 1.2, t0: 2, t1: 3, nib: 0.35 });
  fingers.slice(0, -1).forEach(([u], i) => stroke(key + 'k' + i, [Pt(u + 2.4, 10.6), Pt(u + 3.4, 14.5)], { w: 1.2 * s, t0: 1, t1: 2 }, INK, 0.8));
  stroke(key + 'pc', [Pt(-4, 6), Pt(0, 8.5), Pt(3, 8)], { w: 1.1 * s, t0: 2, t1: 2 }, INK, 0.55);
  return { P: Pt, fs, th, palm };
}

// ragged grass patch: slipped green fill + mottle, dark and light marker scribbles, dry-brush ends,
// blade flicks along the top and bottom edges. x0..x1 span (the examples: 52..428), top = top edge y (272 to 280),
// bot = bottom edge y at the centre (318 to 322), cx = the centre the bottom edge bows up from.
// spots = [[x, y], ...] where ink blade flicks go (keep them off the subject's contact line).
export function grassPatch(key, { x0 = 54, x1 = 422, top = 276, bot = 320, cx = 240, spots = null } = {}) {
  const r = rng(key);
  const half = (x1 - x0) / 2;
  const tp = []; for (let x = x0 + 8; x <= x1 - 8; x += R(r, 5, 13)) tp.push([x, top + R(r, -2, 3) - (r() < 0.4 ? R(r, 3, 9) : 0)]);
  const bt = []; for (let x = x1 - 10; x >= x0 + 10; x -= R(r, 12, 26)) bt.push([x, bot + R(r, -3.5, 3) - Math.pow(Math.abs(x - cx) / half, 2.2) * 14]);
  const ctrl = [[x0, top + 21], [x0 + 3, top + 12], ...tp, [x1 - 2, top + 10], [x1, top + 19], ...bt];
  const loop = fillShape(key + 'f', ctrl, C.grass, { j: 1.2, off: [0, 0] });
  mottle(loop, C.grassD, 0.5);
  clipOpen(loop);
  for (let k = 0; k < 40; k++) {
    const xa = R(r, x0 - 6, x1 - 8), ya = R(r, top + 10, bot + 4); const n = Math.floor(R(r, 2, 7)); const pts = []; let x = xa; const lean = R(r, -3.5, 3.5); const hm = R(r, 5, 14);
    for (let i = 0; i < n; i++) { pts.push([x, ya + R(r, -1, 2)]); pts.push([x + lean + R(r, 0.5, 2.5), ya - R(r, hm * 0.35, hm)]); x += R(r, 2, 7); }
    stroke(key + 'gsc' + k, pts, { w: R(r, 1.0, 2.3), t0: 3, t1: 5, wob: 0.4, nib: 0.5, step: 0.7 }, C.grassD, R(r, 0.3, 0.7));
  }
  for (let k = 0; k < 16; k++) {
    const xa = R(r, x0, x1 - 10), ya = R(r, top + 12, bot - 2); const n = Math.floor(R(r, 2, 5)); const pts = []; let x = xa; const lean = R(r, -2, 3);
    for (let i = 0; i < n; i++) { pts.push([x, ya]); pts.push([x + lean, ya - R(r, 3, 8)]); x += R(r, 2.5, 6); }
    stroke(key + 'gsl' + k, pts, { w: R(r, 0.9, 1.6), t0: 2, t1: 3, wob: 0.3, step: 0.7 }, C.grassL, R(r, 0.6, 0.9));
  }
  clipClose();
  for (let k = 0; k < 6; k++) {
    const y = R(r, top + 7, bot - 4); dry(key + 'dL' + k, [[x0 + R(r, 14, 30), y], [x0 + 2, y + R(r, -1, 1)], [x0 - R(r, 3, 10), y + R(r, -2, 2)]], R(r, 2, 4), 3, k % 2 ? C.grass : C.grassD, 0.9);
    const y2 = R(r, top + 7, bot - 6); dry(key + 'dR' + k, [[x1 - R(r, 14, 30), y2], [x1 - 2, y2 + R(r, -1, 1)], [x1 + R(r, 3, 10), y2 + R(r, -2, 2)]], R(r, 2, 4), 3, k % 2 ? C.grass : C.grassD, 0.9);
  }
  for (let k = 0; k < 7; k++) { const x = R(r, x0 + 28, x1 - 28); const y = bot + R(r, -2, 2) - Math.pow(Math.abs(x - cx) / half, 2.2) * 14; dry(key + 'dB' + k, [[x, y], [x + R(r, 12, 30), y + R(r, -1.5, 1.5)]], 2.5, 3, C.grassD, 0.75); }
  const sp = spots ?? [[x0 + 10, top + 8], [x0 + 96, top + 6], [x0 + 218, top + 9], [x0 + 278, top + 7], [x0 + 46, bot - 1], [x0 + 94, bot + 2], [x0 + 144, bot + 3], [x0 + 200, bot + 4], [x0 + 248, bot + 3], [x0 + 300, bot + 1], [x1 - 30, bot - 3]];
  sp.forEach(([x, y], k) => {
    const n = 1 + Math.floor(r() * 3); let xx = x + R(r, -4, 4);
    for (let i = 0; i < n; i++) { const h = R(r, 4, y > top + 20 ? 9 : 13); const lean = R(r, -4, 4.5); stroke(key + 'gk' + k + '_' + i, [[xx - 1, y + 1], [xx + lean * 0.4, y - h * 0.5], [xx + lean, y - h]], { w: R(r, 1.1, 2.1), t0: 1.5, t1: h * 0.85, nib: 0.2 }); xx += R(r, 2.5, 5); }
  });
  return loop;
}

// cheek blush: a soft pink disc (op 0.5 to 0.75) with three short red ticks
export function blush(key, x, y, { rx = 8, ry = 4.6, op = 0.55, col = C.blush, tick = C.blushTick } = {}) {
  add(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx}" ry="${ry}" fill="${col}" fill-opacity="${op}"/>`);
  [-3.6, 0, 3.6].forEach((d, i) => stroke(key + i, [[x + d - 1.1, y + 2.4], [x + d + 1.3, y - 2.4]], { w: 1.1, t0: 1, t1: 2 }, tick, 0.75));
}
// sweat drop (effort, worry): pale blue drop, inked, white glint, two tiny tension ticks
export function sweatDrop(key, d) {
  add(`<path d="${dstr(catmull([[d[0], d[1]], [d[0] + 5, d[1] + 10], [d[0] + 4, d[1] + 17], [d[0] - 3, d[1] + 18], [d[0] - 5, d[1] + 11]], true, 6))}" fill="${C.drop}"/>`);
  stroke(key + 'o', [[d[0], d[1] - 1], [d[0] - 5, d[1] + 10], [d[0] - 4, d[1] + 17], [d[0] + 2, d[1] + 19], [d[0] + 6.5, d[1] + 14], [d[0] + 5, d[1] + 8], [d[0] + 0.5, d[1] + 0.5]], { w: 2.4, t0: 2, t1: 6, nib: 0.45, press: 0.4, pf: 8 });
  stroke(key + 'h', [[d[0] - 1.5, d[1] + 10], [d[0] - 2, d[1] + 14]], { w: 1.6, t0: 1, t1: 1 }, '#ffffff');
  stroke(key + 't', [[d[0] + 9, d[1] - 4], [d[0] + 13, d[1] - 8]], { w: 1.6, t0: 1, t1: 2 });
}
// the "</>" code sticker with a dog-eared corner: c centre, a tilt (deg), W x H (30x19 to 40x25)
export function codeSticker(key, c, a, W = 34, H = 21) {
  const rr = 4.5, e = W * 0.22;
  const box = [[-W / 2 + rr, -H / 2], [W / 2 - e, -H / 2], [W / 2, -H / 2 + e], [W / 2, H / 2 - rr], [W / 2 - rr, H / 2], [-W / 2 + rr, H / 2], [-W / 2, H / 2 - rr], [-W / 2, -H / 2 + rr]].map(p => rot([c[0] + p[0], c[1] + p[1]], c, a));
  add(`<path d="${dstr(catmull(box, true, 5))}" fill="${C.paper}"/>`);
  const pc = [[W / 2 - e, -H / 2], [W / 2, -H / 2 + e], [W / 2 - e * 0.9, -H / 2 + e * 0.83]].map(p => rot([c[0] + p[0], c[1] + p[1]], c, a));
  add(`<path d="${dstr(pc)}" fill="${C.paperFold}"/>`);
  stroke(key + 'O', [...catmull(box, true, 5), ...catmull(box, true, 5).slice(1, 6)], { w: 2.3, t0: 4, t1: 6, wob: 0.3, press: 0.5, pf: 12, nib: 0.4 });
  stroke(key + 'P', [pc[0], pc[2], pc[1]], { w: 1.3, t0: 1, t1: 1 });
  const k = W / 40, Tt = (x, y) => rot([c[0] + x * k, c[1] + y * k], c, a), lw = { w: 2.5 * Math.max(0.85, k), t0: 2, t1: 2.5, nib: 0.45 };
  stroke(key + 'lt', [Tt(-8, -6), Tt(-14, 0.5), Tt(-8, 6.5)], lw);
  stroke(key + 'sl', [Tt(3, -7.5), Tt(-2.5, 7.5)], lw);
  stroke(key + 'gt', [Tt(8, -6), Tt(14, 0.5), Tt(8, 6.5)], lw);
}

// ring fill (a wheel, a donut, a lid seen face-on): slipped even-odd fill plus mottle, no clip needed.
// Shade it with strokes along arcs that stay inside the band, and hatch a closed two-arc polygon.
export function fillRing(c, ro, ri, fam, { off = [-2.6, 2], mottleOp = 0.42 } = {}) {
  const outer = arc(c[0], c[1], ro, ro, 0, 360, 4), inner = arc(c[0], c[1], ri, ri, 360, 0, 4);
  const d = dstr(outer.map(p => [p[0] + off[0], p[1] + off[1]])) + dstr(inner.map(p => [p[0] + off[0], p[1] + off[1]]));
  add(`<path d="${d}" fill="${fam.c}" fill-rule="evenodd"/>`);
  add(`<path d="${d}" fill="${fam.d}" fill-opacity="${mottleOp}" fill-rule="evenodd" filter="url(#${P}mottle)"/>`);
}
// torn paper scrap (a note, a label, a flung code scrap): straight top and left edges, ragged right edge, a fold
// shade along the bottom, inked in three strokes. c centre, ang tilt (deg), W x H (60x36 to 74x40).
// Returns T(x, y): scrap-local point -> card point, for the marks you write on it. Keep marks 4 px inside the edge.
export function paperScrap(key, c, ang, W = 70, H = 38) {
  const r = rng('scrap:' + key);
  const box = [[-W / 2, -H / 2], [W / 2 - 4, -H / 2 + 0.5]];
  for (let y = -H / 2 + 4; y < H / 2; y += R(r, 3, 5)) box.push([W / 2 + R(r, -5, 2), y]);
  box.push([W / 2 - 2, H / 2], [-W / 2 + 1, H / 2 - 0.5]);
  const Pp = box.map(p => rot([c[0] + p[0], c[1] + p[1]], c, ang));
  const T = (x, y) => rot([c[0] + x, c[1] + y], c, ang);
  add(`<path d="${dstr(Pp.map(p => [p[0] + 1.5, p[1] + 1]))}" fill="${C.paper}"/>`);
  stroke(key + 'S', [T(-W / 2 + 4, H / 2 - 3.5), T(W / 2 - 8, H / 2 - 3.5)], { w: 3.4, t0: 6, t1: 10 }, C.paperFold, 0.8);
  stroke(key + 'O1', [Pp[Pp.length - 1], Pp[0], Pp[1]], { w: 2.6, t0: 3, t1: 3, nib: 0.4, press: 0.4, pf: 10 });
  stroke(key + 'O2', Pp.slice(1, Pp.length - 1), { w: 1.6, t0: 2, t1: 3, nib: 0.3, step: 0.8 });
  stroke(key + 'O3', [Pp[Pp.length - 2], Pp[Pp.length - 1], T(-W / 2 + 0.5, H / 2 - 8)], { w: 2.8, t0: 3, t1: 6, nib: 0.4 });
  return T;
}

// ---------- write the card ----------
// Two filters, both prefixed: rough (feTurbulence 0.45 + displacement 0.7, wraps the whole card so every edge
// trembles) and mottle (low-frequency alpha mask for the watercolour patches). shift moves everything.
export function svgOut(file, { label = 'Card, Ink sketch style', shift = [0, 0] } = {}) {
  const svg = `<svg role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
<defs>
<filter id="${P}rough" x="0" y="0" width="480" height="360" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="1" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.7" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="${P}mottle" x="0" y="0" width="480" height="360" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="3" seed="11" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.6 -1.25" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>
${defs.join('\n')}
</defs>
<g filter="url(#${P}rough)">
<g transform="translate(${shift[0]} ${shift[1]})">
${el.join('\n')}
</g>
</g>
</svg>
`;
  fs.writeFileSync(file, svg);
  console.log('wrote', file, (svg.length / 1024).toFixed(1) + 'KB', el.length, 'elements');
  return svg;
}

// ---------- demo / self-test: node ink-kit.mjs --demo out.svg ----------
if (process.argv[1] && process.argv[1].endsWith('ink-kit.mjs') && process.argv[2] === '--demo') {
  setPrefix('ikd-');
  grassPatch('g', { x0: 70, x1: 410, top: 268, bot: 312 });
  tuft('tL', 74, 290, [[-5, 20, -6, 5], [1, 32, -3, 6], [6, 22, 5, 5.5]]);
  // a round critter body: slipped fill, mottle, streaks, gloss, outline in separate strokes with a gap
  const ctrl = []; for (let a = 0; a < 360; a += 30) ctrl.push([240 + 62 * Math.cos(a * deg), 210 + 56 * Math.sin(a * deg)]);
  hatch('sh', arc(244, 270, 66, 6, 0, 360, 10), { ang: -58, sp: 3, w: 1.0, inset: 1.2, over: 0.4 });
  const loop = fillShape('body', ctrl, PAL.red.c, { off: [-3, 2], j: 1.4 });
  mottle(loop, PAL.red.d, 0.46);
  clipOpen(loop);
  stroke('s1', arc(240, 210, 54, 50, -10, 120, 6), { w: 13, t0: 20, t1: 25, wob: 1.5 }, PAL.red.d, 0.45);
  const cres = [...arc(240, 212, 66, 60, 0, 150, 6), ...arc(230, 198, 64, 58, 150, 0, 6)]; cres.push(cres[0]);   // shadow crescent, lower right
  hatch('h1', cres, { ang: -55, sp: 2.6, w: 1.05, inset: 0.6, over: 0.8 });
  stroke('gl', arc(240, 210, 48, 44, 198, 236, 4), { w: 6, t0: 8, t1: 12 }, '#ffffff', 0.95);
  clipClose();
  const dl = resample(catmull(ctrl, true, 10), 1);
  const o1 = stroke('o1', loopSlice(dl, 0.62, 1.18), { ...OUT([240, 210]), dense: true, t0: 12, t1: 10 });
  stroke('o2', ext(loopSlice(dl, 0.2, 0.58), 3), { ...OUT([240, 210]), dense: true, t0: 8, t1: 6 });
  hairs('hh', o1.C, 4, { c: [240, 210] });
  eye('eL', [218, 168], 20, [224, 172], 10);
  eye('eR', [262, 164], 22, [268, 169], 11);
  blush('bl', 210, 214); blush('br', 276, 210);
  stroke('smile', [[228, 216], [238, 224], [250, 223], [256, 214]], { w: 3, t0: 3, t1: 4, nib: 0.45, press: 0.4, pf: 8 });
  // a waving arm + hand
  const T = tube(resample(catmull([[292, 200], [318, 190], [332, 170], [338, 146]], false, 14), 1.2), t => 18 - 6 * t);
  shadeTube('arm', T, PAL.red, { sh: -0.7 });
  limbOutline('arm', T, { under: loop });
  hand('hd', [338, 147], -84, 1.1, [[-4.8, -20, 12], [0.6, -5, 14], [5.8, 12, 12.4]], [-8.2, 4.5, -68, 10], { col: PAL.red });
  codeSticker('st', [200, 238], -10);
  sweatDrop('sw', [310, 112]);
  [[110, 120, 1.5], [124, 134, 0.9], [380, 96, 1.2], [400, 230, 1.1], [96, 300, 1]].forEach((p, i) => fleck('fk' + i, ...p));
  svgOut(process.argv[3] || 'ink-kit-demo.svg', { label: 'ink-kit demo' });
}
