# Rendering, the watch-through, Fil and the release

## Render (free, slow, under the GPU lock)

- Stills while building: `scripts/render.mjs film/film.html --stills 18.26,29.23 --scale 2 --jq 95 --out <dir>`
  (3840 × 2160 JPEG q95; it steps to each time from 0, so anything that depends on earlier frames shows).
- Scenes: `scripts/render-scenes.sh film/film.html <out dir> all` — every scene a 4K60 H.264 MP4 (CRF 17), one at a
  time under `scripts/locked.sh` (one GPU lock shared by every thread that renders or captures; ~70 min for 30
  scenes). Re-render only what changed: `… s1b,s2c`. Run it niced, in the background.
- `render.mjs` uses Chrome for Testing headless (Playwright's, at `~/Library/Caches/ms-playwright/chromium-1248/…`,
  override with `CHROME=`), never his Chrome. `--test` prints ms a frame.
- Keep each draft's clips in their own folder (`final7/`, `final8/`…) in `~/Library/Caches/<project>/`.
  When nothing but the picture changed, every scene keeps its frame count, so the cut's length and chapters hold.
- A killed render leaves the lock for 10 minutes: check no render of yours runs, then `rmdir` it. A long
  `render-scenes.sh` starves other lock waiters; batch your captures into one lock session.

## The preview (the whole film with sound)

`scripts/preview.sh film/film.html <scene dir> <voice> <out.mp4> <end s>` with `COLD=` (the cold open's own sound, from
0), `BED=` (a music bed, the project's own tracks if it has them; Greymourn used the game's explore and court
themes), `BED_AT=9.4`, `RISE=a,b` for a beat with no voice. Two loudnorm passes to −14 LUFS, true peak −2.6 before
AAC so it lands under −2; 48 kHz (a 96 kHz AAC and a −0.9 dBTP peak were draft 2's faults); HEVC ~30–48 Mbps. Put it
in `~/Downloads` when he asks for the video.

## The watch-through (before any judging)

1. A frame every 0.5 s of the preview into labelled contact sheets (48 a sheet = 24 s), all looked at.
2. 4K frames at every suspected fault (thumbnail impressions were wrong twice: check "small type" at 4K).
3. Probes in headless Chrome: nothing under the camera (`scripts/rects.mjs … --cam` every 0.25 s), no text overflowing
   its box, every element landing on its word (compare against `words.js`).
4. Sound: `ffmpeg -af ebur128=peak=true`.
5. Write `06-watch-through.md`: scene by scene, time, what's on screen, faults F1…, each with the exact fix. Greymourn's
   draft 2 log had 20 faults; most were empty frames and early landings.

## Fil assembly

On the film's canvas:
- `upload_file` each scene MP4 (the 3-step direct upload over 4 MB), then the voice, the cold open's sound and the bed.
- First draft: scenes in film order on one track, voice, cold-open sound at 0, bed under, chapters from
  `window.CHAPTERS` (`scripts/film-facts.mjs --yt`). Later drafts: `{"op":"replace","clip":…,"file":…}` per changed
  scene, then `trim dur` if a length changed; audio can't be replaced, only removed and added.
- Rename the edit per draft ("Greymourn tutorial · draft 4f"). Keep earlier drafts' nodes untouched.
- Export with `export_video` to Downloads at 4K, 60 fps (the full-size file; Save to canvas shrinks to the plan's file
  size). It runs in his own Fil (Fil for Mac with the canvas open in its own tab): Fil can't draw the edit until he
  opens the canvas, so say so, and after new files or remakes ask him to reload that tab first. Never set visibility.
- **No export is handed over, called done or uploaded** until it passes the sound gate and the colour tag (13 and
  16 Nov): a check that hears every camera take in the file (`takes-heard.py` in his private `youtube-video-release`)
  and a format check (3840 × 2160, 60 fps, the edit's length, about −14 LUFS); `ffprobe` reads bt709 for
  color_transfer, color_primaries and color_space (a browser-tab export tagged sRGB played darker on YouTube; retag
  without re-encoding).
- Captions: Fil's captions from the real voice (~1 credit a minute), priced, only once the cut is locked.

## The release package (hand-off)

`04-release-package.md`, then `youtube-video-release` does the upload and Studio:
- Three titles, one hook each, each paired with a cover for the A/B test; no title repeats its cover's words; no
  borrowed name; every claim in the voice.
- Description: the result in one line, the link to everything, the workflow in two short paragraphs, the honest
  limits, CHAPTERS (from film-facts), RESOURCES (every tool and skill, curl-checked), A FEW OF MY PROMPTS (verbatim).
- Tags, pinned comment with a question, Studio settings: altered or synthetic content **Yes** (his cloned voice, his
  twin, AI concept art), Private until he says "post it".
- Covers: his twin's frames are AI, so the route is `meng-youtube-cover` (his approved face in new poses, priced) or a
  free HTML cover from the project's real 4K frames with his approved still cut out untouched.
