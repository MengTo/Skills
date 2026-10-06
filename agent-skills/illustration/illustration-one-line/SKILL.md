---
name: illustration-one-line
description: Draws original hand-written SVG spot illustrations in the One-line style, joyful action figures doing design and coding work. One continuous uniform black line (2.3 px at 480 wide) loops and doubles back to draw the whole figure. Flat coral, periwinkle and white patches sit behind the line, wobbly and deliberately knocked 2–6 px out of register like a misprinted riso. Tops carry coral stripe lines, and there is no ground plane, only a squiggle, a curl or a few speed strokes, all on warm beige paper. Covers the palette, a route-building toolkit (tube limbs, hand and shoe loops, wobble patches, masks), poses, composition and a render-critique loop. Use when asked for one-line, single-line, continuous-line, misregistered, riso-style or playful doodle illustrations, for empty states, onboarding, 404 pages, blog headers, feature spots, launch announcements or marketing cards.
---

# Illustration: One-line

A loose, energetic style: a figure in mid-action drawn as one long wandering black line, with colour laid underneath as offset patches, as if a second print colour slipped. It suits upbeat product moments (launches, sprints, flow, celebrations) where an interior scene would be too heavy.
Use `illustration-halftone-line` for black open line with dot-screen tones and no colour. Use `illustration-ink-sketch` for a wobbly brush outline around a cute critter. Use `illustration-two-colour-brush` for thick brush outlines with solid black shapes and one mint ink.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence
One continuous black line draws the whole figure, and flat coral, periwinkle and white patches sit behind it, deliberately knocked 2–6 px out of register.

## Palette
Measured from the three examples (1x renders): paper 87–89% of the pixels, ink about 2%, white patches about 3%, periwinkle 2.3–3.7%, coral 0.8–2.8%.

| Role | Hex | Where it goes |
|---|---|---|
| Paper | `#ece7da` | full-bleed background rect, square, no `rx` |
| Ink | `#1d1b1a` | the one line, every prop line, code glyphs, speed strokes, the eye, solid dots |
| Coral | `#f2846e` | face and hand patches, stripe lines on tops, a sun, one accent patch per prop, code dashes |
| Periwinkle | `#8790f4` | trousers, hair, screens and props, ground patches, code dashes |
| White | `#ffffff` | tops and sleeves, shoes, cups, clouds, ground patches |

- Masks use `#fff` and `#000` inside `<mask>` only; they never show.
- Never: other colours, gradients, opacity, outlines on patches, grey, a second ink colour, black fills larger than a 1.9 px dot.
- Coral is skin and small accents; it never fills trousers or a whole top. Periwinkle never fills skin.

## Line and fill
- One ink group: `<g id="xx-ink" fill="none" stroke="#1d1b1a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">`. Every ink path inherits it.
- Weights at 480 wide: 2.3 for the figure line and props; 2.0–2.1 for a long motion path or clock hands; 1.8 for code glyphs (`</>`); coral stripe lines 1.9; coded colour dashes 2.3.
- The figure is ONE path (`id="xx-figure"`) of smooth cubic segments, 1-decimal coordinates. Separate short strokes are allowed only for the eye, a hem or cuff, and props. Each prop is its own single wandering line too.
- Smoothness comes from the spline: every route point is `[x, y]` or `[x, y, k]` with tension k (1 smooth, 0.4–0.6 soft corner at elbows, knees and collars, 0 sharp for glyph corners).
- Colour is never bounded by the line. Patches are separate closed blobs drawn first, in `<g id="xx-patches">`, then stripes and dashes in `<g id="xx-accents">`, then the ink on top.
- Off-register: offset each patch 2–6 px from the shape it colours (`T(pts, dx, dy)`), and wobble its edge (`wobble`, amp 0.8–1.5 for hands and faces, 1.4–2.4 for limbs, 2.2–3 for big areas). Use a different integer seed per patch. Let patches fall short of one side and spill past the other.
- Stripes: 3–5 coral lines across a top, following the body's curve, stopping 2–4 px short of the contour, 1.9 wide. Sleeves get 1–2 short stripes.
- Masks: where the line passes behind something (an arm over a laptop, a fist round a baton, a motion path behind a juggled object), knock it out with a `<mask>` holding the front shape's silhouette in black. Add a black stroke of 2–10 px to open a gap. `C.mask()` builds it.

