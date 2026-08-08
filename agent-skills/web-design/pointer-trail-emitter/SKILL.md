---
name: pointer-trail-emitter
description: Build a cursor trail whose spacing stays constant at any hand speed, by emitting motes per unit of distance travelled rather than on a timer, so a flick draws the same continuous ribbon as a crawl instead of breaking into scattered dots. Covers sub-segment placement, the ring-buffer ordering trap, the idle breath a distance emitter needs, anchoring the trail to the screen in a 3-D scene, scaling scatter against the plane it hangs on, coasting instead of stopping dead, touch and reduced-motion fallbacks, and why moving the emitter to a DOM overlay to raise its z-index costs more than it buys. Use for cursor wisps, pointer sparks, embers, magic trails, comet tails, plankton, dust, or any mote trail that must stay legible however fast the hand moves.
---

# Pointer Trail Emitter

Build the emitter yourself when the trail's density has to respond to how fast the hand is moving.

Reach for `add-shader-cursor-trail` or `shaders-cursor-ripples` when you want the packaged WebGPU looks from the Shaders library. Reach for `reveal-hover-effect` when the cursor exposes a second image through a mask. Reach for `ambient-section-particles` when motes fill a section and the pointer only disturbs them. Reach for this when the pointer *lays* them.

Extracted from a dark WebGL night scene where the trail had to stay readable over type and never pull attention from the set behind it.

## Emit by distance, not by time

This is the whole mechanism. Accumulate the distance the emitter has moved and spend it in fixed steps:

```js
E.acc += moved;
let guard = 0;
while (E.acc >= STEP && guard++ < 14) {
  E.acc -= STEP;
  spawn(/* … */);
}
```

Spacing along the path is then `STEP`, whatever the hand is doing, so the trail reads as one continuous ribbon at a crawl and at a flick alike.

Tie emission to a timer instead and spacing becomes proportional to speed — the pointer covers `speed × interval` between spawns. **A flick breaks the line into scattered dots, and a resting hand piles every mote on one spot.** That is the failure this prevents, and it is worth building the toggle to see it once.

Measured over one fixed path: distance emission laid 1885 motes slowly and 1738 quickly, a 1.08× spread — the count follows the path. The same two sweeps on a timer laid 2537 and 1545, a 1.64× spread — the count follows the clock.

Cap the loop. A window blur, a tab restore, or a teleporting pointer can hand you a single enormous `moved`, and without the guard that one frame spawns thousands of motes and stalls.

## Place each mote where it is owed

Spawning every mote of a frame at the pointer's current position clumps them at one end of the segment. A flick then reads as a blob with a gap behind it. Lay each at its own distance along the segment:

```js
const t = moved > 1e-6 ? Math.min(1, guard * STEP / moved) : 0;
spawn(E.lx + dx * t, E.ly + dy * t, ang);
```

## Take the ring-buffer slot before advancing it

```js
const i = E.i; E.i = (i + 1) % N;   // correct
```

Advancing first writes the position into the next slot and the life into this one, so **every mote appears where the previous one started.** Dense trails hide it; sparse ones show it on every spawn. Symptom to recognise: motes that look one step behind the cursor and pop rather than fade in.

## Lag the emitter behind the pointer

Damp the emitter toward the pointer instead of pinning it:

```js
E.x = damp(E.x, px, 16, dt);
```

A rigidly pinned emitter makes a fast flick look like the trail is welded to the cursor. The lag is what gives the drift its slack.

## Anchor the trail to the screen, not the world

For an in-scene 3-D trail, parent the points to the **camera** and work in camera space. Map the pointer through the frustum's own half-height:

```js
const hh = Math.tan(camera.fov * Math.PI / 360) * D;
const x = nx * hh * camera.aspect, y = ny * hh;
```

Unprojecting to a world plane instead pins the trail to the set: the moment the rig drifts or parallaxes, the trail swims across the screen rather than staying under the hand.

Use quads or points that ignore depth (`depthTest:false`, `depthWrite:false`) and give them their own render order. If the scene has secondary passes — a mirror, a reflection probe — put the trail on its own layer so it never appears in them.

## Scale the scatter against the plane it hangs on

Spread is meaningless as an absolute. At a distance of 3.4 units with a 36° camera, the plane the trail hangs on is only about **2.2 units tall** — so ±0.03 units of jitter is a thread stitched to the cursor, not a drift.

Compute the plane extent, then express scatter as a fraction of it. The same number that reads as a soft cloud on one camera is a hard line on another.

## Let them coast

Damping matters more than initial velocity. At `1 - 1.1 * dt` every mote stops within a tenth of a unit of where it spawned and the trail never opens out; halve it and the scatter carries.

