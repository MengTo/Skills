// Brush-marker toolkit for illustration-two-colour-brush cards. Seeded, no dependencies.
//
// Every line in this style is a FILLED ribbon (never an SVG stroke): a centre-line through
// hand-placed control points becomes a variable-width marker shape with swells, pinches and
// blobby round ends. Widths are divided by the fit scale, so a stroke drawn with w 4.2 lands
// at the same thickness on the 480 card however big the scene is.
//
//   import { createBrush } from './brush.mjs';
//   const B = createBrush({ prefix: 'dl-', seed: 11 });
//   const { INK, MINT, PAPER, OFF, stroke, loop, fillShape, dot, halo, tube, xf } = B;
//   B.build(() => { const L = []; const P = s => L.push(s); ... return L.join('\n'); }, 'card.svg');
//
// build() calls your scene function twice: once to measure the bounding box of every control
// point, then again with the scene scaled to fit 392 x 278 centred on (240, 184). Draw in any
// convenient units; keep the scene function deterministic (all randomness via B.rnd()).
//
//   node scripts/brush.mjs --demo demo.svg     writes a small test card (marker line, loop,
//                                              mint plate, halo, camo, open hand, dots)
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export function createBrush({ prefix = 'br-', seed: seed0 = 11 } = {}) {
  const INK = '#141412', MINT = '#4fd592', PAPER = '#f1ede3', OFF = '#f7f4ec';
  let S = 1, WK = 1, seed = seed0, TRACK = true, CLIPN = 0;
  const BB = [];
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
  const f = n => (Math.round(n * 10) / 10).toString();

  // ---------- curves ----------
  function crPts(pts, closed) { // centripetal Catmull-Rom, ~1.2 unit samples
    const n = pts.length, out = [];
    const g = i => closed ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const P0 = g(i - 1), P1 = g(i), P2 = g(i + 1), P3 = g(i + 2);
      const td = (a, b) => Math.max(1e-3, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5));
      const t0 = 0, t1 = td(P0, P1), t2 = t1 + td(P1, P2), t3 = t2 + td(P2, P3);
      const d = Math.hypot(P2[0] - P1[0], P2[1] - P1[1]);
      const m = Math.max(3, Math.ceil(d / 1.2));
      for (let s = 0; s < m; s++) {
        const t = t1 + (t2 - t1) * s / m;
        const L = (A, B, ta, tb) => [(tb - t) / (tb - ta) * A[0] + (t - ta) / (tb - ta) * B[0], (tb - t) / (tb - ta) * A[1] + (t - ta) / (tb - ta) * B[1]];
        const A1 = L(P0, P1, t0, t1), A2 = L(P1, P2, t1, t2), A3 = L(P2, P3, t2, t3);
        const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
        out.push(L(B1, B2, t1, t2));
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  function resample(P, step, closed) {
    const Q = closed ? [...P, P[0]] : P;
    const cum = [0];
    for (let i = 1; i < Q.length; i++) cum.push(cum[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
    const L = cum[cum.length - 1], n = Math.max(2, Math.round(L / step));
    const out = []; let j = 0;
    const lim = closed ? n : n + 1;
    for (let k = 0; k < lim; k++) {
      const s = L * k / n;
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const u = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
      out.push([Q[j][0] + (Q[j + 1][0] - Q[j][0]) * u, Q[j][1] + (Q[j + 1][1] - Q[j][1]) * u]);
    }
    return { pts: out, L };
  }
  const poly = (P, close = true) => 'M' + P.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + (close ? 'Z' : '');

  // ---------- the marker ribbon ----------
  // o.w nominal width (card px = w*1.42 for w>=4, w*1.28 for w>=3.3, else w*1.1), o.v width wobble,
  // o.a / o.b start / end blob, o.taper / o.taper0 thin the end / start, o.jit centre-line wander,
  // o.nsw number of swells, o.sw swell strength, o.rough edge roughness, o.fill colour.
  function ribbon(P, o) {
    const w0 = o.w ?? 4.2, w = (w0 >= 4.0 ? w0 * 1.42 : w0 >= 3.3 ? w0 * 1.28 : w0 * 1.1) / S / WK, v = o.v ?? 0.34;
    const n = P.length; const cum = [0];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const L = cum[n - 1];
    const ph = [rnd() * 6.3, rnd() * 6.3, rnd() * 6.3];
    const a = o.a ?? (0.38 + rnd() * 0.4), b = o.b ?? (0.26 + rnd() * 0.4);
    const e = Math.max(w * 1.6, Math.min(L * 0.18, w * 3));
    const SW = [];
    const nsw = o.nsw ?? (L > 60 ? 2 + Math.floor(rnd() * 2) : L > 25 ? 1 : 0);
    const swa = o.sw ?? 0.3;
    for (let k = 0; k < nsw; k++) SW.push([L * (0.12 + 0.76 * rnd()), (5 + rnd() * 9) / S / WK, swa * (rnd() < 0.9 ? (0.6 + rnd() * 0.8) : -(0.2 + rnd() * 0.25))]);
    const W = [], N = [];
    for (let i = 0; i < n; i++) {
      const s = cum[i];
      const nz = 0.62 * Math.sin(s / 9 + ph[0]) + 0.38 * Math.sin(s / 4.2 + ph[1]);
      let wi = w * (1 + v * nz) * (1 + a * Math.exp(-((s / e) ** 2)) + b * Math.exp(-(((L - s) / e) ** 2)));
      for (const [c0, wd, am] of SW) wi *= 1 + am * Math.exp(-(((s - c0) / wd) ** 2));
      if (o.taper) wi *= 1 - o.taper * Math.pow(s / L, 3);
      if (o.taper0) wi *= 1 - o.taper0 * Math.pow(1 - s / L, 3);
      W.push(wi);
      const A = P[Math.max(0, i - 1)], B = P[Math.min(n - 1, i + 1)];
      const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1;
      N.push([-dy / d, dx / d]);
    }
    { const q0 = rnd() * 6.3, q1 = rnd() * 6.3, amp = (o.jit ?? 0.95) / S / WK;
      for (let i = 0; i < n; i++) { const jj = amp * (0.7 * Math.sin(cum[i] / 13 + q0) + 0.3 * Math.sin(cum[i] / 5.5 + q1)); P[i] = [P[i][0] + N[i][0] * jj, P[i][1] + N[i][1] * jj]; } }
    const left = [], right = [];
    const r0 = rnd() * 6.3, r1 = rnd() * 6.3, ra = (o.rough ?? 0.06) / S / WK;
    for (let i = 0; i < n; i++) {
      const el = ra * (Math.sin(cum[i] / 1.9 + r0) * 0.6 + Math.sin(cum[i] / 0.83 + r1) * 0.4);
      const er = ra * (Math.sin(cum[i] / 2.3 + r1) * 0.6 + Math.sin(cum[i] / 0.71 + r0) * 0.4);
      left.push([P[i][0] + N[i][0] * (W[i] / 2 + el), P[i][1] + N[i][1] * (W[i] / 2 + el)]);
      right.push([P[i][0] - N[i][0] * (W[i] / 2 + er), P[i][1] - N[i][1] * (W[i] / 2 + er)]);
    }
    const cap = (i, dir) => { // half-ellipse from the left side round to the right side
      const p = P[i], nn = N[i], t = [nn[1] * dir, -nn[0] * dir];
      const hw = W[i] / 2, k = 1.1 + rnd() * 0.35, sk = (rnd() - 0.5) * 0.7;
      const out = [];
      for (let j = 1; j < 10; j++) {
        const th = j / 10 * Math.PI;
        const c = Math.cos(th), sn = Math.sin(th);
        const r = hw * (1 + sk * c);
        out.push([p[0] + nn[0] * r * c * (dir > 0 ? 1 : -1) + t[0] * hw * k * sn, p[1] + nn[1] * r * c * (dir > 0 ? 1 : -1) + t[1] * hw * k * sn]);
      }
      return out;
    };
    const endCap = cap(n - 1, 1);
    const startCap = cap(0, -1);
    return poly([...left, ...endCap, ...right.reverse(), ...startCap]);
  }

  // ---------- drawing primitives (all return SVG strings) ----------
  // open marker line through control points
  function stroke(ctrl, o = {}) {
    if (TRACK && !o.nobb) BB.push(...ctrl);
    const { pts } = resample(crPts(ctrl, false), 1.1, false);
    return `<path d="${ribbon(pts, o)}" fill="${o.fill || INK}"/>`;
  }
  // closed outline drawn as ONE marker stroke that starts at o.start (0-1) and overlaps itself by o.ov;
  // o.part < 1 leaves the outline open (a gap reads as hand-drawn)
  function loop(ctrl, o = {}) {
    if (TRACK && !o.nobb) BB.push(...ctrl);
    const { pts } = resample(crPts(ctrl, true), 1.1, true);
    const n = pts.length, st = Math.floor((o.start ?? rnd()) * n);
    const ov = Math.round((o.ov ?? 0.04) * n) + 3;
    const seq = [];
    const cnt = o.part ? Math.round(o.part * n) : n + ov;
    for (let k = 0; k <= cnt; k++) seq.push(pts[(st + k) % n]);
    return `<path d="${ribbon(seq, o)}" fill="${o.fill || INK}"/>`;
  }
  // flat smooth fill through control points, optionally offset (the mint "second plate")
  function fillShape(ctrl, color, dx = 0, dy = 0, extra = '') {
    if (TRACK) BB.push(...ctrl);
    const { pts } = resample(crPts(ctrl, true), 1.5, true);
    return `<path d="${poly(pts.map(p => [p[0] + dx, p[1] + dy]))}" fill="${color}"${extra}/>`;
  }
  // paper-coloured knockout behind a front object, wpx card pixels wider than the shape
  function halo(ctrl, wpx) {
    const r = resample(crPts(ctrl, true), 1.5, true);
    return `<path d="${poly(r.pts)}" fill="${PAPER}" stroke="${PAPER}" stroke-width="${f(wpx / S)}" stroke-linejoin="round"/>`;
  }
  // a stipple dot or an eye: slightly oval, random rotation; r in card px
  const dot = (x, y, r, c = INK) => {
    const k = 0.85 + rnd() * 0.3;
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r / S / WK * k)}" ry="${f(r / S / WK / k)}" fill="${c}" transform="rotate(${Math.round(rnd() * 180)} ${f(x)} ${f(y)})"/>`;
  };

  // ---------- geometry ----------
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // rotate (deg) + scale a local point list, then move it to (ox, oy)
  const xf = (pts, ox, oy, deg, sc = 1) => {
    const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180);
    return pts.map(([x, y]) => [ox + (x * c - y * s) * sc, oy + (x * s + y * c) * sc]);
  };
  // closed outline polygon (sparse control points) around a centre-line with a width per point
  function tube(C, Wd, o = {}) {
    const n = C.length, Lp = [], Rp = [];
    for (let i = 0; i < n; i++) {
      const A = C[Math.max(0, i - 1)], B = C[Math.min(n - 1, i + 1)];
      const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1, nn = [-dy / d, dx / d];
      Lp.push([C[i][0] + nn[0] * Wd[i] / 2, C[i][1] + nn[1] * Wd[i] / 2]);
      Rp.push([C[i][0] - nn[0] * Wd[i] / 2, C[i][1] - nn[1] * Wd[i] / 2]);
    }
    const out = [...Lp];
    if (o.roundEnd) { const c = C[n - 1], t = sub(C[n - 1], C[n - 2]), tl = Math.hypot(...t); out.push(add(c, mul(t, Wd[n - 1] * 0.45 / tl))); }
    out.push(...Rp.reverse());
    if (o.roundStart) { const c = C[0], t = sub(C[0], C[1]), tl = Math.hypot(...t); out.push(add(c, mul(t, Wd[0] * 0.45 / tl))); }
    return out;
  }
  // rounded-rectangle control points (for windows, sockets, screens)
  function rr(x0, y0, x1, y1, c = 4) {
    return [[x0 + c, y0], [(x0 + x1) / 2, y0 - 0.6], [x1 - c, y0], [x1, y0 + c], [x1 + 0.5, (y0 + y1) / 2], [x1, y1 - c], [x1 - c, y1], [(x0 + x1) / 2, y1 + 0.5], [x0 + c, y1], [x0, y1 - c], [x0 - 0.5, (y0 + y1) / 2], [x0, y0 + c]];
  }
  // open-hand outline in local units: fingers = [baseX, baseY, angleDeg (0 = up), length, width];
  // tail = [wristLeft, palmLeft, palmRight, wristRight]. Returns control points; place with xf().
  function openHand(fingers, tail) {
    const hl = [tail[0], tail[1]];
    fingers.forEach(([bx, by, ang, len, w], i) => {
      const A = ang * Math.PI / 180, d = [Math.sin(A), -Math.cos(A)], p = [Math.cos(A), Math.sin(A)];
      const c = [bx + d[0] * (len - w / 2), by + d[1] * (len - w / 2)];
      if (i > 0) { const pv = hl[hl.length - 1]; const lb = [bx - p[0] * w / 2, by - p[1] * w / 2]; hl.push([(pv[0] + lb[0]) / 2 + d[0] * 2.5, (pv[1] + lb[1]) / 2 + d[1] * 2.5]); }
      hl.push([bx - p[0] * w / 2, by - p[1] * w / 2]);
      for (let k = 0; k <= 4; k++) { const th = k / 4 * Math.PI; hl.push([c[0] + (-p[0] * Math.cos(th) + d[0] * Math.sin(th)) * w / 2, c[1] + (-p[1] * Math.cos(th) + d[1] * Math.sin(th)) * w / 2]); }
      hl.push([bx + p[0] * w / 2, by + p[1] * w / 2]);
    });
    hl.push(tail[2], tail[3]);
    return hl;
  }

  // ---------- squiggle camo ----------
  // wobble a centre-line sideways (amplitude A, wavelength lam samples): the crinkly contour line
  function crinkle(ctrl, closed, A = 1.0, lam = 2.4) {
    const { pts } = resample(crPts(ctrl, closed), 1.0, closed);
    const n = pts.length, ph = rnd() * 6.3, ph2 = rnd() * 6.3, out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const off = A * (0.65 * Math.sin(i / lam + ph) + 0.35 * Math.sin(i / (lam * 0.43) + ph2));
      out.push([pts[i][0] - dy / d * off, pts[i][1] + dx / d * off]);
    }
    if (closed) for (let k = 0; k < 4; k++) out.push(out[k]);
    return out;
  }
  // hand-placed camo: wandering lines, closed puddles and small o-rings, all crinkled
  function camo(lines, puddles = [], rings = [], w = 2.7) {
    let out = '';
    for (const l of lines) out += `<path d="${ribbon(crinkle(l, false, 1.0, 2.4), { w, v: 0.3 })}" fill="${INK}"/>`;
    for (const q of puddles) out += `<path d="${ribbon(crinkle(q, true, 1.0, 2.4), { w, v: 0.3, a: 0.1, b: 0.1, nsw: 1 })}" fill="${INK}"/>`;
    for (const [cx, cy, r] of rings) {
      const pts = []; for (let j = 0; j < 7; j++) { const a = j / 7 * 6.28; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]); }
      out += loop(pts, { w: w * 0.95, v: 0.2, nobb: true });
    }
    return out;
  }
  // wrap inner SVG in a clipPath shaped like ctrl (prefixed id), e.g. camo inside a sweater
  function clipped(ctrl, inner) {
    const id = `${prefix}clip${CLIPN++}`;
    const t = TRACK; TRACK = false; const d = fillShape(ctrl, '#000'); TRACK = t;
    return `<clipPath id="${id}">${d}</clipPath><g clip-path="url(#${id})">${inner}</g>`;
  }
  // radiating emphasis ticks round a centre: angles in degrees (-90 = straight up)
  function ticks(cx, cy, angles, r0, r1, o = {}) {
    return angles.map(a => { const A = a * Math.PI / 180; return stroke([[cx + Math.cos(A) * r0, cy + Math.sin(A) * r0], [cx + Math.cos(A) * r1, cy + Math.sin(A) * r1]], { w: 4.2, v: 0.12, a: 0.2, b: 0.05, ...o }); }).join('');
  }
  // 4-point star (sparkle) as a flat fill
  function star(cx, cy, r, c = OFF) {
    const pts = []; for (let j = 0; j < 8; j++) { const a = j / 8 * 6.28 - 1.57; const q = j % 2 ? r * 0.3 : r; pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); }
    return fillShape(pts, c);
  }

  // ---------- characters: the set's profile head, shoes, a gripping fist ----------
  // place local points: mirror (facing -1), rotate deg, scale, move so local `origin` lands on (x, y)
  const place = (pts, origin, x, y, deg, sc, facing = 1) => xf(pts.map(([px, py]) => [(px - origin[0]) * facing, py - origin[1]]), x, y, deg * facing, sc);

  // profile head (big nose, dot eye, brow, ear, neck block) centred on (x, y); facing 1 = right, -1 = left.
  // hair: 'curly' | 'bun' | 'ponytail'; eye: 'open' | 'shut' | 'tired'; mouth: 'smile' | 'talk' | 'teeth' | 'flat'.
  // The head is ~62 x 70 local units; scale 1.2-1.3 suits a figure whose body is drawn in the same units.
  function profileHead(x, y, { deg = 0, scale = 1.2, facing = 1, hair = 'curly', eye = 'open', mouth = 'smile', neck = true } = {}) {
    const T = pts => place(pts, [166, 108], x, y, deg, scale, facing);
    let s = '';
    const HAIR = {
      curly: [[189, 75], [185, 80], [180, 86], [172, 88], [166, 96], [160, 104], [152, 108], [150, 120], [148, 131], [141, 137], [138, 130], [131, 136], [127, 124], [120, 120], [123, 108], [117, 98], [124, 90], [122, 80], [131, 72], [138, 62], [151, 59], [162, 54], [174, 58], [184, 61], [188, 66], [192, 70]],
      bun: [[186, 68], [178, 70], [168, 72], [160, 78], [154, 88], [149, 100], [146, 116], [144, 128], [137, 128], [131, 116], [130, 100], [134, 84], [144, 70], [158, 61], [172, 58], [182, 60], [188, 64]],
      ponytail: [[186, 70], [183, 80], [174, 84], [164, 86], [156, 94], [152, 106], [150, 118], [143, 114], [138, 100], [140, 84], [150, 70], [164, 62], [178, 62]],
    }[hair];
    if (neck) { s += fillShape(T([[150, 126], [166, 132], [168, 152], [150, 152]]), PAPER); s += stroke(T([[166, 133], [168, 151]]), { w: 3.4 }); }
    if (hair === 'bun') { const bun = T([[150, 40], [162, 42], [168, 52], [164, 64], [150, 68], [138, 62], [136, 50], [141, 43]]); s += fillShape(bun, MINT, -4, -3) + fillShape(bun, INK) + loop(bun, { w: 4.0, start: 0.2 }) + stroke(T([[143, 50], [150, 46]]), { w: 2.6, fill: MINT }); }
    if (hair === 'ponytail') { const pony = T([[142, 84], [126, 74], [110, 76], [96, 70], [88, 78], [100, 86], [92, 94], [108, 96], [124, 92], [138, 98]]); s += fillShape(pony, INK) + loop(pony, { w: 3.8, start: 0.2 }) + stroke(T([[106, 82], [118, 80]]), { w: 2.4, fill: MINT }); }
    s += fillShape(T([[146, 92], [160, 76], [180, 76], [184, 88], [187, 100], [197, 106], [201, 113], [197, 119], [189, 120], [190, 126], [186, 131], [184, 138], [176, 141], [164, 138], [150, 128], [140, 110]]), PAPER);
    s += stroke(T([[180, 78], [183, 88], [185, 99], [195, 104], [201, 111], [198, 119], [189, 120], [190, 125]]), { w: 4.0, a: 0.15, b: 0.05 });
    s += stroke(T([[188, 132], [185, 137], [178, 141], [168, 139], [160, 133]]), { w: 4.0, a: 0.05, b: 0.2 });
    const hp = T(HAIR);
    s += fillShape(hp, INK) + loop(hp, { w: 4.0, start: 0.4 });
    s += stroke(T(hair === 'curly' ? [[146, 68], [155, 65]] : [[156, 68], [166, 65]]), { w: 2.6, fill: MINT });
    s += stroke(T(hair === 'curly' ? [[129, 95], [131, 87]] : [[142, 92], [143, 102]]), { w: 2.4, fill: MINT });
    s += fillShape(T([[152, 106], [160, 105], [164, 112], [161, 120], [153, 121]]), PAPER);
    s += stroke(T([[153, 105], [160, 104], [165, 112], [161, 121], [153, 122]]), { w: 3.4 }) + stroke(T([[160, 109], [156, 112], [158, 117]]), { w: 2.8 });
    if (eye === 'open') s += dot(...T([[176, 98]])[0], 3.9) + dot(...T([[177.4, 96.4]])[0], 1.0, OFF) + stroke(T([[169, 89], [176, 86], [183, 89]]), { w: 3.2 });
    if (eye === 'shut') s += stroke(T([[171, 99], [176, 96], [182, 99]]), { w: 3.2 }) + stroke(T([[169, 89], [176, 91], [184, 87]]), { w: 3.2 });
    if (eye === 'tired') s += dot(...T([[177, 100]])[0], 3.6) + dot(...T([[178.2, 101]])[0], 1.0, MINT) + stroke(T([[168, 95], [176, 93.5], [184, 95.5]]), { w: 3.6 }) + stroke(T([[171, 106], [177, 108], [183, 106]]), { w: 2.4 }) + stroke(T([[167, 87], [175, 86], [183, 88]]), { w: 3.0 });
    if (mouth === 'smile') s += stroke(T([[184, 129], [179, 131.5], [174, 129.5], [170, 131]]), { w: 2.8, v: 0.1 });
    if (mouth === 'talk') s += stroke(T([[191, 127], [186, 133], [178, 133], [172, 127]]), { w: 3.4, a: 0.25, b: 0.25 });
    if (mouth === 'flat') s += stroke(T([[186, 129], [180, 131], [174, 130]]), { w: 3.0 });
    if (mouth === 'teeth') { const t = T([[175, 127], [190, 125.5], [189, 133], [176, 134]]); s += fillShape(t, OFF) + loop(t, { w: 2.6, start: 0.1 }) + stroke(T([[176, 130.5], [189, 129.2]]), { w: 1.8, v: 0.05 }); }
    return s;
  }

  // a chunky shoe in profile: black upper, off-white toe cap, mint sole plate, tread and lace dashes.
  // ank = ankle point; deg tilts it (negative = toe up, heel dug in); facing -1 points the toe left.
  function shoe(ank, deg = 0, sc = 0.82, facing = 1) {
    const X = pts => place(pts, [14, -14], ank[0], ank[1], deg, sc, facing);
    const S0 = [[0, -2], [1, -16], [8, -22], [20, -22], [30, -17], [42, -12], [53, -8], [59, -2], [58, 5], [0, 5]];
    return halo(X(S0), 8) + fillShape(X([[0, 3], [58, 3], [60, 10], [0, 10]]), MINT, 2 * facing, 1.5)
      + fillShape(X(S0), INK) + fillShape(X([[42, -12], [53, -8], [59, -2], [58, 4], [46, 4], [41, -3]]), OFF)
      + stroke(X([[42, -12], [40, -4], [45, 4]]), { w: 2.8 }) + loop(X(S0), { w: 4.2, start: 0.3 })
      + stroke(X([[2, 6], [57, 6]]), { w: 3.6 })
      + stroke(X([[18, -17], [22, -11]]), { w: 2.4, fill: OFF }) + stroke(X([[26, -15], [30, -9]]), { w: 2.4, fill: OFF });
  }

  // a gripping fist seen from the back of the hand, round a bar or rope that crosses it: knuckles point along
  // deg (the forearm direction), three knuckle dashes on the leading edge, the thumb tube lying along the
  // 'top' (local -y) or 'bottom' edge. Pick the side from the handedness table, never by eye.
  function fist(x, y, deg, { thumb = 'top', sc = 1 } = {}) {
    const ts = thumb === 'top' ? 1 : -1;
    const F = pts => xf(pts.map(([px, py]) => [px, py * ts]), x, y, deg, sc);
    const body = F([[-10, -9], [2, -11], [10, -9], [14, -3], [14, 5], [10, 10], [-2, 11], [-10, 8]]);
    const th = tube(F([[-7, -7], [1, -10], [9, -10.5]]), [9.5, 8.5, 7.5], { roundEnd: true });
    return halo(body, 4) + fillShape(body, PAPER) + loop(body, { w: 3.2, start: 0.85 })
      + [-3, 2, 7].map(k => stroke(F([[9, k], [14, k + 0.4]]), { w: 2.0, v: 0.05, a: 0.05, b: 0.05 })).join('')
      + halo(th, 3) + fillShape(th, PAPER) + loop(th, { w: 2.8, start: 0.02 });
  }

  // ---------- fit + write ----------
  function build(sceneFn, outFile, { fitW = 392, fitH = 278, cy = 184, label = '' } = {}) {
    seed = seed0; TRACK = true; BB.length = 0; S = 1; CLIPN = 0; sceneFn();
    const xs = BB.map(p => p[0]), ys = BB.map(p => p[1]);
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
    S = Math.min(fitW / (bx1 - bx0), fitH / (by1 - by0));
    seed = seed0; TRACK = false; CLIPN = 0;
    const body = sceneFn();
    const tx = 240 - S * (bx0 + bx1) / 2, ty = cy - S * (by0 + by1) / 2;
    const aria = label ? ` role="img" aria-label="${label}"` : '';
    const svg = `<svg${aria} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
<rect id="${prefix}paper" x="0" y="0" width="480" height="360" fill="${PAPER}"/>
<g id="${prefix}art"><g transform="translate(${f(tx)} ${f(ty)}) scale(${S.toFixed(4)})">
${body}
</g></g>
</svg>
`;
    if (outFile) fs.writeFileSync(outFile, svg);
    console.log('wrote', outFile, (svg.length / 1024).toFixed(1) + 'KB', 'S=' + S.toFixed(3), 'bbox', bx0.toFixed(0), by0.toFixed(0), bx1.toFixed(0), by1.toFixed(0));
    return { svg, S, bbox: [bx0, by0, bx1, by1] };
  }
  // WK lets a sub-group drawn with its own scale keep card-true widths: set B.setWK(k) before
  // drawing inside <g transform="... scale(k)">, and B.setWK(1) after.
  const setWK = k => { WK = k; };
  const tracking = () => TRACK;

  return { INK, MINT, PAPER, OFF, rnd, f, crPts, resample, poly, ribbon, stroke, loop, fillShape, halo, dot,
    add, sub, mul, lerp, xf, place, tube, rr, openHand, crinkle, camo, clipped, ticks, star, profileHead, shoe, fist,
    build, setWK, tracking, BB };
}

