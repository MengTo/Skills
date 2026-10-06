// Heavy condensed wordmark for vintage emblem cards, built as filled paths (no fonts, no dependencies).
//
//   node scripts/wordmark.mjs "RELEASE DAY" --tagline "TAG • SHIP • REST" --prefix rd-
//        prints the <g id="rd-wordmark"> group, the <text id="rd-tagline"> line and the lockup numbers
//   node scripts/wordmark.mjs "OPEN SOURCE" --top 258 --max-width 280 --cx 240
//   node scripts/wordmark.mjs --sheet alphabet.svg      writes every glyph on a cream card, for checking
//
//   import { wordmark, taglineText } from './wordmark.mjs'
//
// Glyphs are authored at cap height 56 (stem 12.2, bar 9.4) and drawn with fill AND a 2.2 stroke in the
// ink colour: the stroke rounds every corner, and the geometry is inset by half of it so the final ink
// edges land on the authored numbers. Round letters are offset from a centre line in a y-stretched space
// and squashed back, so horizontals come out thinner (9.4) than verticals (12.2), like a real condensed face.
// Supported: A-Z, 0-9, space, - . ! '
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const INK = '#1f2b25', CREAM = '#f8f0e3';
const f = n => (Math.round(n * 100) / 100).toString();
const PI = Math.PI, rad = d => d * PI / 180;

export const CAP = 56, V = 12.2, HB = 9.4, ROUND = 2.2;
const dU = (V - ROUND) / 2;            // half the stroke of a round letter, before squash
const K = (HB - ROUND) / (V - ROUND);  // y squash: horizontals thinner than verticals
const inset = ROUND / 2;

// ---------- construction ----------
const off = (s, side) => {
  if (s.t === 'L') {
    const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L = Math.hypot(dx, dy);
    const n = [-dy / L, dx / L];
    return { p0: [s.a[0] + n[0] * side, s.a[1] + n[1] * side], p1: [s.b[0] + n[0] * side, s.b[1] + n[1] * side] };
  }
  const dir = Math.sign(s.a1 - s.a0);
  const r = s.r - dir * side;
  const P = a => [s.c[0] + r * Math.cos(a), s.c[1] + r * Math.sin(a)];
  return { p0: P(s.a0), p1: P(s.a1), r, sweep: dir > 0 ? 1 : 0 };
};
const S = p => `${f(p[0])} ${f(p[1] * K)}`;
// open centre line -> filled band
function outline(segs, d = dU) {
  const A = segs.map(s => off(s, d)), B = segs.map(s => off(s, -d));
  let p = `M${S(A[0].p0)}`;
  A.forEach(o => { p += o.r ? ` A${f(o.r)} ${f(o.r * K)} 0 0 ${o.sweep} ${S(o.p1)}` : ` L${S(o.p1)}`; });
  p += ` L${S(B[B.length - 1].p1)}`;
  for (let i = B.length - 1; i >= 0; i--) { const o = B[i]; p += o.r ? ` A${f(o.r)} ${f(o.r * K)} 0 0 ${1 - o.sweep} ${S(o.p0)}` : ` L${S(o.p0)}`; }
  return p + 'Z';
}
// closed centre-line loop -> outer + inner contour (opposite winding keeps the counter open)
function ring(segs, d = dU) {
  const A = segs.map(s => off(s, d)), B = segs.map(s => off(s, -d));
  let p = `M${S(A[0].p0)}`;
  A.forEach(o => { p += o.r ? ` A${f(o.r)} ${f(o.r * K)} 0 0 ${o.sweep} ${S(o.p1)}` : ` L${S(o.p1)}`; });
  p += `Z M${S(B[B.length - 1].p1)}`;
  for (let i = B.length - 1; i >= 0; i--) { const o = B[i]; p += o.r ? ` A${f(o.r)} ${f(o.r * K)} 0 0 ${1 - o.sweep} ${S(o.p0)}` : ` L${S(o.p0)}`; }
  return p + 'Z';
}
const arc = (cx, cy, r, a0, a1) => ({ t: 'A', c: [cx, cy], r, a0: rad(a0), a1: rad(a1) });   // degrees, y down: 90 = down, 270 = up
const ln = (x0, y0, x1, y1) => ({ t: 'L', a: [x0, y0], b: [x1, y1] });
const yu = yf => yf / K;               // final y -> stretched construction y
// polygon authored in final coordinates, inset by half the rounding stroke
function poly(pts) {
  let A = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; A += a[0] * b[1] - b[0] * a[1]; }
  const sg = A > 0 ? 1 : -1, n = pts.length, lines = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nn = [-d[1] * sg, d[0] * sg];
    lines.push({ p: [a[0] + nn[0] * inset, a[1] + nn[1] * inset], d });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const l1 = lines[(i - 1 + n) % n], l2 = lines[i];
    const cr = l1.d[0] * l2.d[1] - l1.d[1] * l2.d[0];
    const w = [l2.p[0] - l1.p[0], l2.p[1] - l1.p[1]];
    const t = (w[0] * l2.d[1] - w[1] * l2.d[0]) / cr;
    out.push([l1.p[0] + l1.d[0] * t, l1.p[1] + l1.d[1] * t]);
  }
  return 'M' + out.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + 'Z';
}
const rect = (x0, y0, x1, y1) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
const stem = (x = 0) => rect(x, 0, x + V, CAP);
// diagonal stroke cut flat at y0 and y1; t = thickness measured square to the stroke
function diag(x0, y0, x1, y1, t = V * 0.94) {
  const ang = Math.atan2(x1 - x0, y1 - y0), w = t / Math.cos(ang) / 2;
  return poly([[x0 - w, y0], [x0 + w, y0], [x1 + w, y1], [x1 - w, y1]]);
}
const halfW = (x0, x1, t = V * 0.94) => t / Math.cos(Math.atan2(x1 - x0, CAP)) / 2;

