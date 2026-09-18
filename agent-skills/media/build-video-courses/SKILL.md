---
name: build-video-courses
description: Turn an ordered set of completed lesson videos into a draft-first online course with verified media, learner-facing metadata, optional lesson articles and downloads, controlled publication, and rendered read-back. Use for end-to-end course creation across course platforms and video hosts; do not use for editing the source videos or changing one existing lesson only.
---

# Build Video Courses

Build the course as a sequence of verified state transitions. Keep source intake, local authoring, video upload, draft creation, article publication, course publication, and application deployment as separate actions.

## Keep the boundaries visible

- Start read-only when the user asks to inspect, list, or plan.
- Planning does not authorize uploads or database writes. A draft does not authorize publication.
- Use the destination project's existing authentication and provider integrations. Never copy credentials into a new importer.
- Keep internal repository names out of learner-facing copy unless the lesson teaches that project.
- Preserve unrelated worktree changes and use narrow commits.

## Load specialized support only when needed

- Read [course-publishing-contract.md](references/course-publishing-contract.md) before implementing or running a destination importer.
- Use `$build-video-course-lessons` for transcript-backed written companions.
- Use `$attach-lesson-project-files` for verified downloadable source projects.
- Use `$generate-course-cover-options` when a new cover is needed and wait for selection before applying it.

## 1. Inventory the exact source set

Resolve the supplied folder into source order. For every lesson record the exact master path, checksum, bytes, duration, dimensions, frame rate, codecs, audio presence, transcript source, tentative title, and chapter evidence.

Inspect enough of every video and transcript to understand the course arc. Stop when a master cannot be matched confidently. Never substitute a similarly named export.

## 2. Agree on the learner-facing course

Before external writes, present:

- title choices and a recommended slug;
- the course promise and intended audience;
- source-ordered lesson titles and outcomes;
- instructor, access model, cover direction, and intended publication state;
- missing source, transcript, identity, or destination evidence.

Wait when title, instructor, access, replacement-versus-new identity, or destination is materially undecided.

## 3. Inspect the destination adapter

Discover the current course schema, lesson schema, video host, storage layout, routes, access controls, and existing import commands. Do not assume a database, provider, field name, or URL structure.

The adapter must expose dry-run, draft-write, publish, and verify-only modes. It must identify records it owns, refuse collisions, preserve protected fields, resume uploads by source checksum, and store receipts without secrets.

## 4. Dry-run the complete plan

Validate the local source and read the live destination before any write. Report proposed identities, collisions, access, publication state, source hashes, media properties, chapters, selected assets, and provider objects that can be reused.

A local JSON check alone is insufficient. The dry-run must prove the intended destination is safe.

## 5. Create a private draft

Proceed only after the user authorizes draft creation and uploads.

1. Create importer-owned draft course and lesson records.
2. Upload or resume missing videos through the active provider adapter.
3. Save each provider receipt immediately.
4. Wait for processing and verify duration, readiness, visibility, and embed policy.
5. Write final draft media fields and source-order summaries.
6. Run verify-only mode and require the draft state.

Do not restart a completed upload because a later read-back or browser check failed. Recover from the saved provider identity and checksum.

## 6. Add lesson companions

After lesson identities and videos are stable, author local articles with `$build-video-course-lessons` and package verified downloads with `$attach-lesson-project-files`.

Publishing those companions is independently authorized. Use field allowlists so article or attachment writes cannot replace video, access, order, pricing, instructor, cover, or publication state.

## 7. Publish deliberately

Publish only after explicit authorization. Require a separate write flag and expected-state assertion. Then read back the course, every lesson, every hosted video, and every changed attachment or article field.

## 8. Verify the learner experience

Use the approved browser on the exact destination routes. Verify catalog presence, course identity, cover, instructor, lesson order, duration, access labels, player behavior, chapters, article rendering, downloads, responsive layout, and relevant console output.

Keep proof dimensions separate: database persistence is not video playback, local rendering is not production deployment, and a signed-out gate is not authenticated access verification.

## Deliver

Record source checksums, destination identities, provider receipts, upload reuse, access and publication state, article and attachment status, browser verification, limitations, and scoped commit hashes.
