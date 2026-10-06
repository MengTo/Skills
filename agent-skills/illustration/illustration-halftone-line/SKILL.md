---
name: illustration-halftone-line
description: Draws hand-authored SVG spot illustrations in a halftone line style for design and coding scenes. Identifying traits are a confident black line with a slight hand wobble and contours left open, grey tones made only of fine halftone dots clipped to shapes, a few solid black masses (hair, leaves, a bag, a black tee), warm off-white paper and no colour at all. Covers the two-ink palette, line weights, the open-contour and stipple techniques, a seeded compiler that turns tone tags into dot fills, rubbery long-limbed characters and expressive hands, doodles, floor pools and a render-and-critique loop. Use when someone asks for halftone, stipple, dotted, risograph-like, newsprint, black-and-white, monochrome line, editorial line or zine-style illustrations, or for empty states, onboarding, 404 pages, blog headers, feature spots and marketing cards in that look.
---

# Illustration: Halftone line

An editorial black-and-white style: one black ink on warm paper, figures drawn with a confident, slightly wobbly line that stops short instead of closing, and every grey made of printed-looking dots. It suits calm, human product moments: collaboration, reviews, commutes, focus time.

Boundary: for a single continuous line with off-register colour patches use `illustration-one-line`; for thick brush outlines with a second flat ink use `illustration-two-colour-brush`; for thin indigo interiors with sparse colour accents use `illustration-line-interior`. If the brief wants any colour, this is the wrong skill.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in `examples/` are this style's shipped cards.

## The look in one sentence
Black line and black dots on warm paper, nothing else: every grey is a field of jittered halftone dots whose size tracks the tone, and the line around it is left open.

## Palette

| Role | Hex | Where it goes |
|---|---|---|
| Paper | `#f4f1ea` | the full-bleed card rect, and the fill of every shape that must hide what is behind it |
| Ink | `#111111` (written `#111`) | every line, every halftone dot, every solid black mass |

- Two colours, no exceptions: no greys, no opacity, no gradients, no colour accents. A grey comes only from dots.
- Paper-coloured strokes (`stroke="#f4f1ea"`, 1.2–1.5) are drawn inside solid black shapes for hair highlights, leaf veins, trouser creases and bag seams.
- Most of the card is open paper: measured ink cover (lines, dots and blacks together) is 12–14% of the card.

## Line and fill

Widths at 480 wide. The art group carries `stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"`; parts override it.

| Element | Width |
|---|---|
| Figures, hands' outer contour, furniture, shoes' outline | 2.0 (1.9–2.1) |
| Screens' inner frame, window glass, plants, small props | 1.6–1.7 |
| Finger and thumb creases, folds, cuffs, hems, hood seams | 1.3–1.6 |
| Keyboard keys, nail ticks, text lines on paper props | 1.1–1.3 |
| Squiggles, braces, radiating ticks | 2.0–2.3 |

- **Open contours.** An outline is a separate open path, not the fill's stroke. Leave 1–3 gaps of 4–14 units per object, mostly at corners and where one line would meet another, and stop lines 2–6 units short of the line they would hit. Example from the shipped train window: `M366 74 H410 C420 74 428 82 428 92 V138 M426 160 C424 168 418 174 410 174 H318 M300 174 H166 …` (two gaps on one frame).
- **Paper fills hide, they do not outline.** Each shape that overlaps something behind it gets a paper fill with `stroke="none"`, drawn before its dots and its open outline.
- **Hand wobble.** One filter on the whole art group, nowhere else: a low-frequency warp of 2.3 plus a fine edge roughening of 0.8. `scripts/halftone.mjs` writes it (`<filter id="xx-wob">`); give each card its own `--seed`.
- **Tones are dots.** A jittered grid at pitch 2.58 with dot area proportional to tone: `flat 0.19` (light, dot r ≈ 0.6) for clothes, cushions, light props and the outer floor pool; `flat 0.36–0.38` (mid, r ≈ 0.85) for hair blobs, shadow sides, the far limb, the core of a floor pool. Graded tones (`lin`, `rad`) shade rounded forms from 0.08 to 0.36.
- **Solid black** for 3–5 masses per card: hair, a plant's leaves, a bag, a black tee or trousers, a laptop's or monitor's dark edge, shoe soles, a check mark.

## Characters

