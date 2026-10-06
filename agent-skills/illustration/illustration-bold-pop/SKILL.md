---
name: illustration-bold-pop
description: Draws hand-authored SVG spot illustrations in a bold pop-geometric style for design and coding scenes. Identifying traits: a thick navy outline on every shape, solid navy extrusions that always step down-right, saturated flat fills (hot pink, lemon, aqua, violet, mint, lime) textured with navy hatching and dots, and a dense overlapping cluster of chunky props (browser windows, pinwheel tiles, iso cubes, lightning bolts) around one slim cartoon character. Covers palette, line weights, extrusion and union-outline techniques, a JS helper for the repeated marks, characters and hands, composition and a render-and-critique loop. Use when someone asks for bold pop, pop geometric, retro pop, memphis-style, navy-outline, chunky outlined or loud colourful illustrations, or for empty states, onboarding, 404 or error pages, blog headers, feature spots and marketing cards in that look.
---

# Illustration: Bold pop

A loud, graphic spot style: every shape outlined in one navy, pushed forward by a solid navy extrusion, filled with saturated flat colour and textured with hatching, dots, grids and stripes. One slim, simply drawn character works inside a tight cluster of props that overlap each other. It suits playful product moments: errors, launches, security, builds, onboarding.

Boundary: for thin near-black outlines, big heads and no extrusions use `illustration-outlined-cartoon`; for a single hero object with a hard drop shadow and no people use `illustration-teal-spot`; for true 30° isometric scenes on a platform use `illustration-isometric-mono`. If the brief says "flat, no outlines", this is the wrong skill (`illustration-flat`).

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in `examples/` are this style's shipped cards.

## The look in one sentence
Every shape wears the same thick navy outline and sits on a solid navy extrusion stepped down-right, so the whole cluster reads as chunky pop-art blocks stacked toward the viewer.

## Palette

Measured from the three examples. The card has no background rect: it stays transparent on the page's white card.

| Role | Hex | Where it goes |
|---|---|---|
| Navy (ink) | `#1f1c4d` | every outline, every extrusion, iso shadow faces, hatching, dots, eyes, mouths, curly hair |
| White | `#ffffff` | window bodies, pinwheel facets, sneakers, teeth, washers, inner holes, white stripes on tees |
| Hot pink | `#ff5fa8` | hero blocks, buttons, cones, hair, tee stripes, tongue, progress stripes |
| Lemon | `#ffe36e` | bolts, hard hats, padlocks, caution boards, highlighted code lines, smileys, ponytail |
| Orange | `#ffb547` | crane steel, keys, arrows, flames, shoe uppers |
| Cream | `#fff4d8` | dotted footers, gutters, cube tops, pinwheel facets, shoe soles, code digit tiles |
| Violet | `#8f5cff` | title bars, phones, tees, leggings, pinwheel blade |
| Periwinkle | `#7d7ff7` | title bars, wireframe text lines, sleeves, grid pattern lines |
| Mint | `#34e2c4` | overalls, shields, pinwheel blade, traffic dots |
| Lime | `#b9f14d` | tees, plates, gears, landscape hills, confirm buttons |
| Aqua | `#4fe3ec` | title bars, giant arrow bands, hairbands, cab glass |
| Sky | `#5bb8f7` | wrenches, jeans, image placeholders, iso cube left faces |
| Skin light | `#ffd0b0` | faces, arms, hands |
| Skin shade | `#f4a385` | the shadowed half of a fist only |
| Skin deep | `#c68660` | an alternative skin tone (face, arms, hands) |
| Blush | `#ff9cc8` | one cheek circle per face |

- Flat fills only. No gradients, no blur, no filters, no grey, no pure black. The one opacity in the set is a white glasses lens at `fill-opacity="0.55"`.
- Neighbouring faces never share a hue family: aqua never touches mint, orange never touches lemon on the same object, two pinks never abut. Put white, cream or navy between them.
- About 35–40% of the non-navy fills are white or cream. Saturated colour is for objects; the large calm areas are white with wireframe detail.

## Line and fill

Numbers are author units; the card group scales by 0.78 (one card uses 0.8), so multiply by 0.78 for px at 480 wide.

