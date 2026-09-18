---
name: record-natural-preview-videos
description: "Generate and refresh complete gallery and detail media packages for new or changed UI catalog items: required scene images, a sharp cursor-free thumbnail, and natural optimized 720p and 1080p browser previews. Use when adding a catalog item or variant, changing its rendered appearance, or fixing thumbnail, cursor, ghosting, frame-rate, resolution, or preview-size problems."
---

# Record Natural Preview Videos

Create complete gallery media that faithfully reflects the current item and previews that feel like a person is demonstrating the work, not like an automated camera loop.

## Requirements

- Codex in-app browser for source captures and interaction choreography.
- Python 3 with Pillow for thumbnail and compositor helpers.
- `ffmpeg` and `ffprobe` for encoding and verification.
- The repo's `browser-video-recording` skill folder, or an explicit compatible renderer path.

## New or Changed Catalog Item Contract

When a task adds a catalog item or variant, or materially changes its rendered appearance, do not finish with source code alone. In the same task:

1. Generate or refresh any item-specific images, textures, posters, or fallback images used by the rendered scene. Do not invent image dependencies for procedural scenes that do not need them.
2. Record one native `1920x1080` browser capture using the choreography rules below.
3. From that capture, generate the cursor-free catalog thumbnail, the `1280x720` gallery preview, and the `1920x1080` detail preview.
4. Update every catalog reference and verify that both preview tiers exist.

Treat the thumbnail and video as required catalog output, including for variants. If the item is intentionally nonvisual, document the exception in the project rather than silently omitting media.

## Default Output Contract

Unless the user overrides it:

- Duration: exactly `10.000` seconds.
- Frame rate: `30 fps` with 300 dense browser source frames.
- Native capture/master: `1920x1080`, 16:9, browser content only. Do not upscale a 720p delivery when recording a new or changed design.
- Gallery delivery: optimized `1280x720` VP9 WebM under `public/previews/`.
- Detail delivery: optimized `1920x1080` VP9 WebM with the same filename under `public/previews/detail/`, below `3,000,000` bytes.
- Both deliveries: `yuv420p`, no audio or metadata.
- Cursor: native macOS pointer at its natural extracted size; default scale `1.00`.
- Camera: fixed unless the user requests edited zooms.
- Transitions: hard frame cuts. Never blend adjacent scroll frames; that creates text and cursor ghosting.

When choreography is uncertain, produce two or three representative review samples before replacing a full preview library.

## Thumbnail

- Use a sharp source frame from the current browser render, not a frame decoded from the compressed delivery video.
- Hide the cursor and transient hover overlays unless the authored hover state is the subject.
- Prefer the moment that makes the item's hierarchy, object, or effect immediately recognizable.
- Downscale the native 1080p source frame to a `1280x720` JPEG with no metadata.

Generate the thumbnail with:

```bash
python3 scripts/make_thumbnail.py \
  /tmp/representative-frame.png \
  /path/to/thumbnail.jpg
```

## Choreography

Choose motion from the content type after inspecting the live page.

### Layouts and landing pages

1. Inspect the DOM and visible geometry before recording.
2. Hover the primary CTA and hold long enough for its authored state to read.
3. Hover one meaningful menu item.
4. Scroll one authored section at a time. Use a short ease-out gesture, stop at the section boundary, and pause before the next gesture.
5. Keep the pointer purposeful, usually near the edge or next target during scrolling. Do not wander across copy.

Do not continuously glide through the entire document. Map real section positions rather than assuming every section is one viewport tall.

### Interactive 3D objects

- Use curved paths that land on important controls or object features.
- When the scene includes buttons, hover the primary controls and hold briefly.
- Use ease-out timing: a confident initial move that decelerates into the target.
- A useful starting range is `1.4-1.8s` per curved move with `0.6-0.9s` holds.

### 3D scenes without controls

- Use slow orbit-like arcs around the subject.
- Break the ten seconds into three or four eased arcs with pauses.
- Let the scene respond to the pointer; do not add unrelated cursor loops or decorative clicks.

## Capture and Render

Use the Codex in-app browser. Set a temporary `1920x1080` viewport and reset it before finishing.

Capture one screenshot for every output frame while performing the real pointer and scroll actions. Build a renderer config with:

- 300 `shots` and matching `scene_starts` at `i / 30` seconds.
- The transition name `cut` for every scene.
- Dense `cursor_keys` matching the real browser pointer positions.
- Fixed `camera_keys` and `rotation_strength_degrees: 0` for a natural pointer.

Render with the installed helper, which reuses the `browser-video-recording` compositor but disables its crossfades:

```bash
python3 scripts/render_hardcut_preview.py \
  --config /tmp/preview-config.json \
  --output /tmp/preview-master.mp4
```

Optimize the native high-quality master for the detail view with:

```bash
python3 scripts/optimize_webm.py \
  /tmp/preview-master.mp4 \
  /path/to/public/previews/detail/item.webm \
  --width 1920 \
  --height 1080
```

Create a high-quality `1280x720` intermediate from the same native master, then optimize the gallery delivery:

```bash
ffmpeg -i /tmp/preview-master.mp4 \
  -vf scale=1280:720:flags=lanczos \
  -an -c:v libx264 -crf 12 -pix_fmt yuv420p \
  /tmp/preview-gallery-master.mp4

python3 scripts/optimize_webm.py \
  /tmp/preview-gallery-master.mp4 \
  /path/to/public/previews/item.webm
```

The optimizer defaults to VP9 CRF 36 with a quality-oriented encode. If the 1080p detail delivery exceeds `3,000,000` bytes, raise CRF gradually and inspect the midpoint and motion sequence after each material reduction. Preserve authored linework and grain; use denoising only when compression alone cannot meet the ceiling without visible damage.

## Verification

Before delivery:

1. Verify the gallery preview is VP9, `1280x720`, `30/1`, `yuv420p`, and `10.000` seconds with `ffprobe`.
2. Verify the detail preview is VP9, `1920x1080`, `30/1`, `yuv420p`, `10.000` seconds, below `3,000,000` bytes, and has no audio stream.
3. Verify each thumbnail is a cursor-free `1280x720` JPEG and inspect it directly.
4. Inspect a midpoint frame from both video tiers.
5. For scrolling layouts, inspect at least six consecutive frames during a scroll gesture; each must contain one sharp page state with no blended duplicate text.
6. Inspect a one-second contact sheet to confirm CTA/menu hovers, section stops, eased 3D landings, and cursor visibility.
7. Verify every image, thumbnail, gallery preview, and detail preview path referenced by the new or changed catalog item.
8. Report each final file size and, when replacing an existing encode, the before/after reduction.
9. Preserve unrelated dirty worktree files and commit only the requested media and workflow scope.
