// Line-interior card toolkit: the repeated parts of the style, with the exact numbers of the three example cards.
// No dependencies, no randomness (every part is placed by you, so a re-run gives the same card).
//
// Use it from a generator script (Node, ESM):
//   import * as LI from '/abs/path/to/illustration-line-interior/scripts/interior.mjs';
//   const { O, BG, W, C, FL } = LI;
//   const bg = LI.bgLayer('ob-', `<g id="ob-bricks-a">${LI.bricks(40, 150, [[0,0],[15,0],[7,7]])}</g>`);
//   const fg = LI.fgLayer('ob-', LI.floor('ob-') + ...);
//   fs.writeFileSync('card.svg', LI.svgWrap(bg + fg, 'Onboarding, Line interior style'));
//
// Parts sheet / self-test:  node scripts/interior.mjs --demo out.svg   (then render out.svg)
//
// Conventions
// - Everything in the foreground layer inherits stroke #3a2d66, width 1.4, round caps and joins. Give every filled
//   shape an explicit fill (usually W); give detail lines fill="none" stroke-width="1".
// - Hands are local shapes: wrist at 0,0, fingers along +x, THUMB ON THE -y SIDE (or hidden on that side).
//   place(..., flip = true) moves the thumb to +y. Decide the side with references/craft.md, then flip if needed.

export const O = '#3a2d66', BG = '#cfc9e0', W = '#ffffff';
export const C = {
  orange: '#f6a85e', peach: '#f9c99a', teal: '#3fa58a', sage: '#8cc79b', leaf: '#5fae7a', coral: '#ef5b5b',
  lav: '#ab9ee6', purple: '#7f6cc4', mustard: '#f5c35a', brown: '#7b4b3a', denim: '#7f9fdc',
};
export const SKIN = { light: '#f3cdb0', medium: '#e2a57c', deep: '#b47852', dark: '#7a4b33' };
export const FL = 308;                       // floor line y
export const f = n => +(+n).toFixed(2);
export const P = p => `${f(p[0])} ${f(p[1])}`;
const add = (...v) => v.reduce((a, b) => [a[0] + b[0], a[1] + b[1]]);
const sc = (v, s) => [v[0] * s, v[1] * s];

// ---------------------------------------------------------------- card skeleton
export const svgWrap = (body, label = '') => `<svg${label ? ` role="img" aria-label="${label}"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">\n${body}\n</svg>\n`;
// background decor: grey-lavender 1 px line, no fills
export const bgLayer = (id, inner) => `<g id="${id}bg" fill="none" stroke="${BG}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">\n${inner}\n</g>\n`;
// everything else: indigo 1.4 px outline
export const fgLayer = (id, inner) => `<g id="${id}fg" stroke="${O}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">\n${inner}\n</g>`;
// the long floor line with a short dash at each end (6 px gaps)
export const floor = (id, y = FL, x0 = 56, x1 = 424) => `<path id="${id}floor" d="M${x0} ${y}H${x1}M${x0 - 16} ${y}h10M${x1 + 6} ${y}h10" fill="none"/>`;

// ---------------------------------------------------------------- background vocabulary (put inside bgLayer)
// brick cluster: rows = [[dx, dy, width?]], bricks 14 x 6, rows 7 apart, alternate rows offset 7
export const bricks = (x, y, rows) => rows.map(([dx, dy, w]) => `<rect x="${x + dx}" y="${y + dy}" width="${w || 14}" height="6" rx="0.6"/>`).join('');
// pendant lamps hanging from the top edge (cord from y 0)
export const lampDome = (x, y) => `<path d="M${x} 0V${y}"/><path d="M${x - 12} ${y + 12}C${x - 12} ${y + 4.5} ${x - 6.5} ${y} ${x} ${y}S${x + 12} ${y + 4.5} ${x + 12} ${y + 12}Z"/><path d="M${x - 3} ${y + 12.5}a3 3 0 0 0 6 0"/><path d="M${x} ${y + 19}v5M${x - 8} ${y + 17.5}l-2.5 4M${x + 8} ${y + 17.5}l2.5 4"/>`;
export const lampCone = (x, y) => `<path d="M${x} 0V${y}"/><path d="M${x - 4} ${y}h8l6 12h-20Z"/><path d="M${x - 3} ${y + 12.5}a3 3 0 0 0 6 0"/><path d="M${x} ${y + 19}v5M${x - 8} ${y + 17.5}l-2.5 4M${x + 8} ${y + 17.5}l2.5 4"/>`;
// framed poster on a nail: outer frame w x h, inner mat inset 4-5, `content` is drawn in poster coords (0,0 = top-left)
export const poster = (x, y, w, h, content = '') => `<path d="M${x + w / 2} ${y - 10}L${x + w / 2 - 16} ${y}M${x + w / 2} ${y - 10}L${x + w / 2 + 16} ${y}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}"/><g transform="translate(${x} ${y})">${content}</g>`;
// outline cloud (outdoor cards); s = scale, base line at y
export const cloud = (x, y, s = 1) => `<path d="M${x} ${y}h${f(56 * s)}c${f(6 * s)} 0 ${f(8 * s)} ${f(-8 * s)} ${f(2 * s)} ${f(-10 * s)}c${f(-1 * s)} ${f(-9 * s)} ${f(-12 * s)} ${f(-12 * s)} ${f(-17 * s)} ${f(-6 * s)}c${f(-3 * s)} ${f(-11 * s)} ${f(-20 * s)} ${f(-12 * s)} ${f(-24 * s)} ${f(-1 * s)}c${f(-6 * s)} ${f(-3 * s)} ${f(-13 * s)} ${f(1 * s)} ${f(-12 * s)} ${f(7 * s)}c${f(-6 * s)} ${f(1 * s)} ${f(-7 * s)} ${f(10 * s)} ${f(-5 * s)} ${f(10 * s)}Z"/>`;
export const bird = (x, y, s = 1) => `<path d="M${x} ${y}q${f(4 * s)} ${f(-4.4 * s)} ${f(8 * s)} 0q${f(4 * s)} ${f(-4.4 * s)} ${f(8 * s)} 0"/>`;

