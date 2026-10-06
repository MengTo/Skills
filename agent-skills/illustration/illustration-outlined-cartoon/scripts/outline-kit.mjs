// Drawing kit for outlined-cartoon cards. No dependencies, deterministic.
//
//   import * as K from './outline-kit.mjs'
//   node scripts/outline-kit.mjs demo.svg            writes a self-test card (head, arms, both fist views, decor)
//   node scripts/outline-kit.mjs demo.svg --proof    same, with every thumb red and every index finger blue
//
// UNITS. The scene (figure and props) is drawn in local units and placed with compose(), which scales it by
// S = 0.84. Every stroke-width you write in the scene is a FINAL card px value: compose() divides it by S.
// fold() widths are final px too. Decor is drawn straight in card px (not scaled).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const S = 0.84;
export const INK = '#1e1b1b';
export const WO = 2.5;   // outer silhouettes: head, hair, torso, trousers, shoes, big props
export const W = 2.0;    // secondary shapes: hands, cuffs, collars, small parts
export const WI = 1.5;   // interior detail: eye whites, screen insets
export const C = {
  white: '#ffffff', blue: '#6b7fd4', blueD: '#4c5fb6', blueL: '#dfe4f8', red: '#e5281d', redD: '#a9180f',
  yel: '#f6c343', yelD: '#d99a1e', green: '#4ea54a', greenD: '#2f7f2c', greenL: '#7cc777',
  pink: '#f6a3b6', pinkD: '#dc7393', pinkL: '#fde0e5', mouth: '#8a1b1b', tongue: '#ec7d78',
  hairK: '#2b2525', grey: '#b9b4c4', greyL: '#d6d2df', lilac: '#c9c6d6', mint: '#e3f2df', blueP: '#c4ccf0', steel: '#e6e3ee',
};
// skin sets used in the examples: { skin, skinD (fold/crease tone), blush }
export const SKIN = {
  salmon: { skin: '#f5a39c', skinD: '#d97e77', blush: '#ec7d78' },
  brown: { skin: '#c97a5a', skinD: '#9c5238', blush: '#e0625a' },
  peach: { skin: '#fbd2c0', skinD: '#e39c86', blush: '#f2898a' },
};
export const f = n => +(+n).toFixed(2);
export const P = a => a.map(p => `${f(p[0])},${f(p[1])}`);
export const Lw = v => v / S;

// ---------- geometry ----------
export function catmull(pts, n = 14) {
  const out = [];
  const q = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < q.length - 2; i++) {
    const [p0, p1, p2, p3] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      const c = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([c(0), c(1), i - 1 + t]);
    }
  }
  const l = pts[pts.length - 1];
  out.push([l[0], l[1], pts.length - 1]);
  return out;
}
// tapered tube through pts with full widths ws (one per point). Returns the sides so a caller can ink them openly.
export function limbSides(pts, ws, cap0 = 'round', cap1 = 'round') {
  const s = catmull(pts);
  const L = [], R = [], nrm = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const k = Math.min(ws.length - 2, Math.floor(s[i][2])); const u = s[i][2] - k;
    const w = (ws[k] * (1 - u) + ws[k + 1] * u) / 2;
    nrm.push([tx, ty, w]);
    L.push([s[i][0] - ty * w, s[i][1] + tx * w]);
    R.push([s[i][0] + ty * w, s[i][1] - tx * w]);
  }
  const cap = (i, dir) => {
    const [tx, ty, w] = nrm[i]; const c = s[i]; const o = [];
    for (let j = 1; j < 10; j++) {
      const th = Math.PI * j / 10, nx = -ty, ny = tx;
      o.push([c[0] + w * (nx * Math.cos(th) + dir * tx * Math.sin(th)), c[1] + w * (ny * Math.cos(th) + dir * ty * Math.sin(th))]);
    }
    return o;
  };
  return { L, R, cap1: cap1 === 'round' ? cap(s.length - 1, 1) : [], cap0: cap0 === 'round' ? cap(0, -1).reverse() : [] };
}
export function limb(pts, ws, cap0 = 'round', cap1 = 'round') {
  const { L, R, cap0: c0, cap1: c1 } = limbSides(pts, ws, cap0, cap1);
  return 'M' + P([...L, ...c1, ...R.slice().reverse(), ...c0]).join('L') + 'Z';
}
// chain of circular arcs through pts: blob hair, knuckle rows. pts[i] = [x, y, k?, sweep?]; radius = chord x k
export function scallop(pts, sweep = 1, k = 0.62) {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const r = Math.hypot(x1 - x0, y1 - y0) * (pts[i][2] ?? k);
    d += `A${f(r)},${f(r)} 0 0 ${pts[i][3] ?? sweep} ${f(x1)},${f(y1)}`;
  }
  return d;
}
// smooth closed curve through pts (pelvis, cushions)
export function closed(pts, n = 10) {
  const N = pts.length, out = [];
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  return 'M' + P(out).join('L') + 'Z';
}
export const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy); return [dx / m, dy / m]; };
export const at = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
export const perp = d => [-d[1], d[0]];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const rot = (p, deg, c = [0, 0]) => { const r = deg * Math.PI / 180, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
// two-bone IK: elbow between shoulder s and wrist w with bone lengths a, b; side +1 / -1 picks the bend
export function elbow(s, w, a, b, side = 1) {
  const d = dist(s, w), u = unit(s, w), n = perp(u);
  const dd = Math.min(d, a + b - 0.01);
  const x = (a * a - b * b + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, a * a - x * x));
  return [s[0] + u[0] * x + n[0] * h * side, s[1] + u[1] * x + n[1] * h * side];
}

