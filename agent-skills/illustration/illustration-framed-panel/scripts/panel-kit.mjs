// panel-kit.mjs: the repeated parts of every Framed panel card, lifted from the three examples so a new card
// starts on the same frame, clouds, floor, bushes, bubbles, face, shoes and hands. No dependencies, no randomness.
//
//   node scripts/panel-kit.mjs demo out.svg                  writes a demo card that uses every part
//   node scripts/panel-kit.mjs scaffold out.svg --bg peach --prefix xx-
//                                                            writes an empty frame to draw into (bg: peach | orchid | cyan)
//
// From a generator:  import { scaffold, cloud, bush, bubble, face, neck, sneaker, tuckedShoe, hatch, typeHand, pointHand, gripHand, kneeHand, xf, NAVY } from './panel-kit.mjs';
// All coordinates are card units (480 x 360). Strokes are written at their final width: the kit moves and
// scales path coordinates itself (xf), so outlines never thin or thicken under a transform.

export const NAVY = '#2E2A5C';
export const BG = {                       // card pastel -> its bracket / outside-mark colour
  peach: { card: '#F7D8B5', mark: '#9C878C' },
  orchid: { card: '#DFA5D4', mark: '#A3739B' },
  cyan: { card: '#A7E0ED', mark: '#6E9FAD' },
};
export const PANEL = { x: 110, y: 46, w: 262, h: 266, floorY: 256, fill: '#8A80EA', floor: '#D0CCF4', dash: '#8F88D6', shadow: '#B5AEEA' };

const r1 = n => +(+n).toFixed(2);

// ---------- move / scale / mirror path data without touching stroke widths ----------
// maps absolute points (x, y) -> (tx + (x - ox) * sx, ty + (y - oy) * sy); relative segments are scaled only.
export function xf(d, { ox = 0, oy = 0, tx = 0, ty = 0, s = 1, sx = s, sy = s } = {}) {
  const toks = d.match(/[MLCQSTHVZAmlcqsthvza]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const out = []; let cmd = null, i = 0;
  const X = v => r1(tx + (v - ox) * sx), Y = v => r1(ty + (v - oy) * sy);
  const n = () => parseFloat(toks[i++]);
  const per = { M: 2, L: 2, C: 6, Q: 4, S: 4, T: 2, H: 1, V: 1, Z: 0 };
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) { cmd = toks[i++]; out.push(cmd); if (/z/i.test(cmd)) continue; }
    const C = cmd.toUpperCase(), rel = cmd !== C;
    if (C === 'A') throw new Error('xf: arcs are not supported');
    const k = per[C];
    for (let j = 0; j < k; j++) {
      const v = n();
      if (C === 'H') out.push(rel ? r1(v * sx) : X(v));
      else if (C === 'V') out.push(rel ? r1(v * sy) : Y(v));
      else out.push(j % 2 === 0 ? (rel ? r1(v * sx) : X(v)) : (rel ? r1(v * sy) : Y(v)));
    }
  }
  return out.join(' ').replace(/ ([MLCQSTHVZmlcqsthvz]) /g, ' $1').replace(/^([A-Za-z]) /, '$1');
}

// ---------- decor inside the panel ----------
const CLOUDS = {
  big: { d: 'M196 86 C196 80 202 77 207 79 C209 72 218 69 224 73 C227 68 236 69 238 75 C243 74 247 79 245 84', tail: 'M249 84 L252 84', ox: 196, oy: 86 },
  mid: { d: 'M128 152 C128 147 133 144 137 146 C139 140 147 138 152 142 C156 138 164 140 165 146 C169 146 172 150 170 154', tail: 'M174.6 154 L177.6 154', ox: 128, oy: 152 },
  small: { d: 'M182 58 C182 54 186 52 189 54 C191 50 197 50 199 55', tail: '', ox: 182, oy: 58 },
  tick: { d: 'M150 186 Q154 181 159 184', tail: '', ox: 150, oy: 186 },
};
// outline-only cloud doodle; (x, y) = its left base point. kinds: big (51 wide), mid (44), small (17), tick (9)
export const cloud = (x, y, kind = 'mid') => { const c = CLOUDS[kind]; const o = { ox: c.ox, oy: c.oy, tx: x, ty: y }; return `<path d="${xf(c.d, o)}"/>` + (c.tail ? `<path d="${xf(c.tail, o)}"/>` : ''); };

