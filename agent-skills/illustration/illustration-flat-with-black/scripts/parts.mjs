// Parts for the flat-with-black style: palette, tapered limbs, cuffs, shoes, heads, hands and decor.
// Every shape and number here is lifted from the three cards in examples/. No dependencies, no randomness.
//
// Use it from a card generator (Node ESM):
//   import { C, P, S, tube, kneeTube, cuff, sleeve, sneaker, bentSneaker, sneakerMap, loafer,
//            head, hand, star, sparkle, drop, ground, wob, envelope, bubble, badge } from '/abs/path/scripts/parts.mjs';
//
// Or print a contact sheet of every part (run from the skill folder):
//   node scripts/parts.mjs sheet parts-sheet.svg && node scripts/render.mjs parts-sheet.svg parts-sheet.png
//
// Coordinates are SVG units on the 480 x 360 card. All fills are flat; nothing here adds an outline.

export const f = n => +(+n).toFixed(1);

// ---------------- palette (measured from the examples) ----------------
export const C = {
  ink: '#15202f',     // the black: hair, trousers, shoes, phones, laptops, thin detail lines
  ink2: '#26313f',    // black in shadow: far trouser leg, far shoe, paws
  grey: '#4b5662',    // cuffs on black trousers, laptop deck, far desk legs, ear insides
  skin: '#fadfb9', skin2: '#efc9a0', blush: '#f3ad8f', nose: '#e29771',
  denim: '#65aacb', denim2: '#5b9bb6', denim3: '#4a8bab', denim4: '#3f7894', cuff: '#97c8df', sky: '#a5d1e1',
  green: '#a6cf6e', green2: '#c6e1a0', green3: '#8fbb57',
  yellow: '#f9db74', yellow2: '#eec55a', yellow3: '#d9ab3c',
  red: '#e56355', red2: '#c94d42',
  coffee: '#6b4a3a', rule: '#d9dde2', paper: '#ffffff',
};

// ---------------- path writers ----------------
export const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
export const S = (d, w = 1.3, col = C.ink, extra = '') =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
// point at fraction t along a->b, pushed o units sideways (positive o = left of the direction of travel)
export const at = (a, b, t, o = 0) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [a[0] + dx * t - dy / l * o, a[1] + dy * t + dx / l * o]; };
// remap every coordinate pair of a path with only absolute commands
export const mapPath = (d, fn) => d.replace(/(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, (m, x, y) => { const [u, v] = fn(+x, +y); return `${f(u)} ${f(v)}`; });

// ---------------- limbs ----------------
const cr = pts => {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    s += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return s;
};
// a filled tapered tube through pts with a width per point: sleeves, forearms, necks, trouser legs
export function tube(pts, ws) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    const h = ws[i] / 2;
    L.push([pts[i][0] - dy * h, pts[i][1] + dx * h]); R.push([pts[i][0] + dy * h, pts[i][1] - dx * h]);
  }
  const Rr = R.slice().reverse();
  return `M${f(L[0][0])} ${f(L[0][1])}${cr(L)}L${f(Rr[0][0])} ${f(Rr[0][1])}${cr(Rr)}Z`;
}
// hip -> knee -> ankle with widths [hip, knee, ankle]; adds two short points either side of the knee so the bend stays crisp
export function kneeTube(p, w) {
  const k = p[1], a = at(k, p[0], 0.14), c = at(k, p[2], 0.14);
  return tube([p[0], a, k, c, p[2]], [w[0], w[1] + (w[0] - w[1]) * 0.14, w[1], w[1] - (w[1] - w[2]) * 0.14, w[2]]);
}
// rolled cuff band across the end of segment a->b (trouser hem, sleeve rib). w = limb width there
export function cuff(a, b, w, col, id, t0 = 0.8, t1 = 1.05) {
  const p1 = at(a, b, t0, -w / 2), p2 = at(a, b, t0, w / 2), p3 = at(a, b, t1, w / 2 + 1), p4 = at(a, b, t1, -w / 2 - 1);
  return P(`M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}L${f(p3[0])} ${f(p3[1])}L${f(p4[0])} ${f(p4[1])}Z`, col, id ? ` id="${id}"` : '');
}
// set-in sleeve: round shoulder cap + tapered upper sleeve, so no square tube end shows at the shoulder
export const sleeve = (sh, el, w0, w1, col, id) =>
  `<g${id ? ` id="${id}"` : ''}><circle cx="${f(sh[0])}" cy="${f(sh[1])}" r="${f(w0 / 2)}" fill="${col}"/>${P(tube([sh, el], [w0, w1]), col)}</g>`;

