---
name: build-hybrid-game-assets
description: Plan, create, integrate, or audit a hybrid asset pipeline for a Three.js or web game. Use when choosing among imported meshes, procedural 3D geometry, AI-generated reference art, 2D UI media, sprites, VFX, and performance-ready runtime asset delivery.
---

# Build Hybrid Game Assets

Choose the asset representation that best serves gameplay, readability, iteration speed, and runtime budget. Do not force every reference image through image-to-3D reconstruction.

## Classify the asset before making it

| Need | Preferred representation |
| --- | --- |
| Hero character or complex authored animation | Imported rigged mesh, with verified license and scale |
| Weapon, relic, pickup, creature variant, architecture, or interaction prop | Procedural Three.js geometry when controllable silhouette, sockets, collision, or code-driven variants matter |
| Concept, class portrait, inventory icon, cursor, backdrop, or menu treatment | Generated or authored 2D image/video used directly as UI media |
| Level mood, composition, or spacing reference | Concept image used as visual guidance; author the actual playable level separately |
| Reference image whose visible form itself must become a code model | Use `img2threejs` with its quality gates and state the result is a reconstruction, not extracted geometry |

## Create image-first work accurately

Generate a compact reference set: hero view, silhouette/side view when geometry matters, palette/material close-up, and usage context. Define camera distance, scale, pivot, collision, attachment sockets, animation needs, and budget before implementation. A single image cannot establish hidden geometry; request more views or select deliberate stylization.

## Build the runtime asset

- For imported meshes, normalize coordinate system, scale, pivot, materials, animation clips, and ownership/license before scene integration.
- For procedural geometry, expose a factory with named parts, stable sockets, deterministic variation, collider guidance, and reusable materials.
- For 2D assets, export transparent media at the actual display density; provide alt text/labels where user-facing and avoid using raster art as fake 3D collision.
- Keep authored content identifiers separate from runtime state. Do not duplicate item, material, or gameplay facts in UI code.

## Verify in the game, not the asset viewer

Check the real camera distance, lighting, readability, collision/contact, animation, mobile viewport, and performance. Measure representative draw calls, triangles, texture count, and frame time. Keep visuals original: use references for visual grammar, then create new identity, geometry, and media.

## Record provenance

Track whether each runtime asset is imported, procedural, generated 2D, or reference-only, together with source/license and generation input where applicable. Do not claim an image-to-model pipeline unless source and runtime code actually demonstrate one.
