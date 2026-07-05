---
name: daily-ui-inspiration-capture
description: Create the recurring Content repo daily UI inspiration capture. Use when the user asks to run, refresh, package, or validate the daily UI inspiration capture, especially for dated `articles/YYYY-MM-DD-ui-inspiration-capture/` bundles, Framer/Dribbble landing-page inspiration, motion-study screenshots/videos, AI-builder prompts, duplicate checking, or converting the existing capture runbook into repeatable Codex workflow.
---

# Daily UI Inspiration Capture

## Overview

Run the Content repo's daily UI inspiration workflow as an article-ready bundle, not a screenshot dump or README. Treat the current repo runbook as source of truth, but keep the contract below as the default unless the user updates it.

## Start

Work from `/Users/mengto/Downloads/Projects/Content` unless the user names another checkout.

Before collecting, read:

- `AGENTS.md`, if present or supplied in the prompt
- `scripts/ui-inspiration-capture-guidelines.md`, if present
- the latest one or two `articles/*-ui-inspiration-capture/content.md` and `manifest.json` files for current shape

Check `git status --short` early. This repo is often dirty; keep changes scoped to the requested dated bundle or skill files.

For any browser work, use the Codex in-app browser only. Do not use Chrome. If a source blocks inspection, use the best available Codex-browser evidence or local asset fallback and say why.

## Output Contract

Create a dated folder:

```text
articles/YYYY-MM-DD-ui-inspiration-capture/
```

The folder should contain at minimum:

- `content.md`
- `manifest.json`
- local still images
- local video files or clear per-item video fallback reasons
- one full-page scroll screenshot per live website reference
- section-by-section crops from that full-page screenshot for the hero, every meaningful middle section, and the footer
- motion-frame images when video capture succeeds

Do not create `README.md`.

Collect exactly 5 final references. The newer 5-reference motion-study workflow supersedes older 20-image gallery runs.

Prefer live, inspectable landing pages and product sections. Framer Marketplace is a strong source. Dribbble is best effort; if blocked by WAF or poor assets, finish with stronger Framer or direct-page candidates instead of forcing brittle workarounds.

## Selection

Load previous `articles/*-ui-inspiration-capture/manifest.json` files before choosing finalists.

Reject candidates that repeat a normalized title, source URL, or image URL from previous captures. Rotate source searches when the feed feels stale:

- `website hero`
- `saas landing page`
- `product website`
- `web design hero`
- `recent web design`
- `recent product design`

Favor references with a clear first viewport, inspectable sections, strong typography, product or brand specificity, and visible motion potential. Avoid vague atmospheric thumbnails.

## Capture

For each reference:

1. Save one representative still image locally.
2. Capture a short local video of the actual landing page or preview when possible.
3. Include slow scroll, visible hover or click states when obvious, sticky nav behavior, reveal animation, parallax, marquee loops, carousels, cursor effects, and responsive or scroll-driven changes.
4. Whenever capture tooling scrolls to a viewport or section before taking a screenshot or motion frame, wait 2 seconds before capturing so reveal animations, lazy media, sticky state changes, and scroll-triggered transitions have time to finish.
5. Save one full landing-page scroll screenshot as a single tall image when the browser can render it. It should run from the first pixel of the hero to the final pixel of the footer.
6. Cut section-by-section screenshots from that full-page image. The crops must be contiguous and lossless relative to the full image: no missing pixels between sections, no arbitrary viewport-only substitutes, and no overlap unless a sticky element makes overlap unavoidable.
7. Save as many section images as the page has meaningful sections. At minimum include the hero, each major middle section in page order, and the footer. Label unclear middle sections as `section-02`, `section-03`, etc., while preserving exact visual order.
8. Extract at least 4 motion progression frames when video succeeds: opening hero, hover or settled state, scroll transition, and lower or later section.
9. If live capture is blocked, broken, login-gated, or low quality, save the best local fallback asset and document the fallback reason.

Keep all media inside the dated article folder. Use subfolders such as `motion-frames/` when helpful.

## Article Shape

In `content.md`, make the capture immediately useful to a builder:

- open with the date and a concise pattern summary
- embed any stitched motion-study video near the top, if created
- for each of the 5 references, include the still image near the item heading
- embed the local video, or state the fallback reason
- match the established article structure from recent captures: `### Full-Page And Section Evidence`, the full-page screenshot as a normal Markdown image, `#### Section Crops`, then each section crop as a normal Markdown image ordered from hero to footer
- do not rename the block to `Local Evidence`, do not use text links, filename lists, Markdown tables, raw HTML grids, or crop-coordinate captions for the full-page/section-crop block; keep crop coordinates in `manifest.json`
- show motion progression frames before the long prompt
- describe what works, the visual pattern, and concrete motion notes
- include a long AI-builder prompt that treats the page as reference, not a template
- add a short note explaining why the prompt works

Write prompts with concrete instructions for layout, sections, components, typography, spacing, colors, image treatment, animation timing, scroll choreography, responsive behavior, interaction states, and things to avoid.

## Manifest Shape

Use JSON. Include article-level metadata such as:

- `title`
- `date`
- `captureMethod`
- `itemCount`
- `dedupeAgainst`
- `motionStudyVideo`, when present
- `items`

For each item, include fields such as:

- `title`
- `creator`
- `sourceUrl`
- `pageUrl`
- `imageUrl`
- `imageFile`
- `videoFile` or `videoFallbackReason`
- `fullPageImage`
- `sectionImages` with section label, file path, source full-page image, y-start, y-end, and height when available
- `motionFrames`
- `captureType`
- `viewport`
- `why`
- `pattern`
- `interactionNotes`
- `animationNotes`
- `prompt`

## Verification

Run the duplicate checker before committing:

```bash
node scripts/check-ui-inspiration-duplicates.mjs articles/YYYY-MM-DD-ui-inspiration-capture/manifest.json
```

Verify:

- `duplicateCount` is `0`
- `manifest.json` has exactly 5 items
- `content.md` embeds at least 5 representative still images
- every referenced still, video, and motion-frame file exists locally
- every live-website item has one full-page scroll screenshot and section crops for hero, all detected/meaningful middle sections, and footer
- section crops are derived from the full-page image, are ordered top-to-bottom, and do not miss pixel ranges between adjacent sections
- `content.md` follows the established full-page/section-crop structure for each live-website item: `### Full-Page And Section Evidence`, rendered full-page Markdown image, `#### Section Crops`, and rendered section-crop Markdown images in top-to-bottom order, with no text links, filename lists, Markdown tables, raw HTML grids, `Local Evidence` headings, or crop-coordinate captions
- each item has a local video or a clear fallback reason
- successful video captures include at least 4 motion frames
- `README.md` is absent

If `articles/ARTICLES_INDEX.md` is clean, add a single discoverability row only when that matches the current repo convention. If it is already dirty or conflicted, leave it untouched and mention that in the closeout.

Because `articles/` is often ignored, use `git add -f` for the intended dated folder. Stage and commit only the files created or intentionally changed for this run.
