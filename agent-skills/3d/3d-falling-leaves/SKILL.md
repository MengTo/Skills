---
name: 3d-falling-leaves
description: Build recognizable falling leaves in world space using instanced geometry, independent tumble, coupled sideways drift, shared wind, scene occlusion, and camera-aware recycling. Use for 3D autumn leaves or drifting foliage in Three.js and similar scenes; use falling-leaves for a 2D canvas overlay.
---

# 3D Falling Leaves

Make individual leaves turn through face, edge, and back while drifting through the scene. The visible edge-on moment is essential to the effect.

## Build one convincing leaf

Use a two-sided quad or lightly bent mesh with a recognizable leaf silhouette, stem, and restrained vein detail. Camera-facing point sprites cannot turn edge-on. Begin with one slow leaf before increasing the count.

Give the back a slightly paler, less saturated appearance and orient its lighting normal correctly. For a custom shader, `gl_FrontFacing` can distinguish front/back; do not flip normals twice if the engine's material already handles double-sided lighting. Keep light transmission subtle and linked to the scene sun rather than using an unconditionally glowing leaf.

Use a padded texture atlas for multiple silhouettes. Extend edge colors into transparent texels and keep padding through mip levels to prevent dark rims and atlas bleed. Treat a color atlas as sRGB; treat an atlas encoding masks or material channels as data. Seijaku's procedural atlas encodes channels and is not an ordinary leaf photograph.

## Couple tumble and drift

Assign persistent seeded values per leaf: position seed, scale, phase, tumble rate, roll rate, fall speed, lateral slip, and palette variation. Never generate new random values every frame.

The lateral velocity should follow the tumble, so a leaf slips fastest when edge-on. For angular speed `omega` bounded away from zero:

```js
const angle = phase + omega * time;
const sideOffset = -(slip / omega) * Math.cos(angle);
// d(sideOffset)/dt = slip * sin(angle)
```

Apply that offset along the leaf's chosen horizontal direction. Use a separate slow roll and tilt; all leaves should not share one rhythm. Add a common wind field with small per-leaf response variation. Integrate changing wind over bounded simulation steps, or use a closed-form field; never catch up an entire hidden-tab interval with an unbounded loop.

## Instance and recycle

Use an `InstancedMesh` with reusable CPU scratch objects for moderate counts, or instanced attributes and shader animation for larger fields. Upload seeded attributes once; update time, wind, season amount, and camera anchor uniforms. Refresh instance matrices/bounds correctly when using the CPU path. See [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html).

Center the recycling volume ahead of the camera along its horizontal viewing direction. Retain a fallback horizontal direction when looking nearly straight up or down. Preserve existing world positions as the camera moves; move the spawn/wrap boundaries rather than parenting all live leaves to the camera.

Wrap outside the visible central volume. Fade near boundaries with `1.0 - smoothstep(inner, outer, distance)`, where `inner < outer`; reversed GLSL `smoothstep` edges are undefined. Hide reset events beyond the fog, near the volume top, or behind a soft boundary fade. Seed each fall cycle for variation without frame-to-frame jitter.

Start with a sparse field and tighten its visible volume before increasing the count. Distinguish capacity, active count, and leaves actually visible. Use a few near leaves, a readable middle layer, and smaller distant leaves. Keep the closest leaves from covering the camera as giant blurred shapes.

## Integrate with the world

- Depth-test against architecture and ground. Exclude covered interior volumes or provide roof/terrain collision proxies; depth testing alone does not prevent leaves falling inside rooms.
- For crisp silhouettes, alpha testing with depth writes is a useful default. MSAA alpha-to-coverage can soften edges only when the actual target is multisampled. A custom shader must implement its alpha rejection; material settings alone do not insert arbitrary custom shader logic.
- If alpha blending is needed, handle depth writes and sorting deliberately. Instances are not individually depth-sorted by default.
- Match leaf cutouts and wind deformation in any shadow or occlusion pass. Disable leaf shadow casting when its cost or artifacts outweigh its visual contribution.
- Let seasonal state control palette and active density; do not allocate a new leaf system per season.

## Verify

Watch one leaf complete a tumble and a full fall cycle. Confirm its face/back differ, its edge thins, and its reset is hidden. Walk sideways, turn around, look up, enter a room, and resume after hiding the tab. Check the field at narrow and wide viewports, through the final tone mapper, and with reduced motion frozen at a composed state. Measure overdraw and update cost instead of assuming particles are free.

Read [REFERENCES.md](REFERENCES.md) for the reference implementation. Seijaku's `leafFall` provides the closed-form animation pattern; replace its hardcoded roof rectangles with the target scene's geometry or volumes.
