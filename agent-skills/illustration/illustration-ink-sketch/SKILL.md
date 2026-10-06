---
name: illustration-ink-sketch
description: Draws hand-inked cartoon critters and living objects as SVG cards (480x360), each acting out a coding or design idea. Identified by thick black brush-pen outlines that swell and taper and break into separate strokes, loose marker-and-watercolour fills that slip past the line, diagonal hatching instead of solid shadow, huge googly eyes with two specular dots, and stray ink hairs and flecks, in tomato red, leaf green, sunflower yellow, sky blue and teal on white. Covers palette, brush numbers, mascot construction (eyes, blush, mouths, 3-finger hands), props, ground patches and a tested, seeded brush kit. Use when asked for ink sketch, hand-drawn, brush pen, sketchy, doodle, marker or watercolour-cartoon illustrations, googly-eyed mascots or critters, playful empty states, onboarding, 404 or error pages, loading states, blog headers, feature spots or marketing cards.
---

# Illustration: Ink sketch

Sketchy, hand-inked cartoons: a googly-eyed critter or object (a snail, a pair of worms, a potted cactus) whose body carries the coding metaphor, drawn with a wobbly brush pen over loose marker colour. It suits playful product moments: loading, errors, greetings, conflicts.

Boundary: for clean, even ~2 px ink outlines on people with flat fills, use `illustration-outlined-cartoon`. For people drawn with a black brush marker and one mint second colour, use `illustration-two-colour-brush`. For soft, unoutlined cosy animals with grain, use `illustration-grainy-gouache`.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence
Every edge is a filled black brush polygon that swells from about 1 to 4.4 px and tapers to points, laid in a few separate strokes over a colour fill that slips 2 to 3.6 px past it, with dark areas hatched rather than filled.

## Palette
Measured from the examples. Each colour family is base / dark / light; the dark goes into mottle and marker streaks, the light into one lit streak.

| Role | Hex | Where it goes |
|---|---|---|
| Card background | `#ffffff` (none drawn) | Don't draw a background rect. |
| Ink | `#1d1a18` | Every outline, hatch line, hair, fleck, pupil, letter. Never pure black. |
| Red | `#f0563d` / `#b8311f` / `#ff8a6a`, deep `#9a2414` | Shells, pots, one worm |
| Yellow | `#ffc83d` / `#ef9a24` / `#fff1b0` | Snail body, spark bursts, flower centres; `#fff1b0` also bubble shadows |
| Green | `#5cb946` / `#2f8a38` / `#a6dc62` | Grass patches, cactus |
| Blue | `#66cdea` / `#2a8fbf`, drop `#bfe8f7` | Slime, mugs, progress fill, sweat drops |
| Teal | `#2fb5a7` / `#167a71` / `#8fe3d6`, deep `#0f5c55` | A second character beside a red one |
| Wood | `#eaa85c` / `#b8722f` / `#f8d6a0`, deep `#8a5320` | Desks, tables |
| Blush | `#ff7f86` (op 0.5 to 0.75), ticks `#d9434f` or `#c8303f` | Cheek discs with three ticks; tongue |
| Eye shade | `#c9d6ea` | The crescent inside each eye white |
| Paper | `#fffaf0`, fold `#d9d2c4` | Stickers, scraps, labels |
| Singles | mouth `#3b1f1a`, petal `#ff8fa0`, soil `#5b3b2c`, coffee `#6b4330`, soft shadow `#7f97ab` (op 0.22) | One-off details |
| White | `#ffffff` | Eye whites, gloss swipes, speech bubbles, highlights |

- Use two colour families for the subject plus green for ground (red + yellow snail, red vs teal worms, green cactus + red pot + wood desk). A third family only for a small prop.
- Never gradients. Opacity only on mottle, streaks, gloss and blush. Never a solid black area larger than a pupil: hatch it.

## Line and fill
All ink is filled polygons from the brush (`stroke()` in the kit), never SVG strokes: the examples contain zero `stroke` attributes.