// ---------- svg ----------
export const path = (d, fill, sw = W) => `<path d="${d}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"` : ''}/>`;
export const line = (d, sw = WI, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const circ = (cx, cy, r, fill, sw = W) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${sw}"` : ''}/>`;
export const ell = (cx, cy, rx, ry, fill, sw = W, rt = 0) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${sw}"` : ''}${rt ? ` transform="rotate(${f(rt)} ${f(cx)} ${f(cy)})"` : ''}/>`;
// ONE outline around several same-colour shapes (torso + both sleeves, pelvis + front leg): no seams where they join
export const union = (ds, fill, w = WO) => ds.map(d => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="${2 * w}" stroke-linejoin="round"/>`).join('') + ds.map(d => `<path d="${d}" fill="${fill}"/>`).join('');
// a coloured rod / cord with an ink outline: ink stroke underneath, colour stroke on top
export const tubeStroke = (d, col, w, ow = W) => line(d, w + 2 * ow, INK) + line(d, w, col);
export const g = (inner, tf) => `<g${tf ? ` transform="${tf}"` : ''}>${inner}</g>`;
// THE mark of the style: a hand-inked sliver that swells to w (final px) in the middle and ends in points.
// Folds, creases, brows, nose, finger splits, hair splits, shading strokes, white highlight dashes.
export const fold = (pts, w = 1.6, col = INK) => {
  const ws = pts.map((_, i) => (i === 0 || i === pts.length - 1) ? Lw(0.35) : Lw(w));
  if (pts.length === 2) { pts = [pts[0], [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], pts[1]]; ws.splice(1, 0, Lw(w)); }
  return `<path d="${limb(pts, ws)}" fill="${col}"/>`;
};
export const dash = (pts, w = 2.4) => fold(pts, w, C.white);   // white highlight dash on hair, glass, metal

// ---------- decor (card px, unscaled) ----------
export const plus = (x, y, s, sw = 1.8) => line(`M${f(x - s)},${f(y)}H${f(x + s)}M${f(x)},${f(y - s)}V${f(y + s)}`, sw);
// the sparkle cluster every example uses: one big + and two small ones to its right
export const sparkle = (x, y) => plus(x, y, 8.5, 2) + plus(x + 16, y - 13, 3.4, 1.7) + plus(x + 15, y + 14, 2.8, 1.6);
export const ring = (x, y, r = 4.5) => circ(x, y, r, 'none', 1.7);
export const dot = (x, y, col, r) => circ(x, y, r ?? ({ [C.red]: 5.3, [C.yel]: 3.6, [C.blue]: 3.4 }[col] || 3.6), col, 0);
export const square = (x, y, deg = 18) => `<rect x="${f(x - 5)}" y="${f(y - 5)}" width="10" height="10" rx="1.5" fill="none" stroke="${INK}" stroke-width="1.7" transform="rotate(${deg} ${f(x)} ${f(y)})"/>`;
export const check = (x, y, r = 7.6, sw = 1.9) => circ(x, y, r, C.green, sw) + line(`M${f(x - r * 0.47)},${f(y + r * 0.04)}l${f(r * 0.34)},${f(r * 0.34)}l${f(r * 0.63)},${f(-r * 0.66)}`, sw, C.white);
// three short emphasis ticks fanned round a point, opening toward angle deg (0 = up)
export const ticks = (x, y, deg = 0, r = 12, len = 7) => [-28, 0, 28].map(a => {
  const t = (deg + a) * Math.PI / 180, s = [x + Math.sin(t) * r, y - Math.cos(t) * r], e = [x + Math.sin(t) * (r + len), y - Math.cos(t) * (r + len)];
  return line(`M${f(s[0])},${f(s[1])}L${f(e[0])},${f(e[1])}`, 1.8);
}).join('');

