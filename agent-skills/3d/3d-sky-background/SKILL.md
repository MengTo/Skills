---
name: 3d-sky-background
description: Create a camera-correct sky background for a 3D scene with a procedural atmosphere or panorama, horizon haze, aligned sunlight, and coherent environment lighting. Use for architectural skies, outdoor 3D backgrounds, golden hour, and day-to-night sky transitions.
---

# 3D Sky Background

Build a sky that surrounds the world, with a readable horizon and lighting that belongs to the same atmosphere.

## Choose the representation

Inspect the project's renderer, camera range, color pipeline, environment lighting, and existing assets. Use an existing licensed panorama when its cloud composition matters, a procedural sky when changing sun position matters, or a restrained hybrid. Keep the project's rendering backend and version; do not add a second renderer for the sky.

Keep three responsibilities explicit: the visible sky background, the reflection/ambient environment, and direct sun lighting. A background photograph alone does not light PBR objects. A PMREM environment does not supply a shadow-casting directional sun. See the [PMREM documentation](https://threejs.org/docs/pages/PMREMGenerator.html).

## Build a stable surrounding sky

- Use the engine's background facility, a fullscreen direction shader, or an inward-facing dome with depth writes disabled and fog disabled. A dome must fit inside the camera's clipping range and follow camera translation; it should retain world orientation as the camera rotates.
- Derive color from the normalized viewing direction. Blend a pale warm horizon through a muted middle band into a cooler zenith. Keep the lower hemisphere compatible with the ground haze rather than leaving an exposed hard edge.
- Use a shared sun direction for the visible disk, glow, directional light, and any sky-ray pass. A broad halo and a small disk are separate terms; avoid a large white blob.
- Add distant silhouettes only when the composition needs depth. Keep them low contrast, with a hue and value close to the horizon.

## Map a panorama deliberately

A true equirectangular sky wraps a full 360° horizontally and 180° vertically. Establish a consistent world-axis convention, rotate the texture so its photographed sun matches the scene sun, and inspect both the seam and zenith.

A wide landscape photograph is a partial panorama. Record its angular coverage and horizon position; do not stretch it indiscriminately over a sphere. Seijaku aligns a partial sky image around the sun and mirrors its back coverage. That is a composition-specific shortcut; repeated cloud shapes may be visible during a full orbit. Prefer a complete panorama for unrestricted cameras.

When a custom shader wraps longitude, a discontinuity at the seam can cause bad texture derivatives and a blurred stripe. Prefer continuous sampling coordinates with texture wrapping; otherwise supply corrected gradients appropriate to the shader version. Test the seam while orbiting, not only in the initial view.

## Keep color and lighting coherent

Annotate display-referred color images as sRGB and keep lighting calculations in linear space. Apply tone mapping and output conversion once at the intended final stage. Do not copy a fitted inverse tone-map function from another project: Seijaku's fit is coupled to its custom final shader and exposure. Decide explicitly whether a photograph should be tone-mapped with the scene or composited through a separate display-referred path.

Provide a procedural gradient immediately, then load the sky asset asynchronously and blend it in. An asset error should leave a usable sky. Fit texture resolution to the visible angular coverage and target display; do not gate first interaction on an oversized sky image.

Generate a prefiltered environment when needed and reuse it. During a day/night or season transition, interpolate cached environments where supported or refresh at meaningful state changes. Rebuilding PMREM every frame can dominate the scene cost. Dispose superseded environment render targets without disposing textures still in use.

## Day, dusk, and night

Use continuous weights for horizon/zenith colors, sun glow, fog tint, exposure, moon, and stars. Fade stars after the sky darkens. Preserve enough ambient illumination to read materials at night. Animate cloud movement slowly, pause when hidden, and retain a designed still sky for reduced motion.

## Verify

- A full orbit and vertical look reveal no seam, stretched clouds, dome edge, or camera translation parallax.
- Sun direction, shadows, rays, and reflections agree at the intended hero view.
- Day/dusk/night changes avoid flashes, double tone mapping, and mismatched fog.
- The sky remains useful before its image loads and when that image fails.
- Mobile and 2× rendering preserve the horizon and avoid unexpected environment rebuilds.

Read [REFERENCES.md](REFERENCES.md) for source inspection and official APIs. Seijaku's relevant functions are `makeSky`, `makeHills`, `makeStars`, and its environment update path.
