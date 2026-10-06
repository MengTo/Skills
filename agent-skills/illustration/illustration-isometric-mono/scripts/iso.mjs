// Isometric-mono scene kit: projection, face shading, platform slab, floor shadows and glows, and the
// recurring props of the three example cards. Every number is lifted from the generators that produced
// examples/*.svg; scripts/dev-stack.gen.mjs rebuilds examples/dev-stack.svg with this file.
// No dependencies beyond Node's fs. Deterministic: no randomness anywhere.
//
//   import * as I from '/abs/path/illustration-isometric-mono/scripts/iso.mjs';
//   I.init('dc-'); I.floorDefs(); I.platform();
//   I.castShadow(I.rectFoot(-100, -66, -100, -68), 84 * 0.35, 0.62, 0.26);   // all shadows + glows first
//   I.glow(-60, -54, 48, 22, I.MG, 0.46);
//   I.flushFloor();                                                        // then objects, back to front
//   I.rack({ x0: -100, x1: -66, y0: -100, y1: -68, h: 84 }, 1);
//   I.writeSVG('card.svg', 'Data Center');
//
// Detail helpers: hatch (ribs, slats, vents), dotGrid (perforations), fan (round grille). Helper props: rack, database,
// laptop, container, mug, card, cloudBadge, books, plant, tower, cable + cableShadow.
//
// Plan coordinates: x runs to the lower right, y to the lower left, z up. The platform top spans
// -122..122 in x and y at z = 0. Faces: +z top, +y "left" (faces lower left), +x "right" (faces lower right).
// Only faces whose normal has a positive x, y or z component are visible.
import fs from 'node:fs';

// ---------------- palette ----------------
export const OUT = '#0f3d30', OW = '#fbf8f1', PM = '#c9f3d6', MT = '#8de8a6', MG = '#5cc58a', DG = '#2f9e6c', VD = '#0b4a3a';
export const SW = 0.9;     // outline weight
export const FW = 0.55;    // fine detail weight

// ---------------- projection ----------------
export const C = Math.cos(Math.PI / 6);
export const CX = 240, CY = 204, K = 0.91;
export const P = (x, y, z = 0) => [CX + (x - y) * C * K, CY + ((x + y) * 0.5 - z) * K];
export const fm = v => (Math.round(v * 100) / 100).toString();
export const pt = p => { const q = P(...p); return fm(q[0]) + ' ' + fm(q[1]); };
export const D = (pts, close = true) => 'M' + pts.map(pt).join(' L') + (close ? 'Z' : '');
export const isoMat = (z = 0) => `matrix(${fm(C * K)} ${fm(0.5 * K)} ${fm(-C * K)} ${fm(0.5 * K)} ${fm(CX)} ${fm(CY - z * K)})`;

export let PFX = 'iso-';
export const out = [];
export const defs = [];
export const shadowEls = [];
let gid = 0;
// start a card: set the id prefix (e.g. 'dc-') and clear any previous drawing
export function init(prefix) { PFX = prefix; out.length = 0; defs.length = 0; shadowEls.length = 0; gid = 0; }
export const id = p => `${PFX}${p}${++gid}`;
export function el(s) { out.push(s); }
export function fillP(d, fill, extra = '') { el(`<path d="${d}" fill="${fill}"${extra}/>`); }
export function strokeP(d, stroke = OUT, w = SW, extra = '') { el(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`); }
export function both(d, fill, stroke = OUT, w = SW, extra = '') { el(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`); }
export function dot(p3, r, fill) { const p = P(...p3); el(`<circle cx="${fm(p[0])}" cy="${fm(p[1])}" r="${r}" fill="${fill}"/>`); }

// ---------------- colour ----------------
export const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
export function shade(n, mat) {
  const wt = Math.max(n[2], 0), wl = Math.max(n[1], 0), wr = Math.max(n[0], 0);
  const s = wt + wl + wr || 1;
  const c = [hex(mat.top), hex(mat.left), hex(mat.right)];
  return toHex([0, 1, 2].map(i => (c[0][i] * wt + c[1][i] * wl + c[2][i] * wr) / s));
}
export const vis = n => n[0] + n[1] + n[2] > 1e-6;
export const norm = a => { const m = Math.hypot(...a) || 1; return a.map(v => v / m); };
export function newell(poly) {
  let n = [0, 0, 0];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm(n).map(v => -v);
}

// ---------------- materials ----------------
export const M = {
  light: { top: OW, left: MT, right: MG },
  pale: { top: OW, left: PM, right: MT },
  mid: { top: OW, left: MG, right: DG },
  deep: { top: VD, left: MG, right: DG },
  dark: { top: DG, left: DG, right: VD },
};

// ---------------- convex polyhedron ----------------
export function poly3(faces, mat, opt = {}) {
  const seen = new Map();
  const vf = [];
  for (const f of faces) {
    const n = newell(f);
    if (!vis(n)) continue;
    vf.push(f);
    fillP(D(f), opt.fills?.[faces.indexOf(f)] || shade(n, mat));
  }
  const segs = [];
  for (const f of vf) for (let i = 0; i < f.length; i++) {
    const a = f[i], b = f[(i + 1) % f.length];
    const k1 = pt(a) + '|' + pt(b), k2 = pt(b) + '|' + pt(a);
    if (seen.has(k1) || seen.has(k2)) continue;
    seen.set(k1, 1); segs.push([a, b]);
  }
  strokeP(segs.map(s => D(s, false)).join(' '), OUT, opt.sw || SW);
}
export function boxFaces(x0, x1, y0, y1, z0, z1) {
  return [
    [[x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1]],
    [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]],
    [[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]],
    [[x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0]],
    [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]],
    [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
  ];
}
export function box(x0, x1, y0, y1, z0, z1, mat, opt) { poly3(boxFaces(x0, x1, y0, y1, z0, z1), mat, opt); }
// box rotated by ang (deg) about z through (cx,cy)
export function rbox(cx, cy, hx, hy, ang, z0, z1, mat, opt) {
  const t = ang * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  const f = boxFaces(-hx, hx, -hy, hy, z0, z1).map(face => face.map(([x, y, z]) => [cx + x * c - y * s, cy + x * s + y * c, z]));
  poly3(f, mat, opt);
}
export const rot = (cx, cy, ang) => { const t = ang * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return (u, v) => [cx + u * c - v * s, cy + u * s + v * c]; };

// ---------------- rounded-rect ring in the plane ----------------
export function rring(cx, cy, hx, hy, r, off = 0, seg = 4) {
  const R = r + off, ax = hx - r, ay = hy - r;
  const cs = [[ax, -ay, -90], [ax, ay, 0], [-ax, ay, 90], [-ax, -ay, 180]];
  const pts = [];
  for (const [ccx, ccy, a0] of cs) for (let i = 0; i <= seg; i++) {
    const a = (a0 + 90 * i / seg) * Math.PI / 180;
    pts.push([cx + ccx + R * Math.cos(a), cy + ccy + R * Math.sin(a)]);
  }
  return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
}
export const edgeN = (a, b) => norm([b[1] - a[1], -(b[0] - a[0]), 0]);

