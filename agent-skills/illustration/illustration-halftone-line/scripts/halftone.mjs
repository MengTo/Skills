// Compiles a halftone-line source SVG into a finished card. No dependencies, seeded, deterministic.
//
//   node scripts/halftone.mjs card.src.svg card.svg --prefix oh- [--seed 23]
//   node scripts/halftone.mjs demo out.svg                     tone swatches + a sample figure (the helper's own test)
//
// Source format (a normal SVG with four additions):
//   @P@                 replaced by the id prefix everywhere (ids, url(#...) refs)
//   <!--DEFS-->         put inside <defs>; replaced by the wobble filter, the clipPaths the stipples need,
//                       and any dot tile pattern the card references (@P@dl / @P@dm / @P@dd / @P@ds)
//   <stip d="M.. Z" t="flat 0.19"/>
//                       a halftone fill: jittered dot grid clipped to d, dot AREA tracks the tone t (0..0.92).
//                       Tone terms (summed; mlin/noise multiply):
//                         flat T                          constant tone
//                         lin x1 y1 T1 x2 y2 T2          linear ramp between two points
//                         rad cx cy r T0 T1               radial (smoothstep) from centre to radius r
//                         radx cx cy rx ry T0 T1          elliptical radial
//                         mlin x1 y1 m1 x2 y2 m2          multiplies the tone along a line
//                         noise a [scale]                 multiplies by 1 + a*noise (breaks up big flat areas)
//                       Optional attributes: seed, pitch (default 2.58), jit (1.0), rj (0.5), clip="0" (no clip path).
//   ${expr}             evaluated as JS. Built-in helpers: ${H.pool(cx, cy, rx)} floor pool, ${H.E(cx, cy, rx, ry)} ellipse path,
//                       ${H.shoe(x, y, dir, sc)} sneaker, ${H.hand(x, y, rot, sc, thumb)} typing/resting hand,
//                       ${H.limb(points, halfWidths, tone)} sleeve or leg, ${H.head(x, y, rot, dir, hair, opts)} profile head,
//                       ${H.hair.curly()} / .bun() / .ponytail() / .long.front + .long.back / .glasses() hair presets.
//   <gen> js </gen>     optional block of your own JS helpers (consts, functions) for the ${...} expressions.
//
// Everything that is not a <stip> stays as you wrote it. Comments are stripped.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args.splice(i, 2)[1]; };

// ------------------------------------------------------------------ path flattening for the inside test
export function flatten(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g); let i = 0, cmd = '';
  let x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0; const polys = []; let cur = [];
  const num = () => parseFloat(toks[i++]);
  const bez = (p0, p1, p2, p3) => { for (let k = 1; k <= 12; k++) { const t = k / 12, u = 1 - t;
    cur.push([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]); } };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(); const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'M') { if (cur.length) polys.push(cur); x = ox + num(); y = oy + num(); sx = x; sy = y; cur = [[x, y]]; cmd = rel ? 'l' : 'L'; cx = x; cy = y; }
    else if (C === 'L') { x = ox + num(); y = oy + num(); cur.push([x, y]); cx = x; cy = y; }
    else if (C === 'H') { x = ox + num(); cur.push([x, y]); cx = x; cy = y; }
    else if (C === 'V') { y = (rel ? y : 0) + num(); cur.push([x, y]); cx = x; cy = y; }
    else if (C === 'C') { const a = [ox + num(), oy + num()], b = [ox + num(), oy + num()], e = [ox + num(), oy + num()]; bez([x, y], a, b, e); cx = b[0]; cy = b[1]; x = e[0]; y = e[1]; }
    else if (C === 'S') { const a = [2*x - cx, 2*y - cy], b = [ox + num(), oy + num()], e = [ox + num(), oy + num()]; bez([x, y], a, b, e); cx = b[0]; cy = b[1]; x = e[0]; y = e[1]; }
    else if (C === 'Q') { const a = [ox + num(), oy + num()], e = [ox + num(), oy + num()]; bez([x, y], [x + 2/3*(a[0]-x), y + 2/3*(a[1]-y)], [e[0] + 2/3*(a[0]-e[0]), e[1] + 2/3*(a[1]-e[1])], e); cx = a[0]; cy = a[1]; x = e[0]; y = e[1]; }
    else if (C === 'T') { const a = [2*x - cx, 2*y - cy], e = [ox + num(), oy + num()]; bez([x, y], [x + 2/3*(a[0]-x), y + 2/3*(a[1]-y)], [e[0] + 2/3*(a[0]-e[0]), e[1] + 2/3*(a[1]-e[1])], e); cx = a[0]; cy = a[1]; x = e[0]; y = e[1]; }
    else if (C === 'Z') { x = sx; y = sy; cur.push([x, y]); }
    else throw new Error(`stip d: unsupported command ${cmd} (use M L H V C S Q T Z, no arcs) in ${d.slice(0, 40)}`);
  }
  if (cur.length) polys.push(cur); return polys;
}
const inside = (polys, px, py) => { let c = false; for (const p of polys) for (let a = 0, b = p.length - 1; a < p.length; b = a++) {
  const [xa, ya] = p[a], [xb, yb] = p[b]; if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) c = !c; } return c; };
