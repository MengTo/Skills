---
name: illustration-teal-spot
description: Draws original spot illustrations of one hero object as SVG cards (480x360) in a teal-on-white style. Identifying traits are a single object in a fixed oblique 3/4 view showing top, front and right faces; white main faces with teal only on side faces and accents; thin dark-teal outlines on every edge; a hard, unblurred deep-teal drop shadow pushed down-right; and two to four small floating extras (coins, tilted UI cards, badges) with their own hard shadows, plus 4-point sparkles. No people. Covers design and coding concepts as objects: keyboards, databases, git graphs, inboxes, devices. Use when someone asks for a teal spot, teal icon illustration, isometric spot object, 3D line spot, empty-state art, onboarding step art, a 404 or error spot, a feature spot, a blog header object, a marketing card or a product icon scene in teal, mint or green-teal.
---

# Illustration: Teal spot

One object, shown as if it were a small physical model, sits alone on a light grey card. It reads like a product icon blown up to card size: white faces, a teal side, a crisp dark outline and a hard deep-teal shadow. Small floating extras hint at the action. Use it for empty states, feature spots and onboarding steps that need one strong object and no people.

Boundary: for a whole isometric scene of 6–8 objects on a platform slab with soft glows, use `illustration-isometric-mono`. For people at work, use a character style such as `illustration-framed-panel` or `illustration-outlined-cartoon`. For saturated multi-colour clusters with navy extrusions, use `illustration-bold-pop`.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence

A single white object in one fixed oblique projection, teal only on its right-facing sides, outlined in 1.2 px dark teal and dropped onto flat grey by a hard, unblurred deep-teal shadow that always falls down and to the right.

## Palette

Eleven colours, measured from the examples. Nothing else.

| Role | Hex | Where it goes |
|---|---|---|
| Card background | `#ebebeb` | full-bleed rect, nothing else |
| Ink | `#0e3f3d` | every outline, glyph strokes on pale faces |
| Deep teal | `#0e4a48` | all hard shadows, sparkles, dark glyphs, the right side of teal parts |
| Teal dark | `#299c96` | front and left sides of teal parts, recess walls |
| Teal | `#36c3b0` | right side of white parts, tops of accent parts, LEDs, highlighted UI rows |
| Mid teal | `#7fd8ca` | sides of pale parts, recess floors, coin sides |
| Pale-mid | `#a8e5e0` | arc ticks only |
| Pale teal | `#d8f2ed` | sides of keys and cards, highlight streaks on white, search fields |
| White | `#ffffff` | the hero's top, front and left faces; card tops; glyphs on teal |
| Grey | `#d5d8d8` | label pills, placeholder text bars, switch stems |
| Grey dark | `#b9c0c0` | right side of small grey parts |

- No gradients, no opacity, no filters, no blur, no `<text>`: letters and digits are stroked paths.
- White faces are the majority of the object. If teal covers more than about a third of the hero's visible area, it stops being this style.
- Deep teal `#0e4a48` touches the grey background only as shadow or sparkle, never as a face of the hero.

## Line and fill

- Outlines: `#0e3f3d`, **1.2** at 480 wide, `stroke-linejoin="round"`, round caps on open creases. Small UI parts on a card face: 1.0–1.1 with `vector-effect="non-scaling-stroke"` (the face transform would otherwise distort them). LEDs and tiny dots: 0.8.
- Outlines are strokes drawn over flat fills: per solid, the silhouette hull, the top ring and the vertical creases where two face colours meet. No inner contour lines on a single flat face.
- Plates (shields, clouds, bars) use the stroke-behind trick: each side quad is filled ink with a **2.9** stroke, then refilled in the side colour with a 0.5 self-stroke, then the face is drawn with a 1.2 outline. This is why `stroke-width="2.9"` dominates the examples.
- Shading is one tone step by facing, never a gradient:

| Part | Top (cap) | Front, left, back | Right-facing side |
|---|---|---|---|
| Hero body | white | white | teal `#36c3b0` |
| Pale part (key, UI card) | white | pale `#d8f2ed` | mid `#7fd8ca` |
| Accent part (button, branch disc) | teal | teal dark `#299c96` | deep `#0e4a48` |
| Coin (data token) | pale | mid | teal |
| Accent coin (badge, count) | teal | teal dark | deep |
| Small recess (socket, well) | (opening) | walls teal dark | floor mid |
| Large open recess (tray, more than a quarter of the top) | (opening) | walls mid | floor pale |

