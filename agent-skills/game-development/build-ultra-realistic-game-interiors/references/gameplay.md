# Realism the player can test

Use the rows relevant to the scene. For an environment-only brief, a single physical prop or animated practical can be enough.

## First-person equipment and surfaces

- **Hand and arm.** Put the held item, palm, individual fingers, cuff and forearm in 3D. Give the grip a socket. Retract and turn the held assembly as a unit until the wrist flows into the sleeve and the blade is visible. Compare screen landmarks for tip, guard, knuckles and cuff in the idle view, then inspect from the side. Keep bone lengths fixed. A measured change to carry depth and roll often solves more than rebuilding the mesh.
- **Katana.** Separate the polished bevel, darker spine, braided wrap, guard and hilt inscription. Check both diagonal swing directions in slow motion. Sample heel, middle and tip from the same animated pose that the player sees, sweep between frames, and stop or rebound at a solid surface. On a wall, align the groove to the contact path. Let the bright edge cool to a persistent scar.
- **Pistol.** Mouse movement drives the camera freely, with a centre reticle for aim. Mount the discharge on the actual muzzle and keep the view, muzzle and struck surface coherent at short range. For a white-square flash, frame-step against a dark wall and inspect sprite edges and alpha. A short irregular emissive volume, brief nearby light and a slower smoke wisp read well from the side.
- **Damage.** Glass radiates cracks from contact, sheds pieces and loses the corresponding reflected area. Paper buckles, punctures or shears and comes to rest under gravity. Separate metal scorch, chipped paint and plaster dust. Have embers cool before the mark fades. Anchor marks on movable pieces in local coordinates. In a fictional creature encounter, layer a directional spray, heavier droplets and surface deposits. Test the sequence under gravity and at normal speed.

## Characters at gameplay distance

For a generated character, establish the silhouette, clothing layers and neutral pose before meshing and rigging. Inspect the textured asset under the room's light. For the hotel infected, bare heads, torn fabric layers and unevenly soaked, dirty clothing gave a stronger silhouette in the hallway. Choose the high-detail mesh by projected character height with hysteresis to prevent rapid switching. The hotel switched up above 108 rendered pixels and down below 84. Recalibrate for a different silhouette or lens.

Plant one foot during weight transfer, let the pelvis travel over it and release it when the next foot takes the load. Match stride length to distance travelled, especially on slow turns. For injured movement, change the affected leg's support time and stride. Differentiate weaker arm attacks and critical head hits through pose and the actual damage state.

A stalker can start across the room, acquire the player through an unobstructed sight line, then commit to a short wind-up and recover. Test a miss, an interruption and a real hit. In the Broadcast Den, the animated alien casts a moving silhouette across the louvers. A stereo scrape originates at the claw during wind-up. An edge tint indicates the incoming direction on contact, including when the HUD is hidden. The player can understand the attack while the camera stays on the room.

For a humanoid face that splits around the mouth or hairline, compare skin weights across coincident vertices on UV seams. Keep the face and hair rigid to the head where appropriate. In the suite, the guest lowers a glass with a two-bone arm reach, releases it at the counter height and turns her shoulders toward a relay sound. Watching the glass stay on the counter after the hand leaves is a more useful check than an idle portrait.

## Sound and translucent UI

Layer a short onset, a material-specific body and a quieter debris tail. The hotel combined Seerveil sounds with Earshot-generated layers. Use the project's available recordings or synthesis when applying the method elsewhere. Prepare the audio before the first action, pan from the actual world position and vary reflections between tile and upholstery. Audition the first shot and the first impact in a fresh session.

Design the HUD, map, inventory and settings over a bright **and** a dark gameplay frame. Keep the centre open. Put progressive blur near the panel edges and tint a thin border from the local practical. The hotel used a light display face, Space Grotesk for controls and Geist Mono for numbers. Use the project's licensed faces and an offline fallback.

The original concept pass used Seedream 5.0 Pro. The later production pass called for Seedream 5.5 transparent PNG icons and weapon renders. Check alpha edges on light and dark backgrounds and legibility at the final icon size. Bind health, ammo, inventory, enemy health and map markers to the live game state. Echo Scan reveals a hostile when the sweep reaches its position. Equipping moves the marker from card to card and into the HUD while control returns immediately.

For defeat, use the actual fatal hit. Hold the last world frame under a short radiance shader and, when called for, animate anisotropic 3D Gaussian splats around the corona. Keep the title, cause and Retry in accessible HTML. Verify reduced motion and retry from the normal input path, including restored health and reset encounter state.
