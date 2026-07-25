# Game Monster Runtime Contract

## Contents

- [Required authored definition](#required-authored-definition)
- [Required rig API](#required-rig-api)
- [Semantic hierarchy](#semantic-hierarchy)
- [Mandatory sockets](#mandatory-sockets)
- [Collision layers](#collision-layers)
- [State and pose contract](#state-and-pose-contract)
- [Attack definition](#attack-definition)
- [Moveset definition and sampler](#moveset-definition-and-sampler)
- [LOD and performance](#lod-and-performance)
- [Conformance checklist](#conformance-checklist)

## Required authored definition

```ts
interface MonsterDefinition {
  id: string;
  displayName: string;
  archetype: string;
  tags: string[];
  asset: {
    kind: "procedural" | "glb" | "hybrid";
    source: string;
    license: string;
    metersPerUnit: number;
    forwardAxis: "+Z";
    provenance: string;
  };
  stats: { maxHealth: number; posture: number; moveSpeed: number; turnRate: number };
  locomotion: { radius: number; height: number; stepHeight: number };
  attacks: MonsterAttackDefinition[];
  movesets: MonsterMoveSetDefinition[];
  budgets: { nearTriangles: number; farTriangles: number; maxDrawCalls: number; maxTextures: number };
}
```

Keep content immutable at runtime. Store health, cooldowns, current target, and state timers elsewhere.

## Required rig API

```ts
interface MonsterRig {
  root: Object3D;
  joints: Map<MonsterJointId, Object3D>;
  sockets: Map<MonsterSocketId, Object3D>;
  colliders: Map<string, MonsterCollider>;
  hurtVolumes: Map<string, MonsterCollider>;
  attackVolumes: Map<string, MonsterCollider>;
  animationHooks: Map<MonsterState | string, MonsterAnimationHook>;
  lods: Map<"near" | "mid" | "far", Object3D>;
  setLod(tier: "near" | "mid" | "far"): void;
  setState(state: MonsterState, elapsed: number, context?: MonsterPoseContext): void;
  resetPose(): void;
  dispose(): void;
}
```

`root` is ground-contact/world motion. `motion` is authored local locomotion/lean. `body` owns the main anatomical hierarchy. LOD changes may alter visual children only.

## Semantic hierarchy

Every monster:

- `root`
- `motion`
- `body`
- `ground`
- `target`
- `vfx-hit`
- `vfx-death`

Humanoid or biped equivalents:

- `pelvis -> spine -> neck -> head`
- `spine -> shoulder-l -> elbow-l -> wrist-l -> hand-l`
- `spine -> shoulder-r -> elbow-r -> wrist-r -> hand-r`
- `pelvis -> hip-l -> knee-l -> ankle-l -> foot-l`
- `pelvis -> hip-r -> knee-r -> ankle-r -> foot-r`

Add `tail-*`, `wing-*`, `jaw`, `tentacle-*`, or other semantic chains only when the archetype has them. Secondary cloth, hair, chains, or dangling parts live under explicit secondary-motion pivots.

## Mandatory sockets

- `target`: lock-on/selection aim point.
- `ground`: ground projection and contact VFX.
- `vfx-hit`: generic hit reaction origin.
- `vfx-death`: defeat effect origin.
- `attack-*`: one origin per contact shape.
- `audio-*`: only when spatial origin differs materially from root.
- `attach-*`: weapons, shields, loot, or detachable modules.

Socket transforms must remain stable through state changes and all LODs.

## Collision layers

- `solid`: world/character blocking proxy.
- `navigation`: radius, height, and step profile.
- `hurt`: one or more damage-receiving volumes.
- `attack`: disabled outside the authoritative active window.
- `trigger`: perception, interaction, or effect-only.

Use capsules, spheres, boxes, or compound primitives. Never infer contact from visual mesh overlap. Store layer, owner ID, semantic part, local offset, and size.

## State and pose contract

Required states:

`idle | investigate | pursue | reposition | windup | attack | recover | stagger | defeated`

The runtime owns state and elapsed time. The rig consumes them. Minimum expected transitions:

- `idle -> investigate|pursue`
- `pursue -> reposition|windup|idle`
- `windup -> attack|stagger`
- `attack -> recover`
- `recover -> pursue|reposition|idle`
- `* -> stagger` when interrupt rules permit
- `* -> defeated` when health reaches zero

`setState` must be deterministic for `(state, elapsed, context)` and reset all modified transforms before applying a pose.

## Attack definition

```ts
interface MonsterAttackDefinition {
  id: string;
  startup: number;
  active: number;
  recovery: number;
  cooldown: number;
  range: [number, number];
  arcDegrees: number;
  contact: {
    socket: string;
    shape: "sphere" | "capsule" | "box" | "sweep";
    size: [number, number, number];
  };
  damage: number;
  postureDamage: number;
  facingLock: "startup" | "active" | "none";
  interruptible: { startup: boolean; active: boolean; recovery: boolean };
}
```

Apply each contact once per stable `(actionId, targetId)`. The renderer may preview the volume but does not resolve the hit.

## Moveset definition and sampler

```ts
interface MonsterMoveSetDefinition {
  id: string;
  displayName: string;
  description: string;
  range: [number, number];
  loop: boolean;
  loopDelay: number;
  tags: string[];
  steps: Array<
    | { type: "intent"; label: string; state: "idle" | "investigate" | "pursue" | "reposition"; duration: number }
    | { type: "attack"; label: string; attackId: string; recoveryExtra?: number }
  >;
}
```

The moveset owns ordering and intent durations. Attack definitions remain the only source for startup, active, recovery, contact, damage, and interrupt timing.

Compile each attack step into `windup -> attack -> recover`. Provide a pure sampler:

```ts
sampleMoveSet(movesetId, elapsed) => {
  state,
  attackId,
  normalized,
  active,
  interruptible,
  phaseIndex,
  cycle,
  actionId
}
```

One attack keeps one stable action ID across startup, active, and recovery. A repeated loop gets a new action ID. Every phase must have a queryable frozen fixture, and tests must cover the samples immediately before, at, and after each active-window boundary.

## LOD and performance

- Near: full silhouette, material channels, secondary motion, and all identity geometry.
- Mid: remove micro fasteners/straps, reduce radial segments, retain hands/head/weapon silhouette.
- Far: merge static visual groups and simplify materials; retain root/joint/socket/collider maps.

Default browser target for one standard enemy:

- near triangles `<= 50k`
- far triangles `<= 12k`
- draw calls `<= 48` before renderer-level batching
- textures `<= 12`, generally 1024px
- steady 60 fps-class frame pacing at intended encounter density

Override only with an explicit boss/hero budget.

## Conformance checklist

- Content definition and runtime state are separate.
- Rig has real parented joint chains, not a flat list of named pivots.
- Required sockets exist and stay stable.
- Solid, navigation, hurt, attack, and trigger layers are explicit.
- Required states and at least one attack pose are deterministic.
- Every authored attack is reachable through a moveset or an explicit standalone fixture.
- Moveset phases are contiguous, queryable, and deterministic.
- Stable action IDs persist through one attack and renew on the next attack/loop.
- Attack contacts are authoritative and idempotent.
- Death disables attack volumes and preserves cleanup/disposal.
- Near/mid/far LOD switches preserve gameplay transforms.
- Reset returns every joint/material state to rest.
- Browser test covers camera distance, animation, collision debug, LOD, and performance.
