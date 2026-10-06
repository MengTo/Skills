// One-line card toolkit: point routes -> smooth single strokes, tube limbs, wobbly off-register patches.
// No dependencies. Deterministic: every wobble takes an integer seed, so a re-run gives the same card.
//
// Use it from a generator script (Node, ESM):
//   import { makeCard, tube, place, rev, T, HAND, SHOE, FACE_R } from '/abs/path/to/illustration-one-line/scripts/oneline.mjs';
//   const C = makeCard('sd-');            // id prefix for every id in the card
//   C.line('figure', route);              // the one continuous ink line
//   C.patch('pants', pts, PERI, 2.2, 6);  // off-register colour patch (wobble amp, seed)
//   fs.writeFileSync('card.svg', C.svg());
//
// Self-test / parts sheet:  node scripts/oneline.mjs --demo out.svg   (then render out.svg)
//
// Points are [x, y] or [x, y, k]. k is the tangent tension at that point: 1 = smooth (default),
// 0.4-0.6 = soft corner, 0 = sharp corner (code glyph angles, the tip of a shoe).

export const INK = '#1d1b1a', CORAL = '#f2846e', PERI = '#8790f4', WHITE = '#ffffff', PAPER = '#ece7da';
export const r1 = v => Math.round(v * 10) / 10;

