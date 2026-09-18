---
name: attach-lesson-project-files
description: Find, verify, package, attach, and read back original downloadable project files for existing lessons or tutorials. Use when a section needs its matching HTML, source project, supplied archive, prompt, or companion files; do not recreate missing originals from screenshots or video frames.
---

# Attach Lesson Project Files

Give each lesson its real project files in a format learners can use. Preserve provenance, protected access, existing section data, and unrelated worktree changes.

## Operating contract

- Start read-only for planning, inventory, search, or comparison.
- Packaging, upload, record attachment, access changes, and publication are separate actions.
- Attach only first-party material, author-supplied downloads, or sources explicitly shared for reuse.
- Never reconstruct a missing project from screenshots or video frames.
- Preserve every field and download outside the exact attachment scope.

## 1. Establish the lesson inventory

For every section record identity, current downloads, source video and description, filenames shown, candidate local folders or supplied links, provenance, confidence, package format, and anything missing.

Require at least two agreeing identity signals, such as an exact filename, source path, description link, matching title and content, author identity, or explicit sharing flag.

## 2. Choose the learner format

- Use direct HTML only when it is the complete runnable project.
- Use one ZIP for multi-file HTML, mixed resources, or supplied file sets.
- Use a complete source ZIP for framework projects, including manifests and configuration while excluding dependencies, builds, caches, repositories, and real environment files.

Do not flatten a framework project into one HTML file or include generated dependencies to make a package appear complete.

## 3. Verify and package

Hash recovered sources, inspect existing archives, verify required sibling files, run an appropriate build when practical, and scan for secrets, credentials, private data, and machine paths.

```bash
python3 scripts/package_project.py \
  --source /path/to/project \
  --root-name learner-project \
  --output /path/to/learner-project.zip
```

Use repeated `--file` arguments for a few verified files from different locations.

## 4. Plan before attachment

Return a section table with artifact, evidence, origin, package type, included files, checksum, and status: ready, ambiguous, or unavailable. Ask only when ambiguity changes what would be distributed.

## 5. Attach only when authorized

Read [publishing-contract.md](references/publishing-contract.md). Use a destination adapter that is dry-run by default, uploads verified bytes, patches only the attachment field, and supports verify-only read-back.

## 6. Read back and render

Read the changed record, download the stored object, compare its checksum, verify access policy, and inspect the exact learner route in the approved browser. Persistence, stored bytes, and authenticated rendering are separate proof dimensions.

Report attached files, untouched sections, provenance, checksums, tests, fields changed, browser limitations, and commit hash.
