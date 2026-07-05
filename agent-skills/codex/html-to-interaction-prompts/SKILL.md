---
name: html-to-interaction-prompts
description: Convert a supplied HTML page or generated HTML reference into a screenshot-backed article containing multiple reusable interaction prompts. Use when the user provides an HTML file, exported page, generated-page.html, or local/live reference and asks to extract animation/interactions, create prompts, capture screenshots for each prompt, add them to a Content article, or commit the resulting article/assets.
---

# HTML To Interaction Prompts

## Goal

Turn an HTML reference into an article-ready prompt pack: identify the important interactions, capture the right visual evidence, write flexible prompts, insert screenshots under each prompt title, verify the article renders, and commit only the intended files.

## Daily UI Inspiration Capture Contract

When this skill is used for the Content repo daily UI inspiration workflow:

- Each daily inspiration article must contain exactly 5 inspirations, not 20.
- Do not ship a screenshot gallery or append 20 shallow prompts.
- Each of the 5 inspirations must include a representative local still image, an embedded local MP4 video, multiple local screenshots or motion frames, motion/interaction notes, source metadata, and one super detailed AI-builder prompt.
- If the source is a Framer template or any other live website, record the actual landing page or preview URL while scrolling through the website itself. A marketplace cover image, thumbnail, screenshot pan, or static asset slideshow is not acceptable live-video evidence.
- For Framer, inspect the marketplace detail page for `Full Live Preview` or the embedded `previewUrl`, save that URL as `pageUrl`, and record the MP4 from that page.
- For live websites, save one full landing-page scroll screenshot as a single tall image. Then cut section-by-section screenshots from that exact full image so the article includes both the whole page and each section separately.
- Section crops must be contiguous and pixel-complete relative to the full-page image. Do not miss pixels between sections, do not use arbitrary viewport screenshots as section substitutes, and only allow overlap when sticky elements make it unavoidable.
- Include as many section crops as the page has meaningful sections. At minimum include the hero, each major middle section in page order, and the footer. Use purpose-based labels when possible, such as `proof`, `features`, `process`, `gallery`, `pricing`, `faq`, or `final-cta`; otherwise use ordered labels like `section-02`.
- In `content.md`, match the established daily capture article structure from recent examples. Use `### Full-Page And Section Evidence`, render the full-page screenshot as a normal Markdown image, then use `#### Section Crops` and render each crop as a normal Markdown image in top-to-bottom order. Do not rename this block to `Local Evidence`, do not use text links, filename lists, Markdown tables, raw HTML grids, or crop-coordinate captions for this block.
- Do not put crop-coordinate captions under screenshots in `content.md`; keep crop coordinate details in `manifest.json`.
- Extract multiple motion frames from the live website video. The frames should show real page states across scroll, not repeated crops of the same cover image.
- If live capture is blocked, prefer replacing the candidate with another live website. Only create a local fallback video from still evidence when replacement is impossible or the source is image-only, and state the fallback reason in `content.md` and `manifest.json`.
- The prompt for each inspiration should be long enough to paste into an AI builder directly. It should include reference boundaries, anti-patterns, core idea, design system, layout rules, motion system, section-by-section anatomy, conversion/footer, responsive behavior, accessibility, performance, and reduced-motion guidance.
- Each prompt must describe the landing page section by section. Cover the global shell, header/navigation, hero, proof strip, feature/service modules, product/demo/media section, process/how-it-works, gallery/case-study/work section when present, testimonials/social proof, pricing/package/comparison when present, FAQ, final CTA, footer, and mobile behavior.
- For every major section, specify the purpose, layout anatomy, visual details, animation, interaction states, scroll behavior, recommended implementation library/API, and reduced-motion fallback.
- For Framer/live websites, each prompt must include a `Live-site evidence` note explaining that the still, MP4, and frames were captured from the actual `pageUrl`, not from a cover image.
- The manifest must have `itemCount: 5` and exactly 5 `items`.
- Keep all media inside `articles/YYYY-MM-DD-ui-inspiration-capture/`.

## Workflow

1. Inspect the real source first.
   - Read the HTML, CSS, and scripts. Search for interaction terms such as `mousemove`, `pointermove`, `canvas`, `webgl`, `ScrollTrigger`, `requestAnimationFrame`, `hover`, `sticky`, `pin`, `parallax`, `magnetic`, `glow`, `shader`, and `animation`.
   - Treat source behavior as truth. Do not infer exact effects from a screenshot alone when the HTML is available.
   - Check the current git status before editing. Dirty worktrees are normal; keep staging narrow.