// ---------- demo / self-check ----------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--demo');
  if (i < 0) { console.log('usage: node brush.mjs --demo out.svg'); process.exit(0); }
  const out = process.argv[i + 1] || 'brush-demo.svg';
  const B = createBrush({ prefix: 'bd-', seed: 7 });
  const { INK, MINT, PAPER, OFF, stroke, loop, fillShape, halo, dot, tube, xf, openHand, camo, clipped, ticks, rr, profileHead, shoe, fist } = B;
  B.build(() => {
    const L = []; const P = s => L.push(s);
    P(stroke([[20, 330], [200, 331], [420, 329]], { w: 5.6, v: 0.15, nobb: true }));        // floor
    // mint-plated box: paper fill, shifted mint plate, one-stroke outline
    const box = rr(300, 230, 400, 326, 6);
    P(fillShape(box, OFF)); P(fillShape(box, MINT, -6, -5)); P(loop(box, { w: 4.2, start: 0.3 }));
    // camo cushion
    const cush = [[40, 290], [90, 276], [150, 280], [180, 300], [170, 326], [110, 332], [50, 326]];
    P(fillShape(cush, OFF));
    P(clipped(cush, camo([[[40, 304], [66, 296], [86, 310], [112, 304]], [[120, 318], [142, 312], [166, 322]]], [[[126, 286], [146, 286], [152, 300], [134, 304]]], [[80, 318, 4]])));
    P(loop(cush, { w: 4.4, start: 0.1 }));
    // a black sleeve with a halo and highlight dashes, ending in an open hand
    const arm = tube([[190, 230], [222, 206], [250, 196]], [26, 24, 20]);
    P(halo(arm, 8)); P(fillShape(arm, INK)); P(loop(arm, { w: 4.0 }));
    P(stroke([[204, 212], [218, 204]], { w: 2.6, fill: MINT }));
    const hand = xf(openHand([[-12.5, -11, -58, 17, 12], [-10, -25, -14, 20, 11.5], [-0.5, -27, -3, 23, 11.5], [9, -25, 9, 20, 11], [16.5, -19, 24, 15, 10.5]],
      [[-11, 0], [-13, -6], [16, -10], [12, 0]]), 262, 190, 60, 1.25);
    P(fillShape(hand, PAPER)); P(stroke(hand, { w: 3.4, v: 0.12 }));
    // the set's profile head, a fist on a rope, two shoes, ticks, stipple
    P(profileHead(100, 170, { scale: 1.2, hair: 'curly', eye: 'open', mouth: 'talk' }));
    P(ticks(96, 150, [-150, -120, -90, -60], 52, 64));
    P(stroke([[300, 150], [360, 120], [420, 100]], { w: 3.4, v: 0.08 }));
    P(fist(360, 120, -20, { thumb: 'top' }));
    P(shoe([210, 312], 0, 0.82)); P(shoe([250, 312], -28, 0.82));
    for (const [x, y, r] of [[60, 340, 1.4], [66, 336, 1.1], [64, 344, 1.0]]) P(dot(x, y, r));
    return L.join('\n');
  }, out, { label: 'brush helper demo' });
}