const rng = seed => { let s = seed % 2147483647 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
function vnoise(r) { const g = {}; const h = (i, j) => { const k = i + ',' + j; return g[k] ??= r(); };
  return (x, y) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx*fx*(3-2*fx), sy = fy*fy*(3-2*fy);
    const a = h(i, j), b = h(i+1, j), c = h(i, j+1), e = h(i+1, j+1); return (a + (b-a)*sx + (c-a)*sy + (a-b-c+e)*sx*sy) - .5; }; }

/** dot path data for one halftone fill. A: { d, t, seed, pitch, jit, rj } */
export function stipple(A, fallbackSeed = 1) {
  const polys = flatten(A.d), r = rng(+(A.seed || fallbackSeed));
  const pitch = +(A.pitch || 2.58), jit = +(A.jit || 1.0), rjit = +(A.rj || .5);
  const terms = String(A.t).split(';').map(s => s.trim().split(/\s+/)); const nz = vnoise(r);
  const tone = (x, y) => { let t = 0, mul = 1; for (const q of terms) { const v = q.slice(1).map(Number);
    if (q[0] === 'flat') t += v[0];
    else if (q[0] === 'lin') { const [x1, y1, t1, x2, y2, t2] = v, dx = x2 - x1, dy = y2 - y1; let u = ((x - x1)*dx + (y - y1)*dy) / (dx*dx + dy*dy); u = Math.max(0, Math.min(1, u)); t += t1 + (t2 - t1) * u; }
    else if (q[0] === 'rad') { const [cx, cy, rr, t0, t1] = v; let u = Math.min(1, Math.hypot(x - cx, y - cy) / rr); t += t0 + (t1 - t0) * u * u * (3 - 2*u); }
    else if (q[0] === 'radx') { const [cx, cy, rx, ry, t0, t1] = v; let u = Math.min(1, Math.hypot((x - cx)/rx, (y - cy)/ry)); t += t0 + (t1 - t0) * u * u * (3 - 2*u); }
    else if (q[0] === 'mlin') { const [x1, y1, m1, x2, y2, m2] = v, dx = x2 - x1, dy = y2 - y1; let u = ((x - x1)*dx + (y - y1)*dy) / (dx*dx + dy*dy); u = Math.max(0, Math.min(1, u)); mul *= m1 + (m2 - m1) * u; }
    else if (q[0] === 'noise') mul *= 1 + v[0] * 4 * nz(x / (v[1] || 14), y / (v[1] || 14));
    else throw new Error('unknown tone term ' + q[0]);
  } return t * mul; };
  const xs = [], ys = []; for (const p of polys) for (const [x, y] of p) { xs.push(x); ys.push(y); }
  const x0 = Math.floor(Math.min(...xs)) - 2, x1 = Math.max(...xs) + 2, y0 = Math.floor(Math.min(...ys)) - 2, y1 = Math.max(...ys) + 2;
  const f = n => +n.toFixed(2), g = n => +n.toFixed(1); let out = '', n = 0;
  for (let y = Math.floor(y0 / pitch) * pitch; y < y1; y += pitch) for (let x = Math.floor(x0 / pitch) * pitch; x < x1; x += pitch) {
    const px = x + (r() - .5) * jit, py = y + (r() - .5) * jit, rj = 1 + (r() - .5) * rjit, keep = r();
    if (!inside(polys, px, py) && !inside(polys, px + 1, py) && !inside(polys, px - 1, py) && !inside(polys, px, py + 1) && !inside(polys, px, py - 1)) continue;
    const t = Math.max(0, Math.min(.92, tone(px, py))); if (t <= 0) continue;
    let rad = pitch * Math.sqrt(t / Math.PI) * rj;
    if (rad < .4) { if (keep > (rad / .4) ** 2) continue; rad = .4 + r() * .06; }
    out += `M${g(px - rad)} ${g(py)}a${f(rad)} ${f(rad)} 0 1 0 ${f(2*rad)} 0a${f(rad)} ${f(rad)} 0 1 0 ${f(-2*rad)} 0`; n++;
  }
  return { d: out, n };
}