export function prismZ(ring, z0, z1, mat, opt = {}) {
  const n = ring.length;
  const top = ring.map(p => [p[0], p[1], z1]);
  const vis_ = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    const nn = edgeN(a, b);
    vis_.push(nn[0] + nn[1] > 1e-6);
    if (!vis_[i]) continue;
    const col = opt.sideFill ? opt.sideFill(nn) : shade(nn, mat);
    const q = [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]];
    el(`<path d="${D(q)}" fill="${col}" stroke="${col}" stroke-width="0.35" stroke-linejoin="round"/>`);
  }
  if (opt.beforeTop) opt.beforeTop();
  if (!opt.noTop) fillP(D(top), opt.topFill || mat.top);
  let s = opt.noTop ? '' : D(top);
  for (let i = 0; i < n; i++) {
    if (!vis_[i]) continue;
    const a = ring[i], b = ring[(i + 1) % n];
    s += ' ' + D([[a[0], a[1], z0], [b[0], b[1], z0]], false);
    if (opt.noTop) s += ' ' + D([[a[0], a[1], z1], [b[0], b[1], z1]], false);
    const prev = vis_[(i - 1 + n) % n], next = vis_[(i + 1) % n];
    if (!prev) s += ' ' + D([[a[0], a[1], z0], [a[0], a[1], z1]], false);
    if (!next) s += ' ' + D([[b[0], b[1], z0], [b[0], b[1], z1]], false);
    if (opt.creases && opt.creases(i)) s += ' ' + D([[b[0], b[1], z0], [b[0], b[1], z1]], false);
  }
  strokeP(s, OUT, opt.sw || SW);
}
export const circle = (cx, cy, r, seg = 12) => rring(cx, cy, r, r, r, 0, seg);
// visible front arc of a vertical cylinder at height z (angles -45..135 face the viewer)
export function frontArc(x, y, r, z, a0 = -45, a1 = 135, step = 6) {
  const arc = [];
  for (let a = a0; a <= a1 + 1e-9; a += step) { const t = a * Math.PI / 180; arc.push([x + r * Math.cos(t), y + r * Math.sin(t), z]); }
  return D(arc, false);
}

// ---------------- helpers: draw in face planes ----------------
export const onTop = z => (x, y) => [x, y, z];
export const onLeft = y => (x, z) => [x, y, z];
export const onRight = x => (y, z) => [x, y, z];
export function quad(f, a0, b0, a1, b1) { return [f(a0, b0), f(a1, b0), f(a1, b1), f(a0, b1)]; }
export function line(f, pts) { return D(pts.map(p => f(...p)), false); }

// text laid onto a face. face: 'left' (+y face, u along +x), 'right' (+x face, u along -y), 'top'
export function textOn(face, p3, str, size, fill, extra = '') {
  const o = P(...p3);
  let m;
  if (face === 'left') m = [C * K, 0.5 * K, 0, K];
  else if (face === 'right') m = [C * K, -0.5 * K, 0, K];
  else m = [C * K, 0.5 * K, -C * K, 0.5 * K];
  el(`<text transform="matrix(${m.map(fm).join(' ')} ${fm(o[0])} ${fm(o[1])})" font-family="ui-monospace" font-size="${size}" fill="${fill}"${extra}>${str}</text>`);
}

// ---------------- fine repeated detail on a face ----------------
// F is a face mapper (onTop / onLeft / onRight). Parallel lines inside the face rectangle u0..u1 x w0..w1,
// every `step`, running along w (dir 'w': vertical ribs, bays, slats on a side face) or along u (dir 'u': vents, louvres).
export function hatch(F, u0, u1, w0, w1, step, dir = 'w', col = DG, sw = 0.5, extra = '') {
  let s = '';
  if (dir === 'w') for (let u = u0; u <= u1 + 1e-9; u += step) s += line(F, [[u, w0], [u, w1]]);
  else for (let w = w0; w <= w1 + 1e-9; w += step) s += line(F, [[u0, w], [u1, w]]);
  strokeP(s, col, sw, extra);
}
// a grid of round dots (perforations, cork, canvas grids): zero-length round-capped strokes
export function dotGrid(F, u0, u1, w0, w1, step, col = DG, sw = 0.7, opacity = 0.7) {
  let d = '';
  for (let u = u0; u <= u1 + 1e-9; u += step) for (let w = w0; w <= w1 + 1e-9; w += step) { const p = P(...F(u, w)); d += `M${fm(p[0])} ${fm(p[1])}h0.01`; }
  el(`<path d="${d}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-opacity="${opacity}"/>`);
}
// round fan grille centred at (uc, wc) on a face: very deep disc, six swept blades, hub
export function fan(F, uc, wc, r, blade = MG) {
  both(D(circle(uc, wc, r, 12).map(([u, w]) => F(u, w))), VD, OUT, 0.55);
  let sp = '';
  for (let a = 0; a < 6; a++) { const t = a * Math.PI / 3 + 0.3; sp += line(F, [[uc + Math.cos(t) * 2.2, wc + Math.sin(t) * 2.2], [uc + Math.cos(t + 0.55) * (r - 1.2), wc + Math.sin(t + 0.55) * (r - 1.2)]]); }
  strokeP(sp, blade, 0.9);
  both(D(circle(uc, wc, 2.2, 6).map(([u, w]) => F(u, w))), blade, OUT, 0.45);
}

