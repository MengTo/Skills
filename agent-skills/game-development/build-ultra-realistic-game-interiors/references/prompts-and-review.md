# Prompts, corrections and proof

These reusable prompts condense the Nocturne Hotel build and its subsequent revisions. Choose the one that addresses the current brief. The hotel examples preserve the order of decisions, including later corrections to the controls, UI and camera distance.

| Pass | Prompt to adapt |
| --- | --- |
| Target and layout | “Recreate these room views as one walkable Three.js floor. Save an entry camera for each room. Match scale, framing and light direction. Walk through the connecting doors.” |
| Atmosphere and Retina | “Show a shaft under the hall light, dust at several depths and slow cloud motion beyond the window. Keep the door numbers readable through the haze. Compare at the same camera at 1× and 2×.” |
| Reflection | “The wall should be visible in the metal, blade and reflective parts of the suit. Turn in place in two rooms, then cross the threshold. Keep the weave matte.” |
| Equipment correction | “The wrist looks twisted and the hand hides the blade. Pull the default carry slightly back, turn the assembly and preserve forearm length. Polish the fingers, wrap and inscription. Show idle, preparation, contact and recovery from the same camera.” |
| Material response | “One hit should tell me what this surface is. Break the mirror from the impact point. Follow a torn carton half until it hits the floor. On metal, show the glowing edge cool down. Check that the marks stay attached when I move the object.” |
| Cast and motion | “Give the creature a slow approach from the far side of the room. Test line of sight, weight transfer and one interrupted attack. Let a hit on one leg change that stride. For the human guest, keep the face and hair together as she sets a glass down and reacts to a sound.” |
| Interface | “Show the normal HUD, map, inventory and settings over the game. Use transparent artwork, quiet borders and subtle blur. Remove ‘Move closer’ messages. Look around freely with the mouse, jump with Space and aim through the reticle.” |
| Encounter and walkthrough | “Walk hall → bathroom → suite → control room. Show Echo Scan on the minimap, switch from gun to katana in inventory and return to play. Frame characters from across the room. Let the alien land the fatal hit, hold on the death effect and retry.” |

## Steering that changed the implementation

Three short excerpts from the original iterations show how to interpret a correction precisely.

- **“retract it more. dont need ref image. just pull it a bit more.”** Move the existing held assembly a little closer to the player. Save the same-camera before and after. Leave the lighting, skinning and room composition alone.
- **“We have white squares.”** Scrub the first few frames at the muzzle, edge-on and against a dark wall. Check the transparent texture, the geometry carrying it and its position during recoil. A smoke layer further downrange cannot fix a visible quad at the source.
- **“don't get close to npc or aliens or zombies to avoid bad details”** Use a doorway-wide shot, a planted step, a sound from offscreen and a moving shadow. Keep close technical inspections in development. The requested walkthrough can demonstrate the full encounter from a distance.

## Run a 9/10 visual review

1. Save the fixed reference and the current in-engine frame. Record the room, camera transform, FOV, resolution, DPR, equipment, HUD and relevant animation time. Keep a room-only baseline if equipment would obscure the thing being graded.
2. Compare four categories. Award up to **3** for composition and scale, **3** for practical light, falloff and reflections, **3** for material response and contact, and **1** for small details at play distance. Attach a visible reason to lost points.
3. Pick the change with the greatest effect on the image. Render again with the same settings. Check a strafe and a doorway as well as the fixed frame. For an animated change, keep a real-time clip plus frames at preparation, contact and recovery.
4. Retain the strongest revision and its evidence. Report a visual judgment separately from functional results. The hotel room pass was judged **9.1/10**. The modeled first-person pass reached **9.02/10** against its own target. Remaining differences included the duvet folds and shelf-light falloff. These scores describe those comparisons.

A useful review note fits on one line:

> Service Hall · carton at the locked doorway view · the print stretches over the front edge · split the face UVs and keep the label with the panel · confirm intact, sliced and settled.

If Dream Loop is available and requested, use its target-and-capture workflow. The comparable frames, motion check and recorded defect also work as a manual loop. Preserve a user's request for a local pose adjustment without a new reference image.

## Verify a playable handoff

- **Movement.** Walk the route in both directions. Try manual movement after guided navigation and immediately after closing inventory. For four fully connected destinations, there are twelve ordered origin/destination pairs.
- **Perception and feedback.** Observe a hostile approach from the approved wide framing. Check the planted foot on a slow turn, a blocked sight line, the damage event and its sound. Trigger the scan with enemies at three distances. Confirm the nearest reveals first and the markers expire.
- **Menus and reset.** Equip through an actual inventory card. Check the live HUD, focus and movement on return. Take a fatal hit through the normal encounter, retry and check the spawn, health, equipment and room objects. Try the reduced-motion path.
- **Recording, when requested.** The hotel's short cut used 40 seconds at 3840 × 2160 and 60 fps, or 2,400 frames. Its longer tour spent about a minute in each room. Build a cue sheet from the requested duration. Frame the suite from its doorway and turn to the rack before the alien closes in. Use the real menus and sound, and distinguish a fixed-step export from measured real-time performance.
- **Tutorial, when requested.** Keep the original brief, steering, camera marks, baseline, rejected pass, chosen pass, timecodes and validation results together. The hotel used Codex Browser for playback, DreamCut for capture, and compressed viewing copies alongside the editing master on Fil. Verify frame dimensions, rate, duration, stereo audio and a full decode after compression. Share only the artifacts and destinations requested for that handoff.