const BUSHES = {
  // two-layer bush (support card, left); origin = left end of its base on the floor line
  big: { ox: 84, layers: [
    ['M92 256 C84 250 85 236 96 234 C93 222 106 213 117 219 C121 207 138 205 144 216 C155 213 162 224 157 233 C164 236 165 248 158 256 Z', '#BACCA6'],
    ['M124 256 C118 250 120 240 130 240 C131 231 146 229 150 237 C160 235 168 245 163 256 Z', '#A9C094']],
    marks: 'M98 242 q2.4 2.8 5.2 0.8 M114 227 q2.2 2.6 4.8 0.6 M131 219 q2.4 2.8 5.2 0.8 M107 251.6 l3 -2.4 M110.4 253 l3 -2.4 M144 228 l3 -2.4 M147.4 229.4 l3 -2.4 M135 246 q2.4 2.8 5.2 0.8 M152 241 q2 2.4 4.4 0.6 M121 236 l2.6 -2.2' },
  // single bush (live coding, left); 59 wide
  mid: { ox: 90, layers: [['M96 256 C90 252 91 242 99 240 C98 232 108 227 116 231 C120 223 132 223 135 231 C143 230 148 238 145 245 C150 248 149 254 146 256 Z', '#BACCA6']],
    marks: 'M102 247 q2.2 2.6 4.8 0.6 M118 236 q2.2 2.6 4.8 0.6 M132 242 l3 -2.4 M135.4 243.4 l3 -2.4 M124 250 q2 2.4 4.4 0.6' },
  // small front bush (live coding); 34 wide
  small: { ox: 325, layers: [['M330 256 C325 252 327 245 334 245 C335 239 345 238 348 243 C355 242 360 249 356 256 Z', '#A9C094']], marks: 'M338 250 q2 2.4 4.4 0.6' },
};
// scalloped bush standing on the floor line; x = left end of its base. mirror flips it left-right about its own base.
export function bush(x, kind = 'big', { mirror = false, floorY = PANEL.floorY } = {}) {
  const b = BUSHES[kind];
  const w = Math.max(...b.layers[0][0].match(/\d+\.?\d*/g).filter((_, i) => i % 2 === 0).map(Number)) - b.ox;
  const o = mirror ? { ox: b.ox, oy: 256, tx: x + w, ty: floorY, sx: -1, sy: 1 } : { ox: b.ox, oy: 256, tx: x, ty: floorY };
  return `<g stroke="${NAVY}" stroke-width="1.15" stroke-linejoin="round" stroke-linecap="round">` +
    b.layers.map(([d, fill]) => `<path d="${xf(d, o)}" fill="${fill}"/>`).join('') +
    `<path d="${xf(b.marks, o)}" fill="none" stroke-width="0.95"/></g>`;
}

// ---------- the frame ----------
// Draw order (the examples all follow it): card, brackets + outside marks, panel fill, clouds, `wall` (things on
// the panel's back wall), floor band + line + dashes, `inside` (props wholly inside the panel), panel outline,
// `front` (bushes that break the frame, the figure, furniture, then bubbles and cards that break out), sparks.
export function scaffold({ prefix = 'xx-', bg = 'peach', label = 'Untitled', defs = '', clouds = null, wall = '', inside = '', front = '',
  marks = { left: 128, right: 180, double: 'left' }, dashes = null }) {
  const B = BG[bg] || BG.peach;
  const cl = clouds || [cloud(128, 152, 'mid'), cloud(196, 86, 'big'), cloud(182, 58, 'small'), cloud(150, 186, 'tick'), cloud(164, 124, 'tick')];
  const dl = dashes || ['M120 268 H136', 'M118 308 H132', 'M170 306 H192 M198 306 H202', 'M238 305 H264', 'M296 304 H318', 'M330 308 H350', 'M354 266 H366'];
  const L = marks.left, R = marks.right;
  const leftArc = `<path d="M60 ${L} Q54 ${L + 8} 57 ${L + 18}"/>` + (marks.double === 'left' ? `<path d="M53 ${L + 5} Q50 ${L + 10} 51 ${L + 14}"/>` : '');
  const rightArc = `<path d="M433 ${R} Q439 ${R + 8} 436 ${R + 18}"/>` + (marks.double === 'right' ? `<path d="M440 ${R + 5} Q443 ${R + 10} 442 ${R + 14}"/>` : '');
  return `<svg role="img" aria-label="${label}, Framed panel style" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
  <defs>${defs}</defs>
  <rect id="${prefix}card" x="0" y="0" width="480" height="360" fill="${B.card}"/>
  <g id="${prefix}brackets" fill="none" stroke="${B.mark}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
    <path d="M362 35 H379 Q384 35 384 40 V52 M384 57 V66"/>
    <path d="M98 291 V299 M98 304 V316 Q98 321 103 321 H121"/>
    ${leftArc}${rightArc}
  </g>
  <rect id="${prefix}panel" x="110" y="46" width="262" height="266" fill="${PANEL.fill}"/>
  <g id="${prefix}clouds" fill="none" stroke="${NAVY}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${cl.join('')}</g>
  ${wall}
  <rect id="${prefix}floor" x="110" y="256" width="262" height="56" fill="${PANEL.floor}"/>
  <path d="M110 256 H372" stroke="${NAVY}" stroke-width="1.2"/>
  <g id="${prefix}floordash" stroke="${PANEL.dash}" stroke-width="1.15" stroke-linecap="round">${dl.map(d => `<path d="${d}"/>`).join('')}</g>
  ${inside}
  <rect x="110" y="46" width="262" height="266" fill="none" stroke="${NAVY}" stroke-width="1.35"/>
  ${front}
</svg>
`;
}

