# Skill Demos

Every tracked skill has a portable demo and the exact prompt needed to recreate or remix it.

## Folder contract

```text
agent-skills/<category>/<skill-name>/
  SKILL.md
  demo/
    index.html
    PROMPT.md
    preview.jpg         # rendered 1280 x 720 browser screenshot
    source.json          # Neuform provenance and ranking snapshot
    assets/              # only when local assets are required
    input.md             # workflow skills
    expected-output.md   # workflow skills
```

- Keep HTML, CSS, and JavaScript in demo/index.html.
- Keep images, fonts, models, textures, and vendored files inside demo/assets/.
- Keep one rendered 1280 x 720 browser screenshot in demo/preview.jpg.
- Use relative paths and no build step.
- Keep the exact recreation prompt and a shorter remix prompt in demo/PROMPT.md.
- Use fictional portable data in workflow examples.
- Neuform-sourced demos preserve the real generated HTML and may retain pinned CDN runtime dependencies.
- Browse every rendered example in [SCREENSHOTS.md](SCREENSHOTS.md) or the [visual browser gallery](SCREENSHOTS.html).

Run any demo with:

```bash
python3 -m http.server 4173 -d agent-skills/<category>/<skill-name>/demo
```

Fill missing demo files without replacing hand-tuned examples:

```bash
node scripts/backfill-skill-demos.mjs
```

Refresh exact Neuform matches from their current top-ranked public design:

```bash
node scripts/sync-neuform-skill-demos.mjs
```

Rebuild the screenshot gallery after refreshing browser captures:

```bash
node scripts/build-demo-screenshot-gallery.mjs
```

Use --force only when every locally generated demo should be intentionally regenerated. Source-derived demos are never replaced by the generic backfill.

## Library coverage

- Total: 79
- codex: 12
- media: 2
- ui: 1
- web-design: 64

## Demo index

