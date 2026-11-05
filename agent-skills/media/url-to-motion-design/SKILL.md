---
name: url-to-motion-design
description: "Turn a launch film, product video or post at a URL (an X or Twitter post, YouTube, Vimeo, a direct video link) into Fil HTML motion scenes. Captures the film's best 5 to 10 distinct motion-graphics shots as screenshots and clips, rebuilds each as an original Fil motion scene in its look with Fil's own words, polishes them with blind judges to 8/10, puts them in a section of the HTML motion scenes canvas, and shows them as a screening page and MP4s. Use when someone shares a video or a post and asks to capture its scenes, to get screenshots of its best shots, to add its scenes or style to the motion scenes library, or to make motion scenes like it, or says url to motion design, even if they only ask for the screenshots first."
---

# URL to motion design

A film someone admires becomes new scenes in Fil's motion scenes library: same look and motion ideas, Fil's own words, no trace of the
original's brand. The whole loop ran once end to end on 5 Nov 2026 (a 3-minute launch film on X → nine scenes, four at 8/10, on the
canvas, as a screening page and MP4s); this skill is that loop with its traps fixed.

Paths: `<skill>` is this folder, `<repo>` is the facet-studio checkout, `<run>` is the run folder (`<repo>/qa/<slug>/`, untracked).

## 1. Get the source
```bash
node <skill>/scripts/fetch-source.mjs "<url>" <run>/source
```
X posts come through api.fxtwitter.com (the post's own video and text); YouTube and Vimeo through yt-dlp; direct links as they are.
Read `source.json` (text, author, length) so you know what the film is about.

## 2. Find every shot, pick the best 5 to 10
```bash
node <skill>/scripts/shots.mjs scan <run>/source/source.mp4 <run>/scan
```
Read every 1-fps sheet in `<run>/scan/sheets/` (tile k of `1fps_<start>.jpg` is second start+k) with `cuts.txt` beside them. Pick:
- **Motion graphics only**: animated type, diagrams, UI, data, particles, collages. Skip talking heads and plain footage.
- **No repeats** (the owner: "scenes should not be repeatable"): one of each kind. Two shots on the same device (a white and a dark node
  map, two particle spheres, two photo collages) means keep the stronger. Same look but a different idea (a tower and a grid) can stay.
- **5 to 10 seconds each**, bounded by real cuts. Shots under 5 s go. Soft transitions hide inside long runs: when a boundary is unclear,
  look at 0.2 s strips (`ffmpeg -ss <t> -t 2.4 -i src -vf "fps=5,scale=320:-1,tile=6x2" -frames:v 1 x.jpg`).
- **The best 5 to 10**, ranked by craft and by how well the idea carries to Fil.
Write `picks.json` (`[{id, name, a, b, hero, what}]`, ids short and prefixed per section, e.g. `pg-tower`), then:
```bash
node <skill>/scripts/shots.mjs pick <run>/source/source.mp4 <run>/picks.json <run>
```
Look at `overview.jpg` and every hero still: a frame mid-transition (two captions crossfading, motion blur, a word half-swapped) needs
another time. Send the overview and the stills with `SendUserFile`.

**Stop here if they asked for screenshots first.** Ask before building: the build is hours of agents, not credits, but it's their call.

## 3. Set up the run
- Write `<run>/BRIEF.md` from `references/builder-brief.md`: the section name (a plain look name, never the source's brand), the look
  in your own words, one font family for every scene, and per scene its id, length (the shot's, 5 to 8 s), message type (feature, number,
  statement) and a first idea that carries the shot's motion into Fil's world with true facts only.
- Start the lab (`references/lab.md`): a launch.json entry for `lab/server.mjs`, `preview_start`, smoke-test `scripts/render.mjs`.
  In-app browser only.
- Folders: `<run>/scenes/`, `<run>/out/`, `<run>/keep/`, `<run>/judges/`.

## 4. Build with helpers
Three general-purpose helpers in the background, 2 to 4 scenes each, grouped by ground (light data, light product, dark), each told to
read `<run>/BRIEF.md` and everything it lists, edit only its own files and report one line per scene. While they work, keep the runner
awake (lab.md): this is where the time goes if you don't.

## 5. Judge blind, fix, repeat
```bash
python3 <skill>/scripts/panel.py setup <run> <tag> <id,id,…>     # sheets + two anchors, shuffled
# two fresh general-purpose agents, each: read judges/<tag>/JUDGE.md, Read every sheet, write judges/<tag>/judgeN.jsonl, read nothing else
python3 <skill>/scripts/panel.py tally <run> <tag>
```
- Judge a helper's scenes as soon as they report; don't wait for all. Copy every judged version to `keep/<id>-<tag>.html` (+ its sheet)
  before anything changes, and check helpers didn't edit after reporting (`cmp`).
- **8, 8 passes.** Save it as `keep/<id>-pass-<tag>.html` and tell its helper never to touch it again.
- Below 8: send the verdicts word for word plus your own one-line read and the fix (`references/seven-to-eight.md`). Read the sheet
  yourself before blaming a layout; one round was lost to misreading a sheet's cell heights.
- A version that scores lower is dropped: restore the better one as the base. Two rounds where the notes name the idea itself means a
  new idea in the same look. After about six judged versions at 7, stop and ask the owner (they chose "Leave them at 7" in round 19).
- Panels vary about a point; the anchors tell you how strict this one was.

## 6. Put them on the canvas
`references/publish.md`: an empty section sized for all of them, one Code/motion node each with its score in its name and a full note,
pages written by a cheap helper with character counts checked, the best judged version for scenes short of 8, a canvas log line.
Free: never `generate`.

## 7. Show them at speed
Unasked: a screening page (scripts/screening.mjs → tested on localhost → Artifact) and real MP4s with sound (scripts/video.mjs, ~12 min
for a minute of scenes). The owner asked "show me videos" twice: a live page wasn't enough the second time, the files were.

## Rules that hold throughout
- **Style, not copy.** Look, palette, type feel, camera and motion language only. Never the source's brand, product, logo, words,
  people, photos, partner logos, claims or exact layouts. Fil's cube (verbatim from `public/favicon.svg`) is the only logo. The source
  clips are reference, never published.
- **True facts** about Fil only (references/scene-contract.md, Words).
- **The bar is 8 from two fresh blind judges, lower score counts**, and you say honestly what's short.
- **Record evals**: every verdict as a line in the lab's `scores.jsonl`.
- No product change, so no version, changelog or commit in facet-studio; the skill's own changes go to `~/.claude/skills` and MengTo/Skills.

## Report
One table: scene, judges, on the canvas (pass, or best version and why it's short), the canvas link, the screening link, the video files.
Then what's short and what would move it (usually a new idea, not polish).
