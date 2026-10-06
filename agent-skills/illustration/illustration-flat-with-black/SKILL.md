---
name: illustration-flat-with-black
description: Draws flat vector spot illustrations of tall, long-legged people doing design and coding things, with solid black as a main colour. Traits: no outlines on coloured fills; black as big solid shapes (hair, trousers, shoes, devices) and as thin detail lines; denim blue, leaf green, sun yellow and tomato red on cream skin; dot eyes, round glasses and blush; big shoes on one thin black ground line; two stars and two plus-sparkles as the only decor. Covers palette, line weights, characters, heads, hands, props, composition and a parts helper for limbs, shoes, heads, hands and paper props. Use when someone asks for flat illustration with black, flat people or character illustration, friendly product or SaaS illustration, or art for empty states, onboarding, 404 and error pages, blog headers, feature spots, marketing cards or app screens in this style.
---

# Illustration: Flat with black

Flat-colour scenes of one or two lanky, expressive people acting out a design or coding moment: running from a pile of messages, hovering over a deploy button, a stand-up at a sticky-note board. Colour areas carry the drawing with no outline; solid black does the heavy lifting as hair, trousers, shoes and devices, and as thin detail lines. It suits product empty states, onboarding, error pages and marketing cards that need a person with some personality.

Boundary: use `illustration-flat` for the outline-free style with a navy-and-lavender palette and floating confetti; use `illustration-outlined-cartoon` when every shape should carry an inked outline and the heads are big; use `illustration-line-interior` for thin indigo outlines on white fills. This skill is the one where black is a fill colour.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence
Flat, outline-free colour shapes in four saturated mid-tones, anchored by large solid black masses (20–40% of all painted area), with black reused as thin 0.75–1.6 detail lines and white reused as thin seams on the black.

## Palette

| Role | Hex | Where it goes |
|---|---|---|
| Card background | `#ffffff` | No background rect; the card is white |
| Ink (the black) | `#15202f` | Hair, trousers, shoes, phones, laptops, cats, mouths, glasses, every thin dark line, ground line |
| Ink in shadow | `#26313f` | The far trouser leg or far shoe when the near one is `#15202f`; paws |
| Slate | `#4b5662` | Cuff bands on black trousers, laptop deck, far table legs, inner ears of a black cat |
| Skin | `#fadfb9` | Every face, neck and hand: one skin tone per figure, never a second skin colour |
| Skin shade | `#efc9a0` | Ear inner curve, the hidden side of a hand; lines only or a small shaded wedge |
| Blush | `#f3ad8f` | Cheek ellipse rx 3.6 ry 2.2 |
| Nose | `#e29771` | One 1.1 stroke at the nose tip |
| Mouth in beard | `#f0a58c` | Open mouth inside a black beard (no blush on bearded faces) |
| Denim | `#65aacb` | Jeans, beanies, desk tops, mugs, wall clocks, blue star |
| Denim shade | `#5b9bb6` | Far jeans leg, the underside of a desk top |
| Denim deep / fold | `#4a8bab`, `#3f7894` | Knee folds on near / far jeans, beanie ribs |
| Pale denim | `#97c8df` | Rolled jeans cuffs, sweat drops |
| Sky | `#a5d1e1` | Envelopes, sticky notes, phone screens, underline rules |
| Leaf green | `#a6cf6e` | Tees and shirts, envelopes, chat bubbles, done notes |
| Green shade / light | `#8fbb57`, `#c6e1a0` | Far sleeve and fold lines / hem and collar highlights |
| Sun yellow | `#f9db74` | Hoodies, envelopes, notes, yellow star, sparkles, cat eyes, code badges |
| Yellow mid / shade | `#eec55a`, `#d9ab3c` | Hood and far sleeve / hem band, folds, loafer soles |
| Tomato | `#e56355` | Tops, chat bubbles, badges, calendar header, tongues, buttons |
| Tomato shade | `#c94d42` | Far sleeve, hem band, the lit-from-above dome underside |
| Coffee | `#6b4a3a` | Coffee surface in a mug only |
| Rule grey | `#d9dde2` | Hairline dividers on a white board only |