## Characters
- Proportions: figures 190–240 px tall in action (53–67% of the card height). The head is 41–48 px tall, so about 1:5. Limbs are tubes: arms 18–21 px wide at the shoulder tapering to 8.6–9.5 at the wrist; legs 27–28 at the hip to 12–13.5 at the ankle.
- Head: a profile facing the direction of travel, 41–48 px tall. Route it in either direction. Up the throat into `FACE_R` (chin, lips, nose, brow as soft corners), over the crown and hair, down a ROUND back of the skull to the nape. Or the reverse, `rev(FACE_R)`. The `EAR_R` C-loop is optional. Drop it if it doesn't read at 8x: an ear plus a flat hairline made a test head read as a helmet. The eye is a separate short closed-lid arc (`EYE_R`) and there is no mouth stroke (the profile carries the smile). A coral face patch covers the front half of the face, offset 1–2 px toward the profile, and leaves the back of the head bare paper.
- Hair: a periwinkle patch behind the hair outline (ponytail, bun loop, short crop), or curly hair drawn as trochoid loops (`curls()`, r 3–3.5, 4–5 loops) with no patch.
- Torso: there is no separate torso outline. The back contour, the arm sides and the belly are all parts of the route. A white top patch covers the chest, offset −4, −3, plus white sleeve patches built with `blob()` from the arm centreline.
- Limbs: build each with `tube(centreline, widths)` and route DOWN one side, round the hand or shoe, and back UP the other side. Put tension 0.4–0.6 on the elbow or knee point so it bends crisply. Keep a gripping wrist 45–60 px from its shoulder: a handle 48 px from the shoulder folded a test arm into a chicken wing (forearm 15 px, upper arm 33).
- Joints with hands and shoes: check where a limb side meets a placed shape at 8x. If the shape's first point sits behind the limb edge, the line hooks back on itself. Drop that point (`shape.slice(1)`) or shift the shape 3–4 px.
- Sitting astride or on a prop (a rocket, a stool, a chair): draw only the near leg, in front of the prop, and mask the prop's line with the figure's own route used as a silhouette (`C.mask('m-rider', [[route, 5]])`). For that, start and end the route at the same place, such as the heel.
- Hands are small loose loops, 19–27 px long (local shapes × 1.1–1.3), with a coral patch behind, offset 2–3 px. Shapes in the toolkit: `HAND.mitten` (swinging, thumb notch), `HAND.fist` (round a handle, knuckle bumps), `HAND.tray` (open palm carrying something), `HAND.open` (catching, thumb hooked out), `spreadHand()` (waving, four separate finger loops and a thumb), `CLAMP` (fist from the side gripping an edge). Never a plain oval.
- Handedness: decide LEFT or RIGHT, PALM or BACK and the finger direction with the table in `references/craft.md`, then flip the shape (`place(..., flip)`) so its thumb lobe lands on that side. The comment above each shape in `scripts/oneline.mjs` says which side its thumb is on.
- Feet: `SHOE` loops, 30–35 px long (× 1.25–1.3), with a white patch, offset 3–4 px. A small heel loop is allowed on one shoe.
- Loops: 2–4 cursive loops per figure, radius 3–5, at a waistband, a heel, a knee, a bun or the end of a ponytail (`loopAt()`, `cornerLoop()`). More reads as scribble. A loop in the middle of a leg reads as a mistake.
- Poses: big and diagonal, never standing still. Leaping between two objects, sprinting with the body pitched 11° forward, balancing on one leg while juggling. Lean the upper body by rotating its points about the hips (`rot()`) before routing.

