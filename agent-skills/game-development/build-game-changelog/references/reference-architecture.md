# Reference architecture

Use these patterns as adaptable pseudocode. Match the project’s language, framework, input system, and menu architecture.

## Ledger schema

```ts
type GameVersion = `0.9.${number}`;

type ChangelogEntry = Readonly<{
  version: GameVersion;
  releasedAt: string;            // YYYY-MM-DD
  title: string;
  details: readonly string[];
  deploymentVersion: number | string | null;
  sourceRevision: string | null; // pending is allowed only for the newest entry
}>;

// Store newest first for direct rendering.
const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: "0.9.2",
    releasedAt: "2026-07-25",
    title: "Improve checkpoint recovery",
    details: [
      "Restore vitality when the player respawns",
      "Keep the checkpoint transition responsive",
    ],
    deploymentVersion: 3,
    sourceRevision: null,
  },
  // 0.9.1, then 0.9.0
];

const CURRENT_VERSION = CHANGELOG[0].version;
```

Keep `CURRENT_VERSION` derived. If other systems need the value, import or generate it from this source rather than copying it.

## Version mapping

Use an explicit mapping:

```ts
function expectedVersionForDeployment(deploymentOrdinal: number): GameVersion {
  // Use only when deployment 1 is guaranteed to be game version 0.9.0.
  return `0.9.${deploymentOrdinal - 1}`;
}
```

Prefer stored identifiers when deployments can be skipped, rolled back, saved without publishing, or created by another release lane.

For independent semantic versions, bump the game version before deployment and attach the returned deployment ID after success in an external release manifest or during the next normal release.

## Menu state

Represent the changelog as a real screen:

```ts
type MenuScreen =
  | "home"
  | "character"
  | "settings"
  | "controls"
  | "changelog";

let screen: MenuScreen = "home";
let previousScreen: MenuScreen = "home";

function openMenuScreen(next: MenuScreen) {
  if (transitionBlocked()) return;
  if (next === "changelog") previousScreen = screen;
  screen = next;
  playMenuOpenSound();
}

function closeCurrentPanel() {
  if (transitionBlocked()) return;
  screen = screen === "changelog" ? previousScreen : resolveNormalBackTarget(screen);
  playMenuCloseSound();
}

function toggleChangelog() {
  if (screen === "changelog") closeCurrentPanel();
  else openMenuScreen("changelog");
}
```

If several nested panels can open the changelog, use a navigation stack instead of one `previousScreen` slot.

## Input priority

Resolve the game’s cancel action once:

```ts
function resolveCancelIntent(context: InputContext) {
  if (context.dialogOpen) return "close-dialog";
  if (context.dragActive) return "cancel-drag";
  if (context.rebinding) return "cancel-rebinding";
  if (context.menuScreen === "changelog") return "menu-back";
  if (context.menuOpen) return "normal-menu-back";
  return "open-pause";
}

function onCancelInput(event: GameInputEvent) {
  if (event.repeat || transitionBlocked()) return;

  switch (resolveCancelIntent(readInputContext())) {
    case "close-dialog":
      closeDialog();
      break;
    case "cancel-drag":
      cancelDrag();
      break;
    case "cancel-rebinding":
      cancelRebinding();
      break;
    case "menu-back":
    case "normal-menu-back":
      closeCurrentPanel();
      break;
    case "open-pause":
      openPauseMenu();
      break;
  }
}
```

Bind Escape, controller B or Circle, and other platform cancel inputs to this action. Do not implement separate close behavior for each physical key.

## Accessible toggle and panel

