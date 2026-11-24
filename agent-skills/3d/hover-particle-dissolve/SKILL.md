---
name: hover-particle-dissolve
description: Make a hovered 3D surface break into grains around the actual pointer hit and reassemble when the pointer leaves. Use for interactive product models, hero sculptures, or specimen viewers.
---

# Hover particle dissolve

In Saltmere, the pointer brushes material off the hero sculpture. The grains retain enough of its silhouette to tell where each piece came from. Use the [torus knot demo](demo/index.html) as a small working example with a different shape. Open it locally and try brushing across an edge, then through a hole.

## Build the handoff

1. Keep the original mesh as the picking surface. Convert the hit from world space into the coordinate system used by the particle homes. A simple rigid model can use mesh-local coordinates. For several meshes, transform their samples into one pivot space, including each instance transform.
2. Distribute samples by **triangle area**. Build a cumulative area table, pick a triangle by weight, and use barycentric weights `[1-u, u*(1-v), u*v]` with `u=sqrt(random())`. Save the position, interpolated normal, and a stable seed. For textured assets, sample the matching UV and color space. Reset the buffer only when the model changes.
3. Give the solid material and the point material the same erosion function. Evaluate it at the **rest position** in both passes. A practical threshold is distance to the brush divided by its radius plus a small, continuous spatial noise. Clip solid fragments when exposure passes the threshold. Fade grains in over a narrow overlapping band around the same threshold. Apply the same clipping to shadow passes if the model casts shadows.
4. Ease brush movement at about 16/s, exposure up at 7–8/s and down at 3–4/s using `1 - exp(-rate * dt)`. Seed roughly 65% of grains to stay close, 26% to drift a little, and 9% to travel farther. Combine a small outward normal offset with a slow correlated flow. Multiply all offsets by exposure so they return exactly home. Use a depth-tested point pass, soft point edges and a few warm highlights.
5. Trigger only on a hit. Pick against the intact mesh throughout the dissolve, including where the solid has disappeared. Update picking while the camera or model moves under a stationary pointer. On leave, cancel, blur, or model change, release the brush. Reduced motion should display the intact model. Offer a keyboard preview when the effect demonstrates a feature.

## Adapt and verify

The example uses a rigid, uniformly shaded mesh with 36,000 reusable samples. Start lower for small cards. For skinned or morphing models, apply the current pose to both the solid and the samples before evaluating the brush. When mounting this in a component, cancel the frame loop, detach observers and dispose owned buffers/materials on unmount.

Test a real hit, an empty hole, a long stationary hover, a fast exit, and re-entry from the opposite side. At rest there should be one solid surface. At full exposure the local grains should remain visible without a flickering hit target. [Original interaction in Saltmere](https://threeui.com/saltmere)
