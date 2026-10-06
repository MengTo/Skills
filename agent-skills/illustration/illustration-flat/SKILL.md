---
name: illustration-flat
description: Draws flat vector illustrations as SVG cards (480x360): slim, long-limbed people acting out one design or coding moment with one hero prop. Identified by no outlines on big shapes, thin white fold strokes as the only shading, navy only for hair, sneakers and a few hairlines, small heads (about 1:7) with big hands and white sneakers, and sparse floating confetti with no ground line, in lavender, indigo, sunshine yellow, coral and mint. Covers the measured palette, stroke numbers, character construction (tapered limbs, separated fingers, thumb side), poses, props, composition and a tested parts kit. Use when asked for flat illustrations, flat vector people, outline-free or no-outline characters, modern or corporate flat art, empty states, onboarding screens, 404 or error pages, coming-soon pages, blog headers, feature spots or marketing cards.
---

# Illustration: Flat

Flat, unshaded colour shapes on white: one slim person in a dynamic pose working on, fighting with or presenting one hero prop, with a ring of tiny confetti around them. It suits product moments (errors, empty states, launches, onboarding) where a figure should feel lively but light.

Boundary: if hair, trousers and shoes should be solid black masses with a ground line, use `illustration-flat-with-black`. If every shape needs a thin ink outline, use `illustration-outlined-cartoon` (big heads) or `illustration-line-interior` (white fills, rooms). For a single object with no person, use `illustration-teal-spot`.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence
Big shapes carry no outline at all: form is described only by thin white fold strokes laid on flat fills, plus a handful of navy hairlines, so the figure reads as cut paper with chalk creases.

## Palette
Measured from the three examples. No gradients, no opacity, no filters, no textures, no shadows.

| Role | Hex | Where it goes |
|---|---|---|
| Card background | `#FFFFFF` (none drawn) | The page's white card shows through. Don't draw a background rect. |
| Navy | `#011B5C` | Hair, sneaker outline and heel tab, hairline contours, laptops, motion marks, burst ticks, prop outlines |
| Lavender | `#9E91E1` | Sweaters, browser title bars, decor |
| Indigo-violet | `#6A6CEB` | Trousers, tags, screens |
| Sunshine yellow | `#FEC600` | Tops, hero props (chain, desk), decor dots |
| Skin | `#FD9999` | The one skin tone: face, neck, forearms, hands |
| Coral pink | `#FF7F91` | Socks, trousers, decor rings and squiggles, UI pills, window dots |
| Mint | `#93D7D5` | Tees, ladders, image placeholders, decor triangles |
| White | `#FFFFFF` | Sneakers, fold strokes, keylines, window bodies |
| Pale lavender | `#CDC6EF` | Smoke, clouds, soft secondary masses |
| Palest lavender | `#E4E0F7` | Front puffs over pale-lavender smoke |
| Tape yellow | `#FFE58A` | Masking tape, pale highlight props (one-off) |
| Warning red | `#FF6378` | One alert prop per card at most (one-off) |

- Each garment is one palette colour. Top and trousers always differ (lavender over indigo, mint over indigo, yellow over coral). Socks contrast with the trousers (coral under indigo, lavender under coral).
- The hero prop takes a colour the clothes don't use, so figure and prop separate without outlines.
- Never navy clothing, never navy skin details beyond the listed features, never a second skin tone in one card.

## Line and fill
Numbers at 480 wide. Every stroke has `stroke-linecap="round" stroke-linejoin="round"`.

| Element | Treatment |
|---|---|
| Body, clothes, limbs, hair, props | Filled shapes, no stroke |
| Fold strokes on clothes | White, 1.4; 2 to 4 per garment (hem, elbow, knee, waist); 10 to 25 px long, gently curved |
| Folds on sleeve hems, cuffs, smoke | White, 1.2 to 1.3 |
| Hair highlight | A bob gets one white 1.1 curve on the crown; the quiff gets a navy 2.4 flick instead; the bun gets none |
| Navy contours | 1.2 to 1.4: the near arm crossing the torso, a crotch or knee crease, the collar line (1.2) |
| Sneakers | White fill, navy 1.17 outline (at shoe scale 1.12 to 1.2), navy heel tab, sole line, two lace ticks |
| Finger separations | Navy 0.77 to 0.85, three short lines between four fingers |
| Face | Eye dot r 1.35 to 1.4; brow 1.05 to 1.1; mouth 1.05; ear curve 0.8 |
| Light props (windows, tags) | White fill, navy 1 to 1.2 outline, coloured title bar |
| Confetti | 1.4 strokes, or filled with no stroke |
| Motion arcs, burst ticks | Navy 1.3 to 1.4 |

