# Course-cover variant prompts

Read this file only when preparing the three GPT-Image 2 jobs.

## Shared input roles

Label every supplied image in the prompt:

- **Image 1 — tutorial cover reference:** source of palette, typography mood, logo/title treatment, and product identity.
- **Image 2 — instructor identity reference:** the selected frame from the first lesson video.
- **Image 3 — official logo asset:** exact logo or wordmark to preserve. Omit only when Image 1 already preserves it as locked artwork.

Use case: `ads-marketing`.

Shared constraints:

- Course title (verbatim): `"<COURSE_TITLE>"`.
- Tool/product logo: preserve the supplied official asset exactly; no redesign, extra letters, or alternate marks.
- Canvas: production course cover, 16:9, safe for center-cropped hero and card thumbnail.
- Match the supplied tutorial cover’s visual family while creating a new composition for this course.
- No watermarks, gibberish UI text, unrelated logos, duplicate people, or decorative copy.
- Reserve the project’s existing play-control area; keep essential face and text outside it.

## 01 — Portrait / clean

```text
Use case: ads-marketing
Asset type: Course cover option 01
Primary request: Create a cinematic course cover using the supplied course identity and the real instructor portrait.
Input images: Image 1 is the tutorial-cover style reference; Image 2 is the instructor identity reference; Image 3 is the exact official logo.
Subject: One instructor only, recognizable from Image 2, natural confident expression, polished head-and-shoulders framing.
Composition/framing: Strong portrait-led composition with clear negative space for the exact logo and course title; safe for 16:9 hero and card crops.
Text (verbatim): "<COURSE_TITLE>"
Constraints: Preserve identity, logo, and title exactly. No large teaser heading. No additional copy.
Avoid: invented face, extra person, distorted logo, misspelled text, pseudo-UI, watermark.
```

## 02 — Portrait / hook

First write several truthful 1–5 word hooks from the course promise, then choose the clearest one. Do not use the full course title as the hook.

```text
Use case: ads-marketing
Asset type: Course cover option 02
Primary request: Create a cinematic YouTube-style course cover using the supplied course identity, real instructor portrait, and one short high-impact hook.
Input images: Image 1 is the tutorial-cover style reference; Image 2 is the instructor identity reference; Image 3 is the exact official logo.
Subject: One instructor only, recognizable from Image 2, expressive but credible, polished head-and-shoulders framing.
Composition/framing: Bold readable hierarchy at thumbnail size; portrait and hook balance each other without covering the official logo or title.
Text (verbatim): Course title "<COURSE_TITLE>". Large hook "<HOOK>".
Constraints: Hook is 1–5 words and separate from the course title. Preserve identity, logo, and both text strings exactly.
Avoid: clickbait unsupported by the course, extra copy, duplicate face, malformed text, watermark.
```

## 03 — Concept / no portrait

```text
Use case: ads-marketing
Asset type: Course cover option 03
Primary request: Create a cinematic concept-led course cover using the supplied tool identity and course theme, with no portrait or human figure.
Input images: Image 1 is the tutorial-cover style reference; Image 3 is the exact official logo.
Scene/backdrop: A distinctive visual metaphor grounded in the actual course subject and tool workflow, not generic AI circuitry.
Composition/framing: One strong conceptual focal point with clear negative space for the exact logo and course title; safe for 16:9 hero and card crops.
Text (verbatim): "<COURSE_TITLE>"
Constraints: No portrait, face, person, silhouette, hands, or human figure. Preserve logo and title exactly.
Avoid: generic glowing brain, random code rain, illegible pseudo-UI, unrelated logos, watermark.
```

## Iteration rule

If a choice fails, revise only the failing attribute—such as portrait fidelity, text hierarchy, or crop safety—and repeat every identity and brand invariant in the edit prompt. Do not rewrite all three concepts to fix one option.
