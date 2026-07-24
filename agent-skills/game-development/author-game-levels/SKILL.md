---
name: author-game-levels
description: Author or revise playable Three.js game levels. Use for isometric routes, collision, navigation, landmarks, objectives, encounter spaces, pickups, lighting, visibility, level data, and browser playthrough verification.
---

# Author Game Levels

Author the playable route first, then enrich it visually.

## Establish the route

Define start, landmarks, critical path, optional space, objective gates, encounter arenas, checkpoint/retry points, and reward placement. Keep collision, navigation, visual geometry, and authored level data distinct.

## Make it playable

Check movement clearance, camera visibility, line of sight, interaction reach, enemy navigation, and return paths. Use lighting and contrast to guide without hiding threats or pickups. Do not rely on decoration as collision proof.

## Validate

Run deterministic collision/path fixtures and a live traversal from start through objective and retry. Test desktop and mobile framing, performance in dense views, and persistence of level progress.
