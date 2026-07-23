# Reference originality audit rubric

## Contents

- [Evidence hierarchy](#evidence-hierarchy)
- [Severity](#severity)
- [Category tests](#category-tests)
- [False-positive controls](#false-positive-controls)
- [Report table](#report-table)
- [Fix patterns](#fix-patterns)

## Evidence hierarchy

Use the strongest available evidence:

1. identical file bytes or a historical Git blob match
2. identical or near-identical rendered text
3. matching source-brand names, marks, numbers, or URLs
4. matching image crops, video frames, or audio
5. several distinctive composition, layout, or motion elements combined
6. generic style resemblance

Levels 1–4 can support a high-confidence red flag. Levels 5–6 require judgment and explicit caveats.

## Severity

| Severity | Use when | Typical action |
| --- | --- | --- |
| Blocker | Exact unlicensed source media, source code, identity, or substantial verbatim copy is shipped | Remove or replace before release |
| High | A distinctive near-copy preserves several signature elements, or source identity/numbers remain visible | Redesign or rewrite the affected section |
| Medium | A recognizable isolated overlap could confuse attribution or provenance | Replace the element or materially change the treatment |
| Low | High-level grammar is similar but identity, content, composition, and assets are original | Document the distinction; optional polish |
| Clear | No meaningful overlap found in the checked scope | Record evidence and remaining gaps |

Severity is not a legal conclusion. Copyright, trademark, license, and fair-use questions may require counsel.

## Category tests

### Text

Check exact strings, normalized strings, eight-word sequences, headline structure, CTA wording, metadata, alt text, legal text, and decorative labels. Short functional phrases such as `Learn more` need another distinctive signal before escalation.

### Brands

Check names, wordmarks, logos, letterforms, slogans, people, company names, partnerships, product names, URLs, and legal entities. A source name may appear in an audit note or negative test; verify whether it is rendered.

### Numbers

Check prices, percentages, dates, counts, package structure, durations, metrics, interface values, and repeated proof claims. Shared round numbers are weak evidence alone. A matching unusual number plus matching wording is stronger.

### Images

Check hashes, dimensions, metadata, crop geometry, silhouettes, people, poses, props, object placement, negative space, lighting, and signature motif arrangement. Similar palette or grain alone is low risk. Recreated composition with changed colors remains risky.

### Assets

Check logos, icons, fonts, screenshots, textures, mockups, downloads, archives, code bundles, and hidden public files. Confirm license and provenance separately from originality.

### Videos

Check file hashes, duration, resolution, frame matches, shot sequence, camera motion, edit timing, transitions, overlays, poster frames, captions, and audio. Sample the opening, closing, every cut, and regular intervals; inspect supplied motion frames in addition to the MP4.

### Structure and motion

Compare section order, hierarchy, unusual grid behavior, pinned scenes, reveal timing, cursor effects, shaders, and transitions. Standard techniques are reusable. A distinctive choreography reproduced across several chapters is a red flag even when assets differ.

### History

Check current files, deleted paths, renamed assets, prior commits, generated output, caches intended for deployment, and published versions. Report historical presence separately from current exposure.

## False-positive controls

Do not escalate solely because both works use:

- black and white
- one accent color
- large sans-serif typography
- a hero, work list, services, pricing, FAQ, and footer
- fade, slide, marquee, or parallax effects
- common icon libraries
- ordinary stock-photo subjects
- the same framework or open-source dependency

Escalate when generic ingredients reproduce a distinctive arrangement, sequence, identity, or asset.

## Report table

Use this schema:

| Severity | Category | Current-site evidence | Reference evidence | Observable overlap | What differs | Proposed fix |
| --- | --- | --- | --- | --- | --- | --- |

Evidence locations must be reproducible: file and line, URL and section, asset path and hash, or video timestamp/frame.

After the table include:

- **Passed checks:** categories with direct evidence and no material overlap
- **History:** current exposure versus historical-only findings
- **Unknowns:** missing, inaccessible, or unrendered material
- **Priority fixes:** blocker/high first, with replacement scope

## Fix patterns

- **Copy:** rewrite from the replacement brand's specific audience, offer, vocabulary, and conversion goal.
- **Identity:** replace all names, marks, URLs, company data, people, and legal references as one system.
- **Numbers:** create internally consistent original facts; do not perturb copied numbers by a small amount.
- **Images:** change subject, composition, perspective, motif arrangement, and provenance—not only color.
- **Assets:** replace the file and document its source or generation prompt.
- **Video:** use new footage and a new edit structure; changing playback speed is insufficient.
- **Motion/layout:** retain only abstract principles and rebuild the visible sequence around the new content.
