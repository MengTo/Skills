# Implementation, Capture, and QA

Read this when implementing the composition, integrating it into a catalog, or recording final media.

## Host-layer architecture

Keep the renderer and typography separate:

```text
composition root
|-- exact renderer host (full scene, native stage)
`-- one semantic h1
    |-- overflow-visible row
    `-- overflow-visible row
```

The renderer host may receive a restrained whole-scene transform. Do not reach into the exact renderer to restage its geometry unless the user asked to change the source scene itself.

Use a single accessible heading. Mark duplicated visual row text `aria-hidden` only when the parent heading already provides the complete accessible name.

## CSS invariants

- Renderer layer: full-bleed, stable transform origin, no pointer-blocking overlay.
- Headline layer: absolute placement in verified negative space, `pointer-events: none` unless the design explicitly requires type interaction.
- Row wrapper: `display: block; overflow: visible`.
- Animated line: `animation-fill-mode: both`; prefer transform and opacity.
- Do not use `clip-path`, `background-clip`, `overflow: clip`, or `overflow: hidden` for the message reveal.
- Keep shadow/blur radii within the measured outer inset.
- Avoid animating layout properties such as width, height, top, or left every frame.

If delayed rows flash before their animation begins, the fix is fill mode or initial state, not a clipping mask.

## Lifecycle and accessibility

- Use `IntersectionObserver` to pause when the composition leaves the viewport.
- Listen for `visibilitychange` and pause while the document is hidden.
- Under `prefers-reduced-motion: reduce`, render a composed still with the full message visible and stop non-essential motion.
- Preserve pointer/keyboard behavior already present in the exact renderer.
- Keep capture-only controls gated behind an explicit query parameter or development mode.

For deterministic CSS capture, a preview-only `#frame=N` hook can map frames `0–299` to `N / 30` seconds and pause the outer timeline. The normal page must remain time-driven and must not expose this control to users.

## Browser review matrix

Use the approved in-app browser when local project rules require it.

| View | States | What to inspect |
| --- | --- | --- |
| Native `1920x1080` | Start, entrance, hold, exit, seam | Full subject, native framing, large message, shadow clearance |
| Gallery `1280x720` | Same representative states | Readability after downscale and no subject/type collision |
| Narrow/mobile | Still and most displaced state | Intentional re-composition, no tiny copy, no forced overlap |
| Reduced motion | Final composed still | Message and subject remain present; animation stops |

Inspect the real rendered page, not only source code or isolated CSS values.

## Natural ten-second capture

For a new or changed catalog item:

1. Set the browser viewport to native `1920x1080` and reset it afterward.
2. Capture 300 dense source frames at `30fps` from the live browser.
3. For a 3D scene, use three or four restrained eased pointer arcs with pauses at meaningful landings.
4. Use cursor scale `1.00` unless the user explicitly requests another size.
5. Render with hard frame cuts. Do not blend adjacent frames; blending creates duplicate text and cursor ghosts.
6. Choose the thumbnail from a sharp native browser frame before cursor compositing.
7. Derive both video tiers from the same native master.

Default deliveries:

- Thumbnail: cursor-free `1280x720` JPEG, no metadata.
- Gallery: `1280x720`, VP9 WebM, `30/1`, `yuv420p`, `10.000s`, no audio.
- Detail: `1920x1080`, VP9 WebM, `30/1`, `yuv420p`, `10.000s`, no audio, below `3,000,000` bytes.

If the detail encode exceeds the size ceiling, raise VP9 CRF gradually and inspect both a midpoint frame and motion sequence after each material reduction.

## Visual proof

Before delivery:

- Inspect a clean source-frame contact sheet containing every variant.
- Inspect midpoint frames from both encoded tiers.
- Inspect at least six consecutive frames through the strongest text movement.
- Confirm no word is sliced at the viewport edge during entrance or exit.
- Confirm no text shadow, glow, or blur disappears at a row boundary.
- Confirm the full subject remains readable at the maximum camera scale.
- Confirm cursor paths do not cross the message unnecessarily or settle over the subject's focal point.
- Confirm the loop seam does not jump.

## Catalog integration checklist

When the project has a catalog/provenance system, update in the same task:

- Catalog record and distinct description/copy controls.
- Exact source paths and current source hashes.
- Ownership/provenance record.
- Thumbnail, gallery preview, and detail preview paths.
- Item-specific regression test for exact renderer reuse, one-heading structure, distinct motion grammar, unclipped rows, and restrained camera scale.
- General media tests for thumbnail/video pairs and delivery metadata.

Run the owning project's source, media, type, and build checks. A typical sequence is:

```bash
npm run check
npm run typecheck
npm test
npm run build
git diff --check
```

Use only commands that exist in the project. Treat build warnings separately from failures. If the worktree contains unrelated changes, stage only the composition, its catalog/provenance hunks, and its media. Verify the staged diff before committing.
