---
name: 3d-high-poly-models
description: Create or integrate highly detailed 3D models with smooth silhouettes, shaped surfaces, believable bevels, and close-up geometry, then prepare suitable runtime LODs and loading. Use when a user requests high polygon counts, ultra-realistic models, detailed architectural assets, or removal of visibly faceted geometry.
---

# 3D High-Poly Models

Build the requested close-up detail into the model, then make it practical to render. Judge realism through silhouette, proportions, material response, and lighting as well as polygon count.

## Establish what the camera needs

Inspect the reference, intended hero angle, closest approach, orbit range, model scale, current mesh, and target hardware. Record the current triangle count and draw calls rather than labeling an asset high-poly from appearance alone. Keep a high-detail source/master when building new geometry so runtime optimization remains reversible.

Separate detail into three scales:

- **Silhouette:** outer contours, root flares, carved edges, folded fabric, roof curvature. Use geometry.
- **Surface form:** bevels, dents, joints, raised seams, deep cracks. Use geometry or justified displacement when the view reveals parallax and shadow shape.
- **Microdetail:** grain, pores, shallow scratches, fiber structure. Use material maps unless the extreme close-up actually resolves geometry.

Use the project's modeling tools or asset pipeline. Match real dimensions and proportions first, then add adaptive subdivisions, support topology, sculpting, or appropriately licensed scans. A dense mesh with incorrect proportions remains incorrect.

## Model for believable close-ups

Give manufactured edges a plausible bevel so they catch highlights. Preserve designed hard edges while smoothing curved surfaces; do not smooth every normal or indiscriminately weld UV seams. Recompute or preserve normals/tangents according to the modeling/export pipeline.

Spend curve segments where projected curvature is visible. Increase them around hero rims, roof silhouettes, and tight bends; use fewer on tiny distant parts. Check subdivision boundaries for pinching and displacement for cracks or detached surfaces.

For procedural branches, sweep rings along a smooth curve, transport the local frame to avoid sudden twist, taper continuously, and bury child starts inside the parent surface. Add denser rings at a flared root or strong curvature. Seijaku's `treeMesh` is a useful example of adaptive radial/longitudinal detail rather than uniform subdivision.

For scanned stones, preserve the scan's characteristic proportions. Excessive nonuniform scaling stretches both shape and surface features. Reuse the mesh with limited variation in rotation, placement, and scale; keep the most recognizable hero forms distinct.

## Prepare runtime versions

1. Keep the authored master and export a validated runtime asset, usually glTF/GLB when the stack supports it. Check units, transforms, materials, UV seams, normals, and bounds in the actual viewer.
2. Create lower-detail versions for distant use, preserving silhouette and baked shading. Derive thresholds from projected size and compare transitions from the real camera. Use hysteresis or an appropriate transition to avoid rapid LOD switching. See [Three.js LOD](https://threejs.org/docs/pages/LOD.html).
3. Instance repeated geometry/material pairs such as roof tiles, stones, or foliage where suitable. Partition large repeated fields spatially so one visible object does not force the whole site to draw.
4. Keep shadow geometry and shadow distance proportional to visible benefit. A detailed object rendered in several shadow maps can cost far more than its beauty pass suggests.
5. Compress geometry transport where supported, then validate decoded geometry and appearance. Compression reduces transfer size; it does not inherently reduce runtime triangle count. Treat quantization and simplification as distinct operations with separate visual checks.

There is no universal correct triangle budget. Profile the representative scene with its actual materials, lights, shadows, transparency, and target resolution. Report unique asset triangles separately from the triangles drawn across instances and passes. Geometry compression, instancing, and LOD solve different costs.

## Avoid a startup stall

Load visible hero geometry first and defer optional interiors or distant detail. Generate procedural meshes offline or in bounded work, use workers where useful, and reuse buffers instead of regenerating identical parts. Keep a useful coarse representation until the detailed asset is ready. Prewarm shader variants with supported asynchronous compilation when it materially reduces first-use hitches.

For selection and collision, use suitable proxies or a spatial acceleration structure. Repeated full-resolution triangle scans during pointer movement can make a visually smooth scene feel unresponsive.

## Verify

- Compare the master and runtime mesh at the closest camera distance under neutral and final lighting.
- Inspect silhouette, bevel highlights, seams, contacts, shadow shape, and wireframe density.
- Walk across LOD thresholds and confirm there are no visible holes or distracting jumps.
- Measure startup, first interaction, full-frame draw calls/triangles, and frame time on desktop and mobile.
- Claim ultra-realistic appearance only when the rendered result supports it; record the measured geometry count separately.

Read [REFERENCES.md](REFERENCES.md) for source and APIs. Seijaku combines detailed swept trunks and scanned rock geometry with inexpensive instanced leaf cards. Do not interpret its appearance as evidence that every object needs a dense mesh.
