---
name: lightning-energy-skill-vfx
description: Build the effects of a close-combat energy skill as one visual language in Three.js. White-blue high-pressure lightning re-rolled at 30 Hz, a semi-transparent compressed orb that spins like a vortex and bends the air behind it, black afterimage smoke that tears into shreds and ash, three-layer air bursts with refraction, orange sparks for cold-warm contrast, debris that lands, heat glowing in the ground's cracks, and impact frames that hold, invert in two tones, flash, shake and bend the lens, all limited to three flashes a second. Use for anime or dark-fantasy skill effects, lightning or thunder fists, energy balls, charge-ups, dashes with shadow trails, shockwaves, storm or domain rings, ultimates, hit-stop, impact frames, negative flashes, screen shake, fisheye punches, time ramps, "black lightning", "thunderstorm fist", "afterimage" or "skill effects only". Includes a reusable module and a five-beat demo with failure-mode switches.
---

# Lightning Energy Skill VFX

Use this for the effect half of a skill: what the fist throws, what the air does, what the hit leaves. Reach for a sibling instead in these cases:

- **Readable, budgeted gameplay effects in general** (telegraphs, status, cleanup rules): `create-game-vfx`. Its readability rules still apply here.
- **Scoring a skill out of 10, or polishing the caster's body and timing:** `game-dev-combat-skill-polish` and `game-dev-combat-animation`.

Source: a 30-second skill-showcase brief for a dark-fantasy ability user. White-blue lightning, a semi-transparent thunderstorm orb ahead of the fist, black smoke afterimages like a shattered cloak, air bursts, orange sparks and impact frames. Only the effect language is kept here. The character, story and shot list are left out.

Verified stack: Three.js r170, WebGL2, GLSL `ShaderMaterial`s, HalfFloat render targets, a hand-written bloom and composite. No post-processing library.

## The mechanism

**Everything runs on one effect clock and lands in one composite.** Lightning re-rolls on that clock, a hit freezes it (hold), and a time ramp slows it. Every layer that tears the air writes a signed screen offset into one shared distortion buffer: the orb's lens, the ring fronts, the punch funnel. The composite reads colour through that offset, splits the channels along it, adds bloom, tone maps once, and only then draws the impact frame on top. With one clock and one composite, a 0.1 s hold freezes the sparks, smoke, rings and lightning together, and the negative flash inverts the finished frame rather than one layer.

## Reuse the working effect

Copy [assets/storm-energy.mjs](assets/storm-energy.mjs). You pass in your own `THREE`, and the module does not import a second copy. [The demo](demo/index.html) runs this same module, inlined by `demo/build.mjs` because a page opened from disk cannot import modules.

```js
import { createStormEnergy, ENERGY_LIGHTS_GLSL, GROUND_HEAT_GLSL } from './storm-energy.mjs';

const fx = createStormEnergy(THREE, { renderer, scene, camera });
fx.setSize(width * dpr, height * dpr, dpr);       // drawing-buffer pixels, again on resize
fx.warmup();                                      // compile every effect before the first hit

const orb = fx.createOrb({ radius: 0.4 });
orb.reach = [shoulder, elbow, head];              // Vector3s the arcs can leap back to
const cloak = fx.createTrail({ width: 0.7, life: 0.8 });   // push it from a body point every frame

// Ground and props: add ENERGY_LIGHTS_GLSL (+ GROUND_HEAT_GLSL), spread fx.lightUniforms
// (+ fx.heatUniforms) into their uniforms, and add energyLight(...) and
// uGlow * groundHeat(p.xz) * yourCrackMask to their colour.

function frame(realDt) {
  const dt = fx.update(realDt);                   // sim seconds: 0 during a hold, scaled by ramps
  // move the fist with dt, then:
  orb.position.copy(fist).addScaledVector(aim, orb.currentRadius * 0.92); orb.axis.copy(aim);
  cloak.push(chest);
  fx.render();                                    // colour, distortion, bloom, composite to the screen
}

// A heavy hit:
fx.blast(orb.position, aim, { length: 4.6, radius: 1.5 });
fx.burst(orb.position, { strength: 0.9 });        // air burst: rings face the camera
fx.burst(groundUnderFist, { strength: 0.6 });     // ground burst: dust, chips, scorch, heat
fx.impact({ hold: 0.1, frame: 'center', shake: 0.016, at: orb.position });
```