// ---------- head (3/4 view turned toward +x; face box 209..264 x 98..160, centre 236,129) ----------
// brows: 'focus' | 'happy' | 'worried'; mouth: 'smile' | 'grin' | 'o'. Put hair in hairBack / hairFront.
export function head(o = {}) {
  const { skin = SKIN.salmon.skin, skinD = SKIN.salmon.skinD, blush = SKIN.salmon.blush, turn = 6, gaze = [1.6, 0.4], hairBack = '', hairFront = '', brows = 'focus', mouth = 'smile', lid = true } = o;
  const h = [hairBack];
  h.push(ell(209.5, 133, 5, 7.2, skin, W), fold([[211, 129.5], [209, 133], [211, 136.5]], 1.2));   // back ear
  h.push(path('M236,98C253,98 264,108 264,124C264,135 263.5,144 258.5,150.5C253.5,156.5 246,160 237,160C228,160 220.5,156 215.5,150C210.5,144 209,135 209,124C209,108 220,98 236,98Z', skin, WO));
  const ex = [226 + turn, 250 + turn * 0.7];
  h.push(ell(ex[0] - 7.5, 144.5, 4.8, 2.8, blush, 0), ell(ex[1] + 5, 144, 3.6, 2.6, blush, 0));
  ex.forEach((x, i) => {
    const rx = i ? 5.4 : 6.2, ry = i ? 7.0 : 7.4;
    h.push(ell(x, 130, rx, ry, C.white, WI));
    h.push(circ(x + gaze[0], 130 + gaze[1], i ? 3.4 : 3.7, INK, 0), circ(x + gaze[0] + 1.3, 130 + gaze[1] - 1.5, 1.25, C.white, 0));
    if (lid) h.push(fold([[x - rx - 0.6, 128.6], [x - rx * 0.2, 122.2], [x + rx + 0.4, 126.4]], 2.0));
  });
  const bl = ex[0], br = ex[1];
  const B = {
    focus: [[[bl - 9, 119.5], [bl - 2, 115.8], [bl + 6.5, 118.6]], [[br - 6.5, 118.2], [br + 0.5, 114.6], [br + 7.2, 116.6]]],
    happy: [[[bl - 9, 118], [bl - 1.5, 112.6], [bl + 6.5, 115.4]], [[br - 6.5, 115], [br + 0.5, 111], [br + 7.5, 113.6]]],
    worried: [[[bl - 8.5, 117.2], [bl - 1, 115.6], [bl + 6.5, 112.6]], [[br - 6.5, 112.6], [br + 0.5, 114.8], [br + 7.5, 116.6]]],
  }[brows];
  h.push(fold(B[0], 4.0), fold(B[1], 3.6));   // thick brows: 4.0 and 3.6 final px
  const nx = 243 + turn;
  h.push(fold([[nx - 0.5, 133.5], [nx + 3.2, 139.2], [nx - 1.4, 141.6]], 1.8));
  const mx = 238 + turn * 0.9;
  if (mouth === 'grin') {
    const m = `M${mx - 9},146C${mx - 4},147.6 ${mx + 4},147.6 ${mx + 9},146C${mx + 9},153.5 ${mx + 4.5},157.6 ${mx},157.6C${mx - 4.5},157.6 ${mx - 9},153.5 ${mx - 9},146Z`;
    h.push(path(m, C.mouth, 0));
    h.push(path(`M${mx - 8},147.2C${mx - 3},148.6 ${mx + 3},148.6 ${mx + 8},147.2L${mx + 7.6},150C${mx + 3},151 ${mx - 3},151 ${mx - 7.6},150Z`, C.white, 0));
    h.push(path(`M${mx - 5.2},154.4C${mx - 3},151.8 ${mx + 3},151.8 ${mx + 5.2},154.4C${mx + 3.8},156.4 ${mx + 2},157 ${mx},157C${mx - 2},157 ${mx - 3.8},156.4 ${mx - 5.2},154.4Z`, C.tongue, 0));
    h.push(path(m, 'none', 1.9));
  } else if (mouth === 'o') {
    h.push(ell(mx, 150.5, 4.2, 5, C.mouth, 1.9), ell(mx, 153, 2.6, 1.6, C.tongue, 0));
  } else {
    const m = `M${mx - 6.5},147.2C${mx - 2},148.4 ${mx + 3},148.2 ${mx + 7},146.4C${mx + 6.6},152 ${mx + 3.4},155 ${mx},155C${mx - 3.6},155 ${mx - 6.4},152 ${mx - 6.5},147.2Z`;
    h.push(path(m, C.mouth, 0));
    h.push(path(`M${mx - 3.6},153.2C${mx - 1.8},151.2 ${mx + 2.4},151.2 ${mx + 4.2},152.8C${mx + 3},154.4 ${mx + 1.6},154.8 ${mx},154.8C${mx - 1.6},154.8 ${mx - 2.8},154.3 ${mx - 3.6},153.2Z`, C.tongue, 0));
    h.push(path(m, 'none', 1.9));
  }
  h.push(hairFront);
  return h.join('');
}
// blob hair: scalloped outer contour + scalloped hairline, one WO outline. outer/hairline are [x, y, k?, sweep?] lists,
// hairline runs from the last outer point back to the first.
export const hair = (outer, hairline, col, k = 0.64) => path(scallop(outer, 1, k) + scallop(hairline, 1).replace(/^M[^A]+/, '') + 'Z', col, WO);

