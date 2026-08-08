# Pointer Trail Emitter Demo Prompts

## Minimal prompt

```text
Use $pointer-trail-emitter to add a mote trail to this hero that emits by distance travelled, so the spacing holds whether the hand crawls or flicks.
```

## Recreate the demo

Use `$pointer-trail-emitter` to build **Wisps** as a focused local demo. Treat `index.html` as the visual, motion, responsive, accessibility, and performance reference.

### Experience

- Use a solid, neutral dark field with no background image. The trail is the only visual mechanism under study.
- Title the page **Wisps**. Put the verified effect stack — **Vanilla JavaScript · Canvas 2D** — directly above it, then state plainly that CSS styles the interface only and that the effect uses no shaders, WebGL, Three.js, or runtime dependencies.
- Keep the implementation explanation at the top-left and a compact control panel at the bottom-right. Preserve as much open field as possible for drawing.
- Make every range control full-width with a visible filled track, a generous thumb, a live numeric value, and labelled endpoints.
- **The mechanism is legible before anyone touches anything.** On load the field traces its own path — a slow arc, then a fast one — and under distance emission both stretches carry identical spacing, which is the point. Any pointer or key input takes over immediately.
- An emission toggle switches between distance and a timer. Under the timer the same gesture breaks apart: a fast pass scatters the line into dots, a resting hand piles motes on one spot.
- Spacing, scatter, and coast change the drift live and prove the system is parameterised rather than baked.

### Implementation contract

- One `<canvas>` for the live trail. Draw the mote once at boot and cache it.
- Keep the demo local, dependency-free, and free of background image assets.
- Accumulate distance and spend it in fixed steps so spacing along the path is constant. Place each mote at the distance along the segment it is owed, and cap the spawn loop against a teleporting pointer.
- Take the ring-buffer slot before advancing the index.
- Damp the emitter toward the pointer rather than pinning it.
- Express scatter as a fraction of the field extent, never as an absolute pixel value.
- Let motes coast; damping matters more than launch velocity. Add a slow curl and a small constant rise.
- Emit rarely from a resting emitter — distance emission means a still hand emits nothing at all — without letting it grow a column.
- Clamp `dt`, cap DPR at 2, pause on `document.hidden`, and reset the time base on resume.
- Size from a `ResizeObserver` on the root element and guard against a zero viewport.
- Under `prefers-reduced-motion: reduce`, compose one still frame with the whole ribbon laid across it. Do not hide the trail. Redraw it when a control changes.
- Controls are real form elements, keyboard reachable, with visible focus and a live region announcing changes.
- Support 390px through 1440px. Keep the console clean.

### Restrictions

- No third-party CSS or JS.
- No remote assets, third-party imagery, background images, data-URI artwork, or SVG sprites.
- **Nothing may depend on the pointer.** The field must be fully drivable from the keyboard, and must behave on a touch device without parking a stationary emitter.

## Remix prompt

```text
Use $pointer-trail-emitter to rebuild this as warm forge sparks over a light paper page: an off-white ground, dark serif type, and orange-to-ash embers that fall rather than rise. Shorten the life so the trail reads as sparks instead of drift, and invert the buoyancy. Keep the distance-based emission, the sub-segment placement, the ring-buffer ordering, the extent-relative scatter, the coast damping, the idle breath, the keyboard path, the reduced-motion still frame, and the dt and DPR budgets exactly as they are. Change only the subject, palette, type, and direction of travel.
```
