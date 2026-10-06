// teal3d.mjs: the drawing kit behind every Teal spot card. No dependencies, no randomness: the same
// input always gives the same SVG. Import it from a card generator (see starter.mjs):
//
//   import { C, makeCam, rrect, circle, frame, rotFrame, ... } from './teal3d.mjs';
//
// One orthographic camera (yaw TH = -25 deg, pitch PH = 36 deg) projects every solid, so all faces, shadows
// and floating extras share one projection. World axes: +x runs to the lower right on screen, +y runs
// away from the viewer (upper right), +z is up. A box therefore shows its top, its long FRONT face (normal -y,
// lower left) and its short RIGHT face (normal +x, lower right). Faces are coloured by the direction they
// face (col.front / col.right / col.left / col.back / col.up / col.down, plus col.cap for the top ring).
//
// Every projected point is collected in cam.BOX, so card() can centre the whole group on the card.

export const C = {
  bg: '#ebebeb',      // card background
  ink: '#0e3f3d',     // every outline
  deep: '#0e4a48',    // hard shadows, dark glyphs, sparkles, the darkest side faces
  tealD: '#299c96',   // side faces of teal parts, recess walls
  teal: '#36c3b0',    // right-facing side of white parts, accent tops, LEDs
  mid: '#7fd8ca',     // side faces of pale parts, floors of recesses
  paleMid: '#a8e5e0', // arc ticks
  pale: '#d8f2ed',    // pale key/card sides, highlight streaks on white
  white: '#ffffff',   // top and front faces of the hero
  grey: '#d5d8d8',    // label pills, placeholder text bars
  greyD: '#b9c0c0',   // the shaded side of small grey parts (switch stems)
};
export const LW = 1.2;                 // outline width at 480 wide
export const SHD = [0.78, -0.48];      // floor-shadow push per unit of height (world x, y): lands down-right on screen
export const FSH = [8.5, 7.6];         // hard shadow offset (screen px) for floating extras

export const deg = Math.PI / 180;
export const f = n => +(+n).toFixed(2);
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const mul = (a, s) => a.map(v => v * s);
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = a => { const l = Math.hypot(...a); return l ? mul(a, 1 / l) : a; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const poly = pts => 'M' + pts.map(p => `${f(p[0])},${f(p[1])}`).join('L') + 'Z';
export const line = pts => 'M' + pts.map(p => `${f(p[0])},${f(p[1])}`).join('L');

// ---------- 2D rings (local x, y) ----------
export function rrect(cx, cy, w, d, r, n = 7) {
  const pts = [];
  r = Math.min(r, w / 2, d / 2);
  const cs = [[cx + w / 2 - r, cy - d / 2 + r, -90], [cx + w / 2 - r, cy + d / 2 - r, 0], [cx - w / 2 + r, cy + d / 2 - r, 90], [cx - w / 2 + r, cy - d / 2 + r, 180]];
  for (const [x, y, a0] of cs) for (let i = 0; i <= n; i++) { const a = (a0 + 90 * i / n) * deg; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
  return pts;
}
export const circle = (cx, cy, r, n = 64) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n), cy + r * Math.sin(2 * Math.PI * i / n)]);
export function hull(P) {
  const p = P.map(q => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

// ---------- frames: an origin plus three axes; at([x,y,z]) maps local -> world ----------
export function rotFrame(rx = 0, ry = 0, rz = 0) { // radians, applied about X, then Y, then Z
  const R = (v) => {
    let [x, y, z] = v;
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    return [x, y, z];
  };
  return [R([1, 0, 0]), R([0, 1, 0]), R([0, 0, 1])];
}
export const frame = (o, F = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) => ({ o, F, at: ([x, y, z]) => add(add(add(o, mul(F[0], x)), mul(F[1], y)), mul(F[2], z)) });
// a card tilted back by `tilt` degrees about x, facing the viewer (the floating UI cards use 28)
export const tiltFrame = (tilt = 28) => { const a = tilt * deg; return [[1, 0, 0], [0, Math.sin(a), Math.cos(a)], [0, -Math.cos(a), Math.sin(a)]]; };
// an upright plate facing the viewer's lower left (badges, clouds, shields): local x -> world x, local y -> world z
export const uprightFrame = [[1, 0, 0], [0, 0, 1], [0, -1, 0]];

export function sideKey(n) {
  if (n[2] > 0.62) return 'up';
  if (n[2] < -0.62) return 'down';
  const a = Math.atan2(n[1], n[0]) / deg;
  if (a >= -135 && a < -45) return 'front';
  if (a >= -45 && a < 45) return 'right';
  if (a >= 45 && a < 135) return 'back';
  return 'left';
}
export function selfX(pts) {
  const n = pts.length; let hits = 0;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; if (segX(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) hits++; }
  return hits;
}
export function segX(p, q, r, s) { const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]); if (Math.abs(d) < 1e-12) return null; const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d; const u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d; return (t > 1e-7 && t < 1 - 1e-7 && u > 1e-7 && u < 1 - 1e-7) ? [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])] : null; }
// remove small self-intersection loops (swallowtails of folded tube contours)
export function untangle(pts, closed = true) {
  let p = pts.slice();
  for (let iter = 0; iter < 80; iter++) {
    const n = p.length, m = closed ? n : n - 1; let done = true;
    outer: for (let i = 0; i < m; i++) for (let j = i + 2; j < m; j++) {
      if (closed && i === 0 && j === n - 1) continue;
      const X = segX(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n]);
      if (!X) continue;
      if (closed && (j - i) > n / 2) p = [X, ...p.slice(i + 1, j + 1)];
      else p = [...p.slice(0, i + 1), X, ...p.slice(j + 1)];
      done = false; break outer;
    }
    if (done) break;
  }
  return p;
}

