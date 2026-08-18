---
name: build-interactive-particle-trail
description: Build a cursor or touch particle interaction that emits by distance along the traveled segment into a recycled GPU point pool, with optional keyboard-triggered bursts. Use for interactive particle trails, pollen lifted from a surface, dust disturbed by a pointer, hover particle bursts, and discrete motes whose spacing must stay consistent at different gesture speeds.
---

# Build an Interactive Particle Trail

Emit discrete motes per unit of pointer travel, spread them across the entire segment, and recycle a fixed GPU pool. Reach for `ambient-section-particles` when particles are primarily autonomous atmosphere; reach for `add-shader-cursor-trail` when the output should be a continuous fluid or shader ribbon. Use this Skill when individual grains must react to the gesture.

Extracted from `inner-green-3d.html`, where a pointer had to lift pollen off a procedural moss root without a fast sweep leaving gaps or a resting cursor pumping a bright clump.

## Resolve the interaction plane

Convert the pointer into normalized device coordinates, raycast from the camera, and intersect one stable plane near the visual surface. Reuse that hit for all interaction systems.

Reset the previous hit when the pointer leaves or the ray misses. Otherwise re-entry draws a long diagonal from the stale exit point.

For a curved visible surface, either intersect the real collider or place the response plane just in front of it. Do not raycast every decorative blade or particle.

## Emit by distance

Spacing, not time, is the mechanism:

```js
const distance = current.distanceTo(previous);
const count = Math.min(14, Math.floor(distance / 7));

for (let i = 1; i <= count; i++) {
  point.lerpVectors(previous, current, i / count);
  spawn(point);
}

if (count) {
  previous.copy(current);
  idle = 0;
} else if ((idle += dt) > 0.055) {
  spawn(current);       // a resting hand trickles; it does not pump
  idle = 0;
}
```

A timer emitter leaves dots behind a fast flick and piles them under a resting hand. Segment interpolation fixes both. Cap each frame at 14 emissions so a tab resume or teleport cannot exhaust the pool in one burst.

Use these landed defaults:

| parameter | default | failure prevented |
| --- | ---: | --- |
| path spacing | 7 px/world units | wider gaps read as samples, tighter gaps become a ribbon |
| per-frame cap | 14 motes | teleports overwrite the whole pool |
| idle interval | 55 ms | no idle emission feels dead; faster becomes a hotspot |
| pool size | 620 | enough overlap for a 1.6 s trail without unbounded allocation |
| lifetime | 1.6 s | shorter trails break; longer trails cloud the content |
| random size | 0.50–1.15 | identical points read as a stippled brush |
| DPR cap | 2 | fill cost spikes on dense displays |

## Recycle a GPU pool

Allocate typed arrays once for origin, velocity, birth time, and random seed. Advance a ring head on spawn:

```js
const index = head;
head = (head + 1) % POOL_SIZE;

origins.set([x, y, z], index * 3);
velocities.set([vx, vy, vz], index * 3);
birth[index] = elapsed;
random.set([size, phase], index * 2);
dirty = true;
```

Mark dynamic attributes for upload only after respawns. Animate flight in the vertex shader from `age = uTime - aBirth`; do not integrate 620 particles on the CPU:

```glsl
float age = uTime - aBirth;
float u = age / uLife;
vec3 p = position + aVelocity * age * (1.0 - 0.34 * u)
       + vec3(sin(aRandom.y * 6.283 + age * 2.6) * 22.0 * u,
              46.0 * age,
              0.0);
vAlpha = smoothstep(0.0, 0.09, u)
       * (1.0 - smoothstep(0.40, 1.0, u));
```

Cull dead points in the vertex shader by setting size to zero and moving them outside clip space. Render the pool as one `THREE.Points` draw call with a prebuilt soft radial texture, additive blending, and `depthWrite: false`.

## Reuse the pool for bursts

Map a button or focused control to the same interaction plane and call `spawn` 40–60 times with a 2.5× spread. One pool keeps visual language, budget, and cleanup shared.

Expose a real **Release pollen** button with visible focus and an `aria-live` confirmation. Do not make pointer movement the only way to see or trigger the effect.

## Respect motion and lifecycle

- Under `prefers-reduced-motion: reduce`, do not advance particle age. Seed a designed curved trail and let the burst button replace it with a denser still composition.
- Clamp `dt` to 1/30 s and reset time after resume.
- Pause on `document.hidden` and while the section is offscreen.
- Size from `ResizeObserver`, guard zero viewports, and cap DPR at 2.
- Use Pointer Events so pen and touch can participate when the surface supports it; avoid hover-only instructions.
- On teardown, cancel the frame, disconnect observers, remove listeners, and dispose point geometry, material, sprite texture, and renderer.

## State the cost honestly

The per-particle flight math is not the main cost; additive point overdraw and attribute uploads are. Keep sprites small, keep the pool fixed, upload only when the ring changes, and reduce lifetime before raising the pool. Measure GPU frame time and upload cost on a dense display before claiming the shader path is faster.

## Verify

- Compare a slow crawl and fast flick over the same path; spacing remains approximately equal.
- Stop moving; confirm a trickle rather than a growing opaque clump.
- Leave and re-enter; confirm no diagonal bridge from the stale point.
- Trigger the keyboard burst and confirm it reuses the same pool.
- Test repeated bursts; pool length stays 620 and memory stays flat.
- Test 390×844, 1440×900, touch/pen, and fast resize.
- Test `?reduced=1`: composed still, no aging, live burst button.
- Hide/show and leave/re-enter the viewport; confirm no time jump.
- Tab through controls, confirm visible focus and live announcements.
- Confirm a clean console at both sizes.

Use [demo/index.html](demo/index.html) as the working proof and [demo/PROMPT.md](demo/PROMPT.md) to recreate or remix it.
