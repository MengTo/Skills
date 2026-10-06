---
name: illustration-grainy-gouache
description: Draws original cosy animal scenes as hand-authored SVG cards (480x360) in a grainy gouache, risograph-like style. Identifying traits are flat shapes with no outlines on a hot-pink card; soft 3-4 stop gradient shading on every rounded form, darker toward edges and base; a fine dark multiply grain that gathers at each shape's edges; a chalky purple-pink shadow pooled under the group; and big glossy eyes with cream star highlights, framed by grained autumn leaves and sparse cream sparkles. It covers design and coding moments with one cute animal at a laptop, monitor, desk, window, mug or book stack. Use when someone asks for grainy, gouache, riso, risograph, textured, cosy, cozy, autumn, hygge, storybook or children's-book style animal art, or for an empty state, onboarding step, 404 page, blog header, feature spot or marketing card with a warm handmade feel.
---

# Illustration: Grainy gouache

A warm editorial style: one cute animal doing a design or coding thing, painted in flat, outline-free shapes that are softly shaded and dusted with fine dark grain, on a saturated hot-pink card with cream sparkles and falling autumn leaves. Use it where a product wants warmth and charm: empty states, onboarding, seasonal blog headers, "we're working on it" pages.

Boundary: for clean flat vector with no texture and no animals, use `illustration-flat`. For a hand-inked critter with hatching and googly eyes on white, use `illustration-ink-sketch`. For people with inked outlines, use `illustration-outlined-cartoon`. This style has no human cards; if a brief needs a person, use one of those instead.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence

Outline-free shapes, each filled with a soft light-to-dark gradient and then speckled with a fine dark grain that thickens toward the shape's edges and into its shadows, sitting on hot pink #FF81BE with a chalky purple pool beneath.

Remove the edge-gathered grain and it becomes plain flat vector; change the pink and it stops belonging to the set.

## Palette

Measured from the examples. Every large form uses a ramp, never one flat colour. `style.json` lists every legitimate value.

| Role | Hex | Where it goes |
|---|---|---|
| Card background | `#FF81BE` | full-bleed rect, every card, including night and rain scenes |
| Cream | `#FDD5A8` | sparkles, bursts, dots, steam, code text, rain, pompom, fur ticks |
| Cream light | `#FFF3E2` | tiny glints on drops and pompoms only |
| Pool shadow / core | `#B95A93` / `#A04A80` | chalky floor pool; core at opacity 0.8 under the heaviest object |
| Blush | `#FF7FB0` | cheek ellipses at opacity 0.6 |
| Vermilion | `#FF4816` | flat accents: editor dot, bookmark, commit node |
| Vermilion ramp | `#FF5A24` `#F2440F` `#F0420E` `#B02B08` `#9C2306` | mugs, plant pots, fox fur (radial `#FF5A26`→`#FB4714`→`#D9380C`→`#9C2406`) |
| Coral | `#FF6A3A` | code accent, mug rim, sticky note |
| Knit | `#EE430F`+`#C2320A`, dark `#D2360B`+`#A42807`, rib `#E03A0C`+`#A8290A` | sweater, sleeves, beanie, cuffs |
| Ochre / gold | `#E7A13A` / `#D88A1E` | code keywords, sticky notes, band borders / gilt rules, fringe, owl toes |
| Ochre ramp | `#E38C1E` `#C96E05` `#9E5004` | window frames, book covers |
| Wood top | `#F0A23C`→`#D98418`, edge `#F6B860`, contact `#7A3A04` @0.38 | desk tops, sills |
| Maroon ramp | `#8A220A` `#701001` `#4A0901`, deep `#5A0E02` `#3A0601` | books, desk and sill fronts, round window frames, aprons |
| End shade | `#1A0402` | gradient overlay at 0.4-0.5 on both ends of boxes and spines |
| Screen | `#8A2632`→`#621626`→`#3A0A14` | screens; night sky `#3A1424`→`#1C0910`; rain pane `#22090F`→`#4E1420` |
| Near-black | `#191113` bezel, ramp `#3A2E31`→`#0D0809`, edge `#6A5A5F` | laptops, monitors, lamps, paws, ear tips |
| Face ink | `#0D0809` pupils/nose, `#120A0B` `#1A0E0F` lines, `#F7D6A6` eye ring | faces |
| Cream fur | `#FFE6C4`→`#FCD9AE`→`#F0BF88` | muzzles, chests, tail tips (radial) |
| Ivy | `#16592C` `#0F4A23` \| `#0C3F1D` `#082F15`, veins `#06150A` | ivy leaves, vines |
| Olive | `#7A7318` `#6A6416` \| `#524810` `#3C350C`, veins `#1C1804`; mug `#5E5712` | olive leaves, plant, mugs |
| Olive accent | `#A8B030` code green, `#8A9416` editor dot, `#545C01` scarf | small accents only |
| Oak | `#E08A1C` `#D47A0C` \| `#C96E05` `#A85A05`, veins `#3A1404` | oak leaves |
| Fur, amber | `#E59240`→`#CF7426`→`#A9531A`→`#7A3510`; limbs `#B85E1E`→`#5E280C`; paws `#6A3418`→`#32150A` | brown animals |
| Fur, owl | `#F0962E`→`#DC7A14`→`#B85A08`→`#8A3E04`; wing `#7E2A06`→`#461402` | orange animals |

