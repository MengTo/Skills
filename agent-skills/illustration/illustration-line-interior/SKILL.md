---
name: illustration-line-interior
description: Draws original hand-written SVG spot scenes in the Line interior style, wide airy rooms or terraces where slim, realistic people do design and coding work. A thin uniform indigo outline (1.4 px at 480 wide) runs around mostly white fills. Sparse flat accents (teal, sage, coral, mustard, lavender, peach wood) cover under 7% of the card. Pale lavender 1 px background decor (brick clusters, pendant lamps, framed posters) sits behind, and a long floor line with end dashes runs under it all. Covers the palette, line weights, heads and hands from a parts toolkit, composition and a render-critique loop. Use when asked for line-art, thin-line or outline illustrations, indigo line art, office, desk, home-workspace, remote-work or team scenes, or interior spot illustrations for empty states, onboarding screens, 404 pages, blog headers, feature spots, landing sections or marketing cards.
---

# Illustration: Line interior

A calm, editorial line style: a whole room at small scale, people at about one seventh head-to-height, every shape outlined once in thin indigo and filled white, with a few flat accents. It suits product marketing that wants "people at work" without loud colour.
Use `illustration-outlined-cartoon` for big-headed characters with a near-black ~2.4 px ink line and bold fills. Use `illustration-framed-panel` when the scene should sit inside a coloured panel on a pastel card. Use `illustration-flat` when there should be no outlines at all.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence
One thin, uniform indigo outline (1.4 px) around white-filled shapes in a wide, airy room, with flat colour on under 7% of the card.

## Palette
Measured from the three examples (fills and strokes, 1x renders). White and the card make up about 85% of the pixels, indigo line about 2%, accents 4–7%.

| Role | Hex | Where it goes |
|---|---|---|
| Indigo ink | `#3a2d66` | every outline, the floor line, eye dots, indigo hair (hair is a filled ink shape) |
| Wall line | `#cfc9e0` | background decor strokes only (bricks, lamps, posters, clouds, birds, skyline, railing). Never a fill |
| White | `#ffffff` | default fill for everything: furniture, shirts, screens, pots, books, sneakers, mugs |
| Peach wood | `#f9c99a` | wood: ladder rails and boards, posts, stool, crate, a striped pot |
| Mustard | `#f5c35a` | one book, a duck, bulbs, sneakers, sticky notes, earring stud, a top |
| Orange | `#f6a85e` | a pot, trousers, a duck beak, shine arcs on brown hair, one code dash |
| Coral | `#ef5b5b` | sneakers or soles, a label, a marker tip, a mug band, one code dash, window dot |
| Teal | `#3fa58a` | a book, a top, a mug band, a hammock stripe, a check mark |
| Sage / Leaf | `#8cc79b` / `#5fae7a` | light and dark leaves, alternating leaf by leaf |
| Lavender | `#ab9ee6` | a book, a top, page lines, keyboard lines, a sneaker sole |
| Purple | `#7f6cc4` | a book, trousers, shine arcs on indigo hair, one code dash |
| Denim | `#7f9fdc` | jeans |
| Brown | `#7b4b3a` | brown hair, coffee in a cup |
| Skin | `#f3cdb0` `#e2a57c` `#b47852` `#7a4b33` | light, medium, deep, dark; two people in a card get two different tones |

- Never: gradients, opacity, drop shadows, hatching, black, grey fills, the wall-line colour as a fill, a coloured background rect.
- One accent per object. A person wears at most two accents plus white: top, trousers, and sneakers where either the upper or the sole is white.
- No two large accent shapes of the same hue touch (a coral shoe on a coral rug). Keep the big shapes (shelf, board, desk, hammock) white or peach.

