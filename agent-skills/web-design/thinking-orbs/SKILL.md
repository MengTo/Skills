---
name: thinking-orbs
description: Add accessible animated AI loading and agent-status indicators with the React thinking-orbs library. Use when a chat, copilot, voice, search, generation, or tool-running interface needs a semantic working, searching, solving, listening, composing, or shaping state; when replacing a generic spinner with an AI activity orb; or when implementing the library's size, theme, speed, pause, reduced-motion, and canvas behavior.
---

# Thinking Orbs

## Core Contract

1. Use `thinking-orbs` in React 18+ interfaces that need indeterminate AI activity feedback.
2. Map the real product lifecycle to one of the six shipped states.
3. Use only the tuned `20` or `64` pixel size. Do not stretch one preset into another.
4. Keep `theme="auto"` unless the surrounding surface has a known fixed theme.
5. Pair the orb with concise visible status text when the activity matters to the user.
6. Override `aria-label` with a task-specific label, or hide the orb from assistive technology when adjacent live text already announces the same state.
7. Use `paused` to freeze the current frame. Do not simulate pause with `speed={0}`.
8. Treat the orb as indeterminate feedback, never as a progress percentage or completion signal.

The package renders monochrome dots on a transparent 2D canvas. It does not expose custom colors, arbitrary sizes, or determinate progress.

## Install

Inspect the project package manager, then install:

```bash
npm install thinking-orbs
```

The package declares `react` and `react-dom` version 18 or newer as peer dependencies. Import the component and exported types from the package root:

```tsx
import {
  ThinkingOrb,
  type OrbSize,
  type OrbState,
  type OrbTheme,
  type ThinkingOrbProps,
} from "thinking-orbs";
```

## Choose the State

- `working` — generic tool execution, multi-step work, or an activity without a more precise state.
- `searching` — retrieval, web search, file search, or knowledge lookup.
- `solving` — reasoning, analysis, calculation, or planning.
- `listening` — microphone input, speech capture, or waiting for a spoken turn.
- `composing` — writing, summarizing, drafting, or generating a text response.
- `shaping` — creating or refining an image, layout, structured artifact, or other formed output.

Prefer a truthful generic `working` state over a visually interesting but inaccurate state. Change the state only when the underlying activity changes.

## Choose the Size

- Use `size={20}` inline with text, inside buttons, or in compact status rows.
- Use `size={64}` at chat-avatar scale, in an empty state, or as the main visual status.

The presets have different dot counts, dot sizes, and speed tuning. They are separate designs rather than a scale factor. If the layout needs more surrounding space, size the wrapper instead of applying CSS transforms to the canvas.

## Basic Usage

```tsx
import { ThinkingOrb } from "thinking-orbs";

export function AgentStatus() {
  return (
    <ThinkingOrb
      state="searching"
      size={20}
      theme="auto"
      aria-label="Searching project files…"
    />
  );
}
```

All other canvas props pass through, including `className`, `style`, `data-*`, event handlers, and ARIA attributes.

## Model the Product Lifecycle

Keep product phases separate from visual states so the mapping stays explicit:

```tsx
import { ThinkingOrb, type OrbState } from "thinking-orbs";

type AgentPhase =
  | "idle"
  | "retrieving"
  | "reasoning"
  | "writing"
  | "creating"
  | "done"
  | "error";

const ORB_BY_PHASE: Partial<Record<AgentPhase, OrbState>> = {
  retrieving: "searching",
  reasoning: "solving",
  writing: "composing",
  creating: "shaping",
};

export function AgentActivity({ phase }: { phase: AgentPhase }) {
  const state = ORB_BY_PHASE[phase];
  if (!state) return null;

  return <ThinkingOrb state={state} size={20} />;
}
```

Remove the orb on `done`, `error`, cancellation, or idle. Show the appropriate result, retry, or error UI instead of leaving the last activity animation running.

## Announce Status Once

The component defaults to `role="img"` with a per-state label such as “Searching…”. When visible text describes the same state, make the text the single announcement source:

```tsx
export function LiveAgentStatus() {
  return (
    <div role="status" aria-live="polite" className="agent-status">
      <ThinkingOrb state="solving" size={20} aria-hidden="true" />
      <span>Reviewing the repository…</span>
    </div>
  );
}
```

Use `aria-live="polite"` for ordinary phase changes. Avoid rapid label churn. Do not add another hidden live region when `role="status"` already owns the announcement.

## Theme

Use one of:

```tsx
<ThinkingOrb theme="auto" />
<ThinkingOrb theme="dark" />
<ThinkingOrb theme="light" />
```