export function makeCam({ TH = -25, PH = 36, S = 1 } = {}) {
  const th = TH * deg, ph = PH * deg;
  const cT = Math.cos(th), sT = Math.sin(th), cP = Math.cos(ph), sP = Math.sin(ph);
  const V = [-sT * cP, -cT * cP, sP]; // unit vector toward the camera
  const pr = ([x, y, z]) => { const xr = x * cT - y * sT, yr = x * sT + y * cT; return [S * xr, -S * (yr * sP + z * cP)]; };
  const J = pr;
  const U = [cT, -sT, 0], W = [sT, cT, 0]; // floor axes aligned to the screen: U -> screen right, W -> straight up the screen
  const uw = (u, w, z = 0) => [u * U[0] + w * W[0], u * U[1] + w * W[1], z];
  const BOX = [];
  const keep = pts => { for (const q of pts) BOX.push(q); return pts; };

  function matrixRaw(fr, z) {
    const o = pr(fr.at([0, 0, z])); const a = J(fr.F[0]), b = J(fr.F[1]);
    return [a[0], a[1], -b[0], -b[1], o[0], o[1]];
  }
  // SVG transform that maps flat 2D artwork (x right, y DOWN, local units) onto plane z of a frame:
  // put glyphs, UI bars and icons on a face with <g transform="${mat(fr, z)}">...</g>
  const mat = (fr, z) => `matrix(${matrixRaw(fr, z).map(f).join(' ')})`;

  // convex solid between two corresponding rings r0 (at z0) and r1 (at z1): boxes, keycaps, discs, cylinders.
  // Visible side runs are filled by facing; the outline is the silhouette hull + the top ring + creases.
  function solid({ fr, r0, z0, r1, z1, col, cap = col.cap, stroke = true, extra = '', creases = true, lw = LW, track = true }) {
    const B = r0.map(p => fr.at([p[0], p[1], z0]));
    const T = r1.map(p => fr.at([p[0], p[1], z1]));
    const N = B.length;
    const vis = [], key = [];
    let last = null;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      let n = cross(sub(B[j], B[i]), sub(T[i], B[i]));
      if (Math.hypot(...n) < 1e-6) n = cross(sub(T[j], T[i]), sub(T[i], B[i]));
      if (Math.hypot(...n) < 1e-6) { vis.push(last ? last.v : false); key.push(last ? last.k : 'front'); continue; }
      n = norm(n);
      const v = dot(n, V) > 0.06; const k = col.keyOf ? col.keyOf(n) : sideKey(n);
      vis.push(v); key.push(k); last = { v, k };
    }
    let out = '';
    let start = vis.findIndex(v => !v); if (start < 0) start = 0;
    const runs = [];
    let cur = null;
    for (let s = 1; s <= N; s++) {
      const i = (start + s) % N;
      if (vis[i]) {
        if (cur && cur.k === key[i]) cur.end = i; else { if (cur) runs.push(cur); cur = { k: key[i], beg: i, end: i }; }
      } else { if (cur) runs.push(cur); cur = null; }
    }
    if (cur) runs.push(cur);
    const creaseIdx = [];
    const allp = [...B, ...T].map(pr);
    const runFills = [];
    for (const rn of runs) {
      const idx = []; let i = rn.beg; for (;;) { idx.push(i); if (i === rn.end) break; i = (i + 1) % N; }
      const e = (rn.end + 1) % N;
      const pts = [...idx.map(i => B[i]), B[e], T[e], ...idx.slice().reverse().map(i => T[i])].map(pr);
      runFills.push(`<path d="${poly(pts)}" fill="${col[rn.k]}"/>`);
    }
    // one base fill under the side runs hides hairline seams between runs
    if (runs.length) out += `<path d="${poly(hull(allp))}" fill="${col[runs[0].k]}"/>`;
    out += runFills.join('');
    for (let a = 0; a < runs.length - 1; a++) if ((runs[a].end + 1) % N === runs[a + 1].beg) creaseIdx.push(runs[a + 1].beg);
    if (runs.length > 1 && (runs[runs.length - 1].end + 1) % N === runs[0].beg) creaseIdx.push(runs[0].beg);
    const capN = norm(cross(sub(T[1], T[0]), sub(T[Math.floor(N / 3)], T[0])));
    const topVis = dot(capN, V) > 0;
    const topPts = T.map(pr);
    if (topVis && cap) out += `<path d="${poly(topPts)}" fill="${cap}"/>`;
    out += extra;
    if (track) keep(allp);
    if (stroke) {
      out += `<path d="${poly(hull(allp))}" fill="none" stroke="${C.ink}" stroke-width="${lw}" stroke-linejoin="round"/>`;
      if (topVis) out += `<path d="${poly(topPts)}" fill="none" stroke="${C.ink}" stroke-width="${lw}" stroke-linejoin="round"/>`;
      if (creases) for (const i of creaseIdx) out += `<path d="${line([pr(B[i]), pr(T[i])])}" fill="none" stroke="${C.ink}" stroke-width="${lw}" stroke-linecap="round"/>`;
    }
    return { svg: out, hull: hull(allp), topVis, top: topPts };
  }

  // thin plate: extrude a planar (possibly non-convex) outline along the frame's z by `depth`
  // (shields, clouds, bars, arrows). The side band is drawn with the stroke-behind trick:
  // every quad is first filled ink with a 2*lw+0.5 stroke, then refilled in the side colour.
  function slab({ fr, pts, depth, face, side, lw = LW, extra = '', track = true }) {
    const F = pts.map(p => pr(fr.at([p[0], p[1], depth])));
    const Bk = pts.map(p => pr(fr.at([p[0], p[1], 0])));
    const quads = pts.map((_, i) => { const j = (i + 1) % pts.length; return [F[i], F[j], Bk[j], Bk[i]]; });
    const shapes = [Bk, ...quads];
    let o = '';
    o += shapes.map(s => `<path d="${poly(s)}" fill="${C.ink}" stroke="${C.ink}" stroke-width="${f(2 * lw + 0.5)}" stroke-linejoin="round"/>`).join('');
    o += shapes.map(s => `<path d="${poly(s)}" fill="${side}" stroke="${side}" stroke-width="0.5" stroke-linejoin="round"/>`).join('');
    o += `<path d="${poly(F)}" fill="${face}" stroke="${C.ink}" stroke-width="${lw}" stroke-linejoin="round"/>`;
    o += extra;
    if (track) keep([...F, ...Bk]);
    // the plate's own hard shadow: its whole silhouette shifted (dx, dy) on screen, drawn BEFORE the plate
    const shadow = (dx = FSH[0], dy = FSH[1], col = C.deep) => shapes.concat([F]).map(s => `<path d="${poly(s.map(q => [q[0] + dx, q[1] + dy]))}" fill="${col}" stroke="${col}" stroke-width="0.6" stroke-linejoin="round"/>`).join('');
    return { svg: o, shadow, hull: hull([...F, ...Bk]) };
  }

  // swept tube (pipes, tori): cen(s) -> centre, frm(s) -> {N, B} unit normals. Top band = `top`, rest = `side`.
  function tube({ cen, frm, r, s0, s1, n = 60, top, side, t = 0.42, cut0 = null, cut1 = null, ext0 = 0, ext1 = 0,
    rim0 = false, rim1 = false, sil = true, silExt = false, innerTop = false, streak = null, label = 'tube', track = true }) {
    const at = s => { const c = cen(s); const { N, B } = frm(s); return { c, N, B }; };
    const lo = s0 - ext0, hi = s1 + ext1;
    const Ss = Array.from({ length: n + 1 }, (_, i) => lo + (hi - lo) * i / n);
    let prev = null;
    const smp = Ss.map(s => {
      const q = at(s);
      let psi = Math.atan2(dot(q.B, V), dot(q.N, V)) / deg;
      if (prev !== null) psi += 360 * Math.round((prev - psi) / 360);
      prev = psi;
      const a = psi - 90, b = psi + 90;
      const M = Math.hypot(q.N[2], q.B[2]);
      let mu = Math.atan2(q.B[2], q.N[2]) / deg; mu += 360 * Math.round((psi - mu) / 360);
      const dl = M > t ? Math.acos(t / M) / deg : 0;
      return { s, ...q, a, b, mu, x1: clamp(mu - dl, a, b), x2: innerTop ? b : clamp(mu + dl, a, b) };
    });
    const P3 = (s, al) => { const q = at(s); const A = al * deg; return add(q.c, add(mul(q.N, r * Math.cos(A)), mul(q.B, r * Math.sin(A)))); };
    const P = (s, al) => pr(P3(s, al));
    const sb = al => cut0 ? cut0(al) : Ss[0];
    const eb = al => cut1 ? cut1(al) : Ss[n];
    const curve = fa => {
      const out = [];
      const aS = fa(0), aE = fa(n);
      out.push([sb(aS), aS]);
      for (let k = 0; k <= n; k++) { const al = fa(k); if (Ss[k] > sb(al) + 1e-6 && Ss[k] < eb(al) - 1e-6) out.push([Ss[k], al]); }
      out.push([eb(aE), aE]);
      return out;
    };
    const arcAt = (sf, a0, a1, m = 18) => Array.from({ length: m + 1 }, (_, j) => { const al = a0 + (a1 - a0) * j / m; return [sf(al), al]; });
    const band = (fl, fh) => {
      const L = curve(fl), H = curve(fh);
      const eA = arcAt(eb, L[L.length - 1][1], H[H.length - 1][1]);
      const sA = arcAt(sb, H[0][1], L[0][1]);
      return [...L, ...eA, ...H.slice().reverse(), ...sA].map(([s, al]) => P(s, al));
    };
    const base = untangle(band(k => smp[k].a, k => smp[k].b));
    const topB = untangle(band(k => smp[k].x1, k => smp[k].x2));
    const sx = selfX(base);
    if (sx) console.warn(`[fold] ${label}: base polygon still self-intersects ${sx}x`);
    let fill = `<path d="${poly(base)}" fill="${side}"/>`;
    fill += `<path d="${poly(topB)}" fill="${top}"/>`;
    if (streak) {
      const { col, w = 1.8, off = 0.5, gaps = [[0.25, 0.6], [0.68, 0.76]] } = streak;
      fill += gaps.map(([u0, u1]) => {
        const pts = [];
        for (let j = 0; j <= 24; j++) { const s = s0 + (s1 - s0) * (u0 + (u1 - u0) * j / 24); const k = Math.round((s - lo) / (hi - lo) * n); const q = smp[clamp(k, 0, n)]; pts.push(P(s, q.x1 + (q.x2 - q.x1) * off)); }
        return `<path d="${line(pts)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
      }).join('');
    }
    const inR = k => silExt || (Ss[k] >= s0 - 1e-9 && Ss[k] <= s1 + 1e-9);
    let lines = '';
    const silCurve = fa => {
      const pts = [];
      const aS = fa(0); if (cut0) pts.push(P(sb(aS), aS));
      for (let k = 0; k <= n; k++) if (inR(k)) { const al = fa(k); const okS = cut0 ? Ss[k] > sb(al) + 1e-6 : Ss[k] >= sb(al) - 1e-9; const okE = cut1 ? Ss[k] < eb(al) - 1e-6 : Ss[k] <= eb(al) + 1e-9; if (okS && okE) pts.push(P(Ss[k], al)); }
      const aE = fa(n); if (cut1) pts.push(P(eb(aE), aE));
      return pts;
    };
    if (sil) {
      lines += `<path d="${line(untangle(silCurve(k => smp[k].a), false))}" fill="none" stroke="${C.ink}" stroke-width="${LW}" stroke-linecap="round" stroke-linejoin="round"/>`;
      lines += `<path d="${line(untangle(silCurve(k => smp[k].b), false))}" fill="none" stroke="${C.ink}" stroke-width="${LW}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const k0 = smp.findIndex((_, k) => inR(k)), k1 = n - smp.slice().reverse().findIndex((_, k) => inR(n - k));
    if (rim0 || cut0) lines += `<path d="${line(arcAt(sb, smp[k0].a, smp[k0].b, 30).map(([s, al]) => P(cut0 ? s : s0, al)))}" fill="none" stroke="${C.ink}" stroke-width="${LW}" stroke-linecap="round"/>`;
    if (rim1 || cut1) lines += `<path d="${line(arcAt(eb, smp[k1].a, smp[k1].b, 30).map(([s, al]) => P(cut1 ? s : s1, al)))}" fill="none" stroke="${C.ink}" stroke-width="${LW}" stroke-linecap="round"/>`;
    if (track) keep(base);
    return { fill, lines, svg: fill + lines, base, P, P3, smp, at };
  }

  // torus about a vertical axis (rings, lifebuoys, O-rings). piece(b0, b1, opts) draws the arc b0..b1 (degrees);
  // draw the back half (halves.back) before whatever passes through the ring and the front half after it.
  function torus({ c, R, rr, ax = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], top, side, t = 0.42, n = 90, label = 'torus' }) {
    const [e1, e2, e3] = ax;
    const rho = b => add(mul(e1, Math.cos(b * deg)), mul(e2, Math.sin(b * deg)));
    const cen = b => add(c, mul(rho(b), R));
    const frm = b => ({ N: rho(b), B: e3 });
    const bf = Math.atan2(dot(e2, V), dot(e1, V)) / deg; // the most-front direction
    const halves = { front: [bf - 90, bf + 90], back: [bf + 90, bf + 270] };
    return { cen, frm, bf, halves, rho, piece: (b0, b1, o = {}) => tube({ cen, frm, r: rr, s0: b0, s1: b1, n: Math.max(8, Math.round(n * (b1 - b0) / 180)), top, side, t, label, ...o }) };
  }

  // ---------- shadows (all hard, all C.deep, all pushed down-right) ----------
  // floor shadow of an object standing on plane z: the convex hull of its footprint and the footprint pushed by SHD * k.
  // k = object height for a tall object, about 1.05 x height for a slab. Draw it FIRST, before the object.
  const floorShadow = (ring, k, z = 0) => keep(hull([...ring, ...ring.map(([x, y]) => [x + SHD[0] * k, y + SHD[1] * k])]).map(([x, y]) => pr([x, y, z])));
  // hard shadow of a floating solid cast onto a horizontal surface at height z (a floor or a tile top): every world
  // point is dropped to z and pushed by SHD * k * (its height above z); k = 0.6 matches the examples. Returns screen
  // points; clip it to the surface it lands on.
  const castShadow = (pts3, z, k = 0.6) => hull(pts3.map(([x, y, h]) => pr([x + SHD[0] * k * (h - z), y + SHD[1] * k * (h - z), z])));
  // small hard ellipse on the ground (or a tile top) under a floating extra
  const groundEllipse = (x, y, z, r) => `<path d="${poly(circle(x, y, r, 48).map(([a, b]) => pr([a, b, z])))}" fill="${C.deep}"/>`;
  // hard shadow of any floating solid: its screen hull shifted by FSH; draw it before the solid
  const liftShadow = (h, d = FSH) => `<path d="${poly(h.map(q => [q[0] + d[0], q[1] + d[1]]))}" fill="${C.deep}"/>`;

  // a coin / token: a 5.5-deep disc on any frame. glyph is 2D art in local units (y down) drawn on the face.
  function coin({ pos, rot = [56, -24, 0], R = 18, depth = 5.5, glyph = '', face = C.pale, col = { front: C.mid, left: C.mid, back: C.mid, right: C.teal, up: C.mid, down: C.mid }, rim = C.mid }) {
    const fr = frame(pos, rotFrame(rot[0] * deg, rot[1] * deg, rot[2] * deg));
    const ring = circle(0, 0, R, 72);
    const g = `<circle r="${f(R - 3.6)}" fill="none" stroke="${rim}" stroke-width="1.5"/>${glyph}`;
    const s = solid({ fr, r0: ring, z0: 0, r1: ring, z1: depth, col: { ...col, cap: face }, creases: false, extra: `<g transform="${mat(fr, depth)}">${g}</g>` });
    return { svg: s.svg, hull: s.hull, shadow: liftShadow(s.hull), at: pr(fr.at([0, 0, depth])) };
  }

  // a recess cut into a top face (tray, slot, screen well): the opening ring at height z, its floor `depth` lower.
  // Walls show as `wall` (tealD); the floor as `floor` (mid), clipped to the opening. Needs a prefixed clip id.
  function recess({ fr = frame([0, 0, 0]), ring, z, depth, id, wall = C.tealD, floor = C.mid, lw = LW }) {
    const op = ring.map(([x, y]) => pr(fr.at([x, y, z])));
    const fl = ring.map(([x, y]) => pr(fr.at([x, y, z - depth])));
    // onFloor(svg): wraps art so it shows only on the visible floor (inside the opening AND on the floor polygon)
    const onFloor = art => `<g clip-path="url(#${id})"><g clip-path="url(#${id}-floor)">${art}</g></g>`;
    return { op, fl, clip: `url(#${id})`, onFloor, svg: `<clipPath id="${id}"><path d="${poly(op)}"/></clipPath><clipPath id="${id}-floor"><path d="${poly(fl)}"/></clipPath>` +
      `<path d="${poly(op)}" fill="${wall}"/>` +
      `<path d="${poly(fl)}" fill="${floor}" clip-path="url(#${id})"/>` +
      `<path d="${poly(fl)}" fill="none" stroke="${C.ink}" stroke-width="${lw}" clip-path="url(#${id})"/>` +
      `<path d="${poly(op)}" fill="none" stroke="${C.ink}" stroke-width="${lw}" stroke-linejoin="round"/>` };
  }

  // a finger scoop cut down through a front wall (normal -y) that runs from y0 (outer face) to y1 (inner face):
  // a shallow circular arc from xa to xb at the wall top zTop, `depth` deep. Draw it after the hero and its recess.
  // What shows through the cut is filled `see` (the recess floor colour); inner faces are teal if they face +x,
  // white otherwise (the hero's colour rule); front and back edges are inked.
  function scoop({ xa, xb, depth, y0, y1, zTop, see = C.pale, lw = LW }) {
    const c2 = (xb - xa) / 2, xc = (xa + xb) / 2, Rr = (c2 * c2 + depth * depth) / (2 * depth), zc = zTop + 0.3 - depth + Rr;
    const th0 = Math.asin(c2 / Rr), N = 18;
    const Uq = Array.from({ length: N + 1 }, (_, i) => { const t = -th0 + 2 * th0 * i / N; return [xc + Rr * Math.sin(t), zc - Rr * Math.cos(t)]; });
    const F = Uq.map(([x, z]) => [x, y0 - 0.05, z]), Bk = Uq.map(([x, z]) => [x, y1 + 0.8, z]);
    let o = `<path d="${poly(hull([...F, ...Bk].map(pr)))}" fill="${see}"/>`;
    for (let i = 0; i < N; i++) {
      const ex = Uq[i + 1][0] - Uq[i][0], ez = Uq[i + 1][1] - Uq[i][1], L = Math.hypot(ex, ez);
      const n = [-ez / L, 0, ex / L]; // inner normal, towards the arc's centre
      if (dot(n, V) <= 0.02) continue;
      const col = n[0] > 0.3 && n[2] < 0.62 ? C.teal : C.white;
      o += `<path d="${poly([F[i], F[i + 1], Bk[i + 1], Bk[i]].map(pr))}" fill="${col}" stroke="${col}" stroke-width="0.5" stroke-linejoin="round"/>`;
    }
    o += `<path d="${line(Bk.map(pr))}" fill="none" stroke="${C.ink}" stroke-width="${f(lw - 0.1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    o += `<path d="${line(F.map(pr))}" fill="none" stroke="${C.ink}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round"/>`;
    return o;
  }

  // thin highlight streak along a straight edge: two dashes (long + short) between world points a and b,
  // `inset` units in from the edge is the caller's job. Used under the top edge of white front faces.
  const streak = (a, b, col = C.pale, w = 2.2, cuts = [[0, 0.78], [0.84, 0.95]]) => `<path d="${cuts.map(([u0, u1]) => line([pr(add(a, mul(sub(b, a), u0))), pr(add(a, mul(sub(b, a), u1)))])).join('')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

  return { V, pr, J, U, W, uw, BOX, keep, mat, matrixRaw, solid, slab, tube, torus, recess, scoop, streak, floorShadow, castShadow, groundEllipse, liftShadow, coin };
}

// ---------- decor (screen space, drawn after centring) ----------
// 4-point sparkle with concave sides. Sizes used: 6-7 (big), 3.6-5 (small).
export const spark = (x, y, s, c = C.deep, q = 0.26) => `<path d="M${f(x)},${f(y - s)}Q${f(x + s * q)},${f(y - s * q)} ${f(x + s)},${f(y)}Q${f(x + s * q)},${f(y + s * q)} ${f(x)},${f(y + s)}Q${f(x - s * q)},${f(y + s * q)} ${f(x - s)},${f(y)}Q${f(x - s * q)},${f(y - s * q)} ${f(x)},${f(y - s)}Z" fill="${c}" stroke="${c}" stroke-width="0.6" stroke-linejoin="round"/>`;
// short arc tick hugging a floating item ("it just popped"): 3-3.6 wide, paleMid or teal, 20-40 deg long
export const arc = (cx, cy, r, a0, a1, c = C.paleMid, w = 3.4) => {
  const p0 = [cx + r * Math.cos(a0 * deg), cy + r * Math.sin(a0 * deg)], p1 = [cx + r * Math.cos(a1 * deg), cy + r * Math.sin(a1 * deg)];
  return `<path d="M${f(p0[0])},${f(p0[1])}A${r},${r} 0 0 1 ${f(p1[0])},${f(p1[1])}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
};

// bounding box of screen points
export const bbox = pts => { const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

// wrap a finished scene into the card: background, the scene group shifted so the BOX centre lands on (cx, cy),
// then decor in card coordinates. decor is a function (shift) => string[] so it can use shifted anchors.
export function card({ prefix, label = '', scene, BOX, decor = () => [], cx = 240, cy = 181 }) {
  const b = bbox(BOX);
  const TX = f(cx - (b[0] + b[2]) / 2), TY = f(cy - (b[1] + b[3]) / 2);
  const shift = p => [p[0] + TX, p[1] + TY];
  const sb = [b[0] + TX, b[1] + TY, b[2] + TX, b[3] + TY];
  const svg = `<svg${label ? ` role="img" aria-label="${label}, Teal spot style"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
<rect id="${prefix}bg" x="0" y="0" width="480" height="360" fill="${C.bg}"/>
<g id="${prefix}scene" transform="translate(${TX} ${TY})">
${scene}</g>
<g id="${prefix}decor">
${decor(shift).join('\n')}
</g>
</svg>
`;
  return { svg, bbox: sb.map(f), widthPct: f((sb[2] - sb[0]) / 4.8), heightPct: f((sb[3] - sb[1]) / 3.6) };
}
