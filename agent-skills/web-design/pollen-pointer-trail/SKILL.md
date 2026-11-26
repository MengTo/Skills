---
name: pollen-pointer-trail
description: "Emit a sparse, distance-spaced trail of airborne pollen from the pointer over a woodland scene, with depth drift, short lives and bounded particles."
---

# Pollen Pointer Trail

Separate the ambient motes from the pointer response. The ambient field can drift through the entire grove. The pointer emits a brief local disturbance. Convert client coordinates to the canvas rectangle, then either use CSS-pixel coordinates or unproject onto a shallow plane in front of the foliage.

Sample distance along each pointer segment. Carry the unused spacing into the next event so slow and fast devices leave similar densities. Start around one grain per 12–18 CSS pixels. Cap spawns per frame. Reset the previous point on pointerleave, re-entry, resize or a long gap so crossing the page never draws a bridge. Spread new grains a small amount around the path, with a little upward lift and weaker lateral drift.

Use a fixed pool with position, velocity, birth time, lifetime and size. Batch the marks in one points draw or transparent 2D canvas. Start at low opacity and fade to zero in about 0.5–1.2 seconds. Avoid allocating per pointer event. Pause the loop when the pool is empty and keep the overlay pointer-transparent.

Check rapid zigzags, a stationary pointer and leaving across a button. Disable decorative emission under reduced motion and allow touch to scroll the page normally.

Open [the interactive study](demo/index.html) to inspect the technique.