// frame for round letters of width W. cr() clamps a corner radius to half the inner width: a bigger radius
// makes the straight run negative and the band folds over itself (cream slivers inside the glyph).
const fr = W => ({ xL: inset + dU, xR: W - inset - dU, yT: yu(inset) + dU, yB: yu(CAP - inset) - dU });
const cr = (R, x0, x1) => Math.min(R, (x1 - x0) / 2 - 0.15);

export const LET = {
  A(W = 34) {
    const wd = halfW(W / 2, V * 0.5), xa = W / 2 - 2.2;
    return [diag(xa, 0, wd, CAP), diag(W - xa, 0, W - wd, CAP), rect(W * 0.24, CAP * 0.62, W * 0.76, CAP * 0.62 + HB * 0.92)];
  },
  B(W = 31) {
    const { xL: xS, xR, yT, yB } = fr(W), xR1 = xR - 1.6, yM = yu(CAP * 0.47), R1 = 7.6, R2 = 8.4;
    return [stem(),
      outline([ln(xS, yT, xR1 - R1, yT), arc(xR1 - R1, yT + R1, R1, -90, 0), ln(xR1, yT + R1, xR1, yM - R1), arc(xR1 - R1, yM - R1, R1, 0, 90), ln(xR1 - R1, yM, xS, yM)]),
      outline([ln(xS, yM, xR - R2, yM), arc(xR - R2, yM + R2, R2, -90, 0), ln(xR, yM + R2, xR, yB - R2), arc(xR - R2, yB - R2, R2, 0, 90), ln(xR - R2, yB, xS, yB)])];
  },
  C(W = 31) {
    const { xL, xR, yT, yB } = fr(W), R = 8.8;
    return [outline([ln(xR, yu(CAP * 0.31), xR, yT + R), arc(xR - R, yT + R, R, 0, -90), ln(xR - R, yT, xL + R, yT), arc(xL + R, yT + R, R, -90, -180),
      ln(xL, yT + R, xL, yB - R), arc(xL + R, yB - R, R, 180, 90), ln(xL + R, yB, xR - R, yB), arc(xR - R, yB - R, R, 90, 0), ln(xR, yB - R, xR, yu(CAP * 0.69))])];
  },
  D(W = 32) {
    const { xL: xS, xR, yT, yB } = fr(W), R = 10;
    return [stem(), outline([ln(xS, yT, xR - R, yT), arc(xR - R, yT + R, R, -90, 0), ln(xR, yT + R, xR, yB - R), arc(xR - R, yB - R, R, 0, 90), ln(xR - R, yB, xS, yB)])];
  },
  E(W = 26) {
    const m0 = CAP * 0.405, m1 = m0 + HB;
    return [poly([[0, 0], [W, 0], [W, 10], [V, 10], [V, m0], [W - 2.5, m0], [W - 2.5, m1], [V, m1], [V, CAP - 10], [W, CAP - 10], [W, CAP], [0, CAP]])];
  },
  F(W = 25) {
    const m0 = CAP * 0.405, m1 = m0 + HB;
    return [poly([[0, 0], [W, 0], [W, 10], [V, 10], [V, m0], [W - 2.5, m0], [W - 2.5, m1], [V, m1], [V, CAP], [0, CAP]])];
  },
  G(W = 32) {
    const { xL, xR, yT, yB } = fr(W), R = 8.8, bar = CAP * 0.455;
    return [outline([ln(xR, yu(CAP * 0.30), xR, yT + R), arc(xR - R, yT + R, R, 0, -90), ln(xR - R, yT, xL + R, yT), arc(xL + R, yT + R, R, -90, -180),
      ln(xL, yT + R, xL, yB - R), arc(xL + R, yB - R, R, 180, 90), ln(xL + R, yB, xR - R, yB), arc(xR - R, yB - R, R, 90, 0), ln(xR, yB - R, xR, yu(bar + HB / 2))]),
      rect(W * 0.5, bar, W, bar + HB)];
  },
  H(W = 32) { const m0 = CAP * 0.405; return [poly([[0, 0], [V, 0], [V, m0], [W - V, m0], [W - V, 0], [W, 0], [W, CAP], [W - V, CAP], [W - V, m0 + HB], [V, m0 + HB], [V, CAP], [0, CAP]])]; },
  I() { return [stem()]; },
  J(W = 28) {
    const { xL, xR, yB } = fr(W), R = cr(8.6, xL, xR);
    return [outline([ln(xR, yu(inset), xR, yB - R), arc(xR - R, yB - R, R, 0, 90), ln(xR - R, yB, xL + R, yB), arc(xL + R, yB - R, R, 90, 180), ln(xL, yB - R, xL, yu(CAP * 0.66))])];
  },
  K(W = 33) {
    const wu = halfW(W, V), wl = halfW(V + 3, W);
    return [stem(), diag(W - wu, 0, V + 2.4, CAP * 0.64, V * 0.92), diag(V + 6, CAP * 0.40, W - wl, CAP, V * 0.98)];
  },
  L(W = 25) { return [poly([[0, 0], [V, 0], [V, CAP - 10], [W, CAP - 10], [W, CAP], [0, CAP]])]; },
  M(W = 42) {
    const t = V * 0.86;
    return [stem(), stem(W - V), diag(V * 0.62, 0, W / 2, CAP * 0.80, t), diag(W - V * 0.62, 0, W / 2, CAP * 0.80, t)];
  },
  N(W = 35, hw = 12.4) {
    const xi = V, xo = W - V, m = (xo - xi + hw) / CAP;
    const yR = (xo - xi) / m, yL = CAP - (xo - xi) / m;
    return [poly([[0, 0], [xi, 0], [xo, yR], [xo, 0], [W, 0], [W, CAP], [xo, CAP], [xi, yL], [xi, CAP], [0, CAP]])];
  },
  O(W = 32) {
    const { xL, xR, yT, yB } = fr(W), R = 9;
    return [ring([ln(xL + R, yT, xR - R, yT), arc(xR - R, yT + R, R, -90, 0), ln(xR, yT + R, xR, yB - R), arc(xR - R, yB - R, R, 0, 90),
      ln(xR - R, yB, xL + R, yB), arc(xL + R, yB - R, R, 90, 180), ln(xL, yB - R, xL, yT + R), arc(xL + R, yT + R, R, 180, 270)])];
  },
  P(W = 31) {
    const { xL: xS, xR, yT } = fr(W), yBw = yu(CAP * 0.60) - dU, R = 8.6;
    return [stem(), outline([ln(xS, yT, xR - R, yT), arc(xR - R, yT + R, R, -90, 0), ln(xR, yT + R, xR, yBw - R), arc(xR - R, yBw - R, R, 0, 90), ln(xR - R, yBw, xS, yBw)])];
  },
  Q(W = 32) { return [...LET.O(W), poly([[W * 0.52, CAP * 0.70], [W * 0.52 + V * 0.95, CAP * 0.70], [W + 0.5, CAP + 3.5], [W + 0.5 - V * 0.95, CAP + 3.5]])]; },
  R(W = 32) {
    const { xL: xS, xR, yT } = fr(W), yBw = yu(CAP * 0.575) - dU, R = 8.6, lw = 12.6, x0 = 13.2;
    return [stem(), outline([ln(xS, yT, xR - R, yT), arc(xR - R, yT + R, R, -90, 0), ln(xR, yT + R, xR, yBw - R), arc(xR - R, yBw - R, R, 0, 90), ln(xR - R, yBw, xS, yBw)]),
      poly([[x0, CAP * 0.5], [x0 + lw, CAP * 0.5], [W, CAP], [W - lw, CAP]])];
  },
  S(W = 31) {
    const { xL, xR, yT, yB } = fr(W), yM = yu(CAP * 0.485), R = 8.2, R2 = 8.6, tTop = yu(CAP * 0.30), tBot = yu(CAP * 0.70);
    return [outline([ln(xR, tTop, xR, yT + R), arc(xR - R, yT + R, R, 0, -90), ln(xR - R, yT, xL + R, yT), arc(xL + R, yT + R, R, -90, -180),
      ln(xL, yT + R, xL, yM - R), arc(xL + R, yM - R, R, 180, 90), ln(xL + R, yM, xR - R2, yM), arc(xR - R2, yM + R2, R2, -90, 0),
      ln(xR, yM + R2, xR, yB - R2), arc(xR - R2, yB - R2, R2, 0, 90), ln(xR - R2, yB, xL + R2, yB), arc(xL + R2, yB - R2, R2, 90, 180), ln(xL, yB - R2, xL, tBot)])];
  },
  T(W = 31) { const s0 = (W - V) / 2; return [poly([[0, 0], [W, 0], [W, 10], [s0 + V, 10], [s0 + V, CAP], [s0, CAP], [s0, 10], [0, 10]])]; },
  U(W = 32) {
    const { xL, xR, yB } = fr(W), R = 9;
    return [outline([ln(xL, yu(inset), xL, yB - R), arc(xL + R, yB - R, R, 180, 90), ln(xL + R, yB, xR - R, yB), arc(xR - R, yB - R, R, 90, 0), ln(xR, yB - R, xR, yu(inset))])];
  },
  V(W = 33) {
    const wd = halfW(0, W / 2);
    return [diag(wd, 0, W / 2 - 2.4, CAP), diag(W - wd, 0, W / 2 + 2.4, CAP)];
  },
  W(W = 48) {
    const t = V * 0.86, wd = halfW(0, W * 0.25, t), xb1 = W * 0.27, xb2 = W - xb1;
    return [diag(wd, 0, xb1 - 1, CAP, t), diag(W / 2 - 0.6, CAP * 0.14, xb1 + 1, CAP, t * 0.92), diag(W / 2 + 0.6, CAP * 0.14, xb2 - 1, CAP, t * 0.92), diag(W - wd, 0, xb2 + 1, CAP, t)];
  },
  X(W = 33) {
    const wd = halfW(0, W);
    return [diag(wd, 0, W - wd, CAP), diag(W - wd, 0, wd, CAP)];
  },
  Y(W = 33) {
    const wd = halfW(0, W / 2), my = CAP * 0.52;
    return [diag(wd, 0, W / 2 - 1.2, my + 2, V * 0.92), diag(W - wd, 0, W / 2 + 1.2, my + 2, V * 0.92), rect(W / 2 - V / 2, my - 2, W / 2 + V / 2, CAP)];
  },
  Z(W = 29) {
    const wd = halfW(W, 0);
    return [rect(0, 0, W, 10), rect(0, CAP - 10, W, CAP), diag(W - wd, 6, wd, CAP - 6)];
  },
  // digits
  0(W = 31) { return LET.O(W); },
  1(W = 22) { return [stem(W - V), poly([[W - V - 0.2, 0], [W - V + 3, 0], [W - V + 3, 12], [0.5, 19], [0.5, 9]])]; },
  2(W = 31) {
    const { xL, xR, yT } = fr(W), R = cr(8.6, xL, xR), wd = halfW(W, 0);
    return [outline([ln(xL, yu(CAP * 0.30), xL, yT + R), arc(xL + R, yT + R, R, 180, 270), ln(xL + R, yT, xR - R, yT), arc(xR - R, yT + R, R, 270, 360), ln(xR, yT + R, xR, yu(CAP * 0.40))]),
      diag(W - wd - 0.2, CAP * 0.34, wd + 0.4, CAP - 6, V * 0.95), rect(0, CAP - 10, W, CAP)];
  },
  3(W = 31) {
    const { xL, xR, yT, yB } = fr(W), xR1 = xR - 1.4, yM = yu(CAP * 0.47), R = cr(8, xL, xR1), R2 = cr(8.6, xL, xR);
    return [outline([ln(xL, yu(CAP * 0.27), xL, yT + R), arc(xL + R, yT + R, R, 180, 270), ln(xL + R, yT, xR1 - R, yT), arc(xR1 - R, yT + R, R, 270, 360),
      ln(xR1, yT + R, xR1, yM - R), arc(xR1 - R, yM - R, R, 0, 90), ln(xR1 - R, yM, xL + 7, yM)]),
      outline([ln(xL + 7, yM, xR - R2, yM), arc(xR - R2, yM + R2, R2, -90, 0), ln(xR, yM + R2, xR, yB - R2), arc(xR - R2, yB - R2, R2, 0, 90),
        ln(xR - R2, yB, xL + R2, yB), arc(xL + R2, yB - R2, R2, 90, 180), ln(xL, yB - R2, xL, yu(CAP * 0.73))])];
  },
  4(W = 31) {
    const sx = W - V - 2, bar = CAP * 0.64, wd = halfW(sx, 0);
    return [rect(sx, 0, sx + V, CAP), diag(sx + wd - 0.4, 0, wd, bar + HB - 1, V * 0.9), rect(0, bar, W, bar + HB)];
  },
  5(W = 31) {
    const { xL, xR, yB } = fr(W), yM = yu(CAP * 0.40), R = cr(8.6, xL, xR);
    return [rect(0, 0, W, 10), rect(0, 0, V, CAP * 0.48),
      outline([ln(xL + 4, yM, xR - R, yM), arc(xR - R, yM + R, R, -90, 0), ln(xR, yM + R, xR, yB - R), arc(xR - R, yB - R, R, 0, 90),
        ln(xR - R, yB, xL + R, yB), arc(xL + R, yB - R, R, 90, 180), ln(xL, yB - R, xL, yu(CAP * 0.75))])];
  },
  6(W = 31) {
    const { xL, xR, yT, yB } = fr(W), R = cr(8.6, xL, xR), yM = yu(CAP * 0.42) + dU;
    return [outline([ln(xR, yu(CAP * 0.25), xR, yT + R), arc(xR - R, yT + R, R, 0, -90), ln(xR - R, yT, xL + R, yT), arc(xL + R, yT + R, R, -90, -180), ln(xL, yT + R, xL, yB - R)]),
      ring([ln(xL + R, yM, xR - R, yM), arc(xR - R, yM + R, R, -90, 0), ln(xR, yM + R, xR, yB - R), arc(xR - R, yB - R, R, 0, 90),
        ln(xR - R, yB, xL + R, yB), arc(xL + R, yB - R, R, 90, 180), ln(xL, yB - R, xL, yM + R), arc(xL + R, yM + R, R, 180, 270)])];
  },
  7(W = 28) { const wd = halfW(W, W * 0.4); return [rect(0, 0, W, 10), diag(W - wd, 6, W * 0.36, CAP, V * 0.98)]; },
  8(W = 31) {
    const { xL, xR, yT, yB } = fr(W), a = xL + 1.2, b = xR - 1.2, yM = yu(CAP * 0.47), R = cr(8, a, b), R2 = cr(8.6, xL, xR);
    const loop = (x0, x1, y0, y1, r) => ring([ln(x0 + r, y0, x1 - r, y0), arc(x1 - r, y0 + r, r, -90, 0), ln(x1, y0 + r, x1, y1 - r), arc(x1 - r, y1 - r, r, 0, 90),
      ln(x1 - r, y1, x0 + r, y1), arc(x0 + r, y1 - r, r, 90, 180), ln(x0, y1 - r, x0, y0 + r), arc(x0 + r, y0 + r, r, 180, 270)]);
    return [loop(a, b, yT, yM, R), loop(xL, xR, yM, yB, R2)];
  },
  9(W = 31) {
    const { xL, xR, yT, yB } = fr(W), R = cr(8.6, xL, xR), yM = yu(CAP * 0.58) - dU;
    return [outline([ln(xL, yu(CAP * 0.75), xL, yB - R), arc(xL + R, yB - R, R, 180, 90), ln(xL + R, yB, xR - R, yB), arc(xR - R, yB - R, R, 90, 0), ln(xR, yB - R, xR, yT + R)]),
      ring([ln(xL + R, yT, xR - R, yT), arc(xR - R, yT + R, R, -90, 0), ln(xR, yT + R, xR, yM - R), arc(xR - R, yM - R, R, 0, 90),
        ln(xR - R, yM, xL + R, yM), arc(xL + R, yM - R, R, 90, 180), ln(xL, yM - R, xL, yT + R), arc(xL + R, yT + R, R, 180, 270)])];
  },
  '-'(W = 17) { return [rect(0, CAP * 0.46, W, CAP * 0.46 + HB)]; },
  '.'() { return [rect(0, CAP - V * 0.95, V, CAP)]; },
  '!'() { return [rect(0, 0, V, CAP * 0.70), rect(0, CAP - V * 0.95, V, CAP)]; },
  "'"() { return [rect(0, 0, V * 0.8, CAP * 0.30)]; },
};
export const WID = { A: 34, B: 31, C: 31, D: 32, E: 26, F: 25, G: 32, H: 32, I: V, J: 28, K: 33, L: 25, M: 42, N: 35, O: 32, P: 31, Q: 32, R: 32, S: 31, T: 31,
  U: 32, V: 33, W: 48, X: 33, Y: 33, Z: 29, 0: 31, 1: 22, 2: 31, 3: 31, 4: 31, 5: 31, 6: 31, 7: 28, 8: 31, 9: 31, '-': 17, '.': V, '!': V, "'": V * 0.8 };