// ---------------- shoes ----------------
// loafer: ankle at 0,0, toe toward +x, ground contact at local y = 13
export const shoeD = 'M-10 -7C-14 -3 -15 3 -14.5 8L-13 13L-1.5 13C-0.5 11.2 2.5 10.8 4.5 11.2L7 13L34 13C40.5 13 46 10.5 46 6C46 1.8 41.5 0 36 -1C27 -3 18 -6 10 -9.5L-2 -10.5C-6 -10.5 -8.5 -9.5 -10 -7Z';
// black loafer with white welt lines (the running card). Put the group at (ankleX, groundY - 13*sc)
export const shoe = (x, y, rot, sc, id, flip = false, col = C.ink, det = C.paper) =>
  `<g id="${id}" transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${flip ? -sc : sc} ${sc})">${P(shoeD, col)}${S('M-13 10H-3M7 10.2H35C39 10.2 42 9.4 43.5 8', 0.85, det)}${S('M13 -5.5C17 -4 20.5 -2 22.5 0.5', 0.85, det)}</g>`;
// coloured loafer with a darker sole band (yellow loafers in the stand-up card)
export const loafer = (x, y, sc, id, flip = false, col = C.yellow, sole = C.yellow3) =>
  `<g id="${id}" transform="translate(${f(x)} ${f(y)}) scale(${flip ? -sc : sc} ${sc})">${P(shoeD, col)}`
  + P('M-14.6 9.6H-2.2L-1.5 13H-13Z', sole) + P('M6.4 9.6H34.6C39.6 9.6 43.6 8.2 45.8 5.8C46.2 10.4 40.6 13 34 13H7Z', sole)
  + S('M13 -5.5C17 -4 20.5 -2 22.5 0.5', 0.9, sole) + S('M-9.6 -6.6C-11.6 -3 -12.2 1.6 -11.8 5.6', 0.9, sole) + '</g>';
// chunky sneaker parts, absolute commands only so mapPath can bend them. Ankle at 0,0, toe +x, sole bottom at y = 14
const SNK = {
  upper: 'M-13 -9C-15.6 -4 -16 3 -15 9.5L44 9.5C46.6 9.5 47.6 7.6 47 5.4C46 2 41.6 0.6 36 -0.2C28 -1.4 21 -5 14 -9.8C10 -12.6 5 -14.4 -1 -14.6C-6.6 -14.8 -10.6 -12.6 -13 -9Z',
  sole: 'M-15.2 9.2L45.6 9.2C47.8 9.2 48.8 10.6 48.4 12C48 13.4 46.8 14 45 14L-14.6 14C-15.8 14 -16.4 13.2 -16.4 11.8C-16.4 10.2 -16 9.2 -15.2 9.2Z',
  toe: 'M32 -0.8C36.4 0.2 39.2 2.8 40 6.8', laces: 'M10.4 -10.6L13.4 -6.6M15.6 -7.8L18.4 -4M20.8 -5L23.2 -1.8', stripe: 'M-7 0C-1 3.4 6 5.4 13 5.8',
};
// world mapping for a sneaker: ankle reference at gx, sole on ground gy; heel lifted `lift` degrees about the ball of the foot
export function sneakerMap(gx, gy, sc, lift = 0, flip = false) {
  const px = 24, py = 14, a = lift * Math.PI / 180;
  return (x, y) => {
    const t = Math.min(1, Math.max(0, (px + 4 - x) / 16)), k = t * t * (3 - 2 * t);
    const c = Math.cos(a * k), s = Math.sin(a * k), dx = x - px, dy = y - py;
    const lx = px + dx * c - dy * s, ly = py + dx * s + dy * c;
    return [gx + (flip ? -1 : 1) * sc * lx, gy + sc * (ly - 14)];
  };
}
// sneaker bent by a sneakerMap: coloured upper, white sole with a 1.0 ink rim, white seams
export function bentSneaker(fn, id, col, det = C.paper) {
  const m = d => mapPath(d, fn);
  return `<g id="${id}">${P(m(SNK.upper), col)}${P(m(SNK.sole), C.paper)}${S(m(SNK.sole), 1, C.ink)}${S(m(SNK.toe), 0.9, det)}${S(m(SNK.laces), 1, det)}${S(m(SNK.stripe), 0.9, det)}</g>`;
}
export const sneaker = (gx, gy, sc, id, col, flip = false, lift = 0) => bentSneaker(sneakerMap(gx, gy, sc, lift, flip), id, col);
// where the trouser leg should end for a sneaker built with the same map (ankle top, local 0,-11.6)
export const sneakerAnkle = fn => fn(0, -11.6);