2. Decide the prompt list.
   - Split prompts by reusable interaction idea, not by implementation line count.
   - If one user bullet contains two distinct effects, split it only when that makes the article more useful.
   - Name each section by the interaction concept: for example, `Hero Particle Field That Follows The Mouse`, `Cursor Glow Hover On Cards`, or `Scroll Behavior And Section Reveal System`.

3. Write reusable prompts.
   - Keep prompts flexible enough for any brand, color system, card size, layout, or content model.
   - Focus on core idea, technology, implementation shape, interaction behavior, scroll choreography, performance, and accessibility.
   - Avoid hard-coded values unless the user explicitly asks for exact recreation. Do not lock prompts to one color, one size, one threshold, one DOM id, one card type, or one asset.
   - Prefer this structure:
     - Core idea
     - Technology
     - Implementation
     - Interaction
     - Success
   - For landing pages, expand the structure with a `Section anatomy` block. For each section, include:
     - Purpose: what the section must do in the story, trust-building, or conversion path.
     - Layout: grid, column behavior, media placement, sticky regions, card structure, CTA placement, spacing, and responsive collapse.
     - Visual details: typography, color behavior, surfaces, borders, shadows, media treatment, iconography, and density.
     - Animation: initial state, trigger, easing, duration, stagger, transform origin, opacity, blur, clip/mask, parallax depth, looping behavior, and settled state.
     - Interaction: hover, focus, tap/click, active/pressed, cursor, accordion, carousel, form, keyboard, loading, disabled, and error states.
     - Scroll interaction: reveal threshold, sticky/pinned beat, scrubbed values, parallax layers, section handoff, scroll progress, background/nav changes, and lower-section reveals.
     - Library/API: whether to use native CSS, IntersectionObserver, Web Animations API, Framer Motion/Motion One, GSAP ScrollTrigger, Lenis, Embla/Keen/Swiper, Rive/Lottie, or Three.js/WebGL.
   - Mention source-specific details only as examples or optional references, not mandatory requirements.

4. Capture screenshots for each prompt.
   - Use the Codex in-app browser when browser work is needed. If direct `file://` navigation is blocked, copy only the relevant HTML into a temporary isolated folder and serve it on localhost.
   - Capture multiple screenshots or motion frames for each prompt when the task is a daily UI inspiration article.
   - For live websites, capture the first viewport plus later scroll states from the website itself. Do not reuse a marketplace cover image as the motion-frame source.
   - After every scroll to a capture position, wait 2 seconds before taking the screenshot or frame so lazy-loaded media, reveal animations, sticky state changes, and scroll-triggered transitions can settle.
   - For live websites, capture one full-page scroll screenshot as a single tall image, then crop it section by section. The full-page image is the source of truth for section crops.
   - Cut the page into as many section images as the landing page actually has, including the hero, each middle section, and the footer. Keep crop boundaries exact and contiguous so no pixel rows are skipped between adjacent sections.
   - Record `fullPageImage` plus `sectionImages` metadata when creating a manifest. For each section image, include the section label, file path, source full-page image, y-start, y-end, and height when available.
   - In the article, show the full-page image and section images using the established structure: `### Full-Page And Section Evidence`, a normal Markdown image for the full-page screenshot, `#### Section Crops`, then normal Markdown images for the crops in page order. Do not render the y-start/y-end crop metadata below each image, do not use Markdown tables or raw HTML grids, and do not show the crops as a filename list.
   - For general single-reference prompt packs, capture at least one screenshot per prompt showing the specific section where the interaction happens.
   - Actuate the interaction before capture when needed: move the pointer for cursor effects, hover cards, scroll into pinned sections, or wait for canvas/particle motion.
   - Save images inside the target article folder with descriptive filenames such as `reference-01-hero-particles.png`.
   - Insert each screenshot immediately below its matching prompt heading.

