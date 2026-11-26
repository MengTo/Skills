---
name: woodland-chapter-cameras
description: "Stage a live Three.js valley with a creek, instanced trees and layered fog across a hero, story chapter and footer using distinct scroll-driven camera poses."
---

# Woodland Chapter Cameras

Build the terrain around a winding creek centerline. Sample that same height field when placing tree roots, boulders, grass clumps and camera rails. Give the near banks recognizable branch silhouettes. Use grouped tree instances farther away, varied by crown ratio, lean and spacing. Keep a distant ridge behind an unplanted gap so the fog has an interval to reveal.

Use one seeded world and renderer. Define an eye position, target and lens for each chapter. Look across the water in the opening, across a clearing for the story and above the trees for the closing wordmark. Drive the active pose with section progress. Damp the target in seconds and snap to the intended pose on a deep link. If two views must coexist, use clipped viewports or retain the outgoing frame during the handoff.

Let depth and elevation control the light in the valley. Keep the near branch sharp. Shore contact, a darker creek bed, a changing Fresnel term and a displaced reflection establish water depth. Render reflections at a smaller resolution when GPU time is tight. Where pricing calls for blur, cache just its background.

Measure frame intervals through chapter boundaries, with an entrance directly at the footer as well as from the top. Share geometry and decoded textures. Stop hidden views and support a deliberately composed still pose for reduced motion.

Open [the interactive study](demo/index.html) to inspect the technique.
