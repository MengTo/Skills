---
name: illustration-two-colour-brush
description: Draws original design and coding scenes as hand-authored SVG cards (480x360) in a two-colour brush-marker style. Identifying traits: thick wobbly black marker lines with blobby ends, built as filled ribbons; one second ink, mint green, in flat blocks that slip 2-10 px off the line like a misregistered print; solid black hair, trousers and shoes with mint highlight dashes; and a crinkly squiggle camo on cream areas, all on warm cream paper. Characters are chunky, with profile heads, big noses, dot eyes, big hands and feet. It covers people coding, thinking, carrying and resting with laptops, mugs, chairs and rubber ducks. Use when someone asks for brush, marker, felt-tip, two-colour, duotone, riso-print, zine, mint-and-black or doodle illustrations, or for empty states, onboarding, 404 pages, blog headers, feature spots or marketing cards with a bold hand-made look.
---

# Illustration: Two-colour brush

Loose, confident marker drawings in two inks, black and mint, on cream paper. A chunky character does one readable thing, drawn with fat wobbly lines; mint sits in flat blocks that never quite line up with the black. It suits playful product moments that want energy and a human hand: empty states, onboarding, error pages, editorial headers.

Boundary: for a wobbly brush line with hatching and full colour, use `illustration-ink-sketch`. For a single continuous line with off-register colour, use `illustration-one-line`. For thin black line with halftone dot shading, use `illustration-halftone-line`. For flat colour with solid black shapes and no marker texture, use `illustration-flat-with-black`.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence

Every line is a fat, wobbling, blob-ended black marker ribbon, and the only other ink is flat mint green laid as a second plate that slips a few pixels off those lines, on cream paper.

If the lines go even-width or the mint registers exactly inside the outlines, it stops being this style.

## Palette

Four colours, measured from the examples. Nothing else is ever drawn.

| Role | Hex | Where it goes |
|---|---|---|
| Paper | `#f1ede3` | full-bleed card, skin (faces, hands, necks), knockout halos behind front objects |
| Ink | `#141412` | every line; solid hair, beards, trousers, hoodies, shoes, laptop lids, mugs, night panes |
| Mint | `#4fd592` | offset plates on bodies and props, highlight dashes on black, floor bands, screen glow, stickers |
| Off-white | `#f7f4ec` | shirts and chair upholstery under camo, toe caps, glints on black, bubbles, beaks, laptop shells |
| (clip only) | `#000` | fill of `<clipPath>` shapes; never visible |

Never: a third hue, grey, tints or opacity, gradients, filters, drop shadows, or `stroke=` lines (the only stroked paths are paper halos). Skin is paper, not a skin tone. Mint never touches mint: separate two mint areas with a black line or paper.

## Line and fill

- **Every line is a filled ribbon** from `scripts/brush.mjs`, never an SVG stroke. On the 480 card the nominal width `w` renders at `w x 1.42` (w >= 4), `w x 1.28` (3.3-3.9) or `w x 1.1` (below 3.3), whatever the fit scale.
- **Widths in use (card px):** floor line w 5.2-5.8 (7.4-8.2); big silhouettes (duck, armchair, hair) w 4.4-4.8 (6.2-6.8); standard outlines (body, limbs, props) w 4.0-4.2 (5.7-6.0); hands, mugs, small props w 3.0-3.8 (3.3-4.9); inner lines, glyphs, creases, tread w 2.0-2.8 (2.2-3.1); camo w 2.5-2.8.
- **Wobble:** width varies ±34% along a stroke, the start blob swells 38-78% and the end 26-66%, long strokes get 1-3 swells, and the centre-line wanders 0.95 px. Keep the defaults; pass `v: 0.05-0.15` only for small glyphs and clock hands.
- **Outlines** of closed shapes are ONE `loop()` stroke that starts somewhere (`start` 0-1) and overlaps its own start by 4%. A visible overlap blob is correct. `part: 0.93` leaves a deliberate gap.
- **Solid black shapes** (hair, trousers, shoes, hoodie): `fillShape(ink)` then a `loop()` outline round them, so the edge is lumpy.
- **The mint plate:** fill the shape with paper or off-white, then the SAME shape in mint shifted by (dx, dy), then the black outline. Offsets on the examples run from 2 to 10 px, mostly up-left (-3..-7, -2..-6), a few down-right. On black shapes, put the shifted mint BEFORE the black fill so mint peeks out along one edge.
- **Halos:** where a front object crosses a black shape, lay `halo(shape, 3-12)` first: a paper fill plus paper stroke that cuts a clean gap. Shoes 10-11, a front leg 8.5, a laptop lid 6-8, hair 9, arms 6, palms 5, thumbs 3.
- **Highlights:** 2-4 mint dashes (w 2.4-3.0, 8-16 long) along the inside edge of each black shape, 4-5 in from the outline; off-white dashes (w 2.4-3.0) for glints on shoes, mugs and lids.
- **Squiggle camo** on off-white areas only: 3-7 crinkled wandering lines, 1-3 closed puddles and 1-4 small o-rings (r 3.4-4.2) per area, w 2.5-2.8, clipped to the shape with `clipped()`, drawn before the outline.
- **Stipple:** clusters of 3-5 dots r 1.0-1.5 in ink or mint beside a form (a cushion, a cheek, a belly).

