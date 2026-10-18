# HTML Demo prompts

## Minimal prompt

```text
Use $html-demo to show our app's main flow on the landing page as a live HTML window, not a video: 3–5 steps, each drawn from t at 1200 × 750, with the real UI's words and pictures and a pointer that clicks like a person.
```

## Recreate the demo

Use `$html-demo` to build **HTML Demo**, a page holding one standalone demo: Fil for Mac making a picture of The Ashen One. Treat `index.html` as the reference for visuals, motion, responsiveness and accessibility.

### Experience

- The first screen has a kicker naming the stack (**Vanilla JavaScript · DOM/CSS**), the title **HTML Demo**, one paragraph stating the mechanism and what fails without it, and then the window, already playing.
- A Mac window (traffic lights, Home, the tab "The Ashen One", globe, menu) shows Fil's canvas: the rail, the top bar with the balance, the canvas chip, two image nodes (Cathedral, made; Knight, empty), the inspector and the bottom toolbar.
- Three steps in the bar: **Write the prompt** (the pointer clicks the Knight's prompt and it's typed in), **Generate** (a working state, then the picture draws in from the top under a warm scan line, settles with a glint, 7 credits come off the balance, and the inspector shows the result), and **Open it** (the picture flies from its node to the middle of the full view as the view darkens in, then the pointer rests on Edit).
- Under the window: Pause/Play, a scrubber over the whole 18 s with the time, and an "End frames (reduced motion)" switch.

### Implementation contract

- Use `scripts/step-window.js` (`HTMLDemo.mount`) with `scripts/step-window.css`. Each step is `{ id, name, dur, html, draw(t, $) }`. The step's markup is built once, and `draw` sets every moving part from `t`: text, clip-paths, rects, opacity and classes.
- Place the pointer with `glide()`. Measure its targets from the DOM (in stage pixels, divided by `--k`) whenever the layout changes.
- Use Fil's own sizes: rail 54 px, top bar 50 px, main inset 6/8/8/56 px with a 12 px radius, nodes 236 px wide, and the 22 px dot grid. Use Fil's own icon paths and words: "Describe what to make", "Images will appear here", "Usually under a minute", "Last run · 0:04 · 7 credits", Upscale, Remove background, View | Edit, Download.
- Make the slider exact: read its value before pausing (pausing redraws and writes the old time back), then seek.
- Under reduced motion, show each step's end frame, still, and keep the bar's buttons working.

### Restrictions

- No video, canvas, WebGL or libraries. Load only Geist from Google Fonts.
- Use only owned pictures (`knight.webp`, `cathedral.webp`, `avatar.webp`), never stand-ins.
- Every label must be one Fil really shows.

## Remix prompt

```text
Use $html-demo to show [your app] doing [one task] in a live HTML window on [page]. Pick one example you own and use it in every step. Collect references of the real UI first (screenshots, frames from its docs videos, its source for the wording). Script 3–5 steps of 4–8 s, each with a beat to see the start, the action, the result appearing as the app shows it, and a 1 s hold. Draw each step from t at 1200 × 750 in the app's own tokens, with a pointer that arrives early, presses for 0.16 s and rests out of the way. Shoot frames every 0.5–1 s and compare them with the references for three rounds before you call it done. Keep the mechanism (pure from t, one scale, plays only on screen, designed end frames); change everything else: the app, the palette, the window chrome.
```