| Mark | Numbers at 480 wide |
|---|---|
| Outline | `OUT(centre)`: w 4.6, max 4.4, min 1.0, press 0.4 (wavelength 26), nib 0.3, thicker on the down-right shadow side (k 0.3 to 0.36). Tapers t0/t1 3 to 30 px. 3 to 6 separate strokes per shape, one gap on the lit top-left, one overshoot of 2 to 14 px |
| Secondary line (rims, bubble tails, mouths) | w 2.4 to 3.2, nib 0.45, press 0.4, pf 8 |
| Detail (ribs, creases, wood grain) | w 1.1 to 1.8, ink at op 0.55 to 0.85 |
| Hatching | w 1.0 to 1.15, spacing 2 to 3.2, angle -48 to -58 deg (mirror to -130 on a right-lit shape), ends jittered inside the edge |
| Hairs | 2 to 5 per outline stroke, w 0.9 to 1.5, length 2.5 to 7, pointing outward on the shadow side |
| Flecks | 9 to 11 per card, size 0.8 to 1.7, in the empty margins |
| Fill | base colour, slipped 2 to 3.6 px off the outline (`fillShape` off), control points jittered 1.2 to 1.6 |
| Mottle | dark colour at op 0.36 to 0.5 through the mottle filter, over every fill |
| Marker streaks | dark colour, w 4 to 16, op 0.3 to 0.55, 1 to 3 along the shadow side, clipped to the shape |
| Gloss | white, w 2.4 to 6, op 0.85 to 0.95, one or two swipes on the lit upper-left of round forms |

Two filters per card, both prefixed: `rough` (fractal noise 0.45, displacement 0.7) wraps the whole card so every edge trembles; `mottle` (noise 0.035 x 0.06, 3 octaves, alpha 2.6/-1.25) masks the watercolour patches. `svgOut` writes both.

## Characters
No people. The hero is a critter or a living object (snail, worms, cactus; equally a mug, a bug, a robot vacuum) whose body IS the metaphor: the shell is a loading spinner, the worms' thin tails are git branches with commit dots, the pot wears a `</>` sticker.
- **Body:** tubes along a spine with a width function (`tube()`), or a closed blob through 12 to 24 control points. Heads swell at the end of a tube (body 40, head 49). The subject spans about 60 to 70% of the card width.
- **Eyes, the signature:** huge googly eyes, radius 19 to 27.5 (40 to 55 px across, 1/3 to 1/2 of the head width), usually a pair of slightly different sizes touching or overlapping. White disc, `#c9d6ea` shade crescent at the lower right, a rim that swells and overshoots its start, a pupil of radius 0.5 x the eye offset 4 to 10 px toward what the critter looks at, one big and one small white specular. Lids in the body colour (h 0.34 to 0.38, tilted 17 deg) make them grumpy.
- **Face:** blush ellipses 8 x 4.6 with three short red ticks; a mouth of one curved stroke with tiny end ticks (smile), a filled dark mouth with a pink tongue (cheer), a white gritted-teeth shape with two tooth lines (anger), a down-turned stroke with a lower lip (pout).
- **Hands, when a critter needs them:** the limb colour, a palm and 3 fingers plus a thumb as capsules, inked open at the knuckles, a knuckle crease, a dark streak on the shadow side (`hand()` in the kit). Sized like the cactus: fingers 12 to 14.5 long at scale 1.25. Put the thumb where the handedness table in `references/craft.md` says.
- **Antennae, stalks, tails:** tapered tubes with the outline on both sides, or single spiral brush strokes. Stick legs, if used, are single brush strokes 2.4 to 3 wide ending in small filled ovals.
- **Stubby legs and paws (small mammals):** short tubes 9 to 14 wide via `shadeTube` + `limbOutline({ under: bodyLoop })`, ending in a petal-pink oval 5.4 x 3.2 with a short ink underline. Draw the far pair before the body, the near pair after; angle the back leg behind the hip and the front leg ahead of the shoulder so a run reads.
- **Effort and emotion marks:** sweat drops, an anger mark of four bowed brackets, motion arcs (two concentric strokes, 2.4 and 1.8 wide, tapering), steam curls.

