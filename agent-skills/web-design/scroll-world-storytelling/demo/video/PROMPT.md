# Video Scrub Demo Prompt

## Generate the source video

Create one 8-second 16:9 cinematic video at 1920×1080.

Single continuous slow forward camera move, no cuts. Fly through a near-black editorial cosmic field toward a luminous amber planet wrapped in thin cyan orbital routes. Pass a chain of six translucent technical monoliths connected by one glowing route, representing destination, fence, bar, loop, route, and proof. The structures should feel architectural and precise, with warm parchment highlights, subtle volumetric haze, restrained film grain, slow parallax, and a clear visual destination. Keep important objects center-safe and leave quiet negative space on the left for editorial copy. Premium field-manual art direction, amber and electric cyan accents, deep navy-black space, realistic light, graceful constant forward velocity. No text, no logos, no captions, no cuts, no camera reversal, no flicker.

If the provider supports a negative prompt, use:

> hard cuts, jump zoom, whip pan, camera reversal, typography, labels, watermark, logo, UI, excessive particles, oversaturated neon, unstable geometry, morphing architecture, flicker

Record provider, model, seed, duration, aspect ratio, and rights beside the master. Encode the approved result with a small GOP before using it for scroll seeking.

## Build the landing page

Use $scroll-world-storytelling in **Video scrub** mode to recreate `demo/video/index.html`.

- Use a pinned full-viewport local `<video>` and native document scrolling.
- Map total page progress deterministically to video `currentTime`.
- Coalesce seeking through `requestAnimationFrame`; stop when the requested time is settled.
- Use six chapters: Destination, Fence, Bar, Loop, Route, Proof.
- Keep a fixed route rail, progress line, chapter number, back link, scroll cue, and one final CTA.
- Make backward scrolling restore prior frames and chapter states exactly.
- Use the first frame as poster and never autoplay audio.
- On reduced motion, keep the poster static and present every chapter in normal reading order.
- Use local assets only, no framework, no CDN, and no build step.
- Verify 390px and desktop widths, fast flicks, reverse scroll, video duration, current-time changes, console state, and failed requests.

## Remix prompt

Use $scroll-world-storytelling in Video scrub mode for my supplied story. First return the 5–7 beat ledger, style bible, and exact continuous-shot generation prompt. After approval, generate or prepare the clip, encode it for seeking, build the page, and verify reversible scroll, mobile composition, reduced motion, local asset loading, and factual integrity.
