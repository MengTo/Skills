# Vesperfall asset review contract

## Surface mapping

| Surface | Required content |
|---|---|
| Catalog card | Transparent PNG reference; never initialize WebGL |
| Selected inspector | One live model renderer with explicit source label |
| Preview button | Stable isolated review or moveset route |
| Review route | Source provenance, interaction controls, deterministic fixtures |

## Provenance language

- `imported-fbx`: a shipped FBX file is loaded by the preview/runtime.
- `procedural-three`: runtime Three.js geometry is authored in code.
- `img2threejs review`: code-only reconstruction from a reference image; not a shipped texture, FBX, or GLB.
- `static-raster`: a shipped PNG/WebP used directly.
- `declared, not shipped`: source contains a future path but the file is absent.

Never use “generated original” as visible reader copy. Keep internal enum values only when existing schemas require them.

## Grounding

- Measure character contact from foot meshes or authored contact sockets.
- Do not ground from weapon tips, hanging cloth, VFX, or shadow geometry.
- For articulated locomotion, sample at least 0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, and 1.
- Keep at least one planted foot at the authored contact plane across the loop.
- Exempt death/collapse poses when the body intentionally changes contact.

## Browser proof

Use the Codex in-app browser. Confirm:

- PNG natural dimensions and successful load
- card contains image and zero canvas
- inspector contains exactly one intended model host/canvas
- model-ready metadata names the real source type
- preview button lands on the expected route
- action buttons change the selected/playing motion
- no horizontal overflow or console warning/error
