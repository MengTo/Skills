# The step contract

## A step

```js
{ id: 'paste', name: 'Paste a link', dur: 6.5, View }
```

- `id`: stable and unique within the window. The stage is keyed by it, so changing step remounts the stage and plays its 0.45 s fade-in.
- `name`: 1–3 words, as the steps bar shows it.
- `dur`: seconds. Use 4–8 per step and 18–30 for the whole window.
- `View({ t, dur })`: draws everything inside the app's window at 1200 × 750, where `t` runs from 0 to `dur`. Don't draw the window's own title bar; `StepWindow` does that.

`View` must be pure: the same `t` gives the same DOM. Don't use effects that set state, timers or random numbers. If you need variety, seed it from the step id.

## The window

```jsx
<StepWindow
  steps={STEPS}
  tabs={['Ashgrove']}        // the title bar's tabs; the last one is shown
  label="Import a page"      // the stage's aria-label begins with this
  stageClass="my-app"        // the app's own tokens and fonts on the stage
  clock={clock}              // optional: drive it from outside
  bar={true}                 // the steps bar along the foot
/>
```

The window keeps its view at 16:10 (`aspect-ratio`) and sets `--k = clientWidth / 1200` on it from a `ResizeObserver`. The stage is `position: absolute; width: 1200px; height: 750px; transform: scale(var(--k)); transform-origin: 0 0`.

## The clock

```js
const clock = useStepClock(STEPS, { still, start, off });
// clock.i, clock.t           the step and seconds into it
// clock.elapsed, clock.total seconds into the whole demo, and its length
// clock.play(i)              step i from its start (its end under reduced motion)
// clock.seek(s)              s seconds into the whole demo (a scrub)
// clock.pause(), clock.resume(), clock.paused, clock.still
```

- It ticks every 40 ms and adds `min(0.25, dt)`. It runs only while the window is at least 30% on screen (`IntersectionObserver`) and `!document.hidden`, and loops after the last step.
- `still` defaults to `prefers-reduced-motion: reduce`. When still, the clock never runs and each step shows `t = dur`.
- `start: { i, t }` freezes it there, paused. Use it to take screenshots of exact frames.
- To build a scrubber: create the clock with `useStepClock`, pass it to `<StepWindow clock={clock} />`, and bind a range input to `clock.elapsed` / `clock.seek`.

## Helpers

| helper | what it gives |
| --- | --- |
| `ease(t, a, b)` | 0 → 1 between `a` and `b` seconds, cubic in-out; 0 before, 1 after |
| `typed(text, t, a, b)` | the text typed so far, all of it by `b` |
| `cue(t, [[at, v], …], before)` | the last value whose time has come |
| `held(t, at, len = 0.16)` | whether a click at `at` is still pressed |
| `glide(t, [[from, to, x, y], …], clicks)` | pointer props worked out from `t` (exact under scrubs) |
| `<Cursor x y press hide move />` | the macOS arrow, its tip at (x, y); `move` is the glide's CSS seconds |

## Writing a step

Put the times at the top, as names, so the step reads like a script and can be retimed in one place:

```jsx
const TYPE_FROM = 1.9, TYPE_TO = 3.7, SEND_AT = 4.3, ASK_AT = 4.8, GO_AT = 5.42, DONE_AT = 6.9;
function AgentStep({ t }) {
  const sent = t >= SEND_AT;
  const phase = t >= DONE_AT ? 'done' : t >= GO_AT ? 'working' : t >= ASK_AT ? 'asking' : sent ? 'reading' : '';
  const glow = ease(t, DONE_AT - 0.2, DONE_AT + 0.8);
  // …
}
```

- **Phases** are comparisons against those names.
- **Anything that moves** (progress, a reveal, a camera, a number counting) is `ease()` of `t`.
- **Typing** is `typed()`. Show a caret only while the field is focused.
- **Clicks** are `held(t, AT)`. Land the pointer 0.3–0.6 s before `AT`.
- **What the click causes** starts 0.05–0.15 s after `AT`, never before it.
- **A hover** shows from the moment the pointer arrives until it leaves.

## Two kinds of motion

1. **Computed from `t`**: `ease`, `typed`, `glide`, clip-paths, transforms and counters. These are exact at any `t`, so they survive scrubs, frozen frames and reduced motion.
2. **Smoothed by CSS** (`transition: transform 0.6s`, a keyed `animation`): cheaper to write, but a frame depends on the frames before it. After a jump they settle late, by up to their own duration. Use them for hovers, panels sliding and the pointer's glide between targets, and never for anything a screenshot must get exactly right.

When you take a screenshot of a frame whose transitions matter, wait at least the longest transition (about 1 s) after seeking, or use kind 1.

## Aiming at real elements

Hard-coded coordinates break the first time a label changes. Measure instead:

```jsx
useLayoutEffect(() => {
  const r = stage.getBoundingClientRect();
  const k = r.width / 1200;
  const b = stage.querySelector('[data-aim="headline"]').getBoundingClientRect();
  setAim({ x: (b.left - r.left + b.width * 0.55) / k, y: (b.top - r.top + b.height * 0.6) / k });
}, [frame]);
```

Aim at 55% across and 60% down a target, roughly where a hand lands. For a button at the side of something, use 105% / 110%.

You can also measure once with Playwright and write the numbers into the script, as the vanilla demo does, and measure again whenever the layout changes.