- Glyphs: white on teal faces (2.8–5 wide), deep or ink on white and pale faces (2.4–2.8 wide), round caps and joins. A flat detail printed on a floor or face is a teal disc or rounded square with a 1.0–1.1 ink outline and a white glyph.

- Highlight streaks: two dashes, one long and one short with a gap of about 6 % of the edge, 2.2 wide (1.8–1.9 on small parts), round caps, drawn 8 units under the top edge of a white front face in pale `#d8f2ed`; on teal faces use teal or mid. One streak per face, at most four on the card.
- Every shadow is a hard flat `#0e4a48` shape (self-stroke 0.6 to close seams). Floor shadow: the footprint pushed by `SHD = [0.78, -0.48]` world units per unit of height. Floating extras: the item's screen hull offset by (8.5, 7.6) px.

## Characters

None. This style has no people, hands or faces. The hero object takes their place:

- **One solid object.** The subject is a single physical thing (a tile, a drum, a keyboard case). Ideas that are really diagrams (a git graph, a pipeline) get mounted on or built into one solid, never scattered as loose parts.
- **Real thickness.** Bodies are 28–40 units tall; keys and cards 8–14; coins 5.5; plates 7–8. Corners are rounded (radius 18–24 on a body, 4–9 on keys and cards).
- **Detail on the front face is product detail:** one highlight streak, one grey label pill (26–30 × 4.4, radius 2.2) and one teal LED (4.6–5 round, 0.8 outline) near the front-right of the top rim or the face. To lay a flat shape on the front face of a box of depth D, map its (x, z) points with `pr([x, -D / 2 - 0.05, z])`; on the top rim use `pr([x, y, H + 0.01])`.
- **Action** is shown by parts that lift out of the object (a key popped out of its socket, a disc raised on an arch), with the empty socket or shadow left behind.
- **Give a generic shape its tell.** A plain rounded box reads as "a box". Add the one feature that names the object: keycaps for a keyboard, grooves for a database drum, a finger scoop for a letter tray (`scoop()`), a slot for a card reader.

## Decor and props

- **Floating extras: 2–4**, each a small solid in the same projection: a tilted UI card (about 84–114 × 50–58, 8–9 thick, tilted back 28°), a coin (radius 17–19, a digit or icon on it), an upright plate (shield, cloud, envelope; 7–8 deep). Each casts its own hard shadow (offset 8.5, 7.6) or a small ground ellipse (radius 10–17) on the floor or tile below it.
- **Sparkles: 3 per card**, 4-point concave stars in deep teal: a big one (size 6–7) with a small one (3.6–5) 12–16 px from it, beside one extra, and a single small one (4–5) beside an extra on the other side.
- **Arc ticks: 0–3**, short arcs (20–40°) hugging a floating item at its radius plus 7–9, 3.4–3.6 wide, pale-mid or teal. They say "this just moved"; Backup has none, Command K has three around its two popped keys.
- UI content on cards: grey bars 4.4 high with radius 2.2; one teal highlighted row (radius 4–6) with white bars; small square icons radius 4 in teal with a white glyph.
- Never: people, plants, outline clouds as background doodles, ground lines, platforms under the whole scene, text labels, glows.

## Composition

