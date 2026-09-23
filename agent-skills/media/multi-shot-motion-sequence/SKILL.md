---
name: multi-shot-motion-sequence
description: "Cut one scene into a short sequence of fixed-length shots — typically three 2-second scenes — where each shot frames a different element from its own angle, optionally under its own light, and carries its own statement, with every statement proven clear of the subject by measurement. Use when a single-statement motion piece should become several beats, when a request names the parts to zoom into (the screen, the keys, the whole machine), when shots should differ by angle or by hour (night/morning/sunset, light and dark mode), when text overlaps the subject or sits in the wrong corner, or when statements and camera drift out of step in a recorded preview."
---

# Multi-Shot Motion Sequence

One scene, cut into N shots of equal length, played end to end on one loop. Each shot
frames a different element of the same scene and carries a statement of its own. Nothing
is rebuilt between shots — the camera cuts.

Sibling skills, worth loading alongside: `compose-motion-frames` for proportion inside a
single frame, `website-to-motion-design` for turning a page into a frame in the first
place. This skill is only about **the cut, the shot list, and proving the type is placed
properly.**

## Use When

- "Can we have three separate scenes of 2 seconds each with different messages?"
- "Another variant — different angles, night / morning / sunset."
- A request names what each beat should show: *the screen showing charts, the keyboard
  typing, overall*.
- A statement overlaps the subject, or all statements are stacked in one corner.
- A recorded preview shows shot 3's camera under shot 2's words.

## 1. The Shot List Is Data

One entry per shot, holding what it frames and how tight. Not a function per shot, not a
timeline library — a small array the whole edit reads from:

```js
const SHOTS = [
  { focus: 'screen', zoom: 0.600, push: 0.032, biasX: 0.170, biasY: -0.010 },
  { focus: 'keys',   zoom: 0.385, push: 0.026, biasX: 0.090, biasY:  0.020 },
  { focus: null,     zoom: 0.885, push: 0.040, biasX: 0.100, biasY: -0.035 },
];
```

- `focus` names a **thing in the scene**, resolved to a world position at runtime. Never
  hand-tuned coordinates — see §3.
- `zoom` scales the scene's **own** camera fit. Do not build a second camera. Lift the
  existing fit block verbatim, multiply its field by one factor, and add the shot's bias
  to its existing bias. Everything the scene's author decided about margins, aspect
  handling and portrait framing then still holds.
- `push` is how far the shot creeps in over its own length. Small — 3–7% of the field.
  The cut does the work; the creep only keeps the frame alive.
- `bias` slides the subject inside the frame so the statement gets ground. Positive X
  moves the subject left.
- `az` / `el` offset the scene's **own** orbit rather than replacing it, so the authored
  idle drift and pointer response keep working underneath. Stay inside roughly the range
  the scene already allows itself — past that a scene authored as an isometric drawing
  starts reading as loose 3D.

Pick the shot from the clock and let it cut hard:

```js
const c = ((seconds % CYCLE) + CYCLE) % CYCLE;
const index = Math.min(SHOTS.length - 1, Math.floor(c / SHOT));
const shot = SHOTS[index];
const k = smoothstep((c - index * SHOT) / (SHOT * 0.9));
frame.zoom = shot.zoom - shot.push * k;
```

**Gate close shots to landscape.** A tight frame that reads at 16:9 crops badly at 1:1 or
portrait, where the fit is already width-bound. `const wide = aspect >= 1.25;` and fall
back to the authored fit below it.

## 2. Timing Arithmetic

The loop is `shots x shotLength`. Each statement runs one shared keyframe pass whose beat
lives in the first `1/shots` of it, offset by the shot's index:

```css
.scene { --shot-length: 2s; --duration: 6s; }
.scene__line {
  animation-duration: var(--duration);
  animation-delay: calc(
    (var(--shot) * var(--shot-length))     /* set inline per shot: 0, 1, 2 */
    + (var(--line) * 0.08s)                /* the line stagger inside a shot */
  );
  animation-fill-mode: both;
}
```

With `--shot-length: 0s` as the default on the host, a one-statement composition resolves
to exactly its old delay — which is how this pattern lands in a shared component without
touching the pieces that were never cut.

**Clear the copy before the cut.** In a 6s pass carrying a 2s beat: in by 10% (0.6s),
hold to 25% (1.5s), gone by 30% (1.8s). The last line's stagger must still finish before
`shotLength`. A statement caught by its own cut reads as a glitch, not an edit.

**The loop reset hides behind the cut.** Any state the scene rebuilds each cycle — a plot
drawing on, a counter running up — can snap back to zero at the loop point with no wipe
or fade, because the camera cuts at that same instant. Do not add an erase pass; it only
draws attention to the seam.

## 3. Aim at Things, Not Coordinates

Resolve `focus` from the scene at runtime:

```js
screen: screenMesh.getWorldPosition(new THREE.Vector3()),
keys:   root.localToWorld(centroidOf(LIT_KEYS)),          // the keys that actually light
```

Then re-centre the frustum on it in camera space, keeping the authored bias:

```js
camera.updateMatrixWorld();
const f = focusWorld.clone().applyMatrix4(camera.matrixWorldInverse);
camera.left = f.x - hw * (1 - biasX);  camera.right  = f.x + hw * (1 + biasX);
camera.top  = f.y + hh * (1 - biasY);  camera.bottom = f.y - hh * (1 + biasY);
```

Aiming at the object survives everything that would break a hard-coded position: a pointer
orbit, an idle drift, a resize, a change to the scene's own layout. Aim at the part that
*animates* — the lit keys, not the keyboard's bounding box — or the shot frames dead
geometry while the motion happens off-screen.

## 4. Grading Shots to Different Light (optional)

