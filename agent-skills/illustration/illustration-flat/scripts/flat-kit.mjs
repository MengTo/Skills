// flat-kit.mjs: the parts the three Flat example cards were generated from (tapered limbs, sneakers,
// open hands, a gripping fist, profile heads, confetti), ported to dependency-free Node.
//
//   import * as K from './flat-kit.mjs';         use from a card generator (see SKILL.md, Techniques)
//   node flat-kit.mjs --demo out.svg              write a parts sheet: every part once, labelled
//
// Every function returns SVG markup strings (or arrays of them). Numbers are SVG units at 480 wide.
// Deterministic: there is no randomness, so a re-run gives the same card.
import fs from 'node:fs';

// ---------------------------------------------------------------- palette (measured from the examples)
export const PAL = {
  navy: '#011B5C',   // hair, sneaker outline + heel tab, hairline contours, laptops, motion marks
  lav: '#9E91E1',    // sweaters, browser title bars, decor
  ind: '#6A6CEB',    // trousers, tags, screens
  yel: '#FEC600',    // tops, props (chain, desk), decor dots
  skin: '#FD9999',   // the one skin tone
  pink: '#FF7F91',   // socks, trousers, decor rings and squiggles, UI pills
  mint: '#93D7D5',   // tees, ladders, image placeholders, decor triangles
  white: '#FFFFFF',  // sneakers, fold strokes, window bodies
  smoke: '#CDC6EF',  // pale lavender: smoke, clouds, soft secondary masses
  smoke2: '#E4E0F7', // palest lavender: front puffs over smoke
  tape: '#FFE58A',   // masking tape, pale highlight props
  red: '#FF6378',    // warning red: one alert prop per card at most
};
const { navy: NAVY, skin: SKIN, white: WHITE } = PAL;

// ---------------------------------------------------------------- numbers and vectors
export const f = v => { const s = (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s; };
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, s) => [a[0] * s, a[1] * s];
export const norm = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
export const perp = a => [-a[1], a[0]];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
export const fwd = (p, a, d) => [p[0] + Math.cos(a * Math.PI / 180) * d, p[1] + Math.sin(a * Math.PI / 180) * d];
export const rotPt = (p, c, a) => { const r = a * Math.PI / 180, x = p[0], y = p[1]; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
// a local frame: frame(origin, angle)(p) maps a point drawn upright around origin into the scene.
// Use it to lean a whole torso: const W = frame(pelvis, -23); W([0, -80]) is the shoulder line.
export const frame = (o, a) => p => rotPt(p, o, a);

// ---------------------------------------------------------------- paths
export function catmull(pts, closed = false, k = 6) {
  const n = pts.length, out = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = (closed || i > 0) ? pts[(i - 1 + n) % n] : pts[i];
    const p1 = pts[i], p2 = pts[(i + 1) % n];
    const p3 = (closed || i + 2 < n) ? pts[(i + 2) % n] : p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / k, p1[1] + (p2[1] - p0[1]) / k];
    const c2 = [p2[0] - (p3[0] - p1[0]) / k, p2[1] - (p3[1] - p1[1]) / k];
    out.push(`C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`);
  }
  return out.join(' ');
}
export const smooth = pts => `M${f(pts[0][0])} ${f(pts[0][1])} ${catmull(pts, true)} Z`;   // closed blob through points
export const open = pts => `M${f(pts[0][0])} ${f(pts[0][1])} ${catmull(pts)}`;           // open curve through points
export const poly = (pts, close = true) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (close ? ' Z' : '');

// tapered tube through [[x, y, width], ...]: limbs, table legs, ladder rails. Round caps unless cap0/cap1 false.
export function tube(pts, { cap0 = true, cap1 = true } = {}) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i].slice(0, 2), w = pts[i][2] / 2;
    let d;
    if (i === 0) d = norm(sub(pts[1], p));
    else if (i === n - 1) d = norm(sub(p, pts[i - 1]));
    else d = norm(add(norm(sub(p, pts[i - 1])), norm(sub(pts[i + 1], p))));
    const nr = perp(d);
    L.push(add(p, mul(nr, w))); R.push(sub(p, mul(nr, w)));
  }
  let s = `M${f(L[0][0])} ${f(L[0][1])} ` + catmull(L);
  const w1 = pts[n - 1][2] / 2, w0 = pts[0][2] / 2;
  s += cap1 ? ` A${f(w1)} ${f(w1)} 0 0 0 ${f(R[n - 1][0])} ${f(R[n - 1][1])}` : ` L${f(R[n - 1][0])} ${f(R[n - 1][1])}`;
  s += ' ' + catmull(R.slice().reverse());
  if (cap0) s += ` A${f(w0)} ${f(w0)} 0 0 0 ${f(L[0][0])} ${f(L[0][1])}`;
  return s + ' Z';
}

