# 3D Rendering Skills

Reusable skills for atmospheric 3D scenes, real-time architecture, survey scans, construction sequences and interactive walkthroughs. Most of the techniques draw on [Seijaku](https://mengto.github.io/seijaku/); the open-ocean water comes from Pirate Ship Sunset, the harbour water from Shinonome Harbour, and the underwater light from Blue Hour. Each includes implementation guidance, performance considerations and verification steps.

| Skill | Use it for |
| --- | --- |
| [3D Ultra-Realistic Water](3d-ultra-realistic-water/SKILL.md) | Open oceans with per-pixel Gerstner waves, sun glitter, lace foam, a Kelvin wake and a seamless horizon, plus a runnable demo. |
| [3D Underwater God Rays](3d-underwater-god-rays/SKILL.md) | Volumetric light shafts through water that converge on the sun and parallax with the camera, with caustic streaks, a rippling surface and dappled fish, plus a runnable demo. |
| [3D Virtual Tour](3d-virtual-tour/SKILL.md) | Guided walkthroughs, room and floor-plan navigation, orbit inspection, and smooth return to the tour. |
| [3D Sky Rays](3d-sky-rays/SKILL.md) | Sunlight shafts shaped by roofs, foliage, and scene occlusion. |
| [3D Sky Background](3d-sky-background/SKILL.md) | Procedural or panoramic skies with a coherent horizon, sunlight, and environment lighting. |
| [3D Falling Leaves](3d-falling-leaves/SKILL.md) | Instanced leaves that tumble, catch the wind, and move through the scene. |
| [3D Four Seasons](3d-four-seasons/SKILL.md) | Coordinated spring, summer, fall, and winter materials, foliage, lighting, and particles. |
| [3D High-Resolution Textures](3d-high-resolution-textures/SKILL.md) | Sharp PBR materials with appropriate UVs, filtering, and progressive loading. |
| [3D High-Poly Models](3d-high-poly-models/SKILL.md) | Detailed silhouettes and geometry with practical runtime levels of detail. |
| [3D Wood Material](3d-wood-material/SKILL.md) | Procedural wood with growth-ring grain, pores, oil and wax finishes, tool marks and end grain that survive macro close-ups. |
| [3D Cloth Material](3d-cloth-material/SKILL.md) | Woven cloth with thread structure, sheen, folds that don't stretch the weave, stitched hems and frayed edges. |
| [3D Paper Material](3d-paper-material/SKILL.md) | Washi, rag and kraft paper with fibres, deckled edges, back-lit translucency, curl and creases. |
| [Relight Painted Surfaces](relight-painted-surfaces/SKILL.md) | Steer one studio light across a 2D illustration using separate depth, normal and roughness maps. [Open demo](relight-painted-surfaces/demo/index.html). |
| [3D Metal Material](3d-metal-material/SKILL.md) | Physically based steel, brass, gold and copper with structured reflections, brushed streaks, scratches and patina. |
| [3D Orbit and Inspect Demo](3d-orbit-inspect-demo/SKILL.md) | A 3D object that leans on hover and lifts to a full inspect view on click, with drag, zoom and a clean return. |
| [3D Wood Lighting Scorecard](3d-wood-lighting-scorecard/SKILL.md) | Warm key light, volumetric shafts and dust, plus a runnable scorecard that rates the render out of 10 against an anchored rubric. |
| [3D Retina Resolution](3d-retina-resolution/SKILL.md) | Fixed 200% rendering, synchronized render buffers, and correct HiDPI sizing. |
| [3D Survey Scan](3d-survey-scan/SKILL.md) | Sweep the occupied scene with a cyan pulse that traces its actual mesh edges. [Open demo](3d-survey-scan/demo/index.html). |
| [3D Construction Sequence](3d-construction-sequence/SKILL.md) | Assemble a structure from its foundations through its roof with synchronized wires and rigid parts. [Open demo](3d-construction-sequence/demo/index.html). |
| [3D Modular Buildings](3d-modular-buildings/SKILL.md) | Model structural bays, entrances and rooflines that read from the approach and at eye height. [Open demo](3d-modular-buildings/demo/index.html). |
| [3D Harbour Water](3d-harbour-water/SKILL.md) | Reflect quay lights on rain-dappled water, float a launch on the swell and leave a wake through turns. [Open demo](3d-harbour-water/demo/index.html). |
| [Kasumidera Ultra-Realism](3d-kasumidera-ultra-realism/SKILL.md) | Build walkable painterly Three.js environments with warm lacquer, modeled joinery, layered clouds and materials reviewed at 200%. [Inspect six game frames](3d-kasumidera-ultra-realism/demo/index.html). |
| [Woodland Chapter Cameras](woodland-chapter-cameras/SKILL.md) | Stage one live woodland across several scroll chapters. [Open demo](woodland-chapter-cameras/demo/index.html). |
| [Perching Butterfly](perching-butterfly/SKILL.md) | Animate a butterfly with a grounded perch and a flight loop. [Open demo](perching-butterfly/demo/index.html). |
| [Forest Floor Specimen](forest-floor-specimen/SKILL.md) | Grow an inspectable fern and moss specimen for a field guide. [Open demo](forest-floor-specimen/demo/index.html). |

## Use a skill

Copy the complete skill folder into your agent's skills directory, or load its `SKILL.md` directly as project context. Each folder includes source references and Codex interface metadata.

For example, after installing the skill:

```text
Use $3d-sky-rays to add sunlight through the trees in this scene.
```

```text
Use $3d-retina-resolution to render this view at fixed 200% resolution.
```

```text
Use $3d-virtual-tour to add a guided walkthrough with room navigation and orbit inspection.
```

```text
Use $3d-ultra-realistic-water to add an open ocean with sun glitter, lace foam and a ship's wake.
```

```text
Use $3d-underwater-god-rays to add sunbeams and caustic ripples through the water in this reef scene.
```

Use the narrowest skill that fits the task, or combine them when the scene requires it. Preserve the project's renderer, camera behavior, and intended visual style.
