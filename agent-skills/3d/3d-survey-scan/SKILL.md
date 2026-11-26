---
name: 3d-survey-scan
description: Add a replayable world-space survey pulse to an existing Three.js scene. Use for a cyan scanner that briefly traces mesh edges and passes over solid architecture, terrain or water while the camera and gameplay stay live.
---

# 3D survey scan

A survey exposes the topology of objects that are already there. In Shinonome Harbour, the wave travels from a point on the pier, traces each structure in cyan and leaves the original waterfront behind. Open the [working survey](demo/index.html) and scrub the front past the end of the building.

## Anchor the pulse in the scene

Choose a world-space origin at the instrument, player or point of impact. Capture it when the pulse fires. Update parent matrices before measuring the farthest participating bound. Start the radius below zero by the front's outer width and finish beyond the farthest bound plus the trailing width. A duration around four seconds worked across the harbour. Scale width and duration to the new scene.

Use one radius uniform and the same signed-distance function in the solid, line and optional water passes. Evaluate it at the rendered world position after mesh, instance and deformation transforms. A small, low-frequency perturbation shared by the passes gives an uneven front. Derive widths in scene units. This example uses a normalized distance in units of one rim width.

```glsl
float d = (length(worldPosition - origin) - radius) / width;
float rim = exp(-d * d * 2.8);
float trail = smoothstep(-5.0, -1.2, d) * (1.0 - smoothstep(-0.2, 0.5, d));
float wireAlpha = 0.96 * rim + 0.46 * trail;
```

## Light the surfaces and their edges together

Keep the original PBR shading. Mix a little blue-green into the short trail and add the narrow rim before tone mapping. Derive a restrained edge cage from the actual mesh with a crease threshold suitable for the object. The wire gets the stronger signal. Draw it with depth testing, additive blending and depth writes disabled. If coplanar edges vanish, apply the smallest clip-space depth bias that works at the closest camera. Keep back edges occluded.

Parent an object-space cage to its moving object. For static grouped geometry, transform vertices into one common frame before batching. For skinned or instanced targets, reproduce their skinning or instance transforms in the edge pass, or use a dedicated animated proxy. For water that already has a custom shader, sample the same front on the displaced water surface.

## Bound the work

Cache edges and shader variants before the first pulse in an interactive scene. Replays advance uniforms from the existing render loop. For large sites, sort edge pairs into distance bins once and submit only bins intersecting the active band. Rebuild that index if the origin or static geometry changes. For a long beam, the nearest point of a segment may lie between its endpoints. Use the closest point on the segment for the lower bound and the farther endpoint for the upper bound. Expand both by the maximum front distortion.

On completion, cancellation or scene change, retire the temporary cage and restore application-owned material and pass state. A reduced-motion path can present a scrubbed still or the resting scene immediately.

## Verify from the moving camera

Orbit sideways during a paused pulse. The edge and surface bands should meet at the same physical points. Sweep a rotated child and a long beam whose midpoint is closest to the origin. Replay twice and cancel halfway. Check the original lighting, reflections, shadows and idle draw calls afterward. Measure both the first pulse and a warm replay at the intended pixel ratio.

[Three.js edge extraction](https://threejs.org/docs/pages/EdgesGeometry.html).