// <path>; with a stroke it gets round caps and joins
export function P(d, fill = 'none', stroke = null, sw = null, extra = '') {
  let a = `<path d="${d}" fill="${fill}"`;
  if (stroke) a += ` stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  return a + extra + '/>';
}
// a white fold or crease stroke (1.4 on clothes, 1.3 on sleeves and smoke, 1.1 on hair)
export const fold = (pts, col = WHITE, sw = 1.4) => P(open(pts), 'none', col, sw);
// a navy hairline contour (an arm crossing the torso, a crotch crease, a collar)
export const contour = (pts, sw = 1.3) => P(open(pts), 'none', NAVY, sw);
export function T(x, y, a = 0, s = 1, sx = null) {
  sx = sx ?? s;
  let t = `translate(${f(x)} ${f(y)})`;
  if (a) t += ` rotate(${f(a)})`;
  if (sx !== 1 || s !== 1) t += sx !== s ? ` scale(${f(sx)} ${f(s)})` : ` scale(${f(s)})`;
  return t;
}

// ---------------------------------------------------------------- sneaker
// White low-top, toe pointing LEFT (flip:true points it right). heel = the heel's bottom corner, on the floor.
// a = rotation in degrees. Toe-left shoe: positive a lifts the toe (heel planted, toes up, weight rocking
// back); negative a drops the toe (tiptoe, heel up). With flip (toe right) the signs swap: positive a is tiptoe.
// For a tiptoe, place the shoe with shoePt so the TOE touches the floor. s = 1.12 to 1.2 on a 230 px figure.
export function shoe(heel, { a = 0, s = 1.15, flip = false } = {}) {
  const sx = flip ? -s : s;
  return [
    `<g transform="translate(${f(heel[0])} ${f(heel[1])}) rotate(${f(a)}) scale(${f(sx)} ${f(s)})" stroke="${NAVY}" stroke-width="1.17" stroke-linejoin="round" stroke-linecap="round">`,
    `<path d="M-40 0 C-41 -5 -38 -9 -31 -10.5 C-26 -11.5 -22 -13 -18 -16 L-4 -17 C-1 -17 0 -14 0 -10 L0 0 Z" fill="${WHITE}"/>`,
    `<path d="M-8 -16.6 C-5 -18.6 -1 -17.8 0 -14.4 C0.6 -12.4 -0.4 -11 -2 -11.4 C-3.4 -14 -5.4 -15.6 -8 -16.6 Z" fill="${NAVY}"/>`,
    '<path d="M-38 -3.5 H0" fill="none"/>',
    '<path d="M-24 -11 l3 -4 M-20 -12.5 l3 -4" fill="none"/>',
    '</g>',
  ].join('\n');
}
// world position of a point given in the shoe's local frame (same a, s, flip as shoe())
export function shoePt(heel, { a = 0, s = 1.15, flip = false } = {}, [x, y]) {
  if (flip) x = -x;
  x *= s; y *= s;
  const r = a * Math.PI / 180;
  return [heel[0] + x * Math.cos(r) - y * Math.sin(r), heel[1] + x * Math.sin(r) + y * Math.cos(r)];
}

// ---------------------------------------------------------------- leg = sock band + tapered trouser + sneaker
// hip/knee are scene points; the hem lands on the shoe collar automatically. Widths: hip 29 to 32,
// knee 22 to 23.5, hem 19 to 20.5 (narrower is wrong: the leg reads as a stick; wider reads as a box).
// Draw the FAR leg first. Returns one string.
export function leg({ hip, knee, heel, a = 0, s = 1.15, flip = false, trouser = PAL.ind, sock = PAL.pink, hipW = 30, kneeW = 22.5, hemW = 20, hipCap = false }) {
  const sh = { a, s, flip };
  const band = [[-17.5, -15], [-1.5, -16.5], [-1.5, -27], [-17.5, -27]].map(p => shoePt(heel, sh, p));
  const hem = shoePt(heel, sh, [-9.5, -26]);
  return [
    P(poly(band), sock),
    P(tube([[...hip, hipW], [...knee, kneeW], [...hem, hemW]], { cap0: hipCap, cap1: false }), trouser),
    shoe(heel, sh),
  ].join('\n');
}

// ---------------------------------------------------------------- hands
// Thumb proof (references/craft.md): K.setProof(true) before drawing paints every openHand thumb #ff0000 and
// index finger #0000ff. Write that to a throwaway proof.svg, zoom each hand at 8x, then delete it.
let PROOF = false;
export const setProof = v => { PROOF = !!v; };
// Open hand. wrist = scene point; a = the direction the FINGERS point, in degrees (0 = right, -90 = up).
// hand 'L' | 'R' and side 'back' | 'palm' put the thumb on the correct side (references/craft.md table):
// R+back and L+palm: thumb = finger direction rotated 90 deg counter-clockwise on screen; the others clockwise.
// spread = finger fan in degrees (0 to 10); narrow = slim wrist flaring into the palm (use it).
export function openHand(wrist, a, { s = 1.08, hand = 'R', side = 'back', spread = 6, curl = 0, narrow = true, lines = true } = {}) {
  const thumbNeg = (hand === 'R') === (side === 'back');      // thumb on local -x
  const sx = s * (thumbNeg ? 1 : -1);
  const o = [`<g transform="translate(${f(wrist[0])} ${f(wrist[1])}) rotate(${f(a + 90)}) scale(${f(sx)} ${f(s)})">`];
  const palm = narrow
    ? 'M-2.7 2.2 C-3 -1.4 -5.4 -5.6 -6.1 -9.4 C-6.4 -11.6 -5.4 -12.6 -3.6 -12.6 L3.8 -12.6 C5.6 -12.6 6.6 -11.4 6.5 -9.6 C6.2 -5.8 3.6 -1.6 2.9 2.2 Z'
    : 'M-3.9 0.6 C-4.4 -3 -5.8 -6.6 -6.2 -9.6 C-6.4 -11.6 -5.4 -12.6 -3.6 -12.6 L3.8 -12.6 C5.6 -12.6 6.6 -11.4 6.5 -9.6 C6.3 -6.2 5.2 -2.8 4.3 0.6 Z';
  o.push(P(palm, SKIN));
  const fingers = [[-4.35, 9.0, -1.5 * spread], [-1.15, 10.2, -0.5 * spread], [2.05, 9.4, 0.5 * spread], [5.05, 7.4, 1.5 * spread]];
  const tips = [];
  for (const [k, [bx, ln, da]] of fingers.entries()) {
    const r = da * Math.PI / 180;
    const base = [bx, -11.4], mid = [bx + Math.sin(r) * ln * 0.55, -11.4 - Math.cos(r) * ln * 0.55];
    const r2 = r - 55 * curl * Math.PI / 180;
    const tip = [mid[0] + Math.sin(r2) * ln * 0.45, mid[1] - Math.cos(r2) * ln * 0.45];
    tips.push([base, mid, tip]);
    o.push(P(`M${f(base[0])} ${f(base[1])} Q${f(mid[0])} ${f(mid[1])} ${f(tip[0])} ${f(tip[1])}`, 'none', PROOF && k === 0 ? '#0000ff' : SKIN, 3.45));
  }
  const TH = PROOF ? '#ff0000' : SKIN;
  if (narrow) {
    o.push(P('M-5 -5.2 C-7.6 -6.8 -9.4 -9 -10.6 -11.8', 'none', TH, 3.6));
    o.push(P('M-3.6 -2.4 C-5.8 -5.2 -7.6 -7 -9.6 -9.4 L-5.6 -10 Z', TH));
  } else {
    o.push(P('M-4.8 -3.4 C-7.4 -5.2 -9.4 -7.6 -10.6 -10.6', 'none', TH, 3.7));
    o.push(P('M-4.4 -1.6 C-6.2 -4.2 -7.6 -6 -9.6 -8.2 L-5.6 -8.6 Z', TH));
  }
  if (lines) {
    const sw = f(0.85 / s);
    for (let i = 0; i < 3; i++) {
      const [b1, m1, t1] = tips[i], [b2, m2, t2] = tips[i + 1];
      const top = lerp(lerp(m1, t1, 0.55), lerp(m2, t2, 0.55), 0.5), low = lerp(lerp(b1, m1, 0.25), lerp(b2, m2, 0.25), 0.5);
      o.push(P(`M${f(top[0])} ${f(top[1])} L${f(low[0])} ${f(low[1])}`, 'none', NAVY, sw));
    }
  }
  o.push('</g>');
  return o.join('\n');
}

// Fist gripping a bar (a chain link, a rope, a handle, a cable). c = centre of the grip on the bar,
// a = the bar's direction in degrees, forearm arrives from local +y (perpendicular to the bar).
// Returns { back, front }: draw back BEFORE the bar and front AFTER it, so the fingers wrap the bar.
// mirror flips the thumb to the other end of the fist: decide it with the handedness table.
export function fist(c, a, { s = 1.12, mirror = false } = {}) {
  const m = mirror ? -1 : 1;
  const tr = `translate(${f(c[0])} ${f(c[1])}) rotate(${f(a)}) scale(${f(s * m)} ${f(s)})`;
  const back = `<path transform="${tr}" d="M0.4 14.8 C-2.2 11.8 -8.6 8.4 -8.6 3.4 V-3.6 C-8.6 -7.2 -6 -8.8 -2.6 -8.8 H3 C6.4 -8.8 8.6 -7.2 8.6 -3.6 V2.4 C9.8 5.8 11.4 9 11.8 12.4 Z" fill="${SKIN}"/>`;
  const front = [
    `<g transform="${tr}">`,
    `<path d="M4.4 -8.2 C1.6 -8.2 -1.4 -8 -4 -7.5 C-6.6 -7 -7.9 -5.8 -7.9 -3.4 V0.2 Q-7.9 2 -6 2 Q-4.2 2 -4.1 0.6 Q-4 2.8 -2.1 2.8 Q-0.2 2.8 -0.1 0.9 Q0 3.1 1.9 3.1 Q3.8 3.1 3.9 1 L4.4 -1 Z" fill="${SKIN}"/>`,
    `<path d="M3.9 -8.2 H4.6 C6.6 -8.2 7.9 -7 7.9 -4.6 V0.9 Q7.9 2.9 5.9 2.9 Q3.95 2.9 3.9 1 Z" fill="${SKIN}"/>`,
    `<path d="M4.4 8.4 C7.2 8 9.8 6 10.5 2.8 C10.9 0.8 10.2 -0.9 8.6 -1.3 C6.4 -1.8 3.6 -1.6 1.6 -1.1 C0.2 -0.7 -0.3 0.9 0.6 1.9 C1.4 2.8 3.4 3 5.4 3.1 C6.2 4.4 5.8 6.4 4.4 8.4 Z" fill="${SKIN}"/>`,
    `<path d="M1.4 -0.9 C3.6 -1.6 6.4 -1.8 8.8 -1.1" fill="none" stroke="${NAVY}" stroke-width="0.9" stroke-linecap="round"/>`,
    `<path d="M3.9 -5.6 V-2.4 M-0.1 -5.9 V-1.9 M-4.1 -5 V-0.9" fill="none" stroke="${NAVY}" stroke-width="0.8" stroke-linecap="round"/>`,
    '</g>',
  ].join('\n');
  return { back, front };
}

// ---------------------------------------------------------------- arms
// sh, el, wr = shoulder, elbow, wrist (scene points). sleeve:
//   'short'  tee: bare upper arm and forearm, a 17 px sleeve tube with a white hem fold
//   'cuffed' 3/4 sleeve to just below the elbow, flared cuff, bare tapered forearm
//   'long'   sleeve to the wrist, flared cuff, a sliver of wrist
// Returns one string. Add the hand afterwards at the same wrist point.
export function arm(sh, el, wr, { sleeve = 'cuffed', top = PAL.yel, skin = SKIN } = {}) {
  const o = [];
  const d1 = norm(sub(el, sh)), d2 = norm(sub(wr, el)), n1 = perp(d1), n2 = perp(d2);
  if (sleeve === 'short') {
    const fa1 = add(el, mul(sub(wr, el), 0.28)), um = add(sh, mul(sub(el, sh), 0.45));
    o.push(P(tube([[...el, 8.6], [...fa1, 9.2], [...wr, 5.6]], { cap0: true, cap1: false }), skin));
    o.push(P(tube([[...sh, 11.2], [...um, 10.6], [...el, 8.4]], { cap0: false, cap1: true }), skin));
    const se = add(sh, mul(d1, 17)), sb = add(sh, mul(d1, -3));
    o.push(P(poly([add(sb, mul(n1, 7.4)), add(se, mul(n1, 8.4)), add(se, mul(n1, -8.4)), add(sb, mul(n1, -7.4))]), top, top, 3));
    o.push(fold([add(se, add(mul(n1, 7), mul(d1, -2.4))), add(se, add(mul(n1, -7), mul(d1, -2.4)))], WHITE, 1.3));
    return o.join('\n');
  }
  const cuffT = sleeve === 'long' ? 0.8 : 0.24;
  const cuff = add(el, mul(sub(wr, el), cuffT));
  o.push(P(tube([[...cuff, 8.2], [...wr, 6.2]], { cap0: false, cap1: false }), skin));
  o.push(P(tube([[...sh, 15], [...el, 13], [...cuff, sleeve === 'long' ? 11.6 : 13.4]], { cap0: true, cap1: false }), top));
  const c1 = add(cuff, mul(d2, 3.2)), hw = sleeve === 'long' ? 6 : 6.7, fw = sleeve === 'long' ? 6.8 : 7.6;
  o.push(P(poly([add(cuff, mul(n2, hw)), add(c1, mul(n2, fw)), add(c1, mul(n2, -fw)), add(cuff, mul(n2, -hw))]), top, top, 1.6));
  o.push(fold([add(cuff, add(mul(n2, hw - 0.9), mul(d2, 0.4))), add(cuff, add(mul(n2, -(hw - 0.9)), mul(d2, 0.4)))], WHITE, 1.2));
  return o.join('\n');
}

// ---------------------------------------------------------------- torso
// A sweater/top drawn upright in a pelvis frame W = frame(pelvis, lean): pelvis at [0, 0], shoulders at y -80,
// 40 wide, a ribbed hem at y +6. Returns the shape, its hem fold and two body folds (white 1.4).
// Shoulder points for arm(): W([-9, -72]) and W([10, -74]). Collar for neck(): W([-4.6, -79.5]), W([4.6, -80.5]).
export const TORSO = [[-20, 6], [-19.6, 2], [-19, -22], [-20.5, -50], [-17, -72], [-7, -83], [7, -84], [17, -77], [21, -56], [19, -26], [20.6, 2], [21, 6], [0.5, 7.5]];
// flip: true for a figure facing RIGHT (the chest is drawn on local -x, so it mirrors to +x; use W([9, -72])
// and W([-10, -74]) for the shoulders and neck(..., { flip: true })).
export function torso(W, { top = PAL.yel, pts = TORSO, folds = true, flip = false } = {}) {
  const M = flip ? p => W([-p[0], p[1]]) : W;
  const o = [P(smooth(pts.map(M)), top)];
  if (folds) {
    o.push(fold([M([-19, -1]), M([0, 0]), M([20, -1])]));
    o.push(fold([M([13, -64]), M([15.5, -50]), M([15, -38])]));
    o.push(fold([M([-14, -24]), M([-6, -18]), M([3, -19])]));
  }
  return o.join('\n');
}

// ---------------------------------------------------------------- head (profile, facing LEFT; flip:true faces right)
// c = head centre (about the ear), a = tilt in degrees (negative looks up for a left-facing head).
// The head is 28 wide and 35 tall (crown to chin): about 1/7 of a 230 px figure. Keep that ratio.
// hair: 'quiff' | 'bob' | 'bun';  face: 'angular' | 'soft';  mouth: 'smile' | 'open' | 'flat';  glasses: bool
export function head(c, a = 0, { hair = 'bob', face = null, mouth = 'smile', glasses = false, flip = false, hairCol = NAVY } = {}) {
  face = face ?? (hair === 'quiff' ? 'angular' : 'soft');
  const g = [`<g transform="translate(${f(c[0])} ${f(c[1])}) rotate(${f(a)})${flip ? ' scale(-1 1)' : ''}">`];
  if (hair === 'bob') g.push(P('M-2 -18 C7 -20.4 14 -15 14.6 -6 C15.2 2 14.6 10 13.6 15.6 C14.6 17.4 15.6 18.6 15.2 19.8 C12.6 20.6 8.6 20.2 5.6 18.6 C4.4 12 3 4 -1 -2 Z', hairCol));
  g.push(P(face === 'angular'
    ? 'M-9.6 -10.4 C-10.8 -7.6 -11.2 -4.8 -11.2 -2.4 L-14.4 2 C-14.8 3 -14.1 3.7 -12.8 3.7 L-11.9 3.8 C-12 5 -12 6 -11.8 7 C-11.4 9 -11.8 10.6 -11.2 11.8 C-10.6 13.2 -8.8 13.8 -7 13.6 C-3.4 13.2 0.6 11.8 3.6 9.6 C5.6 8 7.2 5.4 8 2.4 L8.6 -6 L2 -14 Z'
    : 'M-9.5 -10 C-10.6 -7 -11 -4.4 -11 -2 L-14.2 2.6 C-14.6 3.6 -13.9 4.2 -12.6 4.2 L-11.6 4.3 C-11.8 6.4 -11.4 8.4 -10.6 10.2 C-9.6 12.6 -7.4 14 -4.8 14 C-1 14 2.8 11.8 5.6 8.6 L7.6 -6 L2 -14 Z', SKIN));
  if (hair === 'quiff') {
    g.push(P('M-10.8 -8.8 C-13.6 -12 -13.4 -17.8 -8.4 -20.6 C-4.6 -22.8 1 -23 5.6 -20.6 C10.4 -18.2 13 -12.8 12.6 -5.8 C12.4 -1.6 11 2.4 8.8 5.4 L6.8 4.6 C7.4 0.8 6.8 -2.8 4.4 -5.4 C1.4 -8.8 -4.8 -10.4 -10.8 -8.8 Z', hairCol));
    g.push(P('M-12.8 -12.8 C-14.8 -16.2 -12.6 -20 -8.6 -20.2', 'none', hairCol, 2.4));
  } else if (hair === 'bob') {
    g.push(P('M-12.6 -7.8 C-14.4 -15 -8.6 -20.6 -0.4 -20.6 C6.4 -20.6 12 -16 13 -9.2 L4.6 -8.4 C1 -8.4 -2.6 -9.2 -5.6 -9.4 C-8 -9.4 -10.6 -8.8 -12.6 -7.8 Z', hairCol));
    g.push(P('M3.6 -8 C7.2 -4.6 8.6 2.6 7.6 12 L14 12 C14.8 3 14.2 -4 13 -9.6 Z', hairCol));
    g.push(fold([[1.6, -16.8], [6.6, -15.2], [10, -11.4]], WHITE, 1.1));
  } else if (hair === 'bun') {
    g.push(P('M-10.6 -9.4 C-11.8 -15.9 -6.2 -19.4 0.3 -19.4 C7.3 -19.4 12.3 -13.9 11.8 -6.4 C11.5 -0.9 9.8 3.6 7.3 6.8 L5.4 6.6 C6 1.6 5.1 -2.9 2.4 -5.8 C-0.8 -8.6 -6.2 -9.4 -10.6 -9.4 Z', hairCol));
    g.push(`<circle cx="12.8" cy="-16.9" r="6" fill="${hairCol}"/>`);
  }
  if (hair !== 'bob') {   // ear (the bob covers it)
    g.push(`<ellipse cx="5.4" cy="1.8" rx="2.5" ry="3.5" fill="${SKIN}"/>`);
    g.push(P('M5 0.2 C6.4 0.8 6.6 2.8 5.2 3.4', 'none', NAVY, 0.8));
  }
  const ex = face === 'angular' ? -6.6 : -6.4, ey = face === 'angular' ? -1.4 : -0.6;
  g.push(`<circle cx="${ex}" cy="${ey}" r="${face === 'angular' ? 1.35 : 1.4}" fill="${NAVY}"/>`);
  g.push(P(face === 'angular' ? 'M-9.8 -6.6 Q-7.4 -9 -4.2 -8' : 'M-9.4 -5 Q-7.4 -6.9 -4.6 -6.2', 'none', NAVY, 1.1));
  if (mouth === 'smile') g.push(P('M-11.4 7.4 Q-9.6 8.8 -7.8 7.8', 'none', NAVY, 1.05));
  else if (mouth === 'open') g.push(P('M-12.1 6.4 C-12 5.2 -10.5 4.9 -9.8 5.9 C-9.3 6.9 -9.8 8.5 -10.9 8.7 C-11.8 8.7 -12.3 7.6 -12.1 6.4 Z', NAVY));
  else g.push(P('M-11.3 8.3 l2.8 0.4', 'none', NAVY, 1.1));
  if (glasses) {
    g.push(`<circle cx="${ex + 0.5}" cy="${ey - 0.2}" r="3.6" fill="none" stroke="${NAVY}" stroke-width="1"/>`);
    g.push(`<path d="M${f(ex + 4.1)} ${f(ey - 0.5)} L${f(ex + 13.7)} ${f(ey - 1.2)}" stroke="${NAVY}" stroke-width="1"/>`);
  }
  g.push('</g>');
  return g.join('\n');
}
// slim neck from two collar points up under the jaw, plus the navy collar line. Draw it BEFORE the head.
export function neck(collarL, collarR, c, a = 0, { flip = false } = {}) {
  const m = flip ? -1 : 1;
  const t0 = rotPt([-1.2 * m, 10.5], c, a), t1 = rotPt([5.5 * m, 7.5], c, a);
  // the collar arc runs along the collar (not world x), dipping 1.4 toward the chest: works leaning and flipped
  const d = sub(collarR, collarL), mid = lerp(collarL, collarR, 0.5);
  let n = perp(norm(d)); if ((n[0] * (mid[0] - c[0]) + n[1] * (mid[1] - c[1])) < 0) n = mul(n, -1);   // n points away from the head
  return [P(poly([collarL, collarR, t1, t0]), SKIN),
    contour([add(sub(collarL, mul(d, 0.26)), mul(n, -2)), add(mid, mul(n, 1.4)), add(add(collarR, mul(d, 0.26)), mul(n, -2))], 1.2)].join('\n');
}

// ---------------------------------------------------------------- decor (confetti), 1.4 strokes, round caps
// kinds: tri (filled), triO (outline), ring (outline circle), dot (filled), sq (filled), sqO (outline), squig (wave)
export function decor(items) {
  const o = ['<g fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'];
  for (const it of items) {
    const [kind, x, y, col] = it, sz = it[4];
    if (kind === 'tri') o.push(`<path d="M${f(x)} ${f(y)} l7 -12 l7 12 z" fill="${col}" stroke="none"/>`);
    else if (kind === 'triO') o.push(`<path d="M${f(x)} ${f(y)} l6 -10 l6 10 z" stroke="${col}"/>`);
    else if (kind === 'ring') o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${sz ?? 5}" stroke="${col}"/>`);
    else if (kind === 'dot') o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${sz ?? 3.6}" fill="${col}" stroke="none"/>`);
    else if (kind === 'sq') o.push(`<rect x="${f(x)}" y="${f(y)}" width="${sz ?? 8}" height="${sz ?? 8}" fill="${col}" stroke="none"/>`);
    else if (kind === 'sqO') o.push(`<rect x="${f(x)}" y="${f(y)}" width="${sz ?? 12}" height="${sz ?? 12}" stroke="${col}"/>`);
    else if (kind === 'squig') o.push(`<path d="M${f(x)} ${f(y)} q3 -4 6 0 t6 0 t6 0 t6 0" stroke="${col}"/>`);
  }
  o.push('</g>');
  return o.join('\n');
}
// paired motion arcs ")) " beside a moving part: navy 1.3. dir 1 bows right, -1 bows left.
export function motion(p, { dir = 1, s = 1 } = {}) {
  const k = dir * s;
  return `<g stroke="${NAVY}" stroke-width="1.3" stroke-linecap="round" fill="none"><path d="M${f(p[0])} ${f(p[1])} c${f(5 * k)} ${f(8 * s)} ${f(5 * k)} ${f(18 * s)} ${f(1 * k)} ${f(26 * s)} M${f(p[0] + 7 * k)} ${f(p[1] - 6 * s)} c${f(7 * k)} ${f(12 * s)} ${f(7 * k)} ${f(28 * s)} ${f(1 * k)} ${f(38 * s)}"/></g>`;
}
// short navy burst ticks radiating from c (surprise, a snap, an alert): one tick per angle
export function ticks(c, angles, r0 = 24, r1 = 32, sw = 1.3) {
  return `<g stroke="${NAVY}" stroke-width="${sw}" stroke-linecap="round" fill="none">` +
    angles.map(a => { const p0 = fwd(c, a, r0), p1 = fwd(c, a, r1); return `<path d="M${f(p0[0])} ${f(p0[1])} L${f(p1[0])} ${f(p1[1])}"/>`; }).join('') + '</g>';
}
// browser window prop: white body, navy 1.2 outline, coloured title bar with three dots. Returns an open <g>;
// push your content in window-local coords (origin top-left), then push '</g>'.
export function windowOpen(c, a, w, h, { bar = PAL.lav, s = 1, sw = 1.2 } = {}) {
  return [`<g transform="translate(${f(c[0])} ${f(c[1])}) rotate(${f(a)}) scale(${f(s)}) translate(${f(-w / 2)} ${f(-h / 2)})">`,
    `<rect x="0" y="0" width="${f(w)}" height="${f(h)}" rx="5" fill="${WHITE}" stroke="${NAVY}" stroke-width="${sw}"/>`,
    `<path d="M5 0 H${f(w - 5)} A5 5 0 0 1 ${f(w)} 5 V14 H0 V5 A5 5 0 0 1 5 0 Z" fill="${bar}" stroke="${NAVY}" stroke-width="${sw}" stroke-linejoin="round"/>`,
    `<circle cx="9" cy="7" r="2.2" fill="${PAL.pink}"/>`, `<circle cx="16" cy="7" r="2.2" fill="${PAL.yel}"/>`, `<circle cx="23" cy="7" r="2.2" fill="${WHITE}"/>`].join('\n');
}

