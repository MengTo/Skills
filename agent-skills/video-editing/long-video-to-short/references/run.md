# The run this came from

A 61.6 s short of a 10-minute tutorial about building two 3D worlds with a coding model (Nov 2026), nine versions in
two days. 1080 × 1920, 60 fps, 28.2 MB. What each round of notes changed is why the skill is shaped as it is.

| Version | The note | What changed |
|---|---|---|
| v3 → v4 | cut-out lost a shoulder and both hands; lip sync late | new mattes from the original takes; edge colour unmixed; sync set from each take's own sound (50 ms and 35 ms late before) |
| v5 | "fix the transition between the costumes"; "text animations more polished, like the long video" | a scan instead of a dissolve (never two faces blended); headlines track in as a focus resolves; captions rise from their line's mask |
| v6 | "needs the logo and say the name"; "captions regular weight, tight letter spacing" | the subject named on frame one; captions in a regular weight at −0.035 em, no stroke |
| v7 | "get this to 60 s", "useful and insightful" | five more lines from the long video's own voiceover; two-pass x264 to stay under 30 MB |
| v8 | less about the score, more about the method | a new script on the four steps; everything after the hook in the cloned voice |
| v9 | the whole script approved new; on camera remade | all of it in the cloned voice; phrase alignment (whisper's stamps drifted at pauses); the twin first, then re-skins; two cuts |

## v9 in numbers

- Eight sections: hook (on camera, 7.9 s), the cheat, a turn (on camera, 2.4 s), three steps, the loop, the card (on
  camera, 3.85 s). On camera 14.2 s of 61.6 s, 23%.
- Voice: four paragraphs, two takes each, pauses shaped. Only a "So," before the closing line was cut out.
- Twin: three lines plus the second cut's closing line, 1080p. The hook was redone twice for delivery.
- Re-skins: all three lines at 720p. The hook took five drafts (a startled, round face) until the face came from a
  frame of an approved clip, the drive sat further from the lens and the prompt kept the eyes relaxed; then it was
  redone once more in a plainer costume because the first one's sword flashed. In hindsight the turn and the card
  didn't need a re-skin: that is where rule 2 comes from.
- Cut-outs: a portrait matting model was too slow on a busy machine (about 40 s a frame), so macOS Vision mattes on
  every 60 fps frame and `plates.py`.
- Checks on both files: transcript word for word; phrase-start captions 41–63 ms early, none late; −14.3 LUFS,
  −1.3 dBTP; no silence over 1 s but the end hold; bt709; mouth within 0.02 s of each twin clip.
- Judges, four rounds: entrances, exits, text and polish 8; the lowest item 6 each round (cut-out edges, then how he
  sits in the scene). Fixed along the way: see-through hands and mic, a backlit shoulder rim, a square blur, the
  game's gun by his shoulder. Left: no rim light from the scene, a roof touching his hair. 9 was the target and
  wasn't reached; that was reported as it was.
- Notes from the creator that became rules: "always do the HeyGen Avatar 6 before doing Genjutsu"; "the lighting is
  too desaturated on me"; 720p is enough for 9:16; Shorts and TikTok never end on a comment ask.