// ---------------- platform ----------------
export const H = 122, PR = 26;
export function platform() {
  const seg = 4;
  const dC = 3.2, hB = 11, dB = 2.4;
  const rings = [
    { off: 0, z: 0 },
    { off: dC, z: -dC },
    { off: dC, z: -dC - hB },
    { off: dC - dB, z: -dC - hB - dB },
  ].map(r => ({ ...r, pts: rring(0, 0, H, H, PR, r.off, seg) }));
  const n = rings[0].pts.length;
  const gs = rring(0, 0, H, H, PR, dC - 1, 4).map(p => [p[0] + 4, p[1] + 4, -dC - hB - dB - 3]);
  el(`<path d="${D(gs)}" fill="${MG}" fill-opacity="0.2" filter="url(#${PFX}blur)"/>`);
  const bands = [
    { top: PM, left: PM, right: MT },
    { top: MT, left: MT, right: MG },
    { top: MG, left: MG, right: DG },
  ];
  const visF = [];
  for (let i = 0; i < n; i++) {
    const a = rings[0].pts[i], b = rings[0].pts[(i + 1) % n];
    const nn = edgeN(a, b);
    visF.push(nn[0] + nn[1] > 1e-6);
  }
  for (let i = 0; i < n; i++) {
    if (!visF[i]) continue;
    const j = (i + 1) % n;
    const nn = edgeN(rings[0].pts[i], rings[0].pts[j]);
    for (let k = 0; k < 3; k++) {
      const A = rings[k], B = rings[k + 1];
      const q = [[...A.pts[i], A.z], [...A.pts[j], A.z], [...B.pts[j], B.z], [...B.pts[i], B.z]];
      const col = shade(nn, bands[k]);
      el(`<path d="${D(q)}" fill="${col}" stroke="${col}" stroke-width="0.35" stroke-linejoin="round"/>`);
    }
  }
  let seams = '';
  for (let i = 0; i < n; i++) {
    const prev = visF[(i - 1 + n) % n], cur = visF[i];
    if (!(prev && cur)) continue;
    seams += ' ' + D([[...rings[1].pts[i], rings[1].z], [...rings[2].pts[i], rings[2].z]], false);
    seams += ' ' + D([[...rings[0].pts[i], rings[0].z], [...rings[1].pts[i], rings[1].z]], false);
    seams += ' ' + D([[...rings[2].pts[i], rings[2].z], [...rings[3].pts[i], rings[3].z]], false);
  }
  strokeP(seams, OUT, 0.5, ' stroke-opacity="0.55"');
  let s = '';
  for (let k = 1; k < 4; k++) {
    for (let i = 0; i < n; i++) if (visF[i]) {
      const j = (i + 1) % n;
      s += ' ' + D([[...rings[k].pts[i], rings[k].z], [...rings[k].pts[j], rings[k].z]], false);
    }
  }
  for (let i = 0; i < n; i++) {
    const prev = visF[(i - 1 + n) % n], cur = visF[i];
    if (prev !== cur) s += ' ' + D(rings.map(r => [...r.pts[i], r.z]), false);
  }
  strokeP(s, OUT, SW);
  both(D(rings[0].pts.map(p => [...p, 0])), OW, OUT, SW);
  strokeP(D(rring(0, 0, H, H, PR, -6.5, 4).map(p => [...p, 0])), MG, 0.6, ' stroke-opacity="0.75"');
}

// ---------------- floor decals: shadows + glows ----------------
export function floorDefs() {
  defs.push(`<clipPath id="${PFX}platclip"><path d="${D(rring(0, 0, H, H, PR, -1, 4).map(p => [...p, 0]))}"/></clipPath>`);
  defs.push(`<filter id="${PFX}blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4"/></filter>`);
  defs.push(`<filter id="${PFX}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>`);
}
export function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
export const SHK = 1.6;
export function castShadow(foot, h, k = 0.62, a = 0.2) {
  const L = h * k;
  const pts = hull(foot.concat(foot.map(p => [p[0] + L, p[1] - L * 0.18])));
  const xs = foot.map(p => p[0]);
  const x0 = (Math.min(...xs) + Math.max(...xs)) / 2, x1 = Math.max(...xs) + L;
  const yc = foot.reduce((s, p) => s + p[1], 0) / foot.length;
  const g = id('sh');
  defs.push(`<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="${fm(x0)}" y1="${fm(yc)}" x2="${fm(x1)}" y2="${fm(yc)}" gradientTransform="${isoMat(0)}"><stop offset="0" stop-color="${DG}" stop-opacity="${fm(a * SHK)}"/><stop offset="0.45" stop-color="${MG}" stop-opacity="${fm(a * SHK * 0.55)}"/><stop offset="1" stop-color="${MG}" stop-opacity="0"/></linearGradient>`);
  shadowEls.push(`<path d="${D(pts.map(p => [...p, 0]))}" fill="url(#${g})"/>`);
}
export const rectFoot = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export function glow(x, y, rx, ry, col, a) {
  const g = id('gl');
  defs.push(`<radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="${isoMat(0)} translate(${fm(x)} ${fm(y)}) scale(${fm(rx)} ${fm(ry)})"><stop offset="0" stop-color="${col}" stop-opacity="${a}"/><stop offset="0.5" stop-color="${col}" stop-opacity="${fm(a * 0.4)}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`);
  const ring = rring(x, y, rx, ry, Math.min(rx, ry), 0, 8);
  shadowEls.push(`<path d="${D(ring.map(p => [...p, 0]))}" fill="url(#${g})"/>`);
}
export function flushFloor() {
  el(`<g clip-path="url(#${PFX}platclip)"><g filter="url(#${PFX}soft)">${shadowEls.join('')}</g></g>`);
  shadowEls.length = 0;
}
// soft light halo in screen space around a 3D point (for lamps)
export function halo(p3, r, col, a) {
  const g = id('ha');
  const p = P(...p3);
  defs.push(`<radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${fm(p[0])}" cy="${fm(p[1])}" r="${fm(r)}"><stop offset="0" stop-color="${col}" stop-opacity="${a}"/><stop offset="0.45" stop-color="${col}" stop-opacity="${fm(a * 0.35)}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`);
  el(`<circle cx="${fm(p[0])}" cy="${fm(p[1])}" r="${fm(r)}" fill="url(#${g})"/>`);
}

// ---------------- curves ----------------
export function catmull(pts, n = 10) {
  const outp = [];
  const q = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < q.length - 2; i++) {
    const [p0, p1, p2, p3] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      outp.push([0, 1, 2].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  outp.push(pts[pts.length - 1]);
  return outp;
}

// ---------------- extruded flat shape (like the cloud badge) ----------------
// shape: CCW points (u,w). F(u,w) -> front-face 3D point. back: offset vector of the back face.
// uDir/wDir: 3D unit vectors of u and w, used to shade the side walls.
export function extrude(shape, F, back, uDir, wDir, opt = {}) {
  const B = (u, w) => { const p = F(u, w); return [p[0] + back[0], p[1] + back[1], p[2] + back[2]]; };
  const n = shape.length;
  const quads = [];
  for (let i = 0; i < n; i++) {
    const a = shape[i], b = shape[(i + 1) % n];
    const nu = b[1] - a[1], nw = -(b[0] - a[0]);
    const nn = norm([0, 1, 2].map(k => nu * uDir[k] + nw * wDir[k]));
    if (nn[0] + nn[1] + nn[2] <= 1e-6) { quads.push(null); continue; }
    const q = [F(...a), F(...b), B(...b), B(...a)];
    const depth = q.reduce((s, p) => s + p[0] + p[1] + p[2], 0) / 4;
    quads.push({ q, nn, depth, i });
  }
  const order = quads.filter(Boolean).sort((p, q) => p.depth - q.depth);
  const mat = opt.mat || { top: OW, left: MT, right: DG };
  let edges = '';
  for (const o of order) {
    const col = shade(o.nn, mat);
    el(`<path d="${D(o.q)}" fill="${col}" stroke="${col}" stroke-width="0.35" stroke-linejoin="round"/>`);
    const prev = quads[(o.i - 1 + n) % n], next = quads[(o.i + 1) % n];
    let e = D([o.q[2], o.q[3]], false);
    if (!prev) e += D([o.q[0], o.q[3]], false);
    if (!next) e += D([o.q[1], o.q[2]], false);
    const a = shape[o.i], b = shape[(o.i + 1) % n], c = shape[(o.i + 2) % n];
    const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    const ang = Math.abs(Math.atan2(turn, (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1])));
    if (ang > (opt.creaseAng || 0.5) && next) e += D([o.q[1], o.q[2]], false);
    strokeP(e, OUT, opt.edgeW || SW);
  }
  both(D(shape.map(p => F(...p))), opt.face || MT, OUT, opt.sw || SW);
}

