# Game Development Skills

Reusable workflows for building playable Three.js and browser games. This family is intentionally separate from `web-design`: these skills own gameplay architecture, simulation, combat, content contracts, asset integration, performance, QA, and release proof.

Start with the narrowest matching skill. Combine skills only when the task crosses system boundaries.

## Choose the right skill

| Need | Start with |
| --- | --- |
| Build a complete playable vertical slice | [`build-isometric-arpg`](build-isometric-arpg/SKILL.md) |
| Author readable flat-world routes and motivated lighting | [`author-game-levels`](author-game-levels/SKILL.md) |
| Implement camera framing, lock-on, occlusion, or touch gestures | [`build-game-camera-controls`](build-game-camera-controls/SKILL.md) |
| Define enemy archetypes, movesets, model conventions, and runtime hooks | [`build-threejs-enemy-systems`](build-threejs-enemy-systems/SKILL.md) |
| Rig and validate monster joints, sockets, colliders, animation states, and LODs | [`build-game-monster-system`](build-game-monster-system/SKILL.md) |
| Tune enemy perception, intent, spacing, and state transitions | [`tune-enemy-ai`](tune-enemy-ai/SKILL.md) |
| Define attack timing, contact authority, defense, and combat feedback | [`design-action-combat`](design-action-combat/SKILL.md) |
| Compose arenas, waves, objectives, boss phases, and rewards | [`design-game-encounters`](design-game-encounters/SKILL.md) |
| Build inventory, loot, equipment, or persistence | [`build-game-inventory`](build-game-inventory/SKILL.md) |
| Choose and integrate imported, procedural, generated, or 2D assets | [`build-hybrid-game-assets`](build-hybrid-game-assets/SKILL.md) |
| Pair Vesperfall catalog PNGs with truthful live model review routes | [`build-vesperfall-review-assets`](build-vesperfall-review-assets/SKILL.md) |
| Add readable visual or audio feedback | [`create-game-vfx`](create-game-vfx/SKILL.md) and [`build-game-audio-feedback`](build-game-audio-feedback/SKILL.md) |
| Adapt controls, HUD, quality, and QA for mobile | [`build-mobile-threejs-games`](build-mobile-threejs-games/SKILL.md) |
| Diagnose frame-time, draw-call, memory, or quality problems | [`optimize-threejs-games`](optimize-threejs-games/SKILL.md) |
| Test the full player journey in a real browser | [`test-playable-web-games`](test-playable-web-games/SKILL.md) |
| Package, deploy, verify, and document a release | [`ship-web-games`](ship-web-games/SKILL.md) |

## Foundation and world

- [`build-isometric-arpg`](build-isometric-arpg/SKILL.md) — assemble one coherent production-ready action-RPG loop in vertical slices.
- [`author-game-levels`](author-game-levels/SKILL.md) — author flat, readable routes with separated collision/navigation/visual layers and source-motivated lighting.
- [`build-game-camera-controls`](build-game-camera-controls/SKILL.md) — create readable isometric, follow, lock-on, occlusion, shake, and touch-camera behavior.
- [`build-mobile-threejs-games`](build-mobile-threejs-games/SKILL.md) — treat mobile controls, safe areas, responsive HUD, orientation, and performance as primary surfaces.

## Combat, enemies, and encounters

- [`design-action-combat`](design-action-combat/SKILL.md) — specify startup, active, recovery, contact authority, defense, interruption, and deterministic combat proof.
- [`build-threejs-enemy-systems`](build-threejs-enemy-systems/SKILL.md) — define portable enemy content, model/rig/collider/socket conventions, movesets, runtime hooks, fallbacks, and fixtures.
- [`build-game-monster-system`](build-game-monster-system/SKILL.md) — enforce one concrete rig, socket, collider, state, moveset, LOD, and deterministic review contract for every monster.
- [`tune-enemy-ai`](tune-enemy-ai/SKILL.md) — build fair, bounded, reproducible perception, intent, navigation, spacing, and attack decisions.
- [`design-game-encounters`](design-game-encounters/SKILL.md) — compose arenas, enemy roles, spawn pacing, hazards, objectives, boss phases, failure recovery, and rewards.

## Player systems and feedback

- [`build-game-inventory`](build-game-inventory/SKILL.md) — create atomic inventory, loot, equipment, drag/drop, migration, and no-loss persistence flows.
- [`create-game-vfx`](create-game-vfx/SKILL.md) — build readable, bounded, pooled, reduced-motion-aware gameplay effects.
- [`build-game-audio-feedback`](build-game-audio-feedback/SKILL.md) — connect player intent and combat state to prioritized, accessible, browser-safe audio cues.

## Assets, performance, QA, and release

- [`build-hybrid-game-assets`](build-hybrid-game-assets/SKILL.md) — choose the correct runtime representation and preserve provenance, scale, sockets, collision, and budgets.
- [`build-vesperfall-review-assets`](build-vesperfall-review-assets/SKILL.md) — pair transparent catalog references with truthful live model previews, provenance, grounding, and deterministic review routes.
- [`optimize-threejs-games`](optimize-threejs-games/SKILL.md) — measure and improve representative encounters without sacrificing controls or combat readability.
- [`test-playable-web-games`](test-playable-web-games/SKILL.md) — verify deterministic states and complete player journeys across desktop, touch, saves, retries, and accessibility.
- [`ship-web-games`](ship-web-games/SKILL.md) — release an exact verified commit and prove the deployed game separately from local readiness.

## Important boundaries

- `build-threejs-enemy-systems` defines portable enemy content and runtime orchestration; `build-game-monster-system` owns individual rig and animation conformance; `tune-enemy-ai` decides what an enemy should do.
- `design-action-combat` defines individual combat verbs and outcomes; `design-game-encounters` composes those verbs into pressure and pacing.
- `build-hybrid-game-assets` chooses and integrates asset representations; `build-vesperfall-review-assets` proves Vesperfall catalog and live-preview truth; `create-game-vfx` and `build-game-audio-feedback` communicate gameplay state.
- `test-playable-web-games` proves the player experience; `ship-web-games` owns the release sequence and production read-back.