## Decor and props
- 1–3 context props, each one wandering line plus one offset patch: braces `{ }`, a laptop with `</>`, a stopwatch, a coffee cup, a bug, a sun drawn as a loading ring. Props tie into the motion: a squiggle trails into a stopwatch, one looping path threads the juggled objects.
- Motion: 3 parallel speed strokes behind the figure (26–52 px long, 13–16 apart), or a squiggle trail with one loop.
- Ground: no ground plane. Use a short squiggle with a loop under the planted foot (90–110 px wide, 1 px under the sole) with a white or periwinkle patch, or nothing when the figure is airborne.
- Code: `</>` glyphs in 1.8 px ink on a screen or baton, and "code" as rows of coral and periwinkle squiggle dashes (`squig()`, 2.3 px).
- Never: text, UI panels, sparkles, confetti, outlined boxes, a horizon line, shadows.

## Composition
- Card: `<rect id="xx-paper" x="0" y="0" width="480" height="360" fill="#ece7da"/>` first. Then `<defs>` (masks), patches, accents, ink.
- The whole drawing spans about 245–377 px wide and 240–284 px tall, centred. Keep 30–40 px clear at every edge (top ≥ 36).
- The figure carries the card: 190–240 px tall, placed so its direction of travel has more room ahead than behind. Props sit in the open space it moves toward or past.
- Density: sparse. Paper 86–89% of the pixels; about 12–17 patches and 15–40 ink paths in total.
- A big prop (rocket, board) gets a patch covering 60–75% of it, offset 4–6 px. A patch filling the whole prop reads as a solid white shape and outweighs the figure. Keep the figure 190 px or taller next to a big prop: scale the upper body about the hip if it looks small.
- Build in a local frame and map it to the card with one function: `makeCard('sd-', { map: pts => … })` applies it to every line, patch, accent, mask and dot (scale 1.05–1.1 about a centre, plus a shift). To face the other way, mirror x in the map (`map: pts => mirrorX(pts, 240)`), and draw `</>` glyphs and any lettering with `C.raw.line(...)`, which skips the map, so they don't mirror.

## Techniques

**1. The toolkit.** `scripts/oneline.mjs` (no dependencies, seeded) holds the curve maths and the card assembly: `smooth`, `tube`, `blob`, `wobble`, `place`, `T`, `rev`, `rot`, `lowest`, `curls`, `squig`, `loopAt`, `cornerLoop`, `arc`, the local shapes (`HAND.*`, `spreadHand()`, `CLAMP`, `SHOE`, `FACE_R`, `EYE_R`, `EAR_R`) and `makeCard(prefix, { map })` with `line`, `accent`, `patch`, `mask`, `dot` (all mapped), `raw.*` (the same, unmapped), `dots` (debug) and `svg(debug, ariaLabel)`. Patches and lines share one id namespace, so name patches after their colour (`porthole-peri`, `shoe-white`): a test card failed lint with two `porthole` ids. Run `node scripts/oneline.mjs --demo /abs/work/demo.svg` from the skill folder (write it into your work folder, not the skill) and render it: an arm with a mitten, a leg with a shoe on a ground squiggle, a profile head, patches, a stripe and code dashes.

**2. A limb route.** Down the R side, round the hand, back up the L side:
```js
import { makeCard, tube, blob, place, rev, T, ang, HAND, PERI, WHITE, CORAL } from '/abs/path/to/illustration-one-line/scripts/oneline.mjs';
const C = makeCard('sd-');
const arm = [[150, 120], [170, 132], [190, 146, 0.5], [212, 136], [232, 124]];   // shoulder, elbow (k 0.5), wrist
const W = [18, 16, 13.5, 11, 9], a = tube(arm, W);
const hand = place(HAND.mitten, arm[4], ang(arm[3], arm[4]), 1.2);           // +y wrist corner first
C.line('arm', [...a.R, ...hand, ...rev(a.L)]);                               // in a figure, splice this into the one route
C.patch('sleeve', T(blob(arm.slice(0, 3), W.slice(0, 3), 1.05), 3, -3), WHITE, 1.4, 4);
C.patch('hand', T(place([[0, -5], [12, -5], [17, 0], [12, 7], [2, 6]], arm[4], ang(arm[3], arm[4]), 1.2), 2, -3), CORAL, 0.8, 5);
```
Local shapes run from their +y wrist corner, round the tip, to the −y corner. Going down a limb's L side instead, use `rev(shape)` or `flip = true`.

