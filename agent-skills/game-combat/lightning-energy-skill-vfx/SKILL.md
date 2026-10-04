---
name: lightning-energy-skill-vfx
description: Build the effects of a close-combat energy skill as one visual language in Three.js. Lightning that reads as lightning, dynamic but never in your face: trees of strips (trunk, forks of forks, hair-fine branchlets) with a fine white core in a violet-blue glow, each channel reaching out as a stepped leader, flaring as it connects, holding its shape and fading through an afterglow, one discharge at a time; a storm-cloud orb (a lit billow surface that churns in place, 10-15 plasma-globe arcs from a small white core to its inner wall, crawlers on the rim, a hairline fresnel); ground strikes that flash when the leader arrives, crawl along the stone's own cracks and reflect in wet stone (the demo's floor is a scanned CC0 texture); a torn black shadow with dry-brush edges that hangs off the orb and streams behind it, air bursts felt as refraction, orange sparks, fractured rocks that land or float in a storm domain, and impact frames that hold, invert in two-tone ink with tapered speed lines, shake and bend the lens, limited to three flashes a second. Use for anime or dark-fantasy skill effects, lightning or thunder fists, plasma or energy balls, charge-ups, dashes with shadow trails, ground strikes, storm or domain rings, ultimates, hit-stop, impact frames, negative flashes, screen shake, "black lightning", "thunderstorm fist", "realistic lightning", "afterimage" or "skill effects only". Includes a reusable module and a five-beat demo with failure-mode switches.
---

# Lightning Energy Skill VFX

Use this for the effect half of a skill: what the fist throws, what the air does, what the hit leaves. Reach for a sibling instead in these cases:

- **Readable, budgeted gameplay effects in general** (telegraphs, status, cleanup rules): `create-game-vfx`. Its readability rules still apply here.
- **Scoring a skill out of 10, or polishing the caster's body and timing:** `game-dev-combat-skill-polish` and `game-dev-combat-animation`.

Source: a 30-second skill-showcase brief for a dark-fantasy ability user. White-blue lightning, a semi-transparent thunderstorm orb ahead of the fist, black smoke afterimages like a shattered cloak, air bursts, orange sparks and impact frames. Only the effect language is kept here. The character, story and shot list are left out.