- `auto` first checks an ancestor `data-theme="dark|light"` attribute or `dark` / `light` class.
- If no ancestor theme exists, `auto` follows `prefers-color-scheme`.
- Theme changes update live.
- `dark` means light dots intended for a dark background.
- `light` means dark dots intended for a light background.

The canvas is transparent. Verify contrast against the actual surface rather than the page root alone.

## Speed and Pause

```tsx
<ThinkingOrb state="working" speed={0.85} />
<ThinkingOrb state="composing" paused={isWaitingForApproval} />
```

`speed` multiplies the baked speed of the selected state and size. Start at `1`; use roughly `0.75–1.25` for subtle product tuning. Extreme values can make the hand-tuned motion feel frantic or stalled.

`paused` freezes the current frame while retaining the visual status. Remove the component when the activity has actually ended.

## Next.js and Client Rendering

The component uses React effects, canvas, `requestAnimationFrame`, media queries, and observers. Keep the package import behind a client boundary in the Next.js App Router:

```tsx
"use client";

import { ThinkingOrb } from "thinking-orbs";

export function ThinkingStatus() {
  return <ThinkingOrb state="working" size={20} />;
}
```

The library is SSR-safe because it paints only on the client after resolving the theme. A client boundary is still required where the framework enforces server and client component separation.

## Built-In Runtime Behavior

- Draws with plain Canvas 2D arcs; no WebGL or SVG filters.
- Caps device pixel ratio at `2`.
- Uses one `requestAnimationFrame` loop per visible instance.
- Uses the shared `performance.now()` clock so multiple orbs stay in phase.
- Pauses when the canvas scrolls offscreen through `IntersectionObserver`.
- Pauses when the browser tab is hidden.
- Renders one deterministic static frame under `prefers-reduced-motion: reduce`.
- Continues following live theme changes in reduced-motion mode.

Do not rebuild these behaviors in a wrapper. Add product state management and layout around the component, not a second animation loop.

## Power-User Canvas API

Prefer `<ThinkingOrb>` for product UI. The package also exports its resolved presets and raw frame painters for a custom canvas outside React:

```ts
import { MODE_DRAWS, resolvePreset } from "thinking-orbs";

const { mode, speed, opts } = resolvePreset("searching", 64);
const drawFrame = MODE_DRAWS[mode];

drawFrame(
  context,
  64,
  (performance.now() / 1000) * speed,
  true, // true draws light ink for a dark surface
  opts,
);
```

`STATE_TO_MODE` exposes the internal mapping:

- `working` → `orbits`
- `searching` → `globe`
- `solving` → `rubik`
- `listening` → `wave`
- `composing` → `ribbon`
- `shaping` → `morph`

Use the raw API only when another renderer owns the canvas lifecycle. It provides a frame painter, not component behavior. Reimplement DPR sizing, clearing, animation scheduling, pausing, theme resolution, reduced motion, visibility handling, cleanup, and accessibility when bypassing `<ThinkingOrb>`.

## Verification

Run the project's typecheck, tests, production build, and `git diff --check`. Then verify in a real browser:

1. Trigger every product phase and confirm the mapped orb state is truthful.
2. Confirm `20` and `64` pixel instances are crisp without CSS scaling.
3. Test dark, light, and live theme switching.
4. Test reduced motion and confirm the orb becomes a static representative frame.
5. Scroll the orb offscreen and return; confirm it resumes without visible breakage.
6. Hide and restore the tab; confirm animation resumes.
7. Inspect accessibility: announce the status exactly once and use a task-specific label.
8. Confirm the orb disappears on success, error, cancellation, and idle.
9. Confirm no console errors, hydration warnings, or layout shifts occur.

## Common Pitfalls

- **Type error on size:** use exactly `20` or `64`; do not pass arbitrary dimensions.
- **Wrong contrast:** remember `dark` targets dark backgrounds and therefore draws light ink.
- **Duplicate screen-reader output:** hide the canvas when adjacent `role="status"` text already announces the task.
- **Misleading state:** do not show `searching` during generation or `composing` during microphone capture.
- **Permanent loading UI:** remove the orb when work ends and render the actual terminal state.
- **Hydration or server-component error:** move the import into a client component.
- **Brand color requested:** the public API is monochrome; choose another loader or make an intentional library fork instead of relying on unsupported styling.

## Handoff

Report the mapped product phases, chosen size, theme mode, accessible label strategy, reduced-motion behavior, and build/browser verification. Distinguish local implementation from a deployed release.
