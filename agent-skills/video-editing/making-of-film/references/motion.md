# Motion and transitions

Every function is in `scripts/motion.js` (`window.MakingOf`, load after `explainer.js`); `assets/starter/film.js` uses
each. All take t and a word time, so nothing animates on its own clock. Calm: expo-out arrivals, soft focus
resolving, no shines, glints, sweeps or streaks.

**Since 22 Nov: cut by default.** A soft exit (the 0.3 s exit into blur, a dissolve, a burn) only where the subject or
section really changes, never between two shots of the same build ("we don't need to transition all the time").
Demo footage stays alive (idle motion, hits, effects), not a still UI with a label. Greymourn's dissolves and
per-scene exits below are the worked example from before that.

## The vocabulary

| Device | Function | Where Greymourn used it |
|---|---|---|
| Masked word reveal: each word rises out of its line mask, a soft blur resolving | `words(el, t, at, {gap, dur, times, leave})` | every headline; `times` puts each word on its spoken word ("Made · in · three · days") |
| AR glass panel: flies in from depth, turning, settles flat; its frame draws on | `panel(el, t, at, {z, rx, ry, x, y, dur, leave})` | cards, windows, chips, the promise list |
| The project's frame as linework, drawn on | `ornament(w, h)`, `drawOn(svg, t, a, b)` | panel corners, brackets, diamonds |
| A prompt typed while it's said, caret blinking after | engine `typed(text, t, a, b)`, `blink(t)` | every prompt of his |
| A number counting up on its word | `count(el, t, n, a, b)` | 176 prompts, 27 models, 51 checks |
| A phrase lit while he reads it | `hi(el, t, at, leave)` | "the same camera, the same layout, the same pose" |
| Before → after wipe with a fire line | `wipe(over, line, t, a, b)` | screenshot → repaint; golden hour → mist |
| A ring on the thing named | engine `ring(el, t, at)` | the roll and parry checks, the HUD's 8 |
| Cards lit while said, others stepped back | `litCards(cards, t, ats)` | the stack, the thread list |
| Step title: numeral and gilt rule on "Step", title on its words | `stepTitle(el, t, at, titleAt)` | every step |
| Footage as frame folders, cuts with 0.24 s dissolves (since 22 Nov hard cuts between shots of the same build) | `frame()`, `montage()` | cold open, hook, the UI clips |
| Scene drift 0.6 px/s, centred; 0.3 s exit into blur (since 22 Nov only where the subject or section changes) | `over` (pass to `film({ over })`) | every scene but full-frame footage |
| Background burn between looks, 1.4 s | bg.js | chapter changes |
| Camera glides between layouts, fades to/from hidden | the forked engine's `cameraAt` | the key places |

## Timing rules

- **On the word.** An element arrives 0.05–0.15 s before its word (`T.claude - 0.15`) so it's settled as it's heard.
- **The first card on the first name.** Not after the headline has sat alone for 3 s.
- **Hold to read.** A whole prompt stays ≥ 1.5 s before the cut. A headline that arrives alone is big (hero) while
  it's alone, then rises to the top when the content comes.
- **Leave before the next arrives.** A headline's leave + 0.22 s ≤ the next one's start. Scenes leave in their last
  0.3 s only at a change of subject or section (since 22 Nov; otherwise a cut); the next comes in on its word.
- **Camera moves start at the cut.** A layout that grows at a scene change starts its glide at the cut (`+ G`, 0.54 s),
  never over the scene that's leaving.
- **Step back what's done.** Once the note comes, "Build it" dims; once the verdict lands, the replaced frame dims.

## The drift

Every scene drifts left 0.6 px/s, centred on its middle, slower than the background (parallax). Starting at 0 and
growing put late key frames 10–30 px off the grid; centred keeps the middle true. Full-frame footage doesn't drift.

## 3D and sharpness

Chromium rasterises anything under perspective at its layout size: never scale a panel above 1 under 3D. Lay it out
at the size it's drawn and push it back in Z (`panel()` does). Pictures are never enlarged past their real pixels:
at a 2× render, a picture's CSS size is at most half its pixel size.