/** the hand-wobble filter: low-frequency warp of every line plus a fine edge roughening */
export const wobble = (P, seed = 23) => `<filter id="${P}wob" x="0" y="0" width="480" height="360" filterUnits="userSpaceOnUse">
<feTurbulence type="fractalNoise" baseFrequency="0.052" numOctaves="2" seed="${seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="2.3" xChannelSelector="R" yChannelSelector="G" result="w"/>
<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="4" result="g"/>
<feDisplacementMap in="w" in2="g" scale="0.8" xChannelSelector="G" yChannelSelector="B"/>
</filter>`;

/** 60x60 dot tiles with an opaque paper backdrop (the first card's method). scale(0.86) = the size they render at */
export function tiles(P) {
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); const f = n => +n.toFixed(2);
  const tile = (id, pitch, r0, rj, jit, specks, half) => { const o = [];
    for (let y = pitch / 2; y < 60; y += pitch) for (let x = pitch / 2; x < 60; x += pitch) {
      o.push(`<circle cx="${f(x + (r() - .5) * jit)}" cy="${f(y + (r() - .5) * jit)}" r="${f(r0 + (r() - .5) * rj)}"/>`);
      if (half) o.push(`<circle cx="${f(x + pitch / 2 + (r() - .5) * jit)}" cy="${f(y + pitch / 2 + (r() - .5) * jit)}" r="${f(half + (r() - .5) * rj)}"/>`);
    }
    for (let i = 0; i < specks; i++) o.push(`<circle cx="${f(r() * 60)}" cy="${f(r() * 60)}" r="${f(.35 + r() * .3)}"/>`);
    return `<pattern id="${P}${id}" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="scale(0.86)"><rect width="60" height="60" fill="#f4f1ea"/><g fill="#111">${o.join('')}</g></pattern>`; };
  return { dl: tile('dl', 3, .7, .3, 1.0, 26, 0), dm: tile('dm', 3, .86, .3, .9, 30, .46), dd: tile('dd', 3, 1.0, .28, .7, 20, .66),
    ds: `<pattern id="${P}ds" width="4.8" height="4.8" patternUnits="userSpaceOnUse" patternTransform="scale(0.86)"><rect width="4.8" height="4.8" fill="#f4f1ea"/><g fill="#111"><circle cx="1.2" cy="1.2" r="0.82"/><circle cx="1.2" cy="3.6" r="0.82"/><circle cx="3.6" cy="1.2" r="0.82"/><circle cx="3.6" cy="3.6" r="0.82"/></g></pattern>` };
}


