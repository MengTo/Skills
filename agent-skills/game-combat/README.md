# Game Combat Skills

How to make character combat animation look right: attacks, skills and whole move sets that read like Diablo IV, Baldur's Gate 3 or Elden Ring, with arms, wrists and hands that never stretch, lock, wring or break. These skills come from real rounds of building, measuring and blind-judging a knight's sword strikes and an archer's bow shots in a Three.js action RPG.

Each rule is a number, every number has a test, and every critic's claim is checked against full-resolution frames before anything changes.

The body is half of a skill; the other half is what it throws, raises or tears open, and what it does to the target. `game-dev-combat-skill-polish` scores and rebuilds whole skills, body, effect and result, from filmed casts, against a readability bar and an art bar. `lightning-energy-skill-vfx` builds the effect half itself: a reusable Three.js module for lightning, an energy orb, black afterimage smoke, air bursts, sparks and impact frames. `fire-smoke-skill-vfx` does the same for fire: ray-marched flames, walls and whirls of fire, charcoal smoke, embers, heat haze and burning ground.

## Choose the right skill

| Need | Start with |
| --- | --- |
| Build, fix or review attacks and move sets to a written standard; fix "the arms look stretched or weird"; score animations or get them to 8 out of 10 | [`game-dev-combat-animation`](game-dev-combat-animation/SKILL.md) |
| Score every combat skill or spell out of 10 with blind judges and raise the weakest to a bar: readability (does it read as itself, does the blow land on the beat) or art (detail, light, trails, impact, art direction, against a reference such as Diablo IV) | [`game-dev-combat-skill-polish`](game-dev-combat-skill-polish/SKILL.md) |
| Give a skill its effects: white-blue lightning, a refracting energy orb, black afterimage smoke, three-layer air bursts, orange sparks and debris, and impact frames (hold, two-tone negative, flash, shake, fisheye) capped at three flashes a second | [`lightning-energy-skill-vfx`](lightning-energy-skill-vfx/SKILL.md) |
| Give a fire skill its effects: ray-marched flames that rise with buoyancy, walls and rings of fire broken into unequal tongues, a fire tornado, charcoal smoke lit by the fire, embers that cool to ash, heat haze, a burning ground and gentle impact frames | [`fire-smoke-skill-vfx`](fire-smoke-skill-vfx/SKILL.md) |

## What's inside `game-dev-combat-animation`

- **The loop.** Write the standard, capture a baseline, design keys from anatomy, measure, test, capture both cameras, run blind critics and a blind A/B against the last release, verify every claim, ship, then show videos.
- **Arm and hand rules, with numbers.**

  | Rule | Limit |
  | --- | --- |
  | Elbow flexion | 10–152° |
  | Striking or drawing arm, middle 80% of the move | at least 20° of bend |
  | Wrist | bend ≤ 50°, roll ≤ 45° |
  | Forearm and upper-arm twist | ≤ 52° each |
  | Arm raise | ≤ 105° |
  | Skin, worst 1% of each arm region on the real mesh | stretch ≤ 2×, crush ≤ 3× |
  | Hands | always in a pose: fist, hook or relaxed |

- **Techniques:**
  - hands that ride their shoulders and arc between keys;
  - aim the forearm, not the wrist;
  - tip-up chambers;
  - follow-throughs that keep moving;
  - a bow anchor under the jaw with the hips side-on.
- **Traps that each cost a round.**
  - Bone-axis conventions, such as a head bone that is +Y forward and +Z down.
  - Tests that read the same wrong convention as the code.
  - Failures masked by the first assertion in a loop.
  - Poses that read differently on two cameras.
  - Critics misreading thumbnails.
  - Capture runs killed by a reload.
- **Review protocol:** two blind critics (the lower score counts), a blind A/B with identical titles, critic and judge prompt templates, and side-by-side review videos.

## Scripts at a glance