Never: an outline around a shape; blue, teal, purple or grey anywhere except the pool; pure white except the lamp-light cone; any background but `#FF81BE`; a large shape in one flat colour; glows or rim lights. Cream decor never sits on cream fur, and a vermilion head never sits on pink alone: put it in front of a dark plane.

## Line and fill

At 480 wide:
- **Shapes are fills, never stroked.** Separate shapes with a value or hue step plus the grain edge. A stroke around a mug or a head is the first sign of a different style.
- **Thin dark detail lines only**, round caps, never `#000`: leaf veins 0.6-0.7, leaf stems 0.9, whiskers 0.75-0.8 (`#1A0E0F` or `#3A1A0C`), mouth and lid line 1.05-1.3 (`#120A0B`), finger creases 0.7 (`#1A0A04`), feather lines 0.9-1.1.
- **Cream lines:** steam 1.15-1.35, burst rays 1.3, scarf braces 1.1, rain 1.0 at stroke-opacity 0.22-0.5, ear-fur ticks 1.1.
- **Code on screens:** stroke 2.2-2.6, round caps, rows 7-8.4 apart, 2-3 segments per row in ochre, cream, coral, olive-green.
- **Gradients:** radial for round forms (cx 0.42-0.46, cy 0.30-0.34, r 0.72-0.78; stops light 0, mid 0.5, shade 0.82, edge 1). Vertical linear for slabs (light top, dark base). Horizontal 5-stop for cylinders (dark 0, mid 0.22, highlight 0.45, mid 0.75, darkest 1).
- **Overlays** add depth without new colours: `gEnds` across a box, `gBase` (`#5A0E02` 0→0.5) at a cylinder's foot, a crown band (`#7A3510` @0.3) clipped to the top of a head, a radial "sweat" (`#5A0E02` 0→0.55 at the rim) over a torso, sleeve gradients (dark maroon 0.55 outside → `#FF8A50` 0.12-0.22 inside).
- **Cast shadows inside the figure:** the sleeve path filled `#4A0901`, blurred 2.4 (`soft`), offset 3.5 px, clipped to the torso, opacity 0.85.
- **Grain:** wrap every solid shape group in `filter="url(#p-grain)"`; big light planes (window frames, desk tops) use `grainL`. Faces' details, code, cream decor, whiskers and veins stay crisp: draw them outside the grain group, after it.
- **Patterns** (userSpaceOnUse): knit 7x6 chevron, rib 3.2x10 stripes, Fair-Isle band 12x11 (maroon, cream drop, ochre dots), scarf 22x19, feather chevron 8x7.

