# Scorecard: Black Lightning demo, judged blind (October 2026)

**Target:** every beat at 8 out of 10, against AAA action-game skill effects (Zenless Zone Zero, Final Fantasy XVI, Devil May Cry 5, Genshin Impact, Black Myth: Wukong).

**Result: not reached.** Every beat rose from a baseline of 3–6 to 5–6 and then plateaued. Each round fixed what the judges named, and the next round scored new faults at the same level.

## How it was judged

- **Evidence:** per beat, an 8-frame strip in time order plus one full-resolution close-up. These are headless Chrome captures at 1280 × 720 with a pixel ratio of 1.5, stepped at 1/60 s on a frozen clock, with the interface hidden.
- **Judges:** two fresh subagents per round, given only the rubric and the anonymised images. Beat names were swapped for random ids that changed every round. The lower of the two totals is kept.
- **Rubric:** five criteria at 0–2 points each:
  - orb detail and material;
  - a black shadow that follows the orb;
  - lightning;
  - impact and environment;
  - art direction with no artifacts.

  The judges were told the demo shows effects only, so the missing character is not marked down.

## Rounds (lower judge)

| beat | base | R1 | R2 | R3 | R4 | R5 | R6 | final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Charge | 3 | 5 | 4 | 5 | 5 | 5 | 5 | **5** |
| Dash | 5 | 5 | 5 | 4 | 5 | 5 | 5 | **5** |
| Barrage | 5 | 6 | 5 | 5 | 5 | 5 | 5 | **6** |
| Storm ring | 4 | 5 | 5 | 5 | 6 | 5 | 4 | **6** |
| Ultimate | 6 | 7 | 6 | 6 | 6 | 7 | 6 | **6** |

The average rose from 4.6 to 5.6. Judge spread was about ±1: in the final round, the storm ring got 7 from one judge and 6 from the other.

## What moved the scores

| round | change | effect |
| --- | --- | --- |
| R1 | Orb rebuilt as a ray-marched volume. Its shadow (teardrop, ribbons, billows) hangs off the orb instead of an invisible body. Chromatic split removed from the orb's lens. Starburst impact frames. | charge 3 → 5, ultimate 6 → 7 |
| R2–R3 | Noise baked into a 3D texture (frame cost fell from about 8 ms to 3 ms) | regressed: the texture was silently NEAREST and 8-bit, and the Perlin lattice zeros lit the orb up as a planet |
| R4 | Texture filter fixed, billows stretched along the path, refraction-only funnel | mosaic and slab complaints stopped |
| R5 | Thin bright rim, no fill, bloom threshold raised to 1.3, fractal forks | the orb scored 2 of 2 in three beats from one judge |
| R6 | Teardrop shadow with torn tongues, ground strikes, a lifted dust wall | dust read as grey cartoon puffs and cracks as neon worms; reverted |

## Where it falls short, in the judges' words (final round)

- **Shadow, 1 of 2 everywhere:** "a vague lumpy cloud parked behind the orb", "one flat ink blot". It is attached and directional, but it never reads as rich torn cloth.
- **Orb, 1 of 2 in most beats:** "a competent textured sphere that stops short of AAA layered energy", "a grey matte halo on a lumpy silhouette". The judges want energy escaping the shell.
- **Debris:** "faceted low-poly blue rocks".
- **Lightning in the storm ring:** "a tangle of equal-width strands" when many bolts overlap.

## What it would take to reach 8

- **Painted assets.** Flipbook smoke and torn-cloth textures, painted lightning strips, and hand-shaped debris meshes. Procedural noise plateaued at about 6 here, as it has on other strict judge loops.
- **A character.** The shadow and arcs need a body to cling to; hanging them off an implied fist caps how much they can read as a cloak.
- **An art director's eye on the motion.** The judges saw stills. Several faults, such as the static blob and the parked cloud, are partly the absence of motion in a strip.
