---
name: edit-narrated-videos
description: Edit and quality-check narration-led videos through a declared editor adapter or a manual project workflow. Use for silence and repetition cleanup, synchronized timeline changes, caption reconciliation, visual treatment, and verified master exports. Decoded audio is the source of truth for every narration cut.
---

# Edit Narrated Videos

Edit the real project without clipping speech, duplicating phrases, drifting linked media, or confusing caption text with audible evidence.

## Skill family

- Use this skill for the complete edit, synchronization, visual treatment, captions, and export.
- Use `$edit-video-audio-first` for every narration cut, silence removal, repetition cleanup, or audio-boundary audit.
- Use `$correct-caption-vocabulary` after the timeline and transcript are stable.
- Recording, course publishing, article generation, and provider replacement are separate workflows.

## Non-negotiable invariant

Decoded audio is the source of truth. Captions and transcript gaps can locate a candidate edit, but they do not prove silence or define a safe speech boundary.

## Establish the adapter boundary

Read [editor-adapter-contract.md](references/editor-adapter-contract.md). Identify the exact project and declare which capabilities are available. Do not translate a missing capability into an invented editor command.

If no mutation-safe adapter exists, inspect available sources, produce an edit decision list, and stop before changing the project. Never rewrite an opaque editor project format directly.

## Workflow

1. Confirm the editor or project is idle. Stop when it is recording, exporting, busy, or unclear.
2. Capture project identity, timeline duration, linked tracks, source ranges, captions, frame rate, canvas, version state, and requested output contract.
3. Invoke `$edit-video-audio-first` for every narration-related candidate. Review each proposed range before applying it.
4. Apply approved timeline changes non-destructively. Keep linked video, screen, camera, audio, captions, effects, and markers synchronized unless the edit explicitly calls for a different relationship.
5. Once the timeline is stable, regenerate or reconcile captions from the edited audio, then invoke `$correct-caption-vocabulary`. Captions follow the edit; they do not drive it.
6. Apply requested framing, graphics, b-roll, effects, sound design, and established visual conventions without replacing content-specific decisions.
7. Run the adapter's project validation. Require ordered source ranges, in-bounds captions, synchronized linked media, matching required-track duration, valid media references, and no unresolved errors.
8. Export the requested master. Verify the physical file with `ffprobe`, decode or transcribe audio around every changed join, and inspect representative frames at the beginning, edits, transitions, captions, and end.

## Mutation and reporting boundaries

- Create a recoverable version or duplicate before mutation and record its identity.
- Use dry-run or edit-plan review when the adapter supports it.
- Never interrupt an active recording or export.
- Never infer that a successful editor receipt proves the file exists or plays correctly.
- Uploading, publishing, replacing a hosted video, deleting superseded exports, and activating automation require separate authorization.

Report the project identity, adapter and capabilities, removed ranges or phrases, preserved replacements, saved version, validation, final media path, output properties, join checks, frame inspection, and remaining uncertainty.