// ---------------- shared props ----------------
export function mug(MUG, opt = {}) {
  const { x, y, r } = MUG;
  let z0 = 0;
  if (opt.coaster !== false) { prismZ(circle(x, y, r + 5, 12), 0, 1.8, M.pale); z0 = 1.8; }
  const z1 = z0 + 18.7;
  prismZ(circle(x, y, r, 12), z0, z1, opt.mat || M.light, {
    beforeTop: () => {
      strokeP(frontArc(x, y, r, z0 + 4) + ' ' + frontArc(x, y, r, z0 + 5.6), DG, 0.55);
      if (opt.decor) opt.decor(z0, z1);
    }
  });
  const T = onTop(z1);
  both(D(circle(x, y, r - 1.3, 12).map(p => T(...p))), VD, OUT, 0.5);
  const hp = [];
  for (let a = -90; a <= 90; a += 10) {
    const t = a * Math.PI / 180;
    hp.push([x + r - 0.6 + 6.2 * Math.cos(t), y, z0 + 9.6 + 5.6 * Math.sin(t)]);
  }
  strokeP(D(hp, false), OUT, 3.9);
  strokeP(D(hp, false), MG, 2.1);
  return z1;
}

export function container(CT) {
  const { x0, x1, y0, y1, h } = CT;
  box(x0, x1, y0, y1, 0, h, M.light);
  const T = onTop(h);
  const alongY = (y1 - y0) > (x1 - x0);
  const LF = alongY ? onRight(x1) : onLeft(y1);
  const [a0, a1] = alongY ? [y0, y1] : [x0, x1];
  const DF = alongY ? onLeft(y1) : onRight(x1);
  const [b0, b1] = alongY ? [x0, x1] : [y0, y1];
  let s = line(LF, [[a0, h - 2.6], [a1, h - 2.6]]) + line(LF, [[a0, 2.6], [a1, 2.6]]) +
    line(LF, [[a0 + 2.4, 2.6], [a0 + 2.4, h - 2.6]]) + line(LF, [[a1 - 2.4, 2.6], [a1 - 2.4, h - 2.6]]);
  strokeP(s, OUT, 0.55);
  let rb = '';
  for (let a = a0 + 5; a <= a1 - 4.5; a += 2.6) rb += line(LF, [[a, 3.6], [a, h - 3.6]]);
  strokeP(rb, alongY ? VD : DG, 0.6, alongY ? ' stroke-opacity="0.75"' : '');
  let ds = line(DF, [[b0, h - 2.6], [b1, h - 2.6]]) + line(DF, [[b0, 2.6], [b1, 2.6]]) +
    line(DF, [[b0 + 2.2, 2.6], [b0 + 2.2, h - 2.6]]) + line(DF, [[b1 - 2.2, 2.6], [b1 - 2.2, h - 2.6]]) +
    line(DF, [[(b0 + b1) / 2, 2.6], [(b0 + b1) / 2, h - 2.6]]);
  strokeP(ds, OUT, 0.55);
  let bars = '';
  const bm = (b0 + b1) / 2;
  for (const bb of [b0 + 6, bm - 3.2, bm + 3.2, b1 - 6]) {
    bars += line(DF, [[bb, 4], [bb, h - 4]]);
    bars += line(DF, [[bb, 12], [bb + (bb < bm ? 1.8 : -1.8), 12]]);
  }
  strokeP(bars, VD, 0.7);
  for (const bb of [b0 + 6, bm - 3.2, bm + 3.2, b1 - 6]) for (const zz of [6.5, h - 6.5]) {
    both(D(quad(DF, bb - 0.9, zz - 0.8, bb + 0.9, zz + 0.8)), OW, OUT, 0.35);
  }
  let rf = '';
  for (let a = a0 + 4; a <= a1 - 3; a += 4.5) rf += alongY ? line(T, [[x0 + 2, a], [x1 - 2, a]]) : line(T, [[a, y0 + 2], [a, y1 - 2]]);
  strokeP(rf, MG, 0.5);
  for (const [cx_, cy_] of [[x0 + 1.4, y1 - 1.4], [x1 - 1.4, y1 - 1.4], [x1 - 1.4, y0 + 1.4], [x0 + 1.4, y0 + 1.4]]) {
    both(D(quad(T, cx_ - 1.1, cy_ - 1.1, cx_ + 1.1, cy_ + 1.1)), MG, OUT, 0.4);
  }
  if (CT.label !== false) {
    const la = alongY ? a1 - 22 : a0 + 9, lz = h / 2;
    both(D(quad(LF, la - 1, lz - 5, la + 13, lz + 5)), OW, OUT, 0.55);
    for (const [bx, bz] of [[la + 1, lz - 3.4], [la + 4.4, lz - 3.4], [la + 7.8, lz - 3.4], [la + 2.7, lz - 0.2], [la + 6.1, lz - 0.2], [la + 4.4, lz + 3]]) {
      both(D(quad(LF, bx, bz, bx + 3, bz + 2.6)), MG, OUT, 0.35);
    }
  }
  return { LF, DF, a0, a1, b0, b1, alongY };
}


// ======================================================================
// PROPS (from the three example generators). Each takes a plain object of plan coordinates.
// ======================================================================

