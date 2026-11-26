---
name: 3d-construction-sequence
description: Animate existing Three.js architecture or equipment assembling from a structural wireframe into finished solids. Use for a replayable 3D build, fabrication sequence or staged reconstruction with rigid parts and synchronized shadows.
---

# 3D construction sequence

Make each piece arrive at its designed final transform. In Shinonome Harbour the foundations settle first, market bays and upper floors follow, then the utilities switch on. The wire locates a piece before the material catches the light. Scrub the [working assembly](demo/index.html) to inspect the handoff.

## Give every piece a stable identity

Choose units someone could build or lift, such as a footing, column, floor slab, roof truss or equipment cabinet. Give each a final transform, a travel vector and a start time. Use support relationships for the order, then introduce a small deterministic stagger among peers. Keep beams rigid even when they span floors. Driving arrival from each vertex's height stretches diagonals and opens cracks.

For separate groups, move the group containing the solid and its wire. For batched geometry, bake the **same** four values into every vertex of a part and its corresponding edge endpoints before merging. Split vertices shared by parts with different schedules. Transform displacement vectors into the geometry's coordinate frame. A direction uses no translation. Instanced repeated parts can carry the schedule in an instance attribute.

## Let the wire lead and the solid settle

Use a single normalized phase. These example values are fractions of the whole sequence. The harbour used about five seconds. Pick the offset and durations to suit the visible part size and viewing distance.

```glsl
float wire = (phase - start) / 0.17;
float solid = (phase - start - 0.055) / 0.16;
float remaining = 1.0 - clamp(solid, 0.0, 1.0);
vec3 posed = finalPosition + travel * remaining * remaining;
float wireAlpha = smoothstep(0.0, 0.28, wire)
                * (1.0 - smoothstep(0.52, 1.22, solid));
```

Use the same posed coordinates in both passes. At a solid phase of zero or below, skip the fill, including its depth contribution. As it arrives, return to the original surface with a brief settling highlight. Keep a solid opaque when using ordinary depth sorting. A fragment discard, dithered coverage or a short assembly seam can provide a reveal. Leave time at the end for the last part's wire to fade. At phase one every offset must be zero.

## Integrate with the scene

Keep the project's material maps, lighting and camera controls. Account for the offset in culling bounds while pieces travel. An animated vertex shader needs the same pose and visibility in shadow and depth passes. One simpler option is to suspend shadows from arriving parts, then restore their prior state on seating. Schedule attached props, emissive signs and fixtures with their supports.

Prepare edge buffers, arrival attributes and shader variants before replay. Track active parts or time bins when full-district wire overdraw becomes expensive. Use the existing animation loop. Give replay, cancellation, reduced motion and a district change a single path back to the original transforms, materials, visibility and shadow flags.

## Verify the handoff

Scrub a long truss from wire-only through contact and final fill. Its corners should stay aligned. Inspect the ground for shadows from absent pieces. Compare phase one against the ordinary scene at the same camera. Cancel halfway and replay twice. Check for displaced geometry, remaining lines, duplicated animation loops and a first-use frame spike.

[Three.js geometry attributes and draw ranges](https://threejs.org/docs/pages/BufferGeometry.html).
