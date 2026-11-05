# Fil HTML motion scene contract

Every scene is one self-contained HTML page, played once and drawn frame by frame by Fil's video editor (`src/backend/video/sceneRuntime.js`
seeks it; `tests/htmlScenes.test.js` checks the contract). Start from `lab/template.html`: its head, `:root` rules, stage, fonts and
rebuild pattern are the house standard.

## Head
- `<!doctype html>`, `<html lang="en" data-mode="dark|light">` (the style's own mode), a `<title>` naming the scene.
- `<meta name="fil:duration" content="N">`: the scene's length in seconds (the library's default is 5; a shot from a film can be 5 to 8).
- `<meta name="fil:sounds" content="0.55 click · 1.40 pop-soft · 3.70 success">`: two to four sounds on moments that carry meaning.
  Ids: click, tap, button, toggle, key, typing, pop, pop-soft, whoosh, whoosh-soft, swish, swipe, impact, hit, thud, snap, success, ding,
  ting, chime, sparkle, glitch, blip, shutter, scroll, paper, riser-short. Move them when the timing moves.

## Colours, fonts, stage
- **Colours** only through variables in the first `:root` rule (`--bg --ink --muted --card --line --accent --accent-ink`, and
  `--c1 --c2 --c3` or a few more), with the other mode's values for the SAME names in `:root[data-mode="light"]` or `[data-mode="dark"]`.
  Tints via `color-mix(in srgb, var(--ink) 12%, transparent)`. No other colour anywhere. Both modes must look designed.
  Exception: Fil's cube copied verbatim from `public/favicon.svg` keeps its own fills (a logo isn't themed).
- **Fonts** only through `--font-display` (with `--display-weight`, `--display-track`), `--font-text`, `--font-mono`, set in that first
  `:root` and loaded from Google Fonts with the template's `<link crossorigin="anonymous" …>`. All scenes of one section share fonts.
  Avoid the AI-template stack (Inter Tight headline + serif italic accent + tracked mono capitals). Measure text after
  `document.fonts.ready` and on resize, so a person's other font still fits.
- **Stage** exactly as the template: `.stage` centred, `width: min(100vw, 177.78vh); aspect-ratio: 16/9; container-type: size;
  overflow: hidden`. Size everything in `cqw`. On-screen words at least 1.3cqw (faux-UI labels 1.1cqw, but 1.8cqw is what judges read).

## Editable words
`data-fil-text="key"` + `data-fil-label="Human label"` on elements whose words a person would change; a list is one element with items
split by ` · `. Scripts read them at load. Headlines must fit 1.6× longer and 0.5× shorter.

## Loading
Nothing loaded but Google Fonts, except Three.js when a scene truly needs real 3D: an import map to
`https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js`, `WebGLRenderer({preserveDrawingBuffer:true})`, every move worked out
from `performance.now()` inside `requestAnimationFrame`. Draw the rest in HTML, CSS and inline SVG. No images, no external icons.
Pages under 30 KB (Fil refuses bigger).

## Timing and motion
- The first frame (0 to 0.3 s) is already a composed picture: a video cuts into it.
- Main beat by about 40 % of the length, a second beat by about 70 %, a composed poster by about 85 %, held with visible life to the end
  (never a frozen last 1.5 s, never a slideshow).
- Web Animations API from a script at load and/or CSS keyframes with delays and `fill: both`. No setInterval, no transitions, no events,
  no Math.random (seeded PRNG). rAF only for Three.js or a canvas, driven by `performance.now()`. Frames are identical every render.
- Easing with weight: entrances `cubic-bezier(.2,.8,.2,1)`, moves `cubic-bezier(.65,0,.35,1)`, springs `linear()` or overshoot beziers
  sparingly. One focal point at a time.
- UI rules: no left accent stripes on cards or list items, no browser focus rings, consistent radii, soft layered shadows, real labels.

## What the renderer draws
Each frame is modern-screenshot's clone of the live page in an SVG foreignObject. Works: clip-path, mask-image gradients, filter
blur/saturate, backdrop-filter, SVG dash with pathLength, SVG text, transforms and perspective. Wrong: preserve-3d paints in DOM order (no
depth sorting), backface-visibility is ignored, an SVG path's `d` doesn't animate (use dash or clip reveals). If something draws wrong,
change the technique. Canvas and WebGL scenes: draw once per captured frame (hook `canvas.toDataURL`), or a shadow-mapped scene draws ~24
times per frame and can reset the GPU.

## Words
Real characters, never `\uXXXX` escapes, no non-breaking spaces, no em dashes in words on screen. No coffee, bakeries, fake testimonials,
"AI slop". Words are about Fil: nodes (prompts, pictures, films, 3D models, pages, sounds, documents), threads, one click
("Generate all"), finished work, publishing; line "One thread from idea to finished work." Figures only if true (a launch film of nine
five-second scenes, about 45 s, made with one click; Fil's MCP tools add_node, connect, generate, write_file, look).