Other calls: `fx.bolt(a, b, opts)`, `fx.sparks`, `fx.debris`, `fx.puff`, `fx.shards`, `fx.ring`, `fx.vortex(center, opts)` for a storm domain, `fx.ramp(scale, seconds)` for a time ramp, `fx.repeat(ticks, fn)` to re-throw on the next lightning ticks, and `fx.attractor` to pull everything into a charge.

## The five layers, with the numbers that shipped

| layer | numbers |
| --- | --- |
| Lightning | Midpoint displacement, 4–6 levels (17–65 points). The offset is 0.15–0.34 × the bolt's length and halves at each level, along a random perpendicular. Up to 2 forks leave 18–66% of the way along, 22–45% as long, at 0.55× width and 0.7× brightness, tapering to 12%. Every bolt is a new shape on each **30 Hz** tick and lives 1–3 ticks, stepping 1.0 → 0.55 → 0.28 → 0.14. Drawn as a screen-space ribbon: glow 0.02–0.05 m wide but never under 5–10 px; core radius max(0.85 px × dpr, 6.5% of the width); core ×7 HDR white, halo ×1.5 of (0.30, 0.60, 1.00). |
| Orb | Two-sided icosphere (detail 20), wobbling 3–14% with instability. Streaks are noise sampled in vortex coordinates around the punch axis, (cos, sin)(φ + 2.8h + spin·t) × 0.75 and h × 4.2, sharpened with `pow(1 − |n|, 26)`. The back shell turns the other way at 0.7× speed and 0.4× brightness. Alpha 0.05–0.12, blended premultiplied, so it darkens a little behind it. The lens offset is −n.xy × 0.11 × (radius / screen-height span) × √(n·v), plus a 0.6× tangential shimmer. A spring (ω 34, ζ 0.3) handles compress-and-rebound pulses. Above 0.45 instability, random kicks of −0.32 to +0.26 land every 0.12–0.32 s. |
| Afterimage | Ribbons drawn **premultiplied over** the frame (`ONE, ONE_MINUS_SRC_ALPHA`), colour (0.010, 0.011, 0.016). Width = w × (1 + 0.9·age) × a 0.3–1.2 noise along the length. Tangent from points i ± 2. Alpha: `d = across·1.45 − 0.45 + fbm·1.05 + streak·0.2`, eroded by `th = mix(0.32, 1.05, age^0.8)`. At 32% of its life each point sheds an ash flake (p 0.5–0.9) and a billow (p 0.45). Cloak trails: 0.62–0.75 m wide, life 0.75–0.85 s, drifting back at 2.1 m/s and up at 0.55 m/s. |
| Air bursts | Three rings 55 ms apart: radius 2.2 / 3.4 / 4.8 × strength, line 0.04 / 0.07 / 0.11 m, life 0.22 / 0.32 / 0.46 s, brightness 0.85 / 0.42 / 0.24, refraction 0.035 / 0.028 / 0.02 m. Air rings face the camera; ground rings lie flat. Each ring is a thin hot line inside a faint halo, torn into arcs, and dimmed by min(1, 0.3 / its screen span). The refraction profile is a derivative of Gaussian, so the front pushes and pulls. The punch funnel is an open cone opening to its full size with ease-out over 0.28 s, its shells running outward. |
| Sparks, debris, dust | Sparks run hot (4.2, 2.5, 1.0) → (2.8, 0.78, 0.16) → (0.85, 0.10, 0.025). They are 4–11 mm, drawn 1.1–5 px wide, with streak = velocity × 20 ms, capped at min(4 × width, 16 px × dpr). Gravity 9.8, drag 1.2, bounce 0.35. Chips are jittered dodecahedra that rest on their rotated hull's lowest corner, bounce at 0.32, slide at 0.55, and shrink away after 2.4–3.6 s. Dust is cool grey (0.040, 0.042, 0.048) at 0.5–0.6 opacity, kept 0.08–0.35 m off the ground, thrown out at 2.5–6 m/s × strength. |

**Light and heat.** Four point lights fall off as 1/(1 + 1.4d²): the orb, (1.6 + 5.5 × pressure) × radius/0.45; the impact, 14 × strength, warm cooling to blue; the bolt flash, min(length × brightness × 2.2, 26); and the blast, 30 × strength. Each ground burst leaves a heat spot (radius 1.5 × strength, decaying as e^(−1.3t)), and the ground's own crack mask glows with it.

**Impact frames** (composite, after ACES):