5. Capture videos when requested.
   - Record one short local MP4 per inspiration or interaction when the user asks for video, motion study, or daily inspiration capture.
   - For Framer/live websites, record a slow scroll through the actual `pageUrl`: first viewport, section reveals, sticky navigation, parallax, marquee/carousel loops, hover states when obvious, and lower-page content.
   - Do not create a Ken Burns pan, zoom, or slideshow from the cover image and present it as website motion.
   - Embed the video directly in the article with a local relative path.
   - Extract representative frames from the video so the article can be scanned without playing it.
   - If live video is blocked, document the attempted URL and reason. For Framer/live websites, replace the candidate when possible instead of silently falling back to a cover image.

6. Create or update the article.
   - If the user points to an existing article, update that article's `content.md`.
   - If no article exists and the task is in the Content repo, create a dated article folder under `articles/YYYY-MM-DD-.../content.md`.
   - Keep local markdown image paths relative to the article folder.
   - Do not leave a standalone prompt file as the only deliverable when the user asked for an article.

7. Verify.
   - Run `git diff --check` on touched markdown.
   - Confirm every referenced screenshot and video file exists and is non-empty.
   - For daily UI inspiration articles, verify exactly 5 inspirations, 5 embedded videos or explicit fallback videos, and at least 4 screenshot/frame images per inspiration.
   - For live-website daily inspiration items, verify one full-page scroll screenshot exists and section crops cover the hero, all meaningful middle sections, and footer in top-to-bottom order.
   - Verify section crop coordinates are contiguous relative to the full-page image whenever coordinates are available.
   - Verify `content.md` follows the established full-page/section-crop structure for every live-website item, with rendered Markdown images and no text links, filename lists, Markdown tables, raw HTML grids, `Local Evidence` headings, or crop-coordinate captions.
   - For Framer/live-website inspirations, verify every item has a `pageUrl`, a live-site capture type such as `websiteScrollVideo`, an MP4 recorded from the actual page, and no cover-image fallback language.
   - Use `ffprobe` to confirm MP4 files are readable, then spot-check at least one Framer video per article to make sure it visibly scrolls the real website.
   - If the Content app/server is running, verify the article through its UI or API and scroll far enough for lazy-loaded images.
   - If verification is blocked, report what was checked locally.

8. Commit narrowly.
   - Stage only the article markdown and required screenshot assets. Use `git add -f` only for ignored article assets that must be committed.
   - Avoid staging unrelated dirty files.
   - Commit after the task when the workspace instructions require it.

## Prompt Style Rules

- Make prompts portable. Say "derive colors from the page theme" instead of naming one color.
- Make sizing adaptive. Say "scale density to the layout and device" instead of naming one particle count or card size.
- Make interaction clear. Describe how it should feel, what drives it, what data is measured, and how it settles.
- Make implementation practical. Name likely APIs and libraries, but allow the project's existing stack to win.
- Include reduced-motion and performance notes for animation-heavy prompts.
- Keep screenshots as evidence for the motion idea, not as exact style specs.

## Library Guidance

- Name a library only when it helps the builder choose an implementation path. Prefer the project's existing stack over adding a new dependency.
- Use CSS transitions/keyframes for simple hover, focus, opacity, transform, color, underline, background, and looping decorative states.
- Use IntersectionObserver or the Web Animations API for lightweight reveal-on-scroll when no timeline control is needed.
- Use Framer Motion or Motion One for React component entrances, layout transitions, shared element transitions, staggered lists, modals, drawers, and state-driven UI motion.
- Use GSAP with ScrollTrigger for complex scroll work: pinned sections, scrubbed timelines, multi-layer parallax, image-sequence scrubbing, masked text reveals, background transitions, and precise section handoffs.
- Use Lenis only when smooth scrolling materially supports the scroll choreography; do not add it as generic polish.
- Use CSS scroll-snap first for simple horizontal strips. Use Embla, Keen Slider, or Swiper when carousel controls, looping, drag physics, or responsive slide logic are needed.
- Use Rive or Lottie for authored vector/interface animations that need designer-controlled timelines. Pause or simplify them offscreen.
- Use Three.js/WebGL only for real 3D, shader, particle, or canvas scenes. Cap pixel ratio, pause offscreen, reduce density on mobile, and provide static fallbacks.
- Use CSS `position: sticky` for simple sticky panels. Use GSAP pinning only when the section needs timeline control, scrubbed values, or multi-element handoff.
- Every animation plan must include `prefers-reduced-motion`, touch-device behavior, keyboard/focus behavior, and performance constraints.
