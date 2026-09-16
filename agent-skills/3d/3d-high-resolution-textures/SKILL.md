---
name: 3d-high-resolution-textures
description: Build sharp, physically coherent high-resolution materials for 3D rendering with appropriate PBR maps, texel density, UV direction, mipmaps, anisotropic filtering, and progressive asset delivery. Use for detailed wood, stone, fabric, foliage, and architectural close-ups without excessive download or GPU memory costs.
---

# 3D High-Resolution Textures

Make materials hold up at the closest intended camera view. Specify visible surface detail, mapping scale, and delivery cost together.

## Choose resolution from the view

Identify hero surfaces, their nearest camera distance, projected pixel coverage, and target render scale. A texture need depends on visible UV coverage: if a surface spans 1200 physical pixels while showing half a tile, a roughly 2400-pixel-wide tile is a useful starting estimate. Inspect the result rather than assigning 4K or 8K to every map.

Use higher resolution for readable close-up albedo/normal details and lower resolution for smooth roughness or distant surfaces when they look equivalent. Match texel density across connected surfaces. Upscaling a small source cannot invent captured detail; obtain a better source or author appropriate procedural detail when necessary.

## Build a coherent PBR material

| Map | Role | Color interpretation |
| --- | --- | --- |
| Base color, emissive color | Surface color or emitted color | sRGB for ordinary PNG/JPEG/WebP color artwork |
| Normal, roughness, metalness, AO, height | Numerical material data | No color-space conversion |
| HDR lighting image | Radiance for environment lighting | Use the format/loader's linear HDR interpretation |

Keep lighting calculations linear and apply final output conversion once. Configure maps according to the material and renderer version; see [Three.js color management](https://github.com/mrdoob/three.js/blob/dev/manual/pages/color-management.html).

Use base color without baked directional highlights when dynamic lighting is expected. Orient wood grain along the member, stone scale to actual units, and woven fibers to fabric construction. Share tiling transforms across maps belonging to one material. Check tangent-space normal convention and seams under a moving light. Verify the AO UV channel supported by the installed renderer rather than blindly duplicating an obsolete attribute name.

Combine broad color variation, mid-scale structure, and subtle microdetail. Keep bump/normal intensity plausible. Normal and bump maps alter shading; silhouette detail requires geometry or displacement with enough vertices. Wood, stone, and cloth are generally dielectric surfaces, so increasing metalness to make them shiny is not a material fix.

## Preserve detail during sampling

Enable mipmaps and appropriate minification filtering for ordinary static textures. Use anisotropic filtering for grazing-angle floors, roofs, and timber, capped by `renderer.capabilities.getMaxAnisotropy()`. Compare moderate values before assigning the maximum everywhere; anisotropy improves oblique sampling, not missing source detail.

For foliage cutouts, pad atlas cells, bleed edge color into transparent texels, and preserve alpha coverage across mip levels. Inspect distant cards against a bright sky for dark fringes or disappearing leaves. Do not threshold every mip blindly; choose a method compatible with alpha testing or alpha-to-coverage.

## Deliver detail progressively

- Load the opening view's essential maps first. Use a small useful placeholder or lower-resolution variant, then promote near-visible hero surfaces without changing their UV scale or material identity.
- Queue optional rooms and detail views shortly before the camera reaches them. DOM `loading="lazy"` does not schedule WebGL texture requests; use scene visibility, camera distance, or chapter state explicitly.
- Deduplicate requests and cache texture variants by full asset identity plus sampling/color settings. Do not key by a filename suffix that may collide.
- Keep assets external and cacheable. WebP/AVIF can reduce network bytes for color imagery; inspect data maps for compression artifacts. They usually decode to uncompressed GPU textures. KTX2/Basis can also reduce GPU storage where supported; configure and verify the transcoder and fallback. See [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html).
- Dispose superseded GPU textures when no material still references them. Reusing image bytes across separate WebGL contexts does not share the GPU allocation.

A 4096² RGBA8 texture with a full mip chain is approximately 85.3 MiB in GPU storage before driver overhead. A small compressed download can therefore still produce a large allocation. Budget the entire material set, decoded CPU images, and concurrent upgrades, not just file size.

For procedural maps, bake stable assets ahead of time where useful. Cache shared noise/height fields, process large work in bounded batches or workers, and avoid millions of canvas drawing calls during startup. Yielding around one huge synchronous operation does not divide its stall.

## Verify

Inspect close-up and grazing-angle views at the intended display resolution, then compare the same material farther away. Check seams, grain direction, alpha rims, normal orientation, and color under neutral and final lighting. Record opening bytes separately from total assets, requested dimensions, estimated GPU memory, texture promotion hitches, and missing assets on mobile.

Read [REFERENCES.md](REFERENCES.md). In Seijaku, inspect `barUV`, `assetTex`, the leaf mip/bleed preparation, shared procedural fields, and chapter-based texture scheduling. Those patterns explain its material detail better than source dimensions alone.
