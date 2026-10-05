---
name: fire-smoke-skill-vfx
description: Build the effects of a fire skill as one visual language in Three.js. Flames that read as fire, not as orange fog or cones: ray-marched flame volumes whose turbulence rises with buoyancy (slow at the root, accelerating and stretching as it climbs) instead of scrolling, a temperature ramp from a white-hot core a little above the fuel through yellow and orange to deep red tips, broad brighter licks inside, walls of fire broken into clumps of separate tongues of very different heights with notches between them and licks that detach and go out, a fire whirl wound in helical sheets with a waist and a blue root; charcoal smoke drawn premultiplied over the frame and lit only by the fire (cauliflower billows for a burst, a thin streaked curtain off a grass-fire front, fibrous wisps off small fires, ragged hot cracks inside a burst's smoke); embers and sparks that drift on a curl field, cool from white through orange to red and fall as ash; heat haze as refraction; firelight shared with the world; a world-space heat map that makes the ground's needles smoulder as hairlines and its pockets breathe; and gentle ink impact frames limited to three flashes a second. Use for fire or flame skills, fireballs, fire waves or breath, rings of fire, fire tornadoes or whirls, burning ground, wildfire fronts, smoke columns, embers, smouldering aftermath, "fire and smoke", "realistic fire", "flame thrower", "inferno", "burning field" or "skill effects only". Includes a reusable module and a five-beat demo on a scanned CC0 burned-ground floor with failure-mode switches.
---

# Fire and Smoke Skill VFX

Use this for the effect half of a fire skill: what the hand holds, what it throws, what burns and what the fire leaves. Reach for a sibling instead in these cases:

- **Lightning, an energy orb, black afterimage smoke and air bursts:** `lightning-energy-skill-vfx`. This skill reuses its clock, composite, impact frames and flash limiter.
- **Readable, budgeted gameplay effects in general** (telegraphs, status, cleanup rules): `create-game-vfx`. Its readability rules still apply here.
- **Scoring a skill out of 10, or polishing the caster's body and timing:** `game-dev-combat-skill-polish`.

Source: a brief for elemental skill pages built to the Black Lightning demo's bar, with the notes its owner gave on that demo ("not as in-your-face", "more fine lines", "smooth transitions", "a more realistic floor", "no sliding textures", "more detail in the smoke"). There is no character: the flame is held by an implied hand at chest height. Then two rounds of a dream loop against GPT Image edits of the page's own frames (see [references/scorecard.md](references/scorecard.md)).

Verified stack: Three.js r170, WebGL2, GLSL `ShaderMaterial`s, HalfFloat render targets, a 96³ baked noise texture, and a hand-written bloom and composite. No post-processing library. The demo's floor is Poly Haven's [Burned Ground 01](https://polyhaven.com/a/burned_ground_01) by Rob Tuytel (CC0), its 1k colour, normal and AO/roughness maps in `demo/assets/ground/`, embedded by `demo/build.mjs` as data URIs so the page opens from disk.

## The mechanism

**Fire is a field that rises, cools and lights the world; smoke is what the fire lights.**

- **One flame shader, three shapes.** Every flame is a ray march through a signed field: a profile (a plume from a source disc, a wall along an arc, a teardrop ball) minus the distance from its axis, pushed in and out by noise. Density is a narrow band of that field, so tongues have crisp edges and islands above the tips are detached licks.
- **Buoyancy, not scrolling.** The noise's height coordinate is `y0·ln(1 + h/y0)` minus time, so features leave the root slowly and accelerate and stretch as they climb, and a slow warp drifting through the noise deforms them on the way. A scrolled texture (the **Scrolled** switch) slides over the flame.
- **Temperature drives everything.** One temperature per sample picks the colour from a ramp, decides what hides the background (only hot gas does) and where soot absorbs (only a burst's cooling gas). The hottest gas along a ray shows through the cooler skin.
- **Detail is band-limited to the buffer.** Flames march into their own reduced-resolution target. Every octave fades out before it gets finer than a few pixels of that target at the sample's distance, and the target comes up with a smooth B-spline. Detail the buffer cannot hold aliases into a mosaic.
- **One light set for everything.** Eight firelights (one for flashes, seven claimed by flames and stage lights) light the ground, the smoke and the haze. They swell fast and settle slowly, so firelight breathes and never strobes.
- **One clock and one composite,** as in `lightning-energy-skill-vfx`: holds freeze every layer at once, heat haze and pressure fronts write into one half-resolution distortion buffer, and the impact frame draws after tone mapping.

## Reuse the working effect

Copy [assets/fire-fx.mjs](assets/fire-fx.mjs). You pass in your own `THREE`, and the module does not import a second copy. [The demo](demo/index.html) runs this same module, inlined by `demo/build.mjs` because a page opened from disk cannot import modules.

```js
import { createFireFX, FIRE_LIGHTS_GLSL, GROUND_HEAT_GLSL, TNOISE_GLSL } from './fire-fx.mjs';

const fx = createFireFX(THREE, { renderer, scene, camera, seed: 23 });   // bakes the 96³ noise texture
fx.setSize(width * dpr, height * dpr, dpr);       // drawing-buffer pixels, again on resize
fx.warmup();                                      // compile every effect before the first hit
fx.options.shake = 0.6; fx.options.fisheye = 0.65;   // felt, not thrown at the viewer

// A flame held in the hand: a teardrop that grows in.
const held = fx.flame({ mode: 'ball', pos: hand, radius: 0.11, height: 0.44, temp: 1.06, light: 3.2,
  embers: 0.9, smoke: 0.9, smokeKind: 'wisp', swirl: 3.5, spin: 2.2, ragged: 0.45 });

// A wall of fire rolling out: a fan of arc sectors you move with set().
const front = fx.flameArc({ center: origin, R: 0.7, w: 0.32, height: 0.6, a0: -0.6, a1: 0.6, segments: 8,
  lights: 2, lean: { x: 0.3, y: 0.55 }, light: 4.6, smoke: 2.2, embers: 2.2, heat: 0.6, hvar: 0.5, wobble: 0.05 });

// Ground and props: add FIRE_LIGHTS_GLSL and GROUND_HEAT_GLSL (and TNOISE_GLSL for tn()), spread
// fx.lightUniforms and fx.heatUniforms into their uniforms, add fireLight(P, N, V, albedo, rough) to
// the colour, and let groundHeat(p.xz) (heat in .x, burn in .y) light the ground's own cracks.

function frame(realDt) {
  const dt = fx.update(realDt);                   // sim seconds: 0 during a hold, scaled by ramps
  front.set({ R: front.R + 2.4 * dt });           // move flames on the effect clock
  fx.render();                                    // heat map, scene, flames, sparks, haze, bloom, composite
}

// A heavy hit:
fx.flash(at, 30, 3.2, 1);                         // slot 0: a hot flash that decays at 3.2/s
fx.ring(groundSpot, up, { radius: 7, thick: 0.14, life: 0.55, amp: 0.03 });   // refraction only
fx.sparks(at, { count: 46, speed: [4, 11], life: [0.5, 1.3], flake: 0.25 });
fx.impact({ hold: 0.08, frame: 'center', shake: 0.016, fisheye: 0.14, at, radius: 0.36 });
```

Other calls:

- `fx.flame(opts)` returns a flame you change every frame (`radius`, `height`, `pos`, `intensity`, `temp`, `light`, `smoke`, `embers`, ...) and end with `kill(seconds)`. Options:
  - shape: `mode` (`'plume'`, `'arc'`, `'ball'`), `pos`, `radius`, `height`, `lean` `{x, y}`, `ragged` (tongue depth, default 0.24 plume / 0.4 arc / 0.34 ball), `stretch` (how tall the features are, default 1.25), `scale` (noise feature size in metres), `swirl` and `spin` (a fire whirl: helical sheets, funnel, S-bend), `wander` (the axis drifts), `billow` (a burst: rounded lobes, cooling unevenly into hot pockets), `wobble` and `hvar` (arcs: radius lobes and height variation);
  - colour: `intensity`, `temp` (1 = nominal; above 1.05 the light runs hotter), `blue` (a blue root band), `soot` (absorbs only where a burst cools);
  - output: `light` (claims a firelight slot), `smoke`, `smokeKind` (`'billow'` or `'wisp'`), `smokeSize`, `smokeLife`, `embers`, `heat` (into the heat map), `haze`;
  - life: `fadeIn` (seconds), `steps` (pin the march steps), `seed` (pin the noise; the first 121 flames take the demo's recorded seeds unless you pass one).
- `fx.flameArc({ center, R, w, height, a0, a1, segments, lights, ...flame options })` returns `{ segs, set(props), kill(s), alive }`. `a1 − a0 ≥ 2π` makes a closed ring; a fan's ends taper.
- `fx.spawnSmoke(pos, vel, opts)`: `type` (0 billow, 1 ash flake, 2 wisp, 3 curtain), `size`, `grow`, `life`, `opacity`, `glow`, `aspect`, `fibre` (4.5 or more marks a burst's hot-pocket sprite), `buoy`, `drag`, `curl`, `color`.
- `fx.sparks(pos, opts)` and `fx.spawnSpark(pos, vel, opts)`: `count`, `dir`, `spread`, `speed`, `life`, `size`, `heat`, `cool`, `gravity`, `drag`, `buoy`, `curl`, `flake` (the chance a cooled spark falls as ash).
- `fx.addHeat(pos, radius, amount, { burn, tau, shape, R, w, a0, a1 })`: a lasting heat patch (disc, or a ring band for a front) that cools as e^(−t/τ) and leaves a burn mark.
- `fx.flash(pos, energy, decay, hot)`, `fx.glint(pos, { size, life, intensity })`, `fx.ring(center, normal, { radius, thick, life, delay, amp })`.
- `fx.impact({ hold, frame: 'center' | 'full' | 'none', flash, shake, shakeMode: 'axial' | 'radial', fisheye, at, radius })`.
- `fx.ramp(scale, seconds)`, `fx.repeat(ticks, fn)`, `fx.curlAt(x, y, z, t, out)`, `fx.stats()`, `fx.debug` (`noFlames`, `noSmoke`, `noHaze`, `noSparks`).
- `fx.options`: `noise` (`'advected'` | `'scrolled'`), `smoke` (`'over'` | `'additive'`), `flashes` (`'full'` | `'safe'`), `shake`, `fisheye`, `tickHz` 30, `lightGain` 2.4, `flameScale` (the flame layer's share of the buffer, set per shot) and `flameBudget` 260 (march work above this lowers the scale, never below 0.5).

## The layers, with the numbers that shipped

| layer | numbers |
| --- | --- |
| Flame march | A box per flame (a bent slab for arc sectors, a tube otherwise) drawn back-face with no depth test into the flame target. Steps min(32 arcs / 38 others, max(14, 12 + px/12)), px the flame's size on screen; the start is dithered per pixel. On entering the flame, 4 bisection steps find the surface, so every pixel starts on it (a dithered start came out as grain). Light saturates within a third of the radius: σ = 6/R, edge band 0.07R + 3 mm. Cheap bounds first: a cylinder clip, a skip-ahead outside the reach, a top cut at 1.75H (2.6H for arcs), and the ground. **Every bound fades the gas before it cuts it** (r/reach 0.8–1, h/top 0.82–1). Coverage goes into alpha as 0.85 (plumes) or 0.4 (arcs) × the share of hot gas (T 0.35–0.65), so a flame in front of another layers instead of adding a seam. |
| Buoyancy and turbulence | Height coordinate `y0·ln(1 + h/y0)` with y0 = 0.45H + 3 cm, rising at 0.95 (the **Scrolled** switch uses h at 1.7). A low-frequency read at 0.34× the noise frequency sways the whole flame by R(0.08 + 0.85h/H) and warps the noise by 0.9. Octaves are staged: the first decides whether a tongue can reach the sample at all, a ridged second octave `0.42 − 1.3|n₂|` makes tongues end in points, a third adds fine licks toward the tips. Noise frequency 1/max(1.2 cm, scale or 0.45R plumes / 0.8R arcs). |
| Licks and sheets | Broad brighter licks: noise at (1.6, 0.55, 1.6) × the frequency, `1 − smoothstep(0, 0.45, |n|)`, scale density by mix(1, 0.45 + 1.1·lick, 0.55) (0.3 in a ball, 0.8 in a whirl) and temperature by 0.9 + 0.2·lick. **Fire whirl:** sheets `1 − smoothstep(0.12, 0.62, |sin(2θ + 1.1h)|)` with θ warped by the first octave, a funnel profile R(0.42 + 1.25y)(1 − 0.28e^(−((y − 0.26)/0.1)²)) (the waist at a quarter of the height), an S-bend of 0.55R, and temperature falling with 0.62 × the height so it burns hot most of the way up. **Plumes** split into 6 tongues round the source, each 0.45–1.2 × the height. |
| Walls of fire | Arc sectors with partition-of-unity shoulders (30% of a sector) **applied to each sector's light, not its density**. Clumps: noise round the ring at 1.3 × R plus slow lobes at min(0.42R, 1.3), `k = smoothstep(0, 0.55, E + 0.5(vig − 0.5) + 0.34 − 0.25·hvar)`; about a third of the front is gap, where the gas fades out over k 0.06–0.24. The radius wobbles by 1.4 × wobble × R, and the proxy box follows it. Clump height H(0.3 + 0.7k^0.6). **Tongues inside a clump:** cells clamp(0.62w, 6 cm, 30 cm) apart, each centred off-cell by ±22%, its height Hk(0.34 + 0.95h²) for a hash h (mostly short, a few 2–3× taller), pointed as (0.07 + 0.93t^0.62), snaking sideways by (0.26 sin(7.5y/Hk − 4.4t) + 0.1 sin(13y/Hk − 6.1t)) cells, flank tongues leaning out by up to 0.28. **Licks:** for 65% of tongues the tip breaks off once a 1.2–2 Hz cycle, a blob of 0.42 × the cell width rising to 1.6 × the tongue height and shrinking, burning at T 0.6 → 0.28. |
| Temperature and colour | T = temp × (1 − smoothstep(−0.18, 0.86, y + 0.25n + 0.1n_f)) × (0.38 + 0.62·depth) × (0.42 + 0.58·smoothstep(0, 0.2H, h)): the brightest gas sits a little above the fuel, not on it as a line. White heat adds (0.5 plume, 0.34 arc, 0.36 whirl, 0.12 ball) × depth² over y 0.02–0.14 to 0.22–0.62. A burst multiplies T by mix(1, 0.06 + 3·smoothstep(0.45, 0.85, n₁), billow): it cools unevenly into a few hot pockets. **Ramp** (linear HDR): (0.3, 0.024, 0.003) from T 0.02–0.2, (1.5, 0.15, 0.014) at 0.16–0.42, (3.4, 0.7, 0.09) at 0.4–0.66, (6, 1.9, 0.45) at 0.64–0.86, (9, 4.6, 1.9) at 0.85–1.05, (18, 13, 7) at 1.02–1.3: blue stays well under the red, so highlights roll to warm yellow-white, never cream. The ray's colour is mixed 38% toward the hottest gas along it. **Blue root:** accumulated over the bottom 10% at the skin, then `smoothstep(0.3, 0.55)` *replaces* the colour with (0.05, 0.26, 1.2) (added, blue and orange read as pink). |
| Band limit and upsample | Pixels per noise cycle at each sample: ppc = 1 / (distance × metres-per-pixel × frequency), metres-per-pixel = 2tan(fov/2) / the flame target's height. The second octave fades in over ppc/2.07 = 4–9, the third over ppc/3.4 = 5–11, licks over ppc/1.6 = 6–14, whirl sheets over 1.2·ppc = 5–12. The flame target runs at `flameScale` × the buffer (demo: ignition 0.8, wave 0.85 then 0.72, pillar 0.72, impact 0.64, aftermath 0.8) and is laid over the frame with a 4-tap cubic B-spline, no sharpening. |
| Smoke | Instanced camera-facing sprites (900), sorted far to near, premultiplied "over" (the **Additive** switch shows the grey-haze failure). Lit per corner by the 8 firelights at 1/(1 + 1.9d²), compressed as L/(1 + 0.45·lum(L)) and 45% desaturated, wrapped `0.55N·L + 0.45` with a floor of 0.22; ambient (0.018, 0.019, 0.024); albedo (0.024, 0.022, 0.021). Each fades in over 2.5% (billow) / 7% (curtain) / 10% (others) of its life, out from 45%, and into the ground over 0.25 m and the lens over 0.15–0.9 m. Motion: buoyancy × (1 − 0.7u), drag e^(−drag·dt), curl × (0.3 + u). **Billow (type 0):** cauliflower lobes as a soft union of domes (log-sum-exp, k = 8), two scales for the outline at 0.55 and 1.3 × lf (lf = clamp(1.1 × size, 3.2, 7) per sprite unit) and ridged noise at 0.75 / 2.1 / 4.3 × for the texture; density (dome^0.6 + 1.25(B − 0.6) + 0.55(Bd − 0.6)) cut at 0.4 + 0.08·age over 0.36–0.46; creases darkened to 0.58–1 × 0.72–1. **Curtain (type 3)** for a fire front: noise stretched (2.1 across, 1.25 along), curled by 0.55 and drifting up through the sprite, alpha from the streaks only, no edge and no underside of its own; lit warm by its height above the front (smoothstep(2.4, 0.7, y) × 0.75) and faint grey above 1.2–3.5 m. **Wisp (type 2):** the fibrous strand for small fires, 0.18–0.3 opacity. **Hot pockets:** sprites with fibre ≥ 4.5 add ridged cracks only in the creases, (1, 0.36, 0.07) × 4, fading out over 20–75% of their life. |
| Smoke emission | Rate = smoke × env × min(1.4, intensity) per second; a front multiplies it by min(5, arc length / 0.35 m) and thins it along the front by 0.3 + 0.7(0.5 + 0.5 sin(4.3a + seed))^1.5. Size s = min(2.2, 3.6w (arcs) or 2.6R × smokeSize) × 0.75–1.25. **Fronts:** curtain sprites at 0.8s from 45–95% of the flame height, rising 0.55–0.85 × min(1.5, 0.6 + 0.4H) m/s, grow 2.4–3, life 2.8–4 s, opacity 0.4–0.55, glow 0.6–0.9, aspect 2–2.5. **Plumes and balls:** billows at 0.45s, grow 3.4–4.6 (2.2–2.9 for a whirl), opacity 0.75–0.95, glow 0.5–0.8 (whirl 1.1–1.6), buoyancy 0.45–0.75; a whirl's smoke leaves its top (82–105% of the height) and spreads outward at 0.3–0.7 m/s. **Burst (demo):** 95/s billows of 0.55–0.95 m within 0.6–1.3 m of the axis, from 0.35 m up past the burst, near-black (0.019, 0.018, 0.017), 32% hot pockets early. |
| Embers and sparks | Embers from a flame's body: life 1.4–3.2 s, 3–7 mm, heat 0.75–1 cooling at 0.35–0.7/s, buoyancy 1.2–2.2, drag 0.9–1.5, curl 0.8–1.6, rate 2.5 × embers per second; a whirl's ride the air outside it (0.95–1.7R) with tangential speed 0.75·spin and a 0.25 inward pull. Drawn additive as dots and short dashes: width clamp(size on screen, 1.5, 4.2) px × dpr, length ≤ min(2.5 × width, 7 px × dpr), the head brighter than the tail (0.55–1). Ramp by heat: (0.08, 0.006, 0.001) → (1.1, 0.16, 0.025) → (3, 1.05, 0.22) → (4.2, 2.1, 0.7). A spark that cools out falls as an ash flake with p = 0.6 × flake (6–14 mm, glowing 0.35 at first). Drift on an analytic curl field (12 travelling sine waves). Pools: 1,200 sparks, 900 smoke sprites, 96 flames, 12 glints. |
| Light | 8 slots. Slot 0 takes flashes and decays at the flash's rate; slots 1–7 follow flames that ask for light (`light` × intensity × the flame's envelope). The demo's own stage lights (a light high in the fire tornado, its base pool) claim slots too, and may take the dimmest flame's. Energy swells with τ 0.09 s and settles with τ 0.38 s, drifting × (1 + 0.07 sin 2.3t + 0.04 sin 3.7t); colour (1, 0.4, 0.12) × `lightGain` 2.4, (1, 0.6, 0.3) for hot sources and flashes. On the ground: wrapped `0.8N·L + 0.2`, diffuse 1/(1 + fall·d²) with fall 2.4 per light (0.35 for the pillar's base pool), the specular 1/(1 + 0.22d²) at roughness 0.97 (none, in effect). |
| Heat map and ground | A 256² HalfFloat world-space map over a 26 m square (`heatUniforms.uHeatRect`, centred on the demo's action), up to 320 patches redrawn every frame: lasting ones (`addHeat`) cooling as e^(−t/τ) with a burn mark that stays, and live ones each burning flame re-asserts. A front's band is ragged and interrupted, never a fuse. **The floor (demo):** the scan at 1.6 m a tile with a second sample turned and at 1.3 m under a macro mask; neutral charcoal at albedo 0.03 × (0.45 + 1.1 × the scan's lightness), its needles darker (0.018), grey ash drifts (0.055) and sparse ash flecks (0.12, 3.5% of 2.6 cm cells); a lump height field at 7 / 15 / 31 per metre (each fading by the pixel's footprint) for pebble relief; ambient (0.06, 0.062, 0.07) × albedo. Emission: the scan's dark pockets breathe slowly, needles burn as thin hairlines in runs where heat passes 0.05–0.5, ember specks on a 13/m grid at least a pixel wide (density 0.03 + 0.22·burn + 0.5·heat + 0.22·smoulder), colour (0.75, 0.1, 0.012)g + (1.3, 0.38, 0.07)g² × 0.45. Fog 1 − e^(−0.035d). |
| Sky | Horizon (0.017, 0.0158, 0.016) to zenith (0.0034, 0.0036, 0.0047), a slate cloud deck of + (0.0024, 0.0026, 0.0033), and each firelight's glow, pow(c, 24) × 0.0018 + pow(c, 4) × 0.0007, only low over the fire: the warmth belongs to the fire, not the air. |
| Heat haze | A taller box per hero flame, 4 dithered steps through a Gaussian profile of the hot air (radius R(1.4 + 0.5h/H) + 4 cm, over 2–45% of 2.4H), a shimmer at (7, 4.5, 7) per metre rising 4.8/s, warped, written as a signed offset × 0.0032 × haze into the half-resolution distortion buffer. Pressure rings are refraction only: radius × (1 − 2^(−10x)), amplitude ∝ (1 − x)^1.2. |
| Impact frame | As in `lightning-energy-skill-vfx`, after ACES: a jagged starburst R(1 + 0.34·spikes + 0.05 sin 61θ + 0.03 sin 113θ) (radius 0.36 in the demo) in which luminance through smoothstep(0.2, 0.3) becomes ink (0.03, 0.012, 0.006) on warm paper (1, 0.94, 0.84), with 150 tapered speed-line slots and 380 finer ones. Hold 0.08 s, axial shake −a·e^(−7t)·cos(2π·5.5t) at a = 0.016, fisheye 0.14 decaying as e^(−2.2t); the demo runs shake at 0.6 and fisheye at 0.65. At most 3 inverting flashes a second, then a 0.32 dim. |
| Bloom and composite | Dual-Kawase bloom, 5 levels from half resolution, **threshold 2.2**, knee 0.6, × 0.16, tinted (1, 0.78, 0.6): a low threshold softened every flame into a glow. One ACES pass, sRGB, a 0.0022 dither (not film grain) and a 0.4 vignette. |

## Cut a brief into beats

| brief says | call |
| --- | --- |
| a spark becomes a held flame | a glint and a 1.6 flash at the hand, 4 tiny sparks, then a `ball` flame growing from 1.2 cm to 11 cm over 1.6 s with a slow breathe (3.5% at 2.1 rad/s), embers from 1.6 s and wisps from 1.8 s |
| a breath of fire rolls across the ground | throw the held flame down, a 9 flash and a ground ring, then a fan `flameArc` (±0.6 rad, 8 sectors) whose radius runs 0.7 → 6.7 m over 2.6 s (ease-out) and whose height swells to 2.35 then sinks by half; it smokes once it is 1.6 m out (smoke made near the caster hung in front of the camera) and leaves burning patches 0.35–1 m behind its edge, delayed 0.2–0.7 s, so they never line up as a fuse |
| a fire tornado and its smoke column | heat under the spot, then a `plume` with `swirl` 1.9, `spin` 2.6 → 3.4, `blue` 0.45, `wander` 0.11 growing to 4.7 m over 1.1 s; a closed `flameArc` foot ring at R 1.45 → 1.0 leaning in (−0.55); 12 low dust banks either side (4.5–7 m sprites at 0.14–0.24); a light high in the column for its smoke and a wide base pool (fall 0.35) |
| a burst with a ring of fire | a `ball` with `billow` 0.85 and `soot` 0.9 cooling as 1.3e^(−u/0.42) and gone by 0.7 s; a closed ring `flameArc` from 0.6 to 4.4 m over 1.6 s with `hvar` 0.75 and `wobble` 0.17, burning patches behind it; two refraction rings, 64 sparks, the column of billows, and an ink frame 0.06 s after the hit |
| smoulder, drifting embers, settling smoke | wide heat patches cooling over 10–16 s, six low flames dying one after another (2.6–8.5 s), three faint glow lights, embers drifting off the ground, low settling haze and wisps off the hottest patches |

**Between beats, ease.** Every size and intensity a beat sets is driven through its own curve; flames fade in over `fadeIn` and out over `kill(seconds)`; lights swell and settle. Nothing pops on a beat change.

## Rules, each with the failure it prevents

Each rule came from a capture of this demo that went wrong, flagged by a reviewer, a judge or the person it was built for.

**Randomness and layout**

- **`fract(sin(x)·43758)` is not random on Metal.** Every tongue of a front came out tall, so walls read as combs. A test that gave each tongue either tall or short proved it. Use an arithmetic hash (`p = fract(p·0.1031); p *= p + 33.33; p *= p + p`), in the shader and wherever the CPU must agree.
- **Give every feature its own random stream, or layouts reshuffle.** One round added particles drawn from the stream that also seeded the flames and placed the burning patches; every flame after them changed, the wave lost its right-hand fires and the ring moved away from the approved frame (overlap 0.32 → 0.12). The demo now records the approved cast's 121 flame seeds in order and gives later features a second stream. Test parity by recording the seeds through the capture protocol.
- **Never change a seed to make a layout look nicer** once a layout is approved. The target is the layout to match.

**Flames**

- **Band-limit detail to the flame buffer's footprint, and upsample with a B-spline, never sharpened.** Thin sheets finer than the reduced buffer could hold, brought up with a sharpened Catmull-Rom, turned every flame into a 2–4 px mosaic. Fade each octave by its size in buffer pixels; detail adapts when the buffer shrinks, and a lower `flameScale` costs detail, never blocks.
- **Advect the noise with buoyancy; never scroll it.** A scrolled texture reads as orange cloth sliding upward.
- **Saturate the light on the surface.** An exponential falloff deep into the volume made blobby eggs; σ = 6/R with a bisected entry gives crisp tongues and a root that shows through the skin only partly.
- **Put the brightest gas a little above the fuel.** A hot band right at the base read as a glowing line on the ground.
- **Walls read as curtains or combs.** A uniform band reads as a curtain, equal tongues as a comb, a presence envelope as a tent. Break a front into clumps with real gaps, tongues of very different heights (tallest 2–3× the shortest) unevenly spaced with notches down near the root, outer tongues shorter and leaning out, and tips that detach as short licks.
- **Weight overlapping sectors' light, not their density.** Blending density across a shoulder dimmed a band at every seam.
- **Let blue replace orange at the root.** Added, the two read as pink.
- **Soot only in a burst.** Soot in every flame's cool gas stood up as black posts.
- **Fade the gas before every bound.** A billow that outgrew its march bound showed as a dark box.

**Smoke**

- **Smoke puffs read as floating boulders.** Round billows that leave a front as lumps read as rocks. Off a front, use a thin streaked curtain born small and faint among the tongue tips, with no underside, lit by its height above the fire as one sheet; save cauliflower billows for a burst or a column, where the mass is the point.
- **Light smoke only from the fire.** A built-in glow kept old puffs orange as they rose, and round shading lit every puff as a rimmed lump. Firelight per corner with a floor, warm low and dark grey-black high.
- **Hot pockets are cracks in the creases, not round lamps.** Soft round emission read as glowing orbs; a ridged mask confined to the gaps between billows reads as fire inside the smoke.
- **Hand a burst's soot over early.** The flame layer is drawn over the smoke, so a cooling fireball's soot hid the column behind it; the fireball goes by 0.7 s and the billows carry on.
- **Premultiplied over, never additive.** Additive black is grey haze.

**Ground, light and frame**

- **Cell patterns read as flagstones.** Worley clods with dark gaps read as orange paving; stretched noise normals at a grazing view read as a rippled lake. Use a lump height field, neutral charcoal and a matte surface.
- **Keep the firelight tight, and give big sources their own falloff.** One wide falloff lit the whole plain rust-orange; a tight one left the fire tornado without its ground pool until the pool got a per-light falloff and a stage light could take a flame's slot.
- **Film grain inflates high-frequency energy.** A 0.028 grain gave the black backdrop 4× the target's high-frequency energy and read as noise; a 0.0022 dither only debands.
- **Measure regions against the target before tuning by eye.** Mean colour in fixed boxes (sky, horizon, ground, smoke base, smoke top) settled what "too warm" and "too dark" meant every time.
- **Warm the sky only near the fire.** A warm brown horizon read as dirty haze; the target's night is slate.

## Cost

The cost is fill rate: the flame marches, smoke over smoke and the full-screen ground. Measured with WebGL timer queries at 1440 × 900 and a pixel ratio of 1.5 (2160 × 1350), each sampled frame redrawn 6 times and the fastest kept, every 6th frame of each beat:

| build | load | ignition | wave | pillar | impact | aftermath | cast |
| --- | --- | --- | --- | --- | --- | --- | --- |
| before the dream loop (flames at 0.5–0.8 scale) | 4–6 | 1.9 | 2.5 | 2.0 | 3.1 (p90 11.8) | 1.7 | 2.1 |
| shipped (flames at 0.64–0.8 scale) | 6 | 2.9 | 6.3 (p90 11.6) | 3.5 | 5.7 (p90 11.9) | 2.9 | 3.5 (p90 8.0) |

Medians in ms. The impact's peak (1.2–1.6 s after the hit, many arc sectors plus the burst) is the heaviest stretch; `options.flameBudget` lowers the flame scale automatically if the march work runs past it. The demo caps the pixel ratio at 1.5.

## Lifecycle and accessibility

- `fx.update(realDt)` clamps a step to 0.1 s. Reset your frame clock on `visibilitychange`.
- Under `prefers-reduced-motion: reduce`, the demo holds a composed still (the fire tornado at its height) and plays beats only on request, with safe flashes, no shake and no fisheye.
- The demo's interface is minimal: no panels, small text controls over a faint scrim. Switches are real buttons with `aria-pressed`, beats are on keys 1–5 (0 for the full cast), Space pauses, H hides the controls, and changes are announced in a live region. No text renders under 11 px.
- `window.stage` (`play`, `step(dt, n)`, `setPaused`, `freeze`, `fx`, `BEATS`, ...) is there for deterministic headless captures.

## Verify

- [ ] With **Scrolled** on, the flames slide upward like printed cloth; with **Rising** on, features leave the root slowly and stretch as they climb.
- [ ] With **Additive** on, the smoke turns to grey haze; with **Over** it darkens the frame.
- [ ] Zoom 4× into any flame: smooth gradients, no 2–4 px cells, no grain along the edges.
- [ ] The wave's front is clumps of separate tongues with gaps and detached licks, its smoke a thin streaked curtain joined to the tips; no round puffs sit on the flame line.
- [ ] The fire tornado has a waist, an S-bend, wound sheets, a blue root band and a pool of light at its foot; its smoke leaves the top.
- [ ] The burst cools into dark billows with a few ragged hot cracks, not orange lamps; its ring is lobed and broken.
- [ ] The ground is neutral charcoal with ash flecks and pebble relief; the far plain stays near black, needles glow as hairlines only where it is hot.
- [ ] Fire five inverting hits inside a second with **Full** flashes: the first three invert, and the fourth and fifth dim by 0.32 instead.
- [ ] Reduced motion holds a still with safe flashes. Opened from disk, the page makes 0 network requests. The console is clean at 1440 × 900 and 390 × 844, and the portrait camera backs off by (1/aspect)^0.6.
