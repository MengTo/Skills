# Fire and Smoke: demo prompts

## Minimal prompt

Use $fire-smoke-skill-vfx to give this character's fire skill its effects, dynamic but never in your face. Draw every flame as a ray-marched volume whose turbulence rises with buoyancy, slow at the root and stretching as it climbs, never a scrolled texture: a white-hot core a little above the fuel, yellow and orange through to deep red tips, broad brighter licks inside, and detail that fades out before it gets finer than the flame buffer can hold, so nothing turns to a pixel mosaic. Break every wall of fire into clumps of separate tongues of very different heights with dark notches and gaps where only embers glow, with tips that detach as short licks and go out. Wind a fire whirl in helical sheets with a waist, an S-bend and a blue root. Draw charcoal smoke premultiplied over the frame and light it only from the fire: a thin streaked curtain rising straight off a front, cauliflower billows for a burst with a few ragged hot cracks in its creases, fibrous wisps off small fires. Let embers drift on a curl field and cool from orange to red to ash. Bend the air above the flames with heat haze. Share the firelight with the world, tight round each fire, and let a heat map make the ground's needles smoulder as thin red hairlines with ember specks where it is hot. On the hit, a short hold as an ink starburst with tapered speed lines and a gentle shake. Keep the bloom threshold high, the night slate rather than brown, no film grain, and limit inverting flashes to three a second.

## Recreate the demo

Build **Fire and Smoke** as one self-contained HTML file that opens straight from disk. Use Three.js r170 from a local classic script, WebGL2 and GLSL `ShaderMaterial`s, and `assets/fire-fx.mjs` inlined by `demo/build.mjs`. Make no network requests.

The page shows a fire skill without a character model. A flame is held by an implied hand at chest height over a plain of burned forest floor under a slate night sky, with a neutral horizon of (0.017, 0.0158, 0.016) and fog matched to it. The ground is Poly Haven's CC0 "Burned Ground 01" scan (1k colour, normal and AO/roughness maps embedded as data URIs) at 1.6 m a tile, re-tinted to neutral charcoal at albedo 0.03 with ash flecks and a pebble height field; its needles smoulder as hairlines and its pockets hold ember specks where the heat map says it is hot.

- **Beats**, played in a loop or one at a time:
  - **Ignition** (4.4 s): a glint and a small flash at the hand at 0.3 s, four tiny sparks, then a held flame growing from a bead to an 11 cm teardrop over 1.6 s, breathing slowly, letting embers curl off it from 1.6 s and wisps from 1.8 s. The camera circles close.
  - **Fire wave** (4.6 s): the flame is thrown down at 0.6 s with a flash and a ground ring, and a fan of fire (±0.6 rad) rolls out from 0.7 to 6.7 m over 2.6 s, swelling to 2.35 m and sinking. It is clumps of tongues with gaps, smoking as a curtain once it is 1.6 m out, and it leaves burning patches behind it (glowing fuel, low licks, clumps, a few tall leaning flames) that keep burning after the front has passed. The camera tracks out behind it.
  - **Pillar** (5.4 s): the ground heats, then a fire tornado rises at 0.55 s to 4.7 m over 1.1 s, wound in helical sheets with a waist, an S-bend and a blue root, inside a broken ring of low inward-leaning flame. Embers are drawn in along the ground before it rises and spiral up round it after. Its smoke leaves the top; low dust banks either side catch its light, and a pool of light lies round its foot. The camera looks up as it grows.
  - **Impact** (4.8 s): a fireball is drawn up out of the pillar, falls and hits at 0.85 s. A flash, a burst that cools into dark billows with ragged hot cracks, a lobed broken ring of fire spreading from 0.6 to 4.4 m over 1.6 s, two refraction rings, sparks outward and up, and 0.06 s later a 0.08 s ink starburst with speed lines and a gentle drop-and-rebound shake. A broad near-black column of smoke rises on the back of the ring.
  - **Aftermath** (5.2 s): a cut to a low view of the burned ground. Heat cools over 10–16 s, six low flames die one after another, three faint glows light the haze, embers drift off the ground and cool to ash, and wisps rise off the hottest patches.
- **Camera:** a spring follows each beat's framing and freezes during holds. Portrait screens back it off by (1/aspect)^0.6. Shake runs at 0.6 and fisheye at 0.65 of the module's numbers.
- **Interface (minimal):** no panels.
  - Top left: a 14px title, "Fire and Smoke", over an 11px tracked line, "FIRE SKILL VFX · THREE.JS".
  - Bottom left: three switches as small text rows, each an 11px uppercase label with two 12px options: **Flame** (Rising / Scrolled), **Smoke** (Over / Additive), **Flashes** (Full / Safe). Above them, an 11px note explains the chosen failure.
  - Bottom centre: a play/pause icon, the beats (Full cast, Ignition, Fire wave, Pillar, Impact, Aftermath) as plain text with a dot under the active one, and a time-scale range (0.1–1).
  - A faint scrim fades up 150px from the bottom edge. The beat caption sits at the top right, and the hide hint (H) at the bottom right.
  - Below 1180px the note hides and the options move above the dock. Below 760px the options and beats scroll sideways and the caption hides. Nothing renders under 11px.
- **Accessibility:** under reduced motion, hold a composed still of the fire tornado, set safe flashes, turn off shake and fisheye, and play beats only on request. Every control is a real button or range with a visible #ffb070 focus outline, and changes are announced in a live region.

## Remix prompt

Keep the mechanism and the budgets from $fire-smoke-skill-vfx:

- one effect clock with holds and time ramps, and one distortion buffer for heat haze and pressure fronts;
- flames as ray-marched fields with buoyant, never scrolled, turbulence, a temperature ramp, and detail band-limited to the flame buffer;
- walls broken into clumps of unequal tongues with gaps and detached licks;
- smoke drawn premultiplied over the frame and lit only by the fire, with a separate type per source;
- firelight shared with the world and a heat map the ground's own cracks glow from;
- a high bloom threshold, impact frames as ink starbursts, limited to three a second.

Change everything else. Make it a cursed green fire on a moonlit graveyard:

- a ramp from a pale green-white core through jade to deep teal tips, with a violet root instead of blue;
- smoke that stays near black but is lit sickly green from below;
- embers that cool to grey bone-ash instead of red;
- wet slate and moss instead of burned forest floor, its cracks glowing green where it is hot;
- a ring of fire that rises from the graves' outlines instead of a circle.

The interface stays minimal: a caption at the bottom left and a single **Flashes** switch.
