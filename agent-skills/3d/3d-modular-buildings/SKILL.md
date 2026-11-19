---
name: 3d-modular-buildings
description: Model human-scale buildings for a real-time 3D environment. Use for believable streets, waterfront districts, modular facades, entrances and rooftops that need to work from a distant approach and a walk-up camera.
---

# 3D modular buildings

Give each building a job and a route to its front door. A ferry terminal needs a weathered landing, a sheltered queue and a roof visible from the water. A freight hall needs truck clearance and a loading face. A relay station needs service access and a recognizable antenna. Those decisions give a district its identity before signage and neon. Compare the [approach, entrance and roof views](demo/index.html).

## Set the footprint and circulation first

Block out the footprint, entrance threshold, floor heights, roof envelope and neighboring street or water level in one coordinate system. Check the approach camera, eye-height walk-up and a rear or roof view. Place a human-scale reference by the opening. If the building is traversable, fit landings, stair runs, headroom and collision proxies before dressing the entrance. For a distant facade, model only the interior depth the camera can reveal.

Build the base, occupied floors and crown as separate masses. Assign one silhouette feature that describes the use, such as a trussed shed roof, stepped mechanical penthouse or framed signal mast. Give the roof a back, underside, drainage edge and connection to the walls wherever the camera can see them.

## Define a bay in its own coordinates

Use local X across a facade, Y up, and local +Z facing out. With this convention, the same function can generate front, side and rear elevations by changing the parent transform. Derive the bay span from the face width and the end margins.

```js
const count = Math.max(1, Math.round((faceWidth - 2 * endMargin) / targetBay));
const span = (faceWidth - 2 * endMargin) / count;
const centerX = i => -faceWidth / 2 + endMargin + (i + 0.5) * span;
```

Choose a sensible end margin before evaluating this formula on a narrow face. Build one convincing bay with a sill, recessed pane, mullions, reveal and spandrel. Repeat it around the structural grid, reserving whole bays for doors and service openings. End the facade cleanly at corners. Let exposed beams bear on columns and align drainage, equipment feet and awning brackets with real attachment points.

For a shop or control room the camera approaches, place a rear wall and one legible interior object behind the glass. At a distance, use opaque glazed bays or an emissive room atlas. Seed occupied windows by building, floor and bay so the same rooms stay lit when the camera returns.

## Spend geometry by viewing distance

Keep stairs, rooflines, openings, braces and projecting sills as geometry where their profiles or shadows read. Use material maps for fine grain, seams and surface wear. Establish one physical texture scale across adjoining modules. Put runoff under sills, wear at thresholds and dampness near the waterline. Preserve contrast between windows, surrounding frames and recessed interiors when testing the night lighting.

Instance repeating bays or merge static geometry by material **within a building or spatial cell**. Keep animated doors, clickable equipment and traversable collision independently addressable. For a later construction animation, carry a part ID or anchor through the merge. At skyline distances, retain the roof profile, projecting floor bands and the principal pattern of lit windows.

## Inspect the occupied building

At approach distance, identify the function from its silhouette with signage hidden. At eye height, follow the path over the landing and through the entrance. Check side and rear corners for coplanar faces, stretched textures, light leaks and stairs ending above the floor. Look down from the roof for unsupported equipment. Compare near and far levels from the switch distance and profile repeated blocks in the intended scene.

[Three.js instanced meshes and bounds](https://threejs.org/docs/pages/InstancedMesh.html).
