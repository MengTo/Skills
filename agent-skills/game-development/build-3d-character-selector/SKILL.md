---
name: build-3d-character-selector
description: Make an original 3D cast from identity and full-body references, prepare textured GLBs for the browser, and build a full-body character selection screen with rotation, material lighting and animated swaps. Use for character generation, a casting room, a wardrobe or a playable roster.
---

# Build a 3D character selector

Use the [generation recipe](references/character-production.md) when creating new people or explaining how the driving game's four characters were made. If the project already has approved models, start with their own assets. The [full-body stage reference](assets/full-body-selector.jpg) shows the balance between the controls, floor and figure.

[Watch the four-character demo](assets/demo.mp4) or [compare a reference with its model](assets/demo.jpg). The left panel holds the approved full-body generation input while the right panel shows the textured mesh in the game selector.

## Prepare each runtime character

- Keep a high-detail master. Make a browser copy with a measured triangle and texture budget. Inspect the face, hands, ears, boots and garment silhouettes before and after decimation. Keep UVs and normals intact, and verify the mapping of materials on every visible primitive.
- Establish one canonical rest transform per model. Correct facing direction using a rendered front and profile, compute bounds after transforming all body parts, center horizontally and place the soles on one floor. Keep meaningful height differences if characters share an in-world scale.
- Import the base color as sRGB. Sample normals, roughness, metallic and occlusion as linear data. In glTF's metallic-roughness texture, green is roughness and blue is metalness. Preserve alpha mode and double-sided flags for hair and sheer clothing. Compare fabric and metal under a moving light before tuning exposure.
- Give each entry a stable ID, name, role, portrait, preview fallback, asset reference and optional facing correction. Keep the selected ID separate from the last confirmed player ID. Reuse the project's existing asset loader and save format. Supply a valid default for old or unknown IDs.

## Compose the stage

Fit the full body into the free portion of the viewport after measuring the controls. In a side-by-side layout, aim the camera at the figure's center and use an off-axis projection or a separate stage viewport to keep it in the free area. Check both the figure's height and the width of its turning silhouette. On short and narrow screens, reflow the controls into a compact panel and refit the camera. Retain headroom and visible soles.

Use one broad warm key to reveal the face, a soft cool fill for the shadow cheek, and a narrow grazing light for hair, seams and implants. Give the feet a contact shadow. Place smoke and shafts behind the character. Keep their brightest values away from the eyes. When requested, let the floor dots move in shallow waves and keep their motion slow enough for fabric detail to read.

Keep the roster, rotate controls and one confirm action visible. Use the host UI's type system. The driving game used JetBrains Mono at 11 CSS pixels or larger. For a Retina request, scale the drawing buffer independently of the CSS layout and camera framing. Test the actual maximum drawing-buffer size on the target device.

## Make selection reliable

1. Open on the confirmed character in full-body view. Start a gentle idle turn, with direct drag, touch and keyboard rotation. Yield to input from the current displayed angle so grabbing the model never snaps it back.
2. On a roster change, increment a request token. Keep the current character drawn while the selected asset decodes. On success, check the token and that the selector is open before committing. Release obsolete loads through the asset cache. On failure, keep a usable preview and let the user retry or choose someone else.
3. Once both bodies are ready, sweep dots and wireframe across their real topology. The companion skill `build-point-cloud-scan` gives the mask, cage builder and draw order. Use a direct replacement under reduced motion. Keep the selected row, announced name and preview consistent. Allow focus, arrow selection and confirmation by keyboard.
4. At confirm time, commit exactly the selected, available character ID through the same path the game uses on load. Prevent double entry while launching. On exit, cancel stage updates and release temporary render targets, geometry and textures according to who owns them.

## Verify the roster

Inspect front, quarter-turn, profile and rear for each character. Cycle A → B → C quickly while B is still loading, then leave and reopen the selector. Test a failed asset load, reload after confirmation, and verify the chosen ID at gameplay entry. Check portrait phone, short landscape and desktop at 1× and 2× pixel density. Capture the same character at rest and midway through a swap so lighting, silhouette and texture detail can be compared.