| part | numbers |
| --- | --- |
| Hold | 0.05 s warning, 0.1 s heavy hit, 0.15 s ultimate. Sim time is 0 and lightning stops, so the whole frame holds. |
| Two-tone negative | Shown during the hold. Luminance through `smoothstep(.26, .34)` becomes ink (0.012, 0.014, 0.022) on paper (0.93, 0.965, 1.0): energy turns black on white. `center` fills a disc 0.42 screen heights wide and dims the rest to 0.3. `full` covers the frame. |
| Flash | Fades to white as e^(−t/0.07) after the hold. |
| Shake | `axial`: −a·e^(−7t)·cos(2π·5.5t), a sharp drop and then a rebound, a = 0.006–0.022 screen heights. `radial`: zoom 1 + 1.4a·e^(−6t)·cos(2π·7t) plus jitter. Always overscan by 1 + 2.2·|shake|. |
| Fisheye | Barrel (1 + k·r²·1.8)/(1 + 0.45k), k = 0.42 for the ultimate, decaying as e^(−2.2t). |
| Time ramp | 1 → 0.22 over 0.9 s for the ultimate charge, back to 1 in 0.04 s at release. Lightning never drops below 35% of real time. |
| Safety | At most 3 inverting or white flashes in any rolling second. Past that, or with `flashes: 'safe'`, a hit dims the frame by 0.32 instead. Under `prefers-reduced-motion` set `flashes: 'safe'`, `shake: 0`, `fisheye: 0`. |

Composite: dual-Kawase bloom with 5 levels from half resolution, threshold 0.9, knee 0.5, ×0.12. Distortion buffer: half-resolution HalfFloat, signed offsets in screen-height units, blended additively. Chromatic split along the offset, capped at 0.003. One ACES pass, then sRGB. Render targets are single-sampled.

## Cut a brief into beats

| brief says | call |
| --- | --- |
| charge, condensing orb, fingers curl | `orb.radius` 0.1 → 0.5 over 2.2 s, `pressure` 0.35 → 1, `orb.pulse(−0.3)`, `fx.attractor` pulling motes in |
| first small burst warning | `fx.impact({ hold: 0.05, frame: 'center', shake: 0.006 })` + a 2-layer burst at strength 0.5 |
| vanish into a dash, zigzag turns | trails pushed from the moving body, `fx.repeat(20, …)` throwing bolts between recent path points, a camera-facing ring + 12 billows + 22 flakes at every turn |
| straight punch, thunderstorm fist compression | `orb.pulse(−0.35)` 120 ms early, then `fx.blast` + air `burst` + ground `burst` + `impact` 0.1 s centre |
| lateral swing, spinning elbow | a trail pushed round the arc, a flat ring at chest height, a fan of 9 bolts across the front |
| landing, storm domain | ground burst at strength 1.8, `fx.vortex(base, { radius: 2.8, bands: 6 })`, `attractor.swirl` 6, then squeeze the radius 2.8 → 2.15 → 1.7 → 3.3 on the gestures |
| ultimate charge-up | `fx.ramp(0.22, 0.9)`, `instability` 1, `arcRate` 2.2, `attractor` 18 / swirl 5, spirals of shadow drawn in |
| ultimate release | `fx.ramp(1, 0.04)`, blast 10 × 4.2 m, bursts at 2.2, 10 shadow trails flung along the shockwave's outer edge, 4 ticks of radial bolts, `impact({ hold: 0.15, frame: 'full', flash: 1, shakeMode: 'radial', fisheye: 0.42 })` |
| embers after | slow flakes and sparks (gravity 0.04, drag 0.4) and small residual bolts every 0.18–0.4 s |

On a rigged character, the fist socket and the aim drive `orb.position` and `orb.axis`, chest and shoulder bones feed the cloak trails, and shoulder, elbow and head go into `orb.reach`. The demo has no body: the same hooks hang off an implied one.

## Rules, each with the failure it prevents

Each rule came from a capture of this demo that went wrong.