**3. Knock-out masks.** `const m = C.mask('m-arm', [[armSilhouettePts, 2]]); C.line('laptop', lapPts, m);` hides the laptop's line under the arm. For a path that threads several objects, pass each object's silhouette with stroke 9–10 so the path stops short of them with a gap.

**4. Ground the planted foot.** `const sole = lowest(route);` then draw the squiggle at `sole[1] + 1.1` with `T(pts, sole[0], sole[1] + 1.1)`. A foot meant to stand must sit on it, not float above.

**5. A whole-figure route order** (the sprinter in `examples/hackathon-sprint.svg`, authored facing right). Every contour is visited once:
ground squiggle behind → planted shoe top → front of the trailing leg up → crotch → lead leg underside → lead shoe → shin front → knee → thigh top into the belly → far arm underside → fist → far arm top → shoulder → short neck → `FACE_R` → crown → ponytail → back of the skull → ear → nape → near arm top → mitten → near arm underside → armpit → back → waistband loop → seat → back of the trailing leg → heel loop → sole → toe → ground squiggle ahead.
A seated rider runs heel → calf → thigh underside → seat → back → raised arm → hand → nape → skull → bun loop → `rev(FACE_R)` → throat → near arm → fist → belly → thigh top → shin → shoe → back to the heel.

