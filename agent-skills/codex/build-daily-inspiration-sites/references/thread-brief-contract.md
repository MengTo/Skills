# Thread brief contract

Use this contract for every inspiration item. Replace every angle-bracketed field before creating the task.

## Identity block

```text
Reference item: <REFERENCE_TITLE> by <CREATOR>
New identity: <NEW_BRAND>, <ONE-SENTENCE POSITIONING>
Audience: <PRIMARY AUDIENCE>
Offer: <PRODUCT OR SERVICE>
Conversion goal: <PRIMARY CTA AND OUTCOME>
Project directory: <UNIQUE-SLUG>
```

The new identity must be original and internally coherent. Create fresh navigation labels, headlines, body copy, names, testimonials, companies, locations, service or feature names, statistics, percentages, dates, pricing, packages, claims, URLs, legal text, interface examples, photography, and decorative words. Do not lightly paraphrase the reference.

## Evidence block

```text
Article manifest: <ABSOLUTE_MANIFEST_PATH>
Article prompt pack: <ABSOLUTE_CONTENT_PATH>
Live page: <PAGE_URL>
```

Immediately after the evidence block, attach exactly one image by inserting this as non-fenced Markdown with its placeholders replaced:

`![Full-page reference — <REFERENCE_TITLE>](<ABSOLUTE_FULL_PAGE_IMAGE_PATH>)`

The absolute path must appear only as the Markdown image target so the Codex task renders it as an image attachment; do not list it as plain text. Do not attach a representative still, MP4, motion frame, section crop, or any second image. If the task-creation surface cannot render the local image, stop and report the blocker instead of falling back to a path-only handoff.

Inspect the attached full-page image before implementation. Use it as evidence for visible layout, hierarchy, pacing, contrast, spacing, and image treatment—not as permission to reuse assets or identity. Do not infer source motion, interactions, or implementation details from the static image.

## Required task prompt

```text
Use the @Sites plugin and follow both sites:sites-building and sites:sites-hosting completely.

Build exactly one original, one-route landing page as a private Sites deployment. The result must be a single semantic HTML landing page. The Sites starter may implement it through app/page.tsx, but do not create a dashboard, generic app shell, or multiple routes. Initialize the Sites project immediately.

Read the manifest and content prompt first, then inspect the single attached full-page reference image. Use the reference only for high-level visual taste, visible layout logic, section pacing, contrast, spacing, and image treatment. Do not infer source motion, interaction behavior, or implementation technique from the static image.

Make the page unmistakably original. Replace every source identity and every piece of visible content: brand, logo treatment, wordmark, navigation, headlines, body copy, people, companies, testimonials, metrics, percentages, counts, dates, prices, plan names, package names, URLs, legal text, CTAs, screenshots, photography, captions, and decorative wording. Do not lightly paraphrase the reference and do not reuse source assets.

Implement the complete landing page described by the item prompt: page shell, header, hero, proof or trust, feature or service modules, product or media demonstration, process, work or case studies where appropriate, testimonials, pricing or packages where appropriate, FAQ, final CTA, footer, responsive behavior, accessible keyboard and focus behavior, reduced-motion behavior, and polished interaction states.

Create restrained, maintainable interaction behavior appropriate to the new page rather than claiming to reproduce reference motion. Prefer the existing project stack. Use CSS for simple micro-interactions, IntersectionObserver or Web Animations API for lightweight reveals, Framer Motion or Motion One for state-driven React motion, GSAP ScrollTrigger only for justified pinned or scrubbed sequences, and a carousel library only when CSS scroll snap is insufficient. Preserve performance and provide reduced-motion fallbacks.

Use purposeful original or appropriately licensed imagery where the concept needs it. Do not create model-authored SVG illustrations. Keep visual and motion quality high, but prioritize a complete usable site over ornamental effects.

Because this is a background task, skip interactive browser preview unless it is needed to resolve a blocker. Use only the Codex in-app browser if browser work is necessary; never use Chrome.

Run the required production build, fix failures, commit only this site's validated source, publish privately through Sites, and complete the Sites handoff. In the final response, provide the private Sites URL, source location, commit, and a concise explanation of how the brand, copy, numbers, visuals, and interaction system were made original.
```

## Per-item additions

Add a short paragraph after the required task prompt that names the exact reference traits to preserve and the exact new content world to build. Make it specific enough to prevent a generic AI landing page.

Example shape:

```text
Keep the reference's cinematic editorial pacing, oversized typography, image-led case-study modules, and restrained atmospheric motion. Rebuild those principles for <NEW_BRAND>'s <CATEGORY> story using entirely new projects, client names, claims, figures, art direction, and imagery.
```

Do not include source code from the reference, copied copy, or downloaded source media in the brief.
