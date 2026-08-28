---
name: build-video-course-lessons
description: Turn completed lesson videos and verified transcripts into source-faithful written companions with evidence frames, provenance manifests, optional editor-project adapters, content-only publication, and rendered verification. Use for authoring or replacing lesson articles; do not use for video editing or broad course migrations.
---

# Build Video Course Lessons

Use the exact final video and its transcript as required evidence. An editor project may provide cleaner source frames, but it is optional and must declare its adapter honestly.

## Operating contract

- Use the approved browser for browser work.
- Keep local Markdown as the authored source.
- Do not invent steps, UI states, quotes, resources, or outcomes.
- Treat uploads, article publication, access changes, video replacement, and course restructuring as separate actions.
- Preserve unrelated worktree changes and commit only the lesson scope.

## Load relevant support

- Read [package-contract.md](references/package-contract.md) before extracting evidence.
- Read [content-only-publishing.md](references/content-only-publishing.md) only when remote publication is requested.
- Use `scripts/extract_lesson_sources.py` for final-video packages.
- Use `scripts/validate_course_lesson.py` for package validation.

## 1. Establish source identity

For every lesson, record its title, slug, exact final video, checksum when available, transcript source, optional editor project and adapter, destination identity, access, and current article version.

Probe the final video with `ffprobe`. Stop if the master cannot be matched confidently. An unavailable editor project does not block writing when the final video and transcript are verified.

## 2. Choose an evidence mode

- **Final video:** required baseline. Extract frames directly from the verified master and record their exact timestamps.
- **Editor project:** optional. Use only through an adapter that maps timeline time to source media and emits the package contract. Record what the adapter omits or preserves.

Never describe a baked final-master frame as a clean source frame. Never imply an editor adapter preserved effects it deliberately removed.

## 3. Build the lesson package

Create a config from [package-contract.md](references/package-contract.md), then run:

```bash
python3 scripts/extract_lesson_sources.py --config /path/to/lesson-sources.json
```

Choose timestamps that prove decisions, workflow states, corrections, or results. Reject loading states, obscured controls, irrelevant menus, and near-duplicates.

## 4. Plan the written companion

Define the reader, useful outcome, and source-backed section sequence. Use only as many sections and visuals as the lesson needs. A cover is optional when the destination supplies its own hero.

Use real frames for UI, process, and result evidence. Generate a conceptual companion only when it explains something the recording cannot show, and label it as generated rather than recorded evidence.

## 5. Write from the lesson

- Follow the video's actual decisions and order.
- Use concrete headings and short paragraphs.
- Link the first mention of relevant tools and resources.
- Put a Resources section last when the source includes resources.
- Keep operational notes and social copy outside the learner article.
- Follow the destination's established voice; do not impose a personal style profile.

## 6. Validate and publish narrowly

Run the package validator and the destination project's focused checks. When publication is authorized, use a content-only adapter that validates every package before writing, uploads only article assets, and patches only allowlisted article fields.

After publication, compare content hashes, prove protected fields unchanged, and render the exact lesson route. Database read-back does not prove authenticated or responsive rendering.

## Deliver

Report source videos, transcripts, evidence mode, adapter when used, capture provenance, validation, published fields, protected fields, browser limitations, and commit hash.
