---
name: build-daily-inspiration-sites
description: Turn a completed daily UI inspiration capture into exactly five original landing-page builds, one per separate Codex task, using Sites. Use when the user asks to turn the daily inspiration references, a five-item UI prompt pack, or a dated `*-ui-inspiration-capture` article into distinct HTML landing pages while changing the source brands, names, copy, people, numbers, pricing, claims, and imagery.
---

# Build Daily Inspiration Sites

Convert an existing five-item inspiration pack into five independent, original Sites projects. Orchestrate from the current task; let each created task own one build, commit, and private deployment.

## Preserve the boundary

- Use the capture as evidence and art direction, never as a template to copy.
- Do not recollect inspiration unless the user explicitly asks.
- Create exactly one site for each manifest item and exactly one Codex task for each site.
- Do not combine multiple sites in one build task.
- Do not reuse the reference brand, logo, wordmark, copy, people, companies, testimonials, figures, dates, plans, prices, URLs, legal text, interface screenshots, photography, or proprietary marks.
- Preserve only high-level visual grammar visible in the full-page image: hierarchy, pacing, section logic, contrast, spacing, and image treatment.
- Attach exactly one reference image to each build task: that item's full-page image. Do not attach a representative still, video, motion frames, or section crops.
- Use the Codex in-app browser only. Never use Chrome.

## 1. Locate and validate the capture

Use the article path supplied by the user. Otherwise choose the latest dated `articles/YYYY-MM-DD-ui-inspiration-capture/` folder in the current Content workspace.

Require:

- `manifest.json` with `itemCount: 5` and exactly five items
- `content.md`
- one non-empty local `fullPageImage` per item
- `pageUrl` for every live-site item
- one detailed builder prompt per item

Run:

```bash
node <skill-dir>/scripts/validate_capture.mjs <article-dir>/manifest.json
```

Stop if validation fails. Report a missing full-page image rather than substituting another still, video, frame, crop, or live-page capture.

## 2. Create the originality matrix

Before creating tasks, define five distinct replacement identities. For each item, choose:

- a new brand name and slug
- a new category-specific positioning statement
- a fresh audience and conversion goal
- a new content vocabulary
- a new set of proof points, metrics, plans, and prices
- a new imagery direction appropriate to the concept

Keep the new names materially different from the reference titles. Search the five proposed names against one another for accidental similarity. Avoid five generic AI names or five cosmetic color swaps.

The transformation must be coherent. A new statistic must agree everywhere it appears; pricing, testimonials, locations, service names, product UI, and footer details must all belong to the replacement brand.

## 3. Prepare one build brief per item

Read [references/thread-brief-contract.md](references/thread-brief-contract.md) before creating any task. Fill every placeholder with concrete values; never dispatch a brief containing `NEW_BRAND`, `TODO`, or other unresolved markers.

Each brief must include:

- the exact manifest item title and creator
- absolute paths to `manifest.json` and `content.md`
- exactly one inline local-image attachment using the item's absolute `fullPageImage` path in non-fenced Markdown image syntax: `![Full-page reference — <REFERENCE_TITLE>](<ABSOLUTE_FULL_PAGE_IMAGE_PATH>)`
- the new brand name, category, audience, offer, and conversion goal
- an explicit originality boundary and exhaustive replacement list
- the requirement to use `sites:sites-building` and `sites:sites-hosting`
- one semantic, one-route HTML landing page; the Sites starter may render it through `app/page.tsx`
- full responsive, accessibility, reduced-motion, and interaction requirements
- build validation, narrow commit, private deployment, and final URL requirements

The Markdown image must render as an attachment in the created task. Do not provide the full-page path as plain text, and do not attach any other image or video. If the task-creation surface cannot render the local Markdown image, stop and report that blocker instead of falling back to a path-only handoff.

Tell each task to inspect the attached full-page image before coding. The detailed prompt in the manifest or article is the section-by-section source of truth. A static full-page image does not establish source motion, interaction behavior, or implementation technique, so do not infer or claim those details.

## 4. Create five separate Codex tasks

Use Codex thread tools only when the user explicitly requested separate tasks or threads.

1. Search recent tasks for the article date plus reference title or proposed brand name. Reuse an existing matching task instead of creating a duplicate.
2. Prefer a projectless target with a unique directory name for a new independent Sites project.
3. If the user requires the source inside an existing repository, list projects first and create a separate worktree for each build.
4. Create all five tasks with their complete briefs.
5. Give each task a clear title such as `Build <Brand> landing page`.
6. Confirm all five tasks are active. Use the thread wait/status tool; if waiting is unavailable, use the task list as the fallback proof.

Never edit the five sites concurrently in the Content checkout. The capture files are read-only evidence; each build writes only to its own task workspace.

If task creation is unavailable, stop and report that blocker. Do not silently collapse the work into the current task.

## 5. Require a complete Sites handoff

Every created task must:

- initialize Sites immediately
- build a complete single-route landing page rather than a hero mockup
- use semantic structure and original, appropriately licensed media
- avoid model-authored SVG illustrations
- run the required production build and fix failures
- commit only the validated site source
- publish privately through Sites after a successful build
- follow Sites approval rules if only shared or public access is available
- return the deployed URL, source location, commit, and concise change summary

Because these are background tasks, skip interactive browser preview unless it is needed to resolve a real blocker. Publishing and the normal Sites handoff still apply.

## 6. Report the launch

Return a compact mapping of reference to replacement brand and current task status. Emit one created-task directive per new task when the app requires it.

State clearly that the five tasks will each produce:

- one original landing page
- one isolated source workspace
- one validated commit
- one private Sites deployment

Do not claim a site is complete until its task reports successful build and deployment.

## Completion checks

- Exactly five manifest items were validated.
- Exactly one non-empty full-page image was validated for each item.
- Exactly five distinct replacement identities were defined.
- Exactly five unique tasks were created or deliberately reused.
- Every task contains exactly one rendered full-page image attachment and no path-only image handoff.
- Every brief replaces all source identity, language, numbers, and imagery.
- Every task requires Sites build, validation, commit, and private deployment.
- The user can open each created task independently.
