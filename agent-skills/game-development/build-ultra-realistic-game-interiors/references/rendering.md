# Reading a room under moving light

## Set up a reference shot

Use one entry view and one oblique view per room. Mark the edges of the main opening, the practical light, the largest dark mass and the first object in the foreground. Block out at eye height and compare those four landmarks. A door that appears too narrow may be a camera error. Changing the lens to fix it will also move the sink, shelf and terminal in the frame.

Build the things that reveal thickness during a strafe: the return around a doorway, the lip of a metal panel, exposed pipe brackets and the joint under a counter. Spend geometry there first. Ground furniture with contact darkening under the feet and a short shadow in the direction opposite the fixture.

## Light, reflection and atmosphere

| Symptom in play | Change to try | Proof |
| --- | --- | --- |
| The hallway is uniformly orange | Fix exposure on the visible lamp, reduce its reach and preserve a darker interval before the next pool. Let a cool secondary source pick out one edge. | From the entrance, the player can count the pools and see the door number outside the brightest one. |
| Normal maps go flat in the shadows | Retain incident light direction alongside baked irradiance. Use it to relight fine normals while preserving the coarse shading. Keep dynamic fill gentle. | Yarn, dents and scratches change under a moving highlight. Large surfaces retain their original light falloff. |
| Steel reflects the wrong wall | Capture a local environment for each room. Box-project the lookup using the shaded point in world space and the room bounds. Give a near-camera model the same room probe and a correct world-space transform. | Turn the weapon at a threshold. The bright wall moves across the metal, worn suit plates and fittings. Cloth stays mostly diffuse. |
| The floor looks flooded | Mask puddles by seams and depressions, break their edges and increase roughness in the dry patches. Spend a planar reflection on the wet area or mirror where recognizable geometry matters. | A nearby lamp stretches across wet tile and breaks on grout. Its reflection lines up when viewed obliquely. |
| God rays wash out the whole frame | Give each shaft an emitting slit or fixture. Terminate scattering at scene depth. Add slowly varying density and dust at several depths. Keep exterior cloud motion outside the window. | Walk behind the beam and behind a solid jamb. Dust shows parallax and the wall occludes the shaft. |
| Animation makes the room flicker | Animate one unstable circuit with short, irregular dips. Keep neighboring fixtures and overall exposure steady. | A still player can identify which light is failing. |

## Material studies from the hotel

**Service cartons.** Give adjacent faces their own UVs and a believable paper grain scale. Model separate flaps, the narrow dark top seam and a slightly crushed shoulder. Wrap tape over the rim with its own roughness. Put a label across one panel and abrade exposed corners. On a sliced box, preserve the print and tape on the exterior and expose thin torn liner and corrugated flutes on the cut. Compare an intact carton at floor distance and both halves after settling.

**Velvet and bedding.** Build broad sag and folds into the silhouette first. Add tuft depressions, seams and a change in pile direction. Let the practical skim a fold so the normal map reveals small fibres. If the quilt reads as a rigid upholstered lid, adjust its edge and the weight of the larger folds.

**Washroom and equipment.** Put mineral rings around the tap and drain, damp streaks below fasteners, worn enamel along the basin lip and smudges near the mirror edge. Use satin wear on frequently handled metal and leave recesses dull. Keep clean patches between deposits.

## Detail at 2× and in motion

Treat “200%” as render density when that is the brief. Check drawing-buffer dimensions against CSS size and device pixel ratio. Keep high-frequency surfaces mipmapped, treat base colour as sRGB, and sample normal and roughness maps as data. Check a slow diagonal pan for shimmer. Inspect both illuminated and shadowed areas at full size.

Budget effects by how people see them. Batch fixed architecture, bake diffuse bounce, update room probes when needed, and run broad fog and bloom at lower resolution. Keep the main geometry and HTML text sharp. When caching a stationary view, let moving actors invalidate it and keep atmospheric particles animating. Measure live frame times separately from the frame rate of an exported demo.