Add a slow curl so the drift frays instead of blowing along one straight line, and a small constant rise so it behaves like something buoyant rather than something thrown.

## Drop what round motes do not need

A round sprite has no orientation. Remove the per-particle angle attribute and the rotated `gl_PointCoord` lookup entirely rather than leaving them at zero — that is one attribute, one upload, and several instructions per fragment for a rotation nobody can see.

Keep the motes small: a few pixels of core inside a faint halo. Small sprites are what let the count go up without paying the additive fill a screenful of large ones costs.

## Keep a breath when the hand is still

Distance emission means a stationary pointer travels nothing and therefore emits nothing — the trail dies under a resting hand. So add a slow idle emission on a timer purely for that case.

**Rarely** is the operative word: one every ~0.4s. Emit often from a stationary pointer and it grows a permanent column of smoke up the middle of the frame — which is the timer failure the mechanism exists to avoid, reintroduced by hand.

## Numbers

Tuned on a trail hanging 3.4 units from a 36° camera, on a plane ≈2.2 units tall. Scale the spatial values by your own plane extent.

| parameter | value | note |
| --- | --- | --- |
| emission step | 0.030 units | distance between spawns |
| spawns per frame cap | 14 | the teleport guard |
| emitter damping | `damp(…, 16, dt)` | the lag behind the pointer |
| scatter | ±0.30 units | ≈13% of the plane height |
| depth jitter | ±0.45 units | breaks the flat sheet |
| life | 1.45–2.75 s | idle motes 2.1–3.4 s |
| launch velocity | −0.09 along travel, ±0.19 lateral | against the direction of motion |
| coast damping | `1 − 0.5 * dt` | halved from 1.1; see above |
| buoyancy | +0.022 · dt | |
| curl | `sin(t·1.3 + φ)·0.17`, `cos(t·1.1 + 1.7φ)·0.14` | per-mote phase φ |
| size | 0.018–0.050, ×(1 + 0.55u) | a mote softens, it does not swell |
| opacity | in over u 0–0.12, out over 0.22–1, ×0.9 | |
| count | 190 desktop, 90 on a low tier | |
| idle emission | every 0.42 s | |

## Do not move it to a DOM overlay to raise its z-index

Nothing inside the WebGL canvas can rise above the page — the canvas is one element at its own stacking tier — so a 2-D overlay canvas looks like the only way to get the layer. It is, and it still is not worth it.

The port costs the post chain: the motes come out as hard points with no bloom, and a wider fainter second copy is not the same thing. Every constant also has to be converted rather than re-picked — `px_per_unit = (innerHeight / 2) / (tan(fov / 2) * D)`, sprite diameter `innerHeight * size / D` — and rebuilding the look by eye instead of translating it produces a different effect that has to be re-approved.

If the layer is genuinely required, port it as a pure translation and diff the frames against the old build before showing anyone.

## State the cost from a profile

The per-mote update is free. A CPU profile of a 190-mote trail showed the update at **0.00% of samples** — below the profiler's sampling floor. The cost is entirely additive fill, so the levers are sprite size and count, in that order.

Measure before reporting a regression. A frame-time comparison on this trail once showed a 20–30% p90 rise that turned out to be noise: three runs of *identical* code gave 226 / 374 / 243 ms. Run it more than once before you believe it.

## Lifecycle and reduced motion

- Gate on `matchMedia('(hover: none)')`. On touch there is no hover position to follow; park the emitter or drive it from `pointermove` during a drag only, or a stationary emitter grows a permanent plume.
- Under `prefers-reduced-motion: reduce`, render a **designed still frame** — a composed trail already laid across the frame — rather than hiding it. Keep controls live so they redraw that frame.
- Pause on `document.hidden`, reset the time base on resume, clamp `dt` to ≈1/30 s, and cap DPR at 2.
- Nothing may depend on the pointer alone. Give the emitter a keyboard path so the effect is complete and operable without a mouse.

## Verify

- [ ] Spacing along the path is constant; a flick and a crawl draw the same ribbon
- [ ] Measured, not assumed: mote count over a fixed path barely moves with speed
- [ ] A flick lays motes along the whole segment, not clumped at one end
- [ ] Ring-buffer slot is taken before the index advances
- [ ] 3-D: parented to the camera, and the trail stays under the hand while the rig drifts
- [ ] Scatter is expressed against the plane extent, not as an absolute
- [ ] Motes coast rather than stopping within a fraction of their spawn point
- [ ] A stationary pointer keeps an aura without growing a column
- [ ] No per-particle angle attribute on round sprites
- [ ] Spawn loop is capped against a teleporting pointer
- [ ] Operable from the keyboard; touch path does not plume
- [ ] Reduced motion renders a designed still, not a hidden layer
- [ ] Cost claims came from a profile, and any regression was re-run before it was reported
