// Bold-pop building blocks: navy outlines, down-right navy extrusions, one-outline unions, outlined tubes,
// texture patterns and the style's decor vocabulary. ES module, no dependencies, deterministic output.
//
//   import { pop } from './pop.mjs';
//   const p = pop('rl-');                                   // every id this card makes starts with rl-
//   let b = '';
//   const win = p.rr(150, 90, 180, 150, 9);
//   b += p.ext(win, 8) + p.P(win, p.WHITE);                 // extrusion first, then the outlined face
//   fs.writeFileSync('card.svg', p.card(b, { label: 'Rate Limited' }));
//
//   node scripts/pop.mjs demo out.svg                        writes a test sheet of every mark
//
// Hands take { proof: true }: the thumb fills #ff0000 and (openHand) the index #0000ff, for the thumb proof copy.
//
// Author space: draw on the 480x360 grid, then card() wraps everything in
// translate(240,183) scale(0.78) translate(-240,-169), like the shipped cards. So a 3.0 outline renders at 2.34 px.

export const N = '#1f1c4d', PINK = '#ff5fa8', AQUA = '#4fe3ec', SKY = '#5bb8f7', YEL = '#ffe36e', ORA = '#ffb547',
  VIO = '#8f5cff', PERI = '#7d7ff7', MINT = '#34e2c4', LIME = '#b9f14d', CREAM = '#fff4d8', WHITE = '#ffffff',
  SKIN = '#ffd0b0', SKIN_SH = '#f4a385', SKIN_D = '#c68660', BLUSH = '#ff9cc8';
export const FONT = 'ui-sans-serif, system-ui, sans-serif';

