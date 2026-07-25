# Vesperfall Map Editor Implementation

Use this reference only after locating the current repository root and rechecking the files. Paths, schema versions, entity counts, release versions, and deployment configuration can change.

## Purpose and boundary

The Vesperfall Map Editor is a private, paused director view of the authored estate.

- Route: `/map-editor`
- Input: current production placements and settings
- Draft store: browser local storage
- Output: validated JSON proposal
- Production effect: none until a separate source-code integration is reviewed, tested, committed, and released
- Gameplay plane: X/Z with Y fixed at `0`

Do not describe the editor as a live level database, multiplayer editor, game save, or automatic publisher.

## Source map

Read these files before changing the editor:

- `app/map-editor/page.tsx`: dynamic server gate and authorized editor entry
- `app/map-editor/editor-auth.ts`: IP allowlist, password comparison, signed IP-bound session
- `app/map-editor/auth/route.ts`: password POST and secure cookie creation
- `app/map-editor/logout/route.ts`: cookie invalidation
- `app/map-editor/vesperfall-map-document.ts`: production adapters, schema, types, validator
- `app/map-editor/VesperfallMapEditor.tsx`: Three.js director scene, interactions, draft lifecycle, and UI
- `app/map-editor/map-editor-camera.ts`: deterministic focus and reduced-motion behavior
- `app/map-editor/map-editor-icons.ts`: canonical PNG resolver
- `app/map-editor/map-editor.module.css`: desktop editor shell and gate styling

Follow production ownership into:

- `app/vesperfall-content.ts`
- `app/vesperfall-checkpoint.ts`
- `app/vesperfall-enemies.ts`
- `app/vesperfall-estate.ts`
- `app/vesperfall-enemy-zones.ts`
- `app/vesperfall-world-expansion.ts`
- `app/vesperfall-estate-world.ts`
- `app/vesperfall-item-icons.ts`
- `app/VesperfallGame.tsx`

Use `$author-game-levels` for level-content changes and `$tune-enemy-ai` for gameplay AI tuning. The map-editor skill owns the editing surface and draft boundary, not the full level or AI design.

## Current document contract

The current document uses:

- schema `vesperfall-map-editor`
- version `1`
- estate version `3`
- local key `vesperfall.map-editor.v1`
- history limit `50`
- entity cap `500`
- coordinate limit `abs(x|z) <= 200`
- entity kinds `enemy`, `player-spawn`, `pickup`, `interactable`, and `gate`

Initial entities are derived from production:

- enemies from `ESTATE_ENEMY_PLACEMENTS`, stage enemy kinds, archetypes, and enemy-zone anchors;
- player starts from every stage plus the sword-fire checkpoint;
- world pickups plus one rite reward per stage;
- estate interactables;
- estate gates.

Enemies begin with production aggro and leash values. Patrol settings are draft-only unless deliberately integrated into the runtime source.

The validator rejects duplicate IDs, unknown kinds, non-finite transforms, nonzero Y, out-of-range X/Z, invalid aggro values, and unknown patrol modes. Import additionally requires the entity ID manifest to match the currently loaded estate.

## Current interaction contract

- Select in the viewport or outliner.
- Selection focuses the entity without reducing an already-close zoom.
- Drag a selected proxy on the ground plane.
- Snap options are off, `0.1`, `0.25`, `0.5`, and `1` meter.
- Wheel zoom is clamped.
- Middle-drag, right-drag, or Space-drag pans.
- `F` fits the estate.
- `Cmd/Ctrl+Z` undoes; `Shift+Cmd/Ctrl+Z` redoes.
- Fit all and fit zone are explicit actions.
- Search matches label, source ID, and zone.
- Layer toggles cover enemies, player starts, items, interactables, and gates.

Selected enemies show facing, aggro, leash, patrol radius, or patrol path overlays. The inspector edits X, Z, facing, awareness timings, patrol mode and radius or points, and leash bounds. Utility entity source settings remain read-only.

A drag writes one history snapshot when it ends. Local persistence begins only after the restore attempt, preventing the production document from overwriting a valid stored draft during initialization.

## Current visual contract

The scene reuses `buildEstateWorld({ directorMode: true })` and production fighter or procedural enemy visuals. Every entity also receives:

- a layer-colored ground marker;
- a canonical PNG sprite;
- an invisible selection proxy;
- one root group for transform and visibility.

Canonical editor icons resolve from shipped enemy catalog cards, class portraits, checkpoint and item icons, prompt icons, and explicit fallbacks. New entity kinds or IDs must resolve to an existing PNG and pass the icon tests.

Camera focus targets:

- enemy `4.1`
- player spawn `4.4`
- pickup `4.8`
- interactable `4.6`
- gate `4.1`

Focus is capped at zoom `5`, lasts `420 ms`, and becomes immediate for reduced motion.

## Current access contract

Deployment secrets:

- `VESPERFALL_MAP_EDITOR_PASSWORD`
- `VESPERFALL_MAP_EDITOR_ALLOWED_IPS`

The editor fails closed if either is absent. The allowlist is comma-separated and exact. The server prefers `cf-connecting-ip`, then the first `x-forwarded-for` value, then `x-real-ip`.

The session:

- uses cookie `__Host-vesperfall-map-editor`;
- lasts 12 hours;
- carries version, expiration, and normalized IP claims;
- is HMAC-SHA256 signed with the configured password;
- is secure, HTTP-only, strict same-site, and path `/`.

Unauthorized responses render the branded gate and no canvas. Metadata must remain `noindex, nofollow`. Never print or snapshot real secret values.

## Verification

Run the focused TypeScript tests:

```bash
node --import tsx --test \
  tests/map-editor-document.test.ts \
  tests/map-editor-camera.test.ts \
  tests/map-editor-icons.test.ts \
  tests/map-editor-auth.test.ts
```

Build before the rendered server test:

```bash
npm run build
node --test tests/map-editor-rendered.test.mjs
```

Then run:

```bash
npm test
npm run lint
git diff --check
```

Use only the Codex in-app browser for Vesperfall browser proof. Verify:

- fail-closed configuration and no-index markup without secrets;
- denied-IP and password-gate states where safely testable;
- the authorized editor without exposing credentials;
- canonical logo and entity artwork;
- selection focus, pan, zoom, frame, layer toggles, search, drag, snap, inspector, overlays, undo, redo, import, export, reset, persistence, and logout;
- desktop and narrow layouts supported by the implementation;
- console health and cleanup after leaving the route.

For a Vesperfall runtime change, follow the repository's current narrow-commit, exact-source release, Sites deployment, succeeded-status polling, and production-route verification process. Do not deploy a global skill-only update because it does not change the Vesperfall runtime.