- **Fattening a shape** (a cuff, a laptop lid): stroke it in its own fill colour, 1.6 to 3 wide, instead of redrawing it bigger.
- **Separating two overlapping shapes of one colour:** a white keyline. Draw the front piece once stroked white and 3 px wider, then again in its colour. The chain links use white 11 under yellow 8; the ladder rails use white 3 under mint.
- **Shading:** none. Depth comes from overlap order, white folds and the occasional navy contour.

## Characters
- **Proportions:** 205 to 235 px tall standing (57 to 65% of card height). The head is 28 wide and 35 tall, crown to chin: 1:6.5 to 1:7. Legs are long (hip to heel about 50% of height). Hands and feet run large: a hand is about the face's length, a sneaker is 46 px long (1.3 head lengths).
- **Head:** a profile or 3/4 profile facing the action. The nose is a bump in the face silhouette, not a separate mark. Eye: one navy dot. Brow: one short arc above it. Mouth: a short smile arc, a filled navy oval for shock, or a flat tick. Ear: a skin ellipse 2.5 x 3.5 with a navy 0.8 inner curve. No blush, no nose line, no pupils or eye whites.
- **Hair:** solid navy shapes: a short quiff (with a navy 2.4 flick), a bob with a blunt fringe (one white 1.1 highlight), a bun as a circle r 6. Glasses: a navy 1.0 ring r 3.6 and an arm to the ear.
- **Neck:** a slim skin quad from the collar to under the jaw, behind the chin, with a navy 1.2 collar arc.
- **Torso:** a smooth blob about 85 tall and 40 wide, leaning 12 to 30 degrees from the pelvis (30 for a hard push), sometimes arched; white hem fold plus two body folds.
- **Arms:** cuff, then a tapered forearm (9 px below the elbow to 5.6 to 6.2 px at the wrist), then a wrist narrower than the palm. Sleeves: a short tee sleeve 17 px long with a white hem fold, a 3/4 sleeve with a flared cuff and a white cuff fold, or a long sleeve to the wrist.
- **Hands in this style:** skin palm shape plus four fingers drawn as round-capped skin strokes 3.45 wide (lengths 9.0, 10.2, 9.4, 7.4: the middle is longest, the little finger shortest), a thumb stroke 3.6 to 3.7 angled out about 45 degrees, and three navy 0.8 separation lines. Fists: four finger bumps wrapping the bar with navy 0.8 knuckle ticks, the thumb crossing over with a navy 0.9 crease. Put the thumb on the side the handedness table in `references/craft.md` gives (the kit's `openHand` takes `hand` and `side` and does it for you). Palms pressed onto anything flat in the picture plane (a poster, a wall, a big UI knob) show their BACK to the viewer.
- **Legs:** tapered tubes, hip 29 to 32, knee 22 to 23.5, hem 19 to 20.5; a coloured sock band 10 px tall between hem and shoe. Knees bend; one leg usually carries the weight.
- **Feet:** white low-top sneakers, toe toward the direction of travel. A lifted heel (tiptoe) or lifted toe (weight rocking back) gives the pose life.
- **Poses that work:** kneeling with one knee up while pulling; recoiling with arms up and the torso arched back; stepping up on tiptoe to press something onto a wall; lunging into a push, front knee bent, back leg straight on tiptoe. Twist the torso against the action. Never front-facing and symmetric.

## Decor and props
- **Confetti, 6 or 7 per card:** a filled mint triangle (14 wide), an outline lavender triangle (12), an outline coral ring r 5, a filled yellow dot r 3.6, a filled lavender square 8, an outline mint square 11 to 13, a coral squiggle of four waves (24 wide). One of each kind at most; scatter them round the group's outer edge, 20 px or more from any figure part.
- **Expression marks:** paired navy motion arcs `))` beside a moving limb or head; 2 to 4 short navy burst ticks for surprise or a snap; small coloured shards (triangles 4 to 6 px) flying off a break.
- **Props:** browser windows (white body, navy 1.2 outline, rx 5, title bar 14 tall with pink, yellow and white dots), laptops (navy lid, indigo screen, white and pink code lines 2 wide), chip tags with 10 px bold text, a yellow desk, a mint step ladder, lavender smoke billows. Keep text to one short word or code (`404`, `0x0F`, `SOON`).
- **Never:** ground lines, cast shadows, plants, backgrounds or rooms, logos, more than one hero prop.

## Composition
- No background rect. Nothing touches the card edge: the drawing spans about x 70 to 430 and y 44 to 318.
- Figure plus hero prop make one group, about 75% of the card width and 70% of its height. The figure is on one side, the prop on the other, and their contact point (hands on the chain, palms on the poster) is the focal point near the centre.
- **No ground line.** Every shoe, table leg and ladder foot ends on one implicit floor at y 312 to 330.
- Density is sparse: one figure, one prop, 6 or 7 confetti, at most two expression marks.
- Fit the margins with one group transform round the whole drawing: `<g transform="translate(240 181) scale(0.93) translate(-243 -183)">` (0.93 to 0.94), or a plain `translate(-12 5)` when it already fits.

## Techniques
The examples were generated, not hand-typed: a script places tapered tubes, smooth blobs and stock parts (sneaker, hand, fist, head) and writes the SVG. `scripts/flat-kit.mjs` is that parts library, ported to dependency-free Node. Its sneaker, open hand, torso, head and arm output is byte-identical to the shipped cards.

```js
// card.mjs, next to a copy of flat-kit.mjs
import fs from 'node:fs';
import * as K from './flat-kit.mjs';
const { PAL } = K, B = [], FY = 282;                  // FY: the floor the shoes stand on
B.push(K.decor([['tri', 386, 70, PAL.mint], ['ring', 408, 150, PAL.pink], ['dot', 184, 46, PAL.yel],
  ['sq', 64, 318, PAL.lav], ['squig', 398, 236, PAL.pink], ['sqO', 196, 270, PAL.mint]]));
const W = K.frame([342, 176], -23);                   // pelvis at (342,176), torso leaning 23 deg
B.push(K.arm(W([10, -74]), [292, 150], [257, 156], { sleeve: 'cuffed', top: PAL.yel }));     // far arm first
B.push(K.openHand([257, 156], 182, { hand: 'R', side: 'back', spread: 4, narrow: false }));  // faces left: far = RIGHT hand
const tip = { a: -26, s: 1.12 }, t = K.shoePt([0, 0], tip, [-40, 0]);   // tiptoe: put the TOE on the floor
const heel = [345 - t[0], FY - t[1]];
B.push(K.leg({ hip: W([4, 3]), knee: [355, 220], heel, ...tip, trouser: PAL.pink, sock: PAL.lav, hipW: 31, kneeW: 22, hemW: 19, hipCap: true }));
B.push(K.leg({ hip: W([-5, 3]), knee: [320, 222], heel: [340, FY], s: 1.12, trouser: PAL.pink, sock: PAL.lav, hipW: 32, kneeW: 22.5, hemW: 19.5, hipCap: true }));
B.push(K.torso(W, { top: PAL.yel }));
const hc = W([-2, -105.5]);                           // head centre; tilt -37 = looking up at the hand
B.push(K.neck(W([-4.6, -79.5]), W([4.6, -80.5]), hc, -37), K.head(hc, -37, { hair: 'bob' }));
B.push(K.arm(W([-9, -72]), [273, 122], [250, 101], { sleeve: 'cuffed', top: PAL.yel }));   // near arm last
B.push(K.openHand([250, 101], K.ang([273, 122], [250, 101]) - 12, { hand: 'L', side: 'back', spread: 4, narrow: false }));
fs.writeFileSync(new URL('./card.svg', import.meta.url), K.card(B, { label: 'Title, Flat style', fit: [240, 181, 0.93] }));   // next to card.mjs
```

Draw order: decor, hero prop (or its back half), far arm and hand, far leg, near leg, seat and crease, torso, neck, head, near arm, near hand, then anything that wraps in front (fist fronts, tape).

- **Facing right:** the parts face left by default. Pass `flip: true` to `torso`, `head`, `neck` and every `leg` (toe right), and swap the shoulders: near `W([9, -72])`, far `W([-10, -74])`. With `flip`, a positive shoe angle is the tiptoe.
- **Stride or lunge:** two leg tubes leave a white notch under the hem. Add a seat blob in the trouser colour, `K.P(K.smooth([W([-15, -6]), W([15, -6]), K.lerp(hipF, kneeF, 0.3), W([0, 14]), K.lerp(hipN, kneeN, 0.3)]), trouser)`, then a navy 1.3 crease along the near thigh's inner edge.
- **Trouser folds:** `leg()` draws none. Add one white `fold` at each knee bend and one along a shin or thigh.
- **Arm over a same-colour torso:** a navy 1.3 contour 7 px off the upper arm's centreline on the torso side, from 30% of the way to the elbow, round the elbow: `const n = K.perp(K.norm(K.sub(el, sh)))`, points `K.add(K.lerp(sh, el, t), K.mul(n, 7.2))`.
- **Margins:** `card(B, { fit: [cx, cy, s], move: [dx, dy] })` scales about a point, then shifts. Other parts: `tube([[x,y,w],...])` for any tapered shape, `fold(pts)` and `contour(pts)` for white and navy lines, `fist(c, a)` returning `{back, front}` to sandwich a bar, `windowOpen(...)`, `motion(p)`, `ticks(c, angles)`, `smooth(pts)`, `shoePt(...)` to put a tiptoe's toe on the floor.

`node scripts/flat-kit.mjs --demo $W/parts.svg` writes a labelled sheet of every part (prints `wrote <path>`): the seven confetti kinds, the three heads, open hands in all four handedness cases, a fist round a bar, short and cuffed arms, a planted and a tiptoe leg, a tube with folds, motion arcs and ticks.

White keyline, hand-written (from the chain card):
```svg
<path d="M146 222.6 V246.6 A10 10 0 0 0 166 246.6 V222.6 A10 10 0 0 0 146 222.6 Z" fill="none" stroke="#FFFFFF" stroke-width="11"/>
<path d="M146 222.6 V246.6 A10 10 0 0 0 166 246.6 V222.6 A10 10 0 0 0 146 222.6 Z" fill="none" stroke="#FEC600" stroke-width="8"/>
```

## Failure modes
- **Fists pasted onto sleeves.** The judges' main complaint on the first card: no forearm, no wrist. Build cuff, tapered forearm, wrist, then the hand (`arm()` then `openHand()`/`fist()` at the same wrist point).
- **Boxy Π trousers.** Straight parallel legs read as stiff. Taper hip 30 to knee 22.5 to hem 20 and bend the knee.
- **Front-facing symmetric pose.** A redraw that faced the viewer squarely dropped from 7 to 6.5. Use profile or 3/4, lean the torso 12 to 30 degrees, twist it against the action.
- **Limp pulling or pushing.** Lean away from a pull, bend the elbows, brace a knee; lean into a push with the heel lifted.
- **Stripe mitten hands.** Fingers drawn as parallel bars on a box. Use separate round-capped strokes of different lengths and a 45-degree thumb.
- **Thumbs on the wrong side.** A designer rejected a whole pass for this. Decide left/right and palm/back for every hand and pass them to `openHand`; mirror `fist` from the table, then run the thumb proof in craft.md.
- **Outlines creeping in.** A navy stroke round a sleeve or leg turns it into a different style. Only the listed hairlines are navy.
- **Same-colour parts merging into one blob.** Two pink legs or two yellow links overlapping. Separate them with a white keyline or one navy 1.3 contour.
- **A drawn floor or shadow.** This style has none; align the feet on one y instead.
- **Big cartoon heads.** A 45 px head on a 230 px body reads as a different set. Keep 35 px.
- **Confetti crowding the figure** or more than 7 pieces. Keep 20 px clear and one of each kind; check the feet, where a square ended up under a shoe in testing.
- **A white notch at the crotch** in a stride. Add the seat blob and crease (Techniques).
- **A navy slab.** A big navy prop (a dark-mode track, a laptop) outweighs the figure. Keep navy props under about 1/6 of the card area and break them with white or lavender detail.

## Examples
- `broken-link.svg` (Broken Link): a kneeling woman with a bun and glasses pulls a snapped yellow chain; shows two fists gripping a bar (back/front sandwich), a white-keyline chain, the arm-over-torso navy contour, a long sleeve, a tiptoe back foot.
- `fatal-error.svg` (Fatal Error): a man in a mint tee recoils from a warning triangle bursting out of a laptop on a yellow desk; shows short sleeves, two open hands with correct thumbs, an open-mouth shocked face, smoke billows, burst ticks and motion arcs.
- `coming-soon.svg` (Coming Soon): a woman in a yellow top on a mint step ladder presses a browser-window poster to the wall, with a SOON tag; shows 3/4 cuffed sleeves, palms pressed flat, a tiptoe leg, the bob haircut, a white-keyline ladder, masking tape.

## Workflow
Run from this skill folder. `render.mjs` needs `playwright-core` (or `playwright`) installed here, in the current folder or globally, plus a Chromium.

1. **Brief.** Name the subject and the one action that shows it (who does what to which prop). Write down the joke or gesture that must read at 480 px.
2. **Pose and hero.** Pick the hero prop and its colour, and a pose with a lean and one weight-bearing leg. Decide the facing; then write down LEFT/RIGHT and PALM/BACK for every hand (craft.md table).
3. **Set up:** `W=/tmp/flat-card; mkdir -p $W; cp scripts/flat-kit.mjs $W/`, then write `$W/card.mjs` from the Techniques skeleton. Use an id prefix (`dm-`) if you add any ids.
4. **Block** the figure with `frame`, `torso`, `leg`, `arm` at the right proportions (Characters), the prop and the floor y. Render and check proportions before details.
5. **Draw** hands, head, hair, folds, contours, the prop's detail, then 6 or 7 confetti and up to two expression marks.
6. **Render:** `node $W/card.mjs && node scripts/render.mjs $W/card.svg $W/card.png` (card.mjs writes card.svg next to itself).
7. **Sheet:** `node scripts/render.mjs --sheet $W/sheet.png examples/*.svg $W/card.svg`. Ask "same hand, same set?"
8. **Zoom** every hand, the face and both feet at 8x: `node scripts/render.mjs $W/card.svg $W/hand.png --zoom x,y,w,h --scale 8`. Thumb proof: in a copy of card.mjs that writes `proof.svg`, call `K.setProof(true)` before drawing (thumbs red, index fingers blue), render each hand at 8x, check it against your notes, delete the copy.
9. **Critique** on the five criteria in `references/craft.md` and the Verify list below; fix; repeat. Expect three or four rounds.
10. **Lint:** `node scripts/lint.mjs $W/card.svg --palette style.json` (add `--prefix dm-` if you used ids). Fix every ERROR; every WARN colour must be a deliberate one-off.

## Verify
- [ ] No shape larger than a finger has a stroke, except white props with a navy 1 to 1.2 outline.
- [ ] Fold strokes are white, 1.2 to 1.4, round-capped; 2 to 4 per garment.
- [ ] Navy appears only on hair, sneakers, face features, finger and knuckle lines, the listed contours, laptop parts and marks.
- [ ] Only palette hexes, one skin tone, no gradient, opacity or filter.
- [ ] The figure is 205 to 235 px tall with a 35 px head; legs taper; the torso leans.
- [ ] Every hand traces back through a wrist and forearm to a sleeve; fingers differ in length; thumbs match the table.
- [ ] White sneakers with navy outline, sock bands under the hems, all feet on one implicit floor; no ground line or shadow.
- [ ] Top, trousers, socks and hero prop are four different colours.
- [ ] Overlapping same-colour parts are split by a white keyline or a navy contour.
- [ ] 6 or 7 confetti, one of each kind, 20 px clear of the figure; at most two expression marks.
- [ ] Nothing inside 40 px of the card edge; the contact point between figure and prop sits near the centre.
- [ ] The subject reads at 1x without the title.