// cubic Bezier segments through points (Catmull-Rom style tangents, per-point tension)
export function bez(pts, closed = false, k = 1) {
  const n = pts.length, segs = [];
  const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const tan = i => {
    const a = P(i - 1), b = P(i + 1), t = (P(i)[2] ?? 1);
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [dx / L * t, dy / L * t];
  };
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = P(i), p1 = P(i + 1);
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 3 * k;
    const t0 = tan(i), t1 = tan(i + 1);
    segs.push([[p0[0], p0[1]], [p0[0] + t0[0] * L, p0[1] + t0[1] * L], [p1[0] - t1[0] * L, p1[1] - t1[1] * L], [p1[0], p1[1]]]);
  }
  return segs;
}
// path data for a smooth stroke (open) or blob (closed)
export function smooth(pts, closed = false, k = 1) {
  const s = bez(pts, closed, k);
  let d = `M${r1(s[0][0][0])} ${r1(s[0][0][1])}`;
  for (const [, c1, c2, p] of s) d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p[0])} ${r1(p[1])}`;
  return closed ? d + 'Z' : d;
}
// dense points along the spline (for measuring: lowest sole point, bounding boxes)
export function sample(pts, closed = false, per = 6) {
  const out = [];
  for (const [a, b, c, d] of bez(pts, closed)) for (let i = 0; i < per; i++) {
    const t = i / per, u = 1 - t;
    out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]);
  }
  return out;
}
// painted-blob wobble: push a closed outline in and out along its normal with three low-frequency sines
export function wobble(pts, amp = 2.5, seed = 1) {
  const S = sample(pts, true, 5), n = S.length;
  const f = [2 + (seed % 3), 5 + (seed % 4), 9 + (seed % 5)], ph = [seed * 1.7, seed * 2.9, seed * 0.7];
  const out = [];
  for (let i = 0; i < n; i += 2) {
    const a = S[(i - 1 + n) % n], b = S[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const s = i / n * Math.PI * 2;
    const o = amp * (0.55 * Math.sin(f[0] * s + ph[0]) + 0.3 * Math.sin(f[1] * s + ph[1]) + 0.15 * Math.sin(f[2] * s + ph[2]));
    out.push([S[i][0] + dy / l * o, S[i][1] - dx / l * o]);
  }
  return out;
}
// limb contours from a centreline C and full widths W (number or array).
// Travelling along C, L is the side to the left of travel on screen (up, when travelling right), R the other.
// Tension values on C carry over to both sides (put 0.4-0.6 on the knee or elbow point for a crisp bend).
export function tube(C, W) {
  const L = [], R = [];
  for (let i = 0; i < C.length; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const nx = dy, ny = -dx, w = (Array.isArray(W) ? W[i] : W) / 2;
    L.push([C[i][0] + nx * w, C[i][1] + ny * w, C[i][2] ?? 1]);
    R.push([C[i][0] - nx * w, C[i][1] - ny * w, C[i][2] ?? 1]);
  }
  return { L, R };
}
// closed outline of a tube (for a sleeve / trouser / brace colour patch): L side out, cap, R side back
export function blob(C, W, k = 1) {
  const t = tube(C, (Array.isArray(W) ? W : C.map(() => W)).map(w => w * k)), n = C.length - 1;
  const Wa = Array.isArray(W) ? W : C.map(() => W);
  const cap = (i, j) => { const d = [C[i][0] - C[j][0], C[i][1] - C[j][1]], l = Math.hypot(...d) || 1; return [C[i][0] + d[0] / l * Wa[i] * 0.35, C[i][1] + d[1] / l * Wa[i] * 0.35]; };
  return [...t.L.map(p => [p[0], p[1]]), cap(n, n - 1), ...rev(t.R).map(p => [p[0], p[1]]), cap(0, 1)];
}
// place a local shape: optional vertical flip, scale, rotate by deg, translate to o.
// Local shapes in this file point along +x from a wrist/ankle at 0,0; +y is the R side of the limb.
export function place(shape, o, deg = 0, s = 1, flip = false) {
  const c = Math.cos(deg * Math.PI / 180), si = Math.sin(deg * Math.PI / 180);
  return shape.map(([x, y, t]) => { if (flip) y = -y; x *= s; y *= s; return [o[0] + x * c - y * si, o[1] + x * si + y * c, t ?? 1]; });
}
export const T = (pts, dx, dy) => pts.map(([x, y, t]) => [x + dx, y + dy, t ?? 1]);
export const rev = a => a.slice().reverse();
export const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
export const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
// rotate points about a pivot (lean an upper body over the hips)
export const rot = (pts, deg, pv) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y, t]) => { const dx = x - pv[0], dy = y - pv[1]; return [pv[0] + dx * c - dy * s, pv[1] + dx * s + dy * c, t ?? 1]; }); };
// lowest point of a stroke (to sit a ground squiggle 1 px under a sole)
export const lowest = (pts) => sample(pts, false, 8).reduce((lo, p) => p[1] > lo[1] ? p : lo);
export function bbox(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(r1); }

// trochoid curls along a base polyline (curly hair, a cursive tail). r = curl radius, loops = how many
export function curls(base, r, loops, phase = 0, per = 6, side = 1) {
  const S = sample(base, false, 10), n = S.length, out = [], tot = Math.round(loops * per);
  for (let i = 0; i <= tot; i++) {
    const s = i / tot, fj = s * (n - 1), j = Math.min(n - 2, Math.floor(fj)), f = fj - j;
    const a = S[j], b = S[j + 1];
    const px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f;
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = ty * side, ny = -tx * side, th = s * loops * Math.PI * 2 + phase;
    const u = -Math.sin(th) * r, v = (1 - Math.cos(th)) * r;
    out.push([px + tx * u + nx * v, py + ty * u + ny * v]);
  }
  return out;
}
// hand-written squiggle between two x's (code tokens, a wave, a ground line)
export function squig(x0, x1, y, amp = 1.8, wl = 9, ph = 0) {
  const pts = [], n = Math.max(2, Math.round((x1 - x0) / (wl / 2)));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push([x, y + (i === 0 || i === n ? 0 : amp * Math.sin(i * Math.PI / 2 + ph))]); }
  return pts;
}
// a cursive loop on the outer side n of a stroke travelling along d at point p (radius r)
export function loopAt(p, d, n, r, fwd = 1.5) {
  const l = Math.hypot(d[0], d[1]); d = [d[0] / l, d[1] / l];
  const m = Math.hypot(n[0], n[1]); n = [n[0] / m, n[1] / m];
  const c = [p[0] + n[0] * r, p[1] + n[1] * r];
  return [[p[0], p[1], 0.8], [c[0] + d[0] * r, c[1] + d[1] * r], [c[0] + n[0] * r, c[1] + n[1] * r], [c[0] - d[0] * r, c[1] - d[1] * r], [p[0] + d[0] * fwd, p[1] + d[1] * fwd, 0.8]];
}
// loop at a contour corner p (prev -> p -> next), bulging away from the point `inside`
export const cornerLoop = (prev, p, next, inside, r, fwd = 1.5) => loopAt(p, [next[0] - prev[0], next[1] - prev[1]], [p[0] - inside[0], p[1] - inside[1]], r, fwd);
// circle / arc points (a sun, a clock face, a ring); w = slight radius wobble
export function arc(c, r, a0, a1, n, w = 0) { const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; const rr = r * (1 + w * Math.sin(i * 1.3)); o.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); } return o; }

// ---------------------------------------------------------------- local shapes
// All hands and shoes: wrist/ankle centre at 0,0, pointing +x, listed from the +y wrist corner, round the
// tip, to the -y wrist corner. A route going DOWN a limb's R side and back UP its L side uses the shape as is;
// a route going down L and back up R uses rev(shape) or place(..., flip = true). Scale 1.1-1.3 at 480 wide.
export const HAND = {
  // closed mitten with a thumb notch (a swinging hand). Thumb lobe on the +y side, near the wrist.
  mitten: [[0, 3.4], [3, 4.2], [5.5, 6], [8, 8.6], [10.2, 7.8], [9.4, 5, 0.4], [12.2, 4.6], [15, 3], [16, 0], [14.6, -3], [11, -4.4], [5, -4.4], [0, -3.4]],
  // fist round a handle: knuckle bumps on the +x end, thumb curl on the -y side
  fist: [[0, 5], [3, 7], [8, 8.2], [14, 7.6], [17, 4.6], [15, 2, 0.4], [17.5, 0.8], [17, -2.5], [13.5, -4.2, 0.4], [16, -6, 0.6], [13, -8], [8, -8], [4, -6.5], [0, -5]],
  // open palm, level (carrying a tray / laptop): thumb bump on +y by the wrist, fingertips curl toward +y at the end
  tray: [[0, 3.4], [4, 4.4], [6.5, 6.4], [9.2, 7.2], [10.6, 5.2, 0.4], [14.5, 4.2], [18.2, 5], [19.8, 8.6], [21.8, 8], [21.8, 3.4], [19.8, -1.4], [15, -3.8], [8, -4.4], [0, -3.4]],
  // open waving / catching hand: thumb hooked out on +y, fingers as one rounded lobe
  open: [[0, 3.6], [3, 4.4], [5, 5.4], [8, 9.2], [10.4, 9.4], [10, 6.8], [8.4, 4.4, 0.3], [13, 4], [17.5, 3], [19.4, 0.6], [18.6, -2.4], [13.5, -3.8], [6, -4.2], [0, -3.6]],
};
// spread hand with four separate finger loops and a thumb (the waving hand in examples/flow-state.svg).
// Built rather than listed: f = finger lengths index..little, spread in degrees, thumb on the +y side.
export function spreadHand({ len = [9.8, 11.2, 10, 7.6], spread = 16, palm = 9, width = 11, thumb = 8.6 } = {}) {
  const pts = [[0, width / 2 + 0.6], [3, width / 2 + 1.2]];
  // thumb lobe out at about 60 degrees on +y
  const ta = 62 * Math.PI / 180, tb = [3.6, width / 2 + 0.6];
  pts.push([tb[0] + Math.cos(ta) * thumb * 0.6, tb[1] + Math.sin(ta) * thumb * 0.6], [tb[0] + Math.cos(ta) * thumb + 1.2, tb[1] + Math.sin(ta) * thumb, 0.5], [tb[0] + Math.cos(ta) * thumb + 3, tb[1] + Math.sin(ta) * thumb - 2], [palm - 1.6, width / 2 - 0.4, 0.3]);
  // fingers from the index (+y edge) to the little finger (-y edge)
  for (let i = 0; i < 4; i++) {
    const y = width / 2 - 1.2 - i * (width - 2.4) / 3, a = (1.5 - i) * spread * 0.5 * Math.PI / 180, L = len[i];
    const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], b = [palm, y], w = 1.95 - i * 0.12;
    pts.push([b[0] + d[0] * L * 0.55 + n[0] * w, b[1] + d[1] * L * 0.55 + n[1] * w], [b[0] + d[0] * L, b[1] + d[1] * L], [b[0] + d[0] * L * 0.55 - n[0] * w, b[1] + d[1] * L * 0.55 - n[1] * w]);
    if (i < 3) pts.push([palm + 0.6, y - (width - 2.4) / 6, 0.2]);
  }
  pts.push([palm - 2, -width / 2 - 0.2], [3, -width / 2 - 0.6], [0, -width / 2]);
  return pts;
}
// fist seen from the side, gripping an edge or a handle that runs across it (the near hand holding the laptop in
// flow-state.svg): smooth back of the hand on +y, knuckles at +x, four curled-finger bumps along -y (tension 0 between
// bumps). Thumb hidden on the far side. Put the gripped edge under the bumps, and mask the prop's line under the hand.
export const CLAMP = [[0, 4.6], [5, 5.4], [10, 5], [13.6, 2.6], [14.8, -1], [14, -4.6], [11.6, -6.8, 0.5], [10.6, -4.6, 0], [8.8, -6.8, 0.5], [7.6, -4.6, 0], [5.8, -6.4, 0.5], [4.6, -4.4, 0], [2.6, -5.6, 0.5], [0, -4.6]];
// sneaker in profile, toe toward +x: heel at x -6, sole along +y ~10
export const SHOE = [[0, -1], [5, -2.5], [11, -2], [17, 1.5], [21, 4.5], [20.5, 8.5], [15, 9.8], [4, 9.8], [-4, 9.2], [-6, 5], [-5.5, 0]];
// head pieces, facing RIGHT, head-local (scale 1.05-1.35): chin -> lips -> nose -> brow, then on to the crown
export const FACE_R = [[7.5, 15.5], [12, 14.6], [16.4, 12.6], [17.8, 9.6, 0.5], [16.6, 8.2, 0.5], [18.6, 6.6, 0.5], [17.4, 4.6, 0.5], [21.3, 2.8, 0.5], [18.5, 0.2], [16, -3.2], [15, -6.5]];
export const EYE_R = [[8.5, -3.5], [10, -5], [11.8, -4.2]];             // a closed, smiling lid arc (separate short stroke)
export const EAR_R = [[1.6, 1.6], [3.2, 4.8], [1.2, 7.8], [-2, 8.8]];     // a C-shaped ear at mid-head; the line then runs down the jaw
export const mirrorX = (pts, cx = 0) => pts.map(([x, y, t]) => [2 * cx - x, y, t ?? 1]);

// ---------------------------------------------------------------- card assembly
// Layers, bottom to top: paper rect, <defs> (masks), patches (white/coral/periwinkle blobs), accents
// (coloured stripes and code dashes), ink (the black line, stroke 2.3, round caps and joins).
// Options: map = one function from your authoring frame to the card (shift, scale, mirror), applied to every
// point passed to line, patch, accent, mask, dot and dots. Example: makeCard('sd-', { map: p => T(p, -16, 2) }).
// Patches and lines share ONE id namespace: name patches after their colour ('laptop-peri', 'shoe-white').
export function makeCard(prefix, { map = null } = {}) {
  const L = { patch: [], accent: [], line: [], defs: [], dbg: [] };
  const id = s => `${prefix}${s}`;
  const M = map ? (pts => map(pts)) : (pts => pts);
  // the drawing methods, built once with the map and once without (C.raw.*: points already in card space,
  // e.g. </> glyphs on a figure whose map mirrors it)
  const methods = M => ({
    // ink stroke through points; extra = raw attributes, e.g. ' stroke-width="1.8"' or ' mask="url(#..)"'
    line: (n, pts, extra = '', k = 1) => L.line.push(`<path id="${id(n)}" d="${smooth(M(pts), false, k)}"${extra}/>`),
    dot: (n, p, r = 1.9) => { p = M([p])[0]; L.line.push(`<circle id="${id(n)}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r}" fill="${INK}" stroke="none"/>`); },
    // coloured line (stripe on a top, code dash): 1.9 for stripes, 2.3 for code tokens
    accent: (n, pts, col, w = 1.9, extra = '') => L.accent.push(`<path id="${id(n)}" d="${smooth(M(pts))}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`),
    // off-register colour patch: closed blob through pts, wobbled (amp 0.8-3, integer seed)
    patch: (n, pts, col, amp = 2.2, seed = 1) => { pts = M(pts); L.patch.push(`<path id="${id(n)}" d="${smooth(amp ? wobble(pts, amp, seed) : pts, true)}" fill="${col}"/>`); },
    // knock-out mask: the ink under these silhouettes disappears (a line passing behind an arm or a prop).
    // shapes = [[pts, strokeWidth]]; returns the attribute string to pass as `extra` to C.line
    mask: (n, shapes) => { L.defs.push(`<mask id="${id(n)}" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="360"><rect width="480" height="360" fill="#fff"/>${shapes.map(([pts, w = 0]) => `<path d="${smooth(M(pts), true)}" fill="#000"${w ? ` stroke="#000" stroke-width="${w}" stroke-linejoin="round"` : ''}/>`).join('')}</mask>`); return ` mask="url(#${id(n)})"`; },
  });
  const C = {
    L, id, map: M, ...methods(M), raw: methods(p => p),
    rawLine: (n, d, extra = '') => L.line.push(`<path id="${id(n)}" d="${d}"${extra}/>`),
    // debug: numbered dots on route points (render with C.svg(true), never ship)
    dots: (pts, col = '#e00', lab = true) => { M(pts).forEach((p, i) => L.dbg.push(`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="1.2" fill="${col}"/>` + (lab ? `<text x="${r1(p[0] + 1.5)}" y="${r1(p[1] - 1.5)}" font-size="4" fill="${col}" font-family="ui-monospace">${i}</text>` : ''))); },
    svg: (dbg = false, label = '') => `<svg${label ? ` role="img" aria-label="${label}"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
<rect id="${id('paper')}" x="0" y="0" width="480" height="360" fill="${PAPER}"/>
${L.defs.length ? `<defs>\n${L.defs.join('\n')}\n</defs>\n` : ''}<g id="${id('patches')}">
${L.patch.join('\n')}
</g>
<g id="${id('accents')}">
${L.accent.join('\n')}
</g>
<g id="${id('ink')}" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
${L.line.join('\n')}
</g>${dbg ? '\n<g>' + L.dbg.join('') + '</g>' : ''}
</svg>
`,
  };
  return C;
}

// ---------------------------------------------------------------- demo / self-test
// node scripts/oneline.mjs --demo out.svg : one arm, one leg and a head built the documented way, so you can
// render it and see each mechanism (route, tube, hand and shoe shapes, patches, stripes, mask, ground squiggle).
if (process.argv[2] === '--demo') {
  const fs = await import('node:fs');
  const out = process.argv[3] || 'oneline-demo.svg';
  const C = makeCard('demo-');
  // arm: shoulder -> elbow (tension 0.5) -> wrist; widths shoulder 18 -> wrist 9
  const arm = [[150, 120], [170, 132], [190, 146, 0.5], [212, 136], [232, 124]], armW = [18, 16, 13.5, 11, 9];
  const a = tube(arm, armW);
  const hand = place(HAND.mitten, arm[4], ang(arm[3], arm[4]), 1.2);
  C.line('arm', [[140, 112], ...a.R.slice(1), ...hand, ...rev(a.L).slice(0, 4), [146, 108]]);
  C.patch('sleeve', T(blob(arm.slice(0, 3), armW.slice(0, 3), 1.05), 3, -3), WHITE, 1.4, 4);
  C.patch('hand', T(place([[0, -5], [12, -5], [17, 0], [12, 7], [2, 6]], arm[4], ang(arm[3], arm[4]), 1.2), 2, -3), CORAL, 0.8, 5);
  C.accent('stripe', [[163, 122], [159, 127], [158, 133], [160, 138]], CORAL);
  // leg: hip -> knee -> ankle, shoe at the end, ground squiggle 1 px under the sole
  const leg = [[300, 150], [306, 180], [312, 210, 0.5], [300, 236], [290, 262]], legW = [27, 24, 19, 15, 12];
  const g = tube(leg, legW);
  // travelling DOWN the leg, R is the screen-left (back) side: back of leg -> heel -> sole -> toe -> instep -> shin
  const route = [...g.R, ...place(rev(SHOE), leg[4], 0, 1.25), ...rev(g.L)];
  C.line('leg', route);
  C.patch('shoe', T(place([[-6, -2], [10, -3], [22, 3], [22, 10], [4, 11], [-7, 8]], leg[4], 0, 1.25), 3, 2), WHITE, 1.2, 9);
  C.patch('pants', T(blob(leg.slice(0, 4), legW.slice(0, 4), 1.0), 5, 3), PERI, 2.2, 6);
  const sole = lowest(route);
  C.line('ground', T([[-44, -1.5], [-36, 1.2], [-28, -3], [-31, -10], [-38, -8], [-34, -0.6], [-20, 1], [-6, -0.4], [8, 0.6], [22, -1], [34, 0.8]], sole[0], sole[1] + 1.1));
  // head facing right, closed-eye arc, face patch knocked off-register
  const H = p => place(p, [80, 230], -6, 1.2);
  // ear -> jaw -> under the chin -> profile -> crown -> back of the skull, trailing off at the nape
  C.line('head', H([...EAR_R, [-4.6, 11.8], [0, 14.6], ...FACE_R, [13.5, -10.5], [9, -15], [3, -18.5], [-5, -19], [-13, -15], [-19, -8], [-21, 0], [-19, 7], [-15, 11], [-10, 12.5]]));
  C.line('eye', H(EYE_R));
  C.patch('face', T(H([[6, -12], [16, -8], [22, 2], [19, 13], [9, 15], [5, 2]]), 2, -1), CORAL, 1.1, 4);
  C.patch('hair', T(H([[-20, -6], [-10, -18], [6, -19], [12, -12], [-2, -10], [-10, -2], [-18, 8]]), -3, -2), PERI, 1.2, 9);
  // code dashes as coloured squiggles, and a curl
  C.accent('code0', squig(360, 400, 300, 0.9, 14, 1), CORAL, 2.3);
  C.accent('code1', squig(408, 440, 300, 0.9, 14, 2), PERI, 2.3);
  C.line('curl', curls([[360, 60], [400, 70], [440, 60]], 4, 3, 0, 7));
  fs.writeFileSync(out, C.svg(false, 'one-line toolkit demo'));
  console.log('wrote', out);
}