// ---------- clothing bits ----------
export const TORSO = 'M209,182C207,170 215,164 227,163C233,168 242,168 248,163C259,164 266,170 264,182C266.5,194 267.5,208 265.5,222L206.5,222C204.5,208 206,194 209,182Z';
// rolled hem at the end of a sleeve or trouser leg: band across the limb at point a, limb direction d
export const hem = (a, d, col, colD, w = 23) => path(limb([at(a, d, -9), at(a, d, -1)], [w, w], 'flat', 'flat'), col, W) +
  fold([at(at(a, d, -5), perp(d), w * 0.35), at(at(a, d, -4.6), perp(d), 0), at(at(a, d, -5), perp(d), -w * 0.35)], 1.1, colD);
export const sock = (ankle, d, col = C.white) => path(limb([at(ankle, d, -6), at(ankle, d, 3)], [13, 12.5], 'flat', 'flat'), col, W);
// sneaker, toe toward +x, origin at the heel-sole corner region; ankle sits at local (-3.5, -11.5)
export function shoe(x, y, rt = 0, flip = false, { col = C.red, colD = C.redD, cap = C.white, lace = C.white, hi = 0, sole = C.white } = {}) {
  const body = 'M-10,4C-11.5,-2 -10.5,-9 -6.5,-11.5C-3.5,-13.5 1,-13.2 3,-11C5,-9 7.5,-7.2 10.5,-6.4C15.5,-5.2 21.5,-4.4 24.5,-1.2C26.5,1 26.4,3 25.5,4Z';
  const capd = 'M18,-4.6C21.6,-4 24.6,-2.2 25.6,0.6C26.2,2 26,3.2 25.5,4L17.2,4C16.2,1.4 16.5,-1.8 18,-4.6Z';
  const soled = 'M-12,2.5L26.5,2.5C28.6,2.5 29,9.2 26.5,9.2L-10.5,9.2C-13,9.2 -13.5,2.5 -12,2.5Z';
  const s = [path(soled, sole, WO), path(body, col, WO), path(capd, cap, W), fold([[-12, 5.6], [8, 5.6], [27.6, 5.6]], 1.0, INK),
    line('M3.6,-10.6l-1.4,3.6M8,-8.2l-1.4,3.4', 1.6, lace), hi ? circ(-4.6, -4.4, 2.3, C.white, WI) : '', fold([[-7, -8.5], [-8, -3], [-7.2, 2]], 1.5, colD)].join('');
  return g(s, `translate(${f(x)} ${f(y)}) rotate(${f(rt)})${flip ? ' scale(-1 1)' : ''}`);
}
// shoe flat on a ground line: toe direction dir (+1 right, -1 left); returns { svg, ankle }
export function shoeOnGround(heelX, groundY, dir = 1, opts = {}) {
  const ox = heelX + 3.5 * dir, oy = groundY - 9.4;
  return { svg: shoe(ox, oy, 0, dir < 0, opts), ankle: [ox - 3.5 * dir, oy - 11.5] };
}