// ------------------------------------------------------------------ helpers every source can call as ${H.name(...)}
const r2 = n => +(+n).toFixed(2);
/** ellipse as a Bezier path (stipples can't flatten arcs) */
const E = (cx, cy, rx, ry) => { const k = 0.5523; return `M${r2(cx - rx)} ${r2(cy)} C${r2(cx - rx)} ${r2(cy - ry * k)} ${r2(cx - rx * k)} ${r2(cy - ry)} ${r2(cx)} ${r2(cy - ry)} C${r2(cx + rx * k)} ${r2(cy - ry)} ${r2(cx + rx)} ${r2(cy - ry * k)} ${r2(cx + rx)} ${r2(cy)} C${r2(cx + rx)} ${r2(cy + ry * k)} ${r2(cx + rx * k)} ${r2(cy + ry)} ${r2(cx)} ${r2(cy + ry)} C${r2(cx - rx * k)} ${r2(cy + ry)} ${r2(cx - rx)} ${r2(cy + ry * k)} ${r2(cx - rx)} ${r2(cy)} Z`; };
export const H = {
  E,
  /** dotted floor pool under a foot, leg or base: light ellipse + darker core */
  pool: (cx, cy, rx) => `<stip d="${E(cx, cy, rx, 5.6)}" t="flat 0.19"/><stip d="${E(cx, cy - 0.2, rx * 0.58, 3.4)}" t="flat 0.36"/>`,
  /** side-view sneaker: paper upper, black sole, lace ticks. (x,y) = heel bottom; dir 1 = toe right, -1 = toe left; sc ~0.6 */
  shoe: (x, y, dir, sc) => `<g transform="translate(${x} ${y}) scale(${dir * sc} ${sc}) translate(-326 -257.6)"><path d="M328 254 C326 246 328 238 334 236 L346 234 C352 235 360 238 367 241 C376 243 383 246 383 251 C383 254 381 255 378 255 L330 255 C328 255 328 255 328 254 Z" fill="#f4f1ea"/><path d="M326 253 H383 C386 253 386 256 383 257.6 H329 C326 257.6 325 255 326 253 Z" fill="#111"/><path d="M352 239.4 L355.6 235.8 M358 241.6 L361.6 238.2 M372 245 C375 247.6 376 250.6 375 254" stroke-width="1.6"/></g>`,
  /** limb or sleeve as the toned-shape triple: paper fill, optional dots, and the two side lines only (ends left open).
   *  P = joint points [[x,y],...] (shoulder..wrist, hip..ankle), W = half-widths per point, t = tone string, '' or 'black' */
  limb: (P, W, t = '') => {
    const L = [], R = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      L.push([P[i][0] - dy * W[i], P[i][1] + dx * W[i]]); R.push([P[i][0] + dy * W[i], P[i][1] - dx * W[i]]);
    }
    const cr = Q => { let o = `M${r2(Q[0][0])} ${r2(Q[0][1])}`;
      for (let i = 0; i < Q.length - 1; i++) { const p0 = Q[Math.max(0, i - 1)], p1 = Q[i], p2 = Q[i + 1], p3 = Q[Math.min(Q.length - 1, i + 2)];
        o += ` C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`; }
      return o; };
    const fill = cr(L) + ' L' + cr(R.slice().reverse()).slice(1) + ' Z';
    if (t === 'black') return `<path d="${fill}" fill="#111" stroke="#111"/>`;
    return `<path d="${fill}" fill="#f4f1ea" stroke="none"/>` + (t ? `<stip d="${fill}" t="${t}"/>` : '') + `<path d="${cr(L)} ${cr(R)}"/>`;
  },
  /** profile head from the shipped cards, facing right (dir 1) or left (dir -1), face about 58 x 58 local units.
   *  hair: markup in the head's local frame drawn over the skull (H.hair.* presets or your own); back: drawn behind the face.
   *  eye: 'dot' | 'closed'; smile: true (arc) | false (flat line) */
  head: (x, y, rot, dir, hair = '', { back = '', eye = 'dot', smile = true } = {}) =>
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${dir} 1)">` + back +
    `<path d="M-16 18 C-26 0 -20 -24 4 -26 C20 -26 23 -10 22 -1 L31 9 Q29 11.5 23 12 C24 18 23 24 17 28 C11 32 0 31 -8 24 Z" fill="#f4f1ea" stroke="none"/>` +
    `<path d="M18 -14 C20 -10 22 -6 22 -1 L31 9 Q29 11.5 23 12 C24 18 23 24 17 28 C11 32 2 31 -4 26"/>` + hair +
    `<path d="M-4 5 C-11 2 -13 13 -5 15 M-7 7 C-9 9 -8 11 -6 11" fill="#f4f1ea" stroke-width="1.6"/>` +
    (eye === 'dot' ? `<circle cx="17" cy="2" r="1.9" fill="#111" stroke="none"/>` : `<path d="M13.6 2.4 Q17 4.6 20.4 2.2" stroke-width="1.6"/>`) +
    `<path d="M11 -6 Q15.5 -8.6 20 -6.4" stroke-width="1.7"/>` + (smile ? `<path d="M15 18 Q19 21.6 23.4 18.2" stroke-width="1.8"/>` : `<path d="M15.6 19.4 H22.6" stroke-width="1.7"/>`) + '</g>',
  /** hair presets in the head's local frame, taken from the shipped cards */
  hair: {
    /** dotted curly crop (tone 0.38 reads as dark or grey hair) */
    curly: (t = 'flat 0.38') => { const d = 'M18 -14 C22 -18 26 -24 24 -30 C22 -36 12 -38 4 -36 C-4 -40 -16 -36 -20 -30 C-28 -26 -30 -16 -27 -8 C-30 -2 -28 8 -22 12 C-18 15 -13 15 -11 11 C-12 4 -10 -2 -6 -6 C0 -10 8 -12 18 -14 Z';
      return `<path d="${d}" fill="#f4f1ea" stroke="none"/><stip d="${d}" t="${t}"/><path d="${d}"/><path d="M4 -34 C2 -26 -2 -20 -8 -16 M-12 -32 C-16 -24 -18 -16 -18 -8" stroke-width="1.3"/><path d="M22 -27 C28 -27 31 -21 27 -18 C24 -16 22 -19 24 -21" stroke-width="1.6"/>`; },
    /** solid black hair to the jaw with a top bun */
    bun: () => `<path d="M20 -14 C18 -24 8 -30 -4 -29 C-18 -28 -27 -16 -26 -2 C-25 8 -21 16 -14 21 C-11 22 -9 20 -9 17 C-10 10 -9 2 -6 -4 C0 -10 10 -13 20 -14 Z" fill="#111"/><circle cx="-14" cy="-32" r="10" fill="#111"/><path d="M-9 -24 C-7 -23 -5 -23 -3 -24" stroke="#f4f1ea" stroke-width="1.3"/><path d="M-24 10 C-27 16 -26 22 -22 26" stroke-width="1.4"/>`,
    /** the same black hair tied in a ponytail that hangs behind the neck */
    ponytail: () => `<path d="M-18 -20 C-32 -24 -42 -10 -40 6 C-39 16 -33 24 -28 22 C-32 12 -30 -2 -20 -10 Z" fill="#111"/><path d="M-20 -21 L-17 -13" stroke="#f4f1ea" stroke-width="1.6"/><path d="M20 -14 C18 -24 8 -30 -4 -29 C-18 -28 -27 -16 -26 -2 C-25 6 -22 12 -17 15 C-14 15 -12 12 -11 9 C-11 2 -9 -2 -6 -5 C0 -10 10 -13 20 -14 Z" fill="#111"/><path d="M-12 -26 C-6 -27 0 -27 5 -26" stroke="#f4f1ea" stroke-width="1.3"/>`,
    /** long straight black hair: pass .back as the head's back option and .front as its hair */
    long: { back: '<path d="M18 -14 C22 -26 12 -34 -2 -34 C-18 -34 -30 -22 -30 -6 C-30 10 -30 26 -32 40 C-26 44 -16 44 -10 40 C-12 30 -12 20 -10 12 Z" fill="#111"/>',
      front: '<path d="M20 -13 C22 -26 12 -34 -2 -34 C-18 -34 -30 -22 -30 -6 C-30 10 -30 26 -32 40 C-26 44 -16 44 -10 40 C-12 30 -12 20 -10 12 C-8 4 -8 -2 -4 -6 C2 -12 10 -15 15 -14 C18 -14 20 -15 20 -15.6 Z" fill="#111"/><path d="M-20 -24 C-24 -10 -24 10 -22 32 M-6 -30 C2 -26 10 -20 14 -12" stroke="#f4f1ea" stroke-width="1.2"/>' },
    /** round glasses (one lens in profile) with the arm to the ear; add after any hair */
    glasses: () => '<circle cx="17" cy="1.6" r="5.6" stroke-width="1.6"/><path d="M11.4 0.6 L-2 2.6" stroke-width="1.5"/>',
  },
  /** typing / resting hand: local x runs wrist -> knuckles, +y toward the viewer; four outlined fingers bend at the middle
   *  joint toward +y (onto keys or a surface). thumb=true draws the thumb on the -y edge. rot in degrees, sc ~1.1-1.25 */
  hand: (x, y, rot, sc, thumb) => {
    const f = n => +n.toFixed(2);
    const fin = (bx, by, th, L, hw, bend) => {
      const r = d => d * Math.PI / 180, c1 = [Math.cos(r(th)), Math.sin(r(th))], t2 = th + bend, c2 = [Math.cos(r(t2)), Math.sin(r(t2))];
      const P0 = [bx, by], P1 = [bx + c1[0] * L * .55, by + c1[1] * L * .55], P2 = [P1[0] + c2[0] * L * .45, P1[1] + c2[1] * L * .45];
      const n1 = [-c1[1], c1[0]], n2 = [-c2[1], c2[0]], nm = [(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2];
      const A = (p, n, s) => `${f(p[0] + n[0] * hw * s)} ${f(p[1] + n[1] * hw * s)}`;
      const tip = [P2[0] + c2[0] * hw * 1.1, P2[1] + c2[1] * hw * 1.1];
      return `<path d="M${A(P0, n1, -1)} L${A(P1, nm, -1)} L${A(P2, n2, -1)} Q${f(tip[0] + n2[0] * -hw * .9)} ${f(tip[1] + n2[1] * -hw * .9)} ${f(tip[0])} ${f(tip[1])} Q${f(tip[0] + n2[0] * hw * .9)} ${f(tip[1] + n2[1] * hw * .9)} ${A(P2, n2, 1)} L${A(P1, nm, 1)} L${A(P0, n1, 1)}" fill="#f4f1ea" stroke-width="1.5"/>`;
    };
    let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">`;
    g += `<path d="M0 -7.6 C6 -9 11 -10 16 -9.6 L17 9 C12 9.6 6 9 0 7.6 Z" fill="#f4f1ea" stroke="none"/>`;
    if (thumb) g += `<path d="M4 -7.4 C8 -10.6 13 -12.8 18.6 -13.6 C21.8 -14 22.8 -11 20.4 -9.8 C16.6 -8.2 13 -7.6 10 -7.4" fill="#f4f1ea" stroke-width="1.6"/>`;
    g += fin(15, -6.2, -7, 18.5, 2, 26) + fin(16, -2.2, -2, 20.5, 2.05, 28) + fin(16, 1.9, 3, 19, 2, 28) + fin(14.6, 5.9, 8, 15, 1.85, 26);
    g += `<path d="M0 -7.6 C6 -9 11 -10 15.4 -9.4 M0 7.6 C6 9 10 9.6 14 8.8" stroke-width="1.8"/><path d="M9 -3 C10.6 -1.6 11.4 0.4 11.4 2.6" stroke-width="1.1"/>`;
    return g + '</g>';
  },
};

