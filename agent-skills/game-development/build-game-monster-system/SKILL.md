---
name: build-game-monster-system
description: Build, integrate, audit, or refactor rigged monsters for Three.js and web action games. Use for monster asset contracts, procedural or imported creature rigs, semantic joints and sockets, hurtboxes and attack volumes, combat animation states, enemy-runtime adapters, LODs, deterministic review fixtures, and validating that every monster follows one shared system.
---

# Build Game Monster System

Build monsters as gameplay-compatible runtime assets, not decorative meshes.

## Establish the contract

Read [references/monster-contract.md](references/monster-contract.md) before implementation or audit. Check the real game content model, combat events, enemy state machine, collision API, camera distance, and asset loader before extending the contract.

Use related skills when applicable:

- Use `img2threejs` for image-driven procedural reconstruction and its staged visual gates.
- Use `build-hybrid-game-assets` to choose procedural versus imported representation and record provenance/budgets.
- Use `tune-enemy-ai` for perception, intent, movement, and behavior transitions.
- Use `design-action-combat` for startup/active/recovery timing and authoritative contact.

## Separate four layers

1. `MonsterDefinition`: serializable authored facts, tags, scale, stats, attacks, locomotion, asset provenance, and budgets.
2. `MonsterRig`: semantic transform hierarchy, joints, sockets, secondary-motion anchors, materials, and LOD visuals.
3. `MonsterRuntime`: current state, timers, target intent, health/posture, cooldowns, and authoritative combat events.
4. `MonsterViewAdapter`: drives rig poses, VFX, audio, visibility, and LOD from runtime state; never decides hits from rendered pose.

Do not duplicate authored combat values in the rig or UI.

## Build the rig

- Use `+Y` up, `+Z` forward, meters, and a ground-contact root.
- Keep `root -> motion -> body` stable across every monster and LOD.
- Parent limb segments as real joint chains so shoulder/hip motion propagates through elbows/knees to wrists/ankles.
- Name semantic equivalents for nonhumanoids; do not fake absent anatomy.
- Provide sockets for attack origins, VFX, audio, targeting, ground contact, attachments, and death effects.
- Keep visual meshes out of physics by default. Provide simple solid, navigation, hurt, attack, and trigger shapes separately.
- Preserve root, joints, sockets, collision, and animation state across LOD changes.

## Connect behavior and combat

Support at least `idle`, `investigate`, `pursue`, `reposition`, `windup`, `attack`, `recover`, `stagger`, and `defeated`. Each attack definition must declare startup, active, recovery, cooldown, contact shape/socket, damage/posture output, facing rule, and interrupt/cancel policy.

Drive contacts from authoritative action IDs and collision events. Animation may expose a normalized phase, but it must not create damage by itself.

## Compose testable movesets

- Author movesets as serializable sequences of intent states and attack IDs. Keep attack timing in the attack definitions; the moveset references it instead of copying it.
- Compile attack steps into explicit startup, active, and recovery phases.
- Provide a pure sampler from `(movesetId, elapsed)` to state, attack, normalized phase, active flag, interruptibility, and stable action ID.
- Give every loop cycle a new action ID while preserving one ID across an attack's startup, active, and recovery phases.
- Expose queryable or seeded fixtures for the midpoint and boundaries of every phase so reviewers can freeze and reproduce them without campaign playthrough.

## Verify conformance

- Add deterministic fixtures for all required states, each attack phase, interrupt/stagger, death, LOD switching, and reset.
- Test moveset timeline continuity, exact active-window boundaries, full attack coverage, per-action ID stability, and per-loop ID renewal.
- Test joint propagation, socket stability, collider coverage, single-contact idempotence, and disposal.
- Render the monster at real encounter distance in the in-app browser.
- Measure triangles, draw calls, textures, frame time, and mobile pixel-ratio behavior.
- Fail the asset if it has floating attachments, missing mandatory states, pose-derived damage, LOD socket drift, or unbounded resource cost.

Report whether the monster fully conforms, conforms with documented exceptions, or needs a new archetype capability added to the shared contract.