- Use at least three of the four mid-tones (denim, green, yellow, tomato) plus black; the deploy card has no green at all. Give the figure's top one hue, the trousers black or denim, and let the props carry the rest.
- Shades are the same hue one step darker, never grey or a gradient. Never use opacity, gradients, filters, patterns or shadows.
- Don't put tomato shoes next to a tomato hero prop: a red shoe pair pulled the eye off the deploy button in an early round. Black shoes are the default.

## Line and fill
Numbers at 480 wide, before the scene group's 0.94–0.95 scale.

- **Coloured fills have no outline.** The only outlined shapes are white ones that would vanish on the white card: a calendar or board (`#15202f` 1.2–1.3), a sneaker sole (1.0), gritted teeth (1.2).
- **Ink detail lines:** finger separations 0.73–0.85; envelope flaps 1.05; brows 1.3–1.6; glasses rims 1.5; closed eyes 1.3; motion, alarm and nod ticks 1.3; speed lines 1.3; ground line 1.2–1.25.
- **White detail lines on black and denim:** trouser side seam 0.9, shoe welt 0.85–0.9, laces 1.0, cat whiskers 0.6.
- **Fold lines in the garment's shade colour:** torso and armpit folds 1.0, knee folds 1.15. Two to four per garment.
- **Bars and legs:** table legs 2–2.6 (near in ink, far in slate), a board stand 2.4, code lines on a dark screen 2.2 in palette colours.
- Every stroke uses `stroke-linecap="round" stroke-linejoin="round"`. Write the root as `<svg ... fill="none">` and give every path its own fill.
- **Shading:** one flat darker band, never a gradient. Hem bands 3–4 tall in the shade colour; collars and hems in the light colour; the far limb in the shade colour.

## Characters
- **Proportions:** 5.2–5.5 heads tall, head 42–45 units; legs are half the height (hip about 118 above the ground in a 235-tall figure). Thighs 25–32 wide, knees 22–25, ankles 19–22. Upper arm about 30 to the elbow, forearm 25. Upper sleeves 15–21, skin forearms 9–13, wrists about 9.
- **Torso:** draw it by hand as one closed path, never a `tube()` (a tube torso reads as a sausage): back hem, up the back, shoulder, neckline, chest, belly, front hem, then a hem curve that bows down 3–5. About 40 wide at the hem, 24 at the neckline. Lay a 4–5 tall hem band in the shade colour over its bottom edge.
- **Neck and collar:** draw the neck tube (width 11–12) before the torso so its base hides under the neckline (or after it, with its bottom edge cut to the neckline curve as in `s5c-a-neck`), then the collar (a 2.4 stroke in the shade colour) along the neckline. Drawn after the torso, the collar floats on the neck like a necklace. Keep 8–12 units of neck visible.
- **Hips:** where the legs part, fill the crotch with a small seat patch in the near trouser colour, tucked under the hem (about 30 x 15). A large one shows below the hem as a bulge, worst over a `#26313f` far leg.
- **Heads:** 3/4 view, rounded jaw, a single nose bump on the profile edge, no nose drawn on the face. Ear as a skin oval with one `#efc9a0` curve. Eyes are ink dots r 1.6–1.8 (far eye slightly smaller and higher), or closed arcs when laughing. Round glasses: near lens r 6–6.3, far lens r 4.6–5 (perspective), a short bridge and a temple arm to the ear. Open mouth is an ink shape with a tomato tongue. Use `head()` in `scripts/parts.mjs` (hair `bun`, `curly`, `short`, `beanie`; optional beard, glasses, earring). Brows `worried` sit high and only clear the hairline under `curly` or `beanie`; under `bun` or `short` they merge into the fringe, so use `angry` (determined), `up` or `soft`. Extra hair such as a ponytail goes in its own group with the head's transform, drawn before the head.
- **Hair and beards** are solid black masses: buns r 8.5, curly clouds of arcs, beards that swallow the jaw. Black hair is part of the black budget.
- **Hands:** skin silhouettes with no outline. Separate fingers with short ink ticks 0.73–0.85, 2.4–5 long: in from the fingertip gaps on an open hand, across the curled knuckles on a fist. Never full-length lines. The thumb is its own lobe overlapping the palm, closed with one ink crease. Hand length about 25 units (chin to brow). Every hand ends in a cuff band in the sleeve's shade colour, then a narrower skin wrist. Templates in `scripts/parts.mjs`, each with its handedness as authored: `hand('palm')` left, palm visible; `hand('point')` right, back visible; `hand('fist')` left, palm side; `hand('push')` right, back visible, fingers up (pressing a surface). `flip: true` mirrors to the other hand with the same side showing; `proof: true` gives the red-thumb, blue-index version of `push` and `fist`. The mug grip is in `examples/stand-up.svg` (`s5c-a-cup`), the desk brace in `examples/friday-deploy.svg` (`s5b-hand-far`). New fingers are easiest as capsules: `<rect rx="1.75" width="3.5">` on a palm shape.
- **Shoulders:** a set-in sleeve (`sleeve()`) puts a round cap at the shoulder point. Keep the far shoulder point 4 or more units inside the torso outline, or the cap pokes out as a hump.
- **Feet:** big shoes, 52–62 units long (1.2–1.4 heads). Black loafers or sneakers with white welts, or a coloured loafer with a darker sole band. The sole sits exactly on the ground line; a back foot may lift its heel about the ball (`sneakerMap(..., lift)` with lift 20–26°; past 26° the laces and stripe distort).
- **Clothes:** tee, hoodie or jumper with a hem band and 2–4 fold lines; jeans or black trousers with one white side seam curving through the knee, a short knee crease and a rolled cuff (`#97c8df` on denim, `#4b5662` on black).
- **Poses that work:** a running stride with a glance back; a deep lean over a desk with one arm braced; two people turned 3/4 toward each other, one gesturing with an open palm; a lunge pushing a big object, back leg straight with the heel up, front knee bent, elbows slightly bent. Torsos lean 10–35°, one knee always bent.

