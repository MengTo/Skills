# Ice and Frost: demo prompts

## Minimal prompt

Use $ice-frost-skill-vfx to give this character's ice skill its effects, dynamic but never in your face. Grow the frost the way real frost grows, not as a texture: a dendritic tree from one seed point, stems racing outward with barbs and sub-barbs that compete for space, side branches leaning toward their tips, revealed on the ground by the time the front reached each point, so it grows from the seed with a bright tip and settles into hairline feathers with rime, crystal glints and a contact shadow. Raise faceted ice spikes along the frost line, built from planes and ray-traced against those same planes: light bends in, reflects inside, turns blue with depth and catches on bubbles and a fracture network, with crisp moonlit edges and a little rime. Let them crack along visible planes in slow motion, then shatter along exactly those planes into pieces that tumble, land on a face and rest; leave lumps of snow and translucent chips settled into the crust. Lay low freezing mist as wind-stretched banks that churn in place and part round the ice, never flat cards. For a blizzard, a column of fine powder on a few helical strands with a translucent fibrous veil, ramping in and out, never scribbled streaks. Light the snow from a raking moon with self-shadowed dunes and broken crust, with dense fine sparkle and a few strong glints on the lit crests. On the hit, a short hold as an ink starburst and a gentle shake. Keep the glow white-blue rather than cyan, the bloom threshold high, and inverting flashes within three a second.

## Recreate the demo

Build **Ice & Frost** as one self-contained HTML file that opens straight from disk. Use Three.js r170 from a local classic script, WebGL2 and GLSL `ShaderMaterial`s, and `assets/frost-energy.mjs` with `assets/frost-growth.mjs` inlined by `demo/build.mjs`. Make no network requests.

The page shows an ice skill without a character model. Frost blooms in an implied hand at chest height over a snowfield at night, under a navy sky with round faint stars and a soft forest edge on the horizon. The ground is Poly Haven's CC0 "Snow 02" scan (1k colour, normal and AO/roughness maps embedded as data URIs) at 2 m a tile, sampled again at 0.55 m for grain, re-tinted cold blue-white and shaded with wind dunes, broken crust near the ice, a low moon from behind with self-shadow, and two populations of glints.

- **Beats**, played in a loop or one at a time:
  - **Chill** (3.6 s): a frost flower of hairline dendrites grows in the palm and turns slowly while cold vapour pours off it and sinks; at 2.45 s it clenches and glints, then drops to the snow, which flashes softly where it lands and the frost starts there. The camera holds the hand, then backs off to hold the landing.
  - **Frost creep** (4.4 s): the frost races out across the snow, fully grown by 2.4 s: stems ahead, barbs opening behind, the tips blazing and the fresh frost glowing and settling; two lights ride the front; mist banks lie where the cold pools, one lit by the top arm's tip. The camera lifts behind and to the side.
  - **Ice spikes** (4.0 s): spikes erupt along the frost's main stem in a wave at about 5 m/s, taller the further out, each with satellite shards, lumps and chips of snow, a refraction ring and a flash; the tallest gets a 0.06 s starburst. Mist hugs the bases and a plume trails downwind.
  - **Blizzard** (5.0 s): a snow devil rises over the spike row: fine powder on five helical strands, a translucent fibrous veil, chipped flakes, a few hairline streamers and straight streaks, spray at both ends of the row and mist round its foot, ramping in over 1.2 s and out over 1.6 s; the sky dims a little under it. The camera orbits slowly, holding the whole column.
  - **Shatter** (5.6 s): cracks run through every spike, near to far, in slow motion; at 1.42 s they burst along those planes with a 0.1 s full ink frame; the pieces land on their faces and rest beside the stumps, and diamond dust settles, glinting, while the camera pushes in.
- **Camera:** a spring follows each beat's framing and freezes during holds. Portrait screens back it off by (1/aspect)^0.55. Shake runs at 0.6 and fisheye at 0.65 of the module's numbers.
- **Interface (minimal):** no panels.
  - Top left: a 14px title, "Ice & Frost", over an 11px tracked line, "FROST SKILL VFX · THREE.JS".
  - Bottom left: two switches as small text rows, each an 11px uppercase label with two 12px options: **Ice** (Traced / Shaded) and **Flashes** (Full / Safe). Above them, an 11px note explains the chosen failure.
  - Bottom centre: a play/pause icon, the beats (Full cast, Chill, Frost creep, Ice spikes, Blizzard, Shatter) as plain text with a dot under the active one, and a time-scale range (0.1–1).
  - A faint scrim fades up 150px from the bottom edge. The beat caption sits at the top right, and the hide hint (H) at the bottom right.
  - Below 1180px the note hides and the options move above the dock. Below 760px the options and beats scroll sideways and the caption hides. Nothing renders under 11px.
- **Accessibility:** under reduced motion, hold a composed still of the spikes standing in the frost and the mist, set safe flashes, turn off shake and fisheye, and play beats only on request. Every control is a real button or range with a visible #9fe6ff focus outline, and changes are announced in a live region.

## Remix prompt

Keep the mechanism and the budgets from $ice-frost-skill-vfx:

- one effect clock with holds and time ramps, and one distortion buffer for pressure fronts;
- frost grown once as a competing tree and revealed by its arrival time, never a scrolled or tiled texture;
- crystals as convex hulls traced against their own planes, cracked and shattered along those planes into pieces that land on a face;
- mist as banks marched over their own spans that churn in place, calibrated in a mist-only view;
- glints scored as fine energy and strong count separately;
- a high bloom threshold, FXAA only on the traced crystals, impact frames limited to three a second.

Change everything else. Make it a cave of amethyst:

- violet crystal clusters growing from the walls of a cave instead of ice spikes from snow, with a pale lilac core and smoky inclusions;
- a mineral frost of fine white needles spreading over wet black rock instead of fern frost;
- a slow cold vapour pouring down from a crack in the roof instead of a blizzard;
- a lantern's warm light as the key instead of the moon, its glints gold among the violet;
- the shatter as a single cluster splitting along its cleavage planes.

The interface stays minimal: a caption at the bottom left and a single **Flashes** switch.
