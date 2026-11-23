# Worked example: the Greymourn Castle tutorial (15–19 Nov 2026)

History, kept as it was made. Its silent cold open, ~25 % camera, Instant voice with `[calm]`, drawn windows and soft
exits between shots are superseded by SKILL.md's "What changed after Greymourn" (19–23 Nov).

Read once before the first film. Paths: `R` = the game's folder in Meng's projects repo, `C` = the film's cache folder outside the repo (frames,
clips, renders), `N` = the threads' hand-over notes folder.

## Where everything is

| What | Where |
|---|---|
| Working docs | `R/docs/tutorial/`: `01-reference-beat-sheet.md`, `02-script.md` (lines + what each picture does), `03-research.md`, `04-release-package.md`, `05-priced-list.md`, `06-watch-through.md` (every draft's changes, faults and judge tables), `07-ui-footage.md`, `ledger.tsv` |
| The film | `R/docs/tutorial/film/`: `film.html` (30 scenes), `film.js` (timeline, CHAPTERS, KEYS camera plan, PLATES, CAM_DRAW), `film.css` (the look), `explainer.js/css` (the engine fork), `bg.js` + `BG.md` (WebGL backgrounds), `twin.js`, `words.js/json`, `script.txt`, `voice-d3.m4a` |
| Tools | `R/docs/tutorial/tools/`: `render.mjs`, `render-scenes.sh`, `locked.sh`, `preview3.sh`, `capture-ui.mjs`, `capture-plates.mjs` + `plates.json`, `encode-ui.sh`, `extract-gameplay.sh`, `align-voice.py`, `realign-phrases.py`, `fix-onsets.mjs`, `voice-edit.mjs` + `voice-edits.json` |
| Heavy files | `C/gp/` (gameplay frames), `C/ui-footage/<clip>/frames/`, `C/plates/<plate>/frames/` (~8 GB), `C/finalN/` (each draft's scene clips), `C/greymourn-tutorial-draftNN-4k60.mp4`, `C/a2*/` (stills, judge packs, verdicts) |
| Draft 4g | `greymourn-tutorial-draft4g-4k60.mp4` (in Downloads) (3840 × 2160, 60 fps, 270.65 s, −14.4 LUFS) |
| Hand-over notes | `N/tutorial-*.md`, `N/v1-claims-check-2026-11-17.md`, `N/v2-ui-footage-2026-11-17.md`, `N/v3-film-backgrounds-2026-11-17.md`, `N/COMMON-THREAD-RULES.md` |
| His prompts | `R/qa/PROMPTS.md`, 164–212 |
| Fil | the tutorial's canvas, one edit node per draft (1, 2, then 3–4f in one) |
| His twin | his twin workflow canvas in Fil (section 10, HeyGen twins on Avatar 6); render `C/a2kimi/render/kimi-keys.mp4` |

## The 30 scenes

cold · hook · nocode · promise · stack · s1a (step title) · s1b (prompt 1 in a window) · s1c (day one: 6 h, 12 prompts) ·
s1d (51 checks) · s2a (step title, the A-pose knight with callouts) · s2b (12 concepts, 27 in the game) · s2c (anims.js) ·
s2d (only a rock) · s3a (step title, the screenshot) · s3b (the repaint wipe, prompt lit) · s3c (target vs live, round 1) ·
s3d (golden hour → mist) · s4a (step title, six UI concepts) · s4b ("Build it", his notes) · s4c (the real UI full frame,
the 3D map beat) · s5a (step title, threads) · s5b (8 against 3) · s5c (the blind pair, X and Y) · s5d (two judges, lower
counts, 9) · lim1 (not at nine, round 16 bars, load time) · lim2 (four rejected walks, Approved) · lim3 (scripted bot) ·
cost (ledger, usage meter) · pay (what I'd keep) · end (canvas, links, Go build your own).

## The drafts

| Draft | Date | What changed | Judges (lower) |
|---|---|---|---|
| 1 | 16 Nov | 30 scenes on the explainer engine, the Mac's voice, a drawn placeholder for him, the Fil edit | — |
| 2 | 16 Nov | his voice (31 credits), his still 166 in the camera | 4–7 |
| 3 | 17 Nov | V1: Geist type, masked reveals, AR panels, drift/exit, F1–F20 fixed, three false lines cut; V2: real UI footage; V3: bg.js | 7–8 |
| 4 | 17 Nov | A2: the game's own castle as plates, layout from 4 judge rounds | 7.5–8.5 |
| 4c | 17 Nov | two number lines re-voiced (1 credit) | — |
| 4d | 17 Nov | every word re-timed phrase by phrase (34 of 89 phrases were early) | — |
| 4e | 17 Nov | camera on the content grid, dead columns fixed, centred drift | 7.5–8 |
| 4f | 18 Nov | the 8-level nits, drift halved | all 8+, none 9 |
| 4g | 18–19 Nov | the camera at key places only (26 %), his Kimi twin, three reflows; grade removed | twin frames 5–6; he kept them |

## His prompts about the film, and what each changed

| # | His words (short) | What it changed |
|---|---|---|
| 164 | "create a five-minute tutorial with the skills that I have created… take a look at the best performing videos… reference [a YouTube video]… using my likeness" | the whole thread: beat sheet, research, script, scenes, Fil edit; twin and voice priced first |
| 165 | "B: clips, 800" | talking clips where he's large, a still in the corner, cap 800 credits |
| 169 | "show the UI… the 3D map… Geist Serif and Geist Sans and Geist Mono… awesome animations and backgrounds like our blender scenes and AR UI, holographic UI, and in-game UI. Get to 9 out of 10!" | draft 3: V1 look and motion, V2 UI footage, V3 backgrounds |
| 173/175 | "Yes, re-voice both" | two lines re-voiced and spliced, 1 credit |
| 174–180 | Genjutsu? / run both tests / Intone is clearly better / other cameras / improve the mouth and eyes | Seedance and Intone tests (197 Higgsfield credits) |
| 186 | "I don't speak like that! Stop doing a poor job at recreating my likeness!" | Intone dropped |
| 190–191 | "LOOK at my REAL camera recordings!!" / "SPEAK NATURALLY" | his real mouth, eyes and pace measured; the trained twin proposed |
| 199 | "Use my Kimi twin" | the HeyGen Kimi twin in the camera, on the film's own voice |
| 200 | "we're not using genjutsu" | Genjutsu dropped for this film (since 21 Nov: only if necessary, on an approved HeyGen Avatar 6 twin clip) |
| 202 | "only put cameras at key places 25% of the video" | KEYS camera plan, reflows where it left (since 22 Nov the share is 10–20 %) |
| 208 | "put the video in downloads" | draft 4g to Downloads |
| 209 | "Keep the twin" | twin kept although judges preferred the still |
| 210–211 | "Turn this whole video… into a skill" / "in a new thread" | this skill |
| 212 | "can you not touch my video?… I don't want you to touch the lighting at all" | the twin's grade removed |
| 146 (launch) | "Put 3 days bc i did this on and off" | "Made in three days" stays his framing |
| A3 | "Souls-like" in a title: no | no borrowed name in any title, tag or line |

## Spend

32 Fil credits (voice 31, re-voice 1), 197 Higgsfield credits (Seedance and Intone tests he asked for, ~$7.70),
$7.30 HeyGen (one Kimi render). Rendering, captures, judging and the Fil edit were free.

## Still open at 4g (what a 9 would take)

Soft captures at 4K (the screenshot/repaint pair, the settings thumbnail, his Fil canvas screenshot: needs his own
Retina capture), the twin's softness at half frame, the game's own UI faults inside the captures (V2's list of 12),
captions (priced once the cut is locked), covers (meng-youtube-cover, ~60 credits on his yes).
