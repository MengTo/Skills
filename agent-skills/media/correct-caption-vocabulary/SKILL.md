---
name: correct-caption-vocabulary
description: Detect, review, and safely correct recurring names and technical terms in captions, subtitles, and detached transcripts using a supplied glossary. Use after transcription or timeline edits when spelling and casing need normalization without changing spoken meaning, timing, styling, or synchronization.
---

# Correct Caption Vocabulary

Canonicalize known terms without changing spoken meaning or treating plausible sound-alikes as proof.

## Skill family

- Use this skill for text-only vocabulary corrections after the timeline is stable.
- Use `$edit-narrated-videos` for complete timeline and export work.
- Use `$edit-video-audio-first` for narration cuts and boundary repair.

## Prepare a glossary

Read [glossary-format.md](references/glossary-format.md). Use a project, client, or publication glossary supplied for the current task. Do not bundle personal vocabulary into this reusable skill.

Add a canonical term only when its exact spelling is verified. Keep ordinary words out of aliases unless the surrounding context can disambiguate them reliably.

## Detached captions and transcripts

Run a dry report first:

```bash
python3 scripts/check_caption_vocabulary.py \
  --glossary /path/to/glossary.json \
  --input /path/to/captions.vtt \
  --format json
```

Use `--text` for a short string or pipe text through standard input. To create a corrected file after reviewing the report, add `--apply --output /path/to/captions-corrected.vtt`. Existing outputs require `--force`.

Review every proposed correction. Reject substitutions that are not supported by context. Preserve timestamps, cue IDs, line breaks, punctuation, and styling markup.

## Editor-project captions

1. Confirm the exact project and idle state.
2. Read caption IDs, text, word timing, scene ownership, and styling through the editor adapter.
3. Produce a text-only dry run using the supplied glossary.
4. Review every correction and reject semantic substitutions.
5. Create a recoverable version, then apply only approved text changes through the adapter.
6. Re-read the captions and validate the project.
7. Confirm IDs, timing ranges, scene ownership, synchronization, and styling are unchanged apart from corrected text and necessary redistribution inside the same word span.

Never rewrite an opaque editor project file directly. Never disable the recovery snapshot for a mutation. Report the exact glossary, project or file, corrections, unchanged timing evidence, saved version or output path, validation, and ambiguous terms left unresolved.
