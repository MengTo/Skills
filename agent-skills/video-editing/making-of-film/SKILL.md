---
name: making-of-film
description: Make Meng To's 4–5 minute "how I made X" YouTube film from a finished project or a brief, as the Greymourn Castle tutorial was made (Nov 2026) and as he ruled after it (19–23 Nov). A demo, not a presentation, with the exact real UI and real pages full frame for at least 25 % of the runtime; the film's look from the project's own palette and 4K captures, no invented UI; a plain grade-five script in his voice, every claim checked; his voice from the first second over the result (no silent cold open), hook, promise with chapter times, stack, numbered steps, where it falls short (tips, not failures, in sponsored parts), cost, what I'd keep, end card; every cut on the voice's words, cuts by default; him on camera 10–20 % (his approved HeyGen Avatar 6 twin, or his own takes of whole sentences, 5–30 s); his cloned voice with no tag; 4K60 render and export; blind judges; Fil edit; release hand-off. Use whenever Meng wants a tutorial, making-of, build log or "how I made this" video of his project, "a video like the Greymourn tutorial", or any stage of one (script, scenes, camera, twin, render, judging), even if he only says "make the tutorial video". Not for a 1-minute explainer (html-explainer-video), a reel (html-reel), clips of him alone (meng-digital-twin) or upload and covers (youtube-video-release).
---

# Making-of film

A ~4:30 film in which Meng shows how he made something with AI: the result first, then the workflow as numbered
steps, each step his real prompt and its real result, then an honest account of where it falls short and what it
cost. It is built the way `html-explainer-video` builds films (HTML scenes drawn from one clock, every time a word of
the voice), scaled up to thirty scenes, dressed in the project's own look, with his digital twin at the key places.

Written for Meng's own setup. This public copy leaves out the IDs of his voice, his twin and his canvases: bring your
own cloned voice and HeyGen twin (`create-ai-avatar`, `digital-twin` in this repo). Skills named `meng-…` and
`youtube-video-release` below are his private ones.

**Provenance.** The Greymourn Castle tutorial ("how Greymourn was made", a browser boss-fight game), 15–19 Nov 2026:
drafts 1 → 4g over five days, threads A1 (talking clips), A2 (film and polish), A3 (release), V1 (look and motion),
V2 (UI footage), V3 (backgrounds), and 48 of his prompts about the film (164–212 in `lothric/qa/PROMPTS.md`). Draft 4f
had every key frame at 8 or more with two blind judges; 4g put his Kimi twin in the camera at 26 % of the film. The
working files are in `lothric/docs/tutorial/` of the HTML Pages repo; `references/greymourn.md` maps them, scene by
scene, with the history of what he asked for and rejected. Read it once before the first film you make.

## What changed after Greymourn (19–23 Nov 2026; these win over anything older in this skill)

Greymourn's numbers and choices stay in this skill as the dated worked example. Where they differ, follow these:

- **His voice in the first second** (19 Nov). No silent cold open and no added pauses: the result plays under his
  words. A wordless beat only where the picture's own sound or motion carries it, and only at a take's end.
- **A demo, not a presentation** (22 Nov). The exact real UI (a recording, or an exact HTML copy of it; never a drawn
  stand-in window) for at least 25 % of the runtime; real pages full frame and scrolling; never clip a design; text
  above or beside a picture, never across it.
- **Him on camera 10–20 %** (22 Nov), in a corner, a third or half the frame. Every camera stretch or take is whole
  sentences, 5 to 30 s, never cut mid-sentence.
- **Cut by default** (22 Nov). A soft exit (blur, dissolve, burn) only where the subject or section changes, never
  between two shots of the same build.
- **Grade-five words** (23 Nov), friend to friend, 2–3 of his own fillers per 30 s, nothing poetic
  (`references/script.md`).
- **His newer cloned voice on eleven-v4, no tag** (21 Nov), with run-on voice text. Instant with `[calm]` or
  `[matter-of-fact]` is superseded (`references/voice.md`). A re-voice never moves the scenes.
- **Any AI shot of him starts as his HeyGen Avatar 6 twin clip, approved by him** (21 Nov); Genjutsu only if
  necessary, and only on an approved clip.
- **Sponsored parts tell tries as experiments and tips, never failures** (16 Nov). The honest-limits chapter stays in
  unsponsored films.
