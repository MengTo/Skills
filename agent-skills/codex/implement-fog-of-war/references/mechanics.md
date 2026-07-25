# Fog-of-war mechanics

## Contents

1. [System contract](#system-contract)
2. [Proven Vesperfall source map](#proven-vesperfall-source-map)
3. [Obstacle and perception model](#obstacle-and-perception-model)
4. [Angular visibility lookup](#angular-visibility-lookup)
5. [Full-screen overlay](#full-screen-overlay)
6. [Proven calibration](#proven-calibration)
7. [Frame update and lifecycle](#frame-update-and-lifecycle)
8. [Gameplay mechanics](#gameplay-mechanics)
9. [Lighting and atmosphere](#lighting-and-atmosphere)
10. [Telemetry](#telemetry)
11. [Failure modes](#failure-modes)

## System contract

Use one source of truth:

```text
active obstacle proxies
  -> point-to-point perception -> AI, attacks, target lock, presentation
  -> angular visible distances -> 1D lookup texture -> fog shader
```

The shader visualizes perception. It does not decide whether an enemy can see, attack, or be targeted.

The proven implementation uses an orthographic Three.js camera, but the ownership model applies to other camera types. Only the ground reconstruction changes.

Its four-corner reconstruction assumes that the visible gameplay region is locally horizontal at the player's ground Y. For sloped or multi-level terrain, reconstruct world position from the authoritative surface, a depth buffer, or terrain intersection instead of stretching one plane across the screen.

## Proven Vesperfall source map

Use the current repository as authority before reusing this snapshot:

| Surface | Responsibility |
| --- | --- |
| `app/vesperfall-perception.ts` | Shared obstacle intersection, point perception, angular distance fill, and vision constants |
| `app/vesperfall-fog-of-war.ts` | Lookup texture, ground reconstruction, shader, throttled update, and disposal |
| `app/vesperfall-estate-world.ts` | Authoritative active obstacle proxies, including dynamic gate blockers |
| `app/VesperfallCampaign.tsx` | Camera and scene integration, state gate, enemy visibility, targeting, telemetry, and lifecycle |
| `app/vesperfall-lighting.ts` | Shadowless world-light constraint that leaves visibility to fog and line of sight |
| `tests/fog-of-war.test.ts` | Fog math, calibration, spoke prevention, and bounded-renderer contracts |
| `tests/perception.test.ts` | Range, wall, gate, low-cover, extended enemy vision, and deterministic-ray contracts |
| `tests/vfx-lighting.test.ts` | Lighting ownership, single renderer, and cleanup contracts |

The implemented sequence was:

1. Add wall-aware fog and shared enemy perception.
2. Extend enemy sight beyond the player's reveal edge while retaining wall occlusion.
3. Feather angular wall fog and reduce its weight until visible spokes disappeared.

## Obstacle and perception model

Represent a sight blocker as:

```ts
type SightObstacle = {
  id: string;
  x: number;
  z: number;
  radius: number;
  minY: number;
  maxY: number;
  active: boolean;
};
```

The circular XZ footprint is a conservative proxy for walls, pillars, props, and gate segments. The vertical span prevents knee-high cover from blocking an eye-level sight line.

For each ray or segment:

1. Skip inactive obstacles.
2. Expand the radius and vertical span by a small padding.
3. Solve the horizontal ray-circle quadratic.
4. Test both near and far non-negative roots.
5. Evaluate the ray height at each candidate distance.
6. Accept only hits inside the obstacle's vertical span.
7. Return the nearest hit or the requested maximum distance.

Handle these edge cases explicitly:

- a ray with almost no horizontal direction;
- an origin already inside the footprint and vertical span;
- a zero-length point-to-point query;
- a negative range or padding;
- a hit exactly at the target distance;
- inactive gates.

Use one point-to-point API:

```ts
type PerceptionResult = {
  distance: number;
  withinRange: boolean;
  lineOfSightClear: boolean;
  visible: boolean;
};
```

Set `visible = withinRange && lineOfSightClear`. Keep the component booleans because AI, attacks, and telemetry need to distinguish range loss from occlusion.

## Angular visibility lookup

Allocate a `Float32Array` with one element per ray. For index `i` of `N`:

```ts
const angle = (i / N) * Math.PI * 2;
const directionX = Math.cos(angle);
const directionZ = Math.sin(angle);
```

Cast from the player's eye height with zero vertical direction. Store the first obstacle distance or player vision radius.

Encode the normalized distances into a one-row `THREE.DataTexture`:

- pixels: `Uint8Array`;
- format: `THREE.RedFormat`;
- type: `THREE.UnsignedByteType`;
- min and mag filter: `THREE.LinearFilter`;
- horizontal wrap: `THREE.RepeatWrapping`;
- vertical wrap: `THREE.ClampToEdgeWrapping`;
- mipmaps: disabled.

Horizontal repeat wrapping makes the `0/2π` seam continuous. Linear filtering interpolates adjacent ray distances but does not remove all spoke artifacts on its own.

Reuse the array, pixels, and texture. Set `needsUpdate` only after rewriting pixels.

## Full-screen overlay

Use a plane spanning clip space:

```glsl
gl_Position = vec4(position.xy, 0.0, 1.0);
```

For each of the four NDC corners:

1. Unproject a near point at `z = -1`.
2. Unproject a far point at `z = 1`.
3. Intersect the segment with a horizontal plane at the player's current ground Y.
4. Store the resulting world XZ coordinate in a uniform.

In the fragment shader, bilinearly interpolate the four ground corners from the plane UV. Compute:

```glsl
vec2 offset = worldXZ - playerWorldXZ;
float distanceToPlayer = length(offset);
float angle = fract(atan(offset.y, offset.x) / TWO_PI + 1.0);
```

### Radial component

Keep the inner radius clear, then fade visibility to zero at the player vision radius:

```text
radialVisibility = 1 - smoothstep(clearRadius, visionRadius, distance)
radialFog = 1 - radialVisibility
```

### Obstacle component

Sample the lookup distance at the fragment angle and feather around that hit distance:

```text
obstacleVisibility =
  1 - smoothstep(hitDistance - edgeSoftness,
                 hitDistance + edgeSoftness,
                 distance)
```

Use five angular taps around the fragment angle:

```text
offsets: -2, -1, 0, +1, +2
weights: .08, .24, .36, .24, .08
```

Choose the angular step as the larger of one texture texel and a world-space softness projected to angular space:

```text
max(1 / rayCount,
    angularSoftness / max(distanceToPlayer, 2) / (2 * TWO_PI))
```

This widens angular smoothing near the player, where sparse rays create the most obvious spokes, while keeping distant boundaries legible.

### Composition

Use:

```text
obstacleFog = (1 - obstacleVisibility) * obstacleDarkness
alpha = maximumOpacity * max(radialFog, obstacleFog)
```

Do not use the original hard composition:

```text
alpha = maximumOpacity * (1 - min(radialVisibility, obstacleVisibility))
```

The hard composition gives wall occlusion the same darkness as the outer radial boundary and exposes each angular ray as a dark wedge.

Configure the overlay:

- transparent;
- depth test off;
- depth write off;
- tone mapping off;
- frustum culling off;
- very late render order;
- one geometry and one shader material.

## Proven calibration

The current Vesperfall calibration is:

| Parameter | Value | Purpose |
| --- | ---: | --- |
| Player vision radius | 14 | Outer reveal range |
| Enemy vision radius | 18 | Lets enemies acquire beyond player reveal |
| Player eye height | 1.18 | Sight origin above ground |
| Obstacle padding | 0.08 | Stabilizes edge contacts |
| Clear radius | 11.25 | Fully readable inner play area |
| Edge softness | 1.35 | Soft radial and wall boundary |
| Angular softness | 1.8 | Removes visible spokes |
| Obstacle darkness | 0.32 | Keeps wall fog subtle |
| Maximum opacity | 0.38 | Restrains outer darkness |
| Desktop rays | 192 | Higher-detail angular lookup |
| Mobile rays | 128 | Mobile budget |
| Allowed ray clamp | 32–256 | Prevents pathological settings |
| Update interval | 0.08 s | Caps stationary refresh cost |
| Movement threshold | 0.08 units | Refreshes promptly after movement |
| Fog color | `0x07101a` | Dark blue-black overlay |

These values are a proven baseline, not universal constants. Preserve their relationships:

- desktop rays exceed mobile rays;
- player clear radius is below player vision radius;
- enemy vision may exceed player vision but still respects walls;
- obstacle fog remains much lighter than maximum radial fog;
- maximum opacity stays readable rather than approaching black.

At the proven values, full wall occlusion contributes about `0.38 * 0.32 = 0.1216` alpha while the outer range reaches `0.38`.

## Frame update and lifecycle

On every enabled frame:

1. Update overlay visibility.
2. Update the player XZ uniform.
3. Update camera matrices.
4. Recompute the four ground-plane corner uniforms.
5. Accumulate non-negative delta time.
6. Recompute angular distances if the player moved at least `0.08` units or `0.08` seconds elapsed.
7. Normalize, quantize, and upload the lookup.

Update the player and camera uniforms even when the CPU lookup is throttled. The overlay still has to follow camera and player motion smoothly.

Enable fog only when all gameplay conditions pass. The proven state gate requires:

- menu hidden;
- inventory closed;
- no review mode;
- game state playing;
- no active stage transition.

Hide the overlay at the start of the frame before early menu or capture rendering. This prevents a previously enabled frame from appearing over a transparent character-select render.

Keep atmospheric `THREE.Fog` or `THREE.FogExp2` separate. Atmospheric fog affects world materials by distance from the camera; fog of war is a player-centered visibility mask.

On teardown:

- remove the overlay from the scene;
- dispose geometry;
- dispose shader material;
- dispose data texture.

## Gameplay mechanics

### Player and enemy asymmetry

Evaluate player reveal with the player range. Evaluate enemy acquisition with the enemy range. A monster may begin pursuing from outside the player's reveal edge when it has a clear sight line. Walls must still block both.

This asymmetry produces pressure at the edge of visibility without making walls meaningless.

### Presentation versus simulation

Keep actor-root visibility for stage membership, death, spawning, and lifecycle. Hide unseen renderable descendants with render layers or another presentation-only system. Preserve each descendant's base layer mask so it restores exactly.

Include meshes, lines, points, sprites, and lights. Hide enemy telegraphs when the enemy is unrevealed.

Never write perception into `enemy.root.visible` when simulation or roster code consumes that property.

### Targeting and combat

Require player perception for:

- lock-on target validity;
- nearest-target acquisition;
- pointer or ray target eligibility;
- retaliation target selection;
- player-facing enemy counts;
- player attacks that require an exposed target.

Clear target lock when a target becomes occluded or leaves player range.

Require line of sight for enemy attacks and acquisition. Use enemy range for pursuit. Continue to simulate unrevealed enemies so pursuit, return, death, and damage state remain coherent.

### Per-frame caching

Cache one perception sample per enemy within a simulation phase. Clear and recompute after movement if later systems require final-frame positions. This avoids repeated obstacle scans while preventing stale targeting.

## Lighting and atmosphere

Do not let a second visual system compete with fog of war:

- keep broad moon or world key lighting shadowless when projected shadows create distracting visibility bands;
- use motivated local lights for readability;
- let fog of war and line of sight own gameplay visibility;
- do not add decorative radial light rays that resemble the fog lookup.

Lighting should make the visible area readable without revealing hidden enemies through attached lights or telegraphs.

## Telemetry

Publish compact, DOM-readable diagnostics:

- fog enabled state;
- selected ray count;
- player vision radius;
- enemy vision radius;
- visible enemy IDs;
- target player-visible state;
- target enemy-can-see-player state;
- target line-of-sight state;
- target distance;
- target return reason.

Telemetry makes browser validation deterministic without coupling production logic to the test harness.

## Failure modes

### Visible spokes

Cause: one angular lookup sample controls a fully dark wall wedge.

Fix: increase wall-edge softness, add five-tap angular smoothing, and reduce obstacle darkness. Preserve full radial darkness only at the outer vision range.

### Angle seam

Cause: clamped horizontal texture wrapping or inconsistent angle normalization.

Fix: use repeat wrapping and normalize angles with `fract(angle + 1)`.

### Fog slides during camera motion

Cause: screen-space radius or stale ground-corner uniforms.

Fix: reconstruct world XZ from the camera corners every enabled frame.

### Fog distorts across elevation

Cause: one player-height plane is being stretched over sloped or multi-level terrain.

Fix: reconstruct against the authoritative walkable surface, terrain, or depth data. Do not ship the flat-plane shortcut where gameplay elevation is visible.

### Gates remain opaque after opening

Cause: perception uses a copied or disconnected blocker list.

Fix: consume the authoritative runtime obstacle objects and toggle their `active` state with the gate.

### Enemies freeze or disappear permanently

Cause: actor-root visibility is being used as player perception.

Fix: preserve actor-root lifecycle visibility and hide only renderable descendants.

### Low props block sight

Cause: the intersection checks only XZ.

Fix: evaluate hit Y against the obstacle's vertical span.

### Fog leaks into menus or captures

Cause: the overlay is disabled after an early render branch.

Fix: hide it before branches and gate it explicitly by state.

### Performance regresses

Cause: per-ray meshes, per-frame allocations, a second renderer, or post-processing.

Fix: retain one fixed array, one byte texture, one full-screen shader, and a movement/time-throttled CPU fill.
