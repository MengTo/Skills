# Water and Crystal: demo prompts

## Minimal prompt

Use $water-crystal-skill-vfx to give this character's water skill its effects, dynamic but never in your face. Keep the water clear, never a teal fill: every water surface refracts the frame behind it, reflects the night with Fresnel, shows small bright sources as sharp highlights that are not scaled down by its 2% reflectance, and takes colour only from its path length. Make the orb a sphere-traced surface whose drop modes, capillary rings and drifting warp deform it in place, never a texture turning on a ball, with a crisp inverted horizon inside and a silver rim. Wind the gathering streams up out of the pools as uneven, beaded ropes with silver edges, drips and shed drops; let the lash whip, pour and break into drops, and throw a torn, lopsided splash crown of aerated white water whose spikes pinch off into drops. Ring the pools with analytic ripple packets and rain, and keep them flat mirrors between wet rock banks, with the moon as a long, broken column of small glints, not a stack of dashes. Trace the crystals against their own planes, with total internal reflection, a small dispersion fringe, fracture discs and a 1-pixel edge catch-light; give them a white-hot root glow at the waterline and a resonance band that climbs the stone, then shatter them into splinters that fall and rest on the rock with contact at every corner. Put caustics on the pool floor, not on dry rock. On the shatter, a short hold as an ink starburst and a gentle shake. Apply the vignette before the tone curve so highlights can clip, cap what one pixel gives the bloom, and limit inverting flashes to three a second.

## Recreate the demo

Build **Tide Glass** as one self-contained HTML file that opens straight from disk. Use Three.js r170 from a local classic script, WebGL2 and GLSL `ShaderMaterial`s, and `assets/tide-crystal.mjs` inlined by `demo/build.mjs`. Make no network requests.

The page shows a water and crystal skill without a character model. Water gathers over an implied open palm on a moonlit tidal flat: banks of near-black wet rock stand a few centimetres proud of flat tide pools that run in bands to the horizon. The moon sits low (7.5° up at an azimuth of −52°, to the right in every hero shot) as a crisp disc with faint maria and a tight halo; the sky runs from navy at the zenith to slate at the horizon, with a soft broken cloud deck and a moonlit haze toward the moon, and the far flats dissolve into a slate fog of (0.0082, 0.0112, 0.016). The rock is Poly Haven's CC0 "Low Tide Rocks" scan (1k colour, normal and ARM maps embedded as data URIs) at 1.55 m a tile, re-tinted near-black and faintly warm, on a heightfield of bands, lumps and 15 cm rubble domes that the CPU physics shares. Where the rock and pools lie round the skill comes from an embedded 200 × 180 layout map at 5 cm.

- **Beats**, played in a loop or one at a time:
  - **Gather** (4.6 s): six streams rise out of the pools round the palm, four winding up a breathing funnel and two crossing as a figure-eight, each one growing up its path, holding and letting go from the root. Drops lift off the pool along the swirl, rings spread from every stream's foot, and drips fall from the figure-eight. The orb grows from a bead to 0.28 m as the streams arrive, with a capillary ring and a wobble where each one joins.
  - **Current** (4.6 s): the orb draws back 9 cm and stretches a neck, then unspools as a lash that whips across to a pool about 2.7 m away and lands at 1.02 s: a torn crown, 160 drops of spray, three rings 0.16 s apart, foam lace, a flash and a short hold. It pours with a churning foot and caustics along its path, lets go at 2.75 s, beads up and breaks into drops. The orb drifts out over the field.
  - **Crystallize** (4.4 s): three clusters of quartz (7, 5 and 5 crystals) rise out of the pool floor where the water landed, at 0.3, 1.05 and 1.6 s, each crystal sheathed in a water film that drains in rivulets, ringing the surface and throwing spray where it breaks through, with rime round its foot. A chain of 13 small points follows back toward the palm from 2.2 s. Each cluster's light sits at the waterline and lays a warm caustic net on the pool floor.
  - **Resonance** (5.0 s): four pulses leave the orb as refraction fronts. Each crystal swells as the front reaches it (3.6 m/s) and a band of light climbs it from root to point; the swells add up and settle. At the end everything swells together and hairline cracks climb from the roots.
  - **Shatter and rain** (5.8 s): a 0.08 s ink starburst, a flash and two fronts, and every crystal breaks into Voronoi splinters that fall, tumble and come to rest on the rock. The orb rises over the field and bursts at 1.7 s into 220 drops, and a rain thickens, rings the pools and thins to the end. The clusters keep a little light.
- **Camera:** a spring follows each beat's framing and eases in over 1.4 s; each hero shot has a pitch tilt of a few pixels, eased across beats. Portrait screens back it off by (1/aspect)^0.55 and turn it toward the orb. Shake runs at 0.6 and fisheye at 0.65 of the module's numbers.
- **Interface (minimal):** no panels.
  - Top left: a 14px title, "Tide Glass", over an 11px tracked line, "WATER AND CRYSTAL SKILL VFX · THREE.JS".
  - Bottom left: three switches as small text rows, each an 11px uppercase label with two 12px options: **Water** (Living surface / Sliding texture), **Crystal** (Traced / Painted glass), **Flashes** (Full / Safe). Above them, an 11px note explains the chosen failure.
  - Bottom centre: a play/pause icon, the beats (Full cast, Gather, Current, Crystallize, Resonance, Shatter) as plain text with a dot under the active one, and a time-scale range (0.1–1).
  - A faint scrim fades up 150px from the bottom edge. The beat caption sits at the top right, and the hide button (H) at the bottom right.
  - Below 1180px the note hides and the options move above the dock. Below 760px the options and beats scroll sideways and the caption hides. Nothing renders under 11px.
- **Accessibility:** under reduced motion, hold a composed still of the crystals ringing with light, set safe flashes, turn off shake and fisheye, and play beats only on request. Every control is a real button or range with a visible #8ff0ff focus outline, beats are on keys 1–5 (0 for the full cast), Space pauses, and changes are announced in a live region.

## Remix prompt

Keep the mechanism and the budgets from $water-crystal-skill-vfx:

- one effect clock with holds and time ramps, and one distortion buffer for refraction fronts;
- water that is clear and colourless where thin, refracting a frame copy, with silver rims and sharp highlights that are not dimmed by Fresnel;
- surfaces that deform in place (modes, rings, a drifting warp), never a scrolled or spinning texture;
- solids traced against their own half-space planes, with total internal reflection, a clamped dispersion fringe and fractures;
- flat mirror water with analytic rings and a glitter column, and ground the CPU physics shares;
- the vignette before the tone curve, a capped bloom, and impact frames limited to three a second.

Change everything else. Make it a blood-moon geode skill in a flooded cave:

- dark, still cave water under a low red moon seen through the cave mouth, its glitter column copper;
- an orb of black water with a red rim light, streams that rise from cracks in the floor;
- amethyst crystals (violet absorption, a magenta root glow) that grow from the walls as well as the floor;
- a shatter that leaves the shards floating on the water for a beat before they sink;
- wet limestone with mineral streaks instead of tidal rock.

The interface stays minimal: a caption at the bottom left and a single **Flashes** switch.
