---
name: edit-video-audio-first
description: Plan, execute, repair, and verify speech-safe video cuts using decoded audio rather than captions. Use for repeated phrases, false starts, silence removal, clipped onsets or releases, small timeline cuts, and narration-boundary audits across editors. Do not use as the owner of visual layout or caption spelling.
---

# Edit Video Audio First

Protect the spoken performance while tightening the timeline. A shorter edit is not successful if it clips a phoneme, repeats a phrase, or changes the intended sentence.

## Skill family

- Use this skill for narration cuts and boundary safety.
- Use `$edit-narrated-videos` for the complete visual, synchronization, and export workflow.
- Use `$correct-caption-vocabulary` after audio and timeline edits are stable.

## Source-of-truth invariant

Decoded audio is the source of truth. Captions and transcript gaps can locate candidate regions, but they do not prove silence or define safe cut endpoints.

Evidence priority:

1. Decoded audio, listening, waveform or energy, and audible phoneme boundaries.
2. High-accuracy speech recognition timings derived from that audio.
3. Available original-source handles on both sides of a join.
4. Captions or transcript text as discovery aids only.

Captions may be stale, paraphrased, mistimed, incomplete, or split into zero-duration words.

## Preflight

1. Resolve the exact project or timeline identity and confirm the editor is idle.
2. Record duration, linked tracks, captions, source ranges, frame rate, and recoverable-version expectations.
3. Confirm how the adapter exposes decoded timeline or source audio. If it cannot, produce candidate notes but do not approve narration cuts.
4. Analyze enough audio around every candidate to hear the complete thought, abandoned take, replacement phrase, and surrounding cadence.

## Plan safe cuts

- Remove an abandoned phrase only when a complete intended replacement is audibly present.
- For repetition, compare the audible takes and keep the clearest complete version. Never splice half-words from different takes.
- Treat silence thresholds as candidate detectors, not edit boundaries. Listen and preserve a natural pause.
- Protect consonant attacks, sibilants, breaths, and word releases. Start with modest source handles and expand them when evidence is ambiguous.
- Keep source ranges ordered and linked screen, camera, audio, caption, effect, and marker timing synchronized.

## Apply and repair

1. Build a reviewable edit decision list with candidate range, evidence, retained phrase, handles, expected duration change, and affected linked tracks.
2. Dry-run when supported. Review every removed interval and warning.
3. Create a recoverable version, then apply only the approved plan through the adapter or editor.
4. Decode and inspect every resulting join. Do not rely on captions or speech recognition alone.
5. Recover more source handle or revise the cut when a word is clipped. Never hide an audio defect by changing its caption.

## Verification

1. Validate contiguous required tracks, synchronized linked media, ordered source ranges, matching durations, and zero unresolved project errors.
2. For an export, verify the physical file with `ffprobe` and compare project and encoded durations within expected encoder tolerance.
3. Decode or transcribe every edited join with enough surrounding context to avoid window-edge recognition errors.
4. Confirm the kept sentence is complete, the false start is gone, no word repeats, and no onset or release is clipped.

If a check fails, repair the project and create a new export. Mark the failed export as superseded; do not present it as final.

Report project identity, adapter, original and final durations, removed ranges, preserved phrases, version identity, boundary repairs, project validation, encoded-audio join checks, final export, and uncertainty. Provider replacement or deletion requires separate authorization.
