---
name: implement-fog-of-war
description: Implement, tune, debug, or validate soft wall-aware fog of war and gameplay perception in Three.js action games. Use for orthographic or isometric visibility masks, obstacle-aware line of sight, player and enemy vision ranges, hidden-enemy targeting rules, fog shader artifacts such as spokes or seams, mobile ray budgets, lifecycle and menu-state integration, and deterministic fog-of-war tests.
---

# Implement Fog of War

Build fog of war as a shared perception system with a restrained presentation layer.

## Preserve the architecture

Keep these responsibilities separate:

1. Let deterministic CPU perception own ranges, obstacle intersections, and gameplay visibility.
2. Encode the player's angular visible distances into one fixed-size lookup texture.
3. Let one full-screen shader turn that lookup into soft radial and wall-aware fog.
4. Let gameplay consume perception results directly; never infer combat truth from fog pixels.

Read [mechanics.md](references/mechanics.md) before implementing or changing the algorithm. It records the proven obstacle model, shader composition, calibrated values, state rules, enemy behavior, lighting constraints, and telemetry.

## Inspect before editing

- Locate the authoritative player position, camera, obstacles, scene lifecycle, frame loop, targeting, enemy perception, and render layers.
- Confirm the gameplay ground model. The proven corner-unprojection method assumes a locally horizontal plane; use authoritative surface or terrain reconstruction when elevation varies across the visible area.
- Find existing scene fog, post-processing, renderer creation, review modes, menus, captures, transitions, and disposal paths.
- Read the current tests and recent fog/perception commits before changing constants or ownership.
- Confirm whether obstacle state changes at runtime. Reuse the same active obstacle collection used by navigation or collision when its geometry is suitable for sight.
- Check the working tree early and preserve unrelated changes.

## Implement in dependency order

### 1. Define perception truth

- Represent each sight blocker with a stable footprint, vertical span, and active state.
- Intersect a 3D sight segment or ray with both the horizontal footprint and vertical span.
- Ignore inactive blockers and cover below the eye-to-target sight line.
- Expose:
  - point-to-point perception for enemies, targeting, and attacks;
  - a deterministic angular distance fill for the fog lookup.
- Use explicit player and enemy ranges. Allow them to differ when the encounter design needs enemies to acquire beyond the player's reveal edge.

### 2. Build the visibility lookup

- Allocate the distance array, byte pixels, and data texture once.
- Cast a fixed number of evenly spaced horizontal rays around the player's eye point.
- Normalize hit distances by the player vision radius and quantize them into a one-row red-channel texture.
- Use linear filtering, horizontal repeat wrapping, no mipmaps, and a bounded mobile/desktop ray budget.
- Refresh after meaningful player motion or a short maximum interval. Do not allocate in the frame loop.

### 3. Render one soft overlay

- Use one clip-space plane and one transparent shader material.
- Reconstruct each fragment's ground-plane position from the four camera-corner intersections.
- Combine:
  - a clear inner radius and soft outer radial falloff;
  - a feathered wall boundary sampled from the angular lookup.
- Smooth obstacle visibility across neighboring angles. Weight wall fog below the outer radial fog so blockers read as atmosphere, not opaque wedges.
- Combine radial and obstacle fog with `max`, then cap final opacity.
- Disable depth test, depth write, and tone mapping; render after the world.
- Do not introduce a second renderer, render target, composer, or per-ray meshes.

### 4. Integrate gameplay

- Keep simulation presence separate from presentation visibility.
- Hide unrevealed enemy renderables through layers or a presentation-only mechanism; do not toggle the actor root if root visibility also controls lifecycle or simulation.
- Exclude unrevealed enemies from target lock, aim selection, nearest-target search, HUD counts, and player hit eligibility.
- Hide telegraphs that would leak an unseen enemy.
- Let enemy acquisition and attacks use their own range plus the same line-of-sight truth.
- Clear an active target lock as soon as perception invalidates it.
- Cache perception within a simulation phase and refresh after movement when downstream systems need current positions.

### 5. Integrate state and lifecycle

- Enable fog only during active gameplay.
- Disable it for menus, inventory, review/capture modes, paused or non-playing states, and stage transitions unless the product explicitly requires otherwise.
- Disable it before any early-render branch so a previous frame cannot leak into another state.
- Keep atmospheric scene fog separate from fog of war.
- Dispose the overlay geometry, material, and lookup texture on teardown.
- Publish compact telemetry for ray budget, enabled state, ranges, visible enemies, target visibility, line of sight, and measured distance.

## Tune in the right order

1. Validate obstacle geometry and eye height.
2. Validate player and enemy ranges.
3. Set the fully clear inner radius.
4. Set the outer radial falloff and maximum opacity.
5. Set wall-edge softness.
6. Add angular smoothing until spokes disappear.
7. Reduce obstacle darkness until walls feel like occlusion rather than black rays.
8. Adjust ray budgets only after visual correctness and measured performance.

Do not hide bad obstacle data with extra blur. Do not make the entire scene darker to compensate for weak visibility boundaries.

## Validate

Read [validation.md](references/validation.md) before claiming completion. Run:

- pure perception and opacity tests;
- structural render-budget contracts;
- integration tests for targeting, layers, lighting, and state;
- project lint and build;
- real desktop and mobile browser checks in the Codex browser.

Use normal gameplay for visual verification when review modes intentionally disable fog. Judge motion, camera movement, wall edges, gates, seams, and menu transitions—not only a still frame.

## Protect the proven qualities

- Keep the inner play area readable.
- Keep the maximum darkness restrained.
- Keep walls soft and free of visible radial spokes.
- Keep the angle seam invisible.
- Keep dynamic gates synchronized with sight.
- Keep enemy behavior fair even when enemy vision exceeds player reveal.
- Keep one authoritative visibility model and one bounded overlay.
