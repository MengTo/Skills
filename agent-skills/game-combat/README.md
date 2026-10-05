# Game Combat Skills

How to make character combat animation look right: attacks, skills and whole move sets that read like Diablo IV, Baldur's Gate 3 or Elden Ring, with arms, wrists and hands that never stretch, lock, wring or break. These skills come from real rounds of building, measuring and blind-judging a knight's sword strikes and an archer's bow shots in a Three.js action RPG.

Each rule is a number, every number has a test, and every critic's claim is checked against full-resolution frames before anything changes.

The body is half of a skill; the other half is what it throws, raises or tears open, and what it does to the target. `game-dev-combat-skill-polish` scores and rebuilds whole skills, body, effect and result, from filmed casts, against a readability bar and an art bar. `lightning-energy-skill-vfx` builds the effect half itself: a reusable Three.js module for lightning, an energy orb, black afterimage smoke, air bursts, sparks and impact frames. `fire-smoke-skill-vfx` does the same for fire: ray-marched flames, walls and whirls of fire, charcoal smoke, embers, heat haze and burning ground. `water-crystal-skill-vfx` does the same for water: a clear water orb, streams, a lash and splash, ripples and rain, ray-traced crystals that grow, resonate and shatter, and a moonlit tidal flat of mirror pools. `ice-frost-skill-vfx` does the same for ice: grown frost, traced ice spikes that crack and shatter, mist banks, a blizzard column and a snow floor that glints.

## Choose the right skill

| Need | Start with |
| --- | --- |
| Build, fix or review attacks and move sets to a written standard; fix "the arms look stretched or weird"; score animations or get them to 8 out of 10 | [`game-dev-combat-animation`](game-dev-combat-animation/SKILL.md) |
| Score every combat skill or spell out of 10 with blind judges and raise the weakest to a bar: readability (does it read as itself, does the blow land on the beat) or art (detail, light, trails, impact, art direction, against a reference such as Diablo IV) | [`game-dev-combat-skill-polish`](game-dev-combat-skill-polish/SKILL.md) |
| Give a skill its effects: white-blue lightning, a refracting energy orb, black afterimage smoke, three-layer air bursts, orange sparks and debris, and impact frames (hold, two-tone negative, flash, shake, fisheye) capped at three flashes a second | [`lightning-energy-skill-vfx`](lightning-energy-skill-vfx/SKILL.md) |
| Give a fire skill its effects: ray-marched flames that rise with buoyancy, walls and rings of fire broken into unequal tongues, a fire tornado, charcoal smoke lit by the fire, embers that cool to ash, heat haze, a burning ground and gentle impact frames | [`fire-smoke-skill-vfx`](fire-smoke-skill-vfx/SKILL.md) |
| Give a water or crystal skill its effects: a clear water orb that refracts and wobbles in place, beaded streams, a whipping lash and a torn splash crown, ripple rings and rain on mirror pools, ray-traced quartz that grows out of the water, rings with light and shatters into shards that land and rest, caustics, moon glitter and gentle impact frames | [`water-crystal-skill-vfx`](water-crystal-skill-vfx/SKILL.md) |
| Give an ice or frost skill its effects: dendritic frost that grows across the ground, faceted ice spikes ray-traced against their own planes that erupt, crack and shatter into pieces that land and rest, low freezing mist banks, a blizzard column of powder, glinting snow and gentle impact frames | [`ice-frost-skill-vfx`](ice-frost-skill-vfx/SKILL.md) |

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

## What's inside `water-crystal-skill-vfx`

- **Water is what it bends and what it mirrors; crystal is light caught between planes.** Every water surface refracts a copy of the frame and takes colour only from its path length, with silver rims and highlights that are never dimmed by its 2% reflectance. The orb is a sphere-traced field that deforms in place. Each crystal is a convex hull of half-spaces traced exactly inside. The ground is wet rock banks standing out of one flat water plane with a mirror pass, on a terrain the CPU physics shares. It shares the lightning skill's clock, composite, impact frames and flash limiter.
- **`assets/tide-crystal.mjs`**, which takes your own `THREE`, provides:
  - a water orb (`createOrb`): drop modes on springs, capillary rings, a drifting warp, a neck to a stream, refraction through its real far surface with a clamped dispersion fringe, a sharp inverted horizon and a caustic web on its far wall;
  - streams (`createTube`): tubes rebuilt every frame with parallel-transported frames, ripples and foam lines that ride with the flow, clear-water shading;
  - splash crowns (`crown`), drops and spray (`drop`, `spray`) as round screen-space beads that land on your ground, and a vortex field for gathering water;
  - analytic ripple packets and rain (`ripple`, `RIPPLE_GLSL`), caustics (`CAUSTIC_GLSL`), foam lace and frost for your own ground and pools, with a half-resolution planar mirror (`mirrorUniforms`);
  - crystals (`createCrystal`, `shatter`): quartz habits with bevels, traced with total internal reflection, dispersion, Beer-Lambert, fracture discs, a root glow, a resonance band, a draining water film and rime, broken into Voronoi splinters that run as rigid bodies with corner contact;
  - a moonlit night environment (`ENV_GLSL`) with a moon disc, maria, haze and a cloud deck; eight eased point lights; refraction fronts; impact frames limited to three flashes a second; and a bloom capped per pixel, a star-glint pass, the vignette before ACES, and FXAA.
