# Checks

`scripts/check-film.mjs` measures what can be measured. This is the rest.

## Look at it, at three sizes

- **A sheet** (`render.mjs --stills … --cols 6`) for structure: does each scene read, does anything sit empty, does it change often enough?
- **Full size** (`render.mjs --stills t --scale 2`, then crop) for craft: highlights, hook, small type. A thumbnail can't show a ring touching a word.
- **In motion** (`preview.mjs`), with the sound on. Does each thing land on its word? Is any move chasing?

Do structure first and polish last. At least three rounds, and in at least two looks: the second look shows you everything you hard-coded.

## Pictures are always sharp

There are two causes, and each has its own number.

1. **A file enlarged past its pixels.** `pictures` in the checker: at 2× a picture may read 2.0 at most. Fix it in this order: show it smaller, use a bigger real file. Never fake it: no CSS sharpening, no upscaled copy. If a shot truly needs a bigger file than exists, say so. An `object-fit: cover` picture reads by its larger side, so a wide picture in a tall box goes soft first.
2. **Anything under 3D.** `soft` in the checker: Chromium draws anything under `perspective`, `preserve-3d` or a 3D matrix at its layout size and stretches that bitmap. `scale(1.7)` on a card goes soft however large the file, and a higher device scale doesn't help.

The fix for 3D is to lay it out at the size it's drawn:

- A card with `scale(s)`: give it `width: W * s`, shift x by `(W - W * s) / 2`, drop the `scale`.
- A wrapper with `scale(s)` around a 3D child: `zoom: s` on the wrapper, and divide its `left` and `top` by `s`.
- A view over a 3D child: bring its scale to 1, or `zoom` the 3D element and divide the view's scale by the same amount.
- Perspective that magnifies what's near the lens: make the thing bigger in layout and push it back in Z, so it reads the same size. Every layer stays at or below its layout size.

`soft` reads bounding boxes, so a rotated square reads high without being enlarged, and under `zoom` it misreads because `offsetWidth` stays unzoomed. Look at a full-size crop before changing anything.

Also: no `filter: blur()` on a picture or window. Dim with opacity or brightness.

## Highlights

Find them all: `grep -n "ring(\|outline\|--x-ring" film.js film.css`. For each, shoot its moment and crop it at full size.

- **Ring on an element:** a thin line (`--x-ring-w`, 1.5 px unless the look is heavy), 4 to 6 px of even clear space on every side, a corner radius following the element's. Never a thick band. Text never touches the line. A soft glow is fine under 18 px and under 0.4 alpha.
- **Fill behind a word:** hugs it, about 0.14 em at the sides and 0.08 em above and below, radius about 0.18 em. It must not touch the lines above and below, and its size mustn't jump from word to word.
- **Never clipped** by a window, a scrim or the camera.
- **Eases in and out** on its words. Check it lands on the element, in the frame where it's on, by measurement rather than by eye.

## What the checker can't see

- **Claims.** Read every word on screen and in the voice against the product.
- **Brands.** Read every frame for anything that names a company that isn't the person's. Mock data carries them in: a logo strip, a sample invoice, a chat reply.
- **A wrong picture.** A real picture of the wrong thing passes every check.
- **Two pointers,** if you drew one over a demo that draws its own.
- **Dead air.** A hold with nothing changing, longer than it takes to read.
- **Sound.** See `sound.md`.

## The export

Fil's `export_video` renders in the Fil window that has the canvas open. Then read the export's link with `get_video` and check the file itself: download it once and work on the copy, rather than running ffmpeg over its link again and again. Frames every 0.5 s; `ffmpeg -i film.mp4 -af ebur128=peak=true -f null -` for −14 LUFS ± 1 and true peak under −1 dBTP; scrub a few moves at 0.25× with the sound on.

## Blind judges

Score it to 8 out of 10 with two judges who haven't seen it made, each given frames and a sheet, the lower score counting. Five criteria at 0 to 2: the hook (would you keep watching?), clarity (could you say what it does and how?), craft (type, spacing, motion, sharpness), fit (does it look like this brand, not a template?), and sound and sync.

Judges swing about half a point on unchanged work, so act only on faults both name, and stop when two rounds come back flat. Give them every scene, or they'll call the back half empty.
