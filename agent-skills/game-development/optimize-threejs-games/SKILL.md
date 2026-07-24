---
name: optimize-threejs-games
description: Profile, diagnose, and improve Three.js or WebGL game performance without regressing gameplay. Use for frame-time drops, CPU/GPU pressure, draw calls, texture and geometry budgets, animation loops, adaptive quality, mobile performance, and browser performance verification.
---

# Optimize Three.js Games

Measure before changing behavior, then validate the same gameplay path after every optimization.

## Establish a repeatable scene

Choose a deterministic representative encounter and record device, viewport, quality level, player position, enemies, active effects, frame-time sample, draw calls, triangles, texture count, and warnings. Compare like with like.

## Diagnose the limiting side

- Suspect CPU when simulation, allocations, React work, pathfinding, or per-frame scans grow with actors.
- Suspect GPU when resolution, overdraw, shadows, transparent particles, post-processing, draw calls, geometry, or texture bandwidth dominate.
- Inspect before optimizing; do not lower quality blindly.

## Apply low-risk fixes first

Reuse geometry/materials, pool transient effects, cull inactive/offscreen work, throttle noncritical UI updates, cap particle counts, avoid per-frame allocation, and update only changed transforms. Keep render quality settings explicit and reversible. Degrade decorative effects before combat readability or controls.

## Guard the result

Re-run the original encounter and verify frame time, visual correctness, collision/contact behavior, memory stability, mobile controls, reduced motion, and console health. Close temporary servers, benchmarks, and browser tabs once they are no longer needed.
