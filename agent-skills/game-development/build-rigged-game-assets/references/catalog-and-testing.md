# Asset catalog and testing contract

## Contents

- Catalog surfaces
- Inspector controls
- Runtime telemetry
- Automated tests
- Browser acceptance
- Reporting

## Catalog surfaces

| Surface | Required behavior |
|---|---|
| Card | Transparent PNG, natural dimensions, truthful source/status label, zero canvas |
| Selected inspector | Exactly one live runtime model canvas plus loading fallback |
| Review/moveset route | Stable URL, scrollable page, action and actor-specific controls |
| Provenance | Reference, source/runtime files, generator/import type, task IDs, status, known boundaries |
| Budget | Source/runtime bytes and triangles, meshes, materials, textures, bones, actions, sockets |

The card image and runtime inspector are different artifacts. Do not replace the real model with a turntable render or initialize a renderer in every catalog grid card.

## Inspector controls

Common:

- action button for every shipped clip;
- visible Walk/locomotion, Hit, and Death controls;
- selected and playing action states;
- restart and pause/play;
- horizontal drag-to-rotate with `touch-action: pan-y` or equivalent;
- fallback image until model readiness;
- loading/error state that does not leave a blank canvas.

Character:

- one toggle for every declared equipment slot;
- active/stowed state controls when gameplay supports them;
- clean individual-off and all-off states;
- no incidental gameplay prop unless the inspector labels and controls it.

Monster:

- action and combat-state controls;
- attack telegraph/active/recovery or deterministic contact visualization when useful;
- no empty player-equipment panel.

## Runtime telemetry

Expose stable DOM or runtime metadata sufficient for deterministic read-back:

- model readiness and source/provenance type;
- actor ID, kind, and delivery status;
- canvas count;
- source/runtime triangle counts;
- mesh, material, texture, bone, socket, and action counts;
- current action and play/pause state;
- drag rotation enabled, current yaw, and dragging state;
- character visible-equipment list or monster combat state;
- removed/hidden geometry count when cleaning fused sources;
- failure/fallback state.

Telemetry must describe real runtime state, not copy hard-coded marketing text.

## Automated tests

Add deterministic checks for:

1. Manifest schema, required roles, unique IDs, supported slots, and verified gates.
2. Exact source/runtime/catalog/action/equipment paths and shipped-file existence.
3. PNG signature, dimensions, alpha channel, and bounded size.
4. GLB/FBX format, file budget, mesh/material/texture/skin counts, finite attributes, and triangle count.
5. Skeleton identity, required bones/sockets, maximum skin influences, and bind-pose integrity.
6. One action per animation-only file, expected clip name, no render mesh, duration, loop, and contact events.
7. Character equipment visibility, active/stowed sockets, all-off cleanup, and underlayer behavior.
8. Monster attack roles, authoritative windows, hurt/attack volumes, interruption, death, and cleanup.
9. Runtime loader/factory integration, disposal, rollback, and truthful catalog status.
10. Catalog card/no-canvas, inspector/one-canvas, stable review URL, control inventory, scroll, and drag contracts.

Record both that the full suite ran and that it either passed or only retained
documented pre-existing failures. Do not mark an unrelated baseline as an asset
failure, and do not hide it.

Run:

- `python3 scripts/validate_asset_manifest.py <manifest> --root <repo> --require-verified`;
- focused asset tests;
- build;
- lint;
- full tests;
- `git diff --check`.

Report unrelated baseline failures separately; do not relabel them as caused by the asset.

## Browser acceptance

Use the repository-approved browser. For Vesperfall, use the Codex in-app browser.

Verify:

- card PNG loads, remains transparent, and card has zero canvases;
- preview navigation lands on the exact route;
- one intended model host and canvas become ready;
- action count and action labels match the manifest;
- every action changes current/playing state and visibly animates;
- restart and pause/play work;
- every character equipment slot toggles independently;
- character all-off state has zero visible equipment and no fragments from front, back, left, or right;
- active/stowed equipment appears only in its intended state and socket;
- monster controls expose the declared combat actions without character gear UI;
- page scroll changes actual document scroll;
- horizontal drag changes yaw and vertical touch scrolling remains available;
- desktop and supported narrow/mobile layouts have no horizontal overflow or clipped controls;
- fallback/error states are readable;
- no broken media, duplicate canvas, or console warning/error.

Capture at least:

- default equipped or idle view;
- character all-off view or monster primary-attack view;
- rotated rear/side view;
- narrow/mobile view when supported.

Keep the final review tab open only when the user needs to inspect it.

## Reporting

Report:

- manifest path and actor kind/status;
- reference/source/main/runtime/catalog paths;
- model budgets and optimization delta;
- skeleton ID, bones, sockets, and colliders;
- action IDs/roles and clip sources;
- character equipment slots/assets/states or monster attacks/windows;
- catalog route and inspector controls;
- focused/full test, build, lint, diff, and browser proof;
- known source inference or underlayer boundaries;
- exact commit and deployment state.