## Characters

Animals only: fox, otter and owl in the examples. A new card brings one new or repeated animal (rabbit, hedgehog, bear cub, raccoon, cat, badger all suit).

- **Proportions:** head as wide as the torso or wider (84-92 px); head height 0.8-1.0 x torso height (shoulder to seat); head top to seat 110-150 px, plus 30-40 if the legs reach the floor. Short limbs, no visible neck: the chin overlaps the shoulders by 8-10 px. Measure it in the SVG: a 0.6 head-to-torso ratio looks lanky next to the set.
- **Head:** one smooth closed path in a radial fur gradient; a darker crown band clipped to the top; a cream muzzle (`gCream`) with a darker copy 1.6 px lower at 0.55 opacity as its shadow; ears with a darker inner shape (`#C2300A` or `#5A2408`); fox ear tips black via a clipPath. Tilt the head group 5-9 degrees toward what the animal looks at.
- **Eyes (the signature):** cream ring `#F7D6A6` r 10-12, pupil `#0D0809` at 0.81 r shifted 0.22 r toward the look direction, a cream 4-point star (scale 0.52-0.78) on the look side above centre, a cream dot r 1.35-1.6 below on the other side. Centres 29-37 px apart, so the eyes nearly touch. A sleepy variant clips a fur-coloured lid over the top with a 1.3 lid line and a short flick at the outer corner.
- **Nose and mouth:** a rounded inverted triangle 10-17 px wide in `#0D0809`, a `#6A5A5C` shine ellipse, then a 1.05 "w" mouth hanging from it. Muzzle dots `#7A4A30` r 0.9 on otters.
- **Whiskers:** two per side, 0.75-0.8, 28-75 px long, fanning slightly. **Blush:** `#FF7FB0` @0.6, rx 4.4-6.6, ry 2.6-3.4, under each outer eye corner.
- **Paws are this style's hands.** Gripping (the otter's mug): a fur forearm tube 12 → 9.5 wide leaves a rib cuff 17 → 15.5; a dark paw (`#6A3418`→`#32150A`) has a palm block about 9 x 15, three finger tubes 4.6 → 4.2 wide and 5.8-6.8 long laid ACROSS the front of the mug 4.7 apart, a thumb tube 5.6 → 4 arching over from the side, and 0.7 creases between finger rows. Resting: the toe-notched paw (19 px wide, `gBlack`) flat on the surface. Perching: three toe tubes 4.6 → 3.8 per foot wrapping the bar, each ending in a 1.3 dark claw hook that curls under. The thumb tube follows `references/craft.md` handedness. Paws take the animal's own fur ramp (or the dark paw ramp); a cream paw on a cream object (a paper rocket, a cream mug) disappears.
- **Clothing:** knit sweater (torso `pKnitD`, sleeves `pKnit`, rib collar, cuffs and hem), optional Fair-Isle band with 1.3 ochre borders; scarf with a 7-8 px gold fringe; beanie (knit dome, rib brim, cream pompom r 8.6 with a `#FFF0DC` glint). Folds are shading overlays, not lines.
- **Sitting:** the hips overlap the ledge top by 4-6 px; leg tubes (19 → 13) drop in front of the ledge face to webbed feet (pad plus four `#3E1A0A` toe ellipses rx 2.35 ry 3.3) turned out 8-20 degrees; a tail tube (17 → 4.6) curls out behind. On a low seat (a pouf, a stool) the thighs come toward the viewer as one lap shape no wider than the hips, with two knee bulges; the shins (30 → 25) drop in front of the seat face and the feet plant on the floor with `#7A3A04` contact ellipses.
- **Poses that work:** curled on a laptop deck with paws forward (fox); sitting on a sill holding a mug in both paws (otter); perched on a lamp arm, head tilted to the screen (owl); sitting on a pouf with one paw raised holding a small prop overhead and the other paw on a laptop's keys (the self-test's rabbit).