| Element | Author width | At 480 px |
|---|---|---|
| Outline of every shape | 3.0 | 2.34 |
| Inner parts (window dots, pills, hook, nut, small plates) | 2.2–2.6 | 1.7–2.0 |
| Wireframe text pills | 1.8–2.0 | 1.4–1.6 |
| `#`, `//` marks | 1.8 | 1.4 |
| Hair strands, folds, hems, finger contours, laces | 1.3–1.6 | 1.0–1.25 |
| Hatch pattern lines | 1.25 at 5 spacing | 0.98 at 3.9 |

- Caps and joins round everywhere (`stroke-linecap="round" stroke-linejoin="round"`). One outline colour: navy.
- Outlines are strokes on filled paths. Draw order per object: extrusion → fill → pattern → outline.
- Limbs, hands and any blob made of overlapping parts use a **union outline**: the whole shape filled navy with a navy stroke of 2 × 3.0, then the fill on top. The overlaps vanish and one 3.0 outline wraps the union.
- Cables, handles, braces and hooks are **tubes**: a navy stroke `w + 6` wide under a colour stroke `w` wide.
- Shading is never a tone step. It is one of: hatching on the shadow band (the right 20–30% of an object; on a figure facing right, the back (left) band of the tee and the whole far leg); a solid navy face (the right face of an iso cube); or the extrusion itself. Light always comes from the top-left.
- Texture vocabulary, all navy on a flat fill: `hatch` 45° lines, `dots` (r 1.15 on a 7 grid, on cream), `dots2` (r 0.75 on 4.6, on clothes and key heads), `grid` (periwinkle 1.2 lines on 9, empty slots), `stripe` (navy 7 on 14 at 45°, caution boards on lemon), `pstripe` (pink progress fill), `check` (4.5 checker bands). Every large fill except white window bodies carries one texture or one inner detail.

## Characters

