---
name: add-mouse-driven-orbit
description: Add restrained mouse-driven orbit and parallax depth to a Three.js hero by damping one pointer target and splitting it across camera translation, look-at, and small object rotations. Use for passive cinematic 3D heroes, pointer-responsive scenes, organic model parallax, and interactive depth where OrbitControls would feel like a product viewer.
---

# Add Mouse-Driven Orbit

Turn one damped pointer target into a shallow camera arc and smaller object rotations. Reach for `threejs` with `OrbitControls` when the user must inspect a product directly; reach for `build-game-camera-controls` for drag, zoom, occlusion, or gameplay cameras. This Skill is passive cinematic depth, not direct manipulation.

Extracted from `inner-green-3d.html`, where a procedural moss root had to turn toward the pointer without sliding away from the headline, cards, and pinned silhouette landmarks.

## Record intent, not layout

In the pointer handler, write normalized coordinates only:

```js
function recordPointer(event) {
  if (event.pointerType === "touch") return;
  target.x = (event.clientX / viewport.width) * 2 - 1;
  target.y = (event.clientY / viewport.height) * 2 - 1;
}
```

Cache the interactive rectangle from `ResizeObserver`. Do not call `getBoundingClientRect()` for every layer on every `pointermove`; synchronous layout turns a light effect into frame spikes.

On `pointerleave`, set the target back to `0, 0`. On coarse pointers, keep the authored center pose. Passive orbit should never require touch dragging to reveal content.

## Dampen in the frame loop

The source uses 0.055 per 60 Hz frame. Preserve that feel across refresh rates:

```js
const alpha = 1 - Math.pow(1 - 0.055, dt * 60);
smooth.x += (target.x - smooth.x) * alpha;
smooth.y += (target.y - smooth.y) * alpha;
```

Clamp `dt` to 1/30 s and reset the time base after resume. A fixed per-frame lerp feels heavy at 30 Hz and twitchy at 120 Hz; an unclamped delta jumps after backgrounding.

Stop style or uniform writes once the rounded value settles. Three decimals are finer than one pixel of the landed travel:

```js
const x = Math.round(smooth.x * 1000) / 1000;
const y = Math.round(smooth.y * 1000) / 1000;
if (x !== lastX || y !== lastY) publish(x, y);
```

## Split the motion

Use opposing, unequal layers so the scene pivots rather than translates as one slab:

```js
camera.position.x = -smooth.x * 26;
camera.position.y =  smooth.y * 16;
camera.lookAt(camera.position.x * 0.42, camera.position.y * 0.42, 0);

nearGroup.rotation.y = smooth.x * 0.055;
nearGroup.rotation.x = smooth.y * 0.026;
farGroup.rotation.y  = smooth.x * 0.030;
```

Treat these as the landed values for a scene framed in stage-pixel world units:

| layer | horizontal | vertical | reason |
| --- | ---: | ---: | --- |
| camera translation | -26 | +16 | establishes the shallow arc |
| camera look-at carry | 42% | 42% | keeps the subject near its pinned composition |
| near object yaw | 0.055 rad | — | exposes surface depth without showing its flank |
| near object pitch | — | 0.026 rad | prevents the top surface from flattening |
| far object yaw | 0.030 rad | — | separates planes without matching the foreground |

Do not rotate everything by the same amount. Equal movement reads as a flat poster following the cursor. Do not aim the camera at the fixed origin while translating it; the subject visibly slides away from the layout.

Apply CSS parallax from the same `smooth` pair, but give text and controls smaller depth coefficients than the 3D form. Keep transforms free for parallax; use clip, opacity, or child wrappers for unrelated reveals so animations do not overwrite each other.

## Preserve framing across sizes

Build the center pose first at every breakpoint. Recalculate camera aspect and any stage-to-world scale from a `ResizeObserver`, guard zero-sized roots, then apply orbit offsets. Verify both extreme pointer corners: no copy collision, card clipping, or exposed empty edge.

Use keyboard-operable X and Y range controls in a demo or configurator. They prove the orbit is parameterised and give non-pointer users access to the same authored states. Keep focus visible and announce motion-mode changes.

## Respect motion and lifecycle

- Under `prefers-reduced-motion: reduce`, render a designed three-quarter still at approximately `x=.28, y=-.12`; keep the range controls live and redraw their selected still without interpolation.
- Pause while hidden or offscreen and resume with a reset time base.
- Cap DPR at 2 and clamp `dt` to 1/30 s.
- Keep the canvas decorative unless the 3D object carries information. Preserve all labels and controls in semantic HTML.
- On teardown, cancel the frame, disconnect observers, remove pointer/media listeners, and dispose Three.js resources.

## State the cost honestly

The orbit math is negligible. The expensive work is the scene already being redrawn and any DOM style invalidation layered on top. Share one frame loop, round settled values, avoid layout reads in pointer handlers, and profile the underlying draw before removing the interaction. Moving the camera does not make a dense scene cheaper.

## Verify

- Compare center and four-corner poses with the source at 1440×900.
- Confirm camera and objects move by different, opposing amounts.
- Move quickly across the viewport; the scene must ease through the path, not snap.
- Leave the viewport; confirm a smooth return to center.
- Test 390×844 and coarse/touch input; center composition remains complete.
- Tab through X/Y controls, change them with arrow keys, and confirm visible focus.
- Test `?reduced=1`: stable designed still, no autonomous easing, live controls.
- Hide/show and scroll away/back; confirm no jump and only one frame loop.
- Confirm a clean console at both sizes.

Use [demo/index.html](demo/index.html) as the working proof and [demo/PROMPT.md](demo/PROMPT.md) to recreate or remix it.