## Decor and props

- **Background decor:** 2 cream bursts (8 rays, scale 0.75-0.9, one rotated 12-14 degrees), 6-7 cream 4-point stars (scale 0.55-0.95), 18-21 cream dots r 1.0-1.4. Only in the margins, at least 8 px from the scene.
- **Leaves:** 7-8 per card, three kinds (ivy, oak, olive), scale 0.55-1.4, grained, in 2-3 loose clusters at x < 80 and x > 400, plus at most one stray near the top. Each leaf is split down the vein into a light and a dark half.
- **Props:** laptop (bezel `#191113` rx 4-8, maroon screen with code, three editor dots r 1.5-1.9), monitor on a black stand (a 7 px monospace `02:14` is the only text ever used), mug (vermilion, olive or cream cylinder, 2-3 cream steam squiggles, a cream motif such as a crescent or ring-and-bar), book stack (maroon, ivy, ochre; gilt rules 1.6 wide; dotted borders r 0.9 every 7 px), window (arched ochre or round maroon frame; rain, moon and stars only inside the pane), desk (ochre top, maroon front, brass pulls), desk lamp (black tube arm, speckled light cone), potted plant (vermilion pot, 5 fanned olive leaves, an ivy vine), sticky notes (ochre or coral, folded corner).
- **Per card:** one hero animal plus 3-5 props. Never people, UI-kit panels, logos, icons, blue sky, or more than a few characters of text.

## Composition

- **Card:** `<rect width="480" height="360" fill="#FF81BE"/>`, then decor, then leaves, then the scene group.
- **Scene size:** 330-360 px wide (70-75% of the card) and 250-290 px tall, horizontal centre within 10 px of x 240. The floor pool's lower edge sits at y 310-330 and runs 10-20 px past the furniture on each side.
- **Focal point:** the animal's face, in the upper-middle (y 100-190), in front of a dark plane (screen, window pane, round window or a chalkboard in the night-sky ramp) so the orange reads.
- **Ground:** no floor line; the chalky pool is the ground. Objects on a desk or sill get `#7A3A04` @0.38 contact ellipses (ry 1.7-2) and the edge gets a `#F6B860` 0.9 highlight line.
- **Group transform:** draw the scene, then centre it with one wrapper: `translate(0 -20)` or `translate(0 10)`, or `translate(240 178) scale(1.07) translate(-240 -178)`. Never scale the decor or leaves with it.
- **Density:** medium. Every quadrant has decor; the scene keeps clear pink around it.

## Techniques

`scripts/gouache.mjs` prints the shared defs with your prefix and has the repeated builders. Run from the skill folder:

```bash
node scripts/gouache.mjs defs wk-          # filters, leaves, sparkles, common ramps, knit patterns
node scripts/gouache.mjs --demo /tmp/g.svg # a test card using every builder
```

```js
import fs from 'node:fs';
import * as G from '/abs/path/to/illustration-grainy-gouache/scripts/gouache.mjs'; // relative to THIS file, not the cwd
const p = 'wk-';
const extraDefs = '';   // your fur ramps, clothing gradients and clipPaths
const body = [
  G.background(p, { seed: 3 }),                                  // pink + bursts, stars, dots
  G.leaves(p, [['ivy', 40, 112, -20, 1.15], ['oak', 436, 60, 22, 0.95]]),
  G.shadow(p, 70, 410, 312, { core: [90, 330] }),                 // chalky pool
  G.grained(p, `<path d="${G.tube([[201, 260], [200, 271], [198, 281]], [19, 16, 13])}" fill="url(#${p}gMaroon)"/>`),
  G.eye(p, 197, 143, 10.8, [1, 0.3]),                             // glossy eye, looking right
].join('\n');
fs.writeFileSync('card.svg', G.card(p, G.defs(p) + extraDefs, body, 'Title, Grainy gouache style'));
```

