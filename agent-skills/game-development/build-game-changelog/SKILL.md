---
name: build-game-changelog
description: Design, implement, backfill, audit, and release in-game changelogs with contiguous versioning, deployment provenance, menu-state navigation, accessible toggle, close, and Escape behavior, and responsive release-ledger UI. Use when Codex needs to add or revise a changelog or version screen in a game, reconstruct release history from deployments and Git, define version-bump rules, keep displayed versions synchronized with live builds, or test changelog mechanics across desktop and mobile.
---

# Build Game Changelog

Build the changelog as a release system, not a decorative modal. Keep one authoritative ledger connected to production history, game-menu navigation, and release verification.

## Use this mental model

- The ledger is the public record of what players received.
- A version identifies a successful production release, not a development commit.
- The newest ledger entry defines the version shown throughout the game.
- Opening the changelog is a reversible menu-state transition.
- Every close affordance resolves through the same back action.
- A release is complete only after the live game proves the expected version and behavior.

## Start from truth

Inspect before editing:

1. Read repository instructions and preserve unrelated work.
2. Find the game’s menu or pause state machine, back action, input bindings, focus behavior, and responsive layout.
3. Find every displayed version, package version, build version, deployment sequence, release manifest, and existing changelog.
4. Query successful production deployments and their source revisions when available.
5. Compare deployment revisions to identify what players actually received.

Prefer repository, deployment, and live-runtime evidence over chat summaries or commit-message guesses. Do not invent missing release dates, source revisions, features, or version mappings.

## Define one release

Treat one successful player-visible production deployment as one changelog version.

- Do not bump for local commits, drafts, tests, failed builds, or saved-but-unpublished artifacts.
- Combine multiple commits shipped together into one version with several release notes.
- Give a separately deployed hotfix its own version.
- Describe player-visible outcomes, not implementation chores or raw commit messages.
- Keep internal source and deployment identifiers in ledger metadata, not player-facing copy.

Retain an established version scheme. For a new pre-1.0 game without one, default to `0.9.0` and increment the patch once per production release: `0.9.1`, `0.9.2`, and so on. Do not jump to a new minor or major version without an explicit product milestone.

## Build or backfill the ledger

Work oldest-to-newest when reconstructing history, then store entries newest-first for rendering.

1. Enumerate successful production releases.
2. Associate each release with its date, deployed source revision, and deployment identifier.
3. Diff each source revision against the previous production revision.
4. Summarize the user-visible changes in that release.
5. Use the first production baseline as `0.9.0` when adopting the default scheme.
6. Consolidate meaningful launch work into the baseline if it predates deployment tracking.
7. Verify the ledger count, ordering, uniqueness, and version continuity.

If evidence is incomplete, mark provenance unknown in internal metadata or stop for clarification. Never fabricate a neat history.

## Use one data source

Keep changelog content in typed or schema-validated structured data. Give each entry:

- version
- release date
- short release title
- one or more player-facing details
- deployment version or release identifier when available
- exact source revision when available

Derive the displayed current version from the newest ledger entry. Do not maintain a second hand-written version constant.

Store an explicit mapping between game versions and deployment versions. Only use a formula such as `patch = deploymentOrdinal - 1` when the project guarantees it and tests it.

Avoid self-referential source metadata. A commit cannot contain its own final hash. Either:

- keep the newest inline entry’s source revision pending and backfill it during the next release;
- inject the exact revision at build time; or
- store immutable release provenance outside the source commit.

See [references/reference-architecture.md](references/reference-architecture.md) when implementing the schema, state machine, or tests.

## Integrate with game navigation

Make the changelog an explicit menu route or screen state. Use an overlay only when the game’s existing menu architecture uses overlays.

- Record the previous menu screen before opening.
- Make the version control a toggle: closed opens the changelog; open returns to the previous screen.
- Route the header toggle, visible X, bottom Back action, controller cancel, and Escape through one close or back function.
- Use the game’s authoritative input-binding layer instead of adding a competing global Escape listener.
- Respect higher-priority input consumers such as dialogs, drag operations, rebinding flows, and text fields.
- Ignore repeated input and blocked transition states when the menu already does so.
- Preserve the previous pause state when the changelog can open over gameplay.

On open, focus the close control or panel heading. On close, restore focus to the trigger when practical. Never strand keyboard or controller focus inside an unmounted panel.

## Apply durable UI mechanics

Fit the existing game UI rather than introducing a new visual language.

- Place the changelog control with stable menu utilities such as sound, settings, or account controls.
- Show the current version inside the control.
- Keep a visible close X in the panel header and give it an accessible name.
- Keep the current-version marker and close control visible while the release list scrolls independently.
- Render releases newest-first with semantic headings, dates, and bullet lists.
- Keep a bottom Back action when other game panels use one.
- Use `aria-expanded`, `aria-controls`, a labelled panel, and dynamic open or close labels on web-based games.
- Preserve the version and close affordance on small screens; compact secondary text before shrinking targets.
- Use touch targets appropriate to the game’s existing control system.

Prefer concise, specific notes such as “Restore vitality at checkpoints” over “Various fixes.” Avoid developer-only jargon unless players need it.

## Release safely

Use this order:

1. Verify the latest live version and production source.
2. Determine the next version from the successful release stream.
3. Implement the player-visible changes and add exactly one pending release entry.
4. Run data, interaction, accessibility, responsive, and build checks.
5. Commit only the intended source.
6. Build the exact committed revision.
7. Publish that exact revision.
8. Confirm the deployment succeeded before calling the version released.
9. Verify the live game shows the expected version, history count, newest entry, oldest baseline, close paths, and no runtime errors.
10. Reconcile or stop if the deployment sequence differs from the ledger.

Do not create another changelog version merely for filling in the previous release’s provenance unless that metadata update itself is deployed to players. Bundle bookkeeping with the next real release when possible.

## Validate the contract

Require automated checks for:

- unique, contiguous versions
- newest-first ordering
- oldest baseline
- current version derived from the first entry
- valid dates, non-empty titles, and non-empty details
- unique deployment identifiers
- valid or explicitly pending source revisions
- complete rendered history in data order
- closed and open toggle states
- X, Back, controller cancel, and Escape using the same back route
- focus on open and sensible focus restoration on close
- independent list scrolling and reachable controls on small screens

Finish with production proof when the task includes a release. Test the live build, not only a local preview.

## Avoid these failures

- Do not create one version per commit.
- Do not show a version that has not shipped.
- Do not let package metadata, the UI badge, and the ledger disagree.
- Do not close to a hard-coded home screen when the player came from another menu.
- Do not register duplicate Escape handlers that can close two layers at once.
- Do not hide the only close control inside a long scrolling list.
- Do not expose source hashes or deployment IDs in player-facing notes.
- Do not rewrite historical entries without evidence.
