---
name: audit-reference-originality
description: Audit a website or digital experience against its supplied source references for originality and plagiarism risk. Use when Codex must compare current or historical site output with reference pages, capture packs, screenshots, copy, brands, numbers, images, assets, videos, layouts, motion, or code; raise evidence-backed red flags; distinguish common visual grammar from distinctive copying; and propose concrete fixes without making unsupported legal claims.
---

# Audit Reference Originality

Compare the shipped experience with the complete reference corpus. Treat the audit as an evidence exercise, not a vibe check.

## Preserve the audit boundary

- Audit only unless the user also asks for fixes.
- Call findings `originality risks`, `overlaps`, or `red flags`; do not declare legal plagiarism from visual similarity alone.
- Pair every red flag with exact current-site evidence and exact reference evidence.
- Keep fact, inference, and unknown access separate.
- Do not clear a site after checking only its homepage screenshot.

## 1. Build the source registry

Start with the materials explicitly supplied in the task or recorded by the project:

- manifests, prompt packs, and originality matrices
- representative stills, full-page captures, and section crops
- MP4s and extracted motion frames
- reference URLs and named creators
- source brand assets, copy, numbers, screenshots, and downloads
- project briefs, `IMAGE_CREDITS.md`, licenses, and attribution files

Prefer local evidence captured at the time of the brief. Use a live reference only to fill a real gap, because it may have changed. Record each reference's path or URL, role, date when known, and which categories it can prove.

Stop and report an access gap when a promised reference is missing. Do not silently reduce a full-page or motion audit to one cover image.

## 2. Inventory the current site and its history

Inspect:

- rendered text, metadata, navigation, calls to action, legal copy, and hidden accessible labels
- brand names, wordmarks, logos, icons, people, companies, URLs, and product/interface data
- prices, metrics, dates, counts, percentages, package names, and repeated proof claims
- every rendered image, background, texture, screenshot, font, logo, icon, audio file, and downloadable asset
- every video, poster, frame sequence, shot order, transition, duration, and playback treatment
- layout hierarchy, section order, distinctive compositions, typography behavior, motion grammar, shaders, cursor effects, and interaction sequences
- current source, built output when available, asset provenance, and repository history

Do not trust filenames as proof of originality. Inspect the bytes, visible result, and history. Search renamed, deleted, and replaced files with `git log`, `git show`, `git log -S`, and `git log --all --name-status`.

Run the deterministic inventory helper when local files are available:

```bash
python <skill-dir>/scripts/build_evidence_inventory.py \
  --site <site-root> \
  --reference <reference-file-or-directory> \
  --reference <another-reference> \
  --output <temporary-output.json>
```

The helper finds current and historical exact-file matches, suspicious basename reuse, normalized text overlap, and repeated number tokens. Treat its output as leads for human review, not an automatic verdict.

## 3. Compare category by category

Read [references/audit-rubric.md](references/audit-rubric.md) before judging findings.

Audit at least these categories:

1. **Text** — headlines, body copy, labels, CTAs, captions, legal text, alt text, metadata, and decorative wording.
2. **Brands** — names, marks, wordmarks, proprietary icons, people, companies, partnerships, URLs, and distinctive verbal identity.
3. **Numbers** — metrics, percentages, prices, dates, counts, plan structures, durations, and interface values.
4. **Images** — exact files, crops, generated derivatives, screenshots, people, poses, objects, signature compositions, and color treatment.
5. **Assets** — fonts, icons, logos, textures, mockups, downloads, code bundles, and third-party media with unclear provenance.
6. **Videos** — exact files, frames, shots, timing, camera moves, edit rhythm, transitions, overlays, posters, and audio.
7. **Structure and motion** — section order, unusual layout devices, pinned sequences, cursor interactions, shaders, and combinations of signature elements.
8. **History** — copied material that was later renamed, recolored, cropped, hidden, deleted, or replaced.

Common patterns such as black backgrounds, large sans-serif type, ordinary pricing tables, standard fade-ins, or a conventional footer are not red flags by themselves. Escalate combinations of distinctive elements or direct evidence.

## 4. Triangulate every red flag

For each candidate:

1. Identify the current-site artifact and location.
2. Identify the exact reference artifact and location.
3. State the observable overlap without guessing intent.
4. State what differs.
5. Assign severity using the rubric.
6. Propose the smallest fix that breaks the overlap while preserving the site's goal.

Use hashes for exact files, normalized excerpts for copy, side-by-side crops for imagery, and matched timestamps or frames for video. A source-brand string found only in a test that explicitly forbids it is not a shipped-copy violation; explain context.

## 5. Propose fixes

Prefer concrete replacements:

- rewrite source-like copy from the new brand's audience, offer, and vocabulary
- replace names, URLs, logos, people, metrics, dates, plan names, and legal text
- regenerate or license new imagery with a materially different subject, composition, and motif arrangement
- replace copied assets and document provenance
- re-cut videos with new shots, timing, transitions, overlays, and audio
- reorder or redesign distinctive section and motion sequences
- remove stale source material from current output and, when required, repository history or published artifacts

Do not recommend cosmetic recoloring as a fix for copied identity, copy, media, or composition.

## 6. Report the result

Lead with one verdict:

- `Clear in checked scope`
- `Clear with low-risk similarities`
- `Changes recommended`
- `Block release`
- `Blocked by missing evidence`

Then provide:

1. checked source registry
2. red-flag table ordered by severity
3. category pass list
4. history findings
5. access gaps and unproven areas
6. prioritized fix plan

Include a row even when a high-risk category could not be checked. Never turn missing evidence into a pass.

## Completion checks

- Every supplied reference form was inspected.
- Rendered output and source were both checked.
- Text, brands, numbers, images, assets, videos, structure/motion, and history were covered.
- Every red flag cites two evidence locations.
- Exact matches are distinguished from stylistic similarity.
- Proposed fixes replace the copied element rather than disguising it.
- The report states what remains unverified.
