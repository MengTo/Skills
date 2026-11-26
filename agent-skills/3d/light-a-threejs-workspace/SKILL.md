---
name: light-a-threejs-workspace
description: Construct a procedural Three.js desk interior with textured furniture, a window and blinds, shadowed volumetric daylight, and coupled lighting presets.
---

# Light a Three.js workspace

Block the desk, window, floor, monitor and chair in a single world coordinate system. Set the camera and choose the sun direction before detailing props. Leave visible receivers for the light: a matte wall, a wood top, and a dark object crossing the beam make different errors visible.

## Build surfaces at real scale

- Give the sill and wall opening thickness. Instance the blind slats. Share their spacing, tilt, opening height and wind phase between visible geometry and any analytical window-visibility function.
- Generate seeded wood grain along the board’s long axis. Vary pore frequency and roughness at a finer scale than the color grain. Mip-map repeated materials and use anisotropy where the desktop recedes. Give the top and end grain different UV orientations when they are both visible.
- Round silhouette edges that should catch light. Separate the monitor shell, stand, emissive display, keyboard caps and chair base so metal, glass, paint and upholstery respond independently. Keep the monitor and turning stand beneath the same pivot.
- Light the room with a window key, broad sky fill and a practical lamp. Use linear color for lighting and tone-map once at output. Change direction, exposure, emissive color and sky/sun ratio together for a time-of-day preset. A storm favors diffuse skylight. Moonlight needs direction and a readable exposure.

## Integrate shafts through visible air

Render opaque geometry with a sampleable depth texture. Reconstruct the eye ray and first surface from the projection used for that frame. March only through the room interval in front of that surface. For each world-space sample, project toward the sun to test the window aperture and blind occlusion. If an object outside or inside can cast into the shaft, include its light-space depth or transmittance in that test.

For a segment of length `ds` with extinction `sigmaT` and scattering `sigmaS`, use a step-size-independent accumulation:

```glsl
float remain = exp(-sigmaT * ds);
scatter += transmission * (1. - remain) * (sigmaS / sigmaT)
         * visibleSun * sunRadiance * phase;
transmission *= remain;
```

Add the attenuated surface radiance after the march. Keep extinction positive or use its zero-density limit. Jitter sample positions slightly to break up march bands. If the integration target runs at reduced resolution, use scene depth when resolving across plant, slat and monitor silhouettes. Sparse dust motes can reveal motion inside the volume.

## Verify the coupling

Move the blind slowly while looking at a beam and its landing on the desk. Both should change from the same aperture. Slide the camera sideways and check that air stays behind the monitor. Compare a low and high sample count at fixed density; beam energy should stay close. Freeze wind and time when comparing images. Check a 2× frame for wood shimmer and stair-stepped blind shadows.

The [desk study](demo/index.html) isolates the depth-clipped shaft integration, procedural wood, and adjustable blinds in a small room.
