---
name: optimize-web-animations
description: Profile, audit, and optimize frontend page performance with emphasis on animation work, memory-leak risks, long-session slowdowns, CSS animations, canvas/WebGL requestAnimationFrame loops, marquees, skeletons, GSAP/Three/Matter effects, timers, listeners, and observers. Use when the user asks to make animations performant, pause offscreen animations, look for memory leaks, profile pages that slow the computer over time, fix janky scrolling, reduce CPU/GPU use, or repeat the "only play in view" optimization on React/Vite/Next/frontend pages using Codex Browser.
---

# Optimize Web Animations

## Core Rule

Measure the real page before editing. The goal is not to remove motion; it is to make offscreen work stop, visible motion resume correctly, and route/unmount cleanup release long-lived resources.

Use Codex Browser when available, especially for localhost pages. Do not use Chrome unless the user explicitly asks for it.

## Workflow

1. Inspect repo context.
   - Read `AGENTS.md` or local instructions.
   - Run `git status --short` early.
   - Find page components, animation hooks, CSS keyframes, `requestAnimationFrame`, `setInterval`, `setTimeout`, canvas/WebGL/physics components, media elements, GSAP timelines/tweens, and existing visibility utilities.
   - Search effect cleanup for event listeners, observers, RAF loops, intervals, timers, external scripts, media streams, WebGL textures/materials/geometries/renderers, and async work that can complete after unmount.
   - If the worktree is dirty, plan narrow staging from the start.

2. Capture a baseline in the browser.
   - Open the exact route the user named.
   - Profile at top, mid-page, footer/lower content, and one mobile viewport when layout could differ.
   - Count CSS animations by computed `animationName`, `animationPlayState`, and visibility. Include `::before` and `::after`.
   - Inspect canvases/WebGL elements separately; CSS profiling does not prove RAF loops have stopped.
   - Record which animation names are running offscreen and the DOM owners responsible.
   - For memory/leak asks, also record element/canvas/image/iframe counts, exposed JS heap metrics when available, an idle sample after 10-30 seconds, and a short route-cycle sample. If heap APIs return `null` or the Browser sandbox blocks monkey-patching, say so and rely on stable observable counts plus source audit.
   - Keep stress tests bounded. A Browser tab crash during profiling is evidence of overload, but do not over-attribute the cause unless reproduced by a minimal test.
   - See `references/browser-profiling.md` for a reusable Codex Browser evaluator.

3. Patch the smallest owner that controls the motion.
   - Prefer an existing page reveal/visibility hook if the app has one.
   - Otherwise add an `IntersectionObserver` that toggles a stable class such as `is-offscreen` on sections and animated child elements.
   - Pause CSS animations with targeted rules:

```css
main > section.is-offscreen .expensive-animation,
.expensive-animation.is-offscreen {
  animation-play-state: paused !important;
}
```

   - For repeated cards or placeholders, observe the card shell and the animated descendants, not the whole document.
   - For marquee/ticker tracks, pause the track when its section is offscreen.
   - For skeleton loaders and pseudo-element glimmers, include `::before` and `::after` pause selectors where needed.
   - For canvas/WebGL/physics loops, gate the RAF loop directly:
     - Start when the canvas/container intersects.
     - Cancel `requestAnimationFrame` when offscreen.
     - Resume on re-entry.
     - Disconnect observers and cancel frames on cleanup.
     - Add a non-visual debug marker such as `data-animation-active` when it helps browser verification.
   - Respect `prefers-reduced-motion` if the component already does, and avoid introducing React render loops for scroll/animation state.
   - For leak hardening:
     - Clear every timeout/interval created by the effect.
     - Cancel RAF before unmount and before restarting a loop.
     - Disconnect `IntersectionObserver`, `ResizeObserver`, `MutationObserver`, and custom subscriptions.
     - Remove global/window/document listeners with the same handler reference.
     - Dispose Three/WebGL textures, materials, geometries, renderers, and remove renderer DOM nodes.
     - Kill GSAP tweens/timelines for DOM nodes and mutable objects such as shader uniforms.
     - Stop media streams and pause detached video/audio sources.
     - Guard async loaders with an `isDisposed` flag and dispose loaded resources if they resolve after unmount.
     - In React cleanup, capture `ref.current` values inside the effect before returning cleanup if lint warns the ref may change.
     - Cap physics or simulation frame deltas after visibility pauses so delayed frames do not run oversized updates.

4. Verify behavior, not just builds.
   - Reload the route and rerun the same top/mid/footer/mobile profiles.
   - Target result: `offscreenRunningCount: 0` for the page sections under test.
   - Confirm visible animations still run or resume when scrolled into view.
   - Confirm RAF/canvas loops report inactive offscreen and active in view, or otherwise prove cancellation from source/runtime state.
   - For leak audits, compare before/after route cycles and idle samples. DOM/canvas/image counts should return to the same baseline after repeated navigation, allowing for small expected async content changes.
   - Exercise a normal page interaction such as search/filter/navigation so the observer does not break dynamic content.
   - Check fresh-tab console warnings/errors.

5. Run local checks.
   - Use the repo's normal gates. For React/Vite apps this is often:

```bash
git diff --check
npm run lint
npm run build
```

   - Mention known non-fatal warnings separately from failures.

6. Commit narrowly when requested by repo/user instructions.
   - If unrelated dirty changes exist, use an isolated index:

```bash
rm -f /tmp/<task>-index
GIT_INDEX_FILE=/tmp/<task>-index git read-tree HEAD
# Apply only the intended hunks to the temporary index.
GIT_INDEX_FILE=/tmp/<task>-index git diff --cached --check
GIT_INDEX_FILE=/tmp/<task>-index git commit -m "Pause offscreen <page> animations"
git restore --staged <files> 2>/dev/null || true
```

   - Never stage broad files from a dirty worktree unless every hunk belongs to the task.

7. Report with evidence.
   - Lead with findings: what was still running, what looked leak-prone, and what could not be measured.
   - Separate source-audit risks from live Browser measurements.
   - Include the exact sampled route(s), offscreen animation counts, DOM/canvas count stability, route-cycle result, and local checks.
   - State limitations plainly, especially unavailable heap counters or blocked Browser instrumentation.

## Good Fix Patterns

- Section-level `is-offscreen` plus element-level `is-offscreen` for long sections where below-the-fold child animations can still run.
- Shared visibility selector constants per route, such as `COURSES_PAGE_ANIMATION_VISIBILITY_SELECTOR`.
- `IntersectionObserver` thresholds around `0.01` for animation gating.
- Direct RAF loop control for WebGL/canvas effects; CSS `animation-play-state` cannot pause JavaScript render loops.
- Frame delta caps for physics loops that resume after a paused or delayed frame.
- Captured cleanup nodes for React refs used by GSAP/WebGL effects.
- `isDisposed` guards for image/video/texture/data loaders that may resolve after unmount.
- Short idle and route-cycle probes to catch accumulating DOM nodes, canvases, iframes, or unreleased media.

## Avoid

- Removing all animations to make the profile pass.
- Pausing visible hero motion because an ancestor selector is too broad.
- Assuming `animation-play-state` covers pseudo-elements or JavaScript RAF loops.
- Trusting a single top-of-page measurement on long pages.
- Treating unavailable heap counters as proof there is no memory leak.
- Running unbounded stress loops in the Browser; use bounded cycles and record crashes without overstating causality.
- Using screenshots alone as performance proof.
- Letting unrelated local hunks ride along in the commit.
