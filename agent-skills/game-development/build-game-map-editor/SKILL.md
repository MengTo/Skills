---
name: build-game-map-editor
description: Build, extend, or audit production-linked browser map editors for Three.js and isometric games. Use when Codex needs to create a private director view, derive a versioned editor document from authored placements, add outliner, layer, selection, drag, snap, inspector, or camera controls, expose enemy aggro, leash, or patrol overlays, implement local draft import, export, undo, and reset, secure an editor route with IP and password sessions, or validate and release a map editor without mutating live gameplay data.
---

# Build Game Map Editor

Build a paused director tool around the real game world. Let designers inspect and draft placements quickly while keeping production data, gameplay saves, and release integration explicit.

## Establish the authority boundary

Inspect the repository before designing the editor:

- Locate authoritative world, zone, encounter, spawn, pickup, gate, interactable, and enemy-AI definitions.
- Locate the production world builder and reusable runtime assets.
- Locate collision, navigation, flat-plane, persistence, and deployment contracts.
- Identify the repository-approved browser, tests, release path, and access-control requirements.

Do not create an independent map source of truth. Derive the initial editor document from production definitions through adapters. Keep stable source IDs so every draft value can be traced back to authored code.

State the lifecycle in the UI and implementation:

`production source -> editor document -> isolated draft -> validated export -> reviewed source integration`

Treat export as a proposal. Do not claim that a draft changes gameplay until a separate integration updates authoritative source, passes gameplay tests, is committed, and is released.

## Define a versioned editor document

Use a small serializable document instead of storing Three.js objects or React state.

Include:

- a fixed schema identifier and document version;
- a world or level version;
- a save timestamp;
- stable entity `id`, `sourceId`, `kind`, label, zone, position, facing, and typed settings;
- explicit entity kinds such as enemy, player spawn, pickup, interactable, and gate.

Keep editor position data on the gameplay plane. For a flat-world game, use `{ x, y: 0, z }` and reject nonzero Y rather than silently flattening imported data.

Validate at every import and integration boundary:

- require the exact schema and supported version;
- cap document size, file size, entity count, coordinates, and setting ranges;
- reject duplicate IDs, non-finite values, unknown kinds, invalid bounds, and malformed nested settings;
- require the imported entity manifest to match the current production manifest unless entity creation or deletion is an explicit feature;
- preserve source IDs and zone ownership through edits.

Keep detailed game-specific adapters and limits outside the reusable editor component.

## Render a paused director scene

Reuse the production world builder in a deliberate director or preview mode. Do not run combat, progression, persistence, enemy simulation, or live save mutations inside the editor.

- Prefer an orthographic top-down camera for isometric or flat-world placement.
- Render production geometry, canonical entity visuals, and canonical icons when available.
- Add simple fallbacks when heavy assets fail, but label them as fallbacks.
- Give each entity one root group, a visible marker, an icon or reference sprite, and a separate invisible selection proxy.
- Raycast proxies for reliable selection and raycast a fixed ground plane for dragging.
- Apply transform edits to X, Z, and facing while keeping Y locked.
- Dispose geometries, materials, textures, renderers, animation frames, observers, and event listeners on teardown.

Keep visual layers independent from editor data. Layer visibility may hide roots and overlays, but it must not delete or rewrite entities.

## Make navigation and selection predictable

Provide:

- click-to-select and select-to-focus;
- outliner search by label, source ID, and zone;
- kind layers with visible object counts;
- fit-all and fit-zone actions;
- wheel zoom with project-specific limits;
- middle-, right-, or Space-drag pan;
- an `F` shortcut to frame the map;
- reduced-motion-aware camera focus.

Focus the selected point and zoom in enough to identify it. Never zoom out when focusing an entity the user is already viewing closely. Cancel focus animation when the user starts manual camera input.

Keep pointer gestures atomic:

- capture the pointer during drag or pan;
- preserve the entity-to-pointer offset;
- snap X and Z using the selected increment;
- update the draft during drag;
- create one undo entry when the drag ends, not one entry per pointer move;
- treat a click without movement as selection and focus.

## Expose gameplay meaning in the inspector

Show identity, canonical asset path, source ID, zone, position, facing, and source settings for every entity.

For enemies, expose only settings that have a clear gameplay contract:

- aggro radius and acquisition timing;
- target-loss and boundary-linger timing;
- hold, area, or path patrol modes;
- patrol radius or explicit waypoint path;
- leash bounds and return tolerance.

Draw facing, aggro, leash, patrol-area, and waypoint overlays in world space. Keep overlay colors and legend labels consistent.

Make source-owned settings read-only unless the editor has a validated write-back path. Do not turn arbitrary runtime state into editable JSON.

## Keep drafts reversible and isolated

Use immutable document snapshots and a bounded history.

- Restore a valid local draft before enabling automatic persistence.
- Ignore an invalid local draft and report that production source was loaded.
- Clear redo history after a new edit.
- Timestamp committed edits and exported files.
- Validate before export and import.
- Reject oversized, unreadable, schema-invalid, or manifest-mismatched imports.
- Require confirmation before resetting all draft changes.
- Keep gameplay saves, account state, and server state outside the draft store.
- Display `Draft only` or equivalent status persistently.

If collaborative editing, server persistence, or source write-back is requested later, design it as a separate authenticated workflow with conflict handling, audit history, and explicit publish approval.

## Gate private production tools

Treat a private URL as insufficient protection.

- Render the route dynamically and set `noindex, nofollow`.
- Fail closed when access configuration is absent.
- Apply an exact IP allowlist using the trusted edge IP header for the deployment.
- Compare passwords without an early-exit plaintext comparison.
- Sign short-lived session claims with HMAC or an equivalent server-side mechanism.
- Bind the session to the allowed client IP and expiration time.
- Store the token in a secure, HTTP-only, strict same-site cookie.
- Reject oversized credentials and malformed tokens.
- Keep passwords, allowlists, and signing material in deployment secrets; never bundle, log, export, or test-snapshot them.
- Do not render the editor client or canvas for unauthorized requests.
- Provide a POST logout action that invalidates the cookie.

Test missing configuration, denied IP, wrong password, valid token, wrong IP, wrong secret, expiration, and logout.

## Integrate a reviewed draft

Read the exported document as a diff keyed by stable source ID.

1. Validate schema, version, manifest, bounds, flat-plane rules, and per-kind settings.
2. Compare every changed field against production definitions.
3. Map approved changes back to the smallest authoritative source modules.
4. Run level, navigation, collision, enemy, persistence, and editor coverage tests.
5. Play the affected routes and encounters in the repository-approved browser.
6. Commit and release through the repository's normal path.

Never copy a draft wholesale into production without understanding which system owns each field.

## Verify the editor

Add deterministic tests for:

- production-to-document coverage by entity kind;
- stable IDs, schema validation, flat-plane enforcement, bounds, and setting ranges;
- canonical icon or model resolution and shipped-file existence;
- camera focus, zoom limits, and reduced motion;
- undo, redo, drag atomicity, snap, local restore, import, export, reset, and manifest checks;
- access configuration, exact allowlisting, password comparison, token binding, expiry, cookie flags, and fail-closed server rendering.

Then run targeted tests, full tests, build, lint, and diff checks. In the approved browser, verify unauthorized and authorized states, outliner and layer behavior, selection and focusing, drag and snap, inspector edits, overlays, undo and redo, local restore, import and export rejection paths, reset confirmation, logout, desktop layout, mobile or narrow layout if supported, console health, and renderer cleanup.

Read [references/vesperfall-implementation.md](references/vesperfall-implementation.md) when working in Vesperfall or when a concrete production implementation map is useful.