// ---------------------------------------------------------------- foreground vocabulary
// tiny "x" texture mark (pots, boxes, never clothing), stroke-width 1
export const xm = (x, y, s = 1.5) => `M${f(x - s)} ${f(y - s)}l${2 * s} ${2 * s}M${f(x + s)} ${f(y - s)}l${-2 * s} ${2 * s}`;
// smooth tube (straight limb, forearm behind the body, stem) through centre points with half-widths; round caps
export function cr(Pts) {
  let d = '';
  for (let i = 0; i < Pts.length - 1; i++) {
    const p0 = Pts[Math.max(0, i - 1)], p1 = Pts[i], p2 = Pts[i + 1], p3 = Pts[Math.min(Pts.length - 1, i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
export const smooth = (pts, close = false) => { const Q = close ? [...pts, pts[0]] : pts; return `M${P(Q[0])}` + cr(Q) + (close ? 'Z' : ''); };
export function limb(pts, ws, capStart = true, capEnd = true) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
    L.push([pts[i][0] - ty * ws[i], pts[i][1] + tx * ws[i]]);
    R.push([pts[i][0] + ty * ws[i], pts[i][1] - tx * ws[i]]);
  }
  const Rr = R.slice().reverse();
  return `M${P(L[0])}` + cr(L) + (capEnd ? `A${f(ws[n - 1])} ${f(ws[n - 1])} 0 0 0 ${P(R[n - 1])}` : `L${P(R[n - 1])}`) + cr(Rr) +
    (capStart ? `A${f(ws[0])} ${f(ws[0])} 0 0 0 ${P(L[0])}` : '') + 'Z';
}
// two-bone IK: elbow (or knee) position from shoulder S, wrist Wp and bone lengths. flip picks the other bend
export function solveElbow(S, Wp, l1, l2, flip = false) {
  const dx = Wp[0] - S[0], dy = Wp[1] - S[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)), base = Math.atan2(dy, dx), t = flip ? base + a : base - a;
  return [S[0] + l1 * Math.cos(t), S[1] + l1 * Math.sin(t)];
}
// bent arm outline: pointed outer elbow, creased inner side, slight forearm swell. Half-widths: shoulder wa,
// elbow we, wrist ww (examples: 4.6-5, 4.2-4.4, 3.2-3.4). Returns { d, I (inner crease point), u, v, wO, wI }.
// Draw the crease: `M${P(arm.I)}l${f(-arm.u[0]*3)} ${f(-arm.u[1]*3)}` with stroke-width 1.
export function bentArm(A, E, Wp, wa, we, ww) {
  const nrm = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const u = nrm(A, E), v = nrm(E, Wp), nu = [-u[1], u[0]], nv = [-v[1], v[0]];
  const sIn = Math.sign(nu[0] * v[0] + nu[1] * v[1]) || 1, sOut = -sIn;
  const off = (p, n, s, w) => [p[0] + n[0] * s * w, p[1] + n[1] * s * w];
  const inter = (p1, d1, p2, d2) => { const den = d1[0] * d2[1] - d1[1] * d2[0]; const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den; return [p1[0] + d1[0] * t, p1[1] + d1[1] * t]; };
  const aO = off(A, nu, sOut, wa), eO1 = off(E, nu, sOut, we), eO2 = off(E, nv, sOut, we * 0.95), wO = off(Wp, nv, sOut, ww);
  const aI = off(A, nu, sIn, wa), wI = off(Wp, nv, sIn, ww);
  const I = inter(aI, u, wI, v);
  const bis = nrm([0, 0], [nu[0] * sOut + nv[0] * sOut, nu[1] * sOut + nv[1] * sOut]);
  const tip = [E[0] + bis[0] * we * 1.35, E[1] + bis[1] * we * 1.35];
  const mid = [(eO2[0] + wO[0]) / 2 + nv[0] * sOut * 0.6, (eO2[1] + wO[1]) / 2 + nv[1] * sOut * 0.6];
  const end = k => [Wp[0] + v[0] * ww * 0.9 + (k[0] - Wp[0]) * 0.5, Wp[1] + v[1] * ww * 0.9 + (k[1] - Wp[1]) * 0.5];
  return { wO, wI, aO, aI, I, tip, u, v, sOut,
    d: `M${P(aO)}L${P(eO1)}Q${P(tip)} ${P(eO2)}Q${P(mid)} ${P(wO)}L${P(end(wO))}L${P(end(wI))}L${P(wI)}L${P(I)}L${P(aI)}Z` };
}
// sleeve over the top of a bent arm: from shoulder S along the upper arm u, `len` long, half-width hw
export function sleeve(S, u, len = 15, hw = 6.6) {
  const n = [-u[1], u[0]], sp = (a, b) => add(S, sc(u, a), sc(n, b));
  return `M${P(sp(-7, -3))}C${P(sp(-7, -8))} ${P(sp(0, -8))} ${P(sp(2, -hw - 0.4))}L${P(sp(len, -hw))}Q${P(sp(len + 1.4, 0))} ${P(sp(len, hw))}L${P(sp(1, hw + 0.4))}C${P(sp(-3, hw + 0.4))} ${P(sp(-7, 3))} ${P(sp(-7, -3))}Z`;
}
// straight-ish trouser leg (standing): centre points hip -> hem, half-widths, ankle point (shoe opening).
// Returns { skin, leg }: draw skin (ankle) first, then the sneaker, then leg (leg + rolled cuff band 5.2 long).
export function trouserLeg(pts, ws, ankle, fill, skin, id = '') {
  const n = pts.length, H = pts[n - 1], A = pts[n - 2];
  const dl = Math.hypot(H[0] - A[0], H[1] - A[1]), d = [(H[0] - A[0]) / dl, (H[1] - A[1]) / dl], nn = [-d[1], d[0]];
  const w = ws[n - 1], q = (p, a, b) => [p[0] + d[0] * a + nn[0] * b, p[1] + d[1] * a + nn[1] * b];
  const ad = [ankle[0] - H[0], ankle[1] - H[1]], al = Math.hypot(...ad), au = [ad[0] / al, ad[1] / al], an = [-au[1], au[0]];
  const sk = (p, a, b) => [p[0] + au[0] * a + an[0] * b, p[1] + au[1] * a + an[1] * b];
  const sw = Math.min(w - 0.8, 4.2);
  return {
    skin: `<path d="M${P(sk(H, -2, -sw))}L${P(sk(ankle, 2, -sw))}L${P(sk(ankle, 2, sw))}L${P(sk(H, -2, sw))}Z" fill="${skin}"/>`,
    leg: `<path${id ? ` id="${id}"` : ''} d="${limb(pts, ws, true, false)}" fill="${fill}"/>` +
      `<path d="M${P(q(H, -5.2, -w - 0.7))}L${P(q(H, 0, -w - 0.9))}L${P(q(H, 0, w + 0.9))}L${P(q(H, -5.2, w + 0.7))}Z" fill="${fill}"/>`,
  };
}
// bent leg (sitting, kneeling, stepping): hip H, knee K, hem A, half-widths. Rounded knee, crease behind it, calf swell
export function bentLeg(H, K, A, wh, wk, wa, bulge = 1.6, calf = 1.2) {
  const nrm = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const u = nrm(H, K), v = nrm(K, A), cross = u[0] * v[1] - u[1] * v[0], s = cross > 0 ? 1 : -1;
  const nOu = [u[1] * s, -u[0] * s], nOv = [v[1] * s, -v[0] * s];
  const o = (p, n, w) => [p[0] + n[0] * w, p[1] + n[1] * w];
  const hO = o(H, nOu, wh), kO1 = o(K, nOu, wk), kO2 = o(K, nOv, wk), aO = o(A, nOv, wa);
  const hI = o(H, nOu, -wh), aI = o(A, nOv, -wa);
  const inter = (p1, d1, p2, d2) => { const den = d1[0] * d2[1] - d1[1] * d2[0]; const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den; return [p1[0] + d1[0] * t, p1[1] + d1[1] * t]; };
  const I = inter(hI, u, aI, v);
  const midT = o([(H[0] + K[0]) / 2, (H[1] + K[1]) / 2], nOu, (wh + wk) / 2 + bulge);
  const midC = o([(K[0] + A[0]) / 2 - v[0] * 4, (K[1] + A[1]) / 2 - v[1] * 4], nOv, -((wk + wa) / 2 + calf));
  const sw = s > 0 ? 1 : 0, ad = (p, w, k) => [p[0] + w[0] * k, p[1] + w[1] * k];
  return { I, u, v, aO, aI,
    d: `M${P(hI)}A${f(wh)} ${f(wh)} 0 0 ${sw} ${P(hO)}Q${P(midT)} ${P(kO1)}A${f(wk)} ${f(wk)} 0 0 ${sw} ${P(kO2)}L${P(aO)}L${P(aI)}Q${P(midC)} ${P(ad(I, v, 2.6))}Q${P(I)} ${P(ad(I, u, -2.6))}L${P(hI)}Z` };
}
// rolled cuff + ankle skin under a flat hem at A, along leg direction v, half-width w, ankle point
export function cuffAndAnkle(A, v, w, ankle, fill, skin) {
  const n = [-v[1], v[0]], q = (a, b) => [A[0] + v[0] * a + n[0] * b, A[1] + v[1] * a + n[1] * b];
  const ad = [ankle[0] - A[0], ankle[1] - A[1]], al = Math.hypot(...ad), au = [ad[0] / al, ad[1] / al], an = [-au[1], au[0]];
  const sk = (p, a, b) => [p[0] + au[0] * a + an[0] * b, p[1] + au[1] * a + an[1] * b], sw = Math.min(w - 0.8, 4.2);
  return { skin: `<path d="M${P(sk(A, -2, -sw))}L${P(sk(ankle, 2, -sw))}L${P(sk(ankle, 2, sw))}L${P(sk(A, -2, sw))}Z" fill="${skin}"/>`,
    cuff: `<path d="M${P(q(-5.2, -w - 0.7))}L${P(q(0, -w - 0.9))}L${P(q(0, w + 0.9))}L${P(q(-5.2, w + 0.7))}Z" fill="${fill}"/>` };
}

// sneaker, 25 long x 10.6 tall, heel at 0,0 on the floor, toe toward +x. Mirror with transform scale(-1 1).
// Upper in a colour (or white), 3 px sole band in white (or a colour), two lace ticks.
export const SHOE_D = 'M0 0V-7.5C0 -9.6 1.8 -10.6 4.6 -10.6H9C12 -10.2 14 -8.6 16.4 -7.4C19.6 -6 23.4 -5.4 25 -3.2C25.6 -2 25.6 -0.8 25 0Z';
export const sneaker = (tf, col, sole = W, id = '') => `<g${id ? ` id="${id}"` : ''} transform="${tf}"><path d="${SHOE_D}" fill="${col}"/><path d="M0 -3V0H25C25.5 -1 25.6 -2 25.4 -3Z" fill="${sole}"/><path d="M13.6 -8.6l-1.6 2.4M17 -7.2l-1.6 2.4" fill="none" stroke-width="1"/></g>`;
// where the ankle enters a sneaker placed with translate(heel) rotate(rot) [scale(-1 1) when mirror]
export const shoeOpening = (heel, rot = 0, mirror = false) => { const r = rot * Math.PI / 180, ox = mirror ? -6.6 : 6.6, oy = -9.6;
  return [heel[0] + ox * Math.cos(r) - oy * Math.sin(r), heel[1] + ox * Math.sin(r) + oy * Math.cos(r)]; };
// rear foot on its toes: the heel point for a sneaker rotated `deg` (20-28) whose toe stays on the floor at toeX.
// Mirrored (toe toward -x): pass mirror = true and use rotate(-deg) scale(-1 1) in the transform.
export const liftedHeel = (toeX, deg = 24, mirror = false, y = FL) => { const r = deg * Math.PI / 180; return [toeX + (mirror ? 25 : -25) * Math.cos(r), y - 25 * Math.sin(r)]; };
// rotate a point about a pivot (screen degrees, + = clockwise): lean an upper body, then solve arms from the result
export const rotAbout = (p, deg, c) => { const a = deg * Math.PI / 180, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };

// ---------------------------------------------------------------- plants
// lance leaf with a midrib and two pairs of side veins (base bx,by -> tip tx,ty, half-width w, bend)
export function leaf(bx, by, tx, ty, w, bend, fill, id = '') {
  const dx = tx - bx, dy = ty - by, Ln = Math.hypot(dx, dy), nx = -dy / Ln, ny = dx / Ln;
  const p = (t, s) => { const o = s + bend * Math.sin(Math.PI * t); return `${f(bx + dx * t + nx * o)} ${f(by + dy * t + ny * o)}`; };
  const d = `M${p(0, 0)}C${p(0.1, w * 0.9)} ${p(0.4, w * 1.05)} ${p(0.62, w * 0.85)}C${p(0.8, w * 0.6)} ${p(0.95, w * 0.2)} ${p(1, 0)}` +
    `C${p(0.95, -w * 0.2)} ${p(0.8, -w * 0.6)} ${p(0.62, -w * 0.85)}C${p(0.4, -w * 1.05)} ${p(0.1, -w * 0.9)} ${p(0, 0)}Z`;
  let veins = '';
  for (const t of [0.32, 0.56]) veins += `M${p(t, 0)}L${p(t + 0.1, w * 0.55)}M${p(t + 0.06, 0)}L${p(t + 0.16, -w * 0.55)}`;
  return `<path${id ? ` id="${id}"` : ''} d="${d}" fill="${fill}"/><path d="M${p(0.04, 0)}Q${p(0.5, 0)} ${p(0.9, 0)}${veins}" fill="none" stroke-width="1"/>`;
}
// fiddle-leaf fig leaf: widest near the tip
export function figLeaf(bx, by, tx, ty, w, fill, id = '') {
  const dx = tx - bx, dy = ty - by, Ln = Math.hypot(dx, dy), nx = -dy / Ln, ny = dx / Ln;
  const p = (t, s) => `${f(bx + dx * t + nx * s)} ${f(by + dy * t + ny * s)}`;
  const d = `M${p(0, 0)}C${p(0.15, w * 0.55)} ${p(0.45, w * 0.9)} ${p(0.72, w * 1.0)}C${p(0.92, w * 0.95)} ${p(1.02, w * 0.35)} ${p(1, 0)}` +
    `C${p(1.02, -w * 0.35)} ${p(0.92, -w * 0.95)} ${p(0.72, -w * 1.0)}C${p(0.45, -w * 0.9)} ${p(0.15, -w * 0.55)} ${p(0, 0)}Z`;
  return `<path${id ? ` id="${id}"` : ''} d="${d}" fill="${fill}"/><path d="M${p(0.04, 0)}L${p(0.86, 0)}M${p(0.4, 0)}L${p(0.56, w * 0.6)}M${p(0.62, 0)}L${p(0.76, -w * 0.6)}" fill="none" stroke-width="1"/>`;
}
// snake-plant blade: base centre bx, base y, height h, lean (x offset of the tip), half-width w
export const blade = (bx, by, h, lean, w, fill) => `<path d="M${f(bx - w)} ${by}C${f(bx - w - 2)} ${f(by - h * 0.45)} ${f(bx + lean - 2)} ${f(by - h * 0.8)} ${f(bx + lean)} ${f(by - h)}C${f(bx + lean + 1.6)} ${f(by - h * 0.7)} ${f(bx + w + 1.4)} ${f(by - h * 0.4)} ${f(bx + w)} ${by}Z" fill="${fill}"/>`;
// tapered pot standing on the floor: top centre cx, top y, top width tw, bottom width bw. rim = white rim band
export const pot = (cx, top, tw, bw, fill = W, { rim = true, marks = true, bands = 0, y = FL } = {}) => {
  let s = `<path d="M${f(cx - tw / 2)} ${top}H${f(cx + tw / 2)}L${f(cx + bw / 2)} ${y}H${f(cx - bw / 2)}Z" fill="${fill}"/>`;
  if (rim) s += `<rect x="${f(cx - tw / 2 - 2.5)}" y="${f(top - 6.5)}" width="${f(tw + 5)}" height="6.5" rx="1.5" fill="${W}"/>`;
  if (marks) s += `<path d="${xm(cx - 5, top + 12)}${xm(cx + 4, top + 21)}" fill="none" stroke-width="1"/>`;
  for (let i = 1; i <= bands; i++) { const yy = top + (y - top) * i / (bands + 1), k = (yy - top) / (y - top), hw = tw / 2 + (bw - tw) / 2 * k; s += `<path d="M${f(cx - hw + 1.2)} ${f(yy)}H${f(cx + hw - 1.2)}" fill="none" stroke-width="1"/>`; }
  return s;
};

// ---------------------------------------------------------------- path mirroring
// mirror absolute or relative path data across x = 0 (axis 'x') or y = 0 (axis 'y'); flips arc sweep flags
export function mirrorPath(d, axis = 'x') {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g); let out = '', i = 0, cmd = '';
  const num = () => parseFloat(toks[i++]), nx = v => axis === 'x' ? -v : v, ny = v => axis === 'y' ? -v : v;
  const take = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) { cmd = toks[i++]; out += cmd; if (cmd.toUpperCase() === 'Z') continue; }
    const U = cmd.toUpperCase(), n = take[U]; const a = []; for (let k = 0; k < n; k++) a.push(num());
    let r;
    if (U === 'H') r = [nx(a[0])]; else if (U === 'V') r = [ny(a[0])];
    else if (U === 'A') r = [a[0], a[1], -a[2], a[3], 1 - a[4], nx(a[5]), ny(a[6])];
    else r = a.map((v, k) => k % 2 ? ny(v) : nx(v));
    out += r.map(v => f(v)).join(' ') + ' ';
  }
  return out.trim().replace(/ ([a-zA-Z])/g, '$1');
}

