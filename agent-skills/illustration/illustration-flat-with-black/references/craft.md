# Craft rules for every illustration card

These rules hold in every `illustration-*` style. They come from 42 hand-written SVG cards that blind judges scored against commercial illustration packs, and from the faults a designer kept catching in close-ups. Each rule names the failure it prevents.

## The card file

- One self-contained `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">`. A 4:3 card, drawn at 480 wide; every number in the style specs assumes that width.
- No `<style>`, no `class`, no `<script>`, no `<image>`, no `<foreignObject>`, no external `href` or `url()`. Presentation attributes only. *Failure prevented:* a card that loses its colours when pasted into a page whose CSS also styles `.hand` or `path`, or that breaks inside a sandboxed embed.
- Pick a short id prefix per card (`dk-`, `cr2-`) and start EVERY id with it: gradients, patterns, filters, clipPaths, masks. *Failure prevented:* two inline cards on one page share `id="grain"`, and the second card silently renders with the first card's filter.
- A full-card background, when the style has one, is a square full-bleed `<rect width="480" height="360">` with no `rx`. The page's card container rounds the corners. *Failure prevented:* a double radius, with a white sliver at each corner.
- Text: `font-family="ui-sans-serif, system-ui, sans-serif"` or `ui-monospace`. Draw wordmarks and big lettering as paths. Keep words to a few; a card is not a slide.
- Write a small generator (Node or Python) when the style repeats marks: hatching, halftone dots, wobbly brush outlines, grass blades, brick clusters. Hand-place the character and the hero object. Keep generators seeded so a re-run gives the same card.

## Originality

- Every scene is an original design or coding scene with original characters and props.
- Never trace or recompose a reference image. Don't reuse its poses, props or layout. If a reference shows a figure on a ladder at the left, don't put yours on a ladder at the left.
- Before you finish, compare your card against any reference you looked at and ask "would someone say this is that card redrawn?" If yes, recompose.

## Hands

Hands are the fault that judges and designers catch first, in every style.

- **Construction:** sleeve cuff → tapered forearm → a wrist narrower than the hand → palm → fingers → thumb. Never a fist pasted onto a sleeve, never a mitten blob, never fingers drawn as parallel stripes on a box.
- **Fingers:** they taper and differ in length. The middle finger is longest; the little finger is shortest and sits lower. Group them; don't space them evenly like a rake. Three or four visible fingers is normal.
- **Size:** a hand is about as long as the face from chin to brow. Bigger reads as a glove.
- **Gripping:** the fingers wrap around the object, so the overlap order changes along the grip. The thumb closes the loop from the other face. Two hands on one object are two separate fists with a gap.
- **Typing or resting:** the palm is flat or arched, the fingertips touch the surface, and the thumb shows.
- **Pointing:** the index finger is extended, the other fingers curl with knuckles visible, and the thumb tucks over the middle finger.
- **Open or waving:** the fingers spread slightly and the thumb angles out at about 45°.
- **Style match:** draw finger separations the way the style draws them: inner contour lines in an outlined style, gaps or tone steps in a flat style, a single loop in a one-line style.

### Handedness: put the thumb on the correct side

A designer rejected a whole pass of hands because the thumbs were on the wrong side. Agents never reason about this unless told to. Before drawing each hand, decide three things and write them down:

1. Is it the LEFT or RIGHT hand? Trace the arm back to its shoulder.
   - A figure in 3/4 or profile facing RIGHT shows its RIGHT side nearest the viewer; the near arm usually passes in front of the torso. Facing LEFT, the near side is the LEFT.
   - A figure facing the viewer has its right hand on the viewer's left.
   - Overlap order (in front of or behind the torso) is the strongest cue. In flat styles a darker, shaded sleeve is usually the far arm.
2. Which side faces the viewer: the PALM or the BACK (knuckles or nails)?
3. Which way do the fingers point, wrist to knuckles?

| Hand | Visible side | Thumb side when fingers point UP | General rule |
|---|---|---|---|
| Right | back | left | thumb = finger direction rotated 90° counter-clockwise |
| Right | palm | right | thumb = finger direction rotated 90° clockwise |
| Left | back | right | thumb = finger direction rotated 90° clockwise |
| Left | palm | left | thumb = finger direction rotated 90° counter-clockwise |