// server rack: { x0, x1, y0, y1, h }, front door on the +y face; seed varies the unit pattern
export function rack(R, seed) {
  const { x0, x1, y0, y1, h } = R;
  box(x0, x1, y0, y1, 0, h, M.mid);
  // front (+y) panel
  const F = onLeft(y1);
  // door inset
  strokeP(D(quad(F, x0 + 2, 3, x1 - 2, h - 3)), OUT, 0.5, ' stroke-opacity="0.7"');
  // plinth line
  strokeP(line(F, [[x0, 3], [x1, 3]]), OUT, 0.5, ' stroke-opacity="0.6"');
  strokeP(line(onRight(x1), [[y0, 3], [y1, 3]]), OUT, 0.5, ' stroke-opacity="0.6"');
  // units
  const pitch = 6.4, uh = 4.4;
  let k = 0;
  for (let z = 6; z + uh <= h - 5; z += pitch, k++) {
    const type = (k * 7 + seed * 3) % 5;
    const big = type === 4 && z + uh + pitch <= h - 5;
    const zt = z + (big ? uh + pitch : uh);
    both(D(quad(F, x0 + 4, z, x1 - 4, zt)), VD, OUT, 0.5);
    const zm = (z + zt) / 2;
    // LEDs
    const led1 = P(...F(x0 + 6.3, zm)), led2 = P(...F(x0 + 8.8, zm));
    el(`<circle cx="${fm(led1[0])}" cy="${fm(led1[1])}" r="0.8" fill="${(k + seed) % 3 === 0 ? PM : MT}"/>`);
    if (type !== 2) el(`<circle cx="${fm(led2[0])}" cy="${fm(led2[1])}" r="0.7" fill="${MG}"/>`);
    if (big) {
      // drive bays: vertical ticks
      let s = '';
      for (let x = x0 + 11; x <= x1 - 6; x += 2) s += ' ' + line(F, [[x, z + 1.2], [x, zt - 1.2]]);
      strokeP(s, DG, 0.55);
      z += pitch; k++;
    } else if (type === 1 || type === 3) {
      let s = '';
      for (let x = x0 + 12; x <= x1 - 6.5; x += 1.6) s += ' ' + line(F, [[x, z + 1.1], [x, zt - 1.1]]);
      strokeP(s, DG, 0.45);
    } else {
      strokeP(line(F, [[x0 + 12, zm], [x1 - 6.5, zm]]), DG, 0.8);
    }
  }
  // side (+x) vents
  const S = onRight(x1);
  strokeP(D(quad(S, y0 + 3, 6, y1 - 3, h - 6)), OUT, 0.5, ' stroke-opacity="0.45"');
  let v = '';
  for (let z = h - 12; z >= h - 30; z -= 2.2) v += ' ' + line(S, [[y0 + 7, z], [y1 - 7, z]]);
  for (let z = 14; z <= 26; z += 2.2) v += ' ' + line(S, [[y0 + 7, z], [y1 - 7, z]]);
  strokeP(v, VD, 0.5, ' stroke-opacity="0.55"');
  // top: two fans
  const T = onTop(h);
  for (const yy of [y0 + 7.5, y1 - 7.5]) {
    const xc = (x0 + x1) / 2;
    const c = circle(xc, yy, 5.6, 8).map(p => T(...p));
    both(D(c), PM, OUT, 0.5);
    const c2 = circle(xc, yy, 1.6, 4).map(p => T(...p));
    both(D(c2), MG, OUT, 0.45);
    let b = '';
    for (let a = 0; a < 4; a++) {
      const t = a * Math.PI / 2 + 0.5;
      b += ' ' + D([T(xc + Math.cos(t) * 2, yy + Math.sin(t) * 2), T(xc + Math.cos(t + 0.5) * 5, yy + Math.sin(t + 0.5) * 5)], false);
    }
    strokeP(b, DG, 0.5);
  }
}

// database: three stacked platters { x, y, r }; sets DB.h to the top height
export function database(DB) {
  const { x, y, r } = DB;
  const segs = [];
  let z = 0;
  for (let i = 0; i < 3; i++) {
    const z0 = z, z1 = z + 12;
    prismZ(circle(x, y, r, 12), z0, z1, M.light, {
      beforeTop: () => {
        // platter lines on the side
        let s = '';
        for (const zz of [z0 + 4, z0 + 8]) {
          const arc = [];
          for (let a = -45; a <= 135; a += 6) { const t = a * Math.PI / 180; arc.push([x + r * Math.cos(t), y + r * Math.sin(t), zz]); }
          s += ' ' + D(arc, false);
        }
        strokeP(s, DG, 0.5, ' stroke-opacity="0.8"');
        // status dots on the front
        for (let k = 0; k < 3; k++) {
          const t = (78 + k * 9) * Math.PI / 180;
          const p = P(x + (r + 0.1) * Math.cos(t), y + (r + 0.1) * Math.sin(t), z0 + 6);
          el(`<circle cx="${fm(p[0])}" cy="${fm(p[1])}" r="0.75" fill="${k === 0 ? OW : VD}"/>`);
        }
      }
    });
    z = z1;
    if (i < 2) { prismZ(circle(x, y, r - 4, 10), z, z + 3, M.mid); z += 3; }
  }
  // top detail
  const T = onTop(z);
  strokeP(D(circle(x, y, r - 5, 10).map(p => T(...p))), MG, 0.55);
  strokeP(D(circle(x, y, r - 10, 10).map(p => T(...p))), MG, 0.55);
  both(D(circle(x, y, 2.4, 6).map(p => T(...p))), MT, OUT, 0.5);
  DB.h = z;
}