// ---------------------------------------------------------------- hands (thumb side = local -y)
// Each is { d: palm+fingers outline, lines: finger separations (drawn 0.9), thumb, thumbOver: draw thumb last }.
// The outline is drawn twice: filled with stroke="none", then as an OPEN path, so no line closes across the wrist
// (a closed stroke there reads as a dark wedge where the forearm meets the hand).
export const HANDS = {
  // palm down on a keyboard, back visible, four finger bands with rounded tips; little finger (+y) shortest
  type: { d: 'M0 3.5C2.8 3.9 5.2 4.6 7 5L13.9 5A1.25 1.25 0 0 0 13.9 2.5L15.9 2.5A1.25 1.25 0 0 0 15.9 0L16.8 0A1.25 1.25 0 0 0 16.8 -2.5L15.3 -2.5A1.25 1.25 0 0 0 15.3 -5L7 -5C5.2 -4.6 2.8 -3.9 0 -3.5Z',
    lines: 'M13.9 2.5H8M15.9 0H7.8M15.3 -2.5H8', thumb: 'M2.6 -3.4C4.6 -5.6 6.8 -7.4 9 -8.4C10.4 -9 11.2 -7.7 10.2 -6.9C8.6 -5.8 7.4 -5 6.4 -4.6Z', thumbOver: false, tip: [17.6, -1.2] },
  // fingers wrapped across the near face of a cup or mug (back of the hand visible), thumb hooked over the rim
  cup: { d: 'M0 -4C2.6 -4.6 5.6 -4.8 8.6 -4.8H14.6C15.8 -4.8 16.4 -3.6 15.6 -2.8C16.6 -2.6 16.8 -1 15.8 -0.6C16.8 -0.3 16.8 1.3 15.8 1.6C16.6 2 16.4 3.4 15.2 3.6H8.4C5.2 3.6 2.4 3.6 0 3.8Z',
    lines: 'M15.6 -2.8H7.6M15.8 -0.6H7.4M15.8 1.6H7.8', thumb: 'M6.4 -4.4C8.4 -6 10.8 -7.4 13 -8C14.2 -8.3 14.7 -7 13.8 -6.4C12 -5.2 10.4 -4.6 9.4 -4.2Z', thumbOver: true },
  // the same wrap with the thumb hidden round the far side of the object; index (-y) to little finger (+y, shortest)
  wrap: { d: mirrorPath('M0 -4.2C2.4 -4.7 4.8 -4.9 7 -4.8H12.6C13.9 -4.8 14.5 -3.6 13.6 -2.8C15 -3 16.3 -2 15.6 -0.7C16.8 -0.5 17.1 1 16 1.4C16.9 1.8 16.7 3.3 15.4 3.4H8.6C5.8 3.4 2.8 3.3 0 3.2Z', 'y'),
    lines: mirrorPath('M13.6 -2.8H7.1M15.6 -0.7H7.4M16 1.4H7.8', 'y'), thumb: '', thumbOver: false },
  // fist round a pen or marker, back of the hand to the viewer, knuckle bumps, thumb along the pen on -y.
  // The pen leaves the fist at about (13, -3) heading +x: draw it first with HANDS.marker.pen.
  marker: { d: 'M0 -3.6C3 -4.6 6.4 -5 9.4 -4.6C11.6 -4.2 13.4 -3.4 14.2 -2C15 -0.6 14.6 0.8 13.4 1C14.2 1.8 14 3.2 12.8 3.4C13.4 4.2 13 5.4 11.8 5.6C12.2 6.4 11.6 7.4 10.4 7.4C8.6 7.4 6.6 6.4 5 5.2C3.4 4.2 1.8 3.8 0 3.6Z',
    lines: 'M13.4 1C12.2 0.8 11 0.8 10 1.2M12.8 3.4C11.8 3.2 10.8 3.3 9.8 3.6M11.8 5.6C10.8 5.4 9.8 5.5 9 5.8', thumb: 'M5.6 -4.2C8.2 -6 11.2 -6.8 14.4 -6.2C15.6 -6 15.8 -4.6 14.6 -4.2C12.4 -3.6 10.8 -3 9.6 -2.2Z', thumbOver: true,
    pen: (tip = C.coral) => `<path d="M3 -5.1H18.6L23 -3.9V-2.9L18.6 -1.7H3Z" fill="${W}"/><path d="M18.6 -5.1V-1.7" fill="none" stroke-width="1"/><path d="M21.2 -4.4L23 -3.9V-2.9L21.2 -2.4Z" fill="${tip}" stroke="none"/>` },
  // relaxed hand resting on a knee or hanging: fingers curl toward +y, thumb along the top
  rest: { d: 'M0 -3.4C3 -4 6.2 -4.2 9.2 -3.8C11.8 -3.4 13.6 -2 14.4 0.2C15 1.8 15 3.8 14.4 5.6C14 6.8 12.6 6.8 12.4 5.6C12.6 6.8 11.6 7.6 10.6 7.2C10.6 8 9.6 8.6 8.6 8.1C8.4 8.8 7.2 9.2 6.4 8.4C5.6 7.4 5.4 5.6 4.8 4.4C3.6 3.8 2 3.6 0 3.4Z',
    lines: 'M12.4 5.6C12.4 4.6 12.2 3.6 11.8 2.8M10.6 7.2C10.6 6 10.4 4.8 10 4M8.6 8.1C8.6 6.8 8.2 5.6 7.6 4.6', thumb: 'M7.4 -3.6C9.6 -3.8 12 -3.2 13.6 -1.8C14.4 -1.1 13.8 0 12.8 -0.4C11.2 -1 9.6 -1.2 8.2 -1Z', thumbOver: true },
  // pointing / pressing: index straight out along +x on the -y edge, three fingers curled under, thumb tucked over them
  point: { d: 'M0 -3.6C3 -4.4 6 -4.8 9 -4.6L19.6 -4.4C21 -4.3 21 -2.1 19.6 -2L11.2 -1.8C12.6 -1.2 13 0.4 12 1.1C12.8 1.8 12.6 3.4 11.4 3.7C11.9 4.4 11.5 5.8 10.2 5.9C8.2 6 5.6 5.4 3.6 4.4C2.4 3.9 1.2 3.6 0 3.5Z',
    lines: 'M12 1.1C10.8 0.9 9.8 1 8.8 1.3M11.4 3.7C10.4 3.5 9.4 3.6 8.4 3.9', thumb: 'M4.4 -3.4C6.4 -3.2 8.6 -2.4 10.2 -1.2C11 -0.6 10.4 0.6 9.4 0.2C8 -0.4 6.4 -0.8 5 -0.8Z', thumbOver: true, tip: [21, -3.2] },
};
// svg for a hand shape (in local coords); pass the result to place()
export function hand(name, skin, extra = '') {
  const h = HANDS[name], open = h.d.replace(/Z$/, '');
  const th = h.thumb ? `<path d="${h.thumb}" fill="${skin}"/>` : '';
  const body = `<path d="${open}Z" fill="${skin}" stroke="none"/><path d="${open}" fill="none"/><path d="${h.lines}" fill="none" stroke-width="0.9"/>`;
  return extra + (h.thumbOver ? body + th : th + body);
}
// put a local shape (a hand, a prop) at x,y rotated by ang; flip mirrors local y (moves the thumb to +y).
// s = scale (hands 1.05-1.15); stroke widths are divided by s so lines stay 1.4 / 1 / 0.9 on the card.
// where to put a hand's wrist so its fingertip (HANDS[name].tip, or any local point) lands on `target`
export const wristFor = (tipLocal, target, ang = 0, s = 1.1, flip = false) => { const a = ang * Math.PI / 180, x = tipLocal[0] * s, y = (flip ? -tipLocal[1] : tipLocal[1]) * s;
  return [target[0] - (x * Math.cos(a) - y * Math.sin(a)), target[1] - (x * Math.sin(a) + y * Math.cos(a))]; };
