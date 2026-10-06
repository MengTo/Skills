---
name: illustration-framed-panel
description: Draws original design-and-coding scenes as SVG cards (480x360) in a framed-panel cartoon style. Identifying traits are a soft pastel card with a periwinkle-violet panel framed in thin navy, outline-only clouds and a pale lavender floor band with dashes inside it; L-shaped corner brackets outside two corners; white speech bubbles, UI cards and bushes that break out over the frame edge; and a semi-real character with a thin navy outline (1.25 px), muted flat fills, navy hair with violet highlights, blush and short paired hatch marks. Covers people working with laptops, screens, UI parts and devices. Use when someone asks for a framed panel, window-frame or picture-frame illustration, pastel violet cartoon, outlined flat character scene, empty-state, onboarding or 404 art, a blog header, a feature spot, a support, about or team page illustration, or a marketing card with a person.
---

# Illustration: Framed panel

A cartoon person at work inside a violet "window", painted on a pastel card. The panel gives the scene a stage, and the UI bubbles and bushes that spill over its edge make it feel lively rather than boxed. Use it for friendly product and team moments: support, live streams, design work, onboarding.

Boundary: for people without a frame on a plain white background with inked outlines and big heads, use `illustration-outlined-cartoon`. For flat shapes with no outlines and floating confetti, use `illustration-flat`. For a single object with no person, use `illustration-teal-spot`.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence

A fixed violet panel with a thin navy frame sits on a pastel card, with outline clouds and a dashed lavender floor inside it, and the scene's white bubbles, UI cards and leaves break out across its edge.

## Palette

Measured from the examples. Every card uses the navy line, the panel set and the bubble set; pick one card pastel.

| Role | Hex | Where it goes |
|---|---|---|
| Card: peach / orchid / sky cyan | `#F7D8B5` / `#DFA5D4` / `#A7E0ED` | full-bleed card, one per card |
| Bracket and outside marks | `#9C878C` / `#A3739B` / `#6E9FAD` | brackets on the matching pastel |
| Navy line | `#2E2A5C` | every outline, clouds, hatch marks, eyes, bold UI text |
| Panel | `#8A80EA` | panel fill (also a UI accent: slider, swatch) |
| Floor band / floor dashes | `#D0CCF4` / `#8F88D6` | floor rect y 256–312, its short dashes |
| Contact shadow | `#B5AEEA` | flat ellipses under feet, chairs, beanbags |
| Bushes | `#BACCA6`, `#A9C094` front layer | scalloped bushes on the floor line |
| Hair / hair highlight | `#433D71` / `#7C74C4` | all hair; highlight strokes; folds on dark fabric |
| Skin (three tones) | `#EDB0A2`, `#F0BFA4`, `#D49A80` | face, neck, hands |
| Blush | `#E8878A` at opacity 0.5–0.6 (on `#D49A80` skin: `#C46A5C` at 0.55) | cheek ellipses, tongue line |
| Mouth | `#9A3E52` (`#8A3A48` on tan skin) | open smile |
| Tops | mustard `#EDB24F` (cuff `#E0A23E`), mint `#95D1B3` (shade `#79BC9C`), orange `#EE8A6E` (shade `#D9735A`) | sweaters, hoodies, cardigans |
| Trousers | `#6A63B0` (folds `#A29DDA`), `#4A4488` (folds `#7C74C4`) | jeans |
| Cream / white | `#FCF6EA`, `#FCFAF3` / `#FFFFFF` | tees, socks, shoe uppers, code windows / bubbles and UI cards |
| Red accent / its shadow | `#E35D5B` / `#B8434A` | shoe soles, tags, buttons, heart, errors |
| Pale red, pink | `#E9A3A0`, `#F8CCC8`, `#F4E0E8`, `#F29CA0` | secondary UI lines, error rows, drop slots, code tokens |
| Green / dark green / pale green | `#5FA77A` / `#3E8E5E` / `#CDEBD6` | check badges, toggles, success rows |
| Mint, sage | `#8FD0B0`, `#6FB585`, `#79C2A8` | icon chips, image placeholders, avatar shirts |
| Yellow, orange | `#EDB24F`, `#F09A5E` | swatches, earrings, highlighted code |
| UI greys | `#BDB8D6` lines, `#6E6A8E` / `#7D79A0` dark lines, `#C9C5DE` raised-shadow, `#CFCBE0` line numbers | text placeholders inside bubbles |
| Devices | `#C9C7DA` body, `#9F9CB8` / `#B7B5CC` / `#A9A7C0` edges, `#DCDAE8` keyboard, `#A9A6C2` keys, `#3A3570` screen, `#524C98` active line, `#6E68AA`, `#E8E6F8`, `#BDB8F0` code on dark | laptops, monitors |
| Furniture | `#C9C5E8` + `#A9A4D8` seams, `#B9B4DE`, `#D8D3F0` grid, desk `#F6E7D2` top / `#E3B98E` edge, `#FFF4D6` lamp glow | chairs, drawers, boards, desks |
| One-off prop tint | e.g. plum `#B2679E` (the Support beanbag) | one large prop per card may take its own muted tint; lint will WARN on it |
| Avatars | `#FBE3CC` background, `#F1B9A2` skin, `#D9774E` ginger hair | small faces inside bubbles |