- Right hand, back visible, fingers pointing right: the thumb is on top. A left hand in the same position has the thumb at the bottom.
- For a hand seen edge-on, work in 3D. With x right, y up, z toward the viewer, f the finger direction, p the direction the palm faces and t the direction of the thumb: right hand t = f × p, left hand t = p × f. A right hand palm-down with fingers pointing right has its thumb on the far side, hidden; a left hand in the same position shows its thumb on the near side.
- The index finger always sits next to the thumb. The little finger is on the opposite edge.
- A gripping hand has its fingers and thumb on opposite faces of the object. Which face the thumb is on follows from the table, not from what looks convenient.
- In a bat or handle grip with two hands, both thumbs point toward the business end.

**Thumb proof:** make a throwaway copy of the card with the thumb filled `#ff0000` and the index finger `#0000ff`, render that hand at 8x, and check it against what you wrote down. Delete the copy afterwards.

## Pose and contact

- Give poses weight: a lean, bent knees, contrapposto, a twisted torso against a pull. Bolt-upright symmetry reads as clip art. *Failure prevented:* a front-facing symmetric redo of a pulling figure scored a full point lower than the twisted version.
- A sitting figure needs the seat to take the weight: hips lower than knees on a beanbag, thighs foreshortened, the cushion compressed. *Failure prevented:* "the sitting pose reads as standing".
- Everything that rests has contact: feet on the floor or ground line, objects on surfaces, cups on tables. Nothing floats by accident. Decor that floats on purpose (confetti, sparkles) keeps clear of the figure.
- No tangents: two contours that just touch read as a mistake. Overlap them clearly or separate them clearly.
- Arms connect. Every hand traces back through a forearm and an elbow to a shoulder. *Failure prevented:* "one hand has no arm".
- Legs taper from hip to ankle. Boxy Π-shaped trousers read as stiff.
- Heads have a neck.

## Composition

- The group is centred with generous, balanced margins: nothing touches the card edge, and no quadrant is dead empty.
- One focal point. The subject must read in one glance at 1x (480 px wide).
- Match the style's density. A sparse style with a cluttered card fails as surely as a dense style with an empty one.
- Name the card's subject before you draw, and make every prop serve it. When a joke has to land ("stack overflow"), test it at 1x: if you need the caption to get it, the drawing hasn't landed. *Failure prevented:* "the stack-overflow joke doesn't read at 1x".

## The loop: render, critique, fix

Headless only. Never open a visible browser window to check a card.

1. Render at 2x: `node scripts/render.mjs card.svg card.png`.
2. Put the card next to the style's examples: `node scripts/render.mjs --sheet sheet.png examples/*.svg card.svg`. The question is "same hand, same set?", not "is it nice?".
3. Zoom where faults hide, re-rendered from vector rather than upscaled: `node scripts/render.mjs card.svg hand.png --zoom x,y,w,h --scale 8` (x, y, w, h in SVG units). Check every hand at 3x or more, plus faces, feet and every contact point.
4. Check the 1x read: the subject has to land at 480 px wide.
5. Write a harsh critique against the five criteria below, fix, and re-render. Expect four or more rounds before a card is honestly an 8.
6. Lint: `node scripts/lint.mjs card.svg --prefix xx- --palette style.json`. Fix every ERROR. Off-palette WARN entries must each be deliberate.

### Scoring: five criteria, 0 / 1 / 2 each

The bar for every card is 8/10: "polished and intentional, only minor nits". The question is "would a buyer of a commercial illustration pack accept this as a new card in it?"

1. **Style fidelity:** palette, line weight, outline and fill rules, decor vocabulary and density all match the style.
2. **Character drawing:** proportions right for the style, appealing face, hands that read, feet and shoes, hair, clothing folds.
3. **Pose and physicality:** the gesture reads instantly, with weight and contact, and nothing floats or intersects by mistake.
4. **Composition:** a clear focal point, balanced weight, the style's density, generous margins, nothing cramped or cropped.
5. **Subject clarity and craft:** the subject reads in one glance; clean edges, consistent stroke widths, no stray marks.

### When someone else judges

- One judge varies by up to 1.5 points on the same render. Use two fresh judges and score each card as the lower of the two.
- Give judges each card's own subject. A rubric that names only the first card's subject makes judges mark later cards against the wrong subject.
- To compare two versions, show one judge both in random order. Separate absolute scores drift by about a point between judges.
- When a judge's notes go back to the illustrator, send them to the same illustrator who drew the card. A fresh redraw rarely beats a focused fix.
- When fixing one element (a hand, a head), diff the before and after renders and confirm only that element changed. If a designer says "it was better before" about one part, restore that part in place and keep the other fixes.
