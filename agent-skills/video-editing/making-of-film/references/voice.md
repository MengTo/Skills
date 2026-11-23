# His voice and the film's clock

The voice is the clock: every scene is timed to its words by name. A new take means new word times and a re-render;
no scene changes.

## 1. A free clock first

`python3 ~/.claude/skills/html-explainer-video/scripts/words.py --draft script.txt --out film/words --start 10.1 --pace 2.7`
writes `words.js` (`window.WORDS = [[word, start, end], …]`) from the script's letters. `--start` is where the voice
begins in the film: since 19 Nov he speaks in the first second, so under 1 s (Greymourn's 10.1 followed its silent
10 s cold open, superseded). Build and judge every scene on it before any voice is paid for.
Greymourn's draft 1 used the Mac's built-in voice as a scratch track (`tools/scratch-voice.py`), also free.

## 2. His voice: his newer clone, no tag (since 21 Nov)

- His newer instant clone (picked by ear on 21 Nov) on `eleven-v4`, **no tag**. The voice text is run-on
  (commas, "and", "so"; no "!" or "…"), numbers as words, a few light hedges; one paragraph per generation, two
  takes, keep the lower pitch. The full recipe is in his private `meng-digital-twin` skill. Price first with
  `max_credits: 0`; run on his typed yes.
- Superseded: his **earlier instant clone** with `[calm] ` (Greymourn, 17 Nov: the whole 720-word script in one take,
  31 credits, 3:56) or `[matter-of-fact]` (19–20 Nov).
- The file starts at film time 0, so a word's time in the file is its time in the film. Since 19 Nov no silence goes
  in front and no pause is opened between paragraphs; the only shaping is the recipe's sentence-end pauses.
- Listen to names and numbers against the script ("Sea Dream" for Seedream is a spelling, not an error).

## 3. Word times that hold

1. `scripts/align-voice.py voice.m4a script.txt film/ 10` — whisper.cpp (`~/Library/Caches/whisper.cpp/ggml-large-v3-turbo-q5_0.bin`)
   hears the words, the script's own words are matched to them (names and numbers keep the script's spelling).
2. `scripts/realign-phrases.py voice.m4a words.json words.json` — **always run this second.** One whisper pass over a
   4-minute voice drifts: it put sentence starts at the end of the phrase before in 34 of 89 phrases, 0.3–1.3 s early,
   so cards and camera moves landed before their words. This splits the voice at its real pauses (−40 dB, 0.2 s),
   hears each phrase alone, and sets phrase edges from the sound: every phrase's first word within 51 ms.
3. Check: a frame at each step's "Step" word should show the step title arriving, not already settled.
`scripts/fix-onsets.mjs` moves word starts that sit inside a silence to its end (an older fix, kept for a list from a
watch-through).

## 4. Cuts, pauses and re-voiced lines without renaming anything

`scripts/voice-edit.mjs <project>/tools/voice-edits.json` (Greymourn's file is the worked example):
- `{ "cut": [a, b], "why": "…" }` takes out a false or stale sentence; its words stay in words.js as markers of no
  length, so `T.one4` is still the fourth "one" and no scene is renamed.
- `{ "gap": [at, seconds] }` opens a pause (Greymourn: 3 s after "All of it came from prompts like that." for the 3D
  map's own beat, with the music bed rising over it). Since 19 Nov only for a beat the picture's own sound or motion
  carries, at a take's end; never a silence.
- `{ "replace": [a, b], "take": "<audio>", "from": [ta, tb], "words": "<take words>", "len": b-a, "gain": dB }` drops a
  re-voiced line into the old slot, its tempo set so it lasts as long (±15 %), so no later word moves. Greymourn's two
  number lines: 1 credit, tempo 1.05, gain +3.5 and +2.0 dB to match loudness, pauses 0.41–0.45 s.
It writes the new voice (`out`), a WAV for the mix, and `words.js`/`words.json` beside the voice.

## 5. After any change to the words

Re-render every scene whose words moved (all of them after a realignment), rebuild the preview, re-read the chapters
(`scripts/film-facts.mjs --yt`) into the release package, and re-pack the twin's stretches if the camera's words moved.

Once the film is cut in Fil, a re-voice never moves the scenes (21 Nov): every clip, cut and title stays, and each new
line is fitted to the cut it sat on with pauses only.
