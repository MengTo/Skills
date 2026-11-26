---
name: 3d-harbour-water
description: Build sheltered waterfronts in Three.js with depth-aware reflections of docks and signs, rain rings, boats that ride the swell, and wakes that follow turns. Use for night harbours, canals, urban quays, or a game boat whose reflection slides away from the hull.
---

# 3D Harbour Water

Start with the view that exposes the effect. Put one piling through the surface, a bright sign on the far quay and a boat between them. At water level the piling should meet its reflection, the sign should break into moving facets and the boat should leave a trail along the route it actually took.

[Open the working demo](demo/index.html) · [Water implementation](demo/assets/harbour-water.js) · [Boat and quay example](demo/assets/quay.js) · [Prompt recipe](demo/PROMPT.md)

## Put the water in the scene

Copy the water implementation into the project. It accepts the project's Three.js engine and the matching Reflector addon. The offline demo includes Three.js r180. The implementation assumes WebGL 2, conventional WebGL depth, an above-water perspective camera and a level XZ surface. Keep the water directly under the identity scene root. Size it to cover the navigable water and both camera views.

```js
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import './harbour-water.js';

const water = globalThis.HarbourWater.create(THREE, Reflector, {
  size: 100, segments: 128, level: 0, mirrorWidth: 768, mirrorHeight: 432
});
scene.add(water.mesh);
water.setWeather(0.88, 0.76); // wind and rain intensities
water.setLights([{
  position: quayLamp.getWorldPosition(new THREE.Vector3()),
  color: 0xffaf64, power: 22, radius: 0.15
}]);
```

Call `water.setTime(simulationSeconds)` before sampling heights or rendering each frame. Pass the same clock to the hull, wake and renderer. The water uses metres. Set `level` to the channel elevation and allow sufficient mesh subdivisions for the short swells. Reuse the host renderer, camera and animation loop. Call `water.dispose()` when unloading the surface.

## Anchor the reflections

1. Render the reflected scene once into a colour target with a depth texture. Start at 768 × 432 with multisampling off. Compute mirror UVs on the flat plane, then displace the displayed surface.
2. After the reflection pass, read the reflected camera's projection and view matrices. Its projection already includes the oblique clip plane. Invert their product, unproject the depth sample using `depth * 2 - 1`, and divide by homogeneous W.
3. Measure the path from water to reflected geometry. Bend that path toward the ray reflected around the local wave normal, project it back into the mirror and limit the UV offset. A pile touching the water yields very little offset. A far sign breaks across a much longer reflected path.
4. Fade samples at the edge to the local sky colour. Mix the reflection with the water body using a grazing-angle Fresnel term. Keep the body dark enough to give the lettering and lamps contrast. Give every extra glint an actual emitter position, colour, power and approximate radius. The example supports up to eight. Refresh their world positions when lights move or districts change.

## Layer the surface by scale

- **Swell.** Use the same three low-amplitude waves for mesh displacement and CPU hull probes. The reference generates its GLSL from the CPU coefficients so changing a wavelength updates both paths.
- **Capillary ripples.** Tile a periodic signed slope field at several scales and orientations. Bring each rotated slope vector back into world axes. Mip-filter the textures and fade the shortest layer using the fragment's world-space footprint. Check the far bank for crawling highlights.
- **Rain.** Add expanding rings to the normals at seeded impact locations. Keep each ring inside its cell, fade its energy over its lifetime and remove it when the ring occupies less than a pixel. The demo's calm, rain and squall presets provide repeatable comparisons.
- **Lamp colour.** Compare the slope required to reflect each lamp into the eye against the actual water slope. Widen the lobe with the angular size of the emitter and pixel footprint. A wide shop sign can reach more facets than a small navigation light. Keep brightness and placement tied to the visible source.

## Float the boat and carry its wake through turns

Use four `water.heightAt(x, z)` probes at the bow, stern, port and starboard waterline. For a local +Z bow and +X starboard side, use forward `(sin(yaw), cos(yaw))` and right `(cos(yaw), -sin(yaw))` in XZ. Place the hull at the mean height with its authored waterline offset. Set pitch to `-atan2(bow - stern, 2 * halfLength)` and roll to `atan2(starboard - port, 2 * halfBeam)` using Euler order YXZ. Use the vessel's actual half dimensions in metres.

Pass the stern's world coordinates to `water.trackStern(x, z)` each simulation step. The reference stores one vessel's trail in a fixed buffer, samples about every 0.22 seconds and widens the two wake shoulders as the samples age. It bounds the shader work around the recorded path. Call `water.clearWake()` on respawn, a district switch or a vessel swap. For multiple boats, maintain a separate bounded trail and lifetime for each active vessel.

## Verify from the player's cameras

- Pause beside a pile and switch between the quay and waterline views. Check the attachment at the water, then follow a rooftop sign down to its broken reflection. A sign that slides across the whole surface points to a constant UV offset or an incorrect mirror matrix.
- Compare calm, rain and squall at a fixed time. Inspect both the near water and a distant strip. Step the clock to see rain rings expand. Orbit along the bank to catch repeated tiles or specular shimmer.
- Steer a curve, stop and respawn. The old wake should remain on the curve, fade after roughly six seconds and clear on respawn. Check bow and stern from the side for hovering or dipping through the surface.
- Profile the reflection pass and the water draw on the target device. Record resolution, device pixel ratio and frame-time percentiles during weather and camera changes. Tune the mirror size, visible lamp count and wake bounds before cutting the near-water detail that the player can see.

The companion [open-ocean water skill](../3d-ultra-realistic-water/SKILL.md) covers ocean horizons, whitecaps and sun glitter.