- **Re-roll lightning; never tween it.** A bolt that morphs smoothly between shapes reads as a wriggling noodle. Use a new shape every tick, a short life and stepped brightness. The demo's **Tweened** switch shows the failure.
- **Wind ribbons counter-clockwise on screen, and prove it with a solid-colour shader.** The first build wound them clockwise, and back-face culling silently removed every bolt and every smoke ribbon. The black-on-black frame looked like a tuning problem. A shader that outputs plain red showed only two dots.
- **Black smoke needs something to be black against, and premultiplied "over" blending.** Against a 0.016 linear sky the smoke disappeared. A storm-grey horizon of (0.046, 0.052, 0.066), with ambient light lifting the ground to about 0.02, makes the black read. Additive black adds nothing, so the afterimage vanishes to its edges and additive dust greys the ground. The demo's **Additive** switch shows it.
- **Let the noise own the smoke's outline.** If alpha is still high at the ribbon's side, the quad edge shows as a straight plank. Subtract enough that `d` is below threshold at the side whatever the noise.
- **Jitter smoke along its length, not per point.** A random velocity on each point folds the ribbon into shards of broken glass. Drive the jitter from the distance along the trail.
- **Keep ribbons narrower than their bends, and take the tangent from i ± 2.** Ribbons 2 m wide on 5 cm segments folded like paper.
- **Keep the orb a shell, not a march.** A 7-step march through swirling noise left concentric bands. Two shells spinning against each other give the depth without them. An opaque bright sphere reads as a light bulb, which the demo's **Glow ball** switch shows.
- **Keep refraction under about 1.5% of the screen.** The first lens and ring offsets reached a quarter of the screen height, and the chromatic split turned the orb into a rainbow.
- **Face air rings to the camera.** A spherical front projects as a circle from any view. Rings set perpendicular to the punch became bright bars when seen from the side. Tear every ring into arcs and dim it by its screen size, or it reads as a hoop.
- **Cap spark streaks.** Uncapped, they stretched into 45 px orange dashes. Sparks are points with a short tail.
- **Shards are dark flakes.** Lobed ones read as leaves, and ones with a blue rim read as worms.
- **Put the hit's heat in the world's own cracks.** A radial-noise decal of glowing cracks looked like a flower sticker. The same heat in the ground's crack mask reads as the stone itself glowing.
- **Warm up shaders against the colour pass's render target.** The first ring, cone and scorch each cost a 44–71 ms hitch on first use. `fx.warmup()` removed every hitch after the page's first frame.

## Cost

Measured in headless Chrome for Testing 151 on ANGLE Metal at a load average near 8. Each frame was stepped synchronously and finished with a 1-pixel `readPixels`, so the times are CPU plus GPU.

| drawing buffer | median per beat | 95th percentile |
| --- | --- | --- |
| 1440 × 900 (dpr 1) | 1.5–2.2 ms | 3.0–4.0 ms |
| 2520 × 1575 (dpr 1.75) | 6.4–11.6 ms | 12.7–23.1 ms (charge close-up, orb filling the frame) |

Only the very first frame after load is slow, at 97 ms. Everything is pooled: 220 bolts × 65 points, 1,600 smoke sprites, 1,800 sparks, 160 chips, 40 rings, 8 cones and 14 scorch marks. Cap the pixel ratio (the demo uses 1.75) before cutting effects: the cost is fill rate in the smoke and orb, not the simulation.

## Lifecycle and accessibility

- `fx.update(realDt)` clamps a step to 0.1 s. Reset your frame clock on `visibilitychange` so a returning tab does not integrate the pause.
- Under `prefers-reduced-motion: reduce`, the demo holds a composed still (the charge at full pressure) and plays beats only on request, with safe flashes, no shake and no fisheye.
- The demo's switches are real buttons with `aria-pressed`, beats are on keys 1–5 (0 for the full cast), Space pauses, H hides the controls, and changes are announced in a live region. No text renders under 11 px.

## Verify

- [ ] With **Tweened** on, the arcs turn into wriggling wire. Back on **Re-rolled**, they crackle.
- [ ] With **Additive** on, the black afterimage is gone and the dust greys the ground. Back on **Smoke over**, black smoke swallows the light behind it.
- [ ] With **Glow ball** on, the orb is an opaque white bulb. With **Air lens**, the streaks spin around the punch axis and the background bends through it.
- [ ] Step to the barrage's first hit: during the 0.1 s hold, a white disc around the fist shows the energy in black. The ultimate inverts the whole frame for 0.15 s.
- [ ] Fire five inverting hits inside a second with **Full** flashes: the first three invert, and the fourth and fifth dim by 0.32 instead.
- [ ] Chips come to rest touching the ground: after the storm landing, all 21 had their lowest corner within 1 mm of y = 0. The cracks under a hit glow, then cool.
- [ ] Reduced motion holds a still with safe flashes. The console is clean at 1440 × 900 and 390 × 844, and the portrait camera backs off so the orb keeps its frame.