// ---------- hands ----------
// A fist round a rod. Decide the hand BEFORE calling (references/craft.md, "Handedness"), then check `hand` in the result.
//   c      grip centre on the rod axis (scene units)      v     unit vector along the rod toward its business end
//   elbow  the elbow the forearm comes from                rr    rod radius
//   from   where the bare forearm starts (default: the elbow); pass the cuff point when a sleeve covers the arm
//   view   'palm' = curled fingers wrap the FRONT of the rod (palm faces the viewer behind the rod)
//          'back' = back of the hand in front, knuckle row along the rod, fingertips hidden behind it
// The thumb and index always sit at the business end (true for both hands on a bat, pole or handle grip).
// Returns { behind, front, hand: 'left'|'right', wrist }. Draw: behind -> sleeve -> rod -> front -> cuff band.
// (In the back view the forearm is part of `front`, so a cuff drawn before it would be covered.)
export function fist({ c, v, elbow: el, from, rr = 4.5, view = 'palm', skin = SKIN.salmon.skin, skinD = SKIN.salmon.skinD, fw = [12, 10], k = 1.25, proof = false }) {
  let n = perp(v);
  if ((c[0] - el[0]) * n[0] + (c[1] - el[1]) * n[1] < 0) n = [-n[0], -n[1]];   // n = wrist -> fingertips, across the rod
  // s > 0: the thumb (business end) is the finger direction rotated 90 deg counter-clockwise on screen, which the
  // craft.md table gives as right/back or left/palm; s < 0 gives right/palm or left/back
  const s = v[0] * n[1] - v[1] * n[0];
  const hand = s > 0 ? (view === 'back' ? 'right' : 'left') : (view === 'back' ? 'left' : 'right');
  const M = (p) => [c[0] + (v[0] * p[0] + n[0] * p[1]) * k, c[1] + (v[1] * p[0] + n[1] * p[1]) * k];
  const tf = `matrix(${f(v[0] * k)} ${f(v[1] * k)} ${f(n[0] * k)} ${f(n[1] * k)} ${f(c[0])} ${f(c[1])})`;
  const RED = '#ff0000', BLUE = '#0000ff';
  const wristL = [0.5, -17], wrist = M(wristL);
  // forearm (scene space) from elbow to just past the wrist, unioned with the palm/back block (local, mapped)
  const fa0 = from || el;
  const fa = limb([fa0, lerp(fa0, wrist, 0.5), at(wrist, unit(fa0, wrist), 3)], [fw[0], (fw[0] + fw[1]) / 2, fw[1]], 'flat', 'round');
  const mapD = pts => 'M' + P(pts.map(M)).join('L') + 'Z';
  const smooth = pts => catmull(pts, 8).map(p => [p[0], p[1]]);
  // inked open sides of a thumb (local coords), so its root melts into the hand with no seam
  const thumb = (pts, ws, fill) => {
    const t = limbSides(pts, ws, 'flat', 'round');
    const all = [...t.L, ...t.cap1, ...t.R.slice().reverse()];
    return `<path d="M${P(all).join('L')}Z" fill="${fill}"/><path d="M${P(all).join('L')}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
  };
  const splits = (xs, y, len, dir) => xs.map(x => fold([[x, y].map((q, i) => q), [x + 0.1, y + dir * len * 0.5], [x + 0.15, y + dir * len]], 1.15)).join('');
  const local = inner => `<g transform="${tf}">${inner}</g>`;
  // finger boundaries along the rod: little (-x) .. index (+x, business end)
  const bx = [-11, -5.6, -0.2, 5.4, 11.2];
  if (view === 'palm') {
    const palm = smooth([[-7, -18], [-10.6, -12], [-11.2, -4], [-10.6, 1.5], [10.4, 1.5], [11.6, -5], [10.2, -12.5], [6.5, -18]]);
    const behind = union([fa, mapD(palm)], skin, W) + local(fold([[-8.6, -10], [-9.4, -6], [-8.8, -2.5]], 1.1, skinD));
    // curled finger band in front of the rod: tips toward the wrist (top), bend knuckles past the far edge (bottom)
    const yTip = [-1.2, -2.2, -2.6, -2.0], yBend = [rr + 4.0, rr + 5.4, rr + 5.9, rr + 5.2];
    let d = `M${f(bx[0] + 0.3)},${f(yBend[0] - 2)}L${f(bx[0])},${f(yTip[0] + 1.2)}`;
    for (let i = 0; i < 4; i++) d += `A${f((bx[i + 1] - bx[i]) * 0.56)},${f((bx[i + 1] - bx[i]) * 0.5)} 0 0 1 ${f(bx[i + 1])},${f(i < 3 ? Math.max(yTip[i], yTip[i + 1]) + 0.7 : yTip[3] + 1.4)}`;
    d += `L${f(bx[4] + 0.2)},${f(yBend[3] - 2.4)}`;
    for (let i = 4; i > 0; i--) d += `A${f((bx[i] - bx[i - 1]) * 0.56)},${f((bx[i] - bx[i - 1]) * 0.56)} 0 0 1 ${f(bx[i - 1])},${f(i > 1 ? Math.min(yBend[i - 1], yBend[i - 2]) - 0.6 : yBend[0] - 2)}`;
    d += 'Z';
    let front = path(d, skin, 1.7);
    if (proof) front += `<path d="M${f(bx[3] + 0.6)},${f(yTip[3] + 0.6)}L${f(bx[4] - 0.6)},${f(yTip[3] + 1.6)}L${f(bx[4] - 0.4)},${f(yBend[3] - 3)}L${f(bx[3] + 0.6)},${f(yBend[3] - 1.4)}Z" fill="${BLUE}"/>`;
    front += splits(bx.slice(1, 4), Math.min(...yBend) - 0.4, 2.6, -1) + splits(bx.slice(1, 4), Math.max(...yTip) + 0.3, 1.0, 1);
    front += fold([[bx[0] + 1.6, 1.4], [0, 1.2], [bx[3] + 1, 1.6]], 0.9, skinD);
    // thumb from the radial side of the palm, round the business end, tip resting on the index finger
    front += thumb([[6.8, -12.4], [10, -10], [11.6, -6.4], [11.2, -2.6], [9.2, 0.2]], [6.8, 6.4, 5.8, 5.2, 4.8], proof ? RED : skin);
    front += fold([[7.6, -6.8], [5, -9], [2.6, -12.8]], 1.2, skinD);
    return { behind, front: local(front), hand, wrist };
  }
  // back view: back of the hand covers the rod, knuckle row on the far edge, fingers curl over it out of sight
  const yK = rr + 0.4;
  let fingers = `M${f(bx[0] + 0.6)},${f(yK - 2)}L${f(bx[4] - 0.2)},${f(yK - 2)}L${f(bx[4] + 0.1)},${f(yK + 3.6)}`;
  const yB = [rr + 6.2, rr + 7.4, rr + 7.8, rr + 7.0];
  for (let i = 4; i > 0; i--) fingers += `A${f((bx[i] - bx[i - 1]) * 0.55)},${f((bx[i] - bx[i - 1]) * 0.55)} 0 0 1 ${f(bx[i - 1] + (i === 1 ? 0.6 : 0))},${f(i > 1 ? Math.min(yB[i - 1], yB[i - 2]) - 1.2 : yK + 2.6)}`;
  fingers += 'Z';
  const back = smooth([[-7, -18], [-10.8, -12], [-11.4, -4], [-10.8, yK - 0.6], [10.6, yK - 0.6], [11.8, -4], [10.6, -12.5], [6.5, -18]]);
  let front = path(fingers, skin, 1.7);
  if (proof) front += `<path d="M${f(bx[3] + 0.6)},${f(yK)}L${f(bx[4] - 0.6)},${f(yK)}L${f(bx[4] - 0.8)},${f(yB[3] - 1.6)}L${f(bx[3] + 0.8)},${f(yB[3] - 1)}Z" fill="${BLUE}"/>`;
  front += splits(bx.slice(1, 4), Math.min(...yB) - 0.8, 2.8, -1);
  front = local(front) + union([fa, mapD(back)], skin, W);
  // knuckle bumps along the far edge of the back of the hand, and a tendon crease
  let kn = '';
  for (let i = 0; i < 4; i++) kn += fold([[bx[i] + 1.2, yK - 1.4], [(bx[i] + bx[i + 1]) / 2, yK - 2.6], [bx[i + 1] - 1.2, yK - 1.4]], 1.1, skinD);
  kn += fold([[-2, -12], [0.4, -7], [1.6, -2.4]], 1.0, skinD);
  kn += thumb([[7.4, -8.4], [11.4, -8.8], [13.8, -6.6], [14.4, -3], [13.2, 0.4]], [7.6, 7.4, 6.6, 6, 5.4], proof ? RED : skin);   // inner edge overlaps the hand: no gap
  kn += fold([[13.2, -1.8], [14.6, -0.4], [15.6, 1.2]], 0.9, skinD);
  return { behind: '', front: front + local(kn), hand, wrist };
}

// Where to put a fist's grip centre so its wrist lands on `wrist` (place wrists first, within reach of the shoulder:
// two 36-unit bones reach 72). v = rod direction toward the business end, elbow = the elbow or shoulder side.
export function gripFromWrist(wrist, v, elbow, k = 1.25) {
  let n = perp(v);
  if ((wrist[0] - elbow[0]) * n[0] + (wrist[1] - elbow[1]) * n[1] < 0) n = [-n[0], -n[1]];
  return [wrist[0] - k * (0.5 * v[0] - 17 * n[0]), wrist[1] - k * (0.5 * v[1] - 17 * n[1])];
}

// ---------- assembly ----------
// decor in card px; scene in local units scaled by S about the origin then moved by (TX, TY); scene stroke widths are final px
export function compose({ id, label = '', decor = '', scene, defs = '', TX = 0, TY = 0 }) {
  const sc = scene.replace(/stroke-width="([\d.]+)"/g, (m, v) => `stroke-width="${f(v / S)}"`);
  return `<svg${label ? ` role="img" aria-label="${label}, Outlined cartoon style"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" fill="none">
${defs ? `<defs>${defs}</defs>\n` : ''}<g id="${id}">
<g id="${id}-decor">${decor}</g>
<g id="${id}-scene" transform="translate(${f(TX)} ${f(TY)}) scale(${S})">
${sc}
</g>
</g>
</svg>
`;
}

// ---------- self-test ----------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = process.argv[2] || 'outline-kit-demo.svg', proof = process.argv.includes('--proof');
  const sk = SKIN.peach, el = [];
  // a rod held by two fists: left one palm view, right one back view; business end to the upper right
  const v = unit([0, 0], [0.92, -0.38]), A = [250, 230], B = at(A, v, 60);
  const f1 = fist({ c: A, v, elbow: [214, 196], rr: 4.5, view: 'palm', ...sk, proof });
  const f2 = fist({ c: B, v, elbow: [268, 268], rr: 4.5, view: 'back', ...sk, proof });
  const rod = path(limb([at(A, v, -40), at(B, v, 60)], [9, 9], 'round', 'round'), C.yel, WO);
  el.push(f1.behind, f2.behind, path(limb([[214, 196], at(f1.wrist, unit([214, 196], f1.wrist), -10)], [20, 18], 'round', 'flat'), C.red, WO), rod, f1.front, f2.front);
  el.push(g(head({ ...sk, brows: 'happy', mouth: 'grin', hairFront: hair([[210, 136], [203, 120], [204, 103], [212, 89], [226, 80], [243, 79], [258, 86], [267, 98], [270, 112], [266, 125]],
    [[266, 125], [264.5, 110, 1, 1], [254, 101.5, 0.95, 1], [235, 104, 0.75, 1], [219, 116, 0.72, 1], [212, 128, 0.7, 0], [210, 136, 0.7, 0]], C.yel, 0.98) + dash([[230, 84.6], [236, 83.6], [242, 84.2]]) }), 'translate(-60 -20)'));
  const decor = sparkle(110, 70) + ring(400, 90) + dot(90, 250, C.yel) + dot(380, 280, C.red) + dot(410, 250, C.blue) + square(360, 310) + check(130, 300);
  fs.writeFileSync(out, compose({ id: 'kd', label: 'Kit demo', decor, scene: el.join('\n'), TX: 10, TY: 10 }));
  console.log('wrote', out, `fist 1: ${f1.hand} hand, palm view; fist 2: ${f2.hand} hand, back view`);
}