- No gradients, filters or patterns. Opacity only on blush ellipses (0.5–0.6) and on glasses lenses (`fill-opacity` 0.18).
- Never put the panel violet behind a violet top or violet trousers without a navy outline between them; the figure has to separate from the panel by value (mustard, mint, orange, cream all do).
- The card pastel never appears inside the panel, and the panel violet never fills the card.

## Line and fill

- One outline colour, navy `#2E2A5C`, always a stroke over a flat fill, round caps and joins.
- Widths at 480 wide: panel outline **1.35**; body, clothes, furniture, bubbles **1.25**; hands, shoes, bushes, neck **1.05–1.15**; clouds and floor line **1.2**; fold curves **0.9–1.1**; hatch pairs and inner ear **0.85–0.9**; finger separations **0.75–0.8**; corner brackets **1.25** in the bracket colour.
- Texture is drawn, never filtered: pairs of short parallel slashes (each 3–4 long, the second 1 right and 5 lower, slanting up-right, navy 0.9) scattered 2–4 pairs per garment; a few longer fold curves; on dark trousers and hair, folds and highlights in the lighter tint (`#A29DDA`, `#7C74C4`) at 1.0–1.2.
- Shading is a flat darker tone with no outline, laid inside a shape along one side (`#D9735A` panels inside an `#EE8A6E` hoodie; `#79BC9C` cuffs on a mint sweater).
- Raised UI parts (buttons, toggles, tags, chips) have a darker copy 3 px straight below (`#B8434A` under red, `#3E8E5E` under green, `#C9C5DE` under white).
- Every white bubble and card gets one short inner corner tick (`Q` curve, 1.0) 5–7 px inside a top corner: the "sketchy" hand.
- Text: `ui-sans-serif, system-ui, sans-serif`, weight 700–800, 10–16 px, navy or white. At most three words per card ("Fixed it!", "+1", "LIVE", "Aa").

## Characters

