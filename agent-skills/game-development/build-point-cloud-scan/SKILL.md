---
name: build-point-cloud-scan
description: Build animated 3D scans from actual mesh topology in Three.js or WebGL. Use for a city survey pulse, a staged construction reveal, or a character swap where dots and wireframe travel across the surface before it resolves.
---

# Build a point-cloud scan

Choose the space the scanner belongs to. A district pulse stays where the player triggered it, even as the camera moves. A character scan stays attached to the turning body. Use a single signed distance to drive the dots, edges and solid surface. The sign tells every pass which side has been scanned.

[Watch the scan demo](assets/demo.mp4) or [inspect its midpoint](assets/demo.jpg). It shows the packaged cage builder on a turning character, followed by the original game’s construction survey.

## Character handoff

1. Put both characters into the same stage coordinate system, with soles at zero and crowns at one. Transform individual parts into that common rest space before measuring height. Apply the same skinning or idle deformation when drawing their overlays so a turning sleeve and its dots agree.
2. Build one coarse cage per part or separate island. [scan-cage.mjs](assets/scan-cage.mjs) clusters packed XYZ vertices into cells, averages their positions and connects cells only along source triangle edges. Supply an index buffer or unpacked triangles. Draw the representative positions as points and the returned index pairs as lines. Start around 48 cells per character height and refine fingers and facial features if needed. Cache per asset. For a quantized source, cluster in the original integer units and then convert the returned positions to stage coordinates. A 450-unit cell in this game’s signed 16-bit vertex buffer reproduces the original point and edge counts across all four characters.
3. Use a bottom-to-top front over roughly 1.2 seconds. Ease the front from below the boots to above the hair. With normalized stage coordinates, a useful field is `p.y + 0.05*p.x + 0.01*sin(18.0*p.z)`. Let `d = front - field`. Show the incoming opaque material where `d > gap` and the outgoing material where `d < -gap`. Start with a gap of 0.02 body heights. Render each mesh using its own coordinates.
4. In the gap draw the actual cage. A starting alpha is `1.0 - smoothstep(0.01, 0.07, abs(d))`. Carry the dots slightly ahead of the edges, offsetting them a little along their normals if available. Feather the point sprites with `gl_PointCoord`. Write opaque surfaces to depth first, then depth-test overlays with depth writes off and a small bias for coplanar edges. Cull or attenuate back-facing samples. Restore the renderer state afterwards.
5. Keep the current body visible until the next mesh and its maps are drawable. Use a selection token to discard stale loads. Settle a rapid second selection to one complete body before starting the next handoff. Release transient GPU resources on completion or exit. Under reduced motion, commit the ready mesh directly.

See the [character handoff frame](assets/character-scan.jpg) for the density of dots and edges relative to the face.

## District survey and construction

Latch the player's world position at trigger time. Use `behind = radius - distance(worldPosition, origin)`; use XZ distance for a cylindrical street survey when rooftops should light at the same time as the pavement. Use the same distance in building edges, road markings and construction materials. A useful starting envelope is `smoothstep(-lead, 0.0, behind) * (1.0 - smoothstep(0.0, trail, behind))`, with a short lead and a longer trail. Verify that turning or moving the camera leaves the ring fixed in the scene.

Cache coarse architectural edges per geometry and gather nearby instances once per pulse. Carry each instance transform into world space. Long, unsegmented faces benefit from a procedural grid evaluated per fragment in local surface coordinates. Keep the occupied city solid and add the survey light over its existing material. At a construction site, show the planned cage first, then bring in physical parts in build order, such as supports, deck and fixtures. Give each part a stored final transform so triggering twice yields the same final structure. Keep driving collision and route availability in sync with the intended game state.

The driving game's district scan swept about 215 world units over 6.4 seconds. Its construction parts started at staggered times and settled into place while the temporary cage faded. Scale distance and duration to the new scene. See the [district survey frame](assets/district-scan.jpg).

## Check the result

Pause at the beginning, middle and end. Orbit behind the object and look for a fully resolved final mesh, a band that wraps around its silhouette and restrained density around the eyes. In the city, drive through the pulse and retrigger after completion. Check resource counts over repeated triggers, the reduced-motion path and the smallest supported viewport. A paused before/peak/after sequence should make the scan direction apparent.
