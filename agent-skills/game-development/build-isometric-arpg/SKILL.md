---
name: build-isometric-arpg
description: Build or extend a playable isometric action RPG in Three.js, React, or similar web technology. Use for game-loop architecture, camera and movement, zones, combat integration, content data, progression, saves, or production-ready vertical slices.
---

# Build Isometric ARPG

Build one coherent playable loop before expanding scope: title/menu, character choice, movement, one encounter, reward, progression, and continuation.

## Establish the production contract

1. Inspect the current game entry point, scene loop, content model, controls, save model, and tests.
2. Record the authoritative baseline before integrating dependent work. Preserve unmerged work and do not build from a stale branch.
3. Define data-driven contracts for player classes, equipment, enemies, zones, encounters, quests, and review fixtures. Keep authored content separate from runtime state.

## Build in vertical slices

Deliver each slice with a playable route and deterministic test state. Prefer this order:

1. Movement, camera, collision, target selection, and pause/restart.
2. One combat verb plus contact, damage, posture, recovery, and death.
3. One enemy with telegraph, decision loop, and counterplay.
4. One reward and atomic inventory/progression update.
5. One zone transition or objective completion.

Avoid adding a second system until the preceding slice has gameplay proof, automated coverage, and a stable save/load path.

## Maintain runtime boundaries

- Keep simulation state deterministic and serializable where possible.
- Consume authoritative contact events; do not infer physics outcomes from visual state.
- Centralize timing, damage, cooldown, and content values. Do not duplicate combat clocks across components.
- Make equipment, pickups, save migration, and reset flows atomic and idempotent.
- Provide review query parameters or fixtures for difficult states such as boss phase changes, empty inventory, interrupted actions, and save migrations.

## Validate before release

Run focused unit tests, type/lint checks, production build, and a real playthrough in the repository-approved browser. Verify a fresh start, saved continuation, loss/retry, one complete objective, keyboard/mouse controls, and the intended mobile baseline. Report known baseline failures separately from new failures.
