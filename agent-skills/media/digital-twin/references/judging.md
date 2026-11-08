# Judging: blind judges guide, your eye decides

## Stills: a blind judge round

- **Truth:** your held-out frames J1–J5 (never used as references).
- **Candidates:** copy the round's results to `rounds/rN/blind/A.jpg, B.jpg…` under shuffled letters, and write the key
  in `rounds/rN/KEY.txt`. Don't show the judge the key, the prompts or the round's goal.
- **Anchors:** add two earlier results with known scores. Judges drift by 0.4–1.25 between rounds (an 8.75 anchor once
  scored 7.5), so a round's scores only compare with its anchors, and pairs beat absolute numbers.
- **A fresh subagent every round.** Never reuse one that has seen prompts or a key.
- **Scores (0–10, fractions allowed):**
  - identity: 10 = indistinguishable, 9 = clearly them with one nit, 8 = them but a friend notices, 7 = their sibling;
  - realism;
  - light.
  The judge also lists every difference as a concrete fix ("the lower face is ~10 % too wide", "hair spikes at the
  crown"). Those fixes are the value of the round.
- **Colour check:** cheek Lab on a 45 px patch against your band (his: L 64–80, chroma 15–32, hue 35–48°).
- **Measure too:** `measure.py` proportions against your held-out means. Numbers catch what judges normalise away.
- Three judges in a row, averaged, for a decision that matters.

That project's plateau was **8.75 identity** (the best still plus a face-only edit, three judges in a row).

## Voice

- `scripts/voice/score_voice.py` (ECAPA, calibrated to your held-out = 10 and other people = 0, plus pitch).
- Score 3 test lines of 7–10 s and compare means. Takes vary by ±0.4.
- Then a before/after for the owner's ear: real line → old → new.

## Video

- Whisper for the words; speakstats for the mouth and head against your own measured numbers; Laplacian variance for
  face detail; a filmstrip for gear, room and light.

## Why your eye decides

The judge finds faults. Only the person (and people who know them) can say "that's me". In that project:
- a blind judge put a rooftop shot (8.5) above a studio shot (8.0), and the person rejected the rooftop and approved the
  studio shot;
- a version with every judge fix scored lower, and so did a version that scored well and that he didn't pick;
- his picks ("3, 5 and 7 look most like me") became the basis of everything after.

So: show the owner a numbered sheet, ask "which are you?", log their exact words, and build the next batch from their
picks.
