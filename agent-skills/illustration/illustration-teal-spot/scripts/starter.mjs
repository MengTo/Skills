// starter.mjs: a complete, minimal Teal spot card built with teal3d.mjs. Copy it AND teal3d.mjs into your
// work folder (the import is relative), rename the prefix, then replace the hero and extras with your subject.
//
//   node scripts/starter.mjs out.svg            (from the skill folder)
//
// It shows every technique the style needs, in the order they must be drawn:
//   1 floor shadow  2 hero solid  3 face details (streak, pill, LED)  4 recess  5 cast shadow + part sitting in the recess
//   6 hard shadows of floating extras, then the extras  7 centring  8 sparkles + arc ticks
import fs from 'node:fs';
import { C, mul, poly, frame, tiltFrame, rrect, circle, makeCam, card, spark, arc, bbox } from './teal3d.mjs';

const P = 'st-';                               // id prefix: change it per card
const cam = makeCam({ TH: -25, PH: 36, S: 0.9 }); // S scales the whole object; the examples use 0.84-1.05
const { pr, BOX, mat, solid, slab, recess, streak, floorShadow, castShadow, coin, liftShadow } = cam;
let scene = '';
const put = s => { scene += s + '\n'; };

// ---------- 1 + 2: the hero, a thick white tile with a teal right side ----------
const W = 230, D = 150, H = 34, R = 20;      // width (x), depth (y), height (z), corner radius
const ring = rrect(0, 0, W, D, R);
put(`<path id="${P}shadow" d="${poly(floorShadow(ring, H * 1.05))}" fill="${C.deep}"/>`);
const hero = solid({ fr: frame([0, 0, 0]), r0: ring, z0: 0, r1: ring, z1: H,
  col: { front: C.white, left: C.white, back: C.white, right: C.teal, up: C.white, down: C.white, cap: C.white } });
put(`<g id="${P}hero">${hero.svg}`);
// ---------- 3: face details ----------
put(streak([-W / 2 + 26, -D / 2, H - 8], [-W / 2 + 120, -D / 2, H - 8]));            // highlight streak under the top edge
const zr = H + 0.01, y0 = -D / 2 + 11;
put(`<path d="${poly(rrect(W / 2 - 60, y0, 28, 4.4, 2.2, 5).map(([x, y]) => pr([x, y, zr])))}" fill="${C.grey}"/>`);  // label pill
put(`<path d="${poly(rrect(W / 2 - 34, y0, 4.8, 4.8, 2.4, 5).map(([x, y]) => pr([x, y, zr])))}" fill="${C.teal}" stroke="${C.ink}" stroke-width="0.8"/>`); // LED
put('</g>');
// ---------- 4 + 5: a round well in the top with a teal button sitting in it ----------
const well = recess({ ring: circle(10, 12, 40, 72), z: H, depth: 10, id: `${P}well-clip` });
put(`<g id="${P}button">${well.svg}`);
// the button's own hard shadow on the well floor: a solid standing on a surface casts onto it (k = 0.6)
const btnPts = [...circle(10, 12, 30, 48).map(([x, y]) => [x, y, H - 10]), ...circle(10, 12, 30, 48).map(([x, y]) => [x, y, H + 8])];
put(well.onFloor(`<path d="${poly(castShadow(btnPts, H - 10))}" fill="${C.deep}"/>`));
const btn = solid({ fr: frame([10, 12, H - 10]), r0: circle(0, 0, 30, 72), z0: 0, r1: circle(0, 0, 30, 72), z1: 18, creases: false,
  col: { front: C.tealD, left: C.tealD, back: C.tealD, right: C.deep, up: C.teal, down: C.teal, cap: C.teal },
  extra: `<g transform="${mat(frame([10, 12, H + 8]), 0)}"><path d="M-9,1L-2.6,7.2L9.4,-6" fill="none" stroke="${C.white}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/></g>` });
put(btn.svg + '</g>');

// ---------- 6: floating extras, each preceded by its own hard shadow ----------
// a tilted UI card up and to the right
const cfr = frame([150, 70, 150], tiltFrame(28).map(v => mul(v, 0.9)));
const ui = `<rect x="-34" y="-16" width="16" height="16" rx="4" fill="${C.teal}" stroke="${C.ink}" stroke-width="1" vector-effect="non-scaling-stroke"/>` +
  `<rect x="-12" y="-14" width="40" height="4.4" rx="2.2" fill="${C.grey}"/><rect x="-12" y="-6.6" width="26" height="4.4" rx="2.2" fill="${C.grey}"/>` +
  `<rect x="-34" y="7" width="68" height="10" rx="5" fill="${C.pale}" stroke="${C.ink}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
const cr = rrect(0, 0, 84, 50, 8);
const cardS = solid({ fr: cfr, r0: cr, z0: 0, r1: cr, z1: 8, col: { front: C.pale, right: C.mid, left: C.pale, back: C.pale, up: C.pale, down: C.pale, cap: C.white },
  extra: `<g transform="${mat(cfr, 8)}">${ui}</g>` });
put(`<g id="${P}card">${liftShadow(cardS.hull)}${cardS.svg}</g>`);
// a coin down and to the left
const c1 = coin({ pos: [-150, -30, 70], rot: [56, -24, 0], R: 17,
  glyph: `<path d="M-6,0L-1.6,4.4L6.4,-4.4" fill="none" stroke="${C.deep}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` });
put(`<g id="${P}coin">${c1.shadow}${c1.svg}</g>`);

// ---------- 7 + 8: centre on the card, then sparkles and arc ticks ----------
const cb = bbox(cardS.hull), ob = bbox(c1.hull);
const out = card({ prefix: P, label: 'Starter', scene, BOX, decor: sh => {
  const [cx1, cy1] = sh([cb[2], cb[1]]), [ox, oy] = sh([(ob[0] + ob[2]) / 2, (ob[1] + ob[3]) / 2]);
  return [spark(cx1 + 12, cy1 - 4, 6), spark(cx1 + 22, cy1 + 12, 3.6), spark(ox - 30, oy - 18, 4.5),
    arc(ox, oy, (ob[2] - ob[0]) / 2 + 8, -60, -28)];
} });
const file = process.argv[2] || 'starter.svg';
fs.writeFileSync(file, out.svg);
console.log('wrote', file, 'group bbox', out.bbox.join(' '), `= ${out.widthPct}% x ${out.heightPct}% of the card`);