// side shapes for spacing. s stem, r round, o open (E right), d diagonal, t bar-only (T), l low arm (L right)
const SIDE = { A: 'dd', B: 'sr', C: 'ro', D: 'sr', E: 'so', F: 'so', G: 'rr', H: 'ss', I: 'ss', J: 'os', K: 'sd', L: 'sl', M: 'ss', N: 'ss', O: 'rr', P: 'so', Q: 'rr',
  R: 'sd', S: 'rr', T: 'tt', U: 'ss', V: 'dd', W: 'dd', X: 'dd', Y: 'dd', Z: 'tt', 0: 'rr', 1: 'ts', 2: 'rt', 3: 'rr', 4: 'ds', 5: 'sr', 6: 'rr', 7: 'td', 8: 'rr', 9: 'rr',
  '-': 'oo', '.': 'ss', '!': 'ss', "'": 'ss' };
const SB = { s: 4.6, r: 3.8, o: 2.8, d: 2.8, t: 2.6, l: 1.0 };   // side bearings: gap = right side of prev + left side of next
const SPACE = 9.5;

// word -> { svg, width, height } in card units; scale 0.66-0.95 is the shipped range
export function wordmark(word, cx, top, scale, tweak = {}) {
  word = word.toUpperCase();
  const items = []; let x = 0, prev = null, space = false;
  for (const ch of word) {
    if (ch === ' ') { space = true; continue; }
    if (!LET[ch]) throw new Error(`wordmark: no glyph for "${ch}"`);
    if (prev) x += SB[SIDE[prev][1]] + SB[SIDE[ch][0]] + (space ? SPACE : 0) + (tweak[prev + ch] || 0);
    items.push({ ch, x }); x += WID[ch]; prev = ch; space = false;
  }
  const w = x;
  let out = '';
  for (const it of items) for (const d of LET[it.ch]()) out += `<path transform="translate(${f(it.x)} 0)" d="${d}"/>`;
  return { svg: `<g transform="translate(${f(cx - w * scale / 2)} ${f(top)}) scale(${scale})">${out}</g>`, width: w * scale, height: CAP * scale, units: w };
}
// the serif tagline the examples use: Georgia bold 12.5, tracking 2, "•" separators, centred
export function taglineText(text, cx, base, id = 'tagline') {
  return `<text id="${id}" x="${f(cx)}" y="${f(base)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="12.5" letter-spacing="2" fill="${INK}">${text}</text>`;
}

