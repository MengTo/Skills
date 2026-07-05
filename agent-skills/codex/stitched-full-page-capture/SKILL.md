---
name: stitched-full-page-capture
description: Capture or repair reliable full-page screenshots for lazy-loaded, scroll-animated, Framer, WebGL/canvas, or reveal-heavy web pages. Use when full-page screenshots are blank, gray, white, sparse, show a tiny content strip, disagree with a working scroll video, or when article evidence/section crops must be derived from a trustworthy full-page image.
---

# Stitched Full-Page Capture

## Overview

Use settled viewport screenshots instead of trusting one-shot browser `fullPage` captures. This is especially important for Framer pages and other lazy/scroll-animated sites where the MP4 can look correct while the tall screenshot is mostly blank.

## Core Workflow

1. Open the real page URL, not a marketplace thumbnail, cover image, remix page, or asset URL.
2. Warm the page by scrolling from top to bottom once so lazy media and reveal sections mount.
3. Return to the top.
4. Scroll downward in viewport-sized or slightly-overlapping steps.
5. Wait about 2 seconds after each scroll stop.
6. Capture the settled viewport.
7. Stitch the viewport captures vertically into one full-page image.
8. Cut section crops from that stitched image, not from the native browser `fullPage` screenshot.
9. Validate the stitched image against the representative still, MP4, and motion frames.

Reject a full-page candidate when it has blank/gray/white bands, very low visual content, missing lazy-loaded sections, an extremely narrow content column, or obvious disagreement with the scroll video.

## Script

For Content daily UI inspiration articles, use:

```bash
node /Users/mengto/.codex/skills/stitched-full-page-capture/scripts/stitch_full_page_capture.mjs \
  --manifest articles/YYYY-MM-DD-ui-inspiration-capture/manifest.json
```

The script:

- reads `items[].pageUrl`, `fullPageImage`, and `sectionImages`;
- opens each live page in Playwright Chromium;
- warms lazy content by scrolling once;
- captures settled viewport slices;
- stitches slices into `fullPageImage`;
- regenerates each existing section crop from the stitched image;
- updates `manifest.json` with `fullPageCaptureMethod: "stitchedViewportScreenshots"`, viewport, step, segment count, and corrected crop coordinates.

Useful options:

```bash
--item 4              # repair only item 4, 1-based
--viewport 1440x1100 # default
--step 950           # default; use less than viewport height for overlap
--wait 2000          # ms to wait after each scroll stop
--quality 3          # ffmpeg JPEG quality, lower is better
```

## Validation

After capture or repair:

- Inspect at least the page that was visibly wrong before.
- Confirm `sips -g pixelWidth -g pixelHeight full-page/*.jpg` reports expected wide/tall dimensions.
- Confirm the full-page image is not mostly blank and includes lower-page content.
- Confirm section crop coordinates are contiguous and end at the full-page image height.
- Run the project’s normal checks, for example:

```bash
git diff --check -- articles/YYYY-MM-DD-ui-inspiration-capture/content.md articles/YYYY-MM-DD-ui-inspiration-capture/manifest.json
node scripts/check-ui-inspiration-duplicates.mjs articles/YYYY-MM-DD-ui-inspiration-capture/manifest.json
for f in articles/YYYY-MM-DD-ui-inspiration-capture/videos/*.mp4; do ffprobe -v error "$f" >/dev/null; done
```

## Notes

- The scroll video is evidence that the page can render during real scrolling, but it is not a substitute for full-page still evidence.
- Native `fullPage` screenshots can still be saved as comparison candidates, but do not use them as source of truth unless they visually match the stitched capture.
- For daily UI articles, update the manifest and commit only the repaired article assets and metadata.
