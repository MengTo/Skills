# The format

One minute, four parts, in this order. It works because it pays off first and teaches second.

| part | seconds | job | what's on screen |
| --- | --- | --- | --- |
| **Hook** | 3 to 6 | Make them keep watching | A set piece that fills the frame. No heading yet, no logo. The first frame is the cover |
| **Benefit** | 12 to 20 | What they get, in their terms | The result, in a few changing pictures, each landing on its word |
| **Quick tutorial** | 22 to 30 | Show it's easy, in 3 or 4 steps | Numbered headings ("One. Say what to explain."), the real UI or the real thing |
| **Try it** | 6 to 14 | One thing to do now | The ask, the name and where to get it. Hold it 2.4 s past the last word |

## The script

- **Size it to the voice.** A generated voice reads about 2.6 words a second with its sentence pauses: 140 to 155 words a minute. Count before you pay.
- **Write for the ear.** Short sentences. Numbers and names as they're said ("fil dot design"), capitals only on screen. Read it aloud; a line you stumble on, the voice will too.
- **Open on the surprising true thing.** Not the product's name and not a question. "This video was never filmed." "One post. Six platforms. Every comment answered. And you slept through all of it."
- **Benefit in their words.** What they stop doing, or what they now have. No feature list.
- **"Here's how."** Then steps as a person would say them. Each step's first word is its number or its action.
- **End on one ask,** small enough to do today. "So try it on one feature today."
- Every claim is on Explainer.md's list, checked against the product.

Under each line in Script.md, write what the picture does and the word it lands on:

```
Your colours.
  Each strip's own ground and ink wipe in on "colours"; swatches land.
```

## Explainer.md

```
What: the thing, in one sentence.
The one idea: what someone should leave believing.
For: who's watching, and what they already know.
Facts it may state:
- each number, name and claim, and where it comes from (a URL, a file, a page)
The ask: the one thing to do after watching, and where.
Look: read from <site>, or a named style.
Shape: 4:3, 16:9, 1:1 or 9:16, and where it'll be seen.
Camera: off (the default), or on.
```

## Explaining an idea

The tutorial part changes name, not shape. For an idea with no product ("why the sky turns red at dusk"), the numbered steps are how it works: "One. The light has further to go." Draw the thing in HTML or SVG: a diagram, a chart with real numbers, a labelled picture. Say where each number comes from in Explainer.md. A chart in a look is still only `--x-` variables.

## The scene patterns

Each is a section of HTML plus a `draw(t, $, f)`. `demo/film.js` has a working one of each.

| pattern | when | how it adapts |
| --- | --- | --- |
| **Layers apart** (`hook`) | "How is this made?" A frame taken apart in 3D | Each layer laid out at the frame's size and pushed back, so it stays sharp and fills any shape when it comes flat |
| **Cards landing** (`give`) | A list said aloud, one card on each word | A grid: 3 across, or 3 rows on 9:16 |
| **Panels** (`makes`) | Several things that make one thing | The same grid, panels filling as each is named |
| **Looks side by side** (`look`) | "Yours, not ours" | Strips, each carrying its own `data-look`; each word comes in by its own look's motion |
| **A window with typing** (`step1`) | The person's action | `typed()` from `t`, a caret from `blink(t)`, a press on its word |
| **A real page, read** (`step2`) | Where something comes from | A real page from the first frame, rings on what's named, values read from the page's real variables. Never a wireframe: it reads as a placeholder |
| **Karaoke with a ruler** (`step3`) | Timing, order, anything along a line | Real data on a real axis, a playhead from `t` |
| **Lanes filling** (`step4`) | Parts coming together | Each block placed from real lengths |
| **A switch** (`camera`) | On or off, before and after | Two real layouts from `frameOf()`, eased between |
| **End card** (`end`) | The name and the address | `fit()` so the longest line holds. Things keep landing on the words after the name, and the address is big: it's the only next step |

## Drawing someone's real UI

A demo in a scene is redrawn in HTML from their screenshots, never a screenshot playing as the demo. Use `html-demo`'s method for a whole window. Copy every label, menu item and number from the source with grep, never from memory. Where a screenshot and the live product differ, the live product wins. Crop a real picture only for what HTML can't draw: a thumbnail, a photo.

Put the window under a view (`view(el, t, stops)`) and move it, rather than animating the UI inside it. Keep buttons clear of the camera's corner if the camera's on. Hide any cursor the demo draws if you draw your own, or you get two pointers.

## The set piece

A hook's first frame is its best frame, and from there it's something no screen recording could show. Ideas that held up: a stack of real results fanned in 3D that collapses into the one that matters; one post as six platforms' cards; a clock at 3:07 AM with the work arriving while nobody's there. It's specific to the thing. A generic particle field is not a set piece.