- One per card, slim and simple, 140–180 author units tall standing (39–51% of the card height); a seated figure's head top sits at 40–45% from the top of the card. Head (face only) about 37 × 42: the figure is 3.5–4 heads tall, hat or hair included.
- Head in 3/4 view facing right, into the scene. Build it with `p.head()` in `scripts/pop.mjs`: oval face, C-shaped ear with a 1.3 inner curl at the back, two navy oval eyes (near 1.6 × 2.2, far 1.4 × 2.1, set high at the face's midline), short straight brows at 1.9, one blush circle r 2.6 on the near cheek, and an open grin (navy mouth, white teeth band, pink tongue). No nose: the face silhouette carries it. Variants: a flat focused mouth with the tongue poking out of the corner, or a one-stroke smile.
- Hair is a flat saturated shape (pink bob, lemon ponytail) with two 1.5 navy strand lines, or navy curls made of r 5.4 arcs with three white 1.4 highlight ticks. Accessories in the palette: hairband, hard hat with a hatched right side and an orange ridge, round glasses.
- Every head sits on a neck block (`p.neck()`), and the neck sits in a collar. *Fault prevented:* a judge-flagged missing neck.
- Torso: a tapered tee filled with a colour plus `dots2` or white horizontal stripes (4 high every 9), its back band hatched through a clip path, with a 1.5 hem fold line. Raglan seams or straps are 1.6 lines.
- Limbs are union capsules: upper arm r 4.5–4.9 → elbow 4.0–4.4 → wrist 2.7–3.0; thigh 8.2–8.6 → knee 6.6–7.2 → ankle 4.8–6.0. A short sleeve is a second capsule over the upper half of the arm with a 1.5 hem line. Hatch the far leg.
- Hands follow `references/craft.md` (construction, size, handedness, thumb proof). In this style: one union outline at 2.4–3.0, finger separations as 1.3–1.7 navy contour lines inside the shape (never gaps), fingers grouped, the thumb a separate outlined shape on top. A gripping fist has three short knuckle notches along the curled fingers and its thumb coming over the opposite face; the shaded half of a light-skinned fist is `#f4a385`. `p.fist()`, `p.openHand()` and `p.looseFist()` build these; scale them so a fist is about 60% of the face height.
- Feet: side-view sneakers (`p.sneaker()`): a cream sole slab, a white, orange or pink upper, a pink side stripe, a toe-cap line and two lace ticks. Cuffs are short tubes in a contrasting colour at the ankle. Draw each leg first and its sneaker on top, far leg and shoe before near leg and shoe; a leg drawn after its shoe swallows the upper. To lift a heel, wrap the sneaker in `rotate(18 x+22 318)` (about its toe contact).
- Poses that work: leaning back against a pull with both knees bent; standing beside a big prop, leaning back to steady it, rear heel lifted; running with the torso pitched 20° forward, arms pumping, rear heel up; sitting on an iso cube with the knees 10–16 units above the hips, one hand braced flat on the seat behind her, a foot tapping heel-up with two tick marks.
- Solve elbows and knees with `p.ik(S, H, l1, l2, bend)` so every hand traces back to a shoulder. `bend` (+1 / −1) flips the joint to the other side of the line: print the solved elbow and check it hangs below the shoulder-to-wrist line. An elbow solved upward reads as a dislocated arm.

## Decor and props

- Hero: almost always a browser window (white body, coloured title bar with three traffic dots and a url pill, a dotted cream footer or gutter, wireframe text pills and one picture block inside). The subject's own object (crane, phone, padlock, refresh arrow) overlaps it.
- Secondary props, 3–5 per card, each extruded and outlined: pinwheel tile (8 facets: pink, lemon, mint, violet blades alternating with white and cream-dotted facets), iso cube (cream dotted top, sky hatched left, navy right), lightning bolt (lemon or pink), striped ring, chunky curved arrow, chat bubble with three white dots, key, gear, cursor arrow, smiley circle, cone, padlock, phone, flame.
- Floating marks, 6–9 per card, unextruded: `#` hashmarks (2–3), `//` slashes (1–2), `+` (1–2), a navy dot r 2.4 (1–2), an outline ring r 4 (1–2), one outline cloud. Scatter them in the margins and gaps, at least 8 author units clear of any prop, or well inside a large face as texture (a `#` on a cube face or a card corner). Never let one straddle an outline or sit among a window's content.
- Props overlap: tuck a pinwheel behind a window corner, let a bolt cross a window edge, a bubble and key overlap the title bar. Free-floating big props read as stickers.
- Never: drop shadows that are not navy extrusions, gradients, sparkles or 4-point stars (that is the outlined-cartoon vocabulary), ground lines, plants, text longer than a 6-digit code.

## Composition

- No background. The cluster's ink bounding box covers 75–81% of the card width and 66–73% of its height; margins 46–61 px on every side (about 100 px on the 2x render), left and right within 5 px of each other. Ink covers 21–25% of the card: if a card looks thin, add an overlapping prop at a window edge (bubble, badge, clock), not more floating marks.
- Draw in author space on the 480 × 360 grid, then wrap everything in `translate(240,183) scale(0.78) translate(-240,-169)` (`p.card()` does this). Card position from author position: X = 240 + 0.78 (x − 240), Y = 183 + 0.78 (y − 169).
- The character stands at the left third facing right; the hero window sits centre-right; the subject prop links the two (the wrench on the bolt plate, the phone in both hands, the arrow under the feet).
- Floor-standing things share one implicit floor line (author y ≈ 318): soles, barrier feet, cones, cubes, a phone's base, a padlock. No drawn ground line.
- Density is high but every enclosed gap holds something: a loop or frame with an empty middle reads as sparse.

## Techniques

All four are in `scripts/pop.mjs` (ES module, no dependencies). `node scripts/pop.mjs demo /tmp/pop-demo.svg` writes a sheet of every mark (put it anywhere outside the skill folder); render it to see the vocabulary.

1. **Extrusion, always down-right.** Copies of the shape filled and stroked navy, stepped 1 unit at a time, drawn before the face:
   ```svg
   <g fill="#1f1c4d" stroke="#1f1c4d" stroke-width="3" stroke-linejoin="round">
     <g transform="translate(1,1)"><path d="…window…"/></g> … <g transform="translate(8,8)"><path d="…"/></g>
   </g>
   <path d="…window…" fill="#ffffff" stroke="#1f1c4d" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
   ```
   Depth by size: windows 8, phones and padlocks 7, pinwheels 6, crane parts and panels 4–5, bolts, bubbles, cursors 3–4, hooks and buttons 2.5–3. `p.ext(d, 8)` then `p.P(d, p.WHITE)`. For a rotated shape pass the same transform: `p.ext(d, 7, { tf })`.
2. **Union outline** for limbs and hands: `p.union([capsule(a, 4.6, b, 4.1), capsule(b, 4.1, c, 2.9)], p.SKIN)` emits `<path fill="#1f1c4d" stroke="#1f1c4d" stroke-width="6">` then the skin fill.
3. **Texture = fill + pattern + outline.** `p.tex(d, p.CREAM, 'dots')` emits three paths with the same `d`; `p.defs()` writes the ten patterns under the card's prefix. For a hatched band inside a shape, clip the hatch to the shape:
   ```js
   b += p.F(lock, p.YEL) + `<clipPath id="${p.prefix}c-lock"><path d="${lock}"/></clipPath>`
     + `<g clip-path="url(#${p.prefix}c-lock)">${p.F(p.rr(x + w - 26, y, 26, h, 0), p.url('hatch'))}</g>` + p.S(lock);
   ```
4. **Scaled groups keep the outline.** The shipped figures are drawn small and scaled up 1.12–1.22 about their floor point. Set `p.K = 1/1.2` while the figure's parts are generated, wrap them in `translate(x,318) scale(1.2) translate(-x,-318)`, then reset `p.K = 1`, or its outlines go 20% heavier than the props. Put the seat and anything the figure holds in the same group so contacts stay exact.

Minimal generator (save beside the card, fix the import path to wherever this skill lives):
```js
import fs from 'node:fs';
import { pop } from './scripts/pop.mjs';
const p = pop('rl-');
let b = '';
const w = p.browser(170, 80, 180, 170, { bar: p.AQUA });
b += w.svg + p.line(185, 130, 70) + p.line(185, 142, 50, p.PINK);
b += p.pinwheel([352, 72], 26, 12) + p.boltMark(440, 110, .8);
fs.writeFileSync('rate-limited.svg', p.card(b, { label: 'Rate Limited' }));
```

## Failure modes

- **Extrusion pointing the wrong way.** One prop stepped down-left reads as a mistake against the rest (a crane cab was flagged). Every extrusion steps (+1,+1); never mirror an extruded group with `scale(-1,1)`.
- **Missing neck.** A head placed straight on the collar was flagged. Draw `p.neck()` after the torso and before the head.
- **A hand with no arm.** A fist on a handle with no forearm behind it was flagged on the first draft. Solve shoulder → elbow → wrist with `p.ik()` and draw the arm under the hand.
- **Thumbs on the wrong side.** A designer rejected hands whose thumbs broke left/right handedness. Run the thumb proof from `references/craft.md` on every hand; `p.openHand()` as drawn is a right hand seen from the back.
- **Mitten or striped hands.** Fingers drawn as parallel stripes or a blob were redrawn on two cards. Group the fingers, vary their length, add knuckle notches, and put the thumb on the opposite face of the grip.
- **Sparse inside a loop.** Hot Reload stayed at 7.5 because the middle of its refresh ring was empty while the pinwheel crowded the runner. Fill enclosed space with props, and keep at least 10 card px between the character's head or hands and the next big prop.
- **Character too small.** A figure below 40% of the card height loses to the props; one card was redrawn 12% larger. Aim for 45–50%.
- **Perched, not sitting.** A first self-test draft laid the forearm and cup over the thigh, and the seated figure read as leaning on the cube. Keep the thigh visible from hip to knee and the knee higher than the hip.
- **Floating props.** A phone hovering beside its owner and a padlock in mid-air were fixed by standing them on the floor line; small props (key, bubble) overlap the window instead of floating alone.
- **Tangent contacts.** A sneaker toe just touching a curved deck reads as floating. Press soles 2–3 units into the surface they stand on.
- **Outlines that drift.** Strokes inside a scaled group thicken or thin. Use `p.K` (technique 4) and keep the 3.0 outline everywhere.
- **Empty fills.** A large flat colour block with no texture or inner detail looks unfinished next to the examples. Give it hatch, dots, stripes or wireframe content.

## Examples

- `page-under-construction.svg`: "Page Under Construction". A worker leans back hauling a wrench on a nut bolted to the window frame; tower crane with lattice jib, a code block on the hook, caution barrier, cone, iso cube footing. Shows the gripping fists, hard hat, pinwheel, truss holes, `stripe` and `grid` patterns.
- `two-factor-auth.svg`: "Two-Factor Auth". A man with curly hair and glasses holds a phone as tall as his torso with both hands; login window, open padlock with an orbiting pink arrow, key and chat bubble on the window corner. Shows deep skin tone, edge grips, a leaning standing pose and digit tiles.
- `hot-reload.svg`: "Hot Reload". A runner with a ponytail rides a giant aqua refresh arrow that loops round a code window, flames off its tail. Shows the running pose, pumping fists, striped tee, sneakers on a curved surface and a curved hatched band.

## Workflow

Run commands from this skill's folder.

1. **Brief.** Name the subject in two to four words and the one action that shows it ("throttled requests pile up at a gate while she waits").
2. **Choose the pose and the hero.** Pick a pose from the Characters list and the prop that carries the joke. Write down, for each hand, LEFT or RIGHT, palm or back, and the finger direction (`references/craft.md`, Handedness).
3. **Block.** In a generator using `scripts/pop.mjs`, place the window, the subject prop, the figure's joints (feet on y ≈ 318) and 3–5 secondary props as rectangles. Render and check the bounding box and balance before adding detail.
4. **Draw.** Extrusions and faces back to front, then textures, then the figure (legs, torso, neck, head, far arm before the torso, near arm and hands last), then floating marks.
5. **Render:** `node scripts/render.mjs card.svg card.png`.
6. **Sheet next to the examples:** `node scripts/render.mjs --sheet sheet.png examples/*.svg card.svg`. Ask "same hand, same set?" for outline weight, extrusion depth, texture density and character size.
7. **Zoom** every hand, the face, the feet and each contact (card units): `node scripts/render.mjs card.svg hand.png --zoom 110,170,40,40 --scale 8`. For the thumb proof, write a throwaway copy with every hand built with `{ proof: true }` (thumb `#ff0000`, index `#0000ff`), zoom each hand at 8x, check it against your notes, then delete the copy.
8. **Critique** on the five criteria in `references/craft.md`, harshly, and write the faults down.
9. **Fix** and repeat 5–8; expect four rounds.
10. **Lint:** `node scripts/lint.mjs card.svg --prefix rl- --palette style.json`. Fix every ERROR; each WARN must be a deliberate tint.

## Verify

- [ ] No background rect; the card is transparent.
- [ ] Every filled shape has a navy outline of 3.0 author units (2.3–2.4 px); details 1.3–2.4, nothing thinner than 1.2.
- [ ] Every extrusion is navy and steps down-right; depth matches object size (8 windows … 3 small parts).
- [ ] Only palette colours; no gradient, filter, blur, grey or black.
- [ ] Each large colour fill carries a texture or inner detail; hatch sits on an object's right band, a figure's back band and far leg.
- [ ] The figure is 40–51% of the card height (seated: head top 40–45% down the card) with a neck, 3/4 face to the right, blush, navy eyes.
- [ ] Each hand is a union outline with grouped fingers, contour lines and a thumb on the side the handedness table demands.
- [ ] Every hand connects through a forearm and elbow to a shoulder; legs taper hip to ankle.
- [ ] Soles, cones, cubes and standing props sit on one floor line with 2–3 units of overlap, no tangents.
- [ ] 3–5 extruded props overlap the hero window; no big prop floats alone.
- [ ] 6–9 floating marks (#, //, +, dot, ring, cloud), clear of the figure.
- [ ] Ink bounding box 75–81% wide and 66–73% tall: about 100 px of empty margin on each side of the 2x render, left and right equal.
- [ ] The subject reads at 1x without a caption.
- [ ] `scripts/lint.mjs` passes with `--prefix` and `--palette style.json`.