// laptop: base footprint { x0, x1, y0, y1 }, lid hinged on the y0 edge, screen facing +y, code on screen; sets LP.lid
export function laptop(LP) {
  const { x0, x1, y0, y1 } = LP;
  const bh = 3.4;
  prismZ(rring((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, 2.5, 0, 3), 0, bh, M.light);
  const T = onTop(bh);
  // keyboard well
  const kx0 = x0 + 7, kx1 = x1 - 7, ky0 = y0 + 6.5, ky1 = y0 + 24;
  both(D(quad(T, kx0, ky0, kx1, ky1)), VD, OUT, 0.5);
  const cols = 13, rows = 4, g = 0.75;
  const kw = (kx1 - kx0 - g) / cols, kh = (ky1 - ky0 - g) / rows;
  let keys = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let c1 = c + 1;
      if (r === 3 && c === 4) c1 = 9;
      if (r === 3 && c > 4 && c < 9) continue;
      keys += D(quad(T, kx0 + g + c * kw, ky0 + g + r * kh, kx0 + c1 * kw, ky0 + (r + 1) * kh));
    }
  }
  fillP(keys, DG);
  // trackpad
  const tx = (x0 + x1) / 2;
  both(D(quad(T, tx - 13, y0 + 28.5, tx + 13, y1 - 5)), PM, OUT, 0.5);
  // lid
  const phi = 13 * Math.PI / 180, L = 48, t = 2.6;
  const yf = y0 + t;           // front surface at hinge
  const lp = (u, w, back = 0) => [u, yf - back - w * Math.sin(phi), bh + w * Math.cos(phi)];
  const faces = [
    [lp(x0, 0), lp(x1, 0), lp(x1, L), lp(x0, L)],                         // front (screen)
    [lp(x0, L), lp(x1, L), lp(x1, L, t), lp(x0, L, t)],                   // top edge
    [lp(x1, 0), lp(x1, 0, t), lp(x1, L, t), lp(x1, L)],                   // right edge
    [lp(x0, 0, t), lp(x0, L, t), lp(x1, L, t), lp(x1, 0, t)],             // back
    [lp(x0, 0), lp(x0, L), lp(x0, L, t), lp(x0, 0, t)],                   // left
    [lp(x0, 0), lp(x0, 0, t), lp(x1, 0, t), lp(x1, 0)],                   // bottom
  ];
  poly3(faces, { top: OW, left: MT, right: MG });
  // screen
  const sx0 = x0 + 3, sx1 = x1 - 3, sw0 = 3.2, sw1 = L - 3;
  const Sc = (u, w) => lp(u, w, -0.01);
  both(D(quad(Sc, sx0, sw0, sx1, sw1)), VD, OUT, 0.5);
  // title bar
  strokeP(line(Sc, [[sx0, sw1 - 4.2], [sx1, sw1 - 4.2]]), DG, 0.5);
  for (let i = 0; i < 3; i++) {
    const p = P(...Sc(sx0 + 2.6 + i * 2.6, sw1 - 2.1));
    el(`<circle cx="${fm(p[0])}" cy="${fm(p[1])}" r="0.75" fill="${i === 0 ? PM : MG}"/>`);
  }
  // sidebar (file tree)
  const sbx = sx0 + 12;
  const top = sw1 - 4.2, rowH = 3.3;
  strokeP(line(Sc, [[sbx, sw0], [sbx, top]]), DG, 0.5);
  let tree = '', treeHi = '';
  const tl = [7, 5, 6, 4, 6, 5, 3, 6, 4, 5];
  for (let i = 0; i < tl.length; i++) {
    const w = top - 3.4 - i * rowH; if (w < sw0 + 2.2) break;
    const ind = [1, 2, 5, 6, 8].includes(i) ? 2 : 0;
    const seg = line(Sc, [[sx0 + 2 + ind, w], [sx0 + 2 + ind + tl[i], w]]);
    if (i === 2) treeHi += seg; else tree += seg;
  }
  strokeP(tree, MG, 1.0);
  strokeP(treeHi, PM, 1.0);
  // minimap
  const mmx = sx1 - 7;
  strokeP(line(Sc, [[mmx - 1.2, sw0], [mmx - 1.2, top]]), DG, 0.5);
  let mm = '';
  const mml = [4, 3, 5, 2, 4, 5, 3, 4, 2, 5, 3, 4, 3, 2, 4, 5, 3, 4];
  for (let i = 0; i < mml.length; i++) {
    const w = top - 1.8 - i * 1.65; if (w < sw0 + 1.2) break;
    mm += line(Sc, [[mmx + (i % 3 === 1 ? 1 : 0), w], [mmx + (i % 3 === 1 ? 1 : 0) + mml[i], w]]);
  }
  strokeP(mm, MG, 0.55);
  // code lines: [indent, [len, colour]...]
  const code = [
    [0, [5, PM], [9, MT], [4, MG]],
    [3, [4, MG], [7, MT], [5, PM]],
    [3, [6, MT], [12, MG]],
    [6, [5, PM], [8, MT], [6, MG]],
    [6, [11, MG], [4, PM]],
    [3, [3, PM]],
    [3, [7, MT], [5, MG], [9, PM]],
    [6, [9, MG], [6, MT]],
    [3, [2, MT]],
    [0, [2, MT]],
  ];
  const lx = sbx + 3.6;
  const ex = mmx - 3;
  let cur = null;
  for (let i = 0; i < code.length; i++) {
    const w = top - 3.4 - i * rowH; if (w < sw0 + 2) break;
    let u = lx + code[i][0];
    strokeP(line(Sc, [[sbx + 0.9, w], [sbx + 2.1, w]]), DG, 0.7);
    for (let k = 1; k < code[i].length; k++) {
      const [len, col] = code[i][k];
      const e = Math.min(u + len, ex);
      if (e > u) strokeP(line(Sc, [[u, w], [e, w]]), col, 1.2);
      u = e + 1.6;
    }
    if (i === 5) cur = [u + 0.4, w];
  }
  // cursor block
  if (cur) both(D(quad(Sc, cur[0], cur[1] - 1.1, cur[0] + 1.3, cur[1] + 1.1)), PM, 'none', 0);
  // active-line highlight band
  fillP(D(quad(Sc, sbx + 0.4, top - 3.4 - 5 * rowH - 1.5, ex + 0.5, top - 3.4 - 5 * rowH + 1.5)), MG, ' fill-opacity="0.16"');
  // screen sheen (subtle glow)
  const sg = id('scr');
  const a = P(...Sc(sx0, sw1)), b = P(...Sc(sx1, sw0));
  defs.push(`<linearGradient id="${sg}" gradientUnits="userSpaceOnUse" x1="${fm(a[0])}" y1="${fm(a[1])}" x2="${fm(b[0])}" y2="${fm(b[1])}"><stop offset="0" stop-color="${MG}" stop-opacity="0.22"/><stop offset="1" stop-color="${MG}" stop-opacity="0"/></linearGradient>`);
  fillP(D(quad(Sc, sx0, sw0, sx1, sw1)), `url(#${sg})`);
  LP.lid = { phi, L, yf, bh };
}

// terminal card lying flat: { x0, x1, y0, y1 }, dark deep-green slab 3 thick with output lines and a >_ prompt
export function card(CARD) {
  const { x0, x1, y0, y1 } = CARD;
  const th = 3;
  prismZ(rring((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, 3, 0, 3), 0, th, M.deep);
  const T = onTop(th);
  // header strip
  const hdr = rring((x0 + x1) / 2, y0 + 3.6, (x1 - x0) / 2 - 1.6, 2.2, 1.2, 0, 2).map(p => T(...p));
  fillP(D(hdr), DG);
  for (let i = 0; i < 3; i++) {
    const p = P(...T(x0 + 4.2 + i * 2.8, y0 + 3.6));
    el(`<circle cx="${fm(p[0])}" cy="${fm(p[1])}" r="0.75" fill="${i === 0 ? PM : MT}"/>`);
  }
  // output lines
  const rows = [[[4, MG], [9, MT], [6, MG]], [[6, MG], [5, MG], [10, PM]]];
  rows.forEach((rw, i) => {
    let u = x0 + 4;
    for (const [len, col] of rw) { strokeP(line(T, [[u, y0 + 9.2 + i * 3.5], [u + len, y0 + 9.2 + i * 3.5]]), col, 1.05); u += len + 1.8; }
  });
  // prompt >_
  const k = 1.38, a = [x0 + 5, y0 + 16.4], t = [a[0] + 6.82 * k, a[1] + 4.46 * k], b = [t[0] - 2.37 * k, t[1] + 4.45 * k];
  strokeP(line(T, [a, t, b]), MT, 2.4);
  strokeP(line(T, [[b[0] + 6.2 * k, b[1] + 0.4], [b[0] + 13.6 * k, b[1] + 0.4]]), PM, 2.4);
}

// cloud outline in (u, w) for the standing badge, scaled by S
export function cloudShape(S = 1) {
  const circ = [[9, 8.5, 7.8], [19.5, 13.5, 10.2], [30, 9, 7.2]];
  const inside = (u, w) => {
    if (w < 0) return false;
    if (u >= 2.5 && u <= 36 && w <= 7.5) {
      // rounded bottom corners r=3.2
      if (u < 4.5 && w < 2) return Math.hypot(u - 4.5, w - 2) <= 2.05;
      if (u > 34 && w < 2) return Math.hypot(u - 34, w - 2) <= 2.05;
      return true;
    }
    return circ.some(([cu, cw, r]) => Math.hypot(u - cu, w - cw) <= r);
  };
  const c0 = [19.5, 9.5];
  const pts = [];
  const N = 120;
  for (let i = 0; i < N; i++) {
    const t = -i / N * Math.PI * 2; // clockwise in (u right, w up) -> we want CCW for outward normals; fix below
    const dx = Math.cos(t), dy = Math.sin(t);
    let lo = 0, hi = 40;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (inside(c0[0] + dx * m, c0[1] + dy * m)) lo = m; else hi = m; }
    pts.push([(c0[0] + dx * lo) * S, (c0[1] + dy * lo) * S]);
  }
  return pts.reverse(); // CCW in (u,w)
}