## Decor and props
- **Ground (pick one):** a ragged grass patch spanning x 52 to 428, top edge y 272 to 280, bottom bowing up at the ends, with dry-brush ends, blade flicks and one or two tall tufts at the ends (`grassPatch`, `tuft`); or a wooden desk top seen slightly from above with grain lines and one hatched leg.
- **Contact:** a hatched ellipse right under each resting part (w 1.0, sp 3 to 3.2, op 0.85 to 0.9), plus a darker streak at the base of the body. Props stand on something: a sign goes on a stake planted in the grass, a mug on the desk. Only bubbles, flung scraps and marks may float.
- **Props, 1 to 3:** a `</>` code sticker, a speech bubble with hand-lettered text, a torn paper scrap with code chevrons, a mug with steam curls, a progress bar (white track, hatched blue fill, hand-lettered %), commit dots, a spark burst star, a flower.
- **Lettering:** hand-lettered with brush strokes (w 2.4 to 2.6, glyphs 12 to 17 px tall), never a font.
- **Never:** clean geometric vector shapes without a brush outline, gradients, drop shadows, solid black fills, background scenery, people.

## Composition
- No background rect. Everything inside x 36 to 444 and y 40 to 340; only dry-brush ground ends may reach x 36.
- The subject sits centre-bottom on its ground, about 60 to 70% of the card wide and 60% tall; its eyes are the focal point in the upper half. One bubble, scrap or mark fills the emptiest upper corner. A round or tall subject (a wheel, a pot) is only about 50% wide: give it one grounded side prop to fill the width.
- Every number in this skill is at card size. Inside a scaled group, draw at size / scale, and put contacts (paws on a rim, a pot on a desk) in card space first, then map them into the group: `const G = w => [B0[0] + (w[0] - B0[0]) / S, B0[1] + (w[1] - B0[1]) / S]`.
- Draw the subject at design size inside `<g transform="translate(cx gy) scale(1.12) translate(-cx -gy)">` about its ground point, with `setWScale(1/1.12)` so line widths stay true, then `setWScale(1)` after.
- `svgOut(file, {shift: [0, -8]})` nudges the whole card to balance the margins.

## Techniques
`scripts/ink-kit.mjs` is the seeded brush library the three examples were generated with: run with it in place of the original, the Merge Conflict and Hello World generators reproduce every mark of the shipped cards exactly (the only diff is a stray text node the old file writer left in `<defs>`). Every mark takes a string key with its own random stream, so editing or adding one mark never reshuffles the rest; change a key to re-roll a single mark.

```js
// card.mjs, next to a copy of ink-kit.mjs
import * as K from './ink-kit.mjs';
const { PAL, OUT } = K;
K.setPrefix('xx-');                                        // every id: filters and clip paths
K.grassPatch('grass', { x0: 60, x1: 420, top: 276, bot: 320 });
K.hatch('cast', K.arc(240, 286, 70, 6, 0, 360, 10), { ang: -58, sp: 3, w: 1.0, inset: 1.2, over: 0.4, op: 0.9 });
const ctrl = [];                                          // a round body: control points
for (let a = 0; a < 360; a += 30) ctrl.push([240 + 70 * Math.cos(a * K.deg), 220 + 62 * Math.sin(a * K.deg)]);
const loop = K.fillShape('body', ctrl, PAL.red.c, { off: [-3, 2], j: 1.4 });   // slipped fill
K.mottle(loop, PAL.red.d, 0.46);
K.clipOpen(loop);                                         // shading stays inside
K.stroke('streak', K.arc(240, 220, 60, 54, -10, 120, 6), { w: 13, t0: 20, t1: 25, wob: 1.5 }, PAL.red.d, 0.45);
K.stroke('gloss', K.arc(240, 220, 52, 48, 198, 236, 4), { w: 6, t0: 8, t1: 12 }, '#ffffff', 0.95);
K.clipClose();
const dl = K.resample(K.catmull(ctrl, true, 10), 1);      // outline in two strokes: gap top-left, overshoot
const o1 = K.stroke('o1', K.loopSlice(dl, 0.62, 1.18), { ...OUT([240, 220]), dense: true, t0: 12, t1: 10 });
K.stroke('o2', K.ext(K.loopSlice(dl, 0.2, 0.58), 3), { ...OUT([240, 220]), dense: true, t0: 8, t1: 6 });
K.hairs('hairs', o1.C, 4, { c: [240, 220] });
K.eye('eyeL', [216, 172], 21, [223, 176], 10.5);
K.eye('eyeR', [262, 168], 23, [269, 173], 11.5);
K.blush('blL', 206, 222); K.blush('blR', 280, 218);
[[96, 120, 1.5], [400, 96, 1.2], [420, 230, 1.1]].forEach((p, i) => K.fleck('fk' + i, ...p));
K.svgOut(new URL('./card.svg', import.meta.url).pathname, { label: 'Title, Ink sketch style' });   // next to card.mjs
```

