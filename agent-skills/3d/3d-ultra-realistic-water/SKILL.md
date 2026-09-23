---
name: 3d-ultra-realistic-water
description: Build an ultra-realistic open ocean in Three.js with a deep-water Gerstner spectrum shaded per pixel from analytic derivatives, each wave faded at its own pixel footprint, plus Fresnel sky-cube and planar reflections, subsurface light through the crests, HDR sun glitter, Jacobian lace foam, a Kelvin wake, hull foam, buoyancy queries and aerial perspective into the sky's horizon haze. Use for seas, oceans, sunset or daylight water, sun glitter paths, ship or boat scenes, wakes, coastal flyovers and any 3D scene with a moving camera and a water horizon. Includes the approved water from Pirate Ship Sunset as a reusable module and demo.
---

# 3D Ultra-Realistic Water

Use this for an open sea seen by a moving camera, with a horizon and a sun. Reach for something else in these cases:

- **Mirror-flat water seen from the waterline with no mesh:** a full-screen analytic water plane is cheaper.
- **Ripples that follow the cursor on a UI surface:** use `shaders-cursor-ripples`.
- **A small pool that reacts to touch:** use a ping-pong height field.

Source: extracted from **Pirate Ship Sunset**, a single-file Three.js r169 scene in which a three-masted ship sails a rolling sea at sunset under an auto-cycling camera. The water had to stay convincing from 2 m above the waves out to a 12 km horizon.

## The mechanism

**Shade the sea per pixel from the analytic derivatives of a deep-water Gerstner sum, and fade each wave out once its wavelength falls below the pixel footprint.** The per-pixel derivatives keep the glitter and foam sharp on a mesh whose triangles are 30 m wide at the horizon. The footprint fade stops the far sea from boiling into moiré.

## Reuse the working effect

Copy [assets/ocean.mjs](assets/ocean.mjs). You pass in the project's own `THREE`, and the module does not import a second copy. Before you integrate it, read [references/ocean.md](references/ocean.md), which covers the full constants, render order, buoyancy and post. [The demo](demo/index.html) runs this same module inside the original scene. `demo/build.mjs` rebuilds it from the reference page.

```js
import { createWaves, bakeOceanDetail, createOcean, createWake, createPlanarReflection } from './ocean.mjs';

const waves = createWaves({ direction: 1.22 });                 // wind heading, radians
const ocean = createOcean(THREE, {
  waves,
  detailTexture: bakeOceanDetail(THREE, renderer),              // baked once, 512²
  skyCube,                                                      // cube rendered from YOUR sky shader
  hazeGLSL: SKY_GLSL + 'vec3 oceanHaze(vec3 d){ return hazeColor(d); }',
  hazeUniforms: skyUniforms,                                    // may include uSunDir
  wake: createWake(THREE, renderer, { shipLength: 34 }),        // optional
  hull: { halfWidths, zMin: -18, zMax: 18, bowZ },              // optional, ship-local metres
});
scene.add(ocean.mesh);
const reflection = createPlanarReflection(THREE, renderer, { layer: 1 });
ocean.setReflection(reflection);

// every frame, in this order
waves.update(dt);                                  // CPU phases, before any height() query
ship.y = waves.height(ship.x, ship.z);             // buoyancy uses the same spectrum
ocean.update({ time, camera, ship: { x, z, fx, fz } });
wake.update(x, z, fx, fz, speed * dt);
reflection.render(scene, camera);                  // before the main pass
renderer.render(scene, camera);                    // into a HalfFloat target, then bloom + ACES
```

## The stack, with the numbers that shipped

| layer | what it does | constants |
| --- | --- | --- |
| Spectrum | 8 Gerstner waves, deep-water dispersion `ω = √(g·k)` | L 78 → 3.1 m (×0.63 per step), A 0.8 → 0.02 m, headings 0, +23, −17, +38, −31, +12, −49, +64° off the wind, Q 0.17 → 0.03 (Σ 0.77) |
| Grid | exponential rings centred under the camera | `r = 11.92·(e^(0.033·i) − 1)`, 210 rings × 400 segments = 84,001 verts, 167,600 tris, reaches ~12.2 km; spacing `0.033·(r + 12)` |
| Footprint fade | per wave, in both shaders | `fade = 1 − smoothstep(0.18·L, 0.5·L, footprint)`; vertex footprint `1.2 × ring spacing`, pixel footprint `2 × (fwidth(x) + fwidth(z))` |
| Normal | per pixel, `normalize(cross(dP/dz, dP/dx))` | Jacobian `J = dPdx.x·dPdz.z − dPdx.z·dPdz.x` drives crest foam |
| Micro detail | baked 512² tile: 48 sines with integer wave vectors, amplitude ∝ \|k\|^−1.35 | two octaves at 19 m and 7.3 m (the second rotated 90°), strength `0.4·e^(−d/500) + 0.08` |
| Reflection | Schlick with water F0 = 0.02; 256² sky cube re-rendered every 0.25 s; half-res planar pass for the ship and islands | planar UV nudged by `N.xz · (0.06, 0.03) · clamp(30/d, 0.2, 1)` |
| Body | deep colour plus sunlit subsurface through the wave crests | deep (0.006, 0.03, 0.048), scatter (0.035, 0.3, 0.27) linear; scatter × toward-sun² × crest height × (0.35 + 4·(1 − N.y)) |
| Glitter | HDR specular, left for the bloom to catch | `pow(R·L, 90)·1.2 + pow(R·L, 12)·0.06 + pow(R·L, 1400)·40`, sun colour (4.2, 2.3, 1.1); bloom threshold 1.6, knee 0.8 |
| Foam | thresholds a Worley lattice by a mask, so the foam stays lacy | crest `smoothstep(0.6, 0.28, J)`; `foam = smoothstep(1 − m, 1.2 − m, pattern·0.88 + m·0.22)`; gone by 1600 m |
| Wake | 512² half-float field over 380 m, trailing the ship | Kelvin arm offset `1.2 + 0.35·a` (atan 0.35 ≈ 19.3°), arm decay 115 m, stern wash 170 m, calm slick 260 m |
| Haze | fogs into the sky's own horizon colour | `fog = (1 − e^(−d·2.8e-4))^1.6` |