- `scripts/install.sh` copies the tools into a checkout's `.dream-loop/moves/`.
- `keydesign.mjs` turns upper-arm, forearm and blade intents into a hand target and checks raise, flex, blade angle and reach.
- `armcheck.mjs` checks joint ranges and skin stretch and crush per arm region on every frame.
- `at.mjs`, `knight-measure.mjs`, `anchor.mjs`, `drawfit.mjs` and `face.mjs` probe the fist and blade, clearances, the bow anchor and the face landmarks.
- `setup.js`, `play.js`, `shot.js` and `host.html` capture the Characters page, stepped in-game frames, and 2880 × 1800 stills.
- `msheet.py`, `psheet.py`, `ab-pack.py`, `vidcompose.py` and `encode.swift` build judge sheets, blind A/B sets and side-by-side videos.

The tools import the game's own modules (a HumGen rig and baker). Project specifics are in `references/thornvigil.md`. On another rig, re-derive the arm lengths, the shoulders and every bone-local axis from mesh landmarks before reusing a number.

## What's inside `game-dev-combat-skill-polish`

- **The loop.** Pin down the skills, the bar and the reference; film the real cast on a stopped, stepped clock; build contact strips (timing) and close-ups (art); judge blind with two fresh subagents, lower score kept and a re-judge before trusting a 7; raise the criterion costing the most; lock it in with a test and ship it as its own version.
- **Two rubrics, 0–2 per part:** readability (reads, timing, body, effect, reaction) and art (detail and texture, light, motion and trails, impact, art direction, with Diablo IV described in words).
- **Levers that moved scores** (four skills went from 3.5–4.5 to 7+):
  - results that land when the blow, missile or wave arrives, never on the click;
  - a skill's own schedule and keyed move instead of a borrowed one;
  - a hero prop made from a painted concept with image-to-3D (scripted primitives plateau at 5.5–6.5);
  - painted additive textures on black, gradient-mapped to the palette;
  - camera-facing ribbons that widen along the path;
  - metals with their own small environment map and a tight rim;
  - light beside the body, not inside it or pooled under a projectile.
- **What judges always mark down:** borrowed looks, flat white placeholder flashes, pillars of light over the target, additive dust rings, stretched white sparks, long "laser" trails, anything under the HUD.

### Its scripts

All inside `game-dev-combat-skill-polish/`, with no dependencies beyond Node, Python and Pillow:
- `scripts/film.mjs` films a cast in headless Chrome over CDP on a frozen clock stepped 0.05 s per frame. The game supplies review-only hooks (stage, act, aim the camera, freeze and step); `HOOK`, `PAGE`, `READY`, `SETTINGS_KEY` and `CHROME` come from the environment, and staging goes in a scenarios file like `scripts/scenarios.example.mjs`.
- `scripts/probe.mjs` takes one still of a recipe or cast at a chosen step; `scripts/perf.mjs` counts draw calls and triangles before and during a cast.
- `scripts/strips.py` and `scripts/close.py` build contact strips and key-frame close-ups.
- `scripts/judge-set.py` with `templates/judge-prompt.md` makes anonymised judging rounds (neutral ids, a list file, a key) and holds the two judge prompts; `scripts/merge.py` keeps the lower of both judges' totals.
- `scripts/beforeafter.py` makes a labelled before/after sheet for the scorecard.