## Line and fill
- Two layers. Background: `<g id="xx-bg" fill="none" stroke="#cfc9e0" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">`. Foreground: `<g id="xx-fg" stroke="#3a2d66" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">`. Shapes inherit the stroke; each sets its own `fill`.
- Outlines are strokes on filled shapes, never filled outline shapes. Every foreground shape gets a fill (white if nothing else), so overlap hides what is behind. Depth comes only from overlap order: draw back to front, far limbs before the torso.
- Weights at 480 wide: 1.4 for every outline; 1 for detail lines (fabric folds, leaf veins, book bands, lace ticks, ear inner, brows, nose, mouth, steam, x marks, hair shine); 0.9 for finger separations; 1.2 for whiteboard diagram strokes; 1.7–1.8 coloured dashes for code on screens; 2.2 for bullet dots (`M190 146h0.1`).
- Shading: none. No tone steps, no hatching, no highlights. A fold is one 1 px curve, 4–8 px long, 2–3 per garment.
- Texture: tiny x marks (`xm()`, 3 px, stroke 1), 2–4 per pot or box. Never on clothing.
- Lettering: `font-family="ui-monospace, monospace" font-weight="700"`, 4.4–5.2 px, 2–5 letters (JS, CSS, UX, API, CACHE) on a small label rect, `stroke="none"`.
- Rounded corners: rx 0.6–1 on books and bricks, 1.5–2.5 on furniture tops and frames.

## Characters
- Proportions: a standing figure is 229–235 px from crown to sole; the head (chin to crown) is 33–36 px, so 1:7. Slim: shoulders about 30 wide, legs with hip half-width 9.6–11 tapering to 5.6–5.8 at the hem.
- Head: build it with `head()` from the toolkit. It draws a 3/4 profile facing left or right: one face path with the nose and chin in the contour, an ear on the back side, a near eye dot (r 1.15) and a far eye dot (r 1.0) 4.9 apart, two 1 px brows, a nostril tick and a short mouth arc. No cheek colour, no pupils, no open mouths. Calm, slightly smiling.
- Hair: one flat shape in indigo `#3a2d66` (1–4 shine arcs in purple `#7f6cc4`) or brown `#7b4b3a` (shine in orange `#f6a85e`). Presets: `afro`, `bun`, `side`, `crop` (+ `beard`, `glasses`, `earring`). The afro's back mass returns as `behind`: draw it before the torso.
- `head(x, y, rot, opts)` rotates in screen degrees (+ = clockwise). That nods a right-facing head DOWN and a left-facing head UP. Tilt 4–9° toward what the person looks at.
- Neck and torso: `torso(hx, hy, { style: 'tee' | 'top', facing, fill, skin })` draws the neck, a soft shirt shape 30–34 wide (crew-neck tee or fitted top with a small V collar) and two 1 px folds, all placed from the head centre. `TORSO_ANCHORS[style]` gives the shoulder, hip and waistband points relative to the head centre. Mirror their x for a left-facing figure. Tops are white or one accent.
- Sleeves: `sleeve(S, arm.u, 13, 5.8)` caps the upper arm; drawn after the arm. A flatter sleeve (half-width under 6) avoids a shoulder-pad look.
- Arms: `bentArm()` with half-widths 4.4–5 shoulder, 4–4.4 elbow, 3.2–3.4 wrist. It gives a pointed outer elbow; add the 3 px crease line from `arm.I`. Upper arm 27–40, forearm 24–33. Use `solveElbow(S, wrist, 35, 30, flip)` and try both `flip` values: the right one hangs the elbow below the shoulder-to-wrist line. Keep the wrist 45–60 px from the shoulder. Closer, and the arm folds into a chicken wing.
- Put a fingertip on a target with `wristFor(HANDS[name].tip, target, angle, scale, flip)`. It returns the wrist point to solve the arm to.
- The far arm in a profile view: show it. Swing it back behind the hip (or forward behind a held object), drawn before the torso, so a forearm and a `rest` hand show below the torso. A figure with one arm reads as "an arm is missing".
- Hands (toolkit `HANDS`): 17 local units at scale 1.05–1.15, so 18–20 px long, about the face from chin to brow. Fingers are 3–4 rounded bands with 0.9 separation lines; the middle finger is longest, the little finger shortest. Shapes: `type` (palm down on keys), `cup` (wrapped round a mug, thumb over the rim), `wrap` (same, thumb hidden behind the object), `marker` (fist round a pen, with `HANDS.marker.pen()`), `point` (index out, thumb tucked), `rest` (relaxed).
- Every hand shape has its thumb on local −y. Decide LEFT or RIGHT and PALM or BACK with the table in `references/craft.md`, then pass `flip = true` when the thumb belongs on +y.
- Legs and feet: `trouserLeg()` for standing legs (tapered, flat hem, 5.2 px rolled cuff band, 4–10 px of ankle skin); `bentLeg()` + `cuffAndAnkle()` for sitting or stepping. `sneaker()` is 25 × 10.6 with a 3 px sole band and two lace ticks; heel at the floor point, mirrored with `scale(-1 1)`. End each trouser leg at the shoe's `shoeOpening(heel, rot, mirror)`.
- Rear foot on its toes: `heel = liftedHeel(toeX, 22–28, mirror)`, then `sneaker(\`translate(heel) rotate(deg)\`)`. For a mirrored shoe use `rotate(-deg) scale(-1 1)` and `shoeOpening(heel, -deg, true)`.
- Poses that work: reaching up to a shelf or board, or pressing a button, with the upper body leaning 4–9° (rotate the upper-body group about the hip and the shoulder points with `rotAbout()`); the rear heel lifted so only the toe touches the floor; lying in a hammock with the laptop on the thighs; sitting on a stool, one foot on the rung, holding a cup.