// ---------------------------------------------------------------- card wrapper
// fit = [cx, cy, scale]: scale the whole drawing about its centre to set the margins (examples use 0.93 to 0.94).
// move = [dx, dy]: shift the whole drawing to balance the margins (applied after fit).
export function card(body, { label = 'Card, Flat style', fit = null, move = null } = {}) {
  const inner = Array.isArray(body) ? body.join('\n') : body;
  let g = fit ? `<g transform="translate(${f(fit[0])} ${f(fit[1])}) scale(${fit[2]}) translate(${f(-fit[0])} ${f(-fit[1])})">\n${inner}\n</g>` : inner;
  if (move) g = `<g transform="translate(${f(move[0])} ${f(move[1])})">\n${g}\n</g>`;
  return `<svg role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">\n${g}\n</svg>\n`;
}

// ---------------------------------------------------------------- demo: node flat-kit.mjs --demo out.svg
if (process.argv[1] && process.argv[1].endsWith('flat-kit.mjs') && process.argv[2] === '--demo') {
  const out = process.argv[3] || 'flat-kit-demo.svg';
  const B = [];
  const label = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="9" fill="${NAVY}">${t}</text>`;
  B.push(decor([['tri', 24, 40, PAL.mint], ['triO', 50, 38, PAL.lav], ['ring', 82, 32, PAL.pink], ['dot', 104, 32, PAL.yel], ['sq', 118, 28, PAL.lav], ['sqO', 140, 26, PAL.mint], ['squig', 166, 32, PAL.pink]]));
  B.push(label(100, 54, 'decor()'));
  B.push(head([240, 38], 0, { hair: 'quiff', mouth: 'open' }), head([290, 38], 0, { hair: 'bob' }), head([340, 38], 0, { hair: 'bun', glasses: true, mouth: 'flat' }));
  B.push(label(290, 70, 'head(): quiff / bob / bun'));
  B.push(openHand([60, 150], -90, { hand: 'R', side: 'back' }), openHand([100, 150], -90, { hand: 'R', side: 'palm' }),
    openHand([140, 150], -90, { hand: 'L', side: 'back' }), openHand([180, 150], -90, { hand: 'L', side: 'palm' }));
  B.push(label(120, 168, 'openHand() R-back R-palm L-back L-palm'));
  const fz = fist([270, 130], 0);
  B.push(fz.back, P('M240 127 H300', 'none', PAL.yel, 7), fz.front, label(270, 168, 'fist(): back, bar, front'));
  B.push(arm([330, 110], [352, 138], [380, 120], { sleeve: 'short', top: PAL.mint }), openHand([380, 120], ang([352, 138], [380, 120]), { hand: 'R', side: 'back' }));
  B.push(arm([400, 100], [420, 135], [452, 128], { sleeve: 'cuffed', top: PAL.yel }), openHand([452, 128], ang([420, 135], [452, 128]), { hand: 'R', side: 'back' }));
  B.push(label(395, 168, 'arm(): short / cuffed'));
  B.push(leg({ hip: [90, 210], knee: [92, 255], heel: [110, 320], trouser: PAL.ind }));
  B.push(leg({ hip: [170, 210], knee: [182, 252], heel: [215, 316], a: -26, trouser: PAL.pink, sock: PAL.lav }));
  B.push(label(150, 340, 'leg(): planted / tiptoe'));
  B.push(P(tube([[260, 220, 30], [300, 250, 22], [350, 300, 18]]), PAL.lav), fold([[275, 232], [300, 246], [320, 262]]));
  B.push(contour([[280, 260], [300, 275], [318, 290]]), label(305, 340, 'tube() + fold() + contour()'));
  B.push(motion([420, 220]), ticks([440, 300], [-150, -120, -60, -30]));
  fs.writeFileSync(out, card(B, { label: 'flat-kit parts' }));
  console.log('wrote', out);
}