Project specifics (review hooks, harness settings, where each skill's code lives, scores so far) go in a local `references/<project>.md` next to the skill.

## What's inside `lightning-energy-skill-vfx`

- **One clock, one composite, and a shadow that belongs to the orb.** A hold freezes every layer at once, and a time ramp slows them. The orb's lens, the pressure fronts and the punch funnel all write into one half-resolution distortion buffer. The orb carries its own black shadow, a torn teardrop with ribbons and billows laid along its path, so the shadow follows wherever the fist goes.
- **`assets/storm-energy.mjs`**, which takes your own `THREE`, provides:
  - lightning as trees of strips (trunk, forks of forks, hair-fine branchlets) with a fine white core in a violet-blue glow; each channel reaches out as a stepped leader, flares as it connects, holds its shape and fades through an afterglow, and the orb fires one discharge at a time;
  - a storm-cloud orb: a lit billow surface that churns in place, 10–15 plasma-globe arcs from a small white core to its inner wall, crawlers on the rim and a hairline fresnel;
  - ground strikes that flash when the leader arrives, crawl along the stone's own cracks and reflect in wet stone;
  - refraction-only air fronts, ground bursts with spark fountains, and chips that land;
  - smoke trails with billow chains, and a storm-domain vortex;
  - a baked 96³ noise texture;
  - four energy lights, and ground heat for your own crack mask;
  - impact frames (ink negatives with a bleeding starburst edge and tapered speed lines, shake, fisheye) with a three-flash-a-second limiter.
- **Demo:** five beats (charge, dash, barrage, storm ring, ultimate) on a scanned CC0 floor (Poly Haven's Dry Ground 01, embedded so the page opens from disk), with eased transitions between beats, behind a minimal UI, with A/B switches for three failures: tweened lightning, additive black smoke, and a glow-ball orb.
- **Rules from the build and from seven blind-judged rounds:**
  - Shadows from an invisible body read as planks; hang them off the orb.
  - A `WebGL3DRenderTarget`'s texture silently defaults to NEAREST and 8-bit.
  - Baked Perlin lights the orb up as a planet grid.
  - Unbounded swirl shear winds the noise into rings.
  - A bloom threshold of 0.9 washes black smoke blue.
  - Coloured air rings read as hoops.
  - Lightning that re-rolls its whole shape every tick reads as flicker; hold each channel and let it fade.
  - Bending the scene inside the orb warped its own arcs; refract only the air just outside it.
- **Scorecard:** `references/scorecard.md`. Blind judges against AAA skill effects moved the beats from 3–6 to 5–6, and a second loop against target images stalled at about 4; neither reached 8/10. It records what it would take, and the user's notes that shaped the calmer, finer final version.

## What's inside `fire-smoke-skill-vfx`

- **Fire is a field that rises, cools and lights the world; smoke is what the fire lights.** One ray-marched flame shader covers plumes, walls along an arc and teardrop balls. Its noise rises with buoyancy instead of scrolling, one temperature per sample picks the colour, decides what hides the background and where soot absorbs, and every octave is band-limited to the reduced-resolution flame buffer, which comes up with a B-spline. Eight firelights light the ground, the smoke and the haze, swelling and settling. It shares the lightning skill's clock, composite, impact frames and flash limiter.
- **`assets/fire-fx.mjs`**, which takes your own `THREE`, provides:
  - flames (`flame`, `flameArc`): a temperature ramp from a white-hot core a little above the fuel to deep red tips, broad brighter licks, fronts broken into clumps of unequal tongues with gaps and detaching licks, a fire whirl in helical sheets with a waist and a blue root, and a burst that cools unevenly into hot pockets;
  - smoke drawn premultiplied over the frame and lit only by the fire: cauliflower billows, a thin streaked curtain for a fire front, fibrous wisps, and ragged hot cracks inside a burst's smoke;
  - embers and sparks on an analytic curl field that cool from white through orange to red and fall as ash;
  - heat haze and refraction-only pressure rings in a half-resolution distortion buffer;
  - firelight GLSL and a world-space heat map for your own ground, so its cracks and needles glow where it is hot;
  - impact frames (ink starbursts with tapered speed lines, shake, fisheye) limited to three flashes a second.
- **Demo:** five beats (ignition, fire wave, pillar, impact, aftermath) on a scanned CC0 floor (Poly Haven's Burned Ground 01, embedded so the page opens from disk), behind a minimal UI, with A/B switches for two failures: scrolled flame noise and additive smoke.
- **Rules from the build and a two-round dream loop:**
  - `fract(sin)` is not random on Metal: every tongue came out tall.
  - Shared random streams reshuffle approved layouts; give each feature its own.
  - Detail finer than the flame buffer turns into a mosaic; band-limit it and upsample with a B-spline, never sharpened.
  - Smoke puffs off a front read as floating boulders; walls read as curtains or combs.
  - March bounds cut the gas into dark boxes unless it fades before them.
  - Cell patterns read as flagstones, and film grain inflates the backdrop's high-frequency energy.
- **Scorecard:** `references/scorecard.md`. Against GPT Image edits of its own frames the page went 4.63 → 4.80 → 5.50 out of 10 and did not reach 8. It records the round-1 regressions and their causes, the last judge's shortfalls, what it would take, and the user's notes it was built to.

These skills pair well with [`design-action-combat`](../game-development/design-action-combat/SKILL.md) for timing and contact, and with [`workflow-score-to-target`](../workflow/workflow-score-to-target/SKILL.md) and [`workflow-ship-change`](../workflow/workflow-ship-change/SKILL.md).