`G.defs(p)` defines these ids (all prefixed): filters `grain`, `grainL`, `chalk`, `speck`, `soft`; symbols `ivy`, `oak`, `olv`, `star`, `burst`, `drop`; gradients `gBlack`, `gMaroon`, `gOchre`, `gTop` (wood top), `gEnds`, `gBase`, `gScreen`, `gDeck`, `gCream`, `gVerm`, `gOliveCyl`, `gCreamCyl`, `gCone`, plus the leaf ramps; patterns `pKnit`, `pKnitD`, `pRib`. Put the animal's fur ramps, clothing gradients and any clipPaths in your own `extraDefs` string. Builders: `background`, `leaves`, `shadow`, `grained(p, svg, 'grain' | 'grainL')`, `tube`, `smooth`, `eye`, `blush`, `use`, `card`.

**1. The edge grain.** Fractal noise (base frequency 2.1) becomes dark brown-violet specks; the mask `2.0 x alpha - 1.8 x blur(alpha, 3.2)` is a band just inside each edge; a second term weights it by how dark the fill is; the specks multiply onto the shape. `grainFilter()` in the helper holds it. Change `dens` (1.0-1.08) for density, never `baseFrequency`.

**2. A shaded form.** Base gradient, then overlays in the same clip, then grain on the group:

```xml
<g filter="url(#wk-grain)">
  <path d="M74 288 L314 288 C318.5 293 319 309 314 314 L74 314 C69.5 309 69.5 293 74 288 Z" fill="url(#wk-gMaroon)"/>
  <path d="M74 288 L314 288 C318.5 293 319 309 314 314 L74 314 C69.5 309 69.5 293 74 288 Z" fill="url(#wk-gEnds)"/>
</g>
<path d="M174 299.5 L204 299.5 M174 303 L196 303" stroke="#701001" stroke-width="1.2" stroke-linecap="round"/>
```

**3. Limbs and tails** are `G.tube(points, widths)`: filled tapered tubes along a smooth centre-line with round caps (`cap0`/`cap1: false` where a limb enters a sleeve).

**4. The pool shadow** is two blobs through the `chalk` filter (displaced, mottled alpha): `#B95A93`, then a `#A04A80` core at 0.8.

## Failure modes

- **The set breaks when the background changes.** Night Shift and Rainy Refactor were first drawn on indigo and teal; judges scored both 7. Back on `#FF81BE` they scored 8.5 and 9. Put night, rain and weather inside windows and screens only.
- **Grain reads as dirty TV static.** The first draft used uniform grain over everything. Gather it at edges and into dark tones (the filter above); use `grainL` on big light planes; keep cream fur, faces' details and decor crisp.
- **Glows look digital.** Radial glow and rim-light gradients were removed from the night scene. Light is a white cone at 0.5 opacity through the `speck` filter, plus a speckled pool.
- **The hero disappears.** Orange fur on hot pink has little contrast. Stage the head over a dark screen, pane or frame.
- **Mitten paws.** A dark blob for a paw reads as a glove. Build palm + finger tubes + thumb tube + 0.7 creases, with the fingers in front of the object and the thumb closing over it.
- **The lap reads as a skirt.** In the self-test a lap shape wider than the hips, with thin shins set inside it, read as a green tutu. Keep the lap within the hip width and make the shins nearly as wide as the knees.
- **Floating animal.** A sitter that stops at the ledge edge hovers. Overlap the hips 4-6 px onto the surface, hang the feet in front of the face, and put the pool shadow under the whole group.
- **An outline creeps in.** A 1 px stroke around a prop turns it into a different style. Use a value step.
- **Clutter.** More than 8 leaves or decor inside the scene box crowds the card. Keep leaves in the margins.
- **Text.** Wordmarks or labels break the painterly read. At most a 7 px monospace clock on a screen.