## Decor and props
- Background layer (wall line, unfilled), all of it pale and secondary: 2–3 brick clusters of 3–5 bricks (`bricks()`, 14 × 6, rows 7 apart), 1–2 pendant lamps hanging from the card's top edge (`lampDome()`, `lampCone()`), 1 framed poster on a nail (`poster()`) with a simple icon inside. Outdoors: 2–3 outline clouds, 2–3 birds, a skyline and a railing instead of bricks.
- Foreground, per card: one hero prop in the middle that carries the subject (ladder shelf 98 × 203, whiteboard on wheels 160 × 256, hammock between posts 260 wide); one tall plant in a pot at one end (60–68 wide, 150–185 tall); one secondary piece at the other end (desk with a monitor and mug, a short snake plant, a stool with a colleague); 2–4 small props (mug with two 1 px steam curls, books with band lines and labels, a rubber duck, sticky notes, a monitor with window dots and coloured code dashes).
- Plants: `leaf()` (lance leaves with veins), `figLeaf()` (fiddle-leaf fig), `blade()` (snake plant), stems as 1.4 px open curves from the pot, leaves alternating sage and leaf green. Pots: `pot()`, white with x marks, peach with 1 px bands, or orange.
- Never: sparkles, confetti, floating icons, speech bubbles, shadows under objects, rugs, more than two items on the floor beside the hero.

## Composition
- No background rect: the card is white (the examples have none). If the host page is not white, add a square full-bleed `#ffffff` rect first.
- Floor line at y 308: `M56 308H424M40 308h10M430 308h10`. Every foot, pot, leg and caster stands on it. The band below (y 308–360) stays empty.
- Content spans x 33–445. Only lamp cords touch an edge (the top). Everything else stays at y ≥ 25.
- Left to right: tall plant (x 33–121) | hero prop with the figure acting on it (x 115–335) | secondary furniture or plant (x 330–445). Mirror this freely, but keep the hero central.
- Figures: 94–190 px wide, 235 tall standing. One focal action, at the figure's hands.
- Density: about 10–14 foreground objects including plant leaves; generous white space between groups. Busy is wrong here.
- Group transforms the examples use: `translate(-8 0)` to nudge a whole figure; `rotate(-7 284 180)` on the upper-body group (neck, torso, head, sleeve) to lean it over the hips.

## Techniques