- Background: a square full-bleed `<rect width="480" height="360" fill="#ebebeb">`, no `rx`.
- The whole group (hero, shadows, extras) is centred with its bounding box at (240, 181). It spans **58–90 % of the card width and 58–75 % of its height**; margins are at least 30 px on every side. The hero alone takes about 55 % of the card.
- The hero sits slightly below centre; the extras orbit it in the top-left, top-right and left gaps, so no quadrant is empty and nothing touches the hero's outline.
- Stagger the extras at different heights (one high, one level with the hero's rim). Three extras in a level row across the top read as a toolbar, not a scatter.
- The bounding box includes every extra, so moving one extra outward shrinks the hero after centring. Read the width % that `card()` prints after every move and keep it at 90 % or less.
- The hard floor shadow is part of the silhouette: it extends 20–60 px down-right of the base and anchors the object.
- Structure of every example file: `<rect id="P-bg">`, then `<g id="P-scene" transform="translate(TX TY)">` holding everything projected, then `<g id="P-decor">` with sparkles and arcs in card coordinates.

## Techniques

All of them come from `scripts/teal3d.mjs` (no dependencies, deterministic). `scripts/starter.mjs` builds a complete card with each one; copy both files to your work folder and edit the scene.

1. **The camera.** One orthographic camera for everything: `makeCam({ TH: -25, PH: 36, S })`, `S` 0.84–1.05. World +x runs to the lower right, +y away (upper right), +z up. Don't hand-draw a "roughly isometric" box: faces drift out of parallel and the set stops matching.
2. **Solids and plates.** `solid({ fr, r0, z0, r1, z1, col })` extrudes between two rings (`rrect`, `circle`) and colours each visible side run by facing; give a smaller top ring for keycaps. `slab({ fr, pts, depth, face, side })` extrudes any flat outline (shield, cloud, envelope) and returns `.shadow()`. `mat(fr, z)` maps flat 2D art onto a face: `<g transform="${mat(fr, z)}">…glyph…</g>`.
3. **Hard shadows.**
   ```js
   put(`<path d="${poly(floorShadow(rrect(0, 0, W, D, R), H * 1.05))}" fill="${C.deep}"/>`); // first
   put(liftShadow(card.hull) + card.svg);                                                     // floating extra
   put(env.shadow() + env.svg);                                                               // floating plate (slab)
   put(well.onFloor(`<path d="${poly(castShadow(pts3, zFloor))}" fill="${C.deep}"/>`));     // part standing on a surface
   ```
   `castShadow(pts3, z, 0.6)` drops a standing part's world points onto the surface it stands on (the git-graph discs on their tile). Use it only for parts that touch that surface; a floating plate cast onto the floor far below becomes a thin dark bar nowhere near the plate, so floating items always use the screen offset.
4. **Recesses and wells.** `recess({ ring, z, depth, id: 'P-well' })` cuts an opening into a top face (teal-dark walls, mid floor, clipped; pass `wall: C.mid, floor: C.pale` for a large tray). `well.onFloor(art)` clips art to the visible floor, for printed details and cast shadows. Parts sitting inside it are drawn after it, back to front by `dot(centre, cam.V)`. `scoop({ xa, xb, depth, y0, y1, zTop })` cuts a shallow arc down through a front wall (from its outer face y0 to its inner face y1): the cut shows the floor colour, its inner faces follow the facing rule, and both edges are inked.
5. **Decor.** `spark(x, y, size)` and `arc(cx, cy, r, a0, a1)` in card coordinates, placed from the shifted bounding boxes that `card({ prefix, scene, BOX, decor })` hands you.

Draw order: floor shadow → hero (back parts first) → face details → recesses → parts inside recesses, sorted back to front → for each extra, its shadow then its body → decor.

A torus (`torus().piece()`) and swept tubes (`tube()`) are there for rings and pipes; draw the back half of a ring before the part that passes through it and the front half after. The kit warns `[fold]` when a tube outline self-intersects; shorten or thicken the tube until it stops.

## Failure modes

- **Scattered parts read as a diagram, not a spot.** Git Merge's first version was loose rings and tubes floating on grey and scored 7; mounting the same graph on one thick white tile took it to 8. Build one object.
- **A teal-fronted object belongs to another set.** Early Command K drafts had a teal case front; the shipped one is white on the front and top, teal only on the right side.
- **A thin shadow reads as a stroke, not a drop.** Backup's floor shadow was enlarged by about a quarter in its polish pass (the drum and ring footprints are pushed 40–46 units) so a solid crescent shows beyond the ring. Check that the shadow is at least 15 px wide at its widest.
- **Shadows in two directions break the light.** Every floor shadow, ground ellipse and floating offset goes down-right; never mirror one to balance the layout.
- **Hairline seams between side colours.** Without the base fill under the side runs (built into `solid`) a 1 px grey line shows at 2x. Keep the base fill when you write a custom solid.
- **Distorted UI strokes on tilted faces.** A stroke inside a `mat()` transform shears with the face; add `vector-effect="non-scaling-stroke"` to UI rects.
- **Tube outlines that loop.** A tight bend on a thick tube folds its silhouette into a swallowtail; the kit prints `[fold]`. Reduce the bend or the radius.
- **Decor clutter.** Background outline clouds were cut from Command K; decor is three sparkles and up to three arc ticks, nothing more.
- **A big teal hole turns the hero teal.** An empty tray with teal-dark walls and a mid floor read as a teal object from above (self-test, Inbox Zero). Step a large recess lighter: walls mid, floor pale.
- **A plain container doesn't name itself.** The self-test's empty tray read as "a tray" until a finger scoop was cut into its front wall; then it read as a letter tray at 1x.
- **A floating plate's floor shadow becomes a stray bar.** Casting an upright envelope onto a tray floor 90 units below gave a thin dark strip in the wrong place (self-test). Floating items use the (8.5, 7.6) screen offset.
- **Extras touching the hero.** A floating item whose shadow lands on the hero's outline reads as a collision; keep at least 12 px of grey between an extra (with its shadow) and the hero's silhouette.

## Examples

- `examples/command-k.svg`: Command K. A keyboard case with a recessed key tray; the ⌘ key (teal) and the K key (pale) float above their empty sockets, a command-palette card tilts above. Shows recesses, keycaps with smaller top rings, sockets as shadows, a tilted UI card.
- `examples/git-merge.svg`: Git Merge. A thick white tile carrying a square-bar git graph; a teal branch arches up through a raised commit disc and plugs into the merge disc. Shows shadows cast on a tile top (clipped to it), commit discs, a PR card and a commit coin with ground ellipses.
- `examples/backup.svg`: Backup. A three-disc database drum wearing a lifebuoy (torus split into white and teal bands), with a shield-check plate, a cloud-upload plate and two data coins (1 and 0). Shows cylinders with grooves, a torus drawn in back and front halves, a shadow cast onto the drum, upright plates.

## Workflow

Run commands from this skill's folder. `WORK` is your own work folder (any path); the card is `$WORK/card.svg` with id prefix `xx-`.

1. **Brief.** Name the subject and the one object that embodies it. Write one line: hero object, the part that moves or lifts out, 2–4 extras that support the subject. If the subject is a process, find the physical object that holds it.
2. **Set up the generator.**
   ```sh
   mkdir -p "$WORK" && cp scripts/teal3d.mjs scripts/starter.mjs "$WORK/" && mv "$WORK/starter.mjs" "$WORK/gen.mjs"
   ```
   Change `P` to your prefix and the `label`.
3. **Block the hero** with `solid` and `slab` only (no details), render, and check the silhouette and the shadow read at 1x.
4. **Draw** face details, recesses, lifted parts, then the extras and decor. Keep the draw order above.
5. **Render** (headless, 2x): `node "$WORK/gen.mjs" "$WORK/card.svg" && node scripts/render.mjs "$WORK/card.svg" "$WORK/card.png"`
6. **Sheet next to the examples:** `node scripts/render.mjs --sheet "$WORK/sheet.png" examples/*.svg "$WORK/card.svg"`. Ask "same hand, same set?": face colours, outline weight, shadow direction and size, amount of white.
7. **Zoom** the places faults hide, re-rendered from vector: `node scripts/render.mjs "$WORK/card.svg" "$WORK/z1.png" --zoom x,y,w,h --scale 8`. Check creases where colours meet, recess edges, glyphs on faces and every shadow edge.
8. **Critique** against the five criteria in `references/craft.md` (criterion 2 becomes "the hero object's construction": thickness, corners, product detail, believable parts). Fix and repeat; expect three or more rounds.
9. **Lint:** `node scripts/lint.mjs "$WORK/card.svg" --prefix xx- --palette style.json`. Fix every ERROR. In this style there should be no off-palette WARN at all.

`references/craft.md` holds the file contract, originality rules and scoring that apply to every illustration style.

## Verify

- [ ] Background is one `#ebebeb` full-bleed rect without `rx`; nothing else touches the card edge.
- [ ] Exactly one hero object; no person, plant, platform or ground line.
- [ ] Every face is flat: top and front of the hero white, its right side teal; pale parts have pale sides and a mid right side.
- [ ] All outlines are `#0e3f3d` at 1.2 (UI 1.0–1.1, LEDs 0.8); no outline in any other colour.
- [ ] Every shadow is flat `#0e4a48` and falls down-right; the floor shadow is at least 15 px wide at its widest.
- [ ] Every floating extra has its own hard shadow or ground ellipse, in the same direction.
- [ ] 2–4 extras, 3 sparkles (one big-small pair plus a single), 0–3 arc ticks.
- [ ] Group bounding box centred at about (240, 181), 58–90 % of the width, margins ≥ 30 px.
- [ ] One highlight streak per white front face (long dash + short dash, pale, 2.2).
- [ ] Glyphs and digits are stroked paths with round caps; no `<text>`.
- [ ] At 8x, no hairline seam between side colours and no gap between a fill and its outline.
- [ ] Only the 11 palette colours appear (`lint.mjs --palette style.json` prints no WARN).
- [ ] The subject reads at 1x without a caption.
