---
name: build-wireframe-scan-reveal
description: Reveal Three.js geometry with an expanding world-space scan whose wire cage leads the solid surface, then burns away. Use for wireframe scanning, radial mesh reveals, survey pulses, holographic assembly, topology intros, and 3D model entrances where a plain opacity wipe does not explain the form.
---

# Build a Wireframe Scan Reveal

Make one world-space wavefront conduct both representations: draw topology at the front, hold the solid behind it, then remove the temporary cage. Reach for `technical-wireframe-info-layout` when wireframe is the page's permanent visual language; reach for `animation-on-scroll` when the conductor is DOM scroll rather than a 3D wave.

Extracted from `inner-green-3d.html`, where a survey pulse had to grow a procedural moss root through cards and type without reading as a circular mask.

## Pair two representations

Create the solid mesh and a temporary `LineSegments` cage from the same source geometry. Share `uScanOrigin`, `uScanRadius`, and time between their materials. Keep both in world space; local-space distance changes when a group is scaled or nested and tears the two fronts apart.

Discard the solid beyond the front, with a lag that leaves the cage visible first:

```glsl
uniform vec3 uScanOrigin;
uniform float uScanRadius;
uniform float uScanEnabled;

bool unscanned(vec3 worldPosition, float lag) {
  if (uScanEnabled < 0.5) return false;
  float wobble =
      sin(worldPosition.y * 0.011 + worldPosition.x * 0.007) * 36.0
    + sin(worldPosition.z * 0.021 + worldPosition.y * 0.013) * 17.0;
  return distance(worldPosition, uScanOrigin)
       > uScanRadius - lag + wobble;
}

// In the solid fragment shader:
if (unscanned(vWorldPosition, 520.0)) discard;
```

Use one origin outside the silhouette, usually low and left. A centered origin reads as a loading ring. Keep the two long sine terms; a perfectly circular front reads as a clip-path, while high-frequency noise makes the edge sparkle.

## Make the cage ride the front

Measure each line fragment against the same radius:

```glsl
float distanceFromOrigin = distance(vWorldPosition, uScanOrigin);
float rim = exp(-pow((distanceFromOrigin - uScanRadius) / 135.0, 2.0));
float trail = smoothstep(uScanRadius, uScanRadius - 950.0, distanceFromOrigin);
float alpha = (rim * 1.60 + trail * 0.34) * uWireOpacity;
```

Use additive blending, `transparent: true`, `depthWrite: false`, and a pale version of the scene accent. Keep depth testing on unless the cage must read through the object. Turning depth test off exposes the back half of dense topology and produces a bright unreadable ball.

## Animate one conductor

Use the landed timing as a starting point:

| parameter | default | failure prevented |
| --- | ---: | --- |
| duration | 3.4 s | a fast reveal reads as a flash |
| radius easing | `1 - (1 - t)^1.35` | linear travel stalls visually near the far corner |
| solid lag | 520 world units | zero lag makes wire and fill arrive as one wipe |
| rim width | 135 units | a narrow rim aliases; a wide rim becomes fog |
| wire trail | 950 units | no trail hides topology before it can be read |
| wire fade | `smoothstep(.72, 1, t)` | persistent cage competes with the finished surface |
| radius reach | scene diagonal × 1.3 + 900 | the far corner remains clipped after completion |

Snap the cage on over the first 6% of the timeline, then fade it during the final 28%:

```js
const e = Math.min(1, elapsed / 3.4);
scanRadius.value = easeOutPow(e) * maxRadius;
wireOpacity.value = Math.min(1, e / 0.06) * (1 - smoothstep(0.72, 1, e));
```

At completion, disable the discard branch, remove the cage, and dispose its geometry and material. Hiding it with opacity leaves duplicate geometry and shader work alive for the rest of the page.

## Stage and size the scan

Resolve `maxRadius` after layout and after parent matrices update. Use a `ResizeObserver`, guard zero-sized roots, update the camera projection, then recompute the origin and farthest reach. A one-time measurement before fonts or layout settle leaves the last corner unrevealed.

Keep the demo's scene recognisable: grey-green field, bottom light pool, white editorial type, pale cards, and the root-shaped form. The staging belongs in the demo; the reusable skill is only the paired representations and shared conductor.

## Respect motion and lifecycle

- Under `prefers-reduced-motion: reduce`, render a designed diagnostic still at about 62% radius with both cage and solid visible. Let the replay control recompose that still and announce the state; do not hide the scene.
- Clamp `dt` to 1/30 s. Reset the time base after a hidden tab or offscreen section resumes.
- Pause on `document.hidden` and when an `IntersectionObserver` says the section is offscreen.
- Cap device pixel ratio at 2.
- Expose replay as a real button with visible focus and an `aria-live` status. Keep the canvas `aria-hidden` when it is decorative.
- On teardown, cancel the frame, disconnect observers, remove listeners, and dispose geometry, materials, textures, and the renderer.

## State the cost honestly

The temporary second representation and its line coverage are the real cost. Topology density and overdraw matter more than the radius math. Build the wire cage only for the entrance, use the coarsest edge graph that preserves the silhouette, and dispose it as soon as the scan finishes. Do not claim a performance gain without profiling GPU frame time before and during the cage pass.

## Verify

- Compare the opening, midpoint, and completed states with the source at 1440×900.
- Confirm the cage leads the solid everywhere, including scaled child groups.
- Fast-forward across completion and verify no clipped islands remain.
- Replay twice and confirm only one frame loop and one cage survive.
- Resize during the scan at 390×844 and 1440×900.
- Tab to replay and confirm visible focus and a live status update.
- Test `?reduced=1` or system reduced motion: composed still, no advancing radius.
- Hide/show the tab and leave/re-enter the viewport; confirm no time jump.
- Confirm a clean console and disposed cage resources after completion.

Use [demo/index.html](demo/index.html) as the working proof and [demo/PROMPT.md](demo/PROMPT.md) to recreate or remix it.