/** replaces every ${expr} (braces inside expr may nest) with ev(expr) */
function interp(src, ev) {
  let out = '', i = 0;
  for (;;) {
    const j = src.indexOf('${', i); if (j < 0) return out + src.slice(i);
    let d = 1, k = j + 2; while (k < src.length && d) { if (src[k] === '{') d++; else if (src[k] === '}') d--; k++; }
    if (d) throw new Error('unclosed ${ at ' + src.slice(j, j + 40));
    out += src.slice(i, j) + String(ev(src.slice(j + 2, k - 1))); i = k;
  }
}

export function compile(src, P, seed = 23) {
  src = src.replace(/<!--[\s\S]*?-->\s*/g, m => (m.includes('DEFS') ? m : ''));
  const g = src.match(/<gen>([\s\S]*?)<\/gen>\s*/);
  src = src.replace(/<gen>[\s\S]*?<\/gen>\s*/, '');
  src = new Function('src', 'H', 'interp', (g ? g[1] : '') + '\nreturn interp(src, e => eval(e));')(src, H, interp);
  const defs = []; let k = 0, seedG = seed * 101, dots = 0;
  src = src.replace(/<stip\s([^>]*?)\/>/g, (m, attrs) => {
    const A = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
    const id = `${P}k${++k}`; const s = stipple(A, (seedG += 7919)); dots += s.n;
    if (A.clip === '0') return `<path d="${s.d}" fill="#111" stroke="none"/>`;
    defs.push(`<clipPath id="${id}"><path d="${A.d}"/></clipPath>`);
    return `<path clip-path="url(#${id})" d="${s.d}" fill="#111" stroke="none"/>`;
  });
  src = src.replace(/@P@/g, P);
  const T = tiles(P), used = Object.entries(T).filter(([n]) => src.includes(`url(#${P}${n})`)).map(([, v]) => v);
  if (!src.includes('<!--DEFS-->')) throw new Error('source needs <!--DEFS--> inside <defs>');
  src = src.replace('<!--DEFS-->', [...used, wobble(P, seed), ...defs].join('\n'));
  const bad = [...src.matchAll(/\sid="([^"]*)"/g)].map(m => m[1]).filter(i => !i.startsWith(P));
  return { svg: src, stips: k, dots, bad };
}