Parts in the kit: `stroke` (the brush), `OUT(c)` (outline preset), `hatch`, `fillShape`, `mottle`, `clipOpen/clipClose`, `hairs`, `fleck`, `dry`, `eye` (with `lid`), `tube` plus `across`/`acrossLine`, `shadeTube` (fill, mottle, streak, gloss and rib for a limb or body), `limbOutline` (inks only the parts of a limb outside the body), `hand`, `grassPatch`, `blade`/`tuft`, `blush`, `sweatDrop`, `codeSticker`, `paperScrap` (torn note; returns T(x, y) for what you write on it), `fillRing` (a wheel or donut face-on: even-odd fill plus mottle), `arc`, `loopSlice`, `ext`, `runsOutside`, `setWScale`, `svgOut`.

A symbol drawn as one brush stroke, e.g. the infinity sign (a lemniscate, 26 px wide):
```js
const inf = []; for (let t = 0; t <= 2 * Math.PI + 0.35; t += 0.07) { const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s; inf.push([x + 13 * c / d, y + 13 * s * c / d]); }
K.stroke('inf', inf, { w: 3, t0: 3, t1: 5, nib: 0.45, press: 0.3, pf: 8 });
```

`node scripts/ink-kit.mjs --demo $W/demo.svg` writes a demo card and prints `wrote <path> 203.5KB 316 elements`: a red googly-eyed blob waving a 3-finger hand on a grass patch, with hatching, a code sticker, a sweat drop and flecks. It lints clean with `--prefix ikd-`.

## Failure modes
- **Clip-art line.** Uniform-width strokes or SVG `stroke` attributes read as vector. Every line is a brush polygon with taper and pressure.
- **Sealed outlines.** One closed loop round a shape looks traced. Break each outline into 3 to 6 strokes with one gap on the lit side and one overshoot.
- **Fill locked inside the line.** It reads as colouring-book vector. Slip each fill 2 to 3.6 px, a different direction per shape.
- **Flat colour.** A fill with no mottle, streak or gloss looks printed. Every fill gets mottle plus at least one dark streak and one gloss swipe on round forms.
- **Solid black shadow.** Hatch it; fade the hatch density toward the light with `keep`.
- **Dead googly eyes.** Centred pupils or a missing specular stare blankly. Offset pupils 4 to 10 px toward the action; always two white dots.
- **Hair everywhere.** More than 5 hairs per stroke turns the line furry. 2 to 5, on the shadow side.
- **Floating subject.** No hatched contact ellipse and no dark base streak, and the critter hovers over the grass.
- **Line weights drift in a scaled group.** Forgetting `setWScale(1/s)` makes every line 12% too thick.
- **Everything reshuffles after one edit.** Reusing or renumbering keys re-rolls marks; give each mark a stable, unique key.
- **Two cards on one page share a filter.** Call `setPrefix` with a unique prefix per card; lint with `--prefix`.
- **Typeset text.** A font in a bubble breaks the hand. Letter it with brush strokes, or say it with marks (tally strokes, chevrons, a symbol) when the glyphs would take longer than the joke.
- **Face jammed against a prop.** In testing, a hamster's nose, mouth and paws merged into a wheel rim. Keep 25 px clear round the face and never end a limb at the mouth.
- **Marks off the paper.** Tally dots spilled past a scrap's torn edge and read as stray ink. Keep marks 4 px inside their paper.
- **A floating sign.** A note hanging in the air beside the subject reads as a mistake; plant it on a stake with a hatched contact.