## Decor and props
- **Fixed decor per card:** exactly two five-point stars (one `#f9db74` r 7–7.5, one `#65aacb` r 6) and two plus-sparkles (`#f9db74`, 1.2 stroke, open centre). Put them in empty corners, at least 20 units from any figure.
- **Effect marks, only when the subject needs them:** sweat drops `#97c8df`, three alarm ticks over a head, two jitter ticks by a finger, nod arcs, horizontal speed lines. All ink 1.3 except drops.
- **Prop vocabulary:** envelopes and chat bubbles with slightly bowed edges, a red count badge with a bold white number, a wall clock, a hanging calendar, a desk on stick legs, a big red button, a laptop in black, mugs, a sticky-note board, a black cat with yellow eyes. Props are flat colour with ink detail lines, 30–70 units across.
- **Text:** at most one short word or number, `ui-sans-serif, system-ui, sans-serif`, weight 800 (FRI 21, DEPLOY 9.6 with letter-spacing 1.1, a badge number 14).
- **Never:** background blobs, plants for filler, confetti, drop shadows, floor patches, outlines around coloured shapes, gradients.

## Composition
- White card, no background rect. Wrap everything in one group: `<g id="xx-scene" transform="translate(240 178) scale(0.95) translate(-cx -cy)">`, where `(cx, cy)` is the centre of what you drew.
- After that scale the ink box is 296–307 wide and 255–261 tall: margins left and right 86–92, top 46–50, bottom 52–54. The ground line is the widest element (300–320 units at authoring scale, centred under the group) and sets the side margins. In every example the topmost mark is a sparkle, bubble or wall prop at authoring y 34–52; without one the top margin drifts to 70.
- Ground: one ink line at authoring y 302–308. No floor fill.
- Ink covers 12–16% of the card. One figure plus one hero prop, or two figures plus one shared prop. Wall props (clock, calendar, bubble) float in the upper third, clear of heads by 20 or more; put one in whichever upper quadrant the figure and hero leave empty.
- Focal point: the hand–prop contact (finger over the button, fist pumping, palm toward the board). Put it within 60 units of the card centre.

## Techniques

**1. Limbs are tapered tubes with a crisp knee.** Write a small Node generator for the card that prints the SVG, and build legs, sleeves, forearms and necks with `scripts/parts.mjs` (import it by absolute path):