export const place = (svg, x, y, ang = 0, flip = false, id = '', s = 1.1) =>
  `<g${id ? ` id="${id}"` : ''} transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(${s} ${flip ? -s : s})" stroke-width="${f(1.4 / s)}">${svg.replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${f(w / s)}"`)}</g>`;

// ---------------------------------------------------------------- torsos (relative to the head centre, facing right)
// tee: a crew-neck tee (the Onboarding test card); top: a fitted top with a small V collar (examples/whiteboard.svg).
// Each gives the neck, the body and 2 fold lines. TORSO_ANCHORS[style] holds points relative to the head centre,
// before any lean: nearShoulder, farShoulder, hip (centre; legs start 6-7 px either side of it), waistTop (waistband
// rect top; the rect is 5 tall and about 33 wide).
const TORSO = {
  tee: { neck: 'M-6 7.5 L-6.4 22.5 L-0.6 28.5 L5 22.5 L4.6 7.5Z',
    body: 'M-8 21.1 C-13.6 22.9 -17 27.9 -17.6 35.1 C-18.2 44.1 -16.6 54.1 -16.2 63.9 C-15.9 70.9 -16.4 77.1 -16.8 83.7 H14.2 C14.5 76.9 13.7 70.1 13.6 63.3 C13.4 55.1 15.8 47.1 15.6 38.9 C15.4 31.1 12.4 25.1 6.4 22.7 C3.6 26.3 -4.4 25.9 -8 21.1Z',
    folds: 'M-13.4 74.1c3 2.4 7 3.6 11.4 3.8M9.4 68.5c.8 2.2 1 4.4.8 6.6',
    anchors: { nearShoulder: [2.5, 31], farShoulder: [-7, 31.5], hip: [-2, 83.5], waistTop: 79.9 } },
  top: { neck: 'M-6 12L-7 27L-1 33L5.4 26.6L4 12Z',
    body: 'M-8 25C-14 27 -18 32 -19 39C-20 48 -18 58 -17 68C-16.4 74 -17 80 -18 85C-9 87.4 2 87.6 13 86C13 80 12 74 11.6 68C11.4 61 14.6 53 14.6 45C14.6 36 11 29 5 26.6L-1 32Z',
    collar: 'M-8 25L-1 32L-4.4 34.6L-9.4 27.4ZM5 26.6L-1 32L2.6 34.6L7 28.6Z',
    folds: 'M-15 72c3 3.4 7.4 5.6 12.6 6.4M7 54c1 2.6 1.6 5.2 1.6 8',
    anchors: { nearShoulder: [-2, 33], farShoulder: [-11, 33], hip: [-2, 86], waistTop: 84 } },
};
// torso(hx, hy, { style: 'tee'|'top', facing, fill, skin, id }) -> svg for neck + body (+ collar) + folds.
// Draw it after the legs and the waistband, before the head's `front` and the near arm.
export function torso(hx, hy, o = {}) {
  const { style = 'tee', facing = 'right', fill = W, skin = SKIN.light, id = '' } = o, T = TORSO[style];
  return `<g${id ? ` id="${id}"` : ''} transform="translate(${f(hx)} ${f(hy)})${facing === 'left' ? ' scale(-1 1)' : ''}"><path d="${T.neck}" fill="${skin}"/><path d="${T.body}" fill="${fill}"/>` +
    (T.collar ? `<path d="${T.collar}" fill="${fill}"/>` : '') + `<path d="${T.folds}" fill="none" stroke-width="1"/></g>`;
}
export const TORSO_ANCHORS = Object.fromEntries(Object.entries(TORSO).map(([k, v]) => [k, v.anchors]));

// ---------------------------------------------------------------- heads (34 tall chin to crown, ~1/7 of a standing figure)
// Built facing RIGHT (nose toward +x); facing 'left' mirrors the whole head. Origin = centre of the face.
// The neck joins under the back half of the jaw: a 10-11 wide quad from about (-6..4, 12) down to the collar.
const FACE = 'M-3 -16.5C5 -16.5 10.5 -11.5 11 -4.5C11.2 -2.5 11.6 -0.6 12.6 1.4C13.4 3 13.4 4.4 12.4 5C11.8 5.4 11.4 5.6 11 6C11.6 7 11.6 8.2 11 9C10.8 10.5 10.2 12 8.6 13.8C6 16.4 2 17 -1.5 15.5C-5 14 -8 9.5 -9 4C-10 -4 -9 -16.5 -3 -16.5Z';
const EAR = 'M-3.6 -2.6C-6.1 -3.8 -7.9 -1.8 -7.6 0.7C-7.3 3.1 -5.7 4.4 -3.7 4Z', EAR_IN = 'M-4.9 -0.8c-.9.3-1.1 1.6-.4 2.6';
// afro: scalloped back mass (drawn behind the torso) + curled fringe
function scallop(cx, cy, R, a0, a1, n, sweep) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
  let d = `M${P(pts[0])}`; for (let i = 1; i < pts.length; i++) { const r = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) * 0.56; d += `A${f(r)} ${f(r)} 0 0 ${sweep} ${P(pts[i])}`; } return d;
}
const curlsArc = (pts, sweep) => pts.slice(1).map((p, i) => { const q = pts[i], r = Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.56; return `A${f(r)} ${f(r)} 0 0 ${sweep} ${p[0]} ${p[1]}`; }).join('');
const AFRO_BACK_L = scallop(3.5, -3, 19.5, -128, 78, 14, 1) + 'L2 12L-8 -10Z';
const AFRO_FRONT_L = 'M9 3C12 -8 6 -19.2 -3 -19C-8 -18.8 -11.6 -14.6 -11.6 -9.6' + curlsArc([[-11.6, -9.6], [-8, -10.4], [-4.4, -10], [-1, -8.4], [2.2, -6], [5, -3], [7.5, 1]], 0) + 'Z';
export const HAIR = {
  afro: { back: mirrorPath(AFRO_BACK_L), front: mirrorPath(AFRO_FRONT_L), shine: mirrorPath('M-1 -14.5a3 3 0 0 1 4.6-1.6M8.5 -10a3 3 0 0 1 4.4.8M12.5 -1a3 3 0 0 1 3.4 3M3.5 -19a3 3 0 0 1 4.6 0'), backBehindBody: true },
  bun: { bun: [-8.4, -19, 6.4], bunShine: 'M-11.6 -21.2c1.4-1.6 3.4-2.2 5.4-1.8', back: 'M-4 15C-9 13 -12.6 8 -13 1C-13.4 -9 -8 -18.6 1 -19.4C7 -19.8 11.6 -16.6 12.6 -11.8L-1 8Z',
    front: 'M-13 1C-13.4 -9 -8 -18.6 1 -19.4C7.4 -19.8 12 -16.4 12.8 -11.4C13 -9.6 12.4 -8.4 11.4 -8.4C10.2 -11.2 7.4 -13.4 3.6 -13.6C1.6 -11.2 -1 -9.6 -3.6 -8.8C-3.2 -6.4 -3.6 -4 -4.6 -2.4C-6.8 -3.2 -8.6 -1.8 -8.8 0.6C-9 2.6 -8.6 4.6 -7.8 6.4C-10.8 6 -12.8 4.2 -13 1Z',
    shine: 'M-5 -15.6c2.6-1.8 6-2.4 9-1.8M7.6 -15.4c1.4.6 2.6 1.6 3.4 2.8' },
  side: { back: 'M-7 12C-11.6 8 -13.2 1 -12.6 -6C-12 -14 -6 -19.6 2 -19.6L-2 6Z',
    front: 'M-12.6 -6C-12 -14.6 -5 -20.6 3.4 -20.4C9.2 -20.2 13.6 -17.4 14.6 -13.2C15 -11.6 14.4 -10.4 13.2 -10.6C12 -12.4 9.8 -13.2 7.4 -12.8C5 -12.4 2.6 -11.8 0.6 -10.4C-0.6 -9.6 -1.6 -8 -2.2 -6C-2.6 -4.2 -3.4 -2.8 -4.4 -2.4C-5.4 -4 -7 -4.4 -8.4 -3.6C-9.2 -1.6 -9.4 0.6 -9.2 3C-11.8 1.6 -12.8 -2.2 -12.6 -6Z',
    shine: 'M-4 -16.4c3-1.8 7-2.2 10.4-1.2M8.6 -16c1.6.6 2.8 1.6 3.6 2.8' },
  crop: { front: mirrorPath('M9.4 4C11 -4 10.6 -12 5.4 -16.6C1 -20.2 -6 -19.8 -9.8 -16C-11.4 -14.4 -11.8 -12.2 -11.2 -10.2C-8.4 -12.2 -4.6 -12.8 -1 -12C1.2 -11.4 2.6 -9.6 3 -7.2C3.4 -5 4.2 -3.2 5.6 -2.4L6.8 2.4Z'),
    shine: mirrorPath('M-6 -16.4c2.6-1.4 5.6-1.6 8.4-.6') },
};
const BEARD = mirrorPath('M8.6 2.2C8 7 6.6 11 3.6 13.8C0.6 16.6 -4 17.4 -7.6 15.4C-9.6 14.2 -10.8 12 -11.2 9.6C-9.6 10.4 -7.8 10.4 -6.2 9.6C-4.6 8.6 -3.2 8.2 -1.6 8.8C0.6 9.6 2.6 9 4 7.2C5.4 5.4 6.4 3.4 6.8 1.8Z');
// head({ hair: 'afro'|'bun'|'side'|'crop', facing: 'right'|'left', skin, hairColor, shineColor, earring, glasses, beard, lashes })
// Returns { behind, front }: put `behind` (afro back mass) before the torso, `front` after it.
// rot is a screen rotation (+ = clockwise): it nods a right-facing head DOWN and a left-facing head UP.
// Hair colour: O (indigo, shine C.purple) or C.brown (shine C.orange). Earring: a mustard stud.
export function head(x, y, rot = 0, o = {}) {
  const { hair = 'side', facing = 'right', skin = SKIN.light, hairColor = O, shineColor = hairColor === O ? C.purple : C.orange,
    earring = false, glasses = false, beard = false, lashes = false, id = '' } = o;
  const H = HAIR[hair], flip = facing === 'left' ? ' scale(-1 1)' : '';
  const g = inner => `<g${id ? ` id="${id}"` : ''} transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})${flip}">${inner}</g>`;
  const behind = H.backBehindBody ? g(`<path d="${H.back}" fill="${hairColor}"/>`) : '';
  let s = '';
  if (H.bun) s += `<circle cx="${H.bun[0]}" cy="${H.bun[1]}" r="${H.bun[2]}" fill="${hairColor}"/><path d="${H.bunShine}" fill="none" stroke="${shineColor}" stroke-width="1"/>`;
  if (H.back && !H.backBehindBody) s += `<path d="${H.back}" fill="${hairColor}"/>`;
  s += `<path d="${FACE}" fill="${skin}"/>`;
  if (beard) s += `<path d="${BEARD}" fill="${hairColor}"/><path d="M10.9 8.3c-.9.5-2 .5-2.9 0" fill="none" stroke-width="1"/>`;
  s += `<path d="${H.front}" fill="${hairColor}"/><path d="${H.shine}" fill="none" stroke="${shineColor}" stroke-width="1"/>`;
  s += `<path d="${EAR}" fill="${skin}"/><path d="${EAR_IN}" fill="none" stroke-width="1"/>`;
  if (earring) s += `<circle cx="-5.2" cy="6.2" r="1.3" fill="${C.mustard}" stroke-width="1"/>`;
  s += `<circle cx="4.6" cy="-1.4" r="1.15" fill="${O}" stroke="none"/><circle cx="9.5" cy="-1.5" r="1" fill="${O}" stroke="none"/>`;
  s += `<path d="M2.6 -5.2c1.1-.6 2.6-.7 3.8-.3M8.4 -5c.7-.4 1.5-.5 2.2-.3${lashes ? 'M3 -1.8l-1.2-.8' : ''}" fill="none" stroke-width="1"/>`;
  if (glasses) s += `<circle cx="4.6" cy="-1.4" r="3.8" fill="none" stroke-width="1"/><path d="M8.4 -1.8c.6-.2 1.2-.2 1.8 0M11.6 -4.2c.9 1.5.9 3.4.2 5M0.8 -1.6L-4.4 -2.4" fill="none" stroke-width="1"/>`;
  s += `<path d="M11.9 5.2c-.7.5-1.5.6-2.3.2" fill="none" stroke-width="1"/>`;
  if (!beard) s += `<path d="M10.1 9.3c-.9.6-2 .6-2.8 0" fill="none" stroke-width="1"/>`;
  return { behind, front: g(s) };
}