// ------------------------------------------------------------------ CLI
const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain && args[0] === 'demo') {
  const out = args[1] || 'halftone-demo.svg';
  const sw = (x, y, t, label) => `<path d="M${x} ${y} H${x + 70} V${y + 50} H${x} Z" fill="#f4f1ea" stroke="none"/><stip d="M${x} ${y} H${x + 70} V${y + 50} H${x} Z" t="${t}"/><path d="M${x} ${y} H${x + 70} V${y + 50} H${x} Z"/>` +
    `<text x="${x}" y="${y + 66}" font-family="ui-monospace, monospace" font-size="11" fill="#111" stroke="none">${label}</text>`;
  const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360"><rect id="@P@paper" width="480" height="360" fill="#f4f1ea"/><defs><!--DEFS--></defs>
<g id="@P@art" filter="url(#@P@wob)" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
${sw(30, 40, 'flat 0.12', '0.12')}${sw(120, 40, 'flat 0.19', '0.19 light')}${sw(210, 40, 'flat 0.28', '0.28')}${sw(300, 40, 'flat 0.36', '0.36 mid')}${sw(390, 40, 'flat 0.52', '0.52 too dark')}
${sw(30, 150, 'lin 30 150 0.06 100 200 0.38', 'lin ramp')}${sw(120, 150, 'rad 155 175 40 0.36 0.06', 'rad')}${sw(210, 150, 'flat 0.24; noise 0.25 10', 'noise')}
<path d="M300 150 H370 V200 H300 Z" fill="url(#@P@dl)"/><path d="M390 150 H460 V200 H390 Z" fill="url(#@P@dm)"/>
<text x="300" y="216" font-family="ui-monospace, monospace" font-size="11" fill="#111" stroke="none">tile dl</text><text x="390" y="216" font-family="ui-monospace, monospace" font-size="11" fill="#111" stroke="none">tile dm</text>
<path d="M40 300 C90 296 160 302 220 299 M250 300 L300 299" stroke-width="2"/>
<path d="M60 255 C80 236 120 240 136 262 C150 280 130 296 100 296 C70 296 48 280 60 255 Z" fill="#f4f1ea" stroke="none"/>
<stip d="M60 255 C80 236 120 240 136 262 C150 280 130 296 100 296 C70 296 48 280 60 255 Z" t="lin 60 250 0.08 120 296 0.36"/>
<path d="M60 255 C80 236 120 240 136 262 C150 280 130 296 100 296" />
<path d="M160 296 C170 270 190 250 214 246 C224 268 222 286 210 296 Z" fill="#111"/>
</g></svg>`;
  const r = compile(src, 'hd-', 23);
  fs.writeFileSync(out, r.svg);
  console.log('wrote', out, 'stips', r.stips, 'dots', r.dots, r.bad.length ? 'BAD IDS ' + r.bad : '');
} else if (isMain) {
  const prefix = opt('--prefix'), seed = +opt('--seed', 23);
  const [inp, out] = args;
  if (!inp || !out || !prefix) { console.error('usage: node halftone.mjs card.src.svg card.svg --prefix xx- [--seed 23]  |  node halftone.mjs demo out.svg'); process.exit(1); }
  const r = compile(fs.readFileSync(inp, 'utf8'), prefix, seed);
  fs.writeFileSync(out, r.svg);
  console.log('wrote', out, `${(Buffer.byteLength(r.svg) / 1024).toFixed(0)} KB`, 'stips', r.stips, 'dots', r.dots);
  if (r.bad.length) { console.log('ids without the prefix:', r.bad.join(', ')); process.exit(1); }
}