## Rules, each with the failure it prevents

All of these were A/B tested in the demo scene with the sim frozen, so only the one change differed between frames.

- **Fade every wave at its own footprint, in both the vertex and fragment shaders.** Without the fade, the 3–8 m waves are sampled below their wavelength. The far sea turns into dense grain right up to a hard horizon, and the sun's sheen on the far water disappears. Between consecutive frames, the flicker in the far band went from 2.3 to 5.8 grey levels on average, with the 95th percentile rising from 5 to 23. In motion, that reads as boiling.
- **Compute the normal in the fragment shader from the analytic derivatives.** If you shade from the interpolated vertex normal, detail disappears past the near field. The far sea turns into long smooth streaks that follow the mesh rings, and the glitter smears instead of breaking into sparkles.
- **Keep ΣQ below 1.** Steepness scales the sideways displacement. Past a sum of about 1, the Jacobian goes negative: the surface folds through itself, and the foam mask saturates into flat white slabs on the crests. `setSeaState()` lets amplitude keep rising but caps steepness at ΣQ = 0.95.
- **Clamp the reflection vector above the horizon: `R.y = abs(R.y) + 0.002`.** Some wave backs reflect downward. Without the clamp, those faces sample the flat lower half of the sky cube and read as pale grey smears with no glitter. At a grazing shot, 3–4% of the frame changed by as much as 154 levels.
- **Fog into the same haze function the sky draws.** One flat fog colour matches the sky only on the sun side. Everywhere else it leaves a hard line where the water meets the sky.
- **Scroll detail and foam textures with the floating-origin offset, using the same divisor as the sampling scale.** The reference sampled foam at `/9` and `/3.3` but offset it by `/11` and `/4.1`. At every 1200 m rebase, the foam pattern jumped by about 24 tiles. The module fixes this.
- **Wrap wave phases to [0, 2π) on the CPU in float64, including the floating-origin term.** If the shader receives raw time, `ω·t` passes 16,000 rad for the 3 m wave within an hour. That makes the float32 `sin()` argument the part that degrades first. This rule is precision reasoning and was not observed in the demo.
- **Query height with the same spectrum you render.** Gerstner waves move points sideways by up to 4.5 m here, so `height(x, z)` inverts the horizontal displacement with 4 fixed-point steps before it reads y. Reading `disp(x, z).y` directly was off by 0.15 m on average and by up to 1.17 m on steep crests, across 20,000 samples. After 4 steps, the worst horizontal miss is 0.18 m.

## Colour and pipeline

- Every uniform colour is linear HDR. Render the scene into a HalfFloat target, and tone-map once in the composite: ACES, then sRGB. The reference sets `renderer.toneMapping = NoToneMapping` and applies ACES itself, at exposure 0.9 and bloom 0.35.
- The sky cube is rendered from the page's own sky shader, with the tiny sun disc left out. The analytic specular term draws the sun's path on the water.
- The planar reflection renders only a layer holding the objects that stand in the water. It clips at y > −0.05, and it reuses the frame's shadow map (`shadowMap.autoUpdate = false`).

## Cost

The ocean mesh is 167,600 triangles. Its fragment shader runs the 8-wave loop once per pixel, plus 6 texture taps, 1 cube tap and 1 planar tap. The planar pass re-renders the reflection layer at half resolution. Under heavy machine load, headless Chrome ran the whole Pirate Ship Sunset scene in 10–13 ms per frame at 1440×900. Hiding the ocean or skipping the reflection pass each changed that by less than the run-to-run noise (about ±2 ms), so neither is the bottleneck. The reference's lever is adaptive resolution: DPR is capped at 1.6, and a resolution scale of 0.6–1.0 steps down when the 60-frame average passes 26 ms and back up below 14.5 ms.

## Lifecycle and accessibility

- Clamp `dt` to 1/20 s. The reference also rebases the world every 1200 m, shifting the ship, wake, particles, camera and `waves.offX/offZ` together.
- Under reduced motion, stop simulation time and keep rendering until the intro fade finishes, then hold the frame. Re-render only when a control changes. The demo's `__OD.hold()` implements this.
- Pause with the tab: `setAnimationLoop` stops when the page is hidden, and the `dt` clamp absorbs the gap when it resumes.

## Verify

- [ ] With the camera 2 m above the water facing the sun, the far sea resolves into haze and sheen, not grain. Toggling the footprint fade off makes the far band flicker between frames.
- [ ] Per-vertex normals visibly lose the far micro detail. If they don't, the normal is still being taken from the vertices.
- [ ] Raise the sea state to 1.6: the crests stay lacy, with no flat white slabs.
- [ ] At a grazing view, no pale grey smears appear on the wave backs.
- [ ] Anti-sun horizon: the water blends into the sky with no line.
- [ ] Floating objects ride the crests (`height()` inverted), and the wake arms open at about 19°.
- [ ] Reduced motion holds a composed still, controls still re-render, and the console is clean at 1440×900 and 390×844.