## Examples
- `slow-build.svg` (Slow Build): a sweating snail on a progress bar at 27%, its shell a spiral loading spinner with a hatched comet sweep; shows eyestalks, a code sticker, the grass patch, hand-lettered %, the soft contact shadow.
- `merge-conflict.svg` (Merge Conflict): a red and a teal worm butt heads where their branch lines meet; shows tube bodies with segment rings, grumpy lids, gritted teeth and a pout, commit dots, a spark burst, an anger mark, a flung `<<<<` scrap.
- `hello-world.svg` (Hello World): a potted cactus on a desk waves and says "hello, world" beside a coffee mug; shows a 3-finger waving hand with correct thumb, an arm resting over the pot rim, ribs with spine ticks, wood grain, steam curls, hand lettering in a speech bubble.

## Workflow
Run from this skill folder. `render.mjs` needs `playwright-core` (or `playwright`) installed here, in the current folder or globally, plus a Chromium.

1. **Brief.** Name the subject and the metaphor: which critter, and which part of its body carries the idea. Write down the one expression (eyes, mouth, marks) that sells it at 480 px.
2. **Hero and pose.** Sketch the silhouette on paper or in comments: spine, eye positions, ground line. For every hand, write down LEFT/RIGHT and PALM/BACK (craft.md).
3. **Set up:** `W=/tmp/ink-card; mkdir -p $W; cp scripts/ink-kit.mjs $W/`, then write `$W/card.mjs` from the Techniques skeleton with a unique prefix.
4. **Block:** ground, body fills and eyes only. Render and check size, placement and the 1x read.
5. **Draw:** shading (mottle, streaks, hatching, gloss), outlines in separate strokes, hairs, face, props, lettering, flecks.
6. **Render:** `node $W/card.mjs && node scripts/render.mjs $W/card.svg $W/card.png` (card.mjs writes card.svg next to itself).
7. **Sheet:** `node scripts/render.mjs --sheet $W/sheet.png examples/*.svg $W/card.svg`. Ask "same hand, same set?"
8. **Zoom** eyes, hands, contacts and lettering at 6 to 8x: `node scripts/render.mjs $W/card.svg $W/eyes.png --zoom x,y,w,h --scale 8`.
9. **Critique** on the five criteria in `references/craft.md` and the Verify list; fix by editing the generator (never the SVG); repeat. Expect three or four rounds.
10. **Lint:** `node scripts/lint.mjs $W/card.svg --prefix xx- --palette style.json`. Fix every ERROR; each WARN colour must be a deliberate one-off.

## Verify
- [ ] No `stroke=` attribute anywhere; every line is a filled brush polygon in `#1d1a18`.
- [ ] Outlines swell and taper (thin about 1 px, thick about 4.4 px) and each shape's outline has a gap and an overshoot.
- [ ] Every fill visibly slips past its line by 2 to 3.6 px.
- [ ] Every fill carries mottle; round forms have a dark streak and a white gloss swipe.
- [ ] Shadows and dark areas are hatched at -48 to -58 deg, spacing 2 to 3.2; no solid black areas.
- [ ] Googly eyes 40 to 55 px across, pupils offset toward the action, two speculars each, shade crescent inside.
- [ ] 2 to 5 hairs per outline stroke; 9 to 11 flecks in the margins.
- [ ] The subject rests on a grass patch or desk with a hatched contact shadow; nothing floats by accident.
- [ ] Two colour families on the subject, green or wood for the ground, palette hexes only.
- [ ] The whole card is wrapped in the prefixed `rough` filter; ids all carry the prefix.
- [ ] Lettering is brush-drawn, not a font.
- [ ] The metaphor reads at 1x without the title.