## Characters

- **Proportions:** chunky. The head with hair is about 1/3.5 of a seated figure's height; limbs are fat tubes (legs 38 → 23 wide, arms 30 → 24, in scene units before fit); hands about as long as the face; shoes about as long as the head is wide.
- **Head:** profile or 3/4, facing the action. Paper fill; the outline runs only down the face side as two open strokes (forehead → big bulbous nose → upper lip, then chin → jaw), w 4.0. The nose sticks out about 15 units and is the largest feature. `profileHead(x, y, { deg, scale, facing, hair, eye, mouth })` in `scripts/brush.mjs` draws the set's head with a neck block: hair `curly` | `bun` | `ponytail`, eye `open` | `shut` (straining) | `tired`, mouth `smile` | `talk` | `teeth` | `flat`; `facing: -1` mirrors it. Scale 1.1-1.3.
- **Hair:** a lumpy black blob of 20-26 control points with a `loop()` outline (w 4.0) and 2-4 short mint dashes inside. Curly hair, buns and beards are all solid black.
- **Face:** a dot eye r 3.6-3.9 (ink) with an off-white glint r 1.0 up and toward the nose; a brow arc w 3.0-3.2 above; an ear (paper fill, C-stroke w 3.4, inner curl w 2.8); a smile or flat mouth w 3.0-3.4. Tired: a heavy lid stroke plus a bag line w 2.4.
- **Neck:** a paper block with one side line w 3.2-3.4.
- **Clothing:** off-white shirts and sweaters carry camo; trousers and hoodies are solid black with mint dashes; cuffs are mint tubes or a single stroke across the wrist.
- **Hands, open:** `openHand()` with five tapered fingers of different lengths, from local angles thumb -58°, index -14°, middle -3° (longest, 23), ring 9-10°, little 24-25° (shortest, 15); a paper fill plus one open outline w 3.2-4.0; a short tapered palm crease w 2.6. The thumb leaves the palm near the wrist at about 45°.
- **Hands, gripping:** a paper palm block (loop w 3.0-3.2), separate finger tubes 7.4 → 6.6 wide and 14-18 long with round ends, about 7.5 apart, laid across the object (each its own `loop()` w 2.6), and a thumb tube 9 → 7 closing over from the other face, with a 3 px halo. A block hand can instead show three finger-separation dashes (w 2.0) from the edge inward. `fist(x, y, deg, { thumb: 'top' | 'bottom' })` draws the back-of-hand fist round a bar or rope (knuckles along `deg`, the forearm direction). A far hand behind the bar shows only a palm block plus three fingertip tubes curling over the bar's front. Put every thumb where `references/craft.md` handedness says, and run the thumb proof.
- **Feet:** big shoes: black upper, off-white toe cap, a mint sole plate offset 1.5-2.5, three tread strokes (w 2.4), two off-white lace dashes. Cross-legged figures show the soles. Slippers are mint with an off-white rim. `shoe(ankle, deg, scale, facing)` draws the shoe; a negative `deg` (-25 to -30) tips the toe up for a heel dug into the floor.
- **Poses that work:** sitting cross-legged on a cushion talking with one big open hand (Rubber Ducking); striding in profile with a lean, one arm steadying a load (Coffee-Driven); slumped in an armchair with a laptop on the lap and a mug raised (Night Owl). Hauling (the self-test's Deadline): the body is one straight line from the front heel to the head at about 35° off vertical, both heels dug in with the toes up, arms straight to two fists at waist height on a taut rope, the far fist at least 15 units in front of the chest line so its forearm shows.

## Decor and props

- **Emphasis ticks:** 4 marker strokes (w 4.0-4.2, 9-14 long) fanned from -150° to -55° round the head, 44-62 units from its centre. Over a black shape, lay a paper underlay first.
- **Accents:** a speech bubble (off-white, loop w 4.2) with `{…}` or `!`; `?!` marks; 3 speed lines (w 3.6-4.0, 40-54 long); 2 steam squiggles (w 3.0, 4 points); 4-point stars (off-white or mint) only inside a night window.
- **Props:** laptop (off-white or black lid, mint `</>` sticker, key dashes), mugs and takeaway cups (black or off-white with mint), rubber duck, floor cushion, armchair with camo upholstery, window with a mint moon, wall clock, plug and coiled cable.
- **Per card:** one figure, 1-3 big props, 2-4 small accents. Never a background shape, a frame, confetti, logos, or text beyond code glyphs (`</>`, `{…}`, `!`, `?`).

## Composition

- **Card:** `<rect id="p-paper" width="480" height="360" fill="#f1ede3"/>`, then one `<g id="p-art">` holding the fitted scene.
- **Size:** `build()` fits the control-point bounding box into 392 x 278 centred on (240, 184): the art spans about x 44-436 and y 45-323, so margins are about 44 px left and right, 45 top, 37 bottom. `build()` prints the fit scale `S`: the figure should land 200-250 px tall on the card (its height in scene units x S). A prop parked at the far edge widens the box and shrinks everything; in the self-test a laptop on the floor pushed S to 0.91 and the figure went small. Move or drop it.
- **Ground:** one or two black floor strokes (w 5.2-5.8) under the feet, often with a mint band (w 8.5) or a mint rug plate under them. Every foot, chair leg and object touches it.
- **Focal point:** the face and the gesturing hand, in the upper-middle third; the joke or prop sits beside it, never behind it.
- **Density:** sparse. Leave the paper open around the group; one cluster of marks, not an all-over pattern.

## Techniques

`scripts/brush.mjs` is the marker engine from the shipped cards (seeded, no dependencies). Check it from the skill folder:

```bash
node scripts/brush.mjs --demo /tmp/brush-demo.svg && node scripts/render.mjs /tmp/brush-demo.svg /tmp/brush-demo.png
```

A card generator (keep it in your own work folder and import the helper by absolute path; an ES import resolves against the generator file, not the cwd):

```js
import { createBrush } from '/abs/path/to/illustration-two-colour-brush/scripts/brush.mjs';
const B = createBrush({ prefix: 'dl-', seed: 11 });
const { INK, MINT, PAPER, OFF, stroke, loop, fillShape, halo, dot, tube, xf, openHand, camo, clipped, ticks, rr,
        profileHead, shoe, fist, add, sub, mul, lerp } = B;
B.build(() => {
  const L = [], P = s => L.push(s);
  P(stroke([[60, 330], [200, 331], [340, 329]], { w: 5.6, v: 0.15, nobb: true }));    // floor
  const torso = [[150, 138], [120, 170], [114, 236], [165, 262], [210, 238], [190, 154]];
  P(fillShape(torso, OFF));                                                             // off-white shirt
  P(clipped(torso, camo([[[114, 176], [146, 178], [178, 176], [210, 182]]], [], [[140, 220, 4]])));
  P(loop(torso, { w: 4.2, start: 0.55 }));                                              // one-stroke outline
  const leg = tube([[234, 250], [220, 272], [208, 298], [200, 322]], [38, 34, 27, 23]);
  P(halo(leg, 8)); P(fillShape(leg, MINT, -4, -3)); P(fillShape(leg, INK)); P(loop(leg, { w: 4.2 }));
  P(stroke([[214, 276], [208, 290]], { w: 2.8, fill: MINT }));                           // highlight dash
  return L.join('\n');
}, 'card.svg', { label: 'Deadline, Two-colour brush style' });
```

- Draw in any units; `build()` runs the scene twice (measure, then fit). Use `nobb: true` on floor lines and decor that should not widen the fit.
- Keep all randomness in `B.rnd()` so a re-run gives the same card; adding a stroke early changes every later wobble, so append new strokes at the end of a section when tuning.
- `xf(points, x, y, deg, scale)` places a local shape on the card; `tube(centre, widths)` returns control points for limbs; `rr()` gives rounded rectangles; `ticks(cx, cy, angles, r0, r1)` draws emphasis ticks; `star()` a 4-point sparkle.
- Character parts: `profileHead()`, `shoe()`, `fist()` and `openHand()` reproduce the shipped cards' construction. Use them rather than redrawing heads and shoes from scratch.

## Failure modes

- **The joke didn't read at 1x.** Coffee-Driven ("stack overflow") scored 7: five small cups on a laptop read as a stack, not an overflow. Make the gag object the second-biggest mass, exaggerate it (taller than the head, tilting, spilling over), and check the 1x render without its title.
- **The sitting pose read as standing.** Night Owl scored 7.5: the legs dropped straight from the hoodie to the floor in front of the chair. Show the lap: thighs as a foreshortened block toward the viewer, knees at or above the hips, shins hanging from the knees in front of the seat edge.
- **Thumbs on the wrong side.** Both Night Owl hands and the lower Coffee-Driven hand were mirror-swapped and had to be redrawn. Decide left/right, palm/back and finger direction before drawing each hand.
- **Rake hands and blob shoes.** Rubber Ducking's first hand had five equal sausage lobes and a stub thumb, and its shoes were fat ovals. Taper the fingers, vary their lengths, angle the thumb out about 45° with a web; draw shoes with uppers, toe caps, soles and tread.
- **Even, mechanical lines.** SVG strokes or `v` near 0 on big outlines read as vector, not marker. Use ribbons with the default wobble and blob ends.
- **Colouring-book mint.** Mint filled exactly inside the outline loses the two-plate print feel. Offset it 2-10 px.
- **Grey mush at 1x.** Dense, even camo or too many stipple dots turns cream areas grey. Keep camo to off-white areas, 3-7 lines per area, with open gaps.
- **Overlaps that tangle.** A front limb drawn over a black shape without a halo merges into it. Halo it.
- **The figure hugs the prop.** In the self-test's first rounds the puller stood inside the clock's outline and read as hugging it, then as crouching. Keep the figure's silhouette clear of the big prop; only hands, a rope or a tool cross over. Build the pose as one readable line of action first, then add parts.
- **A fist with no arm.** A far hand placed behind the torso edge floats. Move it forward until its forearm shows.

## Examples

- `examples/rubber-ducking.svg` (Rubber Ducking): a curly-haired developer sitting cross-legged on a mint cushion, talking to a giant rubber duck with an open hand, laptop on the knee, `{…}` bubble, `?` over the duck. Shows the open hand, profile head, camo sweater, crossed legs with soles, the duck's big mint offset plate.
- `examples/coffee-driven.svg` (Coffee-Driven): a developer with a hair bun striding right, carrying an open laptop like a tray with a toppling tower of coffee cups. Shows a walking lean, speed lines, a palm-up grip and a flat palm steadying the stack, drips, the shoe build.
- `examples/night-owl.svg` (Night Owl): a tired developer slumped in a camo armchair at 3 a.m., laptop on the lap, mug raised, night window with a mint moon, clock, plug and cable. Shows camo upholstery, a lid grip and a mug grip, mint screen glow on the face, slippers on a mint rug.

## Workflow

Run commands from the skill folder (the one holding this file).

1. **Brief:** name the subject and the one gesture that sells it at 1x. Write the gag in one line if there is one ("pushing the clock's hand back").
2. **Pose and hero:** pick the figure's pose and the 1-3 props. For each hand write down left or right, palm or back, finger direction and thumb side (`references/craft.md`).
3. **Block:** write `gen.mjs` next to your card, importing `scripts/brush.mjs` by absolute path. Place control points for floor, props and the body as `fillShape`s only; build and render.
4. **Draw:** add `loop()` outlines, the mint plates with offsets, halos where things overlap, camo, highlight dashes, face, hands, shoes, ticks and accents.
5. **Render:** `node scripts/render.mjs card.svg card.png`.
6. **Sheet:** `node scripts/render.mjs --sheet sheet.png examples/*.svg card.svg`. Same hand, same set? Compare line weight and mint area.
7. **Zoom:** `node scripts/render.mjs card.svg z-hand.png --zoom x,y,w,h --scale 8` on every hand, the face, each shoe and each contact.
8. **Critique** on the five criteria in `references/craft.md`; fix; rebuild. Expect 4 rounds. Do the thumb proof for each hand.
9. **Lint:** `node scripts/lint.mjs card.svg --prefix dl- --palette style.json`. There should be no WARN at all.

## Verify

- [ ] Only `#141412`, `#4fd592`, `#f1ede3`, `#f7f4ec` appear (plus `#000` inside clipPaths); lint shows no WARN.
- [ ] No `stroke=` except on paper halos and tick underlays; every line is a filled ribbon.
- [ ] Big outlines are visibly uneven at 2x, with blob ends; no long line has constant width.
- [ ] Every mint block is offset from its outline by 2-10 px; no mint area touches another.
- [ ] Hair, trousers and shoes are solid black, each with 2-4 mint or off-white highlight dashes.
- [ ] Camo appears only on off-white areas, clipped, with open gaps.
- [ ] Faces: profile, big nose, dot eye with a glint, brow, ear; skin is paper.
- [ ] Every hand traces back to a cuff and an arm, has tapered fingers of different lengths, and its thumb is on the correct side.
- [ ] Feet and every resting object touch the floor line or a surface; a seated figure shows a lap.
- [ ] Front objects that cross black shapes have halos; no accidental tangents.
- [ ] Art is fitted by `build()` (about 44 px side margins); nothing touches the card edge.
- [ ] The subject reads at 1x (480 wide) without a caption.
- [ ] Every id starts with the prefix.
