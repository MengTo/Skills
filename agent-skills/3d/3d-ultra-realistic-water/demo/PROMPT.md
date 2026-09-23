# 3D Ultra-Realistic Water: demo prompts

## Minimal prompt

Use $3d-ultra-realistic-water to add an open ocean to this Three.js scene. Use the 8-wave deep-water Gerstner spectrum, and shade it per pixel from the analytic derivatives, fading each wave at its own pixel footprint. Reflect a sky cube rendered from our own sky shader with water Fresnel (F0 = 0.02), clamped above the horizon. Add subsurface light through the crests, HDR sun glitter for the bloom, and lace foam from the Jacobian. Fog into the sky's own horizon haze.

## Recreate the demo

Build **Ultra-Realistic Water** as one self-contained HTML file that opens straight from disk: Three.js r169 inlined, WebGL2 and GLSL `ShaderMaterial`s, and no network requests. A three-masted ship with red-and-gold topsides, patched canvas sails, lanterns and a skull flag sails a rolling sea at sunset, while an auto-cycling camera moves through 7 shots.

- **Water:** `assets/ocean.mjs`: 8 Gerstner waves (L 78 → 3.1 m, ΣQ 0.77) on 210 exponential rings × 400 segments, centred under the camera. Per-pixel normals and a per-wave footprint fade, `1 − smoothstep(0.18L, 0.5L, footprint)`. A baked 512² detail tile (48 integer-vector sines plus a Worley foam lattice). A 256² sky cube with Schlick Fresnel and `R.y = |R.y| + 0.002`, and a half-resolution planar reflection of the ship and islands. Deep colour (0.006, 0.03, 0.048), subsurface (0.035, 0.3, 0.27), glitter `pow 90 / 12 / 1400 × 40` in sun colour (3.6, 1.9, 0.95). Hull foam and a bow hump, a 380 m Kelvin wake field, and fog `(1 − e^(−d·2.8e-4))^1.6` into the sky's haze.
- **Scene:** a sunset sky with a gradient from horizon peach (#ffc27a × 2.6) through low salmon (#ff8a55) and violet (#4e5a9a) to zenith navy (#1a2a5e), plus fbm clouds lit gold toward the sun, sparse stars away from it, and the sun at 5.7° elevation. Distant silhouetted islands, gulls and bow spray. The ship heaves, pitches and rolls on 9 hull samples of `waves.height()`.
- **Post:** a HalfFloat 4× MSAA scene target, 6-mip bloom (threshold 1.6), sun shafts, ACES at exposure 0.9, a warm/cool grade, a vignette and fine grain.
- **Interface:** a top-left kicker in 11px mono sun-amber (#ffb27a): "Three.js · WebGL2 · GLSL". Then an Iowan Old Style 44px title, "Ultra-Realistic Water", and a 14px cream paragraph stating the mechanism and both failures. A radial dark scrim sits behind it. A bottom-left 336px panel (rgba(16,12,24,.64), 1px hairline outline, 14px radius) holds a live status line that turns amber when a failure mode is on. It has a "Footprint fade" switch, a "Normals: Per pixel / Per vertex" segmented control, a "Sea state" range from 0.4 to 1.6 that caps steepness at ΣQ 0.95, and "Next shot" with a 1 / 7 counter. Drag orbits and the wheel zooms. At 1180px wide or 760px tall and below, the layout compacts; at 640px and below it stacks to the phone layout.
- Reduced motion freezes the simulation after the fade-in and re-renders only on control changes. Every control is a real form element with visible sun-amber focus.

## Remix prompt

Keep the mechanism and the budgets from $3d-ultra-realistic-water: per-pixel Gerstner derivatives, the per-wave footprint fade, ΣQ < 1, the horizon-clamped Fresnel reflection of your own sky, the Jacobian lace foam, and fog into the sky's haze. Change everything else. Put the camera on a low, fast drone skimming a cold North Atlantic swell under a high, overcast noon sky with a pale silver sun. Lengthen the spectrum to a 140 m primary swell with a cross-sea at 70° to the wind. Turn the body colour slate-green and dim the subsurface. Swap the ship for a lighthouse rock with surf foam around its base. The layout becomes a bottom-right caption card with a single "Footprint fade" switch.
