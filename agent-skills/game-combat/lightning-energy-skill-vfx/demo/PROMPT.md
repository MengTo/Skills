# Black Lightning: demo prompts

## Minimal prompt

Use $lightning-energy-skill-vfx to give this character's lightning punch its effects. Hang a see-through, ray-marched orb off the fist socket: swirling filaments where two noise fields cross zero, a small hot core and a thin broken rim. Its lens bends the air through a shared distortion buffer. Give the orb its own black shadow, a torn teardrop that streams behind it along its motion, plus ribbons and billows laid along its path. Throw white-blue lightning that re-rolls every 1/30 s with tapering trunks and forks of forks, rooted at the orb and striking the ground. On the hit, fire a few divergent bolts, refraction-only air fronts, a ground burst with dust, a spark fountain, chips that land and heat in the cracks, then a 0.1 s hold as a full-frame ink negative with speed lines, and a drop-and-rebound shake. Keep the bloom threshold high so the black stays black, and limit inverting flashes to three a second.

## Recreate the demo

Build **Black Lightning** as one self-contained HTML file that opens straight from disk. Use Three.js r170 from a local classic script, WebGL2 and GLSL `ShaderMaterial`s, and `assets/storm-energy.mjs` inlined by `demo/build.mjs`. Make no network requests.

The page shows a close-combat energy skill without a character model. The orb hangs off an implied fist over a cracked dark stone plain under a storm-grey sky, with fog matched to a (0.034, 0.039, 0.05) horizon.

- **Beats**, played in a loop or one at a time:
  - **Charge** (3.6 s): the orb grows from 0.1 to 0.5 m, motes are drawn in, dust circles beneath, bolts strike the ground, and the stone under it glows. A 0.05 s warning hold comes at 3.0 s.
  - **Dash** (2.6 s): a crouch, then three zigzag legs of 0.2 s each with the camera close behind the orb. The orb's black shadow lays out along the path, and bolts snap from the orb back along it. The dash ends in a skid of sparks.
  - **Barrage** (4.4 s): a straight punch held for 0.1 s as a full-frame ink negative with speed lines, then a reverse swing with a fan of 9 bolts, then a spinning elbow into a second heavy hit.
  - **Storm ring** (4.4 s): a leap and slam, then a six-band shadow vortex. Bolts run from the orb into the ring, and the ring squeezes on each gesture.
  - **Ultimate** (6.2 s): a time ramp to 0.4, shadow spiralling in, and the orb swelling to 0.85 m and turning unstable. The release is bursts at strength 2.2, a ring of shadow streams, a 0.15 s full-frame negative, a white flash, a radial shake and a 0.42 fisheye. Embers, slow smoke and residual arcs follow.
- **Camera:** a spring follows each beat's framing and freezes during holds. Portrait screens back it off by (1/aspect)^0.55.
- **Interface (minimal):** no panels.
  - Top left: a 14px title, "Black Lightning", over an 11px tracked line, "ENERGY SKILL VFX · THREE.JS".
  - Bottom left: four switches as small text rows, each an 11px uppercase label with two 12px options: **Lightning** (Re-rolled / Tweened), **Afterimage** (Smoke over / Additive), **Orb** (Air lens / Glow ball), **Flashes** (Full / Safe). Above them, an 11px note explains the chosen failure.
  - Bottom centre: a 13px play/pause icon, the beats as plain text with a 4px dot under the active one, and a 64px range with an 8px thumb.
  - A faint scrim fades up 150px from the bottom edge. The beat caption sits at the top right, and the hide hint (H) at the bottom right.
  - Below 1180px the options move above the dock. Below 760px the options and beats scroll sideways and the caption hides. Nothing renders under 11px.
- **Accessibility:** under reduced motion, hold a composed still of the charge, set safe flashes, turn off shake and fisheye, and play beats only on request. Every control is a real button or range with a visible #a9d6ff focus outline, and changes are announced in a live region.

## Remix prompt

Keep the mechanism and the budgets from $lightning-energy-skill-vfx:

- one effect clock with holds and time ramps, and one distortion buffer;
- a ray-marched orb with bounded swirl and filaments where two noise fields cross zero;
- a shadow that hangs off the orb as a torn teardrop with billows along its path;
- lightning re-rolled on ticks, with tapering trunks and forks of forks rooted at the orb;
- refraction-only air fronts and a high bloom threshold;
- impact frames as ink negatives with speed lines, limited to three a second.

Change everything else. Make it a frost-and-void skill on a moonlit glacier:

- pale cyan lightning with violet halos instead of white-blue;
- an orb of frozen filaments around a violet core;
- a deep indigo shadow with frost tatters;
- cold blue-white embers instead of orange sparks, and snow dust;
- ice chips that skate before they rest;
- heat that glows in the glacier's own crevasses.

The interface stays minimal: a caption at the bottom left and a single **Flashes** switch.