// ---------------------------------------------------------------- demo / self-test
// node scripts/interior.mjs --demo out.svg : every part on one card (background decor, plants and pots, the four
// hair styles, the hand shapes with their thumbs, a sneaker, a standing figure built from the parts).
if (process.argv[2] === '--demo') {
  const fs = await import('node:fs');
  const out = process.argv[3] || 'interior-demo.svg', id = 'demo-';
  const bg = bgLayer(id, `<g>${bricks(40, 60, [[0, 0], [15, 0], [7, 7], [22, 7], [0, 14]])}</g><g>${lampDome(120, 30)}</g><g>${lampCone(400, 40)}</g>` +
    `<g>${poster(392, 150, 40, 50, '<path d="M8 10h24M8 14h9"/><rect x="8" y="18" width="24" height="14"/><path d="M8 38h18M8 42h12"/>')}</g><g>${cloud(190, 70, 0.9)}${bird(230, 40)}</g>`);
  let fg = floor(id);
  // plants
  fg += `<g><path d="M70 270C68 240 64 222 58 206M70 270C71 236 72 214 73 194" fill="none"/>${leaf(58, 207, 44, 176, 8, -2, C.sage)}${leaf(73, 196, 76, 160, 8.5, 2, C.leaf)}${pot(70, 276, 26, 20, W)}</g>`;
  fg += `<g>${blade(408, 284, 40, -4, 4, C.leaf)}${blade(416, 284, 52, 2, 4.4, C.sage)}${blade(424, 284, 34, 6, 3.6, C.teal)}${pot(416, 284, 30, 24, C.orange, { rim: false, marks: false, bands: 1 })}</g>`;
  // heads
  let hx = 130;
  for (const [hair, facing, skin, hc, extra] of [['afro', 'left', SKIN.deep, O, { earring: true }], ['bun', 'right', SKIN.medium, C.brown, { earring: true, lashes: true }], ['side', 'right', SKIN.light, O, {}], ['crop', 'left', SKIN.dark, O, { beard: true, glasses: true }]]) {
    const h = head(hx, 140, 0, { hair, facing, skin, hairColor: hc, ...extra });
    fg += h.behind + h.front; hx += 50;
  }
  // hands in a row, thumbs on -y (up)
  let x = 104;
  for (const name of Object.keys(HANDS)) { fg += place(hand(name, SKIN.medium, name === 'marker' ? HANDS.marker.pen() : ''), x, 200, 0, false, '', 1.4); x += 30; }
  // a standing figure facing right, built from the parts (head centre HC; torso anchors give shoulder and hip)
  const sk = SKIN.light, top = C.lav, pants = C.denim, HC = [318, 100], A = TORSO_ANCHORS.top, rel = q => [HC[0] + q[0], HC[1] + q[1]];
  const hip = rel(A.hip);
  const legF = trouserLeg([[hip[0] + 6, hip[1]], [hip[0] + 8, 230], [hip[0] + 9, 266], [hip[0] + 10, 291]], [9.6, 8, 6.4, 5.8], shoeOpening([hip[0] + 4, FL]), pants, sk);
  const legN = trouserLeg([[hip[0] - 5, hip[1]], [hip[0] - 6, 230], [hip[0] - 8, 266], [hip[0] - 9, 291]], [10.4, 8.4, 6.6, 5.8], shoeOpening([hip[0] - 15, FL]), pants, sk);
  fg += legF.skin + sneaker(`translate(${hip[0] + 4} ${FL})`, C.coral, W) + legF.leg + legN.skin + sneaker(`translate(${hip[0] - 15} ${FL})`, C.coral, W) + legN.leg;
  fg += `<rect x="${hip[0] - 16.5}" y="${HC[1] + A.waistTop}" width="33" height="5" rx="0.8" fill="${pants}"/>`;
  const h = head(HC[0], HC[1], 0, { hair: 'side', skin: sk });
  fg += torso(HC[0], HC[1], { style: 'top', fill: top, skin: sk }) + h.front;
  const S = rel(A.nearShoulder), Wr = [S[0] + 18, S[1] + 52], E = solveElbow(S, Wr, 30, 28, true), arm = bentArm(S, E, Wr, 4.4, 4, 3.2);
  fg += `<path d="${arm.d}" fill="${sk}"/><path d="M${P(arm.I)}l${f(-arm.u[0] * 3)} ${f(-arm.u[1] * 3)}" fill="none" stroke-width="1"/><path d="${sleeve(S, arm.u, 13, 5.8)}" fill="${top}"/>`;
  fg += place(hand('rest', sk), Wr[0], Wr[1], Math.atan2(arm.v[1], arm.v[0]) * 180 / Math.PI, false, '', 1.1);
  fs.writeFileSync(out, svgWrap(bg + fgLayer(id, fg), 'line-interior toolkit demo'));
  console.log('wrote', out);
}