**1. A parts toolkit.** `scripts/interior.mjs` (no dependencies) has every repeated part with the examples' numbers: layers, floor, bricks, lamps, poster, cloud, leaves, pots, `limb`, `bentArm`, `solveElbow`, `sleeve`, `torso`, `trouserLeg`, `bentLeg`, `cuffAndAnkle`, `sneaker`, `shoeOpening`, `liftedHeel`, `rotAbout`, `HANDS` + `hand()` + `place()` + `wristFor()`, `head()` and `mirrorPath()`. Run `node scripts/interior.mjs --demo /abs/work/demo.svg` from the skill folder (write it into your work folder, not the skill) and render it to see every part. The demo output is a parts sheet: four heads, six hands with thumbs up, two plants, the lamps, the bricks and a standing figure built from the parts.

A complete figure, tested: a woman facing left points at a chart. Save it as `card.mjs` next to your card, fix the import path, and run `node card.mjs`.

```js
import fs from 'node:fs';
import * as LI from '/abs/path/to/illustration-line-interior/scripts/interior.mjs';
const { W, C, SKIN, FL, P, f } = LI, id = 'sn-', sk = SKIN.medium;
const HC = [300, 102], A = LI.TORSO_ANCHORS.top, rel = q => [HC[0] - q[0], HC[1] + q[1]];  // facing left: mirror x
const LEAN = -5, PV = [300, 188];                                   // lean toward the left, about the hips
const h = LI.head(HC[0], HC[1], -4, { hair: 'bun', facing: 'left', skin: sk, hairColor: C.brown, earring: true });
const heelB = LI.liftedHeel(300, 24, true);                         // rear heel up, toe on the floor
const legF = LI.trouserLeg([[296, 188], [293, 230], [291, 270], [290, 291]], [10, 8, 6.2, 5.8], LI.shoeOpening([297, FL], 0, true), C.denim, sk);
const legB = LI.trouserLeg([[306, 188], [309, 230], [313, 262], [316, 282]], [10.6, 8.4, 6.4, 5.8], LI.shoeOpening(heelB, -24, true), C.denim, sk);
let fg = LI.floor(id);
fg += `<rect x="150" y="96" width="70" height="54" rx="2" fill="${W}"/><path d="M158 138l14-16 10 9 12-15 16 12" fill="none" stroke="${C.teal}" stroke-width="1.8"/>`;
fg += legB.skin + LI.sneaker(`translate(${P(heelB)}) rotate(-24) scale(-1 1)`, C.coral, W) + legB.leg;
fg += legF.skin + LI.sneaker(`translate(297 ${FL}) scale(-1 1)`, C.coral, W) + legF.leg;
fg += `<rect x="284" y="${HC[1] + A.waistTop}" width="33" height="5" rx="0.8" fill="${C.denim}"/>`;
fg += `<g transform="rotate(${LEAN} ${P(PV)})">${LI.torso(HC[0], HC[1], { style: 'top', facing: 'left', fill: C.lav, skin: sk })}${h.front}</g>`;
// near arm = LEFT (she faces left); back of the hand visible, index pointing left -> thumb UP.
// HANDS.point keeps its thumb on local -y; at 186 deg local -y points DOWN, so flip = true.
const S = LI.rotAbout(rel(A.nearShoulder), LEAN, PV), ang = 186, tip = [221, 124];
const Wr = LI.wristFor(LI.HANDS.point.tip, tip, ang, 1.1, true);
const arm = LI.bentArm(S, LI.solveElbow(S, Wr, 36, 30), Wr, 4.6, 4.2, 3.3);
fg += `<path d="${arm.d}" fill="${sk}"/><path d="M${P(arm.I)}l${f(-arm.u[0] * 3)} ${f(-arm.u[1] * 3)}" fill="none" stroke-width="1"/>`;
fg += `<path d="${LI.sleeve(S, arm.u, 13, 5.8)}" fill="${C.lav}"/>` + LI.place(LI.hand('point', sk), Wr[0], Wr[1], ang, true, id + 'hand', 1.1);
const bg = LI.bgLayer(id, LI.bricks(60, 80, [[0, 0], [15, 0], [7, 7]]) + LI.lampDome(380, 40));
fs.writeFileSync('card.svg', LI.svgWrap(bg + LI.fgLayer(id, fg), 'Snippet test, Line interior style'));
```
It still needs the far arm, a plant, the hero prop and the room. It shows the order: legs → waistband → leaned torso and head → near arm → sleeve → hand.

