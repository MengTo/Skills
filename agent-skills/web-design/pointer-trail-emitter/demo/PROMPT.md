# Pointer Trail Emitter Demo Prompts

## Minimal prompt

```text
Use $pointer-trail-emitter to add a mote trail to this hero that emits by distance travelled, so the spacing holds whether the hand crawls or flicks.
```

## Recreate the demo

Use `$pointer-trail-emitter` to build **Rinkō — The Wisp Trail** as a single standalone HTML document. Treat `index.html` as the visual, motion, responsive, accessibility, and performance reference.

### Experience

- One full-viewport night valley: near-black sky under a low blood moon, a wooded ridge closing the bottom of the frame, and a trail of cold pale motes shed by the pointer.
- The trail is the subject. Moon, sky, ridge, and type are staging and must stay quiet enough to read over.
- **The page explains itself.** The headline states the mechanism and the body names the failure it prevents, so a reader who never sees the skill still learns the technique from the demo alone.
- **The mechanism is legible before anyone touches anything.** On load the field traces its own path — a slow arc, then a fast one — and under distance emission both stretches carry identical spacing, which is the point. Any pointer or key input takes over immediately.
- An emission toggle switches between distance and a timer. Under the timer the same gesture breaks apart: a fast pass scatters the line into dots, a resting hand piles motes on one spot.
- Spacing, scatter, and coast change the drift live and prove the system is parameterised rather than baked.

### Implementation contract

- One `<canvas>` for the trail, one self-contained file. No sprite images, no external assets, no libraries; draw the mote once at boot and cache it.
- **Generate the staging in code.** The sky, the moon and the ridge are procedural — a value-noise field, a lunar disc with real maria, ray systems and a foreshortened crater field, and an fBm crest with conifer spikes. No image files.
- Accumulate distance and spend it in fixed steps so spacing along the path is constant. Place each mote at the distance along the segment it is owed, and cap the spawn loop against a teleporting pointer.
- Take the ring-buffer slot before advancing the index.
- Damp the emitter toward the pointer rather than pinning it.
- Express scatter as a fraction of the field extent, never as an absolute pixel value.
- Let motes coast; damping matters more than launch velocity. Add a slow curl and a small constant rise.
- Emit rarely from a resting emitter — distance emission means a still hand emits nothing at all — without letting it grow a column.
- Clamp `dt`, cap DPR at 2, pause on `document.hidden`, and reset the time base on resume.
- Size from a `ResizeObserver` on the root element, guard against a zero viewport, and give any generated background an explicit CSS size or it paints at its intrinsic pixel dimensions and leaves a hard seam.
- Under `prefers-reduced-motion: reduce`, compose one still frame with the whole ribbon laid across it. Do not hide the trail. Redraw it when a control changes.
- Controls are real form elements, keyboard reachable, with visible focus and a live region announcing changes.
- Support 390px through 1440px. Keep the console clean.

### Restrictions

- No third-party CSS or JS.
- No `<img>`, no data-URI artwork, no SVG sprites.
- **Nothing may depend on the pointer.** The field must be fully drivable from the keyboard, and must behave on a touch device without parking a stationary emitter.

## Remix prompt

```text
Use $pointer-trail-emitter to rebuild this as warm forge sparks over a light paper page: an off-white ground, dark serif type, and orange-to-ash embers that fall rather than rise. Shorten the life so the trail reads as sparks instead of drift, and invert the buoyancy. Keep the distance-based emission, the sub-segment placement, the ring-buffer ordering, the extent-relative scatter, the coast damping, the idle breath, the keyboard path, the reduced-motion still frame, and the dt and DPR budgets exactly as they are. Change only the subject, palette, type, and direction of travel.
```
