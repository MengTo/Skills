# Grok Imagine Video Scrub Demo Prompt

## Generate the source video

Use **Grok Imagine Video** to generate three 6-second, 16:9, 720p calibration clips. Use Video mode, one prompt per clip, and no reference-image upload unless the user explicitly approves it. Keep the camera move continuous and center-safe so each clip can be mapped to scroll.

### Style 01 — Signal red brutalism

> Six-second continuous slow forward dolly, no cuts. A monumental matte-black orbital sculpture made of concentric rings, ceramic beads, and faceted planetary discs floats above an infinite vermilion-red studio floor. Brutalist Swiss editorial art direction, hard side light, black lacquer and red powder-coated metal, restrained haze, precise constant camera velocity. Center-safe object with quiet negative space on the left for editorial copy. No text, logos, captions, camera reversal, morphing, or flicker.

### Style 02 — Monochrome editorial

> Six-second continuous lateral-to-forward camera move, no cuts. Travel through a warm-white gallery containing a black wireframe world, tall monolithic arcs, and six small proof nodes that align into one exact route. Monochrome editorial-report art direction, high-contrast daylight, severe grid, documentary texture, graphic shadows, thin orbital lines, constant motion. Center-safe composition with quiet negative space on the left. No text, logos, captions, camera reversal, morphing, or flicker.

### Style 03 — Soft pearl sculpture

> Six-second continuous slow orbit, no cuts. Move around a floating pearl-white kinetic lattice sphere made from hundreds of small ceramic beads, twisting into one Möbius planetary form above warm ivory paper. Soft sculptural product-design art direction, diffuse daylight, shallow shadows, quiet grayscale, one coral signal node, exquisite material detail, constant speed. Center-safe composition with quiet negative space on the left. No text, logos, captions, camera reversal, morphing, or flicker.

Choose the strongest calibration clip, then regenerate or extend it at the final target settings if needed. Preserve the exact winning style preamble.

If the provider supports a negative prompt, use:

> hard cuts, jump zoom, whip pan, camera reversal, typography, labels, watermark, logo, UI, excessive particles, oversaturated neon, unstable geometry, morphing architecture, flicker

Record provider, model, prompt, seed when exposed, duration, aspect ratio, resolution, and rights beside the master. Encode the approved result with a small GOP before using it for scroll seeking.

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