// standing extruded cloud badge facing +y with an upload arrow: { x, y, d (depth), s (scale) }
export function cloudBadge(CLOUD) {
  const shp = cloudShape(CLOUD.s);
  const { x, y, d } = CLOUD;
  const F = (u, w) => [x + u, y, w];
  const B = (u, w) => [x + u, y - d, w];
  const n = shp.length;
  const quads = [];
  for (let i = 0; i < n; i++) {
    const a = shp[i], b = shp[(i + 1) % n];
    const nu = b[1] - a[1], nw = -(b[0] - a[0]);
    const nn = norm([nu, 0, nw]);
    if (nn[0] + nn[2] <= 1e-6) { quads.push(null); continue; }
    const q = [F(...a), F(...b), B(...b), B(...a)];
    const depth = q.reduce((s, p) => s + p[0] + p[1] + p[2], 0) / 4;
    quads.push({ q, nn, depth, i });
  }
  const order = quads.filter(Boolean).sort((p, q) => p.depth - q.depth);
  const mat = { top: OW, left: MT, right: DG };
  for (const o of order) {
    const col = shade(o.nn, mat);
    el(`<path d="${D(o.q)}" fill="${col}" stroke="${col}" stroke-width="0.35" stroke-linejoin="round"/>`);
    // back edge outline
    strokeP(D([o.q[2], o.q[3]], false), OUT, SW);
    const prev = quads[(o.i - 1 + n) % n], next = quads[(o.i + 1) % n];
    if (!prev) strokeP(D([o.q[0], o.q[3]], false), OUT, SW);
    if (!next) strokeP(D([o.q[1], o.q[2]], false), OUT, SW);
    // crease at concave notches
    const a = shp[o.i], b = shp[(o.i + 1) % n], c = shp[(o.i + 2) % n];
    const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    const ang = Math.abs(Math.atan2(turn, (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1])));
    if (ang > 0.5 && next) strokeP(D([o.q[1], o.q[2]], false), OUT, 0.7);
  }
  both(D(shp.map(p => F(...p))), MT, OUT, SW);
  // inset rim line on the face
  const ins = shp.map((p, i) => {
    const a = shp[(i - 1 + n) % n], b = shp[(i + 1) % n];
    const t = norm([b[0] - a[0], b[1] - a[1], 0]);
    return [p[0] - t[1] * 2.1, p[1] + t[0] * 2.1];
  });
  strokeP(D(ins.map(p => F(...p))), MG, 0.6);
  // upload arrow glyph on the face
  const k = CLOUD.s;
  strokeP(line(F, [[19.5 * k, 4.2 * k], [19.5 * k, 15.5 * k]]) + line(F, [[15.4 * k, 11.6 * k], [19.5 * k, 15.8 * k], [23.6 * k, 11.6 * k]]), VD, 1.6);
  CLOUD.shape = shp;
}

export function book(x0, x1, y0, y1, z0, z1, mat, title) {
  box(x0, x1, y0, y1, z0, z1, mat);
  const S = onRight(x1), F = onLeft(y1), T = onTop(z1);
  // page block on the +x end (covers 0.8 thick top/bottom, spine at +y)
  both(D(quad(S, y0 + 0.2, z0 + 0.8, y1 - 1.6, z1 - 0.8)), OW, OUT, 0.45);
  let pl = '';
  const n = Math.max(1, Math.round((z1 - z0 - 1.6) / 1.15) - 1);
  for (let i = 1; i <= n; i++) { const zz = z0 + 0.8 + i * (z1 - z0 - 1.6) / (n + 1); pl += line(S, [[y0 + 0.9, zz], [y1 - 2.2, zz]]); }
  strokeP(pl, MG, 0.4);
  // spine bands
  strokeP(line(F, [[x0 + 3, z0 + 0.9], [x0 + 3, z1 - 0.9]]) + line(F, [[x1 - 3, z0 + 0.9], [x1 - 3, z1 - 0.9]]), OUT, 0.45, ' stroke-opacity="0.7"');
  strokeP(line(F, [[x0 + 7, (z0 + z1) / 2], [x0 + 7 + title, (z0 + z1) / 2]]), OW, 0.9);
}

// stack of three books { x, y, s }; sets BOOKS.h
export function books(BOOKS) {
  const { x, y, s: k } = BOOKS;
  book(x - 17 * k, x + 17 * k, y - 12 * k, y + 12 * k, 0, 7, { top: MG, left: MG, right: DG }, 12);
  book(x - 14 * k, x + 16 * k, y - 10.5 * k, y + 10.5 * k, 7, 13, { top: PM, left: MT, right: MG }, 9);
  book(x - 16 * k, x + 13 * k, y - 11.5 * k, y + 9.5 * k, 13, 18.5, { top: PM, left: DG, right: VD }, 14);
  // title label on top cover
  const T = onTop(18.5);
  both(D(quad(T, x - 12, y - 8, x + 7, y + 3.5)), OW, OUT, 0.45);
  strokeP(line(T, [[x - 9.5, y - 5], [x + 3.5, y - 5]]) + line(T, [[x - 9.5, y - 1.8], [x, y - 1.8]]), MG, 0.9);
  strokeP(line(T, [[x - 9.5, y + 1.2], [x + 2, y + 1.2]]), DG, 0.9);
  BOOKS.h = 18.5;
}

