# Judging the film

The builder never grades its own work (the film's own step 5). Every change is proven with a before/after at 4K,
judged blind by two fresh judges; the lower score counts; only wins and ties are kept. This is
`workflow-score-to-target`, tuned for film frames.

## Key frames

Pick ~13 moments, one per chapter plus the hook's two halves and the close, each at the end of a spoken phrase so
the frame shows what was just said. Write them in `keyframes.tsv` (`01-hook<TAB>18.26`) and the words at each in
`NOTES.md` beside it. **The key frames move with the words**: after a realignment, re-read each from `words.js`.
NOTES.md also states facts the judges must not mark down (round 9's judges were told "twenty nine" and marked a
correct "27" down).

## A round

1. **Before**: stills of the current draft at the key frames (`render.mjs --stills … --scale 2 --jq 95`), or frames of
   the shipped preview (`ffmpeg -ss T -i preview.mp4 -frames:v 1 -q:v 2`).
2. **After**: the same times from the changed film.
3. **Pack**: `scripts/judge-pack.py keyframes.tsv <before> <after> <pack dir> <seed>` → `NN-X.jpg`/`NN-Y.jpg`, sides
   shuffled per frame by the seed, the key kept outside the pack.
4. **Two fresh judges**, each a subagent (`model: "opus"`, `effort: "xhigh"`) given `assets/judge-prompt.md` with the
   folder and an output file, nothing about which is new or what you hoped. Each scores every pair out of 10 with
   the anchored scale and names each version's main fault and what would make it a 9.
5. **Unblind** with the key; per frame, the lower of the two judges' scores counts. Keep a change only where it wins
   or ties; revert or rework the rest. Log the table in `06-watch-through.md` (draft, frame, before, after, decided).
6. Send Meng the 4K before and after of what changed, one file each, with one line on what to look at.

## What Greymourn's rounds learned

- Scores by draft (lower judge): draft 2 at 4–7; draft 3 at 7–8 after the look and motion pass; 4e eight wins, five
  ties; 4f every key frame at 8, none at 9. Each fresh judge finds new small nits: scores plateau at 8 by layout alone.
- What blocks 9 is rarely layout: soft captures at 4K, his face in the camera, the project's own UI faults inside the
  captures. Report these as what it would take, with whose they are.
- Judges grade the camera as part of the grid: on the margins or a point off.
- Dead bands beside the camera, a headline alone over an empty frame, cards taller than their content, bars from 0
  (6.5 and 8 look alike: add a target line) were each named until fixed.
- His eye overrides the judges on his own face and footage (the twin, the grade). Ask him; log his words.
- Stop when two rounds don't move the lower scores; say what's left.
