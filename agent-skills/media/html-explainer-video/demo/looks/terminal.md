# Look: terminal

Measured from survey-page-terminal-style.html (“What should Hearth bake next? · Hearth”).

| what | read | candidates |
| --- | --- | --- |
| Mode | dark | |
| Ground | #0a0d0b | #0a0d0b, #0e1310, #0d120f, #7dff9e |
| Ink | #d9f2df | #d9f2df, #9cbaa4, #a9c8b1, #648070, #7dff9e, #ff7a6b |
| Second ink | #9cbaa4 | |
| Accent | #7dff9e | #7dff9e, #06200f |
| Panel | #0e1310 | |
| Headline | JetBrains Mono 700, 52 px on the page, tracking -0.020 em, case none | “What should Hearth bake next?” |
| Body | JetBrains Mono 400, 13 px | |
| Corners | 4 px small, 4 px large | 4px, 10px |
| Edges | 1 px | 1px |
| Shadow | rgb(31, 43, 35) 0px -1px 0px 0px inset | 21 elements |
| Moves | rise: a first guess from its transitions (0.18, 0.6, 0.3, 0.2 s) | |
| Fonts loaded | Inter, JetBrains Mono | |

## Left for you

- **Fonts:** JetBrains Mono, asked of Google Fonts. Check they load: if one isn't there, add a @font-face from the person's own files, or name the closest. Fil's captions list has 42 faces: pick the closest for the captions.
- **Compare** the page with a still of the film in this look. A dark hero on a light site reads as the site's ground: fix --x-ground by hand.
- **Motion:** watch the page and set --x-motion (rise, fade, snap or wipe) and --x-motion-dur.
- **Ground:** --x-ground-image is flat here; bring across the page's gradient, grain or grid if it has one.
- **Real logos and real pictures only:** copy them from the person's own files. Never redraw a mark.

## What was then done by hand

The reading above stays as it was. The block's second half in `terminal.css` adds the layout: a prompt at the foot, panes that fill the frame, ruled lines, pictures in phosphor, and moves that cut.