// cable: plan points [x, y, z] (z about 1.1 where it lies on the slab), drawn as three strokes. thin: the second, smaller gauge
export function cable(pts, { thin = false } = {}) {
  const d = D(catmull(pts), false);
  if (thin) { strokeP(d, OUT, 2.7 * K); strokeP(d, MT, 1.2 * K); return; }
  strokeP(d, OUT, 3.3 * K);
  strokeP(d, MG, 1.7 * K);
  strokeP(d, MT, 0.5, ' stroke-opacity="0.9" transform="translate(-0.35 -0.45)"');
}
// the cable's soft floor shadow: call before flushFloor(), with the same points
export function cableShadow(pts, { thin = false } = {}) {
  const c = catmull(pts.filter(p => p[2] < 2)).map(p => [p[0] + (thin ? 1.4 : 1.6), p[1] - (thin ? 0.3 : 0.4), 0]);
  shadowEls.push(`<path d="${D(c, false)}" fill="none" stroke="${DG}" stroke-opacity="${thin ? 0.16 : 0.18}" stroke-width="${fm((thin ? 2.8 : 3.4) * K)}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

// snake plant in a square ribbed pot: { x, y, s } (s = pot half size, 13 in the studio card)
export function plant(PLANT) {
  const { x, y, s } = PLANT;
  const kk = s / 8.5, ph = 13;
  box(x - s, x + s, y - s, y + s, 0, ph, M.mid);
  // ribbed pattern on visible faces
  let rb = '';
  for (let u = x - s + 2.4; u < x + s - 1; u += 2.4) rb += line(onLeft(y + s), [[u, 2], [u, ph - 2]]);
  for (let u = y - s + 2.4; u < y + s - 1; u += 2.4) rb += line(onRight(x + s), [[u, 2], [u, ph - 2]]);
  strokeP(rb, DG, 0.45, ' stroke-opacity="0.7"');
  box(x - s - 1.2, x + s + 1.2, y - s - 1.2, y + s + 1.2, ph, ph + 3.4, M.mid);
  const zs = ph + 2.5;
  both(D(quad(onTop(ph + 3.4), x - s + 0.6, y - s + 0.6, x + s - 0.6, y + s - 0.6)), VD, OUT, 0.5);
  // leaves
  const leaves = [
    { th: 20, h: 40, lean: -2.5, bx: -1.5, by: -2.2, w: 2.8 },
    { th: 110, h: 34, lean: 4.5, bx: -2, by: 1.5, w: 2.6 },
    { th: 65, h: 44, lean: 2, bx: 0.6, by: -0.4, w: 3.0 },
    { th: 160, h: 30, lean: -5, bx: 2.6, by: 0.8, w: 2.5 },
    { th: -25, h: 28, lean: 6, bx: 2.2, by: -2.4, w: 2.4 },
    { th: 135, h: 24, lean: -6, bx: 0.5, by: 3, w: 2.3 },
  ];
  const built = leaves.map(L0 => ({ ...L0, h: L0.h * kk, lean: L0.lean * kk, bx: L0.bx * kk, by: L0.by * kk, w: L0.w * kk })).map(L_ => {
    const t = L_.th * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t);
    const N = 14, left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const hw = L_.w * (1 - Math.pow(f, 2.2)) * (0.75 + 0.45 * Math.sin(Math.PI * Math.min(1, f * 1.4)));
      const c = L_.lean * f * f;
      const z = zs + L_.h * f;
      left.push([x + L_.bx + (c - hw) * ux, y + L_.by + (c - hw) * uy, z]);
      right.push([x + L_.bx + (c + hw) * ux, y + L_.by + (c + hw) * uy, z]);
    }
    let nrm = [-uy, ux, 0]; if (nrm[0] + nrm[1] < 0) nrm = nrm.map(v => -v);
    const depth = (x + L_.bx + L_.lean * 0.5 * ux) + (y + L_.by + L_.lean * 0.5 * uy);
    return { ...L_, left, right, nrm, depth, ux, uy };
  }).sort((a, b) => a.depth - b.depth);
  for (const lf of built) {
    const poly = lf.left.concat(lf.right.slice().reverse());
    const col = shade(lf.nrm, { top: OW, left: MT, right: MG });
    both(D(poly), col, OUT, 0.75);
    // inner margin line
    const inn = lf.left.map((p, i) => [(p[0] * 0.72 + lf.right[i][0] * 0.28), (p[1] * 0.72 + lf.right[i][1] * 0.28), p[2]]).slice(1, -4);
    const inn2 = lf.right.map((p, i) => [(p[0] * 0.72 + lf.left[i][0] * 0.28), (p[1] * 0.72 + lf.left[i][1] * 0.28), p[2]]).slice(1, -4);
    strokeP(D(inn, false) + D(inn2, false), PM, 0.4, ' stroke-opacity="0.85"');
    // cross bands
    let bnd = '';
    for (let i = 2; i < lf.left.length - 3; i += 2) {
      const a = lf.left[i], b = lf.right[i], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + 0.6];
      bnd += D([[a[0] * 0.8 + b[0] * 0.2, a[1] * 0.8 + b[1] * 0.2, a[2]], m, [b[0] * 0.8 + a[0] * 0.2, b[1] * 0.8 + a[1] * 0.2, b[2]]], false);
    }
    strokeP(bnd, DG, 0.45, ' stroke-opacity="0.6"');
  }
}

// status tower with three lit stage lights and a stack light on top: { x, y }; footprint 30 x 30, height about 88
export function tower(TWR) {
  const { x, y } = TWR;
  box(x - 15, x + 15, y - 15, y + 15, 0, 4.4, M.mid);
  const c = 10.5;
  const H = 62;
  box(x - c, x + c, y - c, y + c, 4, H, M.light);
  const F = onLeft(y + c + 0.01), R = onRight(x + c + 0.01);
  // display panel on the +y face with stage lights
  both(D(quad(F, x - c + 2.4, 12, x + c - 2.4, H - 6)), VD, OUT, 0.55);
  const lights = [H - 12, H - 21, H - 30];
  lights.forEach((z, i) => {
    halo(F(x - 1.5, z), 9, MT, 0.42);
    both(D(circle(x - 1.5, z, 3, 8).map(([u, w]) => F(u, w))), i === 0 ? PM : MT, OUT, 0.5);
    strokeP(line(F, [[x - 2.7, z], [x - 1.8, z - 0.9], [x - 0.1, z + 1]]), VD, 0.7);
    strokeP(line(F, [[x + 3, z + 0.8], [x + c - 3.6, z + 0.8]]) + line(F, [[x + 3, z - 0.8], [x + c - 4.8, z - 0.8]]), MG, 0.6);
  });
  // uptime bars at the bottom of the panel
  let bars = '';
  for (let i = 0; i < 9; i++) bars += line(F, [[x - c + 4 + i * 1.6, 15], [x - c + 4 + i * 1.6, 15 + [3, 5, 4, 6, 5, 7, 6, 8, 7][i]]]);
  strokeP(bars, MT, 0.8);
  // vents on +x face
  let v = '';
  for (let z = 14; z < H - 8; z += 2.2) v += line(R, [[y - c + 3, z], [y + c - 3, z]]);
  strokeP(v, VD, 0.5, ' stroke-opacity="0.55"');
  // stack light on top
  const r = 6.2;
  prismZ(circle(x, y, r + 1.4, 12), H, H + 2, M.mid);
  const segs = [[H + 2, H + 9, MT], [H + 9.4, H + 16.4, MT], [H + 16.8, H + 23.8, PM]];
  halo([x, y, H + 20], 30, MT, 0.5);
  for (const [z0, z1, col] of segs) {
    prismZ(circle(x, y, r, 12), z0, z1, { top: OW, left: col, right: mix(col, MG, 0.5) }, {
      beforeTop: () => {
        let rb = '';
        for (let a = -35; a <= 125; a += 16) { const t = a * Math.PI / 180; rb += D([[x + r * Math.cos(t), y + r * Math.sin(t), z0 + 1.2], [x + r * Math.cos(t), y + r * Math.sin(t), z1 - 1.2]], false); }
        strokeP(rb, OW, 0.5, ' stroke-opacity="0.85"');
      }
    });
  }
  prismZ(circle(x, y, 4, 10), H + 23.8, H + 26, M.mid);
  TWR.H = H;
}

// write the card. title adds role/aria-label and a <title> with the prefix id
export function writeSVG(file, title) {
  const head = title ? `<svg role="img" aria-label="${title}, Isometric mono style" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">\n<title id="${PFX}title">${title}</title>` : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">';
  const svg = `${head}\n<defs>${defs.join('')}</defs>\n${out.join('\n')}\n</svg>\n`;
  fs.writeFileSync(file, svg);
  console.log('wrote', file, svg.length, 'bytes');
}