- **4K60 previews and exports, with Fil's `export_video`** (19 Nov). No export is handed over until every take is
  heard and the colour tag reads bt709 (13 and 16 Nov; `references/render.md`).

## When to use which skill

| The ask | Skill |
|---|---|
| "How I made X", a tutorial or build log of his project, 3–6 min, 16:9, him in it | **this one** |
| A one-minute explainer of a product or feature | `html-explainer-video` (this skill's engine is a fork of its engine) |
| A 9:16 reel from a post, a page or a video | `html-reel` |
| An app window playing live on a web page | `html-demo` |
| A still, a talking clip or a voice line of him on its own | `meng-digital-twin` (`references/heygen-twin.md` there is the twin recipe this film uses) |
| A shot of him inside the game, a three.js or a Blender scene, in costume, saying the film's words (an insert over his camera; Greymourn scene one) | `genjutsu-scene` (HeyGen Avatar 6 twin to Genjutsu; the camera itself stays the HeyGen twin, rule 7) |
| Export, Studio upload, covers, title A/B test, description | `youtube-video-release`; covers with his AI face: `meng-youtube-cover` |
| Scoring rounds to a target ("get it to 9") | `workflow-score-to-target` (this skill's judging is that, tuned for film frames) |

## Meng's standing rules (each one came from a correction)

1. **Only what's true.** Every claim, on screen and in the voice, comes from the project's own record: his prompts,
   the git log, scorecards, ledgers, session transcripts. Greymourn's draft 2 had 9 false claims out of 53 (wrong
   prompt count, "two skills loaded" when Claude loaded one, "29 in the game" when 27 are drawn, a stale score). A
   wrong number costs a re-voice; check before the voice is made (`references/script.md`).
2. **No borrowed names anywhere a viewer can read.** Greymourn was modelled on a famous game; the film never names it,
   in the voice, on screen, in titles, tags or the description. His prompt 1 is shown with "[…]", and concept images
   with the game's names in them (a boss bar, stat names, map labels) were blurred. The same goes for any project:
   no other studio's names, characters or product names on screen unless he says so.
3. **Price first, then his yes typed in the thread doing the work.** Voice (Fil eleven-v4, ~1 credit a line, ~31 a full
   script), the twin (HeyGen Avatar 6, $0.10 a second at 1080p), captions, covers: `max_credits: 0` or the CLI's cost
   first, tell him credits and dollars, run on his typed yes. A yes relayed by a coordinator does not count for
   anything showing his face or voice. Log every spend in the film's `ledger.tsv`.
4. **Never take his mouse.** Headless Chrome for Testing for every render, capture and probe. No computer use, no
   clicks or keys in the Browser pane or any visible window, no screen recording.
5. **Never change the lighting of his camera.** His camera footage and his digital twin's frames are shown exactly as
   delivered: no grade, colour matrix, curves, LUT, vignette, brightness, contrast, saturation, relight or sharpening,
   neither baked into the frames nor applied in CSS or SVG filters over the camera window, and no shade or gradient
   laid over his face. This holds even when blind judges score a graded version higher (a warm grade won +0.5 with
   both judges and he rejected it: "I don't want you to touch the lighting at all"; then, 19 Nov, "Make
   sure you do not change the lighting of the camera"). Only framing may change (position and scale to keep his face
   on the layout), and the film's grades for plates and captures must be scoped so they never reach the camera.
6. **The camera at key places only, 10–20 % of the runtime** (22 Nov; on Greymourn it was about 25 %:
   "only put cameras at key places 25% of the video"): the intro, each step's title, the verdict, what I'd keep, the
   end card. Hidden everywhere else. Each stretch is whole sentences, 5 to 30 s.
7. **His twin, not a model's guess at him.** The camera shows his trained HeyGen twin (the Kimi look on Avatar 6),
   lip-synced to the film's own voice. He rejected Intone ("I don't speak like that!"), dropped Genjutsu and
   Seedance clips for this, and kept the twin although blind judges preferred his still ("Keep the
   twin"). Don't swap the route without asking. Since 21 Nov any AI shot of him starts as a HeyGen Avatar 6 twin clip
   he has approved; Genjutsu only if necessary, on an approved clip (`genjutsu-scene`).
8. **4K, single frames, before then after.** Every picture you send him is a full 3840 × 2160 JPEG q95, one frame per
   file, `…-before.jpg` and `…-after.jpg`, never grids or side-by-sides. Video previews 4K60, 20 Mbps or more.
9. **Shared checkout manners.** Commit only your own paths (`git commit -- <paths>`), never `git add -A`, stash,
   reset, checkout or switch branch; heavy files (frames, clips, renders) live outside the repo in
   `~/Library/Caches/<project>/`. Never call Fil `set_visibility`.

## The film's shape

Thirty scenes, eleven chapters, 4:30. Times are Greymourn's (720 words, 2.7 words a second); a new film keeps the
proportions. Full beat list, the per-step loop and the script patterns: `references/structure.md`.

| Chapter | Time | What it does | On screen |
|---|---|---|---|
| Cold open | 0:00–0:10 | the result, no voice (superseded 19 Nov: his voice starts in the first second, over this footage) | 4–5 cuts of real footage, 2 s each, the project's own sound, a small badge |
| Hook | 0:10–0:30 | the claim, in numbers, and the honest twist | "Made in three days" over the best footage; then him full frame → half; "176" counts up; his real prompt types out |
| What you get | 0:30–0:49 | the promise, with chapter times | a row per chapter, each lit on its word, its time beside it |
| The stack | 0:49–1:05 | the tools, one job each | one card per tool, landing on its name, lit while said |
| Steps 1–5 | 1:05–3:44 | the workflow, 25–45 s a step | step title (him half frame), then the loop: his real prompt → the real result → what matters marked → the number |
| Where it falls short | 3:44–4:09 | honest limits, with the real scores | "Not at nine", the judges' bars, load time, rejections, "this footage is a scripted bot" |
| What it cost | inside the above | real ledger rows | credits by line, the usage meter |
| What I'd keep | 4:09–4:20 | the workflow in four lines | him half frame, four rows |
| End card | 4:20–4:30 | where everything is | the canvas, big addresses, "Go build your own", him in the corner |

The step loop (from the reference video's format, adapted): say the step → show the real prompt, typed → show the
real result → mark the one thing that matters (a ring, a lit phrase, a wipe, a count) → one line that lands it.
The most surprising step gets the most time (Greymourn: blind judges, 47 s).

## Workflow

Ask at most one question before starting, and only if the project is unclear. Say the defaults you took.

1. **Read what was built** (`references/script.md`). The repo, the README, `qa/PROMPTS.md` (his prompts are the
   story), scorecards and judges' verdicts, ledgers, hand-over notes, the git log, the first session's transcript.
   Write `00-facts.md`: every fact the film may state, with its source. If there's only a brief, the facts are the
   brief's and the film waits for the real captures.
2. **Research the format** (`references/structure.md`): one top video in the genre read shot by shot (from its
   transcript and frames played headless: never download it), his own channel's numbers, the genre's best 10.
   Take the format, never the content, look or wording.
3. **Write the script in his voice** (`references/script.md`): grade-five words, friend to friend, ~700 words for 4:30, his real prompts quoted exactly,
   numbers said when shown, one honest exception, "the trick I'd steal first". Under each line: what the picture
   does and the word it lands on. Mark lines you wrote for him with ✎. Check every claim against `00-facts.md`.
4. **Set the look from the project** (`references/look.md`): its palette, its frame motif and metal, its UI language,
   in film tokens; the Geist trio for type; real captures of the project at 4K60, frame-exact; backgrounds made
   from the project's own data and renders. Nothing invented to look like the project.
5. **Build on a free clock.** `html-explainer-video/scripts/words.py --draft script.txt --out film/words --start 0.3
   --pace 2.7` (he speaks in the first second; Greymourn's `--start 10.1` followed its silent 10 s cold open,
   superseded 19 Nov). Copy `assets/starter/` into the project as `film/`, with
   `scripts/explainer.js`, `explainer.css` and `motion.js` beside it. Build all the scenes, one `<section>` each, from
   `references/motion.md`. Look at stills as you go (`scripts/render.mjs film.html --stills … --out …`).
6. **His voice** (`references/voice.md`): price, his yes, then his newer cloned voice on eleven-v4 with no
   tag, run-on text, one paragraph per generation (since 21 Nov; Greymourn's one take in his earlier clone
   with `[calm]` is superseded). Word times by `scripts/align-voice.py`, then
   `scripts/realign-phrases.py` phrase by phrase (one-pass whisper put 34 of 89 phrases up to 1.3 s early). Cuts,
   pauses and re-voiced lines with `scripts/voice-edit.mjs`, so no scene is renamed.
7. **The camera and his twin** (`references/camera-and-twin.md`): the camera plan at key places (10–20 %, each stretch
   whole sentences, 5–30 s), layouts on the content's grid, then one HeyGen render of exactly those stretches of the
   film's voice, approved by him before it's used; `scripts/sync-check.mjs`
   proves 0 ms sync; `assets/twin.js` plays the frames as rendered.
8. **Render** (`references/render.md`): every scene at 3840 × 2160, 60 fps, one MP4 each, under the GPU lock
   (`scripts/render-scenes.sh`), then the whole film with sound (`scripts/preview.sh`): −14 LUFS, true peak under −2.
9. **Watch it and judge it** (`references/judging.md`): a frame every 0.5 s in sheets, probes for anything under the
   camera or overflowing, every word landing; then 13 key frames, before and after at 4K, two fresh blind judges,
   the lower score counts, keep only wins and ties. Repeat until the judges plateau (Greymourn: all 8s, none 9).
10. **Assemble in Fil and hand over** (`references/render.md`): scenes, voice, the cold open's sound, a music bed,
    chapters from `scripts/film-facts.mjs`; export with `export_video` at 4K, 60 fps to Downloads (it runs in his
    own Fil), and hand nothing over until every take is heard and the colour tag reads bt709. Then the release package
    (`youtube-video-release`, covers with `meng-youtube-cover`). Nothing goes public: that's his step.

Send him 4K before/after stills as each round lands, and the preview MP4 to `~/Downloads` when he asks for it.

## Rules, each with the failure it prevents

- **Times are words, by name.** `T.screenshot`, never `131.7`. A new voice, a re-voiced line or a realignment moved
  every scene in Greymourn three times; named times made each a re-render, not a rebuild.
- **Real material only, at its real size.** Gameplay, UI and the project's world come from captures of the project
  itself (frame-exact, 4K60). The agent's or app's UI is the exact real UI, a recording or an exact HTML copy, full
  frame and uncropped (22 Nov; Greymourn's drawn window holding the real words is superseded). Soft captures were the
  one thing judges named in every round that layout couldn't fix: capture at 4K or show it smaller.
- **The film's UI comes from the project's UI.** Greymourn's gilt hairlines, diamond corners and ivory-on-near-black
  came from the game's own menus; its backgrounds were the game's castle and level plan. Judges marked down every
  "generic" device (a Tron grid floor, rainbow foil, god-ray streaks, wireframe clip art) until it was replaced by
  the project's own.
- **Something lands on nearly every phrase, on its word, then holds.** Draft 2's faults were mostly empty frames
  (a headline alone for 3–5 s, an empty prompt box, a prompt readable for 0.3 s before the cut). Land the first card
  on the first name, type the prompt while it's said, hold the whole prompt 1.5 s before the cut.
- **Calm motion.** Expo-out arrivals, soft focus resolving, panels settling flat, a 0.6 px/s drift. No shines,
  glints, sweeps or streaks (his taste across every launch film). Since 22 Nov scenes cut by default: the 0.3 s exit
  into blur only where the subject or section changes, never between two shots of the same build; demo footage stays
  alive (idle motion, hits, effects), not a still UI with a label.
- **Everything on the grid.** 120 px content margins; the camera on the same margins (corner 300 px circle at
  x 1500–1800, y 700–1000 on the 1920 stage; half 600 × 864 at the right). Judges cost the camera a point when it sat
  40 px off the edge against 120 px margins, and found every dead band beside it.
- **Where the camera leaves, the layout takes the room** but keep only reflows that win: of seven tried, three won.
- **The honest part is a chapter, not a footnote.** Not at nine, the real scores, the load time, what he rejected,
  "the gameplay is a scripted bot". It's what makes the rest believable. In a sponsored part, tell tries as
  experiments and tips, never failures (16 Nov).
- **One spend at a time, priced, logged.** Everything except voice, twin, captions and covers is free.

## Numbers from Greymourn (15–19 Nov 2026, before the rules in "What changed after Greymourn")

| What | Value |
|---|---|
| Length | 270.65 s (4:30), 30 scenes (2.8–18.9 s), 11 chapters, every chapter 10 s or more |
| Script | 720 words written, ~690 spoken after cuts; 2.7 words a second |
| Stage | 1920 × 1080, rendered at 2× = 3840 × 2160, 60 fps, 16,237 frames |
| Type | display 150–170, head 84, rows 50–56, body 32, labels 22–24, nothing under 20 (stage px) |
| Camera | 24.5 % of the film on screen by plan (26.7 % with glides); half 600 × 864; corner 300 circle |
| Twin | one HeyGen Avatar 6 render of 8 stretches, 70.8 s, $7.30, 1080p 25 fps, sync 0 ms |
| Voice | his instant clone, 31 credits for the script, 1 credit for two re-voiced lines |
| Render | ~70 min for all 30 scenes at 4K60 under the lock; backgrounds 3–7 ms a 4K frame |
| Sound | −14.4 LUFS integrated, LRA 3.4, peak −1.5 dB; music bed at 0.16 under the voice |
| Judges | 13 key frames; draft 2 at 4–7 → draft 3 at 7–8 → 4f all 8+ (lower of two Opus xhigh judges) |
| Total spend | 32 Fil credits + 197 Higgsfield (tests he asked for) + $7.30 HeyGen |

## Verify before you report

- [ ] Every claim on screen and in the voice is in `00-facts.md` with a source; no borrowed name anywhere visible.
- [ ] `scripts/film-facts.mjs film.html`: chapters start at 0:00, each ≥ 10 s; the camera is on screen 10–20 %,
  every stretch whole sentences, 5–30 s.
- [ ] He speaks in the first second; no silence that the picture's own sound or motion doesn't carry.
- [ ] The exact real UI fills at least 25 % of the runtime, full frame, no clipped design, no text across a picture.
- [ ] Every word lands: probes say nothing runs under the camera or overflows; a frame every 0.5 s looked at.
- [ ] His twin's frames are untouched and `scripts/sync-check.mjs` reads 0 ms on every stretch.
- [ ] Every kept change won or tied with two blind judges at 4K; scores reported with the lower judge.
- [ ] The preview is 3840 × 2160, 60 fps, −14 LUFS ± 1, true peak under −1 dBTP, AAC 48 kHz.
- [ ] The Fil export (`export_video`, 4K, 60 fps) passes a check that hears every camera take, and its colour tag
  reads bt709, before it's handed over.
- [ ] Spend logged in `ledger.tsv`, each with his typed yes; nothing public, no `set_visibility`.

## Files

- `references/structure.md`: the beats, the step loop, chapters, research and the reference beat sheet, titles.
- `references/script.md`: reading the project, the facts file, writing in his voice, the claims check, the full
  Greymourn script as a worked example.
- `references/look.md`: adapting the film's look and UI to the project; captures, plates and backgrounds.
- `references/motion.md`: the motion kit (`scripts/motion.js`), transitions, scene patterns.
- `references/camera-and-twin.md`: the camera plan, layouts, and his HeyGen twin end to end.
- `references/voice.md`: his voice, word times, realignment, cuts and re-voiced lines.
- `references/render.md`: rendering, the preview mix, the watch-through, Fil assembly, the release hand-off.
- `references/judging.md`: key frames, blind pairs, the judge prompt, what plateaus at 8 and why.
- `references/greymourn.md`: the worked example: where every file is, the 30 scenes, the drafts, his prompts.
- `scripts/explainer.js`, `explainer.css`: the engine, forked from `html-explainer-video` (half layout, fade to and
  from hidden, `CAM_DRAW` for the twin, `under`/`over` hooks, draws that wait for pictures, a `focus` motion).
- `scripts/motion.js`: word reveals, AR glass panels, gilt linework, highlights, wipes, counts, frame-folder footage,
  montage, step titles, lit cards, the scene drift and exit.
- `scripts/render.mjs`, `render-scenes.sh`, `locked.sh`, `preview.sh`: stills, scenes, the GPU lock, the mix.
- `scripts/align-voice.py`, `realign-phrases.py`, `fix-onsets.mjs`, `voice-edit.mjs`: the voice's clock.
- `scripts/sync-check.mjs`, `rects.mjs`, `film-facts.mjs`, `judge-pack.py`: checks and judging.
- `assets/starter/`: an eight-scene film with the structure, the look tokens, the camera plan and the twin hook
  wired; `assets/twin.js`: Greymourn's twin file; `assets/judge-prompt.md`: the blind judge's brief.