// ------------------------------------------------------------------ geometry
export const f = v => String(+(+v).toFixed(2));
export const rot = (p, a, c = [0, 0]) => { const ca = Math.cos(a), sa = Math.sin(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * ca - y * sa, c[1] + x * sa + y * ca]; };
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const unit = a => { const L = Math.hypot(a[0], a[1]); return [a[0] / L, a[1] / L]; };
export const perp = a => [-a[1], a[0]];
export const rad = d => d * Math.PI / 180;
/** two-bone IK: joint between root S and end H with bone lengths l1, l2; bend = +1 / -1 picks the side */
export function ik(S, H, l1, l2, bend = 1) {
  let d = dist(S, H); d = Math.min(d, l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = (H[0] - S[0]) / d, uy = (H[1] - S[1]) / d, mx = S[0] + a * ux, my = S[1] + a * uy;
  return [mx - bend * h * uy, my + bend * h * ux];
}
export const pts = (P_, close = true) => 'M' + P_.map(([x, y]) => `${f(x)},${f(y)}`).join(' L') + (close ? ' Z' : '');
export const rr = (x, y, w, h, r) =>
  `M${f(x + r)},${f(y)} H${f(x + w - r)} A${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(y + r)} V${f(y + h - r)} ` +
  `A${f(r)},${f(r)} 0 0 1 ${f(x + w - r)},${f(y + h)} H${f(x + r)} A${f(r)},${f(r)} 0 0 1 ${f(x)},${f(y + h - r)} ` +
  `V${f(y + r)} A${f(r)},${f(r)} 0 0 1 ${f(x + r)},${f(y)} Z`;
export const circ = (cx, cy, r) => `M${f(cx - r)},${f(cy)} A${f(r)},${f(r)} 0 1 0 ${f(cx + r)},${f(cy)} A${f(r)},${f(r)} 0 1 0 ${f(cx - r)},${f(cy)} Z`;
export const ell = (cx, cy, rx, ry) => `M${f(cx - rx)},${f(cy)} A${f(rx)},${f(ry)} 0 1 0 ${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 1 0 ${f(cx - rx)},${f(cy)} Z`;
/** a closed shape around the segment c0-c1 with end radii r0, r1 (limbs, fingers) */
export function capsule(c0, r0, c1, r1) {
  const v = sub(c1, c0), d = Math.hypot(v[0], v[1]);
  if (d < 1e-6 || d <= Math.abs(r0 - r1)) return circ(c0[0], c0[1], Math.max(r0, r1));
  const a = Math.atan2(v[1], v[0]), ph = Math.acos((r0 - r1) / d);
  const e = (ang, r, c) => [c[0] + r * Math.cos(ang), c[1] + r * Math.sin(ang)];
  const p0 = e(a + ph, r0, c0), p1 = e(a + ph, r1, c1), p2 = e(a - ph, r1, c1), p3 = e(a - ph, r0, c0);
  const lg1 = ph > Math.PI / 2 ? 1 : 0, lg0 = ph < Math.PI / 2 ? 1 : 0;
  return `M${f(p0[0])},${f(p0[1])} L${f(p1[0])},${f(p1[1])} A${f(r1)},${f(r1)} 0 ${lg1} 0 ${f(p2[0])},${f(p2[1])} ` +
    `L${f(p3[0])},${f(p3[1])} A${f(r0)},${f(r0)} 0 ${lg0} 0 ${f(p0[0])},${f(p0[1])} Z`;
}
export const chain = (P_, R) => P_.slice(0, -1).map((p, i) => capsule(p, R[i], P_[i + 1], R[i + 1])).join(' ');

// ------------------------------------------------------------------ the card factory
export function pop(prefix, { sw = 3 } = {}) {
  const p = { prefix, SW: sw, K: 1, N, PINK, AQUA, SKY, YEL, ORA, VIO, PERI, MINT, LIME, CREAM, WHITE, SKIN, SKIN_SH, SKIN_D, BLUSH, FONT,
    f, rot, dist, lerp, add, sub, mul, unit, perp, rad, ik, pts, rr, circ, ell, capsule, chain };
  const W = s => f((s ?? p.SW) * p.K);                       // stroke width, compensated inside scaled groups
  p.url = name => `url(#${prefix}${name})`;
  /** filled shape with the navy outline */
  p.P = (d, fill, s, extra = '') => `<path d="${d}" fill="${fill}" stroke="${N}" stroke-width="${W(s)}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
  /** fill only */
  p.F = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
  /** stroke only */
  p.S = (d, s, col = N, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${W(s)}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
  /** colour fill + texture pattern + outline (pattern is a defs() name: hatch, hatchb, hatchv, hatchh, dots, dots2, grid, stripe, pstripe, check) */
  p.tex = (d, fill, pat, s) => p.F(d, fill) + p.F(d, p.url(pat)) + p.S(d, s);
  /** navy depth extrusion, ALWAYS down-right: k copies stepped (1,1). Draw it BEFORE the face. tf = transform the face also uses */
  p.ext = (ds, k, { step = 1, tf = '' } = {}) => {
    if (typeof ds === 'string') ds = [ds];
    const n = Math.max(1, Math.round(k / step)); let g = '';
    for (let i = 1; i <= n; i++) {
      let inner = ds.map(d => `<path d="${d}"/>`).join('');
      if (tf) inner = `<g transform="${tf}">${inner}</g>`;
      g += `<g transform="translate(${f(k * i / n)},${f(k * i / n)})">${inner}</g>`;
    }
    return `<g fill="${N}" stroke="${N}" stroke-width="${W()}" stroke-linejoin="round">${g}</g>`;
  };
  /** a stroked band of width w with a navy outline on both sides (limbs, cables, letters, hooks) */
  p.tube = (d, w, fill, { cap = 'round', s, extra = '' } = {}) =>
    `<path d="${d}" fill="none" stroke="${N}" stroke-width="${f(w + (s ?? p.SW) * 2 * p.K)}" stroke-linecap="${cap}" stroke-linejoin="round"${extra}/>` +
    `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${f(w)}" stroke-linecap="${cap}" stroke-linejoin="round"${extra}/>`;
  /** several overlapping closed shapes drawn with ONE outline: navy pass stroked 2*sw, then the fill pass on top */
  p.union = (ds, fill, { s, pat } = {}) => {
    const d = typeof ds === 'string' ? ds : ds.join(' ');
    return `<path d="${d}" fill="${N}" stroke="${N}" stroke-width="${f(2 * (s ?? p.SW) * p.K)}" stroke-linejoin="round"/>` + p.F(d, fill) + (pat ? p.F(d, p.url(pat)) : '');
  };

  // ---------------------------------------------------------------- floating marks (author-space sizes)
  p.hashmark = (x, y, s = 7, r = 12) => p.S(`M${f(x - s * .25)},${f(y - s * .5)} L${f(x - s * .35)},${f(y + s * .5)} M${f(x + s * .3)},${f(y - s * .5)} L${f(x + s * .2)},${f(y + s * .5)} ` +
    `M${f(x - s * .55)},${f(y - s * .17)} L${f(x + s * .5)},${f(y - s * .17)} M${f(x - s * .6)},${f(y + s * .2)} L${f(x + s * .45)},${f(y + s * .2)}`, 1.8, N, ` transform="rotate(${r} ${f(x)} ${f(y)})"`);
  p.slashes = (x, y, s = 8) => p.S(`M${f(x)},${f(y + s / 2)} L${f(x + s * .45)},${f(y - s / 2)} M${f(x + s * .45)},${f(y + s / 2)} L${f(x + s * .9)},${f(y - s / 2)}`, 1.8);
  p.plus = (x, y, s = 6, w = 2.2) => p.S(`M${f(x - s / 2)},${f(y)} h${f(s)} M${f(x)},${f(y - s / 2)} v${f(s)}`, w);
  p.dot = (x, y, r = 2.4) => p.F(circ(x, y, r), N);
  p.ring = (x, y, r = 4) => p.S(circ(x, y, r), 2.0);
  /** outline cloud, flat base at y, left end at x */
  p.cloud = (x, y, s = 1) => p.S(`M${f(x)},${f(y)} h${f(38 * s)} a${f(8 * s)},${f(8 * s)} 0 0 0 0,${f(-16 * s)} a${f(11 * s)},${f(11 * s)} 0 0 0 ${f(-20 * s)},${f(-5 * s)} ` +
    `a${f(9 * s)},${f(9 * s)} 0 0 0 ${f(-16 * s)},${f(6 * s)} a${f(7.5 * s)},${f(7.5 * s)} 0 0 0 ${f(-2 * s)},${f(15 * s)} z`);
  /** lightning bolt path, top-left corner near (x,y); about 36x70 at s=1 */
  p.bolt = (x, y, s = 1) => pts([[450, 132], [432, 168], [445, 168], [436, 202], [468, 154], [454, 154], [464, 132]].map(([a, b]) => [x + (a - 450) * s, y + (b - 132) * s]));
  /** extruded yellow bolt, ready to place */
  p.boltMark = (x, y, s = 1, fill = YEL, depth = 4) => { const d = p.bolt(x, y, s); return p.ext(d, depth) + p.P(d, fill); };

  // ---------------------------------------------------------------- hero geometry
  p.curvedArrow = (c, r, a0, a1, w, hl, hwid) => {
    const a0r = rad(a0), a1r = rad(a1), ro = r + w / 2, ri = r - w / 2, pp = (R, A) => [c[0] + R * Math.cos(A), c[1] + R * Math.sin(A)];
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0, tip = pp(r, a1r + hl / r);
    const o0 = pp(ro, a0r), o1 = pp(ro, a1r), i0 = pp(ri, a0r), i1 = pp(ri, a1r), h1 = pp(r + hwid / 2, a1r), h2 = pp(r - hwid / 2, a1r);
    return `M${f(o0[0])},${f(o0[1])} A${f(ro)},${f(ro)} 0 ${large} 1 ${f(o1[0])},${f(o1[1])} L${f(h1[0])},${f(h1[1])} L${f(tip[0])},${f(tip[1])} ` +
      `L${f(h2[0])},${f(h2[1])} L${f(i1[0])},${f(i1[1])} A${f(ri)},${f(ri)} 0 ${large} 0 ${f(i0[0])},${f(i0[1])} Z`;
  };
  p.gear = (c, ro, ri, k) => { const P_ = [], pitch = 2 * Math.PI / k;
    for (let i = 0; i < k; i++) for (const [R, off] of [[ri, -.27], [ro, -.15], [ro, .15], [ri, .27]]) P_.push([c[0] + R * Math.cos(i * pitch + off * pitch), c[1] + R * Math.sin(i * pitch + off * pitch)]);
    return pts(P_); };
  /** iso faces, top vertex at (cx,ty): [top, left, right] point lists */
  p.isoFaces = (cx, ty, hw, hh, sh) => {
    const T = [[cx, ty], [cx + hw, ty + hh], [cx, ty + 2 * hh], [cx - hw, ty + hh]];
    return [T, [T[3], T[2], [T[2][0], T[2][1] + sh], [T[3][0], T[3][1] + sh]], [T[2], T[1], [T[1][0], T[1][1] + sh], [T[2][0], T[2][1] + sh]]];
  };
  /** iso cube: right face solid navy (the shadow side), left face colour + pattern, top cream + dots */
  p.isoCube = (cx, ty, hw, hh, sh, { left = SKY, leftPat = 'hatchv', top = CREAM, topPat = 'dots' } = {}) => {
    const [T, L, R] = p.isoFaces(cx, ty, hw, hh, sh);
    return p.P(pts(R), N) + (leftPat ? p.tex(pts(L), left, leftPat) : p.P(pts(L), left)) + (topPat ? p.tex(pts(T), top, topPat) : p.P(pts(T), top));
  };
  /** square tile cut into 8 facets from its centre: 4 coloured blades alternating with white / cream-dotted facets */
  p.pinwheel = (c, half, angDeg = -9, cols = [PINK, YEL, MINT, VIO], { depth = 6, s } = {}) => {
    const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => rot([c[0] + sx * half, c[1] + sy * half], rad(angDeg), c));
    let o = p.ext(pts(C), depth);
    for (let i = 0; i < 4; i++) {
      const m = lerp(C[i], C[(i + 1) % 4], .5);
      o += p.P(pts([c, C[i], m]), cols[i], s);
      const tri = pts([c, m, C[(i + 1) % 4]]);
      o += i % 2 === 0 ? p.P(tri, WHITE, s) : p.F(tri, CREAM) + p.F(tri, p.url('dots')) + p.S(tri, s);
    }
    return o + p.P(circ(c[0], c[1], 4), WHITE, s);
  };
  p.stripedRing = (c, ro, ri, { n = 10, col = PINK, col2 = WHITE, depth = 3 } = {}) => {
    let o = p.F(circ(c[0] + depth, c[1] + depth, ro), N) + p.S(circ(c[0] + depth, c[1] + depth, ro));
    for (let i = 0; i < n; i++) {
      const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n, q = [[ro, a0], [ro, a1], [ri, a1], [ri, a0]].map(([R, A]) => [c[0] + R * Math.cos(A), c[1] + R * Math.sin(A)]);
      o += p.F(`M${f(q[0][0])},${f(q[0][1])} A${f(ro)},${f(ro)} 0 0 1 ${f(q[1][0])},${f(q[1][1])} L${f(q[2][0])},${f(q[2][1])} A${f(ri)},${f(ri)} 0 0 0 ${f(q[3][0])},${f(q[3][1])} Z`, i % 2 === 0 ? col : col2);
    }
    return o + p.S(circ(c[0], c[1], ro)) + p.P(circ(c[0], c[1], ri), WHITE);
  };
  /** browser window: extrusion, white body, coloured title bar with 3 traffic dots and a url pill, optional dotted footer.
   *  Returns { svg, inner } where inner = [x, y, w, h] of the free content area. */
  p.browser = (x, y, w, h, { bar = PERI, depth = 8, r = 9, dotsRight = false, footer = 22, pill = true } = {}) => {
    let o = p.ext(rr(x, y, w, h, r), depth) + p.P(rr(x, y, w, h, r), WHITE);
    if (footer) {
      const fb = `M${f(x)},${f(y + h - footer)} H${f(x + w)} V${f(y + h - r)} A${r},${r} 0 0 1 ${f(x + w - r)},${f(y + h)} H${f(x + r)} A${r},${r} 0 0 1 ${f(x)},${f(y + h - r)} Z`;
      o += p.F(fb, CREAM) + p.F(fb, p.url('dots')) + p.S(`M${f(x)},${f(y + h - footer)} H${f(x + w)}`, 2.4);
    }
    o += p.S(rr(x, y, w, h, r));
    o += p.P(`M${f(x)},${f(y + r)} A${r},${r} 0 0 1 ${f(x + r)},${f(y)} H${f(x + w - r)} A${r},${r} 0 0 1 ${f(x + w)},${f(y + r)} V${f(y + 22)} H${f(x)} Z`, bar);
    const dx = dotsRight ? x + w - 38 : x + 14;
    [PINK, YEL, MINT].forEach((c, i) => { o += p.P(circ(dx + i * 12, y + 11, 3.6), c, 2.2); });
    if (pill) { const px = dotsRight ? x + 14 : x + 50; o += p.P(rr(px, y + 5.5, 34, 11, 5.5), WHITE, 2.2) + p.S(`M${f(px + 7)},${f(y + 11)} H${f(px + 19)} M${f(px + 23)},${f(y + 11)} H${f(px + 26)}`, 2.2); }
    return { svg: o, inner: [x + 10, y + 32, w - 20, h - 32 - (footer || 0) - 8] };
  };
  /** rounded text-line pill (wireframe copy inside windows) */
  p.line = (x, y, w, fill = PERI, s = 2.0) => p.P(rr(x, y - 2.5, w, 5, 2.5), fill, s);

  // ---------------------------------------------------------------- people
  /** head facing right in 3/4 view, centre HC (about 37 wide x 42 tall). tilt in degrees.
   *  hairBack is drawn behind the face (ponytail, long hair), hairFront over the skull (cap of hair, fringe, hat).
   *  mouth: 'grin' (open, teeth + tongue), 'smile' (one stroke), 'focus' (flat line, tongue in the corner) */
  p.head = (HC, { tilt = 0, skin = SKIN, mouth = 'grin', blush = true, hairBack = '', hairFront = '' } = {}) => {
    let o = `<g transform="translate(${f(HC[0])},${f(HC[1])}) rotate(${f(tilt)})">` + hairBack;
    o += p.P('M-17,-4 C-17,-17 -8,-22 2,-22 C13,-22 20,-14 20,-3 C20,9 15,20 4,20 C-7,20 -17,9 -17,-4 Z', skin);
    o += hairFront;
    o += p.P('M-9,-3 C-17,-6 -18,6 -9,6', skin, 2.2) + p.S('M-11.5,-0.5 q-2.5,1.6 0,3.4', 1.3);        // ear
    o += p.F(ell(9.5, -2, 1.6, 2.2), N) + p.F(ell(17.6, -2.4, 1.4, 2.1), N);                     // near eye bigger
    o += p.S('M6,-8 L12,-9.6 M15.5,-9.6 L20,-8.6', 1.9);                                            // brows
    if (blush) o += p.F(circ(5, 5, 2.6), BLUSH);
    if (mouth === 'grin') o += p.P('M8,8 Q12.5,8.6 17,7.2 Q16.6,14.6 12,14.4 Q8.6,13.2 8,8 Z', N, 1.8)
      + p.F('M10,12.4 Q12.8,10.4 16,12 Q13.2,14.2 10,12.4 Z', PINK) + p.F('M8.9,8.7 Q12.5,9.3 16.4,8.1 L16.2,9.6 Q12.5,10.6 9.2,10.2 Z', WHITE);
    else if (mouth === 'smile') o += p.S('M9,9.4 Q13,12.6 17.4,8.8', 1.9);
    else o += p.S('M8.6,10.6 Q12,11.8 16.8,9.8', 1.9) + p.P('M13.4,10.8 Q13.8,14 15.8,13.8 Q17.4,13.4 16.6,10.2 Z', PINK, 1.5);
    return o + '</g>';
  };
  /** neck block: draw before the head, after the torso */
  p.neck = (x, y, skin = SKIN) => p.P(rr(x - 4.5, y - 10, 9.5, 12, 3), skin, 2.6);
  /** one-outline limb through joint points with radii, e.g. leg [hip,knee,ankle] [8.2,6.6,4.8]; pat 'hatch' on the far limb */
  p.limb = (P_, R, fill, pat) => p.union(chain(P_, R), fill, { pat });
  /** skin arm (shoulder, elbow, wrist) with a short sleeve over the upper arm and a hem line */
  p.arm = (sh, el, wr, { skin = SKIN, sleeve = VIO, sleevePat = null, r = [4.6, 4.1, 2.9], sr = [7.4, 6.4], len = 0.5 } = {}) => {
    let o = p.union([capsule(sh, r[0], el, r[1]), capsule(el, r[1], wr, r[2])], skin);
    const d = unit(sub(el, sh)), n_ = perp(d), se = lerp(sh, el, len);
    o += p.union([capsule(add(sh, mul(d, -2)), sr[0], se, sr[1])], sleeve, { pat: sleevePat });
    const h = add(se, mul(d, -2.4)), a = add(h, mul(n_, sr[1] - .4)), b = add(h, mul(n_, -(sr[1] - .4)));
    return o + p.S(`M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])}`, 1.5);
  };
  /** side-view sneaker, local origin = floor point under the ankle (ankle at 1,-11), toe toward +x.
   *  angle rotates about the origin (heel lift: rotate about the toe instead with toeLift). flip = toe to the left */
  p.sneaker = (x, y, { angle = 0, flip = false, upper = WHITE, sole = CREAM, stripe = PINK } = {}) =>
    `<g transform="translate(${f(x)},${f(y)}) rotate(${f(angle)}) scale(${flip ? -1 : 1},1)">` +
    p.P('M-10.5,-6 L24.5,-6 Q25.5,-6 25.5,-3 Q25.5,0 22,0 L-7.5,0 Q-10.5,0 -10.5,-3 Z', sole, 2.6) +
    p.P('M-9,-5 L-9,-13 Q-9,-17 -4.5,-17 L2.5,-17 Q6,-17 8,-13.5 Q10.5,-10.5 17,-10 Q23.5,-9.5 23.5,-5 Z', upper, 2.6) +
    (stripe ? p.P('M-3,-9.5 Q4,-11.5 12,-8 L12,-6 Q4,-8.5 -3,-6.5 Z', stripe, 1.6) : '') +
    p.S('M14,-10 Q16.6,-8 16.6,-5.6', 1.6) + p.S('M0.5,-15 l4,2.6 M3.4,-16.8 l3.8,2.4', 1.6) + '</g>';

  // ---------------------------------------------------------------- hands (local frames; place with a transform)
  /** fist wrapped round a handle that runs along +x through y=0 (handle half-thickness <= 4.5).
   *  Fingers wrap the near face and curl under (+y); the thumb comes over the top (-y) and down across the index.
   *  Mirror with scale(1,-1) to put the thumb on the other face. id must be unique on the card. */
  p.fist = (id, { skin = SKIN, shade = SKIN_SH, proof = false } = {}) => {
    const q = (x, y) => `${f(x)},${f(y)}`;
    const mitt = `M${q(-6.6, -4.6)} L${q(5.2, -4.9)} C${q(7.4, -4.9)} ${q(8, -2.6)} ${q(8, .2)} L${q(8, 4.6)} C${q(8, 7)} ${q(6.9, 8.3)} ${q(5.1, 8.3)} ` +
      `Q${q(3.9, 8.3)} ${q(3.1, 7.5)} Q${q(1.9, 8.5)} ${q(.4, 8.4)} Q${q(-.3, 8.3)} ${q(-.4, 7.6)} Q${q(-1.3, 8.4)} ${q(-2.6, 8.2)} Q${q(-3.4, 8)} ${q(-3.6, 7.3)} ` +
      `Q${q(-4.6, 7.9)} ${q(-5.6, 7.4)} C${q(-7.2, 6.6)} ${q(-7.4, 3.4)} ${q(-7.2, .6)} C${q(-7, -2)} ${q(-7, -3.6)} ${q(-6.6, -4.6)} Z`;
    const cid = `${prefix}${id}`;
    const shadeG = `<clipPath id="${cid}"><path d="${mitt}"/></clipPath><g clip-path="url(#${cid})">` +
      p.F(`M${q(-9, 5.6)} Q${q(0, 7)} ${q(9, 5)} L${q(9, 10)} L${q(-9, 10)} Z`, shade) +
      p.F(`M${q(-9, -6)} L${q(9, -6)} L${q(9, .8)} C${q(8.2, 2.6)} ${q(4.4, 3)} ${q(2.6, 1.4)} C${q(2, .4)} ${q(2.2, -1.2)} ${q(1, -1.6)} L${q(-9, -1.4)} Z`, shade) + '</g>';
    const notches = p.S(`M${q(3.1, 7.5)} L${q(2.9, 5)} M${q(-.4, 7.6)} L${q(-.5, 5.2)} M${q(-3.6, 7.3)} L${q(-3.7, 5.2)}`, 1.7);
    const thumb = `M${q(-5.8, -2.6)} C${q(-6.2, -6)} ${q(-4.2, -8)} ${q(-1.2, -8.2)} C${q(1.6, -8.4)} ${q(4.2, -8.6)} ${q(5.8, -8.2)} C${q(8, -7.6)} ${q(9.1, -5.8)} ${q(8.9, -3.6)} ` +
      `C${q(8.7, -1.2)} ${q(7.3, .9)} ${q(5.3, 1.2)} C${q(3.6, 1.4)} ${q(2.7, .2)} ${q(3.1, -1.1)} C${q(3.5, -2.4)} ${q(3.3, -3.3)} ${q(1.9, -3.4)} L${q(-3.6, -3)} C${q(-4.6, -2.9)} ${q(-5.3, -2.8)} ${q(-5.8, -2.6)} Z`;
    return p.F(mitt, skin) + shadeG + p.S(mitt, 3.0) + notches + p.P(thumb, proof ? '#ff0000' : skin, 2.7);
  };
  /** open hand seen from the BACK, wrist at (0,0), fingers along +x, thumb on the -y side.
   *  As drawn that is a RIGHT hand with fingers pointing right; wrap in scale(1,-1) for a LEFT hand. */
  p.openHand = ({ spread = 1, curl = .15, thumbAng = -62, lens = [8.4, 9.2, 8.6, 7.0], palm = 8.6, fw = 1, skin = SKIN, s = 2.4, cs = 1.3, proof = false } = {}) => {
    const kn = [[palm, -4.7 * fw], [palm + .6, -1.6 * fw], [palm + .3, 1.6 * fw], [palm - .6, 4.5 * fw]];
    const caps = [capsule([0, 0], 3.2, [palm - 1.5, -2.6 * fw], 4.3), capsule([0, 0], 3.2, [palm - 1.5, 2.6 * fw], 4.3)], tips = [];
    kn.forEach((k, i) => {
      const L = lens[i], r = [1.8, 1.9, 1.8, 1.55][i], a = (i - 1.4) * .13 * spread;
      const m = [k[0] + L * .55 * Math.cos(a), k[1] + L * .55 * Math.sin(a)], t = [m[0] + L * .45 * Math.cos(a + curl), m[1] + L * .45 * Math.sin(a + curl)];
      caps.push(capsule(k, r, m, r * .97), capsule(m, r * .97, t, r * .9)); tips.push([k, m, t]);
    });
    const cont = [];
    for (let i = 0; i < 3; i++) {
      const [k0, m0, t0] = tips[i], [k1, m1, t1] = tips[i + 1], a = lerp(k0, k1, .5), b = lerp(m0, m1, .5), c = lerp(t0, t1, .5), L = dist(a, c);
      const c2 = L > 3 ? lerp(a, c, (L - 1.9) / L) : c;
      cont.push(`M${f(a[0] - 1.2)},${f(a[1])} Q${f(b[0])},${f(b[1])} ${f(c2[0])},${f(c2[1])}`);
    }
    const ta = rad(thumbAng), tb = [2.2, -2.2], tk = [tb[0] + 5.6 * Math.cos(ta), tb[1] + 5.6 * Math.sin(ta)], tt = [tk[0] + 5.4 * Math.cos(ta + .55), tk[1] + 5.4 * Math.sin(ta + .55)];
    caps.push(capsule(tb, 3.1, tk, 2.5), capsule(tk, 2.5, tt, 2.15));
    cont.push(`M${f(tb[0] + 1.6)},${f(tb[1] + 1.8)} Q${f(tk[0] + 1.5)},${f(tk[1] + 2)} ${f(tk[0] + 2.6)},${f(tk[1] + .9)}`);
    const pr = proof ? p.F(caps.slice(2, 4).join(' '), '#0000ff') + p.F(caps.slice(-2).join(' '), '#ff0000') : '';
    return p.union(caps, skin, { s }) + cont.map(c => p.S(c, cs)).join('') + pr;
  };
  /** loose running fist, back of the hand toward us, wrist at (0,0), knuckles toward +x, thumb on the +y side.
   *  As drawn: a LEFT hand with fingers pointing right; wrap in scale(1,-1) for a RIGHT hand. */
  p.looseFist = ({ skin = SKIN, s = 2.4, cs = 1.3, proof = false } = {}) =>
    p.union([capsule([0, 0], 3.0, [5.8, -.2], 5.3), capsule([5.8, -.2], 5.3, [8.6, 1.0], 4.8)], skin, { s }) +
    p.union([capsule([3.0, 3.8], 2.3, [7.6, 4.8], 2.0), capsule([7.6, 4.8], 2.0, [10.2, 3.4], 1.75)], proof ? '#ff0000' : skin, { s }) +
    ['M7.8,-4.6 Q11.2,-1.2 9.8,4.0', 'M10.6,-2.4 L12.6,-2.0', 'M11.0,0.8 L13.0,1.0'].map(c => p.S(c, cs)).join('');

  // ---------------------------------------------------------------- defs + card wrapper
  p.defs = (extra = '') => { const q = prefix; return `<defs>
<pattern id="${q}hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="2.5" y1="-1" x2="2.5" y2="6" stroke="${N}" stroke-width="1.25"/></pattern>
<pattern id="${q}hatchb" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="2.5" y1="-1" x2="2.5" y2="6" stroke="${N}" stroke-width="1.25"/></pattern>
<pattern id="${q}hatchv" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-26.6)"><line x1="-1" y1="2.5" x2="6" y2="2.5" stroke="${N}" stroke-width="1.25"/></pattern>
<pattern id="${q}hatchh" width="4.5" height="4.5" patternUnits="userSpaceOnUse"><line x1="-1" y1="2.25" x2="6" y2="2.25" stroke="${N}" stroke-width="1.2"/></pattern>
<pattern id="${q}dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.15" fill="${N}"/></pattern>
<pattern id="${q}dots2" width="4.6" height="4.6" patternUnits="userSpaceOnUse"><circle cx="2.3" cy="2.3" r="0.75" fill="${N}"/></pattern>
<pattern id="${q}grid" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M9,0.6 H0.6 V9" fill="none" stroke="${PERI}" stroke-width="1.2"/></pattern>
<pattern id="${q}stripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" fill="${N}"/></pattern>
<pattern id="${q}pstripe" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="9" fill="${PINK}"/></pattern>
<pattern id="${q}check" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="4.5" height="4.5" fill="${N}"/><rect x="4.5" y="4.5" width="4.5" height="4.5" fill="${N}"/></pattern>
${extra}</defs>`; };
  /** wraps author-space body in the card group (centre the cluster on (ox,oy), then scale about (cx,cy)) */
  p.card = (body, { scale = 0.78, cx = 240, cy = 183, ox = 240, oy = 169, label = '', extraDefs = '' } = {}) => {
    const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]).filter(i => !i.startsWith(prefix));
    if (ids.length) throw new Error('ids without prefix ' + prefix + ': ' + ids.join(', '));
    return `<svg ${label ? `role="img" aria-label="${label}, Bold pop style" ` : ''}xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">` + p.defs(extraDefs) +
      `<g transform="translate(${cx},${cy}) scale(${scale}) translate(${-ox},${-oy})">` + body + '</g></svg>';
  };
  return p;
}