// flat contact shadow on the floor band under feet, furniture and bushes
export const floorShadow = (cx, cy, rx, ry = 2.6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${PANEL.shadow}"/>`;

// ---------- speech bubbles and UI cards ----------
// white rounded box (corner radius 8) with a tail; tail: 'down' (from the bottom edge near `at`), 'left' or 'right'
// (from that side near `at`). Includes the short inner corner tick the examples put just inside the top-left corner.
export function bubble({ x, y, w, h, tail = 'down', at = null, r = 8, fill = '#FFFFFF', tick = 'left' }) {
  const X2 = x + w, Y2 = y + h;
  let d;
  if (tail === 'down') {
    const a = at ?? X2 - 22; // tail base from a to a-10, tip 2 right of a, 11 below
    d = `M${x + r} ${y} H${X2 - r} Q${X2} ${y} ${X2} ${y + r} V${Y2 - r} Q${X2} ${Y2} ${X2 - r} ${Y2} H${a} L${a + 2} ${Y2 + 11} L${a - 10} ${Y2} H${x + r} Q${x} ${Y2} ${x} ${Y2 - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  } else if (tail === 'left') {
    const a = at ?? y + h / 2 + 8; // tail from a-10 to a, tip 11 left
    d = `M${x + r} ${y} H${X2 - r} Q${X2} ${y} ${X2} ${y + r} V${Y2 - r} Q${X2} ${Y2} ${X2 - r} ${Y2} H${x + r} Q${x} ${Y2} ${x} ${Y2 - r} V${a} L${x - 11} ${a + 5} L${x} ${a - 10} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  } else {
    const a = at ?? y + h / 2 - 8;
    d = `M${x + r} ${y} H${X2 - r} Q${X2} ${y} ${X2} ${y + r} V${a} L${X2 + 11} ${a + 15} L${X2} ${a + 10} V${Y2 - r} Q${X2} ${Y2} ${X2 - r} ${Y2} H${x + r} Q${x} ${Y2} ${x} ${Y2 - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  }
  const tk = tick === 'left' ? `<path d="M${x + 7} ${y + 6} Q${x + 5} ${y + 7} ${x + 5} ${y + 10}" fill="none" stroke-width="1"/>`
    : tick === 'right' ? `<path d="M${X2 - 5} ${y + 5} Q${X2 - 3} ${y + 6} ${X2 - 3} ${y + 9}" fill="none" stroke-width="1"/>` : '';
  return `<path d="${d}" fill="${fill}"/>${tk}`;
}
// a raised pill or button: a darker copy 3 px lower, then the face. e.g. raised(248, 198, 72, 26, 13, '#E35D5B', '#B8434A')
export const raised = (x, y, w, h, rx, face, under) => `<rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="${rx}" fill="${under}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${face}"/>`;
// UI text line: a round-capped stroke, 2.2 wide (2.4-2.8 for headings). Grey #BDB8D6, dark #6E6A8E, accents red/green/yellow.
export const textLine = (x, y, len, col = '#BDB8D6', w = 2.2) => `<path d="M${x} ${y} H${x + len}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

// ---------- characters ----------
// The shared head: a 3/4 face looking RIGHT (ear on the left, nose hook on the right), chin at (232, 166.5),
// face 36 wide x 46 tall. Wrap face() and your hair in one group and place it with a transform, e.g.
//   <g transform="translate(-16 4) rotate(8 232 166)">  hair-back, face(...), fringe  </g>
// Mirror it to look LEFT with translate(464 0) scale(-1 1) (plus your offset). Never scale it: the line weight would change.
export function face({ skin = '#EDB0A2', blush = '#E8878A', blushOpacity = 0.6, mouth = '#9A3E52', tongue = '#E8878A', earring = 'stud', smile = 'open' } = {}) {
  const ear = earring === 'stud' ? `<path d="M213 151 L213 153.4" fill="none" stroke-width="1"/><circle cx="213" cy="157" r="3.4" fill="#EDB24F" stroke-width="1.1"/><path d="M211.4 155.6 Q212 154.6 213.2 154.5" fill="none" stroke="#FCF6EA" stroke-width="0.9"/>`
    : earring === 'hoop' ? `<circle cx="212.6" cy="153.6" r="2.6" fill="none" stroke="#EDB24F" stroke-width="1.3"/>` : '';
  const m = smile === 'open'
    ? `<path d="M233 153.6 C234.8 158.6 240.2 159 242.4 153.4 C239.2 154.6 236 154.6 233 153.6 Z" fill="${mouth}" stroke-width="1"/><path d="M235.6 156.8 Q237.8 155.8 240.2 156.8" fill="none" stroke="${tongue}" stroke-width="1.2"/>`
    : `<path d="M233.4 154 Q237.6 157.4 242 153.6" fill="none" stroke-width="1.15"/>`;
  return `<g stroke="${NAVY}" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round">
    <path d="M216 127 C213 136 212.5 147 215.5 154.5 C219.5 162 226 167 232 166.5 C238 166 243 161 246 154 C247.4 150.6 248.4 146.4 248.2 141 C248.4 136 248 131 246 126 C238 118 222 118 216 127 Z" fill="${skin}"/>
    <path d="M216.5 139.5 C212 137.5 208.6 140.6 209.4 145 C210 149 213 151.4 216.6 150.4" fill="${skin}"/>
    <path d="M214.4 142 Q212.4 144.4 214.6 147" fill="none" stroke-width="0.9"/>${ear}
    <ellipse cx="230" cy="142.4" rx="1.8" ry="2.1" fill="${NAVY}" stroke="none"/>
    <path d="M227.4 141 Q230 139.4 232.6 140.8" fill="none" stroke-width="1.1"/>
    <ellipse cx="243" cy="141.9" rx="1.5" ry="1.9" fill="${NAVY}" stroke="none"/>
    <path d="M241 140.6 Q243 139.2 245 140.4" fill="none" stroke-width="1.1"/>
    <path d="M227.6 141 L225.4 139.8" fill="none" stroke-width="1"/>
    <path d="M226.5 134.4 Q230 132.4 233.5 133.8" fill="none" stroke-width="1.2"/>
    <path d="M240.6 133.4 Q243.6 132.2 246.2 133.2" fill="none" stroke-width="1.2"/>
    <path d="M241.4 144.8 C243.4 147 243.6 148.8 240.8 149.6" fill="none" stroke-width="1.15"/>
    ${m}
    <ellipse cx="228.4" cy="149.4" rx="3.8" ry="2.1" fill="${blush}" opacity="${blushOpacity}" stroke="none"/>
    <ellipse cx="245.6" cy="150.4" rx="1.4" ry="1.5" fill="${blush}" opacity="${blushOpacity - 0.1}" stroke="none"/>
  </g>`;
}
// neck for the shared head (same coordinates): sits under the chin, its base hidden by the collar
export const neck = (skin = '#EDB0A2') => `<path d="M223.4 156 C223.6 166 223.2 173 220 179.6 Q229.6 185.4 239.6 179.6 C237 173 236.6 166 236.6 157 Z" fill="${skin}" stroke="${NAVY}" stroke-width="1.15" stroke-linejoin="round"/><path d="M223.6 167.6 Q229.6 172 236.4 169.2" fill="none" stroke="${NAVY}" stroke-width="0.9" stroke-linecap="round"/>`;

// white sneaker with a red sole, toe pointing right (mirror: toe left). (x, y) = heel end of the sole's underside.
export function sneaker(x, y, { mirror = false, upper = '#FCFAF3', sole = '#E35D5B' } = {}) {
  const o = mirror ? { ox: 132, oy: 300, tx: x, ty: y, sx: -1, sy: 1 } : { ox: 132, oy: 300, tx: x, ty: y };
  return `<g stroke="${NAVY}" stroke-width="1.15" stroke-linejoin="round" stroke-linecap="round">` +
    `<path d="${xf('M132 297 L132 290 C132 286 134.5 284 138 284 L143 284 C146 287 150 289 155 290 C160 291 162 294 161.5 297 Z', o)}" fill="${upper}"/>` +
    `<path d="${xf('M132 297 H161.5 V298.6 Q161.5 300 160 300 H133.5 Q132 300 132 298.6 Z', o)}" fill="${sole}"/>` +
    `<path d="${xf('M143 286.6 l3 2.4 M146.4 286.6 l2.4 2.8', o)}" fill="none" stroke-width="0.9"/></g>`;
}
// toes-tucked sneaker for a kneeling or crouching foot: ball of the foot at (Bx, By) on the floor, heel lifted
// up-left, toe pointing right
export function tuckedShoe(Bx, By, { s = 1, sole = '#E35D5B', upper = '#FCFAF3' } = {}) {
  const P = pts => pts.map(p => typeof p === 'string' ? p : `${r1(Bx + p[0] * s)} ${r1(By - p[1] * s)}`).join(' ');
  const soleD = P(['M', [10.8, 3.2], 'C', [11.8, 2.2], [11.6, 0], [9.6, 0], 'L', [0, 0], 'L', [-11.4, 16.2], 'C', [-12.4, 17.8], [-11.8, 19.6], [-10, 19.6], 'L', [-8.6, 17.8], 'L', [1.4, 3.2], 'Z']);
  const upD = P(['M', [-8.6, 17.8], 'C', [-10, 20], [-8, 22.8], [-4.4, 23], 'L', [-0.4, 23.4], 'L', [5.2, 15.4], 'L', [6.8, 17.6], 'C', [8, 14], [8.8, 10], [9.8, 6.6], 'C', [10.6, 5], [11.2, 4], [10.8, 3.2], 'L', [1.4, 3.2], 'Z']);
  const lines = P(['M', [-7.4, 18.4], 'C', [-6.4, 20.4], [-4.6, 21.2], [-2.4, 21.2], 'M', [3.8, 3.4], 'C', [5, 5.4], [7, 6.6], [9.6, 6.4]]);
  const lace = `M${r1(Bx + 5.4 * s)} ${r1(By - 12.6 * s)} l${r1(2.6 * s)} ${r1(1.2 * s)} M${r1(Bx + 6.4 * s)} ${r1(By - 9.6 * s)} l${r1(2.6 * s)} ${r1(1 * s)}`;
  return `<g stroke="${NAVY}" stroke-width="1.15" stroke-linejoin="round" stroke-linecap="round"><path d="${upD}" fill="${upper}"/><path d="${soleD}" fill="${sole}"/><path d="${lines}" fill="none" stroke-width="0.9"/><path d="${lace}" fill="none" stroke-width="0.9"/></g>`;
}

// the style's texture: pairs of short parallel slashes inside a shape (0.85-0.9 navy, or a lighter tint of the fill
// at 1.0 on dark fabric). (x, y) = start of the first slash; each slash runs (dx, dy); the second starts `step` lower.
export const hatch = (x, y, { n = 2, dx = 3, dy = -3, step = [1, 5] } = {}) => Array.from({ length: n }, (_, i) => `M${r1(x + step[0] * i)} ${r1(y + step[1] * i)} l${dx} ${dy}`).join(' ');

// ---------- hands (local frame: wrist at the origin, fingers along +x, y down) ----------
// Place with transform="translate(wx wy) rotate(a)" on the group; never scale above 1.2. Mirror with scale(1 -1)
// to swap which edge the thumb is on, then check handedness with the table and thumb proof in references/craft.md.
// typeHand: a hand resting flat or typing, seen from the back. The thumb tip shows above the index knuckle
// (local -y edge), the four fingertips curl down onto the surface along +y. Support card: her right hand on the keys.
export const typeHand = ({ skin = '#EDB0A2', cuff = '#E0A23E' } = {}) => `<g stroke="${NAVY}" stroke-width="1.05" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-13 -5.5 C-8.4 -5.3 -3.8 -5.4 2.2 -5.6 L2.2 1.5 C-3.8 2.5 -8.4 4.2 -13 5.6 Z" fill="${skin}"/>
    <path d="M16.4 -7.4 C17 -8.6 18.2 -9.4 19.4 -9.3 C20.4 -9.2 20.8 -8.4 20.5 -7.6 C20.3 -7 19.9 -6.5 19.5 -6.1 Z" fill="${skin}"/>
    <path d="M1.4 1.5 C2.4 2 3 2.5 4 2.6 C5.4 2.7 6.4 1.7 7.6 1.4 C9 1.1 10.4 1.8 11.3 2.8 C11.8 3.4 12 4.3 12.7 4.4 C13.4 4.5 14 4 14.1 3.2 C14.5 3.6 15.2 3.7 15.9 3.4 C16.7 3.1 17.2 2.4 17.1 1.6 C17.6 2 18.4 2.1 19.1 1.8 C19.9 1.5 20.3 0.8 20.2 0 C20.9 -0.1 21.6 -0.6 21.8 -1.4 C22.1 -2.5 21.7 -3.8 20.8 -5 C19.6 -6.6 17.4 -7.8 15 -8.4 C13.8 -8.7 12.4 -8.8 11 -8.8 C7.8 -8.8 4.4 -7.6 1.4 -5.6" fill="${skin}"/>
    <path d="M14.2 -6.6 C13 -5.6 12 -4.2 11.6 -2.6 M14.1 3.2 C13.8 2.1 13.1 1.2 12.2 0.7 M17.1 1.6 C16.8 0.3 16 -0.7 15 -1.3 M20.2 0 C19.9 -1.4 19 -2.8 17.8 -3.6" fill="none" stroke-width="0.75"/>
    <path d="M-16.2 -6.6 C-14.5 -6.8 -12.8 -6.8 -11.2 -6.6 L-11.2 6.6 C-12.8 6.8 -14.5 6.8 -16.2 6.6 Z" fill="${cuff}"/>
    <path d="M-13.7 -5.8 V5.8" fill="none" stroke-width="0.8"/>
  </g>`;
// pointHand: index finger extended along the upper edge (local -y side), the other three fingers curled below it
// with their knuckles showing, the thumb folded across them from the lower edge. Live Coding: pointing at the screen.
// Cuff is drawn separately so it can sit at the sleeve angle: pointCuff().
export const pointHand = ({ skin = '#F0BFA4' } = {}) => `<g stroke="${NAVY}" stroke-width="1.15" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-6.7 -1.8 C-6.0 -5.6 -2.6 -7.8 1.6 -8.0 C5.0 -8.3 8.6 -8.5 11.2 -8.2 C12.6 -8.0 13.4 -7.4 14.6 -7.2 C16.8 -7.0 18.8 -6.9 20.4 -6.7 C22.6 -6.5 23.2 -4.6 22.8 -3.6 C22.4 -2.6 21.4 -2.3 20.2 -2.3 C18.2 -2.3 16.2 -2.4 14.4 -2.5 C17.0 -2.5 18.0 -1.0 17.8 0.4 C17.6 1.6 16.6 2.2 15.2 2.1 C16.4 2.6 17.0 4.0 16.7 5.0 C16.4 6.0 15.4 6.4 14.2 6.3 C15.2 6.9 15.4 8.4 14.8 9.1 C14.2 9.8 13.0 10.0 11.8 9.8 C11.4 9.8 11.1 9.7 10.8 9.6 C7.4 9.4 3.6 8.6 0.8 7.4 C-0.8 6.8 -2.0 6.2 -3.5 6.0 Z" fill="${skin}"/>
    <path d="M14.4 -2.5 Q12.2 -2.4 10.6 -3.0 M14.2 6.3 Q12.8 6.5 11.8 6.1" fill="none"/>
    <path d="M19.8 -6.7 Q21.6 -6.5 22.4 -5.4" fill="none" stroke-width="0.8"/>
    <path d="M2.4 3.8 C5.4 2.2 9.0 0.6 12.4 0.0 C14.4 -0.3 15.8 0.8 15.6 2.2 C15.4 3.4 14.0 3.9 12.6 4.0 C10.6 4.2 8.4 4.8 7.0 5.8" fill="${skin}"/>
  </g>`;
// ribbed sleeve cuff, centred on the origin, 6 wide x 13 tall; rotate it to sit across the wrist
export const pointCuff = (cuff = '#D9735A') => `<g stroke="${NAVY}" stroke-width="1.15" stroke-linejoin="round"><path d="M-5 -6.4 C-3 -6.7 -1.2 -6.7 0.8 -6.4 L0.8 6.4 C-1.2 6.7 -3 6.7 -5 6.4 Z" fill="${cuff}"/><path d="M-2.1 -5.8 V5.8" fill="none" stroke-width="0.8"/></g>`;

// gripHand: a fist round a handle (magnifier, mug handle, stylus, mic stand), seen from the back. Fingers point
// along +x and are curled round a handle that runs along local y through x = 13; the thumb wraps the top (-y) edge,
// so the business end of the handle (lens, head) points to -y. As drawn this is a RIGHT hand with the back to the
// viewer. Draw the held object FIRST, then this group: the curled fingers and the thumb must overlap the handle.
export const gripHand = ({ skin = '#F0BFA4', cuff = '#D9735A' } = {}) => `<g stroke="${NAVY}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-6 -6.2 C-2 -6.6 2 -7 5 -7.4 L5.4 6.4 C2 6.8 -2 6.8 -6 6.4 Z" fill="${skin}"/>
    <path d="M4.6 -7.4 C8 -8.6 12.6 -8.8 16.4 -7.6 C19.4 -6.6 21 -4.6 21.2 -1.8 C21.4 1.6 21 4.6 19.4 6.6 C17.4 8.8 13 9.4 8.6 8.6 C7 8.4 6 7.6 5.4 6.4 Z" fill="${skin}"/>
    <path d="M14 -4 Q17.6 -4.6 21 -2.8 M13.6 0 Q17.4 -0.4 21.2 0.8 M13.2 3.8 Q16.6 3.6 20.2 5" fill="none" stroke-width="0.8"/>
    <path d="M8.6 -7.4 C9.6 -3 9.6 3 8.6 8.2" fill="none" stroke-width="0.8"/>
    <path d="M3.6 -6.6 C6 -10.4 10.6 -12.6 15.4 -12 C18 -11.6 18.6 -9.6 17 -8.4 C14.4 -7.6 11.2 -7.2 8.4 -6.4 Z" fill="${skin}"/>
    <path d="M-10 -7.2 C-8 -7.5 -6 -7.5 -4 -7.2 L-4 7.2 C-6 7.5 -8 7.5 -10 7.2 Z" fill="${cuff}"/>
    <path d="M-7 -6.6 V6.6" fill="none" stroke-width="0.8"/>
  </g>`;
// kneeHand: the far arm of a RIGHT-facing seated or kneeling figure (her LEFT arm) hanging down the far side, the hand
// resting palm-down on a knee with the fingers draping forward over the kneecap (Design System). Absolute card
// coordinates: the sleeve starts at (222-232, 190) and the fingertips end at about (255, 250). Move it with dx, dy so
// the fingertips sit just past the front of the knee; draw it after the legs and before the torso.
export const kneeHand = ({ skin = '#D49A80', sleeve = '#95D1B3', cuff = '#79BC9C', dx = 0, dy = 0 } = {}) => `<g transform="translate(${dx} ${dy})" stroke="${NAVY}" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round">
    <path d="M222 190 C232 198 236 212 237.4 222 L240.4 229.6 L230 233 C228.6 226 226 216 220 206 Z" fill="${sleeve}"/>
    <path d="M228.6 229.6 C232 228.6 236.4 227.4 240.6 226.6 L242 232.4 L228.4 236.36 Z" fill="${cuff}"/>
    <path d="M235 228 L236.4 234" fill="none" stroke-width="0.9"/>
    <g stroke-width="1.15">
    <path d="M240.6 232.81 C241.23 232.82 243.18 232.74 244.4 232.9 C245.62 233.06 246.82 233.33 247.9 233.8 C248.98 234.27 250.02 234.93 250.9 235.7 C251.78 236.47 252.58 237.42 253.2 238.4 C253.82 239.38 254.27 240.57 254.6 241.6 C254.93 242.63 255.13 243.67 255.2 244.6 C255.27 245.53 255.03 246.77 255 247.2 C254.92 247.43 254.75 248.3 254.5 248.6 C254.25 248.9 253.77 249.05 253.5 249 C253.23 248.95 253 248.42 252.9 248.3 C252.9 248.55 253.05 249.4 252.9 249.8 C252.75 250.2 252.33 250.6 252 250.7 C251.67 250.8 251.12 250.63 250.9 250.4 C250.68 250.17 250.73 249.48 250.7 249.3 C250.63 249.45 250.53 250.03 250.3 250.2 C250.07 250.37 249.55 250.45 249.3 250.3 C249.05 250.15 248.88 249.8 248.8 249.3 C248.72 248.8 248.85 248.03 248.8 247.3 C248.75 246.57 248.7 245.67 248.5 244.9 C248.3 244.13 247.97 243.37 247.6 242.7 C247.23 242.03 246.8 241.35 246.3 240.9 C245.8 240.45 244.88 240.15 244.6 240 C244.73 240.28 245.2 241.1 245.4 241.7 C245.6 242.3 245.78 242.98 245.8 243.6 C245.82 244.22 245.68 244.93 245.5 245.4 C245.32 245.87 245.02 246.27 244.7 246.4 C244.38 246.53 243.97 246.47 243.6 246.2 C243.23 245.93 242.98 245.4 242.5 244.8 C242.02 244.2 241.38 243.3 240.7 242.6 C240.02 241.9 239.22 241.27 238.4 240.6 C237.58 239.93 236.65 239.22 235.8 238.6 C234.95 237.98 234 237.43 233.3 236.9 C232.6 236.37 231.88 235.67 231.6 235.42 Z" fill="${skin}"/>
    <path d="M252.9 248.3 C252.93 247.9 253.1 246.72 253.1 245.9 C253.1 245.08 252.93 243.82 252.9 243.4 M250.7 249.3 C250.73 248.9 250.9 247.72 250.9 246.9 C250.9 246.08 250.73 244.82 250.7 244.4" fill="none" stroke-width="0.95"/>
    <path d="M239.9 238.5 C240.28 238.63 241.57 239.03 242.2 239.3 C242.83 239.57 243.45 239.97 243.7 240.1" fill="none" stroke-width="0.95"/>
    </g>
  </g>`;

// ---------- sparkle ticks ----------
// three short strokes radiating from a point, navy 1.2: draws attention to a breakout element
export const ticks = (x, y) => `<g fill="none" stroke="${NAVY}" stroke-width="1.2" stroke-linecap="round"><path d="M${x} ${y} l3 -5 M${x + 6} ${y + 3} l5 -2 M${x - 6} ${y} l-1 -5"/></g>`;

// ---------- CLI ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const [mode, out = 'panel.svg'] = process.argv.slice(2);
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  if (mode === 'scaffold') {
    fs.writeFileSync(out, scaffold({ prefix: arg('--prefix', 'xx-'), bg: arg('--bg', 'peach'), label: arg('--label', 'Untitled'),
      front: `<g id="${arg('--prefix', 'xx-')}bushL">${bush(84, 'big')}</g>\n  <!-- figure, furniture, then breakout bubbles go here -->` }));
    console.log('wrote', out);
  } else if (mode === 'demo') {
    const P = 'kd-';
    const front = [
      `<g id="${P}bushL">${bush(84, 'big')}</g>`,
      `<g id="${P}bushR">${bush(336, 'mid', { mirror: true })}</g>`,
      floorShadow(150, 304.5, 22), floorShadow(214, 304.5, 22),
      `<g id="${P}shoes">${sneaker(132, 300)}${sneaker(196, 300)}${tuckedShoe(290, 298)}</g>`,
      `<g id="${P}head" transform="translate(4 40)">${neck()}${face()}</g>`,
      `<g id="${P}head2" transform="translate(500 40) scale(-1 1)">${neck('#D49A80')}${face({ skin: '#D49A80', blush: '#C46A5C', blushOpacity: 0.55, earring: 'hoop', smile: 'closed' })}</g>`,
      `<g transform="translate(160 236)">${typeHand()}</g>`,
      `<g transform="translate(300 236) rotate(-30)">${pointHand()}</g><g transform="translate(297.7 240.8) rotate(-52)">${pointCuff()}</g>`,
      `<g transform="translate(240 230)"><path d="M10 -30 H16 V14 H10 Z" fill="#E35D5B" stroke="${NAVY}" stroke-width="1.15"/>${gripHand()}</g>`,
      kneeHand({ dx: -60, dy: 10 }),
      `<g id="${P}ask" stroke="${NAVY}" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round">${bubble({ x: 64, y: 68, w: 102, h: 50, tail: 'down', at: 154 })}${textLine(80, 84, 40, '#E35D5B')}${textLine(80, 93, 60, '#6E6A8E')}${textLine(80, 102, 30)}</g>`,
      `<g id="${P}reply" stroke="${NAVY}" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round">${bubble({ x: 344, y: 166, w: 82, h: 36, tail: 'left', at: 190, tick: 'right' })}${raised(356, 178, 30, 12, 6, '#5FA77A', '#3E8E5E')}${textLine(392, 184, 24)}</g>`,
      ticks(418, 160),
      `<path d="${hatch(250, 150)}" stroke="${NAVY}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`,
    ].join('\n  ');
    fs.writeFileSync(out, scaffold({ prefix: P, bg: arg('--bg', 'cyan'), label: 'Kit demo', front }));
    console.log('wrote', out);
  } else {
    console.log('usage: node panel-kit.mjs demo out.svg [--bg cyan] | scaffold out.svg --bg peach --prefix xx- [--label Name]');
  }
}