- Rubbery and long-limbed. Head with hair 40–44 px tall; a standing figure is 230–250 px (5.5–6 heads, 65–70% of the card height); a seated figure's head top sits about 70 px from the top of the card.
- Heads in profile or near-profile. Build each in a local frame `<g transform="translate(cx cy) rotate(a)">`: a paper face shape with a pointed nose wedge, an open outline from the brow over the nose and chin to the jaw, the back hidden under the hair. From the shipped critic's head: face `M-16 18 C-26 0 -20 -24 4 -26 C20 -26 23 -10 22 -1 L31 9 Q29 11.5 23 12 C24 18 23 24 17 28 C11 32 0 31 -8 24 Z`. `${H.head(x, y, rot, dir, hair, { back, eye, smile })}` draws exactly this head, facing right (`dir` 1) or left (−1); its local face spans about −26…31 by −26…32, so `(x, y)` is roughly the middle of the face. For a face turned left, a negative `rot` tips it down.
- Face marks: an eye dot `r 1.8–1.9` (or a closed-eye arc for calm), a short brow arc at 1.6–1.7, a small smile arc at 1.7–1.8, an ear as a C with an inner curl at 1.6, round glasses as one outline lens in profile with an arm to the ear (`H.hair.glasses()`). No blush, no pupils, no lashes.
- Hair: a solid black blob with one 1.3 paper highlight stroke, or a dotted blob (0.38 plus an outline with two 1.3 strand lines); buns are black circles, ponytails black teardrops, beanies dotted with a ribbed paper band. Presets from the shipped cards, in the head's frame: `H.hair.curly(t)` (dotted crop with a front curl; `'flat 0.3'` reads as grey), `H.hair.bun()`, `H.hair.ponytail()`, `H.hair.long` (pass `.back` as the head's `back` option and `.front` as its hair) and `H.hair.glasses()`. Hair needs a broken silhouette (a bun, a tail, curls or a fringe notch): a smooth cap with a straight hairline reads as a helmet.
- Necks are a paper quad with one or two 1.5 lines. Shoulders slope; torsos are soft sacks, not boxes.
- Clothing: light dots on the near sleeve and body, mid dots on the shadow side and the far limb, or a solid black garment with paper crease lines. Ribbed hems and cuffs are rows of 1.3 ticks. `${H.limb([[x,y] shoulder, elbow, wrist], [halfWidths], tone)}` builds a sleeve or trouser leg as the toned-shape triple with open ends (tone `'flat 0.19'`, `''` for bare skin, `'black'` for a solid garment); two black legs need a 1.4 paper crease line between them.
- Hands are large and expressive, about 0.8 of the head height from wrist to fingertip. Follow `references/craft.md` for construction and handedness. In this style each finger and the thumb is its own paper-filled shape; the outer contour is an open line at 2.0; creases and nail ticks are 1.2–1.6; fingers fan with small gaps; a cuff line crosses the wrist. `${H.hand(x, y, rot, sc, thumb)}` in `scripts/halftone.mjs` draws the typing or resting hand used on the shipped cards: wrist at `(x, y)`, fingers along local +x bending onto a surface toward +y, the index on the −y edge and the thumb beside it when `thumb` is true. For fingers pointing left, mirror it: `<g transform="translate(x y) scale(-1 1)">${H.hand(0, 0, rot, sc, false)}</g>`. Pointing and gripping hands are drawn by hand in the same manner (back of hand, an extended index, curled fingers as stacked loops with 1.3 creases, the thumb as its own shape).
- Feet: simple sneakers with a paper upper, a black sole slab and 1.3–1.6 lace ticks (`${H.shoe(x, y, dir, sc)}`, sc ≈ 0.6, `(x, y)` = heel bottom, the ankle lands at `x + 8·dir`, `y − 14`), resting on the floor stroke. Set a figure's two heels at least 26 apart: two shoes overlapping by more than a toe read as one double shoe.
- Poses that work: leaning over a table with one knee bent and one arm braced behind the back; seated with a laptop on a raised thigh, back against a partition; perched on a stool typing with the far leg tucked; standing in contrapposto, chin resting on one hand, the other holding a cup at the hip; two people seated either side of a small table, the explainer leaning in and pointing. Never bolt upright with both arms hanging. To lean a finished torso, wrap torso, neck and head in `rotate(−8 hipX hipY)` and re-aim the arm's shoulder point to match.

## Decor and props

- Doodles, 2–4 per card, floating in open paper in the upper third: a curly squiggle with three loops (2.3), three radiating ticks above a head for a thought or surprise (1.8–2.0), curly braces `{ }` (2.0), a solid black check mark, a chat bubble with three black dots (r 3.2), a document or image card with lines.
- Props are line drawings with paper fills: desks and tables with open legs, stools, benches, a drafting table, monitors and laptops (one dark edge solid black), screens carrying `</>`, text lines at 1.3–1.7 and a cursor, mugs and takeaway cups (dotted body or a black band), a plant with solid black leaves and paper veins, a black tote.
- Floor: never a full line. Short strokes at 1.9–2.0 only under what stands there, plus a dotted pool under every foot, leg or base: a light ellipse (0.19, ry 5.6) with a darker core (0.36, 58% of the width, ry 3.4). `${H.pool(cx, cy, rx)}` writes both.
- Never: colour, grey fills, outlined closed boxes everywhere, drop shadows, sparkles, hatching (tone is dots, not lines), text other than `</>` and code glyphs.