Shots can differ by angle alone, and often should — ask before adding light to a piece
that was only asked to move. When shots *do* differ by hour or by mode, grade what the
scene **already draws** — do not build a second render path. Three separate multipliers, because one lift on everything
flattens the picture:

| uniform | applies to | why separate |
| --- | --- | --- |
| `ink` | solid faces, prop haze | the machine's body |
| `edge` | hairline strokes | the drawing itself; it has to stay legible at every hour |
| `sky` + `lift` | the ground plate | **only the plate takes the additive lift** — that is the room's own light |

Lifting every surface together destroys the contrast that carries the artwork. Lifting
only the plate produces the daylight read for free: the plate rises past the machine and
the machine becomes a silhouette with its edges still drawn. That *is* light mode, and it
falls out of one uniform rather than an inversion.

**Leave self-luminous elements ungraded** — a screen, lit keys, an LED. Ungraded, they
read as the light source and stay constant through the night. Graded, they stop being
lights and become painted surfaces.

**Every uniform must be declared in the shader that uses it.** Adding it to a shared
uniforms object is only half the job: GLSL needs `uniform vec3 gradeEdge;` in that
fragment shader too, or the program fails to compile and the material renders **nothing**.
The symptom is one class of element silently vanishing — every hairline in the scene
disappearing while the solids grade correctly. Read the browser console; the error names
the undeclared identifier and the line.

## 5. Prove the Statement Is Clear — Do Not Eyeball It

This is the part that gets skipped and the part that matters. Use the Codex in-app
browser at the exact delivery viewport. Inspect each shot with copy hidden to map the
subject silhouette and open space, then restore the copy and measure each line's glyph
rectangle:

```js
const range = document.createRange()
range.selectNodeContents(line)
const glyphBox = range.getBoundingClientRect()
```

Capture the subject-only frame and compare every glyph rectangle plus its keep-clear
padding against visible subject pixels. Record the viewport, sample time, glyph box,
and result for each statement. A useful result log is:

```text
shot 1 @1.82s  "The line kept"  1095,56 438x105  CLEAR
shot 3 @5.17s  "Final statement"  951,698 582x121  CLEAR
```

Three details make the difference between a real check and a useless one:

- **Measure the glyph box, not the element box.** Right-aligned copy in a `min(46vw, …)`
  block leaves the element two or three times wider than the text. Use
  `range.selectNodeContents(line).getBoundingClientRect()`. Measuring the block reported
  a large false overlap for a line that was in fact clear.
- **Sample early *and* late in each shot.** The push-in grows the subject through the
  shot; a placement that clears at the cut can collide by the hold.
- **Measure deviation from the plate, not brightness.** A daylight-graded shot puts a
  dark machine on a light ground; an absolute-luma threshold then flags the empty
  background as the subject and reports thousands of false hits. Both tools take the
  median of the region as the plate and count pixels that differ from it, so either
  polarity reads the same.

**Assert the viewport before trusting a number.** These type scales are container-driven,
so a stale viewport silently measures a different design. Assert `window.innerWidth`
and `window.innerHeight` before recording any result.

Run it at the delivery size and at the smallest surface the piece appears on — a catalog
card at 720x405 has its own type scale and its own answer.

## 6. Where the Statement Goes

**Follow the air, not a house corner.** A tight shot may leave only the top-right. Forcing
all three statements into one corner for consistency is how you get overlap — and the eye
moving between corners is an asset in a cut sequence, not a defect.

When a statement does not fit, work in this order:

1. **Move it** to the largest clear region the subject-only frame shows.
2. **Push the subject** with that shot's `biasX`/`biasY`. Cheap, and it usually improves
   the composition anyway.
3. **Widen the shot** — a slightly looser zoom frees a lot of edge.
4. **Shrink the type.** Last. The statement is the piece.

Two placement traps:

- **Reduced motion pins every line visible.** A shared `@media (prefers-reduced-motion)`
  rule that sets `opacity: 1; animation: none` will print all N stacked statements at
  once. Collapse to the closing one:
  `.scene__shot:not(:last-child) { display: none; }`
- **A `@container` rule loses to a later `@media` rule.** `@container` adds no
  specificity, so a shared viewport-width rule declared after your sheet wins the tie and
  sets page-scale type inside a card. Carry an extra class the element already has
  (`.host.scene[data-variant="x"] .scene__line`) to out-specify it. Symptom: the compact
  layout applies its position but not its `font-size`; `getComputedStyle().fontSize`
  settles it in one call.

## 7. Recording the Sequence

Use `record-natural-preview-videos` for capture and encoding. Drive the scene through
the Codex in-app browser and keep the scene clock and CSS-statement clock on the same
deterministic timeline.

The silent failure is clock drift: frame zero can look correct while later statements
belong to the previous or next camera shot. Inspect frames from the middle and end of
the take, not only the poster. If the scene lives in an iframe, verify the host's seek
message reaches that frame before recording.

## Checklist

- [ ] Shot list is data; every close shot names a thing, not a coordinate.
- [ ] Angles offset the authored orbit rather than replacing it.
- [ ] If graded: solids, hairlines and the plate move on separate multipliers, only the
      plate takes the lift, self-luminous elements stay ungraded, and the console is
      clean of shader-compile errors. If not graded, no grade machinery is left behind.
- [ ] The variant's name and copy describe what the shots actually do.
- [ ] Close shots gated to landscape; the authored fit survives below 1.25 aspect.
- [ ] Each statement is in and gone before its own cut, stagger included.
- [ ] No erase pass at the loop point — the cut hides it.
- [ ] Subject-only frames and measured glyph boxes prove every statement clear at the
      delivery size **and** the smallest surface.
- [ ] Reduced motion resolves to one statement, not N stacked.
- [ ] Recorded take verified mid-loop and at the end, not only at frame 0.
