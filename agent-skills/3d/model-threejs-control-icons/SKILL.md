---
name: model-threejs-control-icons
description: Model and light detailed Three.js icons for small interface controls. Use for miniature objects, physically based materials, and a reusable high-density icon atlas.
---

# Model Three.js control icons

Choose the icon’s real object and its reading angle at final display size. Preserve one useful gap or outline that identifies it: the clip on a pen, the open frame of an hourglass, or the yoke around a microphone.

## Model for the highlight

1. Shape turned parts from a lathe profile. Include a tiny radius at each shoulder so a light strip can travel across it. Use tubes for clips, yokes and handles. Put each instrument’s pieces in a common model group.
2. Spend geometry on visible silhouettes, joints and changes in material. Suggest fine knurling, mesh and brushed finish with filtered material maps when the projected spacing falls below a pixel. Check the silhouette in grayscale at 32–64 CSS pixels.
3. Separate the reflectance of metal, enamel, rubber and glass. A polished metal part needs a reflected light source with shape. Generate a PMREM environment with a wide cool strip and a narrower warm return. Add a broad key and controlled fill. Check brushed metal and dark rubber against both pale and dark controls.

## Deliver the icons

Use one orthographic camera and stable per-icon bounds so switching state does not change the apparent scale. A small set can share an offscreen horizontal atlas. For each cell, render into a padded viewport with transparent clear and depth, or arrange objects across an orthographic strip. Keep the largest silhouette inside its cell throughout any tilt. Match the atlas resolution to the largest displayed icon and expected device scale.

For glass composites, keep color linear through lighting and use a consistent alpha convention when filtering edges. Give mip levels enough gutter to avoid neighboring colors. Save and restore render target, viewport, scissor and clear state before returning the shared renderer. Rebuild the atlas when lighting, pose, geometry or display density changes. A stationary icon strip can reuse the previous frame.

The [instrument tray](demo/index.html) shows how a turned pen, a microphone and an hourglass respond to the same rig. Inspect grooves, edge highlights, transparent gaps and baseline alignment. Select each instrument by pointer and keyboard and check that its accessible label identifies the action.