```js
import { C, P, S, f, at, tube, kneeTube, cuff, sleeve, sneakerMap, sneakerAnkle, bentSneaker } from '/abs/path/illustration-flat-with-black/scripts/parts.mjs';
const G = 308, ID = 'xx-';                                  // ground y, card id prefix
const nearFn = sneakerMap(100, G, 0.95, 26);                // back foot, heel lifted 26 deg
const leg = [[160, 204], [132, 248], sneakerAnkle(nearFn)]; // hip, knee, ankle
let svg = P(kneeTube(leg, [32, 25, 21]), C.ink, ` id="${ID}leg-near"`);
const a = at(leg[0], leg[1], 0.3, -6), b = at(leg[1], leg[2], 0.7, -4.5);       // white side seam through the knee
svg += S(`M${f(a[0])} ${f(a[1])}C${leg[1][0] - 2} ${leg[1][1] - 8} ${leg[1][0] - 4} ${leg[1][1] + 4} ${f(b[0])} ${f(b[1])}`, 0.9, C.paper);
svg += cuff(leg[1], leg[2], 21, C.grey, `${ID}cuff-near`, 0.74, 1.06);
svg += bentSneaker(nearFn, `${ID}shoe-near`, C.denim);
const arm = [[200, 148], [226, 170], [251, 168]];          // shoulder, elbow, wrist
svg += sleeve(arm[0], arm[1], 18, 15, C.red, `${ID}sleeve-near`);
svg += P(tube([at(arm[1], arm[2], -0.05), arm[2]], [12, 9.5]), C.skin);
svg += cuff(arm[0], arm[1], 15, C.red2, `${ID}cuff-arm`, 0.84, 1.08);
```

**2. Depth by the darker sibling, then draw order.** Far arm, far leg and far shoe take the shade colour (`#8fbb57`, `#5b9bb6`, `#26313f`, `#c94d42`, `#eec55a`). Draw: far arm, far leg, near leg, seat patch, neck, torso, hood or collar, near arm, hand, head. The head goes last unless a near arm crosses the face.

**3. Black carries detail in white.** On black trousers and shoes the seam, welt and laces are white strokes (0.85–1.0). On coloured garments the folds are the garment's own shade colour. Ink lines appear only on skin and light fills.

**4. Paper props with a hand-cut edge.** Envelopes and bubbles bow each side out by 1–1.5 units with `Q` curves (`wob()`, `envelope()`, `bubble()` in `scripts/parts.mjs`) and tilt ±6–12°. Contact sheet of every part: `node scripts/parts.mjs sheet parts-sheet.svg && node scripts/render.mjs parts-sheet.svg parts-sheet.png`.

## Failure modes
- **Outline-only prop.** An envelope drawn as an ink outline on white read as a different style; fill every prop with a palette colour and keep ink for interior lines.
- **Second skin colour on one arm.** A forearm in a different tone read as a glove; use `#fadfb9` for all skin and `#efc9a0` only for lines and small wedges.
- **Straight stick legs.** Judges marked unbent legs as stiff; every leg has a knee point with a fold line, and at least one knee per figure is visibly bent.
- **Front-facing, symmetric figure.** A face-on bearded figure scored 6.5; turned 3/4 toward the colleague with weight on one leg it scored 8.
- **Thumb on the wrong side.** A whole hand pass was rejected for this; follow the handedness table in references/craft.md and run the thumb proof on every hand you rotate or flip.
- **Fist pasted on a sleeve.** Always draw cuff band, narrower skin wrist, then the hand.
- **Shoes floating or sinking.** The sole bottom must sit on the ground y: a loafer placed at `y = G - 13 * scale`, a sneaker built with `sneakerMap(x, G, ...)`.
- **Ground line off-centre.** It must be centred under the figure group, or the card reads lopsided.
- **Tomato shoes competing with the hero.** Saturated shoes stole focus from the red button; black shoes anchored the figure and fixed it.
- **Collar floating on the neck.** Drawn after the torso, the collar reads as a necklace; neck first, torso, then collar on the neckline.
- **Hump on the back.** A far shoulder cap placed on the torso edge pokes out; move the shoulder point inside.
- **Bulge between the legs.** An oversized seat patch hangs below the hem; keep it tucked under.
- **Effect mark through the face.** A speed line placed by coordinates crossed the eyes; check every tick, drop and line at 1x and 4x.
- **Empty upper quadrant.** With a tall prop on one side and the figure low on the other, one upper corner goes dead; add a bubble or wall prop there.
- **Too much decor.** More than two stars and two sparkles turns into confetti and drifts toward `illustration-flat`.
- **Black too light.** Under about 20% black by area it stops being this style; make hair, trousers, shoes or a device black.

