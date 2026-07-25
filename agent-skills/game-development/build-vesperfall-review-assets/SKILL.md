---
name: build-vesperfall-review-assets
description: Build truthful Vesperfall asset-library review pairs from transparent PNG references and live Three.js, FBX, or img2threejs models. Use when adding a character, enemy, prop, or equipment asset to the Vesperfall catalog; creating a card-PNG plus inspector-model treatment; exposing an isolated model or moveset route; or standardizing provenance, grounding, tests, and Codex-browser validation for game art review.
---

# Build Vesperfall Review Assets

Create one reviewable asset pair without confusing catalog media, imported files, procedural factories, and future contracts.

## Workflow

1. Inspect repository truth before choosing a model path.
   - Locate shipped PNG, FBX, GLB, textures, runtime factories, and declared-but-missing paths.
   - Prefer a shipped FBX/GLB when it is the actual runtime source.
   - Use `$img2threejs` only when reconstructing from an image in code. Never relabel imported geometry as img2threejs.
   - Do not claim a GLB or texture exists because code declares a future URL.
2. Produce the transparent catalog reference.
   - Reuse or derive from the production portrait when it already matches the asset identity.
   - Normalize catalog copies to 512×512 RGBA unless the project contract says otherwise.
   - Keep transparent corners and avoid baked floor, halo, or shadow.
   - Store project-bound output under `public/asset-catalog/<category>/`.
3. Build the live model preview.
   - Put loading/model construction in a small asset-specific module.
   - Preserve runtime provenance in `userData`: source paths or factory, action count, sockets, and review-only status.
   - Attach equipment to named sockets. Keep materials, renderer, mixers, events, and animation frames disposable.
   - Frame from measured bounds. Ground from foot/contact geometry, not the lowest weapon tip.
4. Pair the catalog surfaces.
   - Card/grid: transparent PNG only, with no canvas.
   - Selected inspector: one live model canvas plus truthful format label.
   - Add a button to an isolated preview or moveset route.
   - Keep fallback media visible until WebGL/model loading is ready.
5. Build the isolated review route.
   - Expose the real action library when clips exist.
   - Provide restart, pause/play, action selection, drag rotation, source paths, and provenance.
   - For procedural motions, mark runtime, contract, and candidate actions separately.
6. Validate before committing.
   - Run `scripts/validate_pair.py <png> <model-source>`.
   - Add inventory tests for exact paths, RGBA dimensions, preview kind, and route.
   - Test every motion/contact point deterministically when grounding changes with animation.
   - Run build, lint, full tests, and `git diff --check`.
   - Use the Codex in-app browser only. Verify desktop and mobile, card PNG/no canvas, inspector model/one canvas, preview navigation, grounding, scroll, overflow, broken media, and console warnings/errors.
7. Commit the narrow task and hand off its exact SHA before deployment reconciliation.

Read [references/catalog-contract.md](references/catalog-contract.md) when changing catalog types, provenance language, or review-route behavior.

## Required reporting

Report:

- PNG path, dimensions, and alpha status
- model source or procedural factory
- whether the model is imported, runtime procedural, or review-only reconstruction
- preview route and available actions
- test/build/browser proof
- exact commit SHA
