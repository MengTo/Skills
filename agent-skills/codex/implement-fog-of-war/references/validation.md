# Fog-of-war validation

## Contents

1. [Validation order](#validation-order)
2. [Pure perception tests](#pure-perception-tests)
3. [Fog math tests](#fog-math-tests)
4. [Structural contracts](#structural-contracts)
5. [Gameplay integration tests](#gameplay-integration-tests)
6. [State and lifecycle tests](#state-and-lifecycle-tests)
7. [Browser verification](#browser-verification)
8. [Performance verification](#performance-verification)
9. [Current Vesperfall proof](#current-vesperfall-proof)
10. [Completion evidence](#completion-evidence)

## Validation order

Run validation from cheapest to most integrated:

1. Pure perception math.
2. Pure fog visibility and opacity math.
3. Source or AST structural contracts.
4. Gameplay integration tests.
5. Lint and production build.
6. Desktop browser verification.
7. Mobile/coarse-pointer browser verification.
8. Performance sampling.

Do not tune the shader around a broken obstacle test.

## Pure perception tests

Use small synthetic obstacle fixtures. Cover:

- an unobstructed target exactly at the player range;
- a target just outside the player range;
- enemy range greater than player range;
- a target between the player and enemy ranges;
- the same target blocked by a wall;
- an active full-height wall;
- the same gate obstacle inactive;
- low cover below the sight line;
- an origin inside an obstacle;
- a zero-length query;
- negative range or padding clamped safely;
- deterministic repeated angular fills;
- an angular ray that hits a known wall distance;
- an angular ray with no hit returning the maximum range.

Assert `withinRange` and `lineOfSightClear` separately. A single `visible` assertion cannot explain why a case failed.

## Fog math tests

Keep the math callable outside WebGL.

### Radial visibility

Assert:

- a point well inside the clear radius has visibility `1`;
- a point between clear and vision radii is strictly between `0` and `1`;
- a point outside vision radius has visibility `0`.

### Wall boundary

For a known wall hit distance, assert:

- visibility before the wall exceeds visibility at the feather;
- feather visibility exceeds visibility behind the wall;
- sufficiently far behind the wall reaches zero obstacle visibility.

### Opacity composition

Assert:

- clear inner-space opacity is `0`;
- wall-edge opacity is above clear opacity;
- behind-wall opacity exceeds wall-edge opacity;
- behind-wall opacity stays restrained;
- beyond-range opacity equals maximum opacity;
- angular softness remains large enough to prevent spokes;
- obstacle darkness remains bounded.

For the proven Vesperfall calibration, behind-wall opacity should remain at or below `0.14`, while the outer radial boundary reaches `0.38`.

## Structural contracts

Protect the bounded renderer architecture:

- exactly one fog `ShaderMaterial`;
- no fog-specific `WebGLRenderer`;
- no `EffectComposer`;
- no `WebGLRenderTarget`;
- no per-ray meshes;
- one full-screen plane;
- one data texture;
- desktop ray count greater than mobile;
- desktop ray count no greater than `256`;
- mobile ray count at least `96`;
- maximum opacity in a restrained range such as `0.28–0.42`;
- five neighboring angular samples present;
- radial and obstacle fog combined with `max`;
- no allocations inside the hot update loops beyond ephemeral scalar or stack values.

Prefer semantic tests of exported functions. Use source contracts only for architecture that is otherwise expensive to instantiate under Node.

## Gameplay integration tests

Protect these behaviors:

- player-visible enemies can be selected and locked;
- enemies outside player range cannot be selected;
- walls invalidate player targeting;
- losing perception clears target lock;
- hidden enemies do not contribute to player-facing enemy counts;
- hidden telegraphs do not render;
- actor roots stay simulation-visible;
- presentation layer masks change instead of actor-root visibility;
- base layer masks restore when visibility returns;
- enemy perception uses enemy range;
- enemies can acquire between player and enemy ranges;
- walls still block extended enemy vision;
- enemy attacks require a clear sight line when intended;
- dynamic gates update both fog and AI perception.

Test enemy presentation independently from enemy simulation. An enemy behind fog may continue pursuing, returning, taking damage, or dying according to game rules.

## State and lifecycle tests

Assert that fog:

- enables during normal active gameplay;
- disables in the character menu;
- disables with inventory open;
- disables in review and capture modes;
- disables while the game is not playing;
- disables during stage transitions;
- cannot leak through an early menu render;
- restores after returning to gameplay;
- updates after camera resize;
- disposes its geometry, material, and texture exactly once.

If atmospheric scene fog also changes across these states, test it separately.

## Browser verification

Use the Codex browser, never Chrome.

Use normal gameplay if review modes intentionally disable fog. If a dedicated fog fixture exists, confirm that it does not bypass perception or fog state.

### Desktop

1. Enter gameplay and verify the inner combat area remains clear.
2. Walk toward the outer reveal edge and confirm a smooth radial fade.
3. Circle a pillar or wall and watch the boundary move.
4. Stop near a wall and look for dark angular spokes.
5. Cross the `0/2π` direction around the player and look for a seam.
6. Open and close a gate; confirm occlusion follows its active state.
7. Let an enemy move behind cover; confirm its model and telegraph hide without freezing its simulation.
8. Lose and regain target lock through a wall.
9. Open inventory and the character menu; confirm no overlay leak.
10. Trigger a stage transition and return to gameplay.

### Mobile or coarse pointer

Repeat the visibility checks at the mobile ray budget. Confirm:

- no obvious new spokes;
- no seam;
- no fog lag while walking;
- stable frame pacing;
- the published ray count matches the mobile budget.

### Telemetry read-back

Read the live canvas dataset or equivalent diagnostics and capture:

- `fogOfWarEnabled`;
- `fogOfWarRays`;
- `playerVisionRadius`;
- `enemyVisionRadius`;
- `visibleEnemyIds`;
- target visibility;
- enemy-can-see-player;
- line of sight;
- target distance;
- return reason.

Use telemetry as supporting evidence, not as a substitute for looking at the rendered result.

## Performance verification

Verify:

- one renderer and one animation loop;
- stable draw-call increase from a single overlay;
- fixed texture width;
- no frame-loop geometry, material, texture, or renderer construction;
- CPU visibility recalculation no more often than the movement/time gate;
- camera and player uniforms still update smoothly between lookup refreshes;
- desktop and mobile ray counts remain bounded;
- disposal removes GPU resources;
- no post-processing was added only for fog.

Profile while moving near obstacle-dense areas. A stationary empty scene is not representative.

## Current Vesperfall proof

The current targeted command is:

```bash
node --import tsx --test \
  tests/fog-of-war.test.ts \
  tests/perception.test.ts \
  tests/vfx-lighting.test.ts
```

It covers:

- radial and wall opacity math;
- five-tap angular smoothing and restrained wall darkness;
- desktop/mobile ray budgets;
- one overlay without composer, render target, or second renderer;
- player and extended enemy ranges;
- active walls, inactive gates, and low cover;
- deterministic angular fills;
- layer-based enemy presentation;
- shadowless moonlight and visibility ownership;
- renderer, animation-loop, and cleanup boundaries.

Also run the repository's lint, build, and broader test commands before shipping a change. Keep targeted proof separate from full-suite or live-deployment proof.

## Completion evidence

Report:

- changed files;
- constants or formulas changed and why;
- pure test results;
- integration test results;
- lint result;
- build result;
- desktop browser state tested;
- mobile browser state tested;
- telemetry values observed;
- performance observations;
- known baseline failures kept separate;
- commit and deployment proof when the project requires them.

Do not claim visual success from unit tests alone. Do not claim live success from a local build.
