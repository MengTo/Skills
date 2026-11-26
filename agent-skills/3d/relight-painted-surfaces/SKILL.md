---
name: relight-painted-surfaces
description: Add pointer-driven lighting to a 2D painting, sprite, or holographic card using separate depth, normal, and roughness maps. Use for moving highlights on illustrated metal, skin, cloth, or paper while the painted silhouette stays registered.
---

# Relight painted surfaces

Steer one directional light across the entire illustration. A pointer over empty space should turn the reflection on a distant knuckle. The normal at the knuckle chooses which way it reflects, and its roughness determines how wide that reflection looks.

This technique works on a flat painted layer with an existing light baked into its colour. For a modeled object with geometry and a material under scene lighting, use the 3D Metal Material skill. For texel density, UVs and filtering of an existing PBR texture set, see 3D High-Resolution Textures.

Extracted from the articulated steel hand in Folvra’s *Commission* hero, with the pointer-controlled studio light from [Meng To’s Dark Souls Holo Card](https://threeui.com/hero/dark-souls-holo-card). The local [demo](demo/index.html) runs Three.js r187, WebGL 2 and a custom GLSL shader. Select **Depth**, **Normals** or **Roughness** to inspect the inputs under the hand.

## Prepare the surface

Use matching crops, orientation and aspect ratios for all four textures. Their resolutions may differ. Keep the original paint and alpha for the resting image.

| Texture | Interpretation | Detail to check |
| --- | --- | --- |
| Paint | sRGB colour and a straight-alpha silhouette | Keep the wrist and gaps between fingers transparent where the illustration is cut out. |
| Depth | Linear grayscale, white nearer the viewer | Shape large forms first. A painted black joint can be close to the viewer. |
| Normal | Linear tangent-space RGB, +Y up, neutral around (128,128,255) | Round the raised plates. Fine seams perturb the reflection without carving deep trenches. |
| Roughness | Linear grayscale, white matte | Separate glass, polished metal, tarnish, skin and cloth. Bright paint alone cannot distinguish these materials. |

Use existing authored maps when available. To bake a set from a painting, install Pillow, NumPy and OpenCV in the working Python environment. Give the helper an aligned relative-depth image and, when available, a painted roughness mask.

```sh
python scripts/bake_maps.py palm.webp --depth palm-depth.png \
  --roughness palm-roughness.png --material metal --out maps/
```

For a painting without depth, install ONNX Runtime and pass `--model path/to/model.onnx` in place of `--depth`. The helper accepts the dynamic-input [Depth Anything V2 Small ONNX model](https://huggingface.co/onnx-community/depth-anything-v2-small). Its output is an estimate from the image. Inspect fingers, overlapping parts and holes before using it. The helper writes three lossless WebPs with separate 8-bit channels and leaves the painting intact. Use a distinct output directory when the inputs share those filenames.

## Wire the light

Copy the three modules from [assets](assets/) into a project with Three.js. Set the stage to the whole interaction area. Give each paint image a positioned wrapper of its own, with the image displayed as a block that fills it. Keep any rotation, scale or scroll transform on that wrapper so the overlay and its coordinate probes follow together. For a cropped portrait, crop the wrapper around a proportionally sized image so the four textures use identical image coordinates.

```js
import { createPaintLighting } from "./paint-light.js";

const lighting = createPaintLighting(stage, [
  { image: steelImage, normal: steelNormal, depth: steelDepth, roughness: steelRoughness, metal: 1 },
  { image: clothImage, normal: clothNormal, depth: clothDepth, roughness: clothRoughness, metal: 0 }
]);
// Optional keyboard, touch or fixed-camera inspection pose, with x and y in [-1, 1].
lighting.setLight(-0.65, 0.35);
// On teardown, call lighting.dispose().
```

Reference the [fragment shader](assets/paint-renderer.js) when porting to another renderer and the [studio light](assets/paint-shader.js) when tuning the finish. The Folvra starting values are:

- Map the horizontal and inverted vertical pointer coordinates to `[-1, 1]` **once per stage**. Aim the key along `normalize(vec3(1.15*x, .48+.85*y, .9))`. Project the diagonal reflection band in stage coordinates so it crosses adjacent layers continuously.
- Decode paint through sRGB once, read all three data textures as linear values, and normalize the sampled normal. Use the depth to offset only interior samples by up to 4.2 CSS pixels. Anchor transparent boundaries and sample five points towards the light for shallow self-shadowing.
- Use reflected view direction for steel, a broad studio reflector and a warm bounce. Let roughness broaden the specular lobe. Attenuate reflection in dark tarnished recesses to preserve the separation between plates. Use `metal: 0` for skin and cloth. A mixed object benefits from an authored material mask.
- Composite the **signed colour difference** over the original painting. This can darken one side of a joint as the other side catches light. A low-resolution replacement blurs brushwork, and an additive-only pass makes the whole hand brighter.
- Reuse one renderer for visible layers. The included controller redraws on input or resize, caps its buffer at 1.25× DPR and 1280 × 960 per layer, and releases GPU resources on disposal. Call `refresh()` if an external animation moves layers beneath a stationary light. Touch and reduced-motion views keep the painted composition, with an optional explicit direction control.

## Verify the effect

Park the pointer over empty paper at opposite sides of the stage. Capture the **same fixed crop** of a plate in both positions. Look for a highlight traveling from one bevel to another while the exterior edge stays in place. At one fixed pointer pose, separately substitute neutral normals, constant depth, and constant roughness. Inspect the bevel, contact shadow and reflection width after each substitution. If the images look identical, trace the sampled texture and colour-space settings.

Test with a coarse pointer, keyboard input, reduced motion and WebGL disabled. The base paint should remain readable in all four cases. The [demo prompt](demo/PROMPT.md) also gives a different subject for testing reuse.