## Examples

- `examples/cozy-commit.svg` (Cozy Commit): a fox curled on an open laptop on a book stack, scarf with a `{ }` pattern, cocoa mug. Shows a lying pose, resting paws, sleepy lidded eyes, the scarf pattern, book shading with `gEnds`, a commit graph on screen.
- `examples/rainy-refactor.svg` (Rainy Refactor): an otter in a knit sweater on a rainy window sill, holding a tea mug in both paws. Shows the gripping paw build, knit/rib/Fair-Isle patterns, sleeve cast shadows, a seated pose with feet over the ledge, rain clipped to the pane, a diff on a small laptop.
- `examples/night-shift.svg` (Night Shift): an owl in a beanie perched on a desk-lamp arm, watching a monitor at 02:14. Shows perching toes, a feather-tier wing, the speckled lamp cone, a round night window, sticky notes, a desk with legs and contact shadows.

## Workflow

Run commands from the skill folder (the one holding this file). Pick a prefix such as `wk-`.

1. **Brief:** name the subject in 3 words and the one action that shows it ("rabbit ships a side project": pressing deploy, a tiny rocket sticker). Pick the animal and one dark backdrop for its head.
2. **Pose and hero:** choose one of the working poses or a close variant; decide every paw's job (grip, rest, perch) and, for each gripping paw, left or right and where the thumb goes (`references/craft.md`).
3. **Block:** write a generator (`gen.mjs` in your own work folder) that imports `scripts/gouache.mjs` by absolute path (an ES import resolves against the generator file, not the cwd); place the furniture, pool shadow and the animal's big shapes with flat colours first; render.
4. **Draw:** replace flat fills with ramps and overlays, add patterns, the face, paws, props; add decor and leaves last, in the margins.
5. **Render:** `node scripts/render.mjs card.svg card.png`.
6. **Sheet:** `node scripts/render.mjs --sheet sheet.png examples/*.svg card.svg`. Ask "same hand, same set?"
7. **Zoom:** `node scripts/render.mjs card.svg z-face.png --zoom x,y,w,h --scale 8` on the face, every paw, the feet and each contact (hips on ledge, mug on surface).
8. **Critique** on the five criteria in `references/craft.md`, harshly; fix; re-render. Expect 4 rounds.
9. **Lint:** `node scripts/lint.mjs card.svg --prefix wk- --palette style.json`. Fix every ERROR; each WARN must be a deliberate fur or tint ramp.

## Verify

- [ ] Background is one full-bleed `#FF81BE` rect with no `rx`.
- [ ] No shape has a stroke outline; the only strokes are detail lines at 0.6-1.3, cream decor lines and code lines.
- [ ] Every large shape has a gradient and sits inside a `grain` or `grainL` group; at 8x the specks thicken at its edges.
- [ ] Face details, whiskers, code and cream decor are crisp (outside the grain groups).
- [ ] Eyes: cream ring, offset pupil, star highlight on the look side, small dot opposite, both pupils looking the same way.
- [ ] Blush at 0.6, whiskers present on mammals, nose with a shine.
- [ ] Each paw is built from finger or toe tubes, and every thumb sits on the side its handedness requires.
- [ ] The animal's head sits in front of a dark plane.
- [ ] A chalky `#B95A93` pool sits under the whole group; nothing floats; contacts overlap by a few px.
- [ ] 7-8 leaves, 2 bursts, 6-7 stars, 18-21 dots, all in the margins, none touching the scene or the card edge.
- [ ] Scene 330-360 px wide, centred on x 240 within 10 px, pool bottom at y 310-330.
- [ ] No text beyond a tiny monospace screen label; no blue, grey or pure white outside the lamp cone.
- [ ] Head at least as wide as the torso, head height at least 0.8 x torso height (measure the paths).
- [ ] Every id starts with the prefix; lint passes.