```tsx
const changelogOpen = screen === "changelog";

<button
  type="button"
  aria-controls="game-changelog-panel"
  aria-expanded={changelogOpen}
  aria-label={`${changelogOpen ? "Close" : "Open"} changelog, version ${CURRENT_VERSION}`}
  onClick={toggleChangelog}
>
  <span>Changelog</span>
  <strong>{CURRENT_VERSION}</strong>
</button>

{changelogOpen ? (
  <section
    id="game-changelog-panel"
    aria-labelledby="game-changelog-title"
  >
    <header>
      <h2 id="game-changelog-title">Changelog</h2>
      <strong aria-label={`Current version ${CURRENT_VERSION}`}>
        Current {CURRENT_VERSION}
      </strong>
      <button
        ref={closeButtonRef}
        type="button"
        aria-label="Close changelog"
        onClick={closeCurrentPanel}
      >
        <CloseIcon aria-hidden="true" />
      </button>
    </header>

    <ol aria-label="Game release history">
      {CHANGELOG.map((entry, index) => (
        <li key={entry.version} data-current={index === 0}>
          <article>
            <h3>{entry.title}</h3>
            <strong>{entry.version}</strong>
            <time dateTime={entry.releasedAt}>{formatDate(entry.releasedAt)}</time>
            <ul>
              {entry.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          </article>
        </li>
      ))}
    </ol>

    <button type="button" onClick={closeCurrentPanel}>Back</button>
  </section>
) : null}
```

Focus `closeButtonRef` after the screen mounts. Restore focus to the toggle after closing when the menu system does not already choose a primary control.

## Layout behavior

Use a fixed-height or viewport-bounded panel:

```css
.changelog-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-height: min(78vh, 760px);
  overflow: hidden;
}

.changelog-list {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.changelog-close {
  min-width: 40px;
  min-height: 40px;
}
```

Keep the header and bottom Back action outside the scrolling list. At narrow widths, compact or visually hide the word “Changelog” in the utility trigger while preserving its accessible label and visible version.

## Backfill algorithm

Use this evidence order:

1. Successful production deployment records
2. Deployed source revisions
3. Git diffs and merged work between consecutive revisions
4. Tests and product surfaces that prove user-visible behavior
5. Commit messages only as discovery hints

For each deployment:

```text
releaseChanges = diff(previousProductionSource, currentProductionSource)
playerNotes = summarizeVerifiedPlayerVisibleOutcomes(releaseChanges)
entry = {
  version: nextContiguousVersion,
  releasedAt: productionReleaseDate,
  details: playerNotes,
  deploymentVersion,
  sourceRevision: currentProductionSource
}
```

Use one entry even when `releaseChanges` contains many commits. Exclude refactors, test-only work, generated artifacts, and internal tooling unless players or operators directly experience them.

## Data invariants

Test at least:

```ts
assert.equal(CHANGELOG.at(-1)?.version, "0.9.0");
assert.equal(CURRENT_VERSION, CHANGELOG[0].version);

const seenVersions = new Set<string>();
const seenDeployments = new Set<string>();

CHANGELOG.forEach((entry, index) => {
  const patch = Number(entry.version.split(".").at(-1));
  const expectedPatch = CHANGELOG.length - index - 1;

  assert.equal(patch, expectedPatch);
  assert.equal(seenVersions.has(entry.version), false);
  assert.match(entry.releasedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(entry.title.trim().length > 0);
  assert.ok(entry.details.length > 0);

  seenVersions.add(entry.version);

  if (entry.deploymentVersion != null) {
    const id = String(entry.deploymentVersion);
    assert.equal(seenDeployments.has(id), false);
    seenDeployments.add(id);
  }

  if (index > 0) assert.ok(entry.sourceRevision);
});
```

Adapt `expectedPatch` when the project starts from another base or changes minor versions.

## Interaction proof

Test all paths independently:

1. Start closed and verify the trigger exposes `aria-expanded=false`.
2. Open from the version trigger and verify the panel, current version, and focused close control.
3. Click the same trigger and verify the previous menu screen returns.
4. Reopen, activate the X, and verify the same result.
5. Reopen, activate Back, and verify the same result.
6. Reopen, press the mapped cancel input, and verify the same result.
7. Verify the first and last versions and the rendered entry count.
8. Verify list scrolling and reachable close controls at desktop and mobile sizes.
9. Repeat the critical checks against the successful production deployment.

If a deterministic review route exists, add a changelog state so browser tests can open the exact screen without modifying saves.