**6. Patch recipe** (offsets `T(dx, dy)`, wobble amp, from the examples' generators). Top: the chest outline, (−4, −3), amp 2.4–2.6. Sleeves: `blob(arm.slice(0, 3), W, 0.95–1.05)`, (±2–3, −3), amp 1.4–1.6. Trousers: `blob(leg, W, 1.0)`, (5, 3), amp 2.2–2.4. Face: head-local `[[6,-12],[16,-8],[22,2],[19,13],[9,15],[5,2]]`, (2, −1), amp 1.1–1.5. Hair: (−3, −2), amp 1.2–1.6. Hands: a 5–6 point blob of the hand, (2–3, ±2–3), amp 0.8–1.2. Shoes: `[[-6,-2],[10,-3],[22,3],[22,10],[4,11],[-7,8]]` through the shoe's own `place()`, (3–4, 2–3), amp 1.2. Props: (3–5, ±3), amp 1–1.8. Every seed different.

## Failure modes
- **Hackathon Sprint shipped at 6.5.** Judges named the head shape, the planted back foot and a weak hackathon cue. On the card, the skull is small next to the ponytail, the planted loop shoe reads as a blob, and a `</>` baton plus a stopwatch don't say "hackathon". Don't copy that card's head or back foot, and give the subject a prop that names it.
- **Mitten blobs for hands.** The first Flow State hands were ovals. Use a shape with a thumb lobe or separate fingers, and a coral patch behind it.
- **A loop on the knee reads as a mistake.** The first Flow State legs had a loop mid-leg and crossing lines. Put loops at ends (heel, waistband, hair) and taper legs from hip to ankle with a clean knee bend.
- **The colour fits the line exactly.** Then it is an ordinary flat fill and the print-slip look is gone. Offset every patch 2–6 px, let it spill on one side and fall short on the other.
- **Patches read as stains.** Wobble amp above 3, or blobs with no relation to a body part. Keep amp 0.8–3 and one patch per part.
- **It became a normal line drawing.** Too many separate strokes (a torso outline, each finger, a separate face). Keep the figure one route; only the eye, hems and props are separate.
- **Line crossings behind objects.** The route passes under an arm or a held object and both lines show. Mask the hidden part.
- **Weight drift.** A 1.4 px or 3 px stroke anywhere breaks the set. Use 2.3 for ink, 1.8 for glyphs and 1.9 for stripes.
- **Floating feet.** A planted foot hovering above its squiggle. Measure the sole with `lowest()` and place the squiggle 1.1 px under it.
- **Duplicate ids.** A patch and a line given the same name. Suffix every patch with its colour.
- **Hooks at joints and a chicken-wing arm.** See Characters. Both showed up in the self-test card and only at 8x zoom.

## Examples
- `examples/flow-state.svg`: "Flow State". A leap with one arm flung back (`spreadHand`-style open hand) and the near arm clamping a laptop (`CLAMP`, masked). Curly hair from `curls()`, headphones, two code braces drawn as single strokes with white patches, code dashes, a sun as a loading ring, speed strokes, a trail squiggle.
- `examples/hackathon-sprint.svg`: "Hackathon Sprint". A sprint facing left: the figure is authored facing right and mirrored in `G`, with `</>` drawn in card space. A `fist` round a baton (masked), a swinging `mitten`, a ponytail, a waistband loop, a stopwatch tied into a squiggle, speed strokes. The weakest card: see Failure modes.
- `examples/juggling-tasks.svg`: "Juggling Tasks". Balancing on one leg with a `tray` hand under a laptop and an `open` hand just releasing. One looping motion path threads a cup and a bug (masked with stroke 9–10), a short ground squiggle with a periwinkle patch, a bun loop.

## Workflow
Run every command from this skill's folder. Card paths can be absolute.
1. **Brief.** Name the subject and the one action that shows it. Pick 1–3 props that say the subject without text.
2. **Pose.** Sketch the skeleton as numbers: hip, shoulders, head centre, and centrelines for each limb (4–5 points each) with widths. Choose the facing and the lean. Choose an id prefix (`sd-`).
3. **Write a generator** (`card.mjs`) that imports `scripts/oneline.mjs` by absolute path. Build tubes, place hands and shoes, and write ONE route for the figure: start at a free end (a hand, a foot or a ground squiggle), go round every limb, and end at another free end. Render with `C.svg(true)` to see numbered route points while you work.
4. **Hands on paper.** For each hand write LEFT or RIGHT, PALM or BACK and the finger direction, then the thumb side (`references/craft.md`). Pick the shape and the flip.
5. **Colour.** Add patches (offset, wobble, distinct seeds), stripes, masks.
6. **Render:** `node scripts/render.mjs card.svg card.png`.
7. **Sheet:** `node scripts/render.mjs --sheet sheet.png examples/flow-state.svg examples/hackathon-sprint.svg examples/juggling-tasks.svg card.svg`. Ask "same hand, same set?": line weight, how loose, patch offsets, density, paper share.
8. **Zoom** hands, head, feet, every joint where a limb meets a hand or shoe, and every crossing: `node scripts/render.mjs card.svg z.png --zoom x,y,w,h --scale 8`. Do the thumb proof from `references/craft.md`. The hands live inside the one route, so you can't recolour them. Instead, in a throwaway copy, put a red circle (r 2.2) on the thumb tip and a blue one on the index tip, both mapped through the same `place()` call, then delete the copy.
9. **Critique** on the five criteria in `references/craft.md` and the Verify list. Fix, re-render, re-sheet. Four or more rounds is normal.
10. **Lint:** `node scripts/lint.mjs card.svg --prefix sd- --palette style.json`.

## Verify
- [ ] Paper rect `#ece7da` full-bleed, no `rx`; only paper, ink, coral, periwinkle and white appear.
- [ ] The figure is one `<path>`; apart from it there are only the eye, hems, props, speed strokes and squiggles.
- [ ] Every ink stroke is 2.3 (glyphs 1.8, a long motion path 2.0–2.1); stripes 1.9 coral; caps and joins round.
- [ ] No patch matches its contour: each is offset 2–6 px and wobbly, and no two share a seed.
- [ ] The face patch is coral, covers the front of the face only, and the eye is a closed-lid arc.
- [ ] Hands have a thumb lobe or separate fingers, a coral patch, and the thumb on the correct side (thumb proof done).
- [ ] 2–4 loops at ends (hair, heel, waistband, a knee at most once); no loop mid-limb.
- [ ] Lines that pass behind an arm or object are masked; no accidental crossings at 8x.
- [ ] The pose is a diagonal action; the planted foot sits 1 px on its squiggle, or the figure is clearly airborne.
- [ ] 30–40 px clear at every edge; paper looks as dominant as on the examples (they measure 87–89%); 12–17 patches; a big prop's patch covers only 60–75% of it.
- [ ] The subject reads at 1x from the action and props, with no text.
- [ ] Patch ids carry a colour suffix, and `lint.mjs --palette style.json` passes with no ERROR or WARN.