// ------------------------------------------------------------------ self-test: node scripts/pop.mjs demo out.svg
const { pathToFileURL } = await import('node:url');
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && process.argv[2] === 'demo') {
  const fs = await import('node:fs');
  const p = pop('dm-');
  let b = '';
  const w = p.browser(150, 70, 180, 150, { bar: p.PERI });
  b += w.svg + p.line(165, 120, 60) + p.line(165, 132, 44, p.PINK) + p.line(165, 144, 52, p.AQUA);
  b += p.pinwheel([118, 92], 26) + p.isoCube(392, 190, 34, 17, 38) + p.boltMark(420, 60, .8);
  b += p.stripedRing([355, 92], 13, 6.5) + p.cloud(40, 70) + p.hashmark(70, 270) + p.slashes(450, 280) + p.plus(250, 300) + p.dot(30, 200) + p.ring(460, 140, 4);
  const ca = p.curvedArrow([118, 92], 50, 160, 252, 8.5, 13, 21); b += p.ext(ca, 3) + p.P(ca, p.ORA);
  // a small figure: legs, torso, arms, head, sneakers, three hand types
  b += p.limb([[92, 236], [86, 266], [80, 296]], [8.2, 6.6, 4.8], p.VIO, 'hatch') + p.sneaker(80, 307);
  b += p.limb([[104, 236], [114, 266], [112, 296]], [8.2, 6.6, 4.8], p.VIO) + p.sneaker(112, 307);
  const torso = 'M84,190 Q98,184 112,190 Q116,214 110,238 L86,238 Q80,214 84,190 Z';
  b += p.F(torso, p.PINK) + p.F(torso, p.url('dots2')) + p.S(torso) + p.neck(98, 186);
  b += p.head([100, 160], { tilt: -4, hairFront: p.P('M-18,4 C-22,-12 -12,-27 4,-26 C16,-25 23,-16 21,-8 C14,-12 8,-10 4,-15 C0,-8 -6,-8 -9,-10 C-9,-2 -12,2 -18,4 Z', p.YEL) });
  b += p.arm([110, 196], [124, 214], [140, 206], { sleeve: p.PINK });
  b += `<g transform="translate(140,206) rotate(-30)">${p.openHand()}</g>`;
  b += p.tube('M170,262 L230,262', 7, p.SKY) + `<g transform="translate(184,262)">${p.fist('f1')}</g><g transform="translate(212,262) scale(1,-1)">${p.fist('f2')}</g>`;
  b += `<g transform="translate(250,250)">${p.looseFist()}</g>`;
  const out = process.argv[3] || 'pop-demo.svg';
  fs.writeFileSync(out, p.card(b, { label: 'Helper demo' }));
  console.log('wrote', out);
}