// ---------------- heads ----------------
// Local frame: about 36 wide x 42 tall, facing RIGHT in 3/4, nose tip near (22, 2), chin near (4, 21).
// Place with head({ x, y, rot, s, flip }) - flip:true mirrors it to face LEFT.
const FACE = 'M-14 -6C-15 -16 -5 -21 6 -19.6C15 -18.4 20 -11 20 -4L21.4 0.4C22.4 2.4 22 3.8 20.4 4.4C20 9 18.6 14 14.6 17.6C10.6 20.8 4 21.4 -1.6 18.6C-7 15.8 -12 11 -13.6 5C-14.4 1.6 -14.4 -2 -14 -6Z';
const HAIR = {
  bun: { back: '<circle cx="-6" cy="-24" r="8.5" fill="#15202f"/>', front: 'M18.4 -11C17 -19 9 -24.6 -1 -24C-10 -23.4 -17 -17 -17.4 -8C-17.8 0 -16 7 -12 11C-11.4 5 -11 0 -10 -4C-6 -9 0 -11.6 8 -12C12 -12.2 15.6 -11.8 18.4 -11Z', ear: [-7.6, 2.6] },
  curly: { back: '', front: 'M18 -14.5a6 6 0 0 0 -5 -8a7 7 0 0 0 -10 -3.5a7 7 0 0 0 -11 1a7 7 0 0 0 -9 6a6.5 6.5 0 0 0 -4 10a6 6 0 0 0 1 10a5.5 5.5 0 0 0 5 8C-12 8 -11.4 2 -11 -3C-8 -11 -2 -15.6 4 -16C9 -16.4 14 -15.6 18 -14.5Z', ear: [-12.6, 0.2] },
  short: { back: '', front: 'M19.6 -9.4C19 -18 11 -23.4 1 -23C-9 -22.6 -16.4 -16 -16.8 -6C-17 1 -15.4 7 -12.2 10.4C-11.8 5 -11.6 0.4 -10.6 -3.6C-8.4 -7 -5.6 -8.6 -2.4 -9.2C0.6 -12.4 5.4 -13.4 9.6 -11.6C13 -10.2 16.6 -9.4 19.6 -9.4Z', ear: [-7.6, 2.6] },
  beanie: { back: '', front: '', ear: [-7.4, 2.4], hat: true },
};
// ear: skin oval with one inner curve in skin2
const ear = ([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.8" ry="4.8" fill="${C.skin}"/>${S(`M${f(x - 0.6)} ${f(y - 2.4)}C${f(x + 0.8)} ${f(y - 2.2)} ${f(x + 1.6)} ${f(y - 0.4)} ${f(x + 0.8)} ${f(y + 1.8)}`, 0.9, C.skin2)}`;
const EYES = {
  dot: `<circle cx="5" cy="-2" r="1.8" fill="${C.ink}"/><circle cx="16.4" cy="-2.4" r="1.6" fill="${C.ink}"/>`,
  happy: S('M2 0.4C3.4 -1.4 5.6 -1.4 7 0.4M15.4 0C16.4 -1.2 17.8 -1.2 18.8 0', 1.3),
  squint: S('M1.8 -5L6.4 -2.4L1.8 0.2', 1.4) + `<circle cx="18.4" cy="-1.4" r="1.7" fill="${C.ink}"/>`,
};
const BROWS = {
  up: S('M0.6 -8.6C2.4 -11 6 -11.6 8.4 -10.2M13.8 -10.6C15.4 -12 17.8 -12 19.2 -10.8', 1.4),
  soft: S('M1 -6C3 -6.8 5.6 -6.8 7.6 -6M14.4 -6.2C15.8 -6.8 17.4 -6.8 18.8 -6', 1.3),
  worried: S('M-1.4 -11.4L8.6 -8.8M14.6 -12.8L20.4 -10.4', 1.6),   // sits high: only with hair 'curly' or 'beanie'
  angry: S('M0.4 -9.4L8.6 -6.8M14 -8.2L19.6 -9.6', 1.5),             // determined, inner ends down; works under every hairline
  none: '',
};
const MOUTH = {
  open: P('M9.4 10C12.4 9.2 16 9.2 18.2 10.2C17.8 14 15.4 16 13.2 15.6C11 15.2 9.6 13 9.4 10Z', C.ink) + P('M11 14.4C12.4 13.2 14.8 13 16.2 14C15.4 15.2 14.2 15.8 13 15.6C12.2 15.5 11.5 15.1 11 14.4Z', C.red),
  grit: `<g transform="rotate(-10 13.6 13.2)"><rect x="7.6" y="10.4" width="12" height="5.8" rx="2.4" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.2"/>${S('M8.2 13.3H19M11.6 10.6V16M15.4 10.6V16', 0.7)}</g>`,
  smile: S('M10 11.2C12 13 15 13.2 17.4 11.6', 1.3),
  o: P('M11.4 11.2C13 10.4 15.2 10.4 16.4 11.2C16 14 12.4 14.4 11.4 11.2Z', C.ink),
};
const BEARD = 'M-13.6 -2C-14 4 -12 10 -8.6 13.6C-6 16.4 -2 18.8 2.4 20.2C7 21.8 12.6 21 15.6 18C18.4 15.2 19.6 11.4 20 8.4C17.6 9.6 15 9.8 12.6 9.2C9.6 8.6 6.6 9 4 10.6C1 12.4 -2.6 11.6 -4.6 8.6L-8.4 -2Z';
const BEANIE = P('M-17 -6C-18 -20 -6 -29 6 -28C16 -27 22 -20 21.6 -10L-16.4 -6.4Z', C.denim) + P('M-17.4 -8.6C-6 -12 8 -13.4 22 -11.8L21.8 -6.4C8 -8 -5 -6.8 -17 -3.4Z', C.denim2) + S('M-6 -24.6L-4.6 -14M2 -26L2.6 -14.4M10 -25.4L9.8 -14', 1, C.denim3);
const GLASSES = `<circle cx="4.6" cy="-0.4" r="6" stroke="${C.ink}" stroke-width="1.5"/><circle cx="17.4" cy="-0.8" r="4.6" stroke="${C.ink}" stroke-width="1.5"/>` + S('M10.6 -0.8C11.4 -1.7 12 -1.7 12.8 -1.1M-1.4 -1L-7 0.6', 1.5);
const GLASSES_EYES = { dot: `<circle cx="4.4" cy="-0.2" r="1.7" fill="${C.ink}"/><circle cx="17.6" cy="-0.4" r="1.6" fill="${C.ink}"/>`, happy: S('M2 0.4C3.4 -1.4 5.6 -1.4 7 0.4M15.4 0C16.4 -1.2 17.8 -1.2 18.8 0', 1.3) };
/**
 * head({ x, y, rot=0, s=1.06, flip=false, hair='bun'|'curly'|'short'|'beanie', glasses=false,
 *        eyes='dot'|'happy'|'squint', brows='up'|'soft'|'worried'|'angry'|'none', mouth='open'|'grit'|'smile'|'o',
 *        beard=false, earring=false, id })
 * Draw order inside: hair back, face, beard, ear, blush, nose tick, eyes/glasses, brows, mouth, hair front / hat.
 */
export function head(o) {
  const { x, y, rot = 0, s = 1.06, flip = false, hair = 'bun', glasses = false, eyes = 'dot', brows = 'up', mouth = 'open', beard = false, earring = false, id } = o;
  const H = HAIR[hair];
  let g = H.back + P(FACE, C.skin);
  if (beard) g += P(BEARD, C.ink) + P('M7.4 13.4C10 12.4 13.6 12.4 16 13.4C15 15.6 12.6 16.6 10.8 16.4C9.2 16.2 8 15 7.4 13.4Z', '#f0a58c');
  if (H.front) g += P(H.front, C.ink);
  g += ear(H.ear);
  if (earring) g += `<circle cx="${H.ear[0] + 0.2}" cy="${H.ear[1] + 6}" r="1.8" fill="${C.yellow}"/>`;
  if (!beard) g += `<ellipse cx="3.4" cy="5.8" rx="3.6" ry="2.2" fill="${C.blush}"/>`;
  g += S('M20.8 4.4C21.8 4 22.4 3.2 22.6 2.4', 1.1, C.nose);
  if (H.hat) g += BEANIE;
  if (glasses) g += GLASSES + (GLASSES_EYES[eyes] || GLASSES_EYES.dot);
  else g += EYES[eyes];
  g += BROWS[brows];
  if (!beard) g += MOUTH[mouth];
  return `<g${id ? ` id="${id}"` : ''} transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${flip ? -s : s} ${s})">${g}</g>`;
}

// ---------------- hands ----------------
// Each hand is authored in a local frame with the WRIST at 0,0. Place with hand(name, { x, y, rot, s, flip }).
// flip:true mirrors x, which turns a left hand into a right hand with the SAME side (palm/back) showing.
// Always re-check handedness with the thumb proof in references/craft.md after rotating or flipping.
export const HANDS = {
  // open palm, PALM visible, fingers toward +x, thumb up (-y). As authored: LEFT hand. (stand-up card, gesturing hand)
  palm: P('M-1 -4.2C2 -4.6 4.4 -5.2 6 -6.4C7.4 -8.6 8.6 -11.4 10.2 -12.8C11.4 -13.8 13 -13.2 12.8 -11.6C12.6 -10 11.6 -7.8 11.4 -5.8C14.8 -6.6 19 -7.6 22.6 -7.8C24.4 -7.9 25.2 -6.8 24.6 -5.8C24.2 -5 23 -4.8 21.4 -4.6C23.4 -4.4 25.2 -4 25.4 -2.8C25.6 -1.6 24.6 -1 23 -1C24.4 -0.6 25 0.6 24.4 1.4C23.8 2.2 22.4 2.2 21 2C21.8 2.6 21.8 3.8 20.8 4.2C19.2 4.8 15 4.2 11 3.6C7 3 3 3.6 -1 4.4Z', C.skin)
    + S('M21.4 -4.6L16.4 -4.2M23 -1L17.2 -0.8M21 2L16.8 1.8M11.4 -5.8C10.4 -4.6 9.2 -4 7.6 -3.8', 0.75),
  // pointing down, BACK visible, index extended, three curled knuckles, wrist at 0,0. As authored: RIGHT hand. (deploy card)
  point: P('M-1.6 -4.6C0.6 -4.7 3 -4.6 5 -3.9C6.6 -3.3 7.8 -2.5 8.8 -1.6L15.8 5.4C17.6 7.2 19.2 9.2 19.8 11.6C20.3 13.6 19.8 15.4 18.6 16.4C18.6 18.6 18.6 20.4 18.6 22C18.6 25.6 15.4 25.8 15.4 22.6C15.2 20.2 14.9 18.2 14.6 16.6C13.8 19 10.4 19.4 9.8 16.6C8.6 17.8 5.8 17.2 5.8 14.6C4.4 14.4 3.6 12.6 3.9 11C4 9.6 3.6 8.4 2.8 7.2L-0.2 5.2Z', C.skin)
    + S('M14.6 16.6L14.5 14.2M9.8 16.6C9.7 15.4 9.9 14.2 10.3 13.1M5.8 14.6C5.9 13.4 6.2 12.4 6.7 11.6M18.6 16.4C18.4 15.2 18.6 14 19.1 13.2', 0.73),
  // running fist, PALM side visible, wrist toward -y, curled fingers toward +y, thumb lobe on +x. As authored: LEFT hand. (messages card, s = 1.4)
  fist: P('M-6.5 -5C-9 -1 -9.2 5 -7.8 8.4C-7.6 11.8 -4.6 12.8 -3.4 10.6C-2.8 13.4 0.4 13.6 1.1 11C2 13.4 5 13.2 5.3 10.6C7 12.2 9.4 10.2 8.6 7.8C9.8 5 9.6 1.4 8.2 -1.2L6.8 -4.5C4.5 -6.6 -3 -7.2 -6.5 -5Z', C.skin)
    + P('M6.4 -4.8C9.8 -3.6 11.2 1.6 9.6 4.8C8.4 7 4.6 7 2.8 4.8C4.8 3.4 6.2 0.2 6.4 -4.8Z', C.skin)
    + S('M2.8 4.8C4.9 3.3 6.3 0.4 6.6 -3.2', 0.85) + S('M-3.4 10.6L-3.2 7.8M1.1 11L1.3 8.2M5.3 10.6L5.4 8.2', 0.85),
  // flat push / press, BACK visible, fingers up (-y), thumb on -x. As authored: RIGHT hand; flip:true gives the LEFT hand
  // (thumb on +x). Fingers are capsules (rects with rx = half width), separated by short ticks from the tips. (self-test card)
  push: pushHand(C.skin, C.skin),
};
function pushHand(thumbCol, indexCol) {
  let g = P('M-4.6 0C-5.6 -4 -6.6 -8.4 -6.4 -12.4L6.6 -12.8C6.8 -8.4 5.8 -4 4.6 0Z', C.skin);
  [[-4.9, 9], [-1.6, 10.6], [1.7, 9.8], [4.8, 7.6]].forEach(([x, l], i) => { g += `<rect x="${f(x - 1.75)}" y="${f(-12 - l)}" width="3.5" height="${f(l + 2)}" rx="1.75" fill="${i === 0 ? indexCol : C.skin}"/>`; });
  g += S([[-3.25, 9.3], [0.05, 9.6], [3.25, 8]].map(([x, l]) => `M${f(x)} ${f(-12 - l + 3.2)}V${f(-12 - l + 6.8)}`).join(''), 0.75);
  g += P('M-3.8 -2.6C-8.6 -4.6 -9.8 -8.6 -8.8 -11.2C-8 -12.6 -6.4 -12.2 -6 -10.6C-5.4 -8.4 -4.6 -6.8 -2.8 -5.6Z', thumbCol);
  return g + S('M-6.2 -10.4C-5.6 -8.2 -4.6 -6.6 -3 -5.4', 0.75);
}
// thumb proof versions: thumb #ff0000, index #0000ff (craft.md). Only the templates whose thumb is a separate shape.
const PROOF = {
  push: pushHand('#ff0000', '#0000ff'),
  fist: HANDS.fist.replace(`<path d="M6.4 -4.8C9.8 -3.6 11.2 1.6 9.6 4.8C8.4 7 4.6 7 2.8 4.8C4.8 3.4 6.2 0.2 6.4 -4.8Z" fill="${C.skin}"/>`, '<path d="M6.4 -4.8C9.8 -3.6 11.2 1.6 9.6 4.8C8.4 7 4.6 7 2.8 4.8C4.8 3.4 6.2 0.2 6.4 -4.8Z" fill="#ff0000"/>'),
};
// hand('push', { x, y, rot, s, flip, id, proof }) - proof:true swaps in the red-thumb / blue-index version where one exists
export const hand = (name, { x, y, rot = 0, s = 1, flip = false, id, proof = false } = {}) =>
  `<g${id ? ` id="${id}"` : ''} transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${flip ? -s : s} ${s})">${(proof && PROOF[name]) || HANDS[name]}</g>`;

// ---------------- decor ----------------
// five-point star with a same-colour 2.0 round-join stroke (soft corners). r 6-7.5
export const star = (cx, cy, r, rot, col, id) => {
  let d = ''; for (let i = 0; i < 10; i++) { const a = (i * 36 - 90 + rot) * Math.PI / 180, rr = i % 2 ? r * 0.48 : r; d += (i ? 'L' : 'M') + f(cx + rr * Math.cos(a)) + ' ' + f(cy + rr * Math.sin(a)); }
  return `<path${id ? ` id="${id}"` : ''} d="${d}Z" fill="${col}" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>`;
};
// thin "+" sparkle with an open centre: four 4 x s ticks, 1.2 stroke. s 0.7-1
export const sparkle = (x, y, s = 1, col = C.yellow) => S(`M${x} ${f(y - 8 * s)}V${f(y - 4 * s)}M${x} ${f(y + 4 * s)}V${f(y + 8 * s)}M${f(x - 8 * s)} ${y}H${f(x - 4 * s)}M${f(x + 4 * s)} ${y}H${f(x + 8 * s)}`, 1.2, col);
// sweat / effort drop, tip at local top, rotated. s 0.4-0.9
export const drop = (x, y, s, rot, col = C.cuff) => P('M0 -7C0 -7 -4.5 -2 -4.5 1.5C-4.5 4 -2.5 6 0 6C2.5 6 4.5 4 4.5 1.5C4.5 -2 0 -7 0 -7Z', col, ` transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"`);
// thin black ground line under the feet
export const ground = (x0, x1, y, id) => S(`M${x0} ${y}H${x1}`, 1.25, C.ink, id ? ` id="${id}"` : '');

// ---------------- paper props ----------------
// hand-cut rounded rectangle: each side bows out by b, corners r. Centred on 0,0 (place it with a transform)
export const wob = (hw, hh, r = 2.5, b = 1.4) =>
  `M${f(-hw + r)} ${-hh}Q0 ${f(-hh - b)} ${f(hw - r)} ${-hh}Q${hw} ${-hh} ${hw} ${f(-hh + r)}Q${f(hw + b * 0.7)} 0 ${hw} ${f(hh - r)}Q${hw} ${hh} ${f(hw - r)} ${hh}`
  + `Q0 ${f(hh + b * 0.85)} ${f(-hw + r)} ${hh}Q${-hw} ${hh} ${-hw} ${f(hh - r)}Q${f(-hw - b * 0.7)} 0 ${-hw} ${f(-hh + r)}Q${-hw} ${-hh} ${f(-hw + r)} ${-hh}Z`;
// flat envelope: coloured body, ink flap V and two lower creases at 1.05. hw x hh about 21 x 14.5 to 28 x 19
export const envelope = (x, y, hw, hh, rot, col, id) =>
  `<g${id ? ` id="${id}"` : ''} transform="translate(${f(x)} ${f(y)}) rotate(${rot})">${P(wob(hw, hh, 2.5, hh * 0.09), col)}`
  + S(`M${f(-hw + 1.2)} ${f(-hh + 1.4)}L-1.8 ${f(hh * 0.24)}Q0 ${f(hh * 0.4)} 1.8 ${f(hh * 0.24)}L${f(hw - 1.2)} ${f(-hh + 1.4)}`, 1.05)
  + S(`M${f(-hw + 1.2)} ${f(hh - 1.2)}L${f(-hw * 0.34)} ${f(hh * 0.06)}M${f(hw - 1.2)} ${f(hh - 1.2)}L${f(hw * 0.34)} ${f(hh * 0.06)}`, 1.05) + '</g>';
// chat bubble with a tail at the lower right (tail:-1 puts it lower left) and n text lines (white on red/black, ink on green/yellow)
export function bubble(x, y, hw, hh, rot, col, id, { lines = 3, lineCol = C.paper, tail = 1, lw = 1.2 } = {}) {
  const t = tail;
  const widths = [1.1, 1.19, 0.76, 0.95], y0 = -hh * 0.47, y1 = hh * 0.27;
  let ln = '';
  for (let i = 0; i < lines; i++) { const yy = f(lines === 1 ? -hh * 0.1 : y0 + (y1 - y0) * i / (lines - 1)); ln += `M${f(-hw * 0.57)} ${yy}H${f(-hw * 0.57 + hw * widths[i % 4])}`; }
  return `<g${id ? ` id="${id}"` : ''} transform="translate(${f(x)} ${f(y)}) rotate(${rot})">${P(wob(hw, hh, 4, 1.2), col)}`
    + P(`M${f(t * hw * 0.48)} ${f(hh - 2)}L${f(t * hw * 0.9)} ${f(hh + 8)}L${f(t * hw * 0.19)} ${f(hh - 0.5)}Z`, col)
    + S(ln, lw, lineCol) + '</g>';
}
// red count badge with a bold white number
export const badge = (x, y, r, txt, id) =>
  `<g${id ? ` id="${id}"` : ''}><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${C.red}"/><text x="${f(x)}" y="${f(y + r * 0.37)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${f(r * 1.04)}" font-weight="800" fill="${C.paper}">${txt}</text></g>`;

// ---------------- contact sheet ----------------
const { fileURLToPath } = await import('node:url');
const { resolve } = await import('node:path');
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]) && process.argv[2] === 'sheet') {
  const fs = await import('node:fs');
  const out = process.argv[3] || 'parts-sheet.svg';
  let g = '';
  const heads = [
    { hair: 'bun', eyes: 'dot', brows: 'up', mouth: 'open', earring: true },
    { hair: 'curly', glasses: true, eyes: 'dot', brows: 'worried', mouth: 'grit' },
    { hair: 'short', glasses: true, eyes: 'happy', brows: 'soft', mouth: 'smile' },
    { hair: 'beanie', glasses: true, eyes: 'happy', brows: 'soft', beard: true },
    { hair: 'bun', eyes: 'squint', brows: 'worried', mouth: 'o', flip: true },
  ];
  heads.forEach((h, i) => { g += head({ ...h, x: 50 + i * 90, y: 52, s: 1.5 }); });
  g += hand('palm', { x: 40, y: 150, s: 2 }) + hand('palm', { x: 150, y: 150, s: 2, flip: true });
  g += hand('point', { x: 200, y: 120, s: 2 }) + hand('fist', { x: 290, y: 140, s: 2.4 }) + hand('fist', { x: 350, y: 140, s: 2.4, flip: true });
  // a leg: hip, knee, ankle -> sneaker, with a cuff
  const fn = sneakerMap(60, 332, 0.95, 0), ank = sneakerAnkle(fn), leg = [[70, 200], [62, 262], ank];
  g += P(kneeTube(leg, [28, 23, 20]), C.denim) + cuff(leg[1], leg[2], 20, C.cuff, '', 0.78, 1.04) + bentSneaker(fn, 'ps-snk', C.ink);
  const fn2 = sneakerMap(150, 332, 0.95, 24), ank2 = sneakerAnkle(fn2), leg2 = [[175, 200], [160, 262], ank2];
  g += P(kneeTube(leg2, [28, 23, 20]), C.ink) + cuff(leg2[1], leg2[2], 20, C.grey, '', 0.74, 1.06) + bentSneaker(fn2, 'ps-snk2', C.ink2);
  g += loafer(250, 332 - 13 * 0.9, 0.9, 'ps-loaf') + shoe(330, 332 - 13 * 0.9, 0, 0.9, 'ps-shoe');
  g += star(410, 200, 7, 0, C.yellow) + star(440, 230, 6, -12, C.denim) + sparkle(410, 260) + drop(445, 270, 0.9, -30);
  g += sleeve([400, 120], [420, 160], 18, 14, C.green, 'ps-sleeve');
  g += envelope(280, 210, 21, 14.5, -10, C.green) + envelope(340, 200, 25.5, 19, 9, C.yellow) + bubble(300, 260, 21, 15, 10, C.red) + badge(372, 182, 13.5, '27');
  g += ground(20, 460, 332);
  fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" fill="none"><rect width="480" height="360" fill="#ffffff"/>${g}</svg>\n`);
  console.log('wrote', out);
}