- **One figure per card**, seated or kneeling: the panel interior is 266 tall and every example figure spans 195–215 px from hair top to floor. A standing adult (about 5.5 heads) does not fit; crouch, sit, kneel or crop at a desk.
- **Head:** use `face()` from `scripts/panel-kit.mjs`; it is the same face in all three examples. 3/4 view, 36 wide and 46 tall (brow to chin), chin at (232, 166.5) before your transform. Near eye a navy ellipse rx 1.8 ry 2.1 with an upper-lid arc and a lash flick to the outside; far eye smaller (rx 1.5 ry 1.9); arched brows 1.2; a single hook nose on the far side of the face; an open smile filled `#9A3E52` with a pink tongue line; blush ellipse 7.6 × 4.2 under the near eye and a small one at the far cheek edge; ear with one inner curve; a gold earring.
- **Placing the head:** wrap face, neck and hair in one `<g transform="translate(dx dy) rotate(a 232 166)">`; tilt 4–8° into the action. Mirror with `scale(-1 1)` to look left. Never scale the head: the line weight would change.
- **Hair:** navy-violet `#433D71` masses with 1.25 outline: a back mass drawn before the face and a fringe or cap after it. Add 3–5 highlight strokes `#7C74C4` (1.1–1.2) following the hair direction and 1–2 navy inner strokes (0.9–1.0). The examples show a bob with a side fringe, a high bun with a scrunchie, and a curly crop.
- **Body:** torso 60–70 wide, soft trapezoid, sleeves as separate shapes overlapping the torso. Necklines and hems drawn as a second line 3–4 px inside (ribbed hem: a line plus short vertical ticks every 6–7 px). Cardigans have 2 buttons (r 1.5); hoodies have cream drawstrings (1.6) with tiny rectangular tips.
- **Hands:** about 22–26 px long, a little shorter than the face. Built as cuff band (the sleeve's shade tone, 5–6 wide, one centre line at 0.8) → forearm in skin → wrist → palm → fingers separated by short inner curves at 0.75–1.0, knuckle bumps on the outline. Thumbs are a separate small shape. Templates: `typeHand()` (flat or typing, back of hand), `pointHand()` + `pointCuff()` (index extended, others curled, thumb across), `gripHand()` (a right fist round a handle, back to the viewer, thumb over the top on the business end) and `kneeHand()` (the far arm of a right-facing seated figure, hand palm-down over a knee). Before placing any of them, decide left or right, palm or back, finger direction, and check the thumb side with the table in `references/craft.md`; mirror the template with `scale(1 -1)` when the table says the thumb belongs on the other edge.
- **Legs and feet:** jeans taper from hip to ankle with a knee bend; when both legs overlap, give the far leg the darker jean `#4A4488` (folds `#7C74C4`) behind a `#6A63B0` near leg; hems as a single line; a sock or bare ankle 2–3 px; white sneakers with a 3-px red sole (`sneaker()`), a toes-tucked shoe for kneeling (`tuckedShoe()`). Shoes always touch the floor band or a footrest, with a contact ellipse under them.
- **Poses that work:** cross-legged on a beanbag leaning into a laptop (the body rotated −5° about the hips), kneeling on one knee while pressing a button into a board, seated on a chair pointing at a monitor while looking back at the viewer. Each has a lean, a twist or a bent knee.

## Decor and props

- **Inside the panel:** 2 cloud doodles (a big one ~50 wide and a mid one ~44 wide, each with a 3-px dash to its right), optionally a small one (~17 wide), plus 2–4 tiny single-arc ticks (~9 wide), all outline only, in the sky area and never behind the head; one wall prop at most (a code window, a ring light, a grid board).
- **Floor:** the band from y 256 to 312 with a navy line at 256 and 6–7 dashes (10–26 long, some followed by a 4-px dash after a 5-px gap) near its top corners and bottom edge.
- **Bushes:** 1–2, standing on the floor line at a bottom corner; at least one crosses the panel's side edge.
- **Breakouts:** exactly 2 white UI pieces (speech bubble, UI card, type specimen) that cross the frame: one upper-left across the left edge (x about 62–166, y 58–134), one on the right across the right edge (x about 336–436, y 150–250). Optional third: a small red tag across the top-left corner. Each holds an icon or avatar plus 2–4 text lines; no paragraphs.
- **Outside the panel:** the two corner brackets (top-right and bottom-left, fixed coordinates) and 2–3 parenthesis marks: a double arc beside one side, a single arc beside the other, in the bracket colour. 0–2 navy sparkle ticks (three short radiating strokes, `ticks()`) beside a breakout.
- **Never:** confetti, stars, gradients, drop shadows, a second figure, a frame in any colour other than navy, decor in the card margins beyond the brackets and marks.

## Composition

- Card: square full-bleed rect, no `rx`. Panel: `x 110 y 46 w 262 h 266` (55 % of the width, 74 % of the height), fill `#8A80EA`, navy outline 1.35, identical in every card.
- Draw order: card → brackets and marks → panel fill → clouds → wall props → floor band, line, dashes → props wholly inside the panel → **panel outline** → bushes that cross the edge → furniture and figure → breakout bubbles and cards → sparkle ticks. Anything that crosses the frame is drawn after the outline so it sits on top of it.
- The figure's centre line sits at x 205–235, slightly left of the panel centre (241), facing the prop on the right; the head is in the upper half of the panel with 30–60 px of sky above the hair.
- Weight: the left breakout high, the right breakout at mid height, the bushes low at the corners, so the three non-figure masses form a loose diagonal.
- Breakouts cross the frame by 40–65 px (measured: 44–64 in the examples). A card that only clips the edge by 10–20 px reads as misplaced, not as breaking out.
- The lower half needs one furniture mass 120–200 px wide (beanbag, desk, component board, or a seat plus a side table). A figure on a thin stool alone leaves a violet hole under the right breakout.
- Margins: everything stays inside x 40–450 and y 30–325.

## Techniques

`scripts/panel-kit.mjs` holds every repeated part, lifted from the examples (no dependencies, deterministic). Generate the frame, then hand-draw the figure and props in between. `node scripts/panel-kit.mjs demo "$WORK/kit.svg"` draws every part on one card so you can see them before using them.

1. **The frame.** `scaffold({ prefix, bg, label, clouds, wall, inside, front })` returns the whole card with the layers in the order above. `cloud(x, y, 'big'|'mid'|'small'|'tick')` and `bush(x, 'big'|'mid'|'small', { mirror })` place the doodles; `floorShadow(cx, cy, rx)` puts a contact ellipse on the floor.
   ```sh
   node scripts/panel-kit.mjs scaffold "$WORK/card.svg" --bg orchid --prefix xx- --label "Card Name"
   ```
2. **Breakouts.** `bubble({ x, y, w, h, tail: 'down'|'left'|'right', at })` draws a white speech bubble (radius 8, 11-px tail) with its corner tick; wrap it in a `<g stroke="#2E2A5C" stroke-width="1.25">`. `raised(x, y, w, h, rx, face, under)` and `textLine(x, y, len, colour)` fill it.
3. **Head and shoes.** `face({ skin, blush, blushOpacity, mouth, earring, smile })` and `neck(skin)` in template coordinates; `sneaker(x, y, { mirror })`, `tuckedShoe(bx, by)`.
4. **Texture.** `hatch(x, y)` returns a pair of slashes: `<path d="${hatch(186, 214)} ${hatch(214, 196)}" stroke="#2E2A5C" stroke-width="0.9" fill="none" stroke-linecap="round"/>`.
5. **Holding things.** Draw the held object first, then `gripHand()` over it, so the curled fingers and thumb overlap the handle; rotate the fist so its fingers follow the forearm, and tilt the handle up to 45° off the thumb axis for wrist bend. To show a lens or screen magnifying what is behind it, redraw that content inside a `clipPath` of the lens, scaled 1.6 about the lens centre, then a white `fill-opacity` 0.18 glass and two short white glare strokes; give the rim a light metal `#C9C7DA`.
6. **Moving traced paths.** `xf(d, { ox, oy, tx, ty, s, sx, sy })` moves, scales or mirrors path data while keeping stroke widths exact; use it instead of `transform="scale()"` on anything outlined.

## Failure modes

- **Typing hand without a thumb.** Both judges marked the Support card's first typing hand for it. Every hand shows its thumb or is turned so the thumb is plainly hidden behind the palm; check with the thumb proof.
- **Thumbs on the wrong side.** A designer rejected a whole pass of hands across the set for this. Write down left/right, palm/back and finger direction for each hand before drawing it.
- **Upright on a soft seat.** "She sits upright, with no sink into the beanbag": lean the torso 5° into the work, drop the hips below the cushion's rim and dent the cushion outline around them.
- **Too clean a line.** Judges found the line "cleaner and more even than the pack's sketchy line". Mix widths (0.75–1.35 as listed), add the bubble corner ticks, hatch pairs and short tick marks at seams.
- **UI kit instead of doodles.** Breakouts that are full mini-interfaces read as a UI kit. Keep each to an icon, an avatar or a big glyph plus 2–4 placeholder lines.
- **Too many bubbles.** Live Coding's early drafts stacked a heart bubble and a "+1" bubble on the left; the shipped card (scored 9) merges them into one "+1 ♥" bubble and balances the bottom corners with a bush on each side.
- **A lone prop clutters the floor.** A PC tower beside the desk was cut from Live Coding; keep the floor to the furniture the figure uses plus bushes.
- **Simplified crossed legs.** The Support card's crossed legs and socks were called simplified: draw the far foot tucked under the near knee, the near shin crossing in front, a visible sock band and the sole of the near foot.
- **Figure merges with the panel.** Violet clothes on the violet panel lose the silhouette; dress the figure in mustard, mint, orange or cream, and keep dark trousers below the floor line where the band is pale.
- **Floating feet.** Shoes need a `#B5AEEA` contact ellipse and must sit on y 295–304 in the floor band, or visibly on a footrest or stool ring (the self-test's tucked foot first hung beside the ring, not on it).
- **A dark lens reads as a frying pan.** The self-test's first magnifier had a hair-navy rim and grey glass; a light `#C9C7DA` rim and a magnified view of the card under it made it read at once.
- **Glyphs that turn into digits.** Open hook quote marks at 10 px read as "66" (self-test); draw quotes as two filled teardrops and check every small glyph at 1x.
- **A handle pasted over the fist.** Drawn after the hand, a handle sits on top of the fingers and the grip reads as a sticker; the handle goes first, the fingers and thumb over it.

## Examples

- `examples/support.svg`: Support (peach). Cross-legged on a plum beanbag, typing on a laptop on her lap, leaning in; a user's question bubble breaks out left, a "Fixed it!" reply breaks out right, a code window with a bug row and a fixed row hangs on the panel wall. Shows the typing hand, crossed legs, beanbag compression, kicked-off sneakers.
- `examples/design-system.svg`: Design System (orchid). Kneeling on one knee, pressing a red button into its dashed slot on a grid board of components (swatches, toggles, slider, avatar chip); a selected component card with handles and a cursor breaks out top-left, an "Aa" type card breaks out right. Shows kneeling legs, a toes-tucked shoe, a two-handed push, raised UI parts.
- `examples/live-coding.svg`: Live Coding (sky cyan). Seated at a desk on a swivel chair, pointing at code on a monitor while grinning at the viewer; a mic on a boom arm, a ring light, a mug; a red LIVE tag crosses the top-left corner, a "+1 ♥" chat bubble breaks out left, a code snippet bubble breaks out right. Shows the pointing hand, a mirrored head with glasses, a hoodie with strings, desk drawers.

## Workflow

Run commands from this skill's folder. `WORK` is your own work folder (any path); the card is `$WORK/card.svg` with id prefix `xx-`.

1. **Brief.** Name the subject and write one line each: the figure's action (verb + object), the pose (sit, kneel, crouch), the wall prop, the two breakouts and what each says, the card pastel.
2. **Pose and hands first.** Sketch the figure as boxes on paper or in comments: hip point, knee, feet on the floor band, the shoulder line and where each hand lands. For every hand write down left or right, palm or back, finger direction and the thumb side from `references/craft.md`.
3. **Scaffold:** `mkdir -p "$WORK" && cp scripts/panel-kit.mjs "$WORK/" && node scripts/panel-kit.mjs scaffold "$WORK/card.svg" --bg peach --prefix xx- --label "Card Name"`. For anything beyond the empty frame, write a small generator in `$WORK` that imports `./panel-kit.mjs` and calls `scaffold({ ..., front })` with your figure.
4. **Block** the furniture, torso, legs and head (via `face()`), render, and check the silhouette and the lean at 1x before any detail.
5. **Draw** clothes, hands, hair, props and breakouts; then add folds, hatch pairs, corner ticks.
6. **Render** (headless, 2x): `node scripts/render.mjs "$WORK/card.svg" "$WORK/card.png"`
7. **Sheet next to the examples:** `node scripts/render.mjs --sheet "$WORK/sheet.png" examples/*.svg "$WORK/card.svg"`. Ask "same hand, same set?": frame, line weight, how much breaks out, the face.
8. **Zoom** every hand, the face, the feet and every contact at 5–8x, re-rendered from vector: `node scripts/render.mjs "$WORK/card.svg" "$WORK/hand.png" --zoom x,y,w,h --scale 8`. Do the thumb proof from `references/craft.md` on a throwaway copy.
9. **Critique** against the five criteria in `references/craft.md`, fix, and repeat. Expect four or more rounds.
10. **Lint:** `node scripts/lint.mjs "$WORK/card.svg" --prefix xx- --palette style.json`. Fix every ERROR; each WARN must be a deliberate tint.

## Verify

- [ ] Card is one full-bleed pastel rect (peach, orchid or sky cyan) with no `rx`.
- [ ] Panel at exactly `110, 46, 262 × 266`, fill `#8A80EA`, navy outline 1.35, drawn after the inside props and before the breakouts.
- [ ] Corner brackets at top-right and bottom-left in the card's bracket colour, plus a double and a single parenthesis mark outside the sides.
- [ ] Two outline clouds with their tail dashes and 2–4 tiny arc ticks inside the panel; nothing filled in the sky.
- [ ] Floor band y 256–312 with its navy line and 6–7 dashes; every foot and chair leg on it with a contact ellipse.
- [ ] Exactly two white breakouts crossing the left and right frame edges, each with a corner tick; at least one bush crossing a side edge.
- [ ] All outlines navy `#2E2A5C`; widths in the listed bands (no stroke over 1.35 except deliberate UI bars).
- [ ] The face is the shared template (eye sizes, lash flick, hook nose, blush), placed by translate and rotate only.
- [ ] Every hand has a cuff band, a wrist narrower than the palm, separated fingers and a thumb on the side the handedness table gives.
- [ ] The pose has a lean, twist or bent knee; the seat or floor visibly takes the weight.
- [ ] 2–4 hatch pairs per garment, hair highlight strokes, at least one flat shade panel or darker cuff.
- [ ] Text is three words or fewer, 700–800 weight, navy or white.
- [ ] `lint.mjs --palette style.json` passes; any WARN is a tint you chose on purpose.
