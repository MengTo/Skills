# Character Model Demo Prompts

## Minimal prompt

Use $game-dev-character-model to make an original, realistic game character as a textured, rigged GLB standing in a relaxed pose in a lit three.js viewer, and show me the four check views.

## Recreate the demo

Use $game-dev-character-model to make an original sci-fi heroine and a small proof page for her:

> A woman in her late twenties with a short, wavy auburn bob, wearing a worn black flight suit with burnt-orange panels, a chest harness, a belt of pouches, steel shoulder plates, vambraces, fingerless gloves, knee armour and heavy boots. Grounded, practical, no logos.

### Direction

- Write the design down first (silhouette, palette, kit), then generate one photoreal full-body A-pose concept on a neutral grey background with nothing cropped.
- Turn the concept into a textured model with image-to-3D, rig it, and pose it in code: arms down with a soft elbow bend, a small chest and head turn.
- Light it like a hangar: a cool overhead key, a warm side fill and cold rims from behind, on a dark floor that takes one clean shadow.
- Capture the full, waist-up, back and face views headless, plus the same full view in the raw A-pose for a before/after.

### Deliverable

- Create demo/index.html as a standalone page with inline CSS and JavaScript.
- Show the concept next to a drag-to-compare wipe between the A-pose and the posed model, then the four views with tabs that advance on their own.
- Put compressed JPEG stills in demo/assets/ (about 1000 px tall, quality 80). Do not commit the GLB.

### Acceptance checks

- The page works from the repo checkout with relative paths and no network.
- Responsive from 390px to 1440px, with reduced-motion handling (no auto-advance).
- The whole demo folder stays under a few megabytes.

## Remix prompt

Use $game-dev-character-model to make a different original character (a desert scout, an orbital mechanic, a forest ranger) with the same pipeline, then rebuild this demo page around them with the new concept, the A-pose before/after and the four check views.