## Composition

- Paper rect first, before `<defs>`: `<rect id="xx-paper" width="480" height="360" fill="#f4f1ea"/>`, square, no `rx`.
- Ink bounding box 78–82% of the card width and 73–80% of its height; margins 37–55 px (75–110 px on the 2x render).
- Draw at 1:1 inside `<g id="xx-frame" transform="translate(dx dy)">` with a small nudge to centre (the shipped cards use ±4), or draw large and scale the frame by 0.86 as the first card does. Keep the 2.0 line after any scale.
- One or two figures interacting with one piece of furniture or one device; the focal point is the hands on that object. Doodles go in the open paper above, never on top of a figure.
- Balance the solid blacks: spread 3–5 black masses so no side of the card is all grey dots.
- The floor sits at y 305–322; everything that stands touches it through a pool.

## Techniques

1. **Write a source, compile it.** Author `card.src.svg` with `@P@` for the id prefix, `<!--DEFS-->` inside `<defs>`, `<stip>` tags for tones and `${…}` expressions, then:
   `node scripts/halftone.mjs card.src.svg card.svg --prefix oh- --seed 41`
   It writes the wobble filter, one clip path per stipple, the dots, and fails if any id lacks the prefix. `node scripts/halftone.mjs demo /tmp/halftone-demo.svg` writes the tone swatches (put it anywhere outside the skill folder). Every `${…}` is JavaScript (nested braces and object arguments are fine) with the built-in helpers `H.pool`, `H.E`, `H.shoe`, `H.hand`, `H.limb`, `H.head` and `H.hair.*`; a `<gen>…</gen>` block at the top of the source holds your own helpers, such as a pointing hand you reuse.
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
   <rect id="@P@paper" width="480" height="360" fill="#f4f1ea"/>
   <defs><!--DEFS--></defs>
   <g id="@P@frame" transform="translate(0 0)">
   <g id="@P@art" filter="url(#@P@wob)" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
     ${H.pool(120, 307, 24)}
     <path d="M40 307.6 H150" stroke-width="2"/>
     …
   </g></g></svg>
   ```
2. **The toned-shape triple.** Same `d` three times: paper fill, dots, open outline.
   ```svg
   <path d="M98 190 C94 214 … Z" fill="#f4f1ea" stroke="none"/>
   <stip d="M98 190 C94 214 … Z" t="flat 0.19"/>
   <path d="M98 190 C94 214 90 236 88 252 C86 268 82 284 79 299 M96 300 C98 284 102 268 104 254"/>
   ```
   A second, smaller `<stip … t="flat 0.36"/>` laid over part of the shape makes its shadow side. The first shipped card used flat 60-unit dot tiles instead (`fill="url(#@P@dl)"` light, `url(#@P@dm)` mid); the compiler adds a tile when a source references it. Prefer `<stip>`: it grades and stays crisp. Tone terms: `flat t`, `lin x1 y1 t1 x2 y2 t2`, `rad cx cy r t0 t1`, `noise a scale` (multiplies). `<stip>` paths take M L H V C S Q T Z, not arcs: use `${H.E(cx, cy, rx, ry)}` for ellipses.
3. **Solid black with paper detail.** `<path d="…hair…" fill="#111"/>` then `<path d="…" stroke="#f4f1ea" stroke-width="1.3"/>` for one highlight or crease.
4. **Doodle squiggle** (2.3, three loops): `<path d="M60 268 C53 259 60 248 67 253 C74 258 65 265 63 256 C61 245 74 236 81 243 C88 250 75 257 75 246 C75 233 91 224 96 234" stroke-width="2.3"/>`.

## Failure modes

- **Dots too coarse.** Train Ride stayed at 7 because its trousers used tone 0.52: the dots merged into blotches. Keep dotted areas at 0.38 or lighter; anything darker is solid black.
- **Stiff standing figure, mitten hands.** Design Critique scored 6 with an upright figure and blob hands. Give standing figures contrapposto and a task for each hand; build every finger as its own outlined shape.
- **Echoing the reference set.** Design Critique's first layout was rejected by two judges as too close to a reference image the style was studied from. Stage each scene around furniture and a real action of your own, and never borrow a reference image's layout (`references/craft.md`, Originality).
- **Thumbs on the wrong side.** All three shipped cards needed handedness fixes. Write down left or right, palm or back and finger direction for each hand, then run the thumb proof (`references/craft.md`).
- **Closed, even outlines.** A fully closed outline at one weight reads as clip art. Open 1–3 gaps per object and vary 2.0 / 1.6 / 1.3 by role.
- **Grey wash instead of dots.** A dot pattern that is too fine (pitch under 2.2 or r under 0.4) reads as flat grey at 1x. Keep pitch 2.58.
- **Stray grey.** Any `#888`, `opacity` or blurred shadow breaks the two-ink rule; lint with `--palette` catches the colours.
- **Floating feet and furniture.** Every foot, leg and base needs its floor stroke and a dotted pool under it.
- **Helmet hair.** In the self-test, two smooth hair caps with straight hairlines read as a beanie and a helmet at 1x. A bun, a ponytail, curls or a fringe notch fixed both; use the `H.hair` presets.
- **One double shoe.** Feet set 14 apart overlapped into a single long shoe. Keep a figure's heels at least 26 apart, the far foot pulled back.
- **Doodles on the figures.** Squiggles or ticks that overlap a head or hand read as mistakes. Keep 10 px of paper around each doodle.

## Examples

- `pair-programming.svg`: "Pair Programming". A man in a dotted beanie types at a desk monitor while a woman with a black ponytail leans in and points at a line of code with a pencil; plant with black leaves, stool, mug, braces, check and squiggle doodles. Shows the 60-unit dot tiles, the 0.86 frame scale, typing and pencil hands.
- `train-ride.svg`: "Train Ride". A woman with a black bun sits on a metro bench, laptop on her raised thigh, typing with both hands; train window with a passing landscape, hanging straps, black tote on the floor, chat-bubble and squiggle doodles. Shows a seated pose, graded stipple, and (on the trousers) the tone that was too dark.
- `design-critique.svg`: "Design Critique". A man in a black tee leans over a drafting table and circles a button on a printout; a woman in a dotted sweater and black trousers stands with her chin in her hand and a takeaway cup at her hip. Shows the leaning pose, a sheared table top, the chin-in-hand grip and solid black garments.

## Workflow

Run commands from this skill's folder.

1. **Brief.** Name the subject and the one action that shows it ("a mentor explains a bug on a student's laptop").
2. **Choose the pose and the hero object.** One or two figures and one piece of furniture or device. For each hand write down LEFT or RIGHT, palm or back, finger direction, and what it touches.
3. **Block.** In `card.src.svg`, rough each figure as a stick skeleton (2.0 lines) plus the furniture outline; compile and render; check figure height, floor y and margins before detailing.
4. **Draw.** Back to front: floor pools and strokes, furniture, the far figure parts, near figure parts, hands last, then doodles. Paper fill → `<stip>` → open outline for every toned shape.
5. **Compile:** `node scripts/halftone.mjs card.src.svg card.svg --prefix oh- --seed 41`.
6. **Render:** `node scripts/render.mjs card.svg card.png`.
7. **Sheet next to the examples:** `node scripts/render.mjs --sheet sheet.png examples/*.svg card.svg`. Same line weight, same dot size, same paper, same amount of bare paper?
8. **Zoom** every hand, face, foot and contact: `node scripts/render.mjs card.svg hand.png --zoom 180,170,60,50 --scale 8`. Thumb proof: in a throwaway copy of the source, set the thumb's paper fill to `#ff0000` and the index finger's to `#0000ff`, compile, zoom, check, delete. In an `H.hand`, the index is the first finger path after the palm.
9. **Critique** against the five criteria in `references/craft.md`, harshly; fix in the source, never in the compiled SVG; repeat 5–9. Expect four rounds.
10. **Lint:** `node scripts/lint.mjs card.svg --prefix oh- --palette style.json`. Any WARN is a stray colour: remove it.

## Verify

- [ ] Paper rect `#f4f1ea` is the first element, full-bleed, no `rx`.
- [ ] Only `#111` and `#f4f1ea` appear; no opacity, gradient or blur besides the one wobble filter.
- [ ] The wobble filter wraps the whole art group and nothing else.
- [ ] Main line 2.0; secondary 1.6–1.7; creases 1.3–1.6; nothing under 1.1.
- [ ] Every object's outline has at least one deliberate gap; lines stop short at joins.
- [ ] Dotted tones are 0.19 or 0.36–0.38 (graded within 0.08–0.38); nothing dotted darker than 0.4.
- [ ] 3–5 solid black masses, spread across the card.
- [ ] Heads in profile with nose wedge, dot eye, small smile; hair with a broken silhouette; figures 5.5–6 heads tall.
- [ ] Each figure's heels at least 26 apart; feet rest on a floor stroke.
- [ ] Each hand: separate outlined fingers, a thumb on the correct side, wrist and cuff connected to an arm.
- [ ] Every foot and base has a floor stroke and a two-tone dotted pool; no continuous floor line.
- [ ] 2–4 doodles in open paper, clear of the figures.
- [ ] Ink box 78–82% wide, 73–80% tall; margins 37–55 px (75–110 px on the 2x render); most of the card is open paper.
- [ ] The subject reads at 1x without a caption.
- [ ] `scripts/lint.mjs` passes with `--prefix` and `--palette style.json`.
