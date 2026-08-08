# Fictional source project

## `harbour-nocturne.html` — a single-file WebGL landing page

One standalone page, 190 KB of code, no framework. It renders a night harbour: a
lighthouse sweeping a beam across fog, a tide line that catches the sweep, a
masthead in a custom serif, and three project cards that lift on hover.

The page turned out well and the team wants the reusable parts pulled out before
the next project starts.

### What the page contains

**The beam sweep.** A cone of light rotates once every eleven seconds. It reads
as volumetric because the fog density is sampled along the ray in short steps
rather than applied as a flat overlay, and because the beam brightens as it
turns toward the camera. Early versions applied fog as a screen-space gradient
and the beam looked like a painted triangle.

**The tide line.** A horizontal band where the water meets the quay, drawn with
a noise field that scrolls at two different rates so the foam never repeats
visibly. The two rates are deliberately not multiples of each other.

**The masthead.** "Harbour Nocturne" set in a licensed serif at 96px, letter-spaced
-0.02em, with the harbour name in the client's blue (#1B3A57).

**The card hover.** Cards lift 6px over 240ms on `cubic-bezier(.22,.65,.28,1)`
and their shadow softens at the same time. The shadow is a second layer rather
than a single box-shadow, so the lift and the blur can run on different curves.

**The preloader.** A full-screen wipe that clears once the WebGL context reports
its first frame. It exists because the client asked for one.

**Performance notes.** The fog march runs at 24 steps on desktop and 12 on
mobile, chosen by pixel count rather than by user agent. Device pixel ratio is
capped at 2. The whole scene pauses when the tab is hidden.

**A bug that took a day.** The beam's emissive orange came out of the tone-mapped
composite as pink. Driving green and blue toward zero fixed it; adjusting the
orange in the editor never did, because the value is decoded before the material
multiplies it.