**2. Hands without a wrist wedge.** Draw the hand outline twice: once filled with `stroke="none"`, once as an open path (the `Z` removed), then the 0.9 finger lines, then the thumb. `hand()` does this. A closed stroke across the wrist draws a dark wedge where the forearm meets the hand.

**3. Lean by group rotation.** Put the torso (with its neck), any backpack or strap and the head in one `<g transform="rotate(-7 hipX hipY)">`. Solve the arms in card coordinates from `rotAbout(shoulder, -7, [hipX, hipY])`, so the hand still lands on the object, and draw the arm, sleeve and hand outside the group.

**4. Screen and board content in colour, not ink.** Code on a monitor is 4–6 rows of round-capped dashes, `stroke-width="1.8"`, each dash one accent (purple, teal, coral, lavender, orange), on a white screen with three window dots (coral, mustard, teal, r 0.9). Diagrams are 1.2 px boxes and arrows in ink, one box in coral and one in teal.

## Failure modes
- **Too much colour.** The first Books draft (scored 6) had a mustard top, a brown shelf, an orange pot and x marks on the clothes. The redraw that reached 8 used colour more sparingly. Keep big shapes white or peach, and accents under 7% (white ≥ 83%).
- **The subject reads as something else.** A developer standing at a desk read as "standing desk", not "Books". The figure must do the subject: pull the book off the shelf, draw on the board.
- **Bolt-upright clip-art figure.** Lean the upper body 4–9°, put the weight on one leg, lift the rear heel. Front-facing symmetric poses score a point lower.
- **Dark wedge at the wrist.** A closed outline across the wrist. Use `hand()` (fill pass plus open outline).
- **Thumb on the wrong side.** Two shipped hands were copies of a right-hand template on a left arm (Remote Work's far typing hand, Whiteboard's mug hand), and both had to be mirrored. Work out handedness per hand, then `flip`.
- **Mitten or rake hands.** Fingers must be grouped bands of different lengths with rounded tips, 18–20 px long. Larger reads as a glove.
- **Arm with no elbow.** A straight tube from shoulder to object reads as a prosthetic. Use `bentArm()` and the crease line.
- **Chicken-wing arm.** The target sat 33 px from the shoulder, so a 66 px arm folded up with the elbow out. Move the prop or the figure until the wrist is 45–60 px from the shoulder, and try the other `flip`.
- **One-armed figure.** A profile figure with the far arm hidden reads as missing an arm. Swing the far arm back so its forearm and hand show behind the hip.
- **Stray ticks.** A 1 px fold line within 4 px of a limb's edge, or a strap end poking 2 px out from under a sleeve, reads as a slip. End a covered shape at least 3 px inside the shape that covers it, and keep folds away from other contours.
- **Floating feet or pots.** Sneaker heels sit at y 308 exactly. A rotated rear shoe touches the floor with its toe. Check every contact at 8x.
- **X marks on clothes.** They read as stains. Keep them on pots and boxes.
- **Background competing with the figure.** Decor drawn in indigo or filled looks like foreground clutter. It is wall-line `#cfc9e0`, 1 px, unfilled, and sits at least 8 px clear of the figure's head.
- **Weight drift.** A 2 px outline or a 0.6 px detail breaks the style at once. Use exactly 1.4, 1 and 0.9.

