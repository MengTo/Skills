---
name: build-video-handbook-articles
description: Turn verified videos, screen recordings, transcripts, and tutorials into source-faithful visual handbook or blog articles. Use when a recording should become a durable written guide with evidence frames, useful links, provenance, validation, and a scoped local package; do not use for course publication or video editing.
---

# Build Video Handbook Articles

Build one useful article from each verified video. Treat the recording as evidence, not decoration. Let the prose explain decisions while visuals prove the application, process, and result.

## Operating contract

- Verify the exact source and creator before writing.
- Prefer a local master and matching transcript when available.
- Keep drafts, media, and commits local unless publication or upload is explicitly requested.
- Do not invent steps, UI states, resources, quotes, outcomes, or URLs.
- Preserve unrelated dirty files and commit only the article package.

## Supporting tools

- Read [visual-direction.md](references/visual-direction.md) before selecting or generating visuals.
- Use `scripts/extract_reference_frames.py` for evenly spaced or timestamp-specific frames.
- Use `scripts/validate_handbook_article.py` to check structure, links, images, and optional policy ranges.

## 1. Establish the article queue

For each source record creator, first-party URL when applicable, exact video, topic, destination publication, source files, transcript, and status. Use one article per video unless a tightly related series is intentionally combined.

## 2. Gather evidence

Probe the master, verify first-party metadata, obtain a transcript, extract frames around major decisions and results, and record every discussed tool or resource. Inspect frames visually; transcript text alone does not prove an interface state.

```bash
python3 scripts/extract_reference_frames.py /path/to/video.mp4 /path/to/frames --count 10
```

Use `--timestamps 03:40,05:38,09:56` when useful moments are already known.

## 3. Design the article

Define the reader and the change the article should create. Use the source's real workflow to choose section count, order, and visual cadence. Do not force a fixed word count or one image after every two sections.

For every planned visual, name the claim it proves, source frames, recognizable subject, framing device, and clutter to remove.

## 4. Write from the recording

- Open with the useful result or tension.
- Follow the demonstrated decisions, not a generic tutorial template.
- Attribute the speaker accurately and use first person only when the destination calls for it.
- Keep claims proportional to the evidence.
- Link first mentions and end with Resources when resources exist.
- Follow the destination's established voice and punctuation rules rather than a personal default.
- Keep publishing copy and upload instructions outside the article.

## 5. Create the visual system

Use real source frames when they prove the interface, artifact, process, or result. Crop or compose them for clarity without changing what happened. Generate imagery only for conceptual relationships the recording cannot show, and never replace required UI evidence with invented interface art.

Every visual needs descriptive alt text and recorded provenance. Inspect it at rendered article size.

## 6. Validate and deliver

```bash
python3 scripts/validate_handbook_article.py /path/to/content.md
```

Use optional flags when the destination defines section, word-count, image-ratio, or visual-cadence requirements. Then run the repository's focused checks, inspect the rendered article, and commit only the article folder and requested index entry.

Report the article path, source, extracted and generated visuals, validation, deliberate warnings, publication state, and commit hash.