| Skill | Category | Demo | Preview | Prompt | Source |
| --- | --- | --- | --- | --- | --- |
| audit-verify-explain-grade-5 | codex | [Open](agent-skills/codex/audit-verify-explain-grade-5/demo/index.html) | [Preview](agent-skills/codex/audit-verify-explain-grade-5/demo/preview.jpg) | [Prompt](agent-skills/codex/audit-verify-explain-grade-5/demo/PROMPT.md) | Local |
| browser-video-recording | codex | [Open](agent-skills/codex/browser-video-recording/demo/index.html) | [Preview](agent-skills/codex/browser-video-recording/demo/preview.jpg) | [Prompt](agent-skills/codex/browser-video-recording/demo/PROMPT.md) | Local |
| customer-email-draft-threads | codex | [Open](agent-skills/codex/customer-email-draft-threads/demo/index.html) | [Preview](agent-skills/codex/customer-email-draft-threads/demo/preview.jpg) | [Prompt](agent-skills/codex/customer-email-draft-threads/demo/PROMPT.md) | Local |
| customer-support-verification | codex | [Open](agent-skills/codex/customer-support-verification/demo/index.html) | [Preview](agent-skills/codex/customer-support-verification/demo/preview.jpg) | [Prompt](agent-skills/codex/customer-support-verification/demo/PROMPT.md) | Local |
| daily-ui-inspiration-capture | codex | [Open](agent-skills/codex/daily-ui-inspiration-capture/demo/index.html) | [Preview](agent-skills/codex/daily-ui-inspiration-capture/demo/preview.jpg) | [Prompt](agent-skills/codex/daily-ui-inspiration-capture/demo/PROMPT.md) | Local |
| elevenlabs-tts | codex | [Open](agent-skills/codex/elevenlabs-tts/demo/index.html) | [Preview](agent-skills/codex/elevenlabs-tts/demo/preview.jpg) | [Prompt](agent-skills/codex/elevenlabs-tts/demo/PROMPT.md) | Local |
| html-to-interaction-prompts | codex | [Open](agent-skills/codex/html-to-interaction-prompts/demo/index.html) | [Preview](agent-skills/codex/html-to-interaction-prompts/demo/preview.jpg) | [Prompt](agent-skills/codex/html-to-interaction-prompts/demo/PROMPT.md) | Local |
| optimize-web-animations | codex | [Open](agent-skills/codex/optimize-web-animations/demo/index.html) | [Preview](agent-skills/codex/optimize-web-animations/demo/preview.jpg) | [Prompt](agent-skills/codex/optimize-web-animations/demo/PROMPT.md) | Local |
| performance-profiling | codex | [Open](agent-skills/codex/performance-profiling/demo/index.html) | [Preview](agent-skills/codex/performance-profiling/demo/preview.jpg) | [Prompt](agent-skills/codex/performance-profiling/demo/PROMPT.md) | Local |
| stitched-full-page-capture | codex | [Open](agent-skills/codex/stitched-full-page-capture/demo/index.html) | [Preview](agent-skills/codex/stitched-full-page-capture/demo/preview.jpg) | [Prompt](agent-skills/codex/stitched-full-page-capture/demo/PROMPT.md) | Local |
| video-to-superprompt | codex | [Open](agent-skills/codex/video-to-superprompt/demo/index.html) | [Preview](agent-skills/codex/video-to-superprompt/demo/preview.jpg) | [Prompt](agent-skills/codex/video-to-superprompt/demo/PROMPT.md) | Local |
| x-bookmark-quote-posts | codex | [Open](agent-skills/codex/x-bookmark-quote-posts/demo/index.html) | [Preview](agent-skills/codex/x-bookmark-quote-posts/demo/preview.jpg) | [Prompt](agent-skills/codex/x-bookmark-quote-posts/demo/PROMPT.md) | Local |
| aura-asset-images | media | [Open](agent-skills/media/aura-asset-images/demo/index.html) | [Preview](agent-skills/media/aura-asset-images/demo/preview.jpg) | [Prompt](agent-skills/media/aura-asset-images/demo/PROMPT.md) | [Neuform #1 · 2,154 views](agent-skills/media/aura-asset-images/demo/source.json) |
| unsplash-asset-images | media | [Open](agent-skills/media/unsplash-asset-images/demo/index.html) | [Preview](agent-skills/media/unsplash-asset-images/demo/preview.jpg) | [Prompt](agent-skills/media/unsplash-asset-images/demo/PROMPT.md) | Local |
| design-first-ui-prompting | ui | [Open](agent-skills/ui/design-first-ui-prompting/demo/index.html) | [Preview](agent-skills/ui/design-first-ui-prompting/demo/preview.jpg) | [Prompt](agent-skills/ui/design-first-ui-prompting/demo/PROMPT.md) | Local |
| agency-grid-layout-minimal | web-design | [Open](agent-skills/web-design/agency-grid-layout-minimal/demo/index.html) | [Preview](agent-skills/web-design/agency-grid-layout-minimal/demo/preview.jpg) | [Prompt](agent-skills/web-design/agency-grid-layout-minimal/demo/PROMPT.md) | [Neuform #1 · 731 views](agent-skills/web-design/agency-grid-layout-minimal/demo/source.json) |
| animation-on-scroll | web-design | [Open](agent-skills/web-design/animation-on-scroll/demo/index.html) | [Preview](agent-skills/web-design/animation-on-scroll/demo/preview.jpg) | [Prompt](agent-skills/web-design/animation-on-scroll/demo/PROMPT.md) | Local |
| animation-systems | web-design | [Open](agent-skills/web-design/animation-systems/demo/index.html) | [Preview](agent-skills/web-design/animation-systems/demo/preview.jpg) | [Prompt](agent-skills/web-design/animation-systems/demo/PROMPT.md) | Local |
| atmosphere-background | web-design | [Open](agent-skills/web-design/atmosphere-background/demo/index.html) | [Preview](agent-skills/web-design/atmosphere-background/demo/preview.jpg) | [Prompt](agent-skills/web-design/atmosphere-background/demo/PROMPT.md) | Local |
| background-grid-webgl | web-design | [Open](agent-skills/web-design/background-grid-webgl/demo/index.html) | [Preview](agent-skills/web-design/background-grid-webgl/demo/preview.jpg) | [Prompt](agent-skills/web-design/background-grid-webgl/demo/PROMPT.md) | [Neuform #1 · 351 views](agent-skills/web-design/background-grid-webgl/demo/source.json) |
| beautiful-shadows | web-design | [Open](agent-skills/web-design/beautiful-shadows/demo/index.html) | [Preview](agent-skills/web-design/beautiful-shadows/demo/preview.jpg) | [Prompt](agent-skills/web-design/beautiful-shadows/demo/PROMPT.md) | [Neuform #1 · 1,953 views](agent-skills/web-design/beautiful-shadows/demo/source.json) |
| blue-cloudy-clean-modern | web-design | [Open](agent-skills/web-design/blue-cloudy-clean-modern/demo/index.html) | [Preview](agent-skills/web-design/blue-cloudy-clean-modern/demo/preview.jpg) | [Prompt](agent-skills/web-design/blue-cloudy-clean-modern/demo/PROMPT.md) | [Neuform #1 · 351 views](agent-skills/web-design/blue-cloudy-clean-modern/demo/source.json) |
| blue-laser-clean-glass-layout | web-design | [Open](agent-skills/web-design/blue-laser-clean-glass-layout/demo/index.html) | [Preview](agent-skills/web-design/blue-laser-clean-glass-layout/demo/preview.jpg) | [Prompt](agent-skills/web-design/blue-laser-clean-glass-layout/demo/PROMPT.md) | Local |
| book-serif-index | web-design | [Open](agent-skills/web-design/book-serif-index/demo/index.html) | [Preview](agent-skills/web-design/book-serif-index/demo/preview.jpg) | [Prompt](agent-skills/web-design/book-serif-index/demo/PROMPT.md) | [Neuform #1 · 80 views](agent-skills/web-design/book-serif-index/demo/source.json) |
| bright-green-tech-system-webgl | web-design | [Open](agent-skills/web-design/bright-green-tech-system-webgl/demo/index.html) | [Preview](agent-skills/web-design/bright-green-tech-system-webgl/demo/preview.jpg) | [Prompt](agent-skills/web-design/bright-green-tech-system-webgl/demo/PROMPT.md) | Local |
| cinematic-gsap-lenis-motion-system | web-design | [Open](agent-skills/web-design/cinematic-gsap-lenis-motion-system/demo/index.html) | [Preview](agent-skills/web-design/cinematic-gsap-lenis-motion-system/demo/preview.jpg) | [Prompt](agent-skills/web-design/cinematic-gsap-lenis-motion-system/demo/PROMPT.md) | Local |
| cinematic-scroll-storytelling | web-design | [Open](agent-skills/web-design/cinematic-scroll-storytelling/demo/index.html) | [Preview](agent-skills/web-design/cinematic-scroll-storytelling/demo/preview.jpg) | [Prompt](agent-skills/web-design/cinematic-scroll-storytelling/demo/PROMPT.md) | Local |
| clean-minimal-beige-light-mode | web-design | [Open](agent-skills/web-design/clean-minimal-beige-light-mode/demo/index.html) | [Preview](agent-skills/web-design/clean-minimal-beige-light-mode/demo/preview.jpg) | [Prompt](agent-skills/web-design/clean-minimal-beige-light-mode/demo/PROMPT.md) | [Neuform #1 · 744 views](agent-skills/web-design/clean-minimal-beige-light-mode/demo/source.json) |
| cobejs | web-design | [Open](agent-skills/web-design/cobejs/demo/index.html) | [Preview](agent-skills/web-design/cobejs/demo/preview.jpg) | [Prompt](agent-skills/web-design/cobejs/demo/PROMPT.md) | Local |
| company-logos | web-design | [Open](agent-skills/web-design/company-logos/demo/index.html) | [Preview](agent-skills/web-design/company-logos/demo/preview.jpg) | [Prompt](agent-skills/web-design/company-logos/demo/PROMPT.md) | [Neuform #1 · 435 views](agent-skills/web-design/company-logos/demo/source.json) |
| container-lines | web-design | [Open](agent-skills/web-design/container-lines/demo/index.html) | [Preview](agent-skills/web-design/container-lines/demo/preview.jpg) | [Prompt](agent-skills/web-design/container-lines/demo/PROMPT.md) | [Neuform #1 · 2,154 views](agent-skills/web-design/container-lines/demo/source.json) |
| corner-diagonals | web-design | [Open](agent-skills/web-design/corner-diagonals/demo/index.html) | [Preview](agent-skills/web-design/corner-diagonals/demo/preview.jpg) | [Prompt](agent-skills/web-design/corner-diagonals/demo/PROMPT.md) | [Neuform #1 · 1,953 views](agent-skills/web-design/corner-diagonals/demo/source.json) |
| corner-lasers | web-design | [Open](agent-skills/web-design/corner-lasers/demo/index.html) | [Preview](agent-skills/web-design/corner-lasers/demo/preview.jpg) | [Prompt](agent-skills/web-design/corner-lasers/demo/PROMPT.md) | [Neuform #1 · 278 views](agent-skills/web-design/corner-lasers/demo/source.json) |
| css-alpha-masking | web-design | [Open](agent-skills/web-design/css-alpha-masking/demo/index.html) | [Preview](agent-skills/web-design/css-alpha-masking/demo/preview.jpg) | [Prompt](agent-skills/web-design/css-alpha-masking/demo/PROMPT.md) | Local |
| css-border-gradient | web-design | [Open](agent-skills/web-design/css-border-gradient/demo/index.html) | [Preview](agent-skills/web-design/css-border-gradient/demo/preview.jpg) | [Prompt](agent-skills/web-design/css-border-gradient/demo/PROMPT.md) | [Neuform #1 · 2,154 views](agent-skills/web-design/css-border-gradient/demo/source.json) |
| dark-blue-contrasting-clean | web-design | [Open](agent-skills/web-design/dark-blue-contrasting-clean/demo/index.html) | [Preview](agent-skills/web-design/dark-blue-contrasting-clean/demo/preview.jpg) | [Prompt](agent-skills/web-design/dark-blue-contrasting-clean/demo/PROMPT.md) | Local |
| dark-glass-clean-layout | web-design | [Open](agent-skills/web-design/dark-glass-clean-layout/demo/index.html) | [Preview](agent-skills/web-design/dark-glass-clean-layout/demo/preview.jpg) | [Prompt](agent-skills/web-design/dark-glass-clean-layout/demo/PROMPT.md) | Local |
| dither-background | web-design | [Open](agent-skills/web-design/dither-background/demo/index.html) | [Preview](agent-skills/web-design/dither-background/demo/preview.jpg) | [Prompt](agent-skills/web-design/dither-background/demo/PROMPT.md) | [Neuform #1 · 1,043 views](agent-skills/web-design/dither-background/demo/source.json) |
| dither-laser-dark-mode | web-design | [Open](agent-skills/web-design/dither-laser-dark-mode/demo/index.html) | [Preview](agent-skills/web-design/dither-laser-dark-mode/demo/preview.jpg) | [Prompt](agent-skills/web-design/dither-laser-dark-mode/demo/PROMPT.md) | [Neuform #1 · 322 views](agent-skills/web-design/dither-laser-dark-mode/demo/source.json) |
| editorial-tech | web-design | [Open](agent-skills/web-design/editorial-tech/demo/index.html) | [Preview](agent-skills/web-design/editorial-tech/demo/preview.jpg) | [Prompt](agent-skills/web-design/editorial-tech/demo/PROMPT.md) | [Neuform #1 · 607 views](agent-skills/web-design/editorial-tech/demo/source.json) |
| framed-grid-layout | web-design | [Open](agent-skills/web-design/framed-grid-layout/demo/index.html) | [Preview](agent-skills/web-design/framed-grid-layout/demo/preview.jpg) | [Prompt](agent-skills/web-design/framed-grid-layout/demo/PROMPT.md) | [Neuform #1 · 1,043 views](agent-skills/web-design/framed-grid-layout/demo/source.json) |
| framed-tech-dark-border-gradient | web-design | [Open](agent-skills/web-design/framed-tech-dark-border-gradient/demo/index.html) | [Preview](agent-skills/web-design/framed-tech-dark-border-gradient/demo/preview.jpg) | [Prompt](agent-skills/web-design/framed-tech-dark-border-gradient/demo/PROMPT.md) | Local |
| funky-purple-container-tech | web-design | [Open](agent-skills/web-design/funky-purple-container-tech/demo/index.html) | [Preview](agent-skills/web-design/funky-purple-container-tech/demo/preview.jpg) | [Prompt](agent-skills/web-design/funky-purple-container-tech/demo/PROMPT.md) | Local |
| glass-dark-mode-clock | web-design | [Open](agent-skills/web-design/glass-dark-mode-clock/demo/index.html) | [Preview](agent-skills/web-design/glass-dark-mode-clock/demo/preview.jpg) | [Prompt](agent-skills/web-design/glass-dark-mode-clock/demo/PROMPT.md) | [Neuform #1 · 1,043 views](agent-skills/web-design/glass-dark-mode-clock/demo/source.json) |
| glass-dark-ui | web-design | [Open](agent-skills/web-design/glass-dark-ui/demo/index.html) | [Preview](agent-skills/web-design/glass-dark-ui/demo/preview.jpg) | [Prompt](agent-skills/web-design/glass-dark-ui/demo/PROMPT.md) | Local |
| globe-gl | web-design | [Open](agent-skills/web-design/globe-gl/demo/index.html) | [Preview](agent-skills/web-design/globe-gl/demo/preview.jpg) | [Prompt](agent-skills/web-design/globe-gl/demo/PROMPT.md) | Local |
| globe-particles | web-design | [Open](agent-skills/web-design/globe-particles/demo/index.html) | [Preview](agent-skills/web-design/globe-particles/demo/preview.jpg) | [Prompt](agent-skills/web-design/globe-particles/demo/PROMPT.md) | [Neuform #1 · 607 views](agent-skills/web-design/globe-particles/demo/source.json) |
| gooey-blob-system | web-design | [Open](agent-skills/web-design/gooey-blob-system/demo/index.html) | [Preview](agent-skills/web-design/gooey-blob-system/demo/preview.jpg) | [Prompt](agent-skills/web-design/gooey-blob-system/demo/PROMPT.md) | [Neuform #1 · 170 views](agent-skills/web-design/gooey-blob-system/demo/source.json) |
| gsap-scrolltrigger-storytelling | web-design | [Open](agent-skills/web-design/gsap-scrolltrigger-storytelling/demo/index.html) | [Preview](agent-skills/web-design/gsap-scrolltrigger-storytelling/demo/preview.jpg) | [Prompt](agent-skills/web-design/gsap-scrolltrigger-storytelling/demo/PROMPT.md) | [Neuform #1 · 78 views](agent-skills/web-design/gsap-scrolltrigger-storytelling/demo/source.json) |
| gsap | web-design | [Open](agent-skills/web-design/gsap/demo/index.html) | [Preview](agent-skills/web-design/gsap/demo/preview.jpg) | [Prompt](agent-skills/web-design/gsap/demo/PROMPT.md) | [Neuform #1 · 857 views](agent-skills/web-design/gsap/demo/source.json) |
| high-contrast-skeuomorphic-clean | web-design | [Open](agent-skills/web-design/high-contrast-skeuomorphic-clean/demo/index.html) | [Preview](agent-skills/web-design/high-contrast-skeuomorphic-clean/demo/preview.jpg) | [Prompt](agent-skills/web-design/high-contrast-skeuomorphic-clean/demo/PROMPT.md) | [Neuform #1 · 851 views](agent-skills/web-design/high-contrast-skeuomorphic-clean/demo/source.json) |
| image-first-grid-layout | web-design | [Open](agent-skills/web-design/image-first-grid-layout/demo/index.html) | [Preview](agent-skills/web-design/image-first-grid-layout/demo/preview.jpg) | [Prompt](agent-skills/web-design/image-first-grid-layout/demo/PROMPT.md) | [Neuform #1 · 2,154 views](agent-skills/web-design/image-first-grid-layout/demo/source.json) |
| landing-page | web-design | [Open](agent-skills/web-design/landing-page/demo/index.html) | [Preview](agent-skills/web-design/landing-page/demo/preview.jpg) | [Prompt](agent-skills/web-design/landing-page/demo/PROMPT.md) | Local |
| light-mode-paper-technical | web-design | [Open](agent-skills/web-design/light-mode-paper-technical/demo/index.html) | [Preview](agent-skills/web-design/light-mode-paper-technical/demo/preview.jpg) | [Prompt](agent-skills/web-design/light-mode-paper-technical/demo/PROMPT.md) | [Neuform #1 · 351 views](agent-skills/web-design/light-mode-paper-technical/demo/source.json) |
| marquee-loop | web-design | [Open](agent-skills/web-design/marquee-loop/demo/index.html) | [Preview](agent-skills/web-design/marquee-loop/demo/preview.jpg) | [Prompt](agent-skills/web-design/marquee-loop/demo/PROMPT.md) | [Neuform #1 · 353 views](agent-skills/web-design/marquee-loop/demo/source.json) |
| masked-reveal | web-design | [Open](agent-skills/web-design/masked-reveal/demo/index.html) | [Preview](agent-skills/web-design/masked-reveal/demo/preview.jpg) | [Prompt](agent-skills/web-design/masked-reveal/demo/PROMPT.md) | [Neuform #1 · 2,154 views](agent-skills/web-design/masked-reveal/demo/source.json) |
| matterjs | web-design | [Open](agent-skills/web-design/matterjs/demo/index.html) | [Preview](agent-skills/web-design/matterjs/demo/preview.jpg) | [Prompt](agent-skills/web-design/matterjs/demo/PROMPT.md) | Local |
| mesh-gradient-dark-blue-clean | web-design | [Open](agent-skills/web-design/mesh-gradient-dark-blue-clean/demo/index.html) | [Preview](agent-skills/web-design/mesh-gradient-dark-blue-clean/demo/preview.jpg) | [Prompt](agent-skills/web-design/mesh-gradient-dark-blue-clean/demo/PROMPT.md) | [Neuform #1 · 1,043 views](agent-skills/web-design/mesh-gradient-dark-blue-clean/demo/source.json) |
| nested-container-clean-agency | web-design | [Open](agent-skills/web-design/nested-container-clean-agency/demo/index.html) | [Preview](agent-skills/web-design/nested-container-clean-agency/demo/preview.jpg) | [Prompt](agent-skills/web-design/nested-container-clean-agency/demo/PROMPT.md) | [Neuform #1 · 351 views](agent-skills/web-design/nested-container-clean-agency/demo/source.json) |
| nested-container-frames | web-design | [Open](agent-skills/web-design/nested-container-frames/demo/index.html) | [Preview](agent-skills/web-design/nested-container-frames/demo/preview.jpg) | [Prompt](agent-skills/web-design/nested-container-frames/demo/PROMPT.md) | [Neuform #1 · 351 views](agent-skills/web-design/nested-container-frames/demo/source.json) |
| number-details | web-design | [Open](agent-skills/web-design/number-details/demo/index.html) | [Preview](agent-skills/web-design/number-details/demo/preview.jpg) | [Prompt](agent-skills/web-design/number-details/demo/PROMPT.md) | [Neuform #1 · 322 views](agent-skills/web-design/number-details/demo/source.json) |
| orange-clean-paper-saas | web-design | [Open](agent-skills/web-design/orange-clean-paper-saas/demo/index.html) | [Preview](agent-skills/web-design/orange-clean-paper-saas/demo/preview.jpg) | [Prompt](agent-skills/web-design/orange-clean-paper-saas/demo/PROMPT.md) | [Neuform #1 · 542 views](agent-skills/web-design/orange-clean-paper-saas/demo/source.json) |
| pricing-page | web-design | [Open](agent-skills/web-design/pricing-page/demo/index.html) | [Preview](agent-skills/web-design/pricing-page/demo/preview.jpg) | [Prompt](agent-skills/web-design/pricing-page/demo/PROMPT.md) | Local |
| progressive-blur | web-design | [Open](agent-skills/web-design/progressive-blur/demo/index.html) | [Preview](agent-skills/web-design/progressive-blur/demo/preview.jpg) | [Prompt](agent-skills/web-design/progressive-blur/demo/PROMPT.md) | [Neuform #1 · 381 views](agent-skills/web-design/progressive-blur/demo/source.json) |
| reveal-hover-effect | web-design | [Open](agent-skills/web-design/reveal-hover-effect/demo/index.html) | [Preview](agent-skills/web-design/reveal-hover-effect/demo/preview.jpg) | [Prompt](agent-skills/web-design/reveal-hover-effect/demo/PROMPT.md) | Local |
| scroll-world-storytelling | web-design | [Open](agent-skills/web-design/scroll-world-storytelling/demo/index.html) | [Preview](agent-skills/web-design/scroll-world-storytelling/demo/preview.jpg) | [Prompt](agent-skills/web-design/scroll-world-storytelling/demo/PROMPT.md) | Local |
| skeuomorphic-ui | web-design | [Open](agent-skills/web-design/skeuomorphic-ui/demo/index.html) | [Preview](agent-skills/web-design/skeuomorphic-ui/demo/preview.jpg) | [Prompt](agent-skills/web-design/skeuomorphic-ui/demo/PROMPT.md) | [Neuform #1 · 2,154 views](agent-skills/web-design/skeuomorphic-ui/demo/source.json) |
| solar-duotone-bold | web-design | [Open](agent-skills/web-design/solar-duotone-bold/demo/index.html) | [Preview](agent-skills/web-design/solar-duotone-bold/demo/preview.jpg) | [Prompt](agent-skills/web-design/solar-duotone-bold/demo/PROMPT.md) | [Neuform #1 · 351 views](agent-skills/web-design/solar-duotone-bold/demo/source.json) |
| split-layout-technical | web-design | [Open](agent-skills/web-design/split-layout-technical/demo/index.html) | [Preview](agent-skills/web-design/split-layout-technical/demo/preview.jpg) | [Prompt](agent-skills/web-design/split-layout-technical/demo/PROMPT.md) | [Neuform #1 · 2,154 views](agent-skills/web-design/split-layout-technical/demo/source.json) |
| staggered-word-reveal | web-design | [Open](agent-skills/web-design/staggered-word-reveal/demo/index.html) | [Preview](agent-skills/web-design/staggered-word-reveal/demo/preview.jpg) | [Prompt](agent-skills/web-design/staggered-word-reveal/demo/PROMPT.md) | Local |
| tailwindcss | web-design | [Open](agent-skills/web-design/tailwindcss/demo/index.html) | [Preview](agent-skills/web-design/tailwindcss/demo/preview.jpg) | [Prompt](agent-skills/web-design/tailwindcss/demo/PROMPT.md) | Local |
| tech-green-dark-mode-modern | web-design | [Open](agent-skills/web-design/tech-green-dark-mode-modern/demo/index.html) | [Preview](agent-skills/web-design/tech-green-dark-mode-modern/demo/preview.jpg) | [Prompt](agent-skills/web-design/tech-green-dark-mode-modern/demo/PROMPT.md) | Local |
| technical-wireframe-info-layout | web-design | [Open](agent-skills/web-design/technical-wireframe-info-layout/demo/index.html) | [Preview](agent-skills/web-design/technical-wireframe-info-layout/demo/preview.jpg) | [Prompt](agent-skills/web-design/technical-wireframe-info-layout/demo/PROMPT.md) | [Neuform #1 · 1,424 views](agent-skills/web-design/technical-wireframe-info-layout/demo/source.json) |
| threejs | web-design | [Open](agent-skills/web-design/threejs/demo/index.html) | [Preview](agent-skills/web-design/threejs/demo/preview.jpg) | [Prompt](agent-skills/web-design/threejs/demo/PROMPT.md) | Local |
| unicorn-studio | web-design | [Open](agent-skills/web-design/unicorn-studio/demo/index.html) | [Preview](agent-skills/web-design/unicorn-studio/demo/preview.jpg) | [Prompt](agent-skills/web-design/unicorn-studio/demo/PROMPT.md) | Local |
| vantajs | web-design | [Open](agent-skills/web-design/vantajs/demo/index.html) | [Preview](agent-skills/web-design/vantajs/demo/preview.jpg) | [Prompt](agent-skills/web-design/vantajs/demo/PROMPT.md) | Local |
| webgl-3d-object | web-design | [Open](agent-skills/web-design/webgl-3d-object/demo/index.html) | [Preview](agent-skills/web-design/webgl-3d-object/demo/preview.jpg) | [Prompt](agent-skills/web-design/webgl-3d-object/demo/PROMPT.md) | [Neuform #1 · 405 views](agent-skills/web-design/webgl-3d-object/demo/source.json) |
| webgl-landing-steering | web-design | [Open](agent-skills/web-design/webgl-landing-steering/demo/index.html) | [Preview](agent-skills/web-design/webgl-landing-steering/demo/preview.jpg) | [Prompt](agent-skills/web-design/webgl-landing-steering/demo/PROMPT.md) | Local |
| webgl-laser | web-design | [Open](agent-skills/web-design/webgl-laser/demo/index.html) | [Preview](agent-skills/web-design/webgl-laser/demo/preview.jpg) | [Prompt](agent-skills/web-design/webgl-laser/demo/PROMPT.md) | [Neuform #1 · 351 views](agent-skills/web-design/webgl-laser/demo/source.json) |