- **Demo:** five beats (gather, current, crystallize, resonance, shatter and rain) on a scanned CC0 floor (Poly Haven's Low Tide Rocks, embedded so the page opens from disk) laid out by a map traced from target images, behind a minimal UI, with A/B switches for two failures: a sliding texture on the orb and painted glass instead of traced crystals.
- **Rules from the build and a three-round dream loop:**
  - Clear water is not a teal fill; light it with refraction, silver rims and highlights that are not scaled by Fresnel.
  - The moon's reflection on a smooth mirror read as a "≡" glyph; make it a column of micro-facet glints.
  - A vignette after the tone curve capped every highlight at about 225; apply it in linear light first.
  - Trace the pool and rock layout from the target images through each shot's camera onto a world grid.
  - Test shard contact at every corner on lumpy ground, and keep the CPU terrain identical to the GPU's.
  - Re-encode the scan at quality 85 with its own chroma: the page went from 6.2 to 2.6 MB.
- **Scorecard:** `references/scorecard.md`. Against GPT Image edits of its own frames the page went 3.13 → 5.05 → 5.33 → 5.52 out of 10 and did not reach 8. It records what moved and what regressed, the last judge's shortfalls, what it would take, the GPU cost per beat, and the user's notes it was built to.

## What's inside `ice-frost-skill-vfx`

- **Frost is grown once and drawn by its arrival time; ice is traced against its own planes; the air is marched where the cold pools.** A small growth on the CPU (stems, barbs and sub-barbs competing in one time-ordered queue, side branches then leaned toward their tips) is baked into a distance field the ground shader reveals as the frost clock runs. Each spike is a convex hull of planes, traced exactly inside, cracked and shattered along planes the viewer watched form. Mist banks are ray-marched over their own spans and churn in place. It shares the lightning skill's clock, composite, impact frames and flash limiter.
- **`assets/frost-growth.mjs`** grows the frost tree (`growFrost`): segments with arrival times, the spine and seed stems for lights that ride the front, and branch tips for glints.
- **`assets/frost-energy.mjs`**, which takes your own `THREE`, provides:
  - frost on any ground (`growFrostField`, `FROST_GLSL`): hairline feathers with fine needles finer than the bake, beads, rime, crystal-facet glints, a contact shadow, a blazing growth tip, a crystal heap at the seed and halos on the far arm tips;
  - ice spikes (`createSpike`, `crackSpike`, `shatterSpike`): faceted hulls with blades, chips and lopsided tips, traced with refraction, internal reflection, Beer-Lambert blue, bubbles, a fracture network and moonlit edges, rising out of the snow, cracking and bursting into rigid-body pieces that land on a face;
  - snow lumps and ice chips that settle into the crust (`spawnChunks`);
  - mist banks (`setBanks`) and a low base mist that parts round the ice, with a mist-only debug view;
  - a wind field with a column vortex, powder, flakes, streaks, streamers and a fibrous veil for a blizzard;
  - eight eased point lights shared with the world, refraction rings, impact frames with a three-flash-a-second limiter, and FXAA on the traced ice only.
- **Demo:** five beats (chill, frost creep, ice spikes, blizzard, shatter) on a scanned CC0 floor (Poly Haven's Snow 02, embedded so the page opens from disk), behind a minimal UI, with an A/B switch for one failure: shaded rather than traced ice.
- **Rules from the build and a three-round dream loop:**
  - No MSAA on a HalfFloat target; run FXAA on the ice pixels in the composite.
  - Judge glitter by fine high-frequency energy and strong glint count separately, or it flip-flops between salt and satin.
  - Render the mist alone to calibrate it; march each bank over its own span with white jitter and a blur, or plumes vanish and stripes appear.
  - Changing the barbs through the shared random stream moved every spike; lean them as a post-transform instead.
  - Drive every change from a region-stats harness against the target.
- **Scorecard:** `references/scorecard.md`. Against GPT Image edits of its own frames the page went 4.90 → 5.88 → 5.95 → 6.25 out of 10 and did not reach 8. It records what moved and what regressed, the last judge's shortfalls, what it would take, and the user's notes it was built to.

These skills pair well with [`design-action-combat`](../game-development/design-action-combat/SKILL.md) for timing and contact, and with [`workflow-score-to-target`](../workflow/workflow-score-to-target/SKILL.md) and [`workflow-ship-change`](../workflow/workflow-ship-change/SKILL.md).
