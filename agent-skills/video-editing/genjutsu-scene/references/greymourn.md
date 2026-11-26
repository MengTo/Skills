# Greymourn scene one: the run log (19 Nov 2026)

The tutorial film "how Greymourn was made" (`lothric/docs/tutorial/film/`, draft 4g, 270.65 s, 4K60) uses his HeyGen
twin camera at key places. The game-world scenes are Genjutsu inserts over the same words. Hand-over notes with every
detail: `~/Library/Caches/lothric/me/notes/tutorial-a4-genjutsu-2026-11-19.md`, `tutorial-a5-genjutsu2-…`,
`tutorial-a6-scene1-2026-11-19.md`. Work folders: `~/Library/Caches/gm-tutorial/a4|a5|a6/`.

## Threads
| thread | what | result |
|---|---|---|
| A4 | first Genjutsu draft: twin cut-out in a game plate, Seedream knight gear (3 looks), Genjutsu 720p 5 s, film audio laid under | head too big ("bobblehead", pauldrons 3.06 face widths), face flat and bright, no lip sync (r 0.11, z -0.46), eyes on the lens 21 % |
| A5 take 2 | composite to 4.3 face widths, low-key relight, drive window where he looks into the lens (94 %), Seedream L3 low-key, Genjutsu 720p, **Sync Lipsync 3** | won 15/1/1 vs A4 with blind judges; Meng: "that's really good." 5.04 s, ends mid-sentence |
| A5 scene one | Meng: both whole sentences, "don't cut off the speech", draft first; drive 6.4 s (twin 203-362), Genjutsu 480p (job <id>, 18) | came back 6.04 s, before the speech ends at 6.13 s |
| A6 draft | Sync remap (job <id>, 21.75), dedup + retime, 4K60 | judges preferred take 2 (sharpness 5 vs 7, the 480p cost). Meng: "all good except don't finish with big eyes" |
| A6 final | calm-ending drive (0-116, 115-94-115; media <id>), prompt "calm to the very end", Genjutsu 1080p (job <id>, 120), Sync remap (job <id>, 21.75) | judges 26/3/1 over the draft; Meng: "Yes, confirmed" (prompt 239) |

## Inputs (Higgsfield media ids)
- Start still L3 low-key: media <id> (`a5/deliver/a5-startframe-L3-lowkey.jpg`); eye point
  (0.448 W, 0.398 H). Seedream prompt: `seedream-common-greymourn.txt` + `seedream-lowkey-greymourn.txt`; refs: composite,
  knight armour ref, his real photos G1 N1 N2 F07 F10.
- Drives: draft <id> (twin frames 203-362, film 26.86-33.22 s); final (calm ending)
  <id>. Twin source frames: `lothric/docs/tutorial/film/meng/kimi/NNNN.jpg` (25 fps;
  film time <-> frame in `a5/tools/kimimap.py`). Drive params: src eye (1030.4, 429.3) in frame 203, scale 0.769 -> 0.900.
- Clean voice line film 19.25-25.65: media <id> (`a5/s1/line-19.25-voice.mp3`); film mix
  line `a5/s1/line-19.25-film.m4a`; whole clean voice at 16 kHz `a5/au/voice.wav` (film time = file time).
- Truth photos for judges: `a4/judge/truth/T1-T5.jpg`.

## Measures, draft -> final (same tools)
| measure | draft (480p) | final (1080p) |
|---|---|---|
| envelope lip sync r / z | 0.33 / +1.07 | 0.56 / +2.64 |
| closures (m model, b about, p and m prompts) | 3/4 | 3/4 (b of about open) |
| open vowels | 5/7 | 4/7, wider ("code" 0.15, "hundred" 0.11) |
| eye openness, last second vs clip median | 0.40 vs 0.34 (the big eyes) | 0.31 vs 0.32 |
| gaze on the lens (<0.05 / <0.03) | 68 % / 35 % | 30 % / 8 % (by eye on the lens; irises a touch to image right; judges gave eye contact 8 vs 6) |

## Placement proposal for draft 4g (not done here)
In film.js the camera is hidden until T.i2 (19.464, "I didn't write"), full frame to T.i4 (22.741, "I wrote"), then
'half' beside the prompt panels. The proposal: knight in at 19.46 (clip 0.21 s in), full frame to 22.74, then in the
camera's half slot to 25.65 (after "prompts." ends at 25.38, before "Most" at 25.79). Then the twin returns. Drop the clip's audio.

## Deliverables
- Final: `~/Downloads/greymourn-a6-scene1-final-4k60.mp4`, `a6/deliver/a6-scene1-final-4k60-clean.mp4` and `-labelled.mp4`.
- Draft: `~/Downloads/greymourn-a5-scene1-draft-4k60.mp4`. Stills: `a6/deliver/a6-scene1-final-t{1.43,2.43,4.68,5.40,6.05}-{before,after}.jpg`.
- Spend: ledger `lothric/docs/tutorial/ledger.tsv`; prompts `lothric/qa/PROMPTS.md` (229-240 for scene one).
