# Rigged game asset requirements

## Contents

- Common deliverables
- Main model and optimization
- Rig and sockets
- Animation library
- Character contract
- Monster contract
- Runtime and provenance
- Rejection gates

## Common deliverables

Every actor package must declare:

| Deliverable | Requirement |
|---|---|
| Reference | Immutable source image/model plus source task, license, or import provenance |
| Source model | Highest-fidelity recoverable artifact, never overwritten by optimization |
| Main model | Grounded, cleaned, textured actor without disposable preview staging |
| Runtime model | Budgeted engine-ready FBX/GLB with stable scale, axes, materials, and rig |
| Rig | Named skeleton, bind pose, skin weights, semantic sockets, and skeleton identity |
| Actions | Stable IDs/roles, loop policy, root-motion policy, duration, contacts, and source |
| Collision | Navigation, hurt/target, and required attack/guard/projectile volumes |
| Catalog media | Transparent card PNG plus real runtime inspector |
| Manifest | Machine-checkable actor contract based on the bundled template |
| Verification | Focused tests, build, lint, full tests, browser proof, and exact commit |

Keep source, runtime, animation-only clips, equipment, catalog images, and review renders in distinct paths. A static render is not a runtime model.

## Main model and optimization

- Use real-world or project-authoritative scale and record actor height.
- Use the engine’s up and forward axes without per-frame corrective rotation.
- Place the actor root at the authored ground plane; preserve foot contacts.
- Count rendered triangles after runtime stripping and splitting, not only source triangles.
- Remove non-finite attributes, degenerate/isolated triangles, unused nodes, duplicate materials, hidden generator debris, and unreferenced textures.
- Bound file bytes, triangles, materials, textures, bones, skinned meshes, and draw calls.
- Keep permanent anatomy/base clothing in the main model.
- Keep anything that can be equipped, stowed, hidden, broken, dropped, or replaced independently addressable.

If a generated source fuses gear into the body, do not hide the problem with visibility flags. Audit connected components and skin weights, remove or regenerate fused equipment, then prove the all-off state from four sides. Use a fitted underlayer only when the source genuinely has no geometry beneath an occluded item.

## Rig and sockets

Require:

- one deterministic root and one declared skeleton identity;
- named hips/center mass, head, limb chains, and contact feet;
- normalized skin weights with no more than the engine-supported influence count;
- finite bind matrices and animation transforms;
- no unexpected negative scale or mirrored hierarchy;
- consistent bone names and hierarchy across the main model and every action;
- semantic sockets rather than hard-coded world offsets.

Character socket roles:

`root`, `hips`, `head`, `left-hand`, `right-hand`, `back`, `left-foot`, `right-foot`

Add active/stowed weapon, shield, bow, quiver, flask, VFX, camera, or interaction sockets as required.

Monster socket roles:

`root`, `center-mass`, `head`, `vfx-origin`

Add feet, jaws, claws, weapon tips, projectile origins, weak points, breakable parts, or audio emitters according to morphology and combat.

## Animation library

Each action entry must include:

- `id`: stable runtime/UI identifier;
- `role`: semantic requirement used by validation;
- `file`: runtime clip source;
- `loop`: explicit boolean;
- `rootMotion`: `in-place`, `authored`, or `extracted`;
- `durationSeconds`: measured positive duration;
- `contactEvents`: named normalized-time or seconds-based events;
- provenance or provider action identifier when generated/imported.

Animation-only files should contain one clip and zero meshes. Reject duplicate skeletons, materials, or textures hidden inside clip files.

Character baseline roles:

`idle`, `walk`, `run`, `primary-attack`, `hit`, `dodge`, `death`

Monster baseline roles:

`idle`, `locomotion`, `primary-attack`, `hit`, `death`

Optional roles must come from gameplay: `block`, `ward`, `charged-attack`, `secondary-attack`, `ranged-attack`, `bow-aim`, `bow-shoot`, `cast`, `summon`, `stagger`, `roar`, `spawn`, `phase-transition`, `jump`, or `interaction`.

Test locomotion contact at normalized times 0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, and 1. Test non-looping clips at start, every contact event, recovery, and completion.

## Character contract

Declare all canonical equipment slots even when unsupported:

| Slot | Expected socket behavior |
|---|---|
| `headgear` | Head or authored helmet socket |
| `vestment` | Skeleton-bound armor layer or torso sockets |
| `gloves` | Skeleton-bound hand/forearm layer |
| `leggings` | Skeleton-bound hips/leg layer |
| `boots` | Skeleton-bound foot/lower-leg layer |
| `main-hand` | Active hand plus optional stowed socket |
| `offhand` | Active hand plus optional stowed socket |
| `back-ranged` | Active hand/back and optional quiver/projectile sockets |

For every supported slot:

- identify a separate file or independently addressable root;
- record socket roles and local transform;
- define active, stowed, and hidden states;
- keep collision/guard/weapon volumes aligned with the visible item;
- dispose cloned geometry/materials safely;
- test slot-on, slot-off, all-off, and action transitions.

The main model must remain visually coherent when equipment is absent. Do not leave shield rims, sword shards, empty grips, duplicate scabbards, or review-only flasks.

## Monster contract

Monsters use combat parts rather than a character wardrobe.

Require:

- navigation collider and target/hurt volumes;
- authored attacks mapped to real action IDs;
- telegraph, active, recovery, range, facing, damage, interruption, and cleanup contracts;
- attack origins and effect sockets;
- AI role and locomotion compatibility;
- death/corpse visibility and collider cleanup;
- explicit LOD behavior that does not change authoritative collision or timing.

Separate a monster part only when gameplay must independently animate, hide, collide, break, detach, drop, or replace it. Otherwise keep it in the main model.

## Runtime and provenance

Expose metadata for:

- asset ID, kind, status, and gameplay use;
- reference, source, runtime, action, equipment, and texture paths;
- generator/model/task IDs or imported/procedural provenance;
- skeleton ID, bone/socket counts, action IDs, and current action;
- source/runtime triangles, materials, textures, meshes, and bytes;
- equipment visibility or monster combat state;
- colliders, known inference boundaries, and rollback.

Use truthful status language:

- `catalog-only`: recorded and reviewable, not loaded by gameplay;
- `review-only`: live inspector exists, still not gameplay;
- `runtime`: authoritative gameplay path loads it.

## Rejection gates

Reject or block release when:

- a character main model still contains swappable gear;
- action files carry duplicate render meshes;
- skeletons or bone names differ unexpectedly across actions;
- any required role, socket, collider, equipment slot declaration, or provenance field is absent;
- toggling gear leaves visible fragments or holes without a declared underlayer boundary;
- a monster attack animation has no authoritative timing/collision contract;
- the catalog card initializes WebGL or the inspector uses multiple unintended canvases;
- controls do not exercise the real runtime action/equipment API;
- the page cannot scroll or drag rotation blocks vertical touch scrolling;
- browser, build, lint, focused tests, or required manifest validation fails.
