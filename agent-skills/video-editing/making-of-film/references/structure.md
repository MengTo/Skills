# The film's structure

## Contents
- Research before writing
- The beats, with Greymourn's times
- The step loop
- Chapters
- Titles and the hook
- Length

## Research before writing (half a day, free)

1. **One reference video, read shot by shot** for its format only. Greymourn's was a 14:49 Higgsfield tutorial
   (71K views in a day). Read it from the page's transcript and ~180 frames played in headless Chrome (one a second
   for the first 24 s, then one every 5 s). No download. Write `01-reference-beat-sheet.md`: words a second, chapter
   lengths, how often the picture changes, the layouts it uses, its motion and UI devices, then "what we take" and
   "what we leave" (its length, sales offer, colours, type, footage and wording are always left).
2. **His channel** (DesignCode) and **the genre**, last 12 months, view counts from the watch pages: `03-research.md`.
   Greymourn's findings: his winners are "new model + a craft result" at 37–50 min; he had no upload near 5 min, so
   the length had no baseline (say so); the genre's winners put the finished thing on screen in the first 5 s,
   hard numbers by 0:15, one honest line ("it's not one prompt"), then the pipeline in order, then what broke.
3. Reference formats that worked, found in that research: "I built X in N days / for $N"; a contest against a known
   yardstick (bigger numbers, different audience); one idea every 15–60 s for the short ones.

## The beats

Greymourn, 270.65 s. The scene ids are film.html's.

| Time | Scene(s) | Beat | What the picture does |
|---|---|---|---|
| 0:00–0:10 | cold | Cold open, no voice | 5 gameplay cuts × 2 s, the game's own sound; badge "Greymourn Castle · three.js · runs in a browser tab" top centre, clear of the game's HUD |
| 0:10–0:19 | hook | The result in numbers | boss fight full frame; "Made in three days" word by word on the voice; "It runs in a browser tab"; four chips (Lighting, Effects, Sound, A boss with two phases), each on its word |
| 0:19–0:30 | nocode | The twist | him full frame (name tag), then half; "Prompts I wrote 176" counting up on "hundred"; his real prompt types out: "keep working until 8 out of 10", held whole 1.5 s |
| 0:30–0:49 | promise | What you get | headline + six rows lit on their words, each with its chapter time (mm:ss from the real times) |
| 0:49–1:05 | stack | The stack | five cards (Claude Code, Fable 5.2 coordinator, Opus 5.5 threads, Seedream, Tripo, three.js), each landing on its name and lit while said |
| 1:05–1:29 | s1a–s1d | Step 1: Get it playable | step title; prompt 1 typed in a drawn Claude Code window ("[…]" for the borrowed name); the day-one build "6 hours, 12 prompts"; the test run, 51 checks counting, the real roll/parry lines ringed |
| 1:29–2:00 | s2a–s2d | Step 2: The models | the knight concept with five callouts; 12 concepts, "27 models in the game" counting; real lines of `src/anims.js`; the tiny-castle lesson: base prompt, its result, the retry "Only a rock:" lit |
| 2:00–2:33 | s3a–s3d | Step 3: The dream loop | a day-one screenshot wipes into its repaint, the prompt's words lit as said; target and live side by side with round 1's scores; golden hour wipes to mist with "Yes, switch to mist" |
| 2:33–2:58 | s4a–s4c | Step 4: The UI | six concepts; "Build it" types large, then his notes; the real inventory, the 3D map turning, the settings, full frame; a 3 s held map beat |
| 2:58–3:44 | s5a–s5d | Step 5: Threads and blind judges (the longest) | the thread list, rows switching to running on their words; 8 against 3 (self-score vs judges); the before/after cards swap and become X and Y; the judges' table, "lower counts", 9 |
| 3:44–4:01 | lim1–lim3 | Where it falls short | "Not at nine", round 16's bars with a dashed target line, HUD at 8 ringed, 10–14 s to load; his four rejected walks then "Approved"; "This footage is a scripted bot" |
| 4:01–4:09 | cost | What it cost | ledger rows (281.6 credits logged), the usage meter at 96 % |
| 4:09–4:20 | pay | What I'd keep | him half frame; four rows: get it playable first, a target you can reach, split the work, never let the builder be the judge |
| 4:20–4:30 | end | End card | his Fil canvas, big addresses, "Go build your own", him in the corner; the end holds 2.4 s past the last word |

## The step loop

Each step, 25–45 s:
1. **Say it.** A step title: "Step 01", a gilt rule, the title in display type landing on its own words. Him half frame.
2. **His real prompt.** Typed in a drawn window (the agent's window with the real words, not a copy of the app),
   while he says it, then held whole ≥ 1.5 s. Quote prompts exactly, typos and all, from `qa/PROMPTS.md`.
3. **The real result.** A capture, a render, a concept, a test run, a file. Real pixels at their real size.
4. **Mark what matters.** One device: a ring, a phrase lit in fire as he reads it, a wipe from before to after, a number
   counting up on its word, a card lit while the others step back.
5. **One line that lands it,** often a number or a lesson ("The fix was to start the prompt with, only a rock").

Patterns that worked: a lesson as "My base prompt said X, so when I asked for Y, I got Z. The fix was…"; before/after
as a wipe with a fire line; the self-score against the judges' score as two big numbers; a prompt read aloud with each
phrase lit as it's said.

## Chapters

`window.CHAPTERS = [[seconds, 'title'], …]` in film.js, built from word times, so they move with the voice.
`scripts/film-facts.mjs film.html --yt` prints them for the description; Fil's edit takes the same list. YouTube's
rules: first at 0:00, at least three, each at least 10 s. Step chapters are titled as the step ("Step 3: The dream
loop"), searchable. Greymourn's: Cold open · I made this in three days · What you get · The stack · Step 1: Get it
playable · Step 2: The models · Step 3: The dream loop · Step 4: The UI · Step 5: Threads and blind judges · Where it
falls short · What I would keep. The promise scene shows the same times (`M.mmss(T.…)`).

## Titles and the hook

- The first frame is a real frame of the result, already drawn (it's the edit node's thumbnail and the feed's).
- Hard numbers by 0:20: days, prompts, models. Said and shown on the same word.
- One honest twist in the hook ("I didn't write the code, and I didn't model anything").
- No credentials, no "in this video I will" beyond the promise row list, no subscribe ask, no sales offer.
- Release titles come in threes, one hook each, each paired with a cover for the A/B test (Greymourn: the result; the
  surprise "My AI agent scored its own work 8/10. Blind judges gave it 3"; the how-to "in 5 steps").

## Length

Five minutes only works dense: ~9–11 chapters of 15–45 s, one lesson each. He has no 5-minute baseline on his
channel; a 12–15 minute cut from the same scenes is the fallback if it underperforms. Don't stretch a step with
filler: cut it and give its time to the step that surprises most.
