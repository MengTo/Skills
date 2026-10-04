# Black Lightning: demo prompts

## Minimal prompt

Use $lightning-energy-skill-vfx to give this character's lightning punch its effects. Hang a semi-transparent orb off the fist socket. Its streaks spin around the punch axis, and its lens bends the air behind it through a shared distortion buffer. Throw white-blue lightning that re-rolls every 1/30 s and forks, and stream black afterimage smoke off the chest, drawn premultiplied over the frame. On the hit, fire the punch funnel, a camera-facing three-layer air burst, a ground burst with dust, chips that land and heat in the cracks, and a 0.1 s hold that inverts a disc around the fist in two tones and then shakes down and back. Keep orange sparks short, refraction under 1.5% of the screen, and inverting flashes to three a second.

## Recreate the demo

Build **Black Lightning** as one self-contained HTML file that opens straight from disk. Use Three.js r170 from a local classic script, WebGL2 and GLSL `ShaderMaterial`s, and `assets/storm-energy.mjs` inlined by `demo/build.mjs`. Make no network requests. The page shows a close-combat energy skill without a character model. The effects hang off an implied body, shoulder and fist, standing on a cracked dark stone plain under a storm-grey sky, with fog matched to a (0.046, 0.052, 0.066) horizon.

- **Beats**, played in a loop or one at a time:
  - **Charge** (3.6 s): the orb grows 0.1 → 0.5 m, pressure rises, the fingers curl at 1.7 s, and a 0.05 s warning hold at 3.0 s.
  - **Dash** (2.6 s): a crouch, then three zigzag legs of 0.2 s each (low, diagonal up, dive), with black dash ribbons, lightning between path points, and a ring, billows and flakes at every turn. A skid lands with sparks.
  - **Barrage** (4.4 s): a straight punch with funnel, bursts and a 0.1 s centre negative. A reverse swing with a flat ring and a fan of 9 bolts. A spinning elbow into a heavy hit.
  - **Storm ring** (4.4 s): a leap and slam, then a six-band shadow vortex with lightning thrown across it, squeezing on each gesture.
  - **Ultimate** (6.4 s): a time ramp to 0.22, shadow spiralling in, and the orb swelling to 0.9 m and turning unstable. The release is a 10 m funnel and bursts at strength 2.2, a ring of shadow trails flung outward, a 0.15 s full-frame negative, a white flash, a radial shake and a 0.42 fisheye. Embers and residual arcs follow.
- **Camera:** each beat sets a framing that a spring follows, and the camera freezes during holds. Portrait screens back it off by (1/aspect)^0.55.
- **Interface:**
  - A 288px glass panel, top left. It holds an 11px tracked kicker "ENERGY SKILL VFX · THREE.JS · WEBGL2 · GLSL", a 27px title "Black Lightning", a short paragraph, and four pill switches: **Lightning** (Re-rolled / Tweened), **Afterimage** (Smoke over / Additive), **Orb** (Air lens / Glow ball), **Flashes** (Full / Safe). Under them, a note explains each failure.
  - A centred dock: play/pause, the beats with key hints 0–5, and a **Time** range from 0.1 to 1 with a readout.
  - A beat caption top right and a hide button (H).
  - Below 760px, the switches and beats scroll sideways and the caption hides. Nothing renders under 11px.
- **Accessibility:** under reduced motion, hold a composed still of the charge, set safe flashes, turn off shake and fisheye, and play beats only on request. Every control is a real button or range with a visible #a9d6ff focus ring, and changes are announced in a live region.

## Remix prompt

Keep the mechanism and the budgets from $lightning-energy-skill-vfx: one effect clock with holds and time ramps, one shared distortion buffer, lightning re-rolled on ticks rather than tweened, a two-shell refracting orb, afterimage smoke blended over the frame with noise owning its outline, three-layer camera-facing bursts, capped spark streaks, chips that rest on their lowest corner, heat in the world's own cracks, and impact frames limited to three a second. Change everything else. Make it a frost-and-void skill on a moonlit glacier: pale cyan lightning with violet halos instead of white-blue, a crystal-clear orb with streaks of ice, afterimage smoke in deep indigo, cold blue-white embers instead of orange sparks, snow dust, and ice chips that skate before they rest. The heat glows in the glacier's crevasses. The layout becomes a bottom-left caption card with a beat list and a single **Flashes** switch.
