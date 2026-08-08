# Pointer Trail Emitter Demo Prompts

## Minimal prompt

```text
Use $pointer-trail-emitter to add a mote trail to this hero that emits by distance travelled, so the spacing holds whether the hand crawls or flicks.
```

## Recreate the demo

Use `$pointer-trail-emitter` to build **Kage — Cursor Wisps** as a focused local demo. Treat `index.html`, `reference-kage.webp`, and `reference-kage-mobile.webp` as the visual, motion, responsive, accessibility, and performance reference.

### Experience

- Reproduce the Kage hero frame: red moon behind the temple, left-aligned chapter copy, oversized KAGE letters across the foreground, vertical Japanese type, foliage and grass at the bottom, muted sage-white type, vermilion accents, and dense film grain.
- The reference staging stays exact and quiet. The cursor trail is the only mechanism under study.
- Preserve Kage's layout-defining headline and hierarchy. Explain the mechanism inside the compact Kage-styled WISP panel rather than replacing the hero copy.
- **The mechanism is legible before anyone touches anything.** On load the field traces its own path — a slow arc, then a fast one — and under distance emission both stretches carry identical spacing, which is the point. Any pointer or key input takes over immediately.
- An emission toggle switches between distance and a timer. Under the timer the same gesture breaks apart: a fast pass scatters the line into dots, a resting hand piles motes on one spot.
- Spacing, scatter, and coast change the drift live and prove the system is parameterised rather than baked.

### Implementation contract

- One `<canvas>` for the live trail. Draw the mote once at boot and cache it.
- Use the two bundled, owned Kage reference frames for staging. Desktop and mobile get deliberate crops; never stretch one frame across both. Keep the demo local and dependency-free.
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
- No remote assets, third-party imagery, data-URI artwork, or SVG sprites. The two owned local Kage frames are the only image dependencies.
- **Nothing may depend on the pointer.** The field must be fully drivable from the keyboard, and must behave on a touch device without parking a stationary emitter.

## Remix prompt

```text
Use $pointer-trail-emitter to rebuild this as warm forge sparks over a light paper page: an off-white ground, dark serif type, and orange-to-ash embers that fall rather than rise. Shorten the life so the trail reads as sparks instead of drift, and invert the buoyancy. Keep the distance-based emission, the sub-segment placement, the ring-buffer ordering, the extent-relative scatter, the coast damping, the idle breath, the keyboard path, the reduced-motion still frame, and the dt and DPR budgets exactly as they are. Change only the subject, palette, type, and direction of travel.
```