Verified stack: Three.js r170, WebGL2, GLSL `ShaderMaterial`s, HalfFloat render targets, a 96³ baked noise texture, and a hand-written bloom and composite. No post-processing library. The demo's floor is Poly Haven's [Dry Ground 01](https://polyhaven.com/a/dry_ground_01) by Rob Tuytel (CC0), its 1k colour, normal and AO/roughness maps in `demo/assets/ground/`, embedded by `demo/build.mjs` as data URIs so the page still opens from disk.

## The mechanism

**One effect clock, one composite, and a shadow that belongs to the orb.**

- **One clock.** Lightning re-rolls on it, a hit freezes it (a hold), and a time ramp slows it. A 0.1 s hold therefore stops sparks, smoke, rings and lightning together.
- **One composite.** Every layer that bends the air writes a signed screen offset into one shared distortion buffer. The composite reads colour through that offset, adds bloom and tone maps once. Only then does it draw the impact frame on top, so a negative flash inverts the finished image rather than one layer.
- **The orb carries its own shadow.** A black teardrop is drawn behind the orb, and ribbons and billows leave from the orb's back. Wherever the fist goes, the black follows it; nothing is emitted from a body you cannot see.
- **Lightning is a tree of strips in one point ring.** A bolt is a trunk, its forks, their forks and twigs. All their points live in one ring buffer and the GPU buffers are sized by a point budget, so thousands of twigs fit. Points of bolts anchored to the orb are stored relative to it and the anchor is a uniform, so the buffers change only when the lightning re-rolls (30 Hz), not every frame the orb moves.
- **Lightning has a life, drawn in the shader.** Every vertex carries when the leader reaches it, so a channel grows out from its origin (forks from their junctions) in 30–90 ms on the lightning's own clock, flares as the return stroke connects, holds its shape for a few ticks, and fades through an afterglow. The ground flashes when the leader arrives.

## Reuse the working effect

Copy [assets/storm-energy.mjs](assets/storm-energy.mjs). You pass in your own `THREE`, and the module does not import a second copy. [The demo](demo/index.html) runs this same module, inlined by `demo/build.mjs` because a page opened from disk cannot import modules.

```js
import { createStormEnergy, ENERGY_LIGHTS_GLSL, GROUND_HEAT_GLSL } from './storm-energy.mjs';

const fx = createStormEnergy(THREE, { renderer, scene, camera });   // bakes the noise texture
fx.setSize(width * dpr, height * dpr, dpr);       // drawing-buffer pixels, again on resize
fx.warmup();                                      // compile every effect before the first hit

const orb = fx.createOrb({ radius: 0.4 });        // shadow: true by default (teardrop, ribbons, billows, motes)
orb.reach = [shoulder, elbow, head];              // Vector3s the arcs can leap back to
orb.strikeAt = groundSpot;                        // optional: aim its ground strikes; orb.strikes = false stops them

// Optional: let ground arcs follow your ground's cracks. Return [x,y,z,...] walking from (x, z).
fx.options.crackPath = (x, z, heading, length) => traceAlongCracks(x, z, heading, length);

// Ground and props: add ENERGY_LIGHTS_GLSL (+ GROUND_HEAT_GLSL, WET_GLSL), spread fx.lightUniforms
// (+ fx.heatUniforms) into their uniforms, and add energyLight(...) and
// uGlow * groundHeat(p.xz) * yourCrackMask to their colour. Use wetness(p.xz) for the ground's
// roughness: the bolts' reflections are masked by the same function.

function frame(realDt) {
  const dt = fx.update(realDt);                   // sim seconds: 0 during a hold, scaled by ramps
  // move the fist with dt, then:
  orb.position.copy(fist).addScaledVector(aim, orb.currentRadius * 0.92); orb.axis.copy(aim);
  fx.render();                                    // the orb's shadow follows from its motion here
}

// A heavy hit:
fx.blast(orb.position, aim, { length: 4.6, radius: 1.5 });   // a few divergent bolts + a refraction funnel
fx.burst(orb.position, { strength: 0.9 });        // air burst: felt as refraction
fx.burst(groundUnderFist, { strength: 0.6 });     // ground burst: ring, dust, chips, spark fountain, heat
fx.impact({ hold: 0.1, frame: 'full', at: orb.position });
```

Other calls:

- `fx.bolt(a, b, opts)`: `levels`, `jag`, `width`, `minPx`, `intensity`, `life` (ticks), `hold` (keep the shape at full strength for its life, then an afterglow), `leader` (seconds to reach out; default by length, 0 = at once), `anchor`, `branches` (first forks), `twigK` (twigs per fork), `twigs` (fork depth, up to 3), `fringe` (hair-fine branchlets along trunk and first forks), `forkLen`, `core` (the white core's share), `flat` (pin to a height: ground arcs), `shell` / `inside` (on or within a sphere round the anchor), `inner` (inside the orb: dimmed behind its core), `path` (follow a polyline), `hit` (false: no ground strike).
- `fx.sparks`, `fx.debris`, `fx.puff` and `fx.shards`.
- `fx.ring` for a single pressure front.
- `fx.createTrail({ chain, chainSize })` for any other smoke stream, with billows laid along its path.
- `fx.vortex(center, opts)` for a storm domain.
- `fx.addHeat(pos, radius, amount)` to make the ground glow.
- `fx.ramp(scale, seconds)` for a time ramp.
- `fx.repeat(ticks, fn)` to re-throw something on the next lightning ticks.
- `fx.attractor` to pull everything into a charge; `attractor.lift` (0–1) makes debris float in it.

## The layers, with the numbers that shipped

| layer | numbers |
| --- | --- |
| Lightning | Midpoint displacement with 4–7 levels (bolts longer than 1.5 m get one more), up to 129 points per strip. Each split lands 32–68% of the way along; the offset is 0.15–0.34 × the length and falls ×**0.58** per level (halving left the fine scale smooth), the first level at 0.6×. Trunk weight varies 0.85–1.45×. **Forks of forks:** a strip throws min(12, (1.2 + 1.5·len)·branches) first forks, then (0.8 + 4·len)·twigK and 7·len·twigK more per level, down to depth 3. Forks leave 5–85% of the way along at 0.3–0.85 rad, 0.1–0.65 × the length (a power law, × `forkLen`); twigs leave at 0.45–1.2 rad, 0.05–0.55 × the length, with a weaker pull toward the trunk's direction, so they splay instead of combing. By depth: width 1 / 0.4 / 0.22 / 0.13, minimum px 1 / 0.46 / 0.28 / 0.18, brightness 1 / 0.62 / 0.42 / 0.3, jag ×1.2 then ×1.5. Points live in a 131,072-point ring with 16,384 strips; the GPU buffers hold 60,000 points. **Fringe:** up to 24 branchlets (n/6 × `fringe`) along a trunk, 0.6× that along first forks, 1.2–5% of its length (×1.4 on forks) at 0.5–1.3 rad, two kinks each (jag ×2), width 0.09, minimum px 0.14, brightness 0.18–0.32, almost all glow. **Life:** shapes re-roll on a **30 Hz** tick. A one-off bolt steps 1.0 → 0.55 → 0.28 → 0.14; a held one (`hold`) stays at 0.9–1.0 for its life, then 0.55, 0.2 and 0.07 (afterglow). **Leader:** it reaches out in min(0.09, 0.03 + 0.014·len) s (0.03 s inside the orb), with a tip ×(1 + 1.3) and a return-stroke flare ×(1 + 0.8e^(−20t)) once it connects. Ribbon 3 × the width, at most 40 px × dpr. **A fine core:** radius max(0.4 px, min(9% of the half-width × share, 1.25 px)) × dpr, share 1 / 0.7 / 0.45 / 0.34 / 0.26 by depth; core ×3.8 white × share, a tight glow e^(−px / 0.22 half-width) × 1.45 and a wide halo (1 − s)³ × 0.38 of **(0.15, 0.17, 1.0)** (linear violet-blue). Brightness along the channel × (0.62 + 0.24 sin 8.3t + 0.14 sin 21.7t), trunks × (1.12 − 0.3t), and about one point in ten on trunks and first forks a hot bead ×1.65. |
| Orb | **A lit billow surface, not a soft volume.** March 28 steps from a random per-pixel start through r < 1 on a two-octave field, then refine the first hit with 5 bisections on the full field, `1.5 n₁ + 0.8|n₂| − 0.3 + 0.5|n₃| − 0.12 + 0.28|n₄| − 0.08` (the abs octaves make rounded lobes with creases), minus 1.2 × smoothstep(0.93, 1, r) at the limb and a clear pocket of radius 0.22 round the core. **It churns in place:** the coordinates turn only t(0.05 + 0.07·pressure) + 0.25(1 − r) round the punch axis and are not scrolled; the warp field (×0.7, amplitude 0.95) drifts through at (0.09, 0.16, −0.07) per second, so the billows boil and deform where they are. Scale ×2.5. A march step counts as a hit only when the cheap field passes −0.06 and the full field passes 0, or the edges stepped. The normal comes from a tetrahedral gradient (e = 0.014). Lighting: a key from above and in front, wrapped `(0.6 N·L + 0.4)^1.6` × 0.14; tops `key^6` × 0.07 in (0.42, 0.52, 1.0); a rim `(1 − N·V)³` × 0.06; cavities darkened by depth to 0.22; the core `(0.5 + 1.1·pressure)/(0.02 + 12d²)` × 0.55 on the side facing it; and each arc's light along its segment from the core to its wall end, `w(e^(−300q²) + 0.1e^(−25q²))`. Base colour (0.17, 0.27, 1.0) × (0.55 + 0.6·pressure)(1 + 0.9·instability). Core: `7e^(−1400d²) + 0.8e^(−120d²) + 0.08e^(−9d)`, seen 45% through the cloud, plus a haze 0.22 × Ic × e^(−7d²). **Rim: a hairline,** `e^(−e/0.006) + 0.04e^(−e/0.05)`, e being the distance in from the silhouette in radii, and a faint 0.015-radius glow outside. **Arcs are real ribbons:** 10 + 5 × pressure (8 + 5 when the orb is under 120 px) from a core that wanders 0.07 r, to ends spread on a slowly turning Fibonacci sphere (0.35 rad/s, each wandering 0.32 off its place). Each channel holds one shape for 4–9 ticks, then re-rolls (15% stay dark a turn). Width 0.08 r, minimum px 0.8 × 0.016 × the orb's screen radius, core 0.5, two fork levels, fringe 1.3. 30% crawl on along the inner wall (0.975 r); now and then (p = 0.3 × (0.5 + 0.6·pressure) a tick) a crawler hugs the outside of the membrane at 1.03 r round the silhouette for 4–7 ticks. The orb breathes slowly, 1 + 0.02 sin 4t + 0.03·instability·sin 7.3t. Arcs behind the core dim to 0.16. The lens bends only the air between 1.05 and 1.3 radii, by 0.05 × radius / screen span: bending inside warped the orb's own arcs, and sky pulled over its edge read as a grey glass band. |
| Ground strikes | Any bolt that ends under 0.16 m after coming down at least 0.3 m strikes. A 0.22 k white-hot point (round: rays read as lens flare), a light 0.14 m over the stone at 15 k (decay 14) in one of two strike slots, heat 0.75 over 0.9 k, 2–4 arcs crawling 0.6–1.8 k along the cracks for as long as the stroke (1, then none, once a tick has 2 or 4 strikes), 2 sparks for the first strikes of a tick, and chips with a dust puff at most every 0.3 s, all fired when the leader arrives. k = min(1.4, 0.55 + 0.2·len) × min(1.3, intensity). **One discharge at a time:** outside its shell the orb fires a strike, a leap or a crackle and holds it before the next. A strike is 2–3 return strokes of 3–4 ticks down one channel; idle, a new one starts with p = 0.03 + 0.06·pressure a tick (`orb.strikeRate` overrides it). Strikes have first claim on a tick; then crackles, p = 0.12·min(arcRate, 1.2)·(0.5 + pressure), held 3–5 ticks. Leaps: p = (0.05 + 0.1·pressure)·min(arcRate, 1.6), held 3–4 ticks. |
| Shadow | **Teardrop**: a camera-facing quad behind the orb. In orb radii it is 1.6 + 2.6K long, with half-width 0.97 + 1.3t − 2.2t² and a round cap at the front that stays inside the orb's silhouette (at 1.25 it showed as a dark ring round the rim). K = 0.65 + 0.35 × (speed − 1) / 4: there is always a tail. Torn tongues come from noise squeezed across the tail (×2.4) and streaming down it (×0.55 at 2.6/s), with finer wisps at ×6.5 / ×1.4. **Dry-brush fibres** cut the edge: noise stretched down the tail (×22 / ×57 across, ×0.7 / ×1.6 along, streaming at 2.2–2.8/s) eats 0.3 × (0.45 + t) radii into it, and inside a 0.28-radius band at the rim the strokes go up to 80% see-through, like a brush running dry. The edge is `smoothstep(−.02, .035)`, the tip shreds from t = 0.7, holes open toward the tip, and flecks tear off just outside (noise ×11 over 0.54–0.62, more down the tail). Inside it is never one flat black: slow charcoal billows (two octaves, drifting down the tail) vary it from 0.55 to 1.45 × the smoke colour with faint (0.003, 0.003, 0.005) folds. No lit edge: that read as blue haze. The tail points against the velocity while the orb moves, and back along the arm and up 0.3 while it holds. **Ribbons**: three from the orb's back at 1.0 / 0.6 / 0.6 × r, erosion 0.24 / 0.22, opacity 0.8. **Billows**: one every 0.5 r travelled, 1.2–2.0 r wide and stretched 1 + 0.7k along the path. Another 14 × (0.4 + pressure) per second stream back while the orb holds. |
| Smoke detail | Ribbons drawn premultiplied over the frame, colour (0.003, 0.0035, 0.005), darker than the night sky behind it. `d = across·1.45 − 0.45 + fbm·0.85 + tatter·0.55`: the tatter is fine rips at ×3.4 along and ×3.8 across. It erodes by `th = mix(0.32 + erode, 1.05, age^0.8)`. At the sides only (weighted by across²), fibres stretched along the length fray the edge by up to 0.3. Alpha is forced to zero over the outer 16% of the side, and fades within 0.8–2.6 m of the lens. Width w × (1 + 0.9·age) × a noise of 0.3–1.2 along the length, with the tangent taken from points i ± 2. Billows erode 3 octaves plus a fine one with a 0.07-wide edge, their rims frayed by fibres along their stretch (×14 and ×31), their insides tinted 0.65–1.35 × by the same noise, and fade into the ground plane over 0.22 m. |
| Air and ground | Three rings 55 ms apart: radius 2.2 / 3.4 / 4.8 × strength, line 0.04 / 0.07 / 0.11 m, life 0.22 / 0.32 / 0.46 s, refraction 0.035 / 0.028 / 0.02 m with a derivative-of-Gaussian profile. **In the air they are refraction only** (colour × 0.12). On the ground they draw at 0.77 / 0.38 / 0.22. Ground bursts add a dust ring, a spark fountain of 30 × strength, chips 4–12 cm across and heat; their bolts crawl flat over the stone. The punch funnel is refraction only. The punch throws 1 + strength held bolts spread round the axis, 0.35–1.0 × the radius out, and re-strikes with p = 0.34 on each of the next three ticks. |
| Sparks, debris | Sparks run hot (4.2, 2.5, 1.0) → (2.8, 0.78, 0.16) → (0.85, 0.10, 0.025), 4–11 mm, drawn 1.1–5 px wide. Streak = velocity × 20 ms, capped at min(4 × width, 16 px × dpr). Gravity 9.8, drag 1.2, bounce 0.35. Sparks behind the orb's front surface are hidden. Cold motes (white-blue) swirl at the orb at 14 × pressure per second. **Rocks** are a cube cut by 15–20 random planes 0.5–0.9 from its centre and squashed to 0.72 in height: three variants with flat fractured faces and exact hull corners. Each rests on its rotated hull's lowest corner, bounces at 0.32, slides at 0.55, and shrinks away after its life. Dark basalt (0.028) with grain and a cool rim from the lights behind it. Inside an attractor with `lift`, rocks spring toward their own hover height (80% at 0.08–0.8 m, 20% at 1.1–2.1 m), drift round its centre, and keep 3 m from the camera. |

**Light and heat.** Six point lights in (0.30, 0.42, 1.0): bluer than white, paler than the glow. Diffuse falls off as 1/(1 + 2.6d²); the specular reaches further, 1/(1 + 0.45d²), and grows with Fresnel at grazing angles, `pow(N·H, mix(140, 8, rough)) × (1 − rough) × (1.5 + 10F)`, so wet stone catches a strike's light across the ground and not only in a pool under it.

- **Orb:** (1.6 + 5.5 × pressure) × radius/0.45.
- **Impact:** 14 × strength, warm cooling to blue.
- **Bolt flash:** min(length × brightness × 2.2, 26).
- **Blast:** 30 × strength.
- **Two strike slots,** taken in turn: 15 k at 0.14 m over the contact.

Heat spots work the same way for ground bursts and strikes. Ground bursts leave radius 1.5 × strength, decaying as e^(−1.3t). The ground's own cracks glow with the heat as hairlines, only where the heat passes 0.12–0.5.

**Wet reflections.** The same bolt ribbons are drawn a second time mirrored under y = 0 and stretched down 1.5×, with an inverted depth test (`GreaterDepth`), so they appear only where something nearer was drawn (the ground) and never over the sky. A wetness mask shared with the ground (`WET_GLSL`, evaluated per vertex) keeps them to the puddles, at 0.55 × (0.15 + 0.85 × wet), fading with height and dropping out for arcs lying on the stone.

**Impact frames** (composite, after ACES):

| part | numbers |
| --- | --- |
| Hold | 0.05 s warning, 0.1 s heavy hit, 0.15 s ultimate. Sim time is 0 and lightning stops, so the whole frame holds. |
| Two-tone negative | Shown during the hold. Luminance through `smoothstep(.26, .34)` becomes ink (0.012, 0.014, 0.022) on paper (0.93, 0.965, 1.0). `full` covers the frame. `center` is a jagged starburst, `R × (1 + 0.38·spikes + 0.05 sin 61θ + 0.03 sin 113θ)`, its edge bleeding like ink. Both carry manga speed lines in ink: 140 angular slots with a new seed per hit, 45% of them drawn, each starting at 0.3–0.8 R, widths 0.06–0.34 tapering to 30% toward the centre, now and then one long dry-brush gap (a gap every few pixels read as Morse code), and a finer outer layer (360 slots, 28% drawn, from 0.9–1.5 R). The paper carries a 3.5% grain. |
| Flash | Fades to white as e^(−t/0.07) after the hold. Use it only on the ultimate: after a normal hit it read as a grey wash. |
| Shake | The demo runs shake at 0.6 and fisheye at 0.65 of the numbers below: felt, not thrown at the viewer. `axial`: −a·e^(−7t)·cos(2π·5.5t), a drop and then a rebound, a = 0.006–0.022 screen heights. `radial`: zoom 1 + 1.4a·e^(−6t)·cos(2π·7t) plus jitter. Overscan by 1 + 2.2·|shake|. |
| Fisheye | Barrel (1 + k·r²·1.8)/(1 + 0.45k), k = 0.42 for the ultimate, decaying as e^(−2.2t). |
| Time ramp | 1 → 0.4 over 0.6 s for the ultimate charge (0.22 stretched it to 11 s), back to 1 in 0.04 s. Lightning never drops below 35% of real time. |
| Safety | At most 3 inverting or white flashes in any rolling second. Past that, or with `flashes: 'safe'`, a hit dims the frame by 0.32 instead. Under `prefers-reduced-motion` set `flashes: 'safe'`, `shake: 0` and `fisheye: 0`. |

**Composite:**

- Dual-Kawase bloom with 5 levels from half resolution, **threshold 1.3**, knee 0.6, × 0.27, tinted (0.38, 0.42, 1.0): a white halo read as grey haze, and lightning light scatters blue.
- A half-resolution HalfFloat distortion buffer. The xy channels hold fronts and the funnel; zw holds the orb's lens.
- No chromatic split.
- One ACES pass, then sRGB, grain 0.03 and vignette 0.85. ACES clips each channel, so a bright glow in (0.42, 0.45, 1.0) came out near-white: keep halo colours deeply saturated and their intensity moderate.
- Scene: a slate horizon of (0.017, 0.024, 0.036) and sky of (0.0055, 0.0095, 0.017), measured off the targets, with dim torn cloud that heavy lightning lifts; the sky follows the lightning at 4/s, so it swells and settles instead of flickering.
- **The floor** (demo): the scan at 6 m a tile, so its plates are 0.2–0.5 m. Its light-brown mud becomes dark wet slate, `(0.036, 0.039, 0.048) × (lum / 0.2)^1.3 × (0.72 + 0.56·macro noise)`, its normals lifted 1.7× (dry mud is shallow), roughness 0.8 × its own map down to 0.16 in the wet hollows, and anisotropy 8 for the grazing views. Its AO channel marks the cracks: `1 − smoothstep(0.27, 0.42, AO)` darkens and roughens them, and the heat lights only the deepest, `1 − smoothstep(0.2, 0.3, AO)`. Fine grit (simplex at 97/m) stays a screen-space bump for the wet glints.

## Cut a brief into beats

| brief says | call |
| --- | --- |
| charge, condensing orb, fingers curl | `orb.radius` 0.1 → 0.5 over 2.2 s, `pressure` 0.35 → 1, `orb.pulse(−0.3)`, `fx.attractor` pulling motes in, a little heat under the orb; from 1.9 s `orb.strikeRate = 0.09` and `orb.strikeAt` one spot in front of it: a single trunk down to a lit contact about every half second |
| first small burst warning | `fx.impact({ hold: 0.05, frame: 'center', shake: 0.006 })` + a 2-layer burst at strength 0.5 |
| vanish into a dash, zigzag turns | move the orb: its shadow lays out along the path by itself. `fx.repeat(20, …)` throws one held bolt every 4 ticks from the orb back to a recent path point. Each turn gets refraction and black billows. |
| straight punch, thunderstorm fist compression | `orb.pulse(−0.35)` 120 ms early, then `fx.blast` + air `burst` + ground `burst` + `impact({ hold: 0.1, frame: 'full', flash: 0 })` |
| lateral swing, spinning elbow | the orb sweeps the arc and its shadow follows; a fan of 4 bolts across the front, then held arcs back along the arc every third tick; a flat ring at chest height as refraction |
| landing, storm domain | ground burst at strength 1.8, 20 rocks lifted by `attractor.lift = 1`, `fx.vortex(base, { radius: 2.8, base: 1.1, height: 2.6, chords: false })` up in the sky, `attractor.swirl` 6; the discharge is five aimed spots (four steep trunks fanned to one side, one long arm to the other), struck one at a time from the orb's membrane, each held 4–7 ticks before the next lands elsewhere, plus one up out of its top every 9–16 ticks; squeeze the radius 2.8 → 2.15 → 1.7 → 3.3 on the gestures |
| ultimate charge-up | `fx.ramp(0.4, 0.6)`, `instability` 1, `arcRate` 2.2, `attractor` 18 / swirl 5, streams of shadow spiralling in, cold motes, no ground strikes (`orb.strikes = false`); two great channels cross through the orb in an X to the frame's corners along camera-relative directions, each shape held 3–4 ticks, with short forks (`forkLen` 0.45) |
| ultimate release | `fx.ramp(1, 0.04)`, the funnel and bursts at 2.2, 10 shadow streams flung along the shockwave's outer edge, 4 ticks of radial bolts, `impact({ hold: 0.15, frame: 'full', flash: 1, shakeMode: 'radial', fisheye: 0.42 })` |
| embers after | slow flakes, slow billows and sparks (gravity 0.04, drag 0.4), and small residual bolts every 0.12–0.3 s |

**Between beats, ease.** The demo passes the orb's radius, pressure and instability through a short ease (radius at 9/s, the others at 4/s) after each beat sets them, and snaps only when the orb re-forms from nothing. Before that, the charge's first frame snapped the orb from 0.36 m to 0.1 m.

On a rigged character, the fist socket and the aim drive `orb.position` and `orb.axis`, and shoulder, elbow and head go into `orb.reach`. For a cloak on the body as well, add `fx.createTrail({ chain })` streams from the shoulder bones. The demo has no body.

## Rules, each with the failure it prevents

Each rule came from a capture of this demo that went wrong, flagged by blind judges or by the person it was built for.

**Shadow and smoke**

- **Hang the shadow off the energy.** Black cloak trails from an invisible body read as detached planks and blobs. The teardrop and smoke must leave from the orb itself.
- **Give the shadow a direction and a torn edge.** A round dark halo read as "a blurred static backdrop". A teardrop with tongues, a crisp edge, holes and a shredding tip reads as a cloak in motion.
- **Black needs a lighter backdrop, premultiplied "over" blending and a high bloom threshold.** Smoke at 0.003 reads against a slate horizon of 0.017–0.036; at 0.010 against a 0.016 sky it vanished, and a 0.046 sky read as washed-out grey. With a bloom threshold of 0.9, the orb's halo washed the black smoke into "blue haze". Additive black adds nothing (the **Additive** switch shows this).
- **Keep the shadow's head inside the orb's silhouette.** A teardrop head 1.25 radii wide showed round the rim as a dark ring and, below the orb, as a pedestal.
- **Let the noise own every smoke outline.** Alpha must reach zero at a ribbon's side whatever the noise, or the quad edge shows as a plank. A lengthwise streak term drew striations. Jitter must vary along the length: random per-point drift folded ribbons into glass shards. Keep ribbons narrower than their bends, with the tangent from i ± 2, or they fold like paper.
- **Fray the black with dry-brush fibres, and never fill it flat.** A crisp, smooth outline over pure black read as a cut-out silhouette with no detail. Fibres stretched along the motion that eat into the edge and go partly see-through at the rim, flecks tearing off, and faint charcoal folds inside read as smoke, as long as nothing lights its edge.
- **Billows laid along a path need detailed edges and must stretch along that path.** Round, soft billows read as "stamped blotches" or "an out-of-focus smear". Give them crisp three-octave erosion, stretch them 1–1.7× along the path, and fade them into the ground plane so no quad cuts it in a straight line.

**The orb**

- **Draw the storm inside as a lit billow surface, and the lightning as real ribbons.** Filaments where two noise fields cross zero read as grain, "not lightning at all". A soft ray-marched cloud blurred every billow into blue fog, even after its levels matched the target. March to the first solid hit, refine it, take a normal from the field's gradient and light it, and the lobes and creases read as cumulus.
- **Light the faces you can see.** The core is inside the cloud, so it lights only the far sides of the front billows. A key from above and in front, the arcs' own light along their segments, and cavities darkened by hit depth make the near-black creases and lit lobes the target shows.
- **Measure before tuning by eye.** The orb's interior percentiles (10/25/50/75/90%) against the target's showed a 10× gap in the darks and a too-saturated hue, where two judges only said "too bright" and then "too dark".
- **Spread the arcs evenly and keep each one a single strand.** Random wall ends left a quadrant empty and bunched the rest into a "hairy fan". Ends on a turning Fibonacci sphere, one held shape per channel, and few, splayed twigs read as 10–15 distinct veins.
- **Size inner arcs by the orb's size on screen.** At a fixed minimum width a small orb (storm ring) turned into a white knot.
- **Keep the membrane a hairline and the lens outside it.** A wide rim read as a neon ring. A lens bending inside the silhouette warped the orb's own arcs, and the sky it pulled over the edge read as a grey glass band. A bright opaque sphere reads as a light bulb (the **Glow ball** switch shows this).
- **Let the cloud churn in place; never slide it.** Spinning the cloud at 0.5–1.2 rad/s and scrolling its noise read as a texture sliding over the ball. Turn it very slowly and drift the warp field through it instead, so the billows deform where they are. `spin·t·(1.6 − r)` shears without limit and winds the noise into rings; more than about 0.5 of radial shear smeared the billows into streaks.

**Noise**

- **Bake it, but set the 3D texture yourself.** `WebGL3DRenderTarget` swaps in a texture that defaults to NEAREST and 8-bit, which showed as mosaic edges for two rounds. Use at least 16 texels per noise cell, or thresholds show trilinear facets.
- **Never take zero-crossing filaments from baked classic Perlin.** It is zero on every lattice point, so the orb lit up in a regular grid of cloud that read as a planet. Billowed (abs) octaves of it are fine once the coordinates are warped.

**Lightning**

- **Re-roll lightning; never tween it.** Morphing bolts read as wriggling noodles (the **Tweened** switch).
- **Hold shapes, then fade; never strobe.** Every arc, strike and X arm re-rolled on every 30 Hz tick was too much animation, in your face. Hold a shape for 3–9 ticks at a steady strength, then fade it through an afterglow (0.55, 0.2, 0.07) while the next one grows.
- **One discharge at a time.** Two leaps a tick, crackles and a strike together, and five storm channels flashing in unison read as a firework. Outside the orb, fire a strike, a leap or a crackle, hold it, then the next; take the storm's channels in turn.
- **Grow it out, then flare.** A bolt that appears whole in one frame reads as a picture of lightning. Reaching out from its origin over 30–90 ms, forks from their junctions, with a bright tip, then the return stroke flaring the whole channel as it connects (and the ground flashing only then) reads as lightning arriving.
- **A fine core, many hairlines.** A 4–6 px white core with a glow at 2.2 read as a bold neon tube. A core capped at 1.25 px × dpr at ×3.8, a glow at 1.45, and dozens of hair-fine branchlets of mostly glow make the line subtle and the detail rich.
- **Build a hierarchy, all the way down.** Even-width lines with equal segments read as "lines drawn point to point", and at a fixed minimum width every bolt became an equal strand in a tangle. Give trunks weight and a wider core, taper them to a point (a blunt end read as a neon tube), split segments unevenly, keep fine crackle (offset ×0.58 a level, not 0.5), and fork to depth 3 with a power law on length.
- **Avoid parallel bundles and bows.** A spear of near-parallel bolts read as combed hair; so did a channel shown twice (its last two shapes), long first forks running beside their trunk, and twigs pulled toward the trunk's direction. Chords bowed upward read as bridges and arches.
- **Root discharge at the orb, leaving from its membrane.** Bolts between points out in the air read as loose noodles, and bolts starting at the orb's centre turned it into a white knot. Strike from the orb's surface down to the ground.
- **Aim the main channels; randomise the rest.** Random strikes landed somewhere new on every capture, and judges marked the layout wrong each time: a diagonal across the frame instead of a trunk under the orb, a tangle instead of a fan. Re-strike a few channels to chosen spots (the charge's one trunk, the storm's fan, the ultimate's X) and let forks, twigs and crawlers vary.
- **Keep the glow saturated and moderate.** ACES clips per channel, so a bright (0.42, 0.45, 1.0) halo came out white and a judge called it "pale cyan". The glow's colour was measured off the target as linear (0.10–0.15, 0.17–0.19, 1.0); tint the bloom the same way.
- **Wind ribbons counter-clockwise on screen, and test them with a solid colour first.** Clockwise ribbons were silently culled; the empty frame looked like a tuning problem.

**Impacts and the world**

- **Use the air for refraction, not colour.** Coloured air rings read as hoops. The punch funnel's surface read as grey slabs from inside. Keep refraction under about 1.5% of the screen and drop the chromatic split: a quarter-screen offset turned the orb into a rainbow, and smaller splits fringed every spark.
- **Make the impact frame a starburst with tapered speed lines, and skip the white after a normal hit.** A soft disc read as a spotlight cutout, and the white flash after it as a grey wash. Taper the strokes toward the centre and break one only now and then: a gap every few pixels read as Morse code.
- **Keep flakes few and dark.** In numbers they read as confetti, lobed ones as leaves, and blue-rimmed ones as worms.
- **Put heat in the world's own cracks as hairlines, only where it is hot.** A radial decal read as a sticker, a wide lit web as neon tiling, and wide soft cracks as worms. Lifting the dust read as flat grey cartoon puffs, and dust darker than the lit stone read as ghost shadows.
- **Make the ground a scan.** Five judges in a row read the procedural Voronoi plain as "clay tiles" with lines drawn on it, whatever the tuning. A CC0 scan of cracked ground, re-tinted and wetted in the shader, reads as ground at once.
- **Make strike arcs follow the cracks the ground draws.** Arcs thrown flat in random directions read as a "broom" fanned across the screen. The demo keeps the scan's AO channel on the CPU, and `crackPath` walks it: at each 3 cm step it tries seven headings 0.35 rad apart and takes the darkest AO (the deepest crack), with a small cost for turning. For a procedural ground, mirror its hash in JavaScript (integer PCG reproduces exactly) and walk the same distance field.
- **Give arcs lying on the ground a depth bias.** At a grazing view the stone ate the lower half of each ribbon, which read as a dashed line.
- **Take sharp relief from a normal map or an exact gradient, not screen derivatives.** `dFdx` bumps step in 2×2 pixel blocks; along every crack bevel the wet sheen turned them into dashes. Keep screen-space bumps for the fine grit only.
- **Light wet stone from the lightning.** A constant ambient made the quiet charge's ground twice the target's brightness, while the ultimate's stayed too dark. Reflect the horizon and the strikes' light (not the orb's steady one) with Fresnel off a gritty normal, and mirror the bolts: down-stretched streaks, not a sideways blur.
- **Ease what a beat sets.** A beat's first frame snapped the orb's size; the camera springs, but the orb did not. Pass the orb's radius, pressure and instability through a short ease after each beat sets them.
- **Feather every glow to zero inside its quad.** A falloff cut at the quad's radius showed as boxes at the contacts, and the flat contact decal as an ellipse.
- **Warm up shaders against the colour pass's render target.** First-use compiles cost 44–71 ms hitches.

## Cost

The cost is fill rate: the orb's march, the full-screen ground, and smoke over smoke. Two measurements:

| build | drawing buffer | median per beat | how |
| --- | --- | --- | --- |
| before the lightning rebuild | 1440 × 900 (dpr 1) | 4.5–6.3 ms | stepped frames + 1-pixel `readPixels`, load ≈ 7 |
| before / after the rebuild, back to back | 2160 × 1350 (1440 × 900 @1.5) | GPU 7.8–16.4 ms / 7.8–13.0 ms | WebGL timer queries, interleaved, load 12–16 |
| before the rebuild / after the calm pass and the scanned floor | 2160 × 1350 | GPU 11.7–20.5 ms / 10.6–14.9 ms | the same, load 12–16 |

The last two rows are like-for-like A/Bs on a shared, busy GPU; the rebuild measured at or below the old build in every beat but the storm ring (14.9 against 13.5, within the noise). Sampling the scan is cheaper than the procedural ground it replaced. CPU per frame fell from about 8 ms to under 1 ms in the ultimate, because bolts rebuild only on lightning ticks. The orb marches its 28 steps on a two-octave field and spends the full field only on the hit; marching the full field everywhere doubled the dash's GPU time. The demo caps the pixel ratio at 1.5. Only the first frame after load is slow.

Everything is pooled: 480 bolt trees in a 131,072-point ring (60,000 drawn), 1,600 smoke sprites, 1,800 sparks, 240 rocks, 64 glints, 40 rings, 8 funnels and 14 scorch marks.

## Lifecycle and accessibility

- `fx.update(realDt)` clamps a step to 0.1 s. Reset your frame clock on `visibilitychange`.
- Under `prefers-reduced-motion: reduce`, the demo holds a composed still (the charge at full pressure) and plays beats only on request, with safe flashes, no shake and no fisheye.
- The demo's interface is minimal: no panels, small text controls over a faint scrim. Switches are real buttons with `aria-pressed`, beats are on keys 1–5 (0 for the full cast), Space pauses, H hides the controls, and changes are announced in a live region. No text renders under 11 px.

## Verify

- [ ] Play the dash: the black shadow streams behind the orb along its path, and nothing dark hangs where there is no orb.
- [ ] With **Tweened** on, the arcs turn into wriggling wire. With **Additive** on, the black is gone and the dust greys the ground. With **Glow ball** on, the orb is an opaque bulb.
- [ ] The orb up close is a dark blue storm cloud with lit lobes and dark creases, a small white core, 10–15 single jagged arcs out to the inner wall, crawlers on the rim and a hairline blue edge. There is no grey band, no dark ring round it and no white knot.
- [ ] A strike drops as one trunk to a small white contact, arcs crawl away along the scan's visible cracks, the stone round it lights and the wet patches reflect the bolt as a streak. No dashed lines, no boxes, no ellipse.
- [ ] Watch the full cast: outside the orb there is one discharge at a time, each reaching out from its origin, flaring as it lands, holding, then fading. Nothing strobes. The orb's cloud churns in place without sliding, and the charge's orb eases down and grows instead of snapping.
- [ ] The black shadow's edges fray into fibres with flecks tearing off, and its inside shows faint folds.
- [ ] The barrage's hits hold for 0.1 s as a full-frame ink negative with speed lines, with no grey wash after. The ultimate's negative is followed by a white flash.
- [ ] Fire five inverting hits inside a second with **Full** flashes: the first three invert, and the fourth and fifth dim by 0.32 instead.
- [ ] Rocks come to rest with their lowest corner within 1 mm of y = 0, none sunk; in the storm ring they float low and stay clear of the camera.
- [ ] Reduced motion holds a still with safe flashes. Opened from disk, the page makes 0 network requests. The console is clean at 1440 × 900 and 390 × 844, and the portrait camera backs off so the orb keeps its frame.