## Examples
- `examples/books.svg`: "Books". A reaching pose with a −7° lean and a bent near arm gripping a book on the shelf (thumb on top). The far hand holds an open book at the hip. Afro back hair is drawn behind the torso. Ladder shelf with labelled books, a duck, a desk with a monitor, lance-leaf plant.
- `examples/remote-work.svg`: "Remote Work". Lying in a hammock with both hands on a laptop (`type` hands, mirrored for left and right). Outdoor variant of the background (clouds, birds, skyline, railing), string lights, a crate with a mug, monstera leaves, a snake plant. A `clipPath` hides the legs behind the hammock rim.
- `examples/whiteboard.svg`: "Whiteboard". Two people: one reaching up with a `marker` fist and a `wrap` hand on a mug, one seated on a stool with a `cup` hand, beard and glasses. Diagram content in 1.2 px ink and accent strokes, sticky notes, casters on the floor line, fig plant.

## Workflow
Run every command from this skill's folder. Card paths can be absolute.
1. **Brief.** Name the subject in a few words and write the one action that shows it (who does what to which prop). Pick the hero prop and the pose.
2. **Plan the layout** on the 480 × 360 grid: floor y 308, plant at one end, hero prop centred, secondary piece at the other end. Pick the skin tones, hair presets and the 2 accents each person wears. Choose an id prefix (`ob-`).
3. **Write a generator** (`card.mjs`) that imports `scripts/interior.mjs` by absolute path and writes `card.svg`. Start from the Techniques snippet. Look at the `--demo` parts sheet once. Hand-place the figure and the hero prop; take everything repeated from the toolkit. Print the solved shoulder, elbow and wrist points so you can find them when you zoom.
4. **Hands first, on paper.** For each hand, write down LEFT or RIGHT, PALM or BACK, and the finger direction, then the thumb side (see `references/craft.md`). Choose the `HANDS` shape and `flip`.
5. **Render:** `node scripts/render.mjs card.svg card.png`.
6. **Sheet with the examples:** `node scripts/render.mjs --sheet sheet.png examples/books.svg examples/remote-work.svg examples/whiteboard.svg card.svg`. Ask "same hand, same set?": line weight, white share, density, floor, decor.
7. **Zoom** every hand, face, foot and contact: `node scripts/render.mjs card.svg z-hand.png --zoom x,y,w,h --scale 8`. Do the thumb proof from `references/craft.md` for every hand.
8. **Critique** against the five criteria in `references/craft.md` and the Verify list below. Fix, re-render, re-sheet. Expect four or more rounds.
9. **Lint:** `node scripts/lint.mjs card.svg --prefix ob- --palette style.json`. Fix every ERROR. Each WARN must be a deliberate tint.

## Verify
- [ ] Every foreground outline is `#3a2d66` at 1.4; details are 1, finger lines 0.9; no other weights apart from code dashes (1.8) and diagram strokes (1.2).
- [ ] Background decor is `#cfc9e0`, 1 px, unfilled, and never overlaps a head.
- [ ] On the sheet, the colour looks no heavier than the examples (they measure 84–86% white pixels, accents 4–7%). The big shapes are white or peach, and nothing uses a gradient, opacity or shadow.
- [ ] Floor line at y 308 with both end dashes, and every foot, pot, leg and caster touches it.
- [ ] Lamps hang from y 0; nothing else touches a card edge; the y 308–360 band is empty.
- [ ] A standing person is about 230 px tall with a head about 34 px (1:7).
- [ ] Each person wears at most two accents plus white; two people have different skin tones.
- [ ] Every hand is 18–20 px long, has 3–4 grouped fingers with 0.9 separation lines, and its thumb is on the side the craft table gives (thumb proof done).
- [ ] Every arm has a shoulder, a pointed elbow with a crease, and a wrist narrower than the hand. Both arms show, even in profile.
- [ ] The upper body leans or twists; the weight is on one leg or on a seat.
- [ ] The subject reads at 1x from the figure's action alone, without the labels.
- [ ] No x marks on clothing; 2–4 on pots or boxes at most.
- [ ] `lint.mjs --palette style.json` passes with no unexplained WARN.