// ---------- CLI ----------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args.splice(i, 2)[1]; };
  const sheet = opt('--sheet', null);
  if (sheet) {
    const rows = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', '0123456789 -.!', 'RELEASE DAY'];
    const gs = rows.map((r, i) => wordmark(r, 240, 24 + i * 82, Math.min(0.9, 440 / wordmark(r, 0, 0, 1).width)).svg).join('');
    fs.writeFileSync(sheet, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360"><rect width="480" height="360" fill="${CREAM}"/>` +
      `<g fill="${INK}" stroke="${INK}" stroke-width="${ROUND}" stroke-linejoin="round">${gs}</g></svg>\n`);
    console.log('wrote', sheet);
  } else {
    const prefix = opt('--prefix', ''), cx = +opt('--cx', 240), top = +opt('--top', 258), maxW = +opt('--max-width', 280);
    const tag = opt('--tagline', null), sc = opt('--scale', null);
    const word = args.join(' ');
    if (!word) { console.error('usage: node wordmark.mjs "WORD MARK" [--tagline "A • B • C"] [--prefix xx-] [--top 258] [--max-width 280] [--scale s] [--cx 240]'); process.exit(1); }
    const unit = wordmark(word, 0, 0, 1).width;
    const scale = sc ? +sc : Math.min(0.95, maxW / unit);
    const wm = wordmark(word, cx, top, +scale.toFixed(3));
    const tagBase = top + wm.height + 19;
    console.log(`<!-- wordmark "${word}": scale ${scale.toFixed(3)}, width ${wm.width.toFixed(1)}, cap ${wm.height.toFixed(1)}; tagline baseline ${tagBase.toFixed(1)}.`);
    console.log(`     lockup: translate(240 180) scale(0.95-0.97) translate(-240 -cy), cy = (sun top + ${tagBase.toFixed(1)}) / 2 -->`);
    console.log(`<g id="${prefix}wordmark" fill="${INK}" stroke="${INK}" stroke-width="${ROUND}" stroke-linejoin="round">${wm.svg}</g>`);
    if (tag) console.log(taglineText(tag, cx, tagBase, `${prefix}tagline`));
  }
}
