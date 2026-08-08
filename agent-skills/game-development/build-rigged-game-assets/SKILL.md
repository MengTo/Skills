---
name: build-rigged-game-assets
description: Create, integrate, or audit production-ready rigged 3D characters and monsters with a main model, skeleton, animation library, sockets, collision contracts, separate character equipment, optimized runtime files, catalog media, and an interactive moveset inspector. Use when generating or importing FBX/GLB game actors; defining character-versus-monster asset requirements; separating swords, shields, helmets, armor, or stowed gear; adding idle, walk, run, attack, hit, dodge, block, cast, or death clips; wiring an asset into gameplay; or adding action and equipment controls plus deterministic tests to a game asset catalog.
---

# Build Rigged Game Assets

Build one truthful actor package from source reference through gameplay and catalog proof.

## Establish the contract first

Inspect repository truth before generating or editing files:

- Locate the source image/model, runtime loader, skeleton conventions, action API, equipment system, collision system, catalog schema, review routes, budgets, and tests.
- Classify the actor as `character` or `monster`.
- Classify delivery as `catalog-only`, `review-only`, or `runtime`. Do not call an asset implemented until gameplay loads it.
- Preserve immutable source artifacts separately from optimized runtime files.
- Decide target formats before using a credit-bearing generator.

Copy the matching template from `assets/`, fill it in, and keep it beside the implementation or in the project’s asset metadata location:

- `character-asset-manifest.template.json`
- `monster-asset-manifest.template.json`

Run `scripts/validate_asset_manifest.py <manifest>` before building. Re-run with `--root <repo>` for shipped-file checks and `--require-verified` only after every acceptance check has actually passed.

Read [references/requirements.md](references/requirements.md) before creating the model, rig, actions, equipment, sockets, or collision data. Read [references/catalog-and-testing.md](references/catalog-and-testing.md) when adding the catalog card, inspector, moveset route, telemetry, or release tests.

## Build the common actor package

1. Preserve the source.
   - Record reference images, source tasks, imported files, licenses, generator/model, and material provenance.
   - Never overwrite the high-detail source with the runtime optimization.
2. Produce the main model.
   - Normalize scale, Y-up, forward axis, pivot, ground contact, materials, textures, and triangle budget.
   - Ground from feet or authored contact sockets, never a weapon tip, cloth tail, shadow, or VFX.
   - Remove isolated triangles, non-manifold fragments, duplicate surfaces, hidden generator debris, and unused nodes.
3. Build one stable rig.
   - Name root, hips/center mass, head, limbs, feet, and attachment sockets explicitly.
   - Keep at most four normalized skin influences per vertex unless the engine contract says otherwise.
   - Preserve a deterministic bind pose, finite transforms, positive usable scale, and compatible skeleton identity across every clip.
4. Build the action library.
   - Give every clip a stable `id`, semantic `role`, loop policy, root-motion policy, duration, contact events, and source.
   - Prefer animation-only GLBs for separate clips. They must not smuggle duplicate meshes, materials, or textures.
   - Make non-looping actions restartable and return to the intended locomotion/idle state.
5. Build runtime integration.
   - Use one asset-specific loader/factory with disposal for geometry, materials, textures, mixers, events, observers, renderers, and animation frames.
   - Publish source, model, rig, socket, action, equipment, collider, triangle, material, and status metadata.
   - Keep a truthful rollback path when replacing a shipped runtime asset.

## Apply the character profile

Treat the main model as the persistent body/base layer. Do not fuse swappable equipment into it.

- Declare every canonical slot: headgear, vestment, gloves, leggings, boots, main hand, offhand, and back/ranged.
- Mark unsupported slots explicitly instead of silently omitting them.
- Store supported swords, shields, bows, helmets, armor, and accessories as separate assets or independently addressable roots.
- Bind equipment to named sockets. Declare active and stowed sockets when an item changes state.
- Toggling a slot off must leave no floating trim, grip, one-triangle shards, duplicate baked weapon, or incidental gameplay prop.
- When the source contains no body beneath occluded equipment, create a fitted rig-following underlayer and record that limitation. Do not invent invisible anatomy claims.
- Require the character action roles `idle`, `walk`, `run`, `primary-attack`, `hit`, `dodge`, and `death`. Add block/ward, charged attack, cast, bow aim/shoot, jump, interaction, or class actions when gameplay exposes them.
- Keep equipment visibility independent from action selection unless the action deliberately changes active/stowed state.

## Apply the monster profile

Treat a monster as one authored combat actor, not a player wardrobe.

- Do not require wearable slots. Separate only weapons, breakable parts, dropped parts, projectiles, or props that must animate, hide, detach, or collide independently.
- Require the monster action roles `idle`, `locomotion`, `primary-attack`, `hit`, and `death`.
- Add secondary attack, ranged attack, pounce, cast, summon, block, stagger, roar, spawn, or phase-transition roles only when the combat design uses them.
- Define navigation and hurt colliders plus per-attack telegraph, active, and recovery windows.
- Bind attack origins, projectiles, VFX, audio, head/torso targeting, and feet to named sockets.
- Keep visual animation separate from authoritative attack volumes, damage timing, AI state, and navigation.
- Test every attack at its authored range, facing, contact window, interruption, death, and cleanup boundary.

## Build the catalog lab

Create both surfaces:

- Catalog card: transparent PNG, truthful label, zero WebGL canvases.
- Selected inspector/review route: exactly one live model canvas with source, status, budgets, rig, sockets, actions, and known boundaries.

Provide:

- drag-to-rotate while preserving page scroll;
- action selection for every shipped clip, including visible Walk, Hit, and Death controls;
- restart and pause/play;
- equipment toggles for characters, including clean all-off and active/stowed states;
- combat-state or attack controls for monsters instead of character gear controls;
- a fallback image until the real model is ready;
- deterministic runtime telemetry defined in the catalog/testing reference.

The inspector must load the same runtime model, rig, clips, equipment rules, and action API claimed by gameplay. A screenshot or separate look-dev mesh is not runtime proof.

## Verify and commit

Run the project’s focused asset tests, manifest validator, build, lint, full tests, and `git diff --check`.

In the repository-approved browser:

- verify the card has one transparent image and zero canvases;
- verify the inspector has one model host/canvas;
- click every action and confirm the selected/playing state;
- toggle every character slot individually and all equipment off;
- inspect front, back, and both sides for fragments, holes, grounding, and socket errors;
- drag the model, scroll the page, and test the supported narrow/mobile layout;
- verify fallback and model-load failure behavior;
- verify no broken media or console warning/error.

Commit only the narrow asset lane. Report the manifest, main/runtime models, gear files, rig and sockets, actions, catalog route, status, verification results, known boundaries, and exact commit SHA. Report full-suite baseline failures separately.