## Examples
- `examples/messages.svg`: "Messages". A running stride with a glance back, a fist pumping, a laptop clamped under the arm; a swarm of envelopes, chat bubbles and a dark code-review bubble with a count badge. Shows the running pose and wobbly paper props.
- `examples/friday-deploy.svg`: "Friday Deploy". A deep lean over a desk, one hand braced over the edge, one finger hovering over a big red DEPLOY button; gritted teeth, sweat drops, a clock, a FRI calendar and a black cat. Shows the brace grip, pointing hand, heel-lift sneaker and black trousers.
- `examples/stand-up.svg`: "Stand-up". Two people turned toward each other at a sticky-note board, both holding mugs, one presenting with an open palm, one nodding. Shows two-figure balance, contrapposto, mug grips, loafers and a beanie and beard head.

## Workflow
Run every command from the skill folder (the folder that holds this file).

1. **Brief.** Name the subject in two words and the one action that shows it. Pick one figure and one hero prop (or two figures and a shared prop). Check the idea isn't a recomposition of any reference you have seen (references/craft.md, Originality).
2. **Pose.** Sketch the skeleton as points: ground y, hips, knees, ankles, shoulders, elbows, wrists, head centre. Lean the torso, bend a knee, decide where the weight sits.
3. **Hands first, on paper.** For every hand write left or right, palm or back, finger direction and thumb side (craft.md, Handedness).
4. **Block.** Write a generator (`card.mjs`, anywhere) that imports `scripts/parts.mjs` by absolute path and prints the SVG to stdout. Give it a `PROOF=1` switch that passes `proof: true` to every `hand()` call, and colours hand-drawn thumbs `#ff0000` and index fingers `#0000ff`. Place the black masses first, then the hues, then skin.
5. **Draw** heads with `head()`, limbs with `kneeTube`/`tube`/`sleeve`/`cuff`, shoes with `sneakerMap`+`bentSneaker` or `loafer`, then props, effect marks, two stars and two sparkles.
6. **Render:** `node /path/card.mjs > card.svg && node scripts/render.mjs card.svg card.png`
7. **Sheet with the examples:** `node scripts/render.mjs --sheet sheet.png examples/*.svg card.svg`. Ask "same hand, same set?"
8. **Zoom** every hand, the face, the hips and both shoe contacts at 4–8x: `node scripts/render.mjs card.svg z-hand.png --zoom x,y,w,h --scale 8`. Thumb proof: `PROOF=1 node /path/card.mjs > proof.svg && node scripts/render.mjs proof.svg proof.png --zoom x,y,w,h --scale 8`, check it against step 3, then delete proof.svg.
9. **Measure** margins and black share against the Composition numbers.
10. **Critique** on the five criteria in craft.md, harshly; fix and repeat from step 6. Expect four rounds.
11. **Lint:** `node scripts/lint.mjs card.svg --prefix xx- --palette style.json`. Fix every ERROR; each WARN must be a deliberate one-off.

## Verify
- [ ] No coloured shape has an outline; only white shapes carry an ink edge.
- [ ] Black (`#15202f` plus `#26313f`) covers roughly 20–40% of the painted area, in at least two masses (hair and trousers, or shoes and a device).
- [ ] At least three of the four mid-tones appear; no colour outside style.json except a deliberate one-off.
- [ ] Every figure is 5.2–5.5 heads tall with long legs, at least one bent knee and a torso lean.
- [ ] Every hand has a cuff, a narrower wrist, short finger ticks and a thumb on the correct side (thumb proof done).
- [ ] Shoes are 52–62 units long and their soles touch the ground line exactly (zoom at 8x).
- [ ] Faces have dot or arc eyes, a blush ellipse, a nose tick on the profile edge, an ear with one inner curve.
- [ ] Far limbs are the shade colour and drawn behind the torso; no far shoulder cap pokes out of the back.
- [ ] The neck sits under the neckline and the collar lies on it; no seat patch shows below the hem.
- [ ] Exactly two stars and two sparkles, clear of the figure by 20 units or more.
- [ ] Ground line 1.2–1.25 ink, centred under the group, the widest element.
- [ ] Ink box about 300 x 258 with side margins 86–92 and top margin 46–50, the top set by a sparkle, bubble or wall prop.
- [ ] The subject reads at 1x from the figure's action and one prop, without the caption.
- [ ] Lint passes with the card's id prefix.
