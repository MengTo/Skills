---
name: generate-course-cover-options
description: Create three source-aware GPT-Image 2 cover concepts for an existing course, using its exact logo and title plus an instructor portrait extracted from the first lesson video. Use when a course needs portrait, short-hook, and portrait-free cover choices; do not use for ordinary screenshots or code-native hero backgrounds.
---

# Generate Course Cover Options

Create three genuinely different, production-ready course-cover choices without changing the live course cover until the user selects one.

## Requirements

- Built-in image generation for the three concept jobs.
- `ffmpeg`, `ffprobe`, and `awk` for portrait-frame extraction.
- An approved local or authenticated project path to the lesson video; never bypass access controls.

## Required outcome

Always deliver these three variants as separate images:

1. **Portrait / clean** — exact logo and course title, instructor portrait, no large teaser heading.
2. **Portrait / hook** — exact logo and course title, instructor portrait, plus one large YouTube-style hook of 1–5 words. The hook is not the full course title.
3. **Concept / no portrait** — exact logo and course title, no face or person; let the course concept and tool visual lead.

Do not bake “Option 1”, “Option 2”, or “Option 3” labels into the artwork. Label the files and gallery captions instead.

## Establish the source of truth

Before generating, resolve these inputs from the project when available:

- Course slug and exact display title from course metadata.
- The tool/product logo or wordmark and the closest existing tutorial cover. Prefer official repo assets over web search.
- The first lesson in source order and its original video file or existing local master.
- Existing course-cover dimensions, crop behavior, typography, and the site’s current visual theme.

Treat the tutorial cover as an art-direction and identity reference, not permission to copy unrelated text or UI. Ask the user only when a required source cannot be found or accessed safely.

## Preserve identity and brand accuracy

- Never invent or redraw an official logo when an exact asset exists.
- Never accept misspelled or deformed brand text from the image model.
- Keep the exact course title verbatim. The short hook is a separate hierarchy.
- Use the real instructor frame as an identity reference. Do not synthesize a lookalike.
- If exact logo/title pixels cannot be preserved through the model edit, generate the scene without them and composite the official assets afterward with project-native image tooling.

## Extract the instructor portrait

Prefer the first lesson video because it represents the course and instructor consistently.

1. Resolve the first lesson video to a local file. Use an existing authenticated/project download path when already configured; do not extract credentials or bypass access controls.
2. Run `scripts/extract_portrait_frames.sh <video-file> <output-dir>` from this skill.
3. Inspect the contact sheet and promising full frames.
4. Choose the sharpest expressive frame with open eyes, unobstructed face, natural expression, clean head-and-shoulders silhouette, and enough resolution for the final crop.
5. Use that chosen frame as an identity-preserving input. Keep facial structure, skin tone, hair, and recognizable expression stable.

If the first lesson has no usable instructor shot, report that clearly and ask whether to use another lesson or a supplied portrait.

## Generate with GPT-Image 2

Use Codex's built-in image generation workflow by default, including when the user says "built-in GPT Image 2". This path does not require the user to configure or paste an API key.

- Use the built-in Image Generation skill and its `imagegen` tool for the three image jobs.
- Use the bundled `imagegen` CLI with model `gpt-image-2` only when the user explicitly requests CLI/API execution or direct model-parameter control.
- When using the CLI, require `OPENAI_API_KEY` in the local environment; never ask the user to paste it in chat.
- Do not silently switch execution paths after the user specifies one.
- Use three distinct prompt jobs, not `n=3` from one prompt.
- Use `quality=high` and `2048x1152` unless the established cover system requires another valid 16:9 size.
- Supply the tutorial cover, official logo, and chosen portrait as explicitly labeled input references when relevant.
- Read [references/variant-prompts.md](references/variant-prompts.md) before generating.

Save choice-stage outputs under:

```text
output/imagegen/course-covers/<course-slug>/
  01-portrait-clean.png
  02-portrait-hook.png
  03-concept-no-portrait.png
```

Do not overwrite an existing cover. After the user selects a choice, copy the selected final into the project’s actual course-cover location, update its consumer, and verify the rendered card/hero only when the user asks to apply it.

## Composition rules

- Match the current course-cover family: cinematic, intentional, editorial, and legible at card size.
- Maintain one clear focal point. The portrait, hook, logo, title, and concept cannot all compete at equal weight.
- Keep faces away from crop edges and UI play-button zones.
- Preserve safe margins for both the course grid card and the wider course hero crop.
- Use the existing tutorial cover’s palette and visual language as the starting point; adapt it to the course rather than cloning it.
- Avoid generic AI circuitry, illegible pseudo-UI, extra people, duplicate faces, watermarks, and decorative text.

## Quality gate

Inspect every option at full size and at its smallest real card size. Reject and regenerate a variant if any of these fail:

- Exact logo and course title are readable and undistorted.
- The portrait is recognizably the instructor and remains sharp after cropping.
- The hook, when present, is 1–5 words and does not repeat the full course title.
- Variant 1 has no large hook.
- Variant 3 contains no portrait, face, or human figure.
- No key element sits under the play control or outside crop-safe margins.
- The three choices differ in composition, not merely color grading.
- No watermark, gibberish text, accidental extra logo, malformed hands, or duplicated facial feature is visible.

Present the three images together with their filenames and one sentence explaining each direction. Recommend one if there is a clear winner, but wait for the user’s selection before replacing the course cover.
