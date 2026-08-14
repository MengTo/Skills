---
name: build-youtube-companion-runbooks
description: Create or update source-faithful YouTube companion runbooks from a finished video, local master, transcript, captions, and related article. Use when Codex needs to produce `youtube.md` packaging with accurate titles, hooks, thumbnail directions, chapter timestamps, a YouTube description, social and LinkedIn copy, a pinned comment, public-link gates, resource packaging, and a final upload checklist.
---

# Build YouTube companion runbooks

Turn verified video evidence into a practical `youtube.md` package. Keep internal production notes separate from copy that will be pasted into YouTube or social platforms.

## Gather the evidence

1. Locate the final video or local master, transcript or captions, related article, and owned thumbnail assets.
2. Probe the video when its duration or dimensions are unknown.
3. Read the complete article and transcript before writing titles or chapters.
4. Verify any existing public video, article, repository, product, or resource URL from its first-party page.
5. Record missing public URLs as explicit gates. Never substitute a similar video or invent a link.

Prefer the final uploaded video for timestamps. When only a local master exists, derive chapters from the transcript and require a post-upload recheck.

## Start from the template

Copy [assets/youtube-companion-template.md](assets/youtube-companion-template.md) into the target article folder as `youtube.md`. Replace every bracketed instruction with source-backed content or a standardized publication gate.

Keep these internal source links near the top when available:

- related article
- source video or local master
- transcript or captions
- optimized upload file

Use neutral placeholders in reusable skills and public repositories. Do not hard-code a creator's home directory, email, credentials, private project names, or unpublished account details.

## Choose one honest package

Lead with the strongest visible result, conflict, or useful surprise from the recording.

Create:

- one recommended title with a short reason
- five or six alternate titles
- five opening hooks
- two thumbnail directions
- one short thumbnail phrase, usually two to four words

Name the product, model, or medium when it improves clarity. Keep the promise inside the evidence. Do not claim “one prompt,” “zero edits,” a cost, a speed, or a result unless the recording proves it.

Build the primary thumbnail from an owned frame or article visual. Make the finished result larger than the tool interface. Remove tiny UI text that will disappear on a phone. Avoid generic logos, fake code, long prompt text, or imagery unrelated to the video.

## Build chapters from the transcript

Create 8 to 20 chapters for a normal long-form video. Use fewer for short videos and more only when the recording has real topic changes.

Follow these rules:

- Start with `00:00`.
- Keep timestamps strictly increasing.
- Place a chapter where the subject changes, not at every sentence.
- Use concrete labels that describe what the viewer learns or sees.
- Keep most labels under 65 characters.
- Avoid duplicate or nearly duplicate chapter names.
- Recheck every timestamp after the final upload, intro replacement, or edit.

Copy the same verified chapter list into the YouTube description.

## Write the YouTube description

Use the first two lines for the result and workflow. Explain what the viewer will learn in plain language, then add:

1. a short list of covered steps
2. an exact prompt only when it appears in the source
3. the verified chapter list
4. a `Resources:` block with first-party URLs

Use `[ADD YOUTUBE URL BEFORE GOING LIVE]`, `[ADD ARTICLE URL BEFORE GOING LIVE]`, or `[ADD RESOURCE ZIP URL BEFORE GOING LIVE]` when a public destination does not exist yet.

Keep local filesystem paths out of public copy blocks. Link the first mention of each product, site, repository, model, or download. Do not claim a download exists until the file and public link are verified.

## Package downloads as one resource

When the video offers several files, package the article PDF, templates, prompt files, README, and related assets into one ZIP. Upload and share that ZIP through the approved provider, then use one link throughout `youtube.md`.

Do not scatter several file links across the description, pinned comment, and social posts. If no download bundle exists, omit the claim and leave the upload checklist explicit.

## Adapt the idea for each channel

Create these copy blocks from the same source evidence:

- `Social Share`: concise, first-person, and suitable for X or Threads
- `LinkedIn Post`: explain the workflow and practical lesson with more context
- `Pinned Comment`: repeat the strongest action, link the article or source, and ask one useful question
- `Short Description`: one or two sentences for metadata or previews

Preserve the creator's spoken vocabulary and opinion. Cut generic setup, fake revelations, repeated conclusions, decorative dashes, and unsupported superlatives.

## Add publication gates

End with an upload checklist that covers:

- public video, article, sponsor, and download URLs
- chapter verification against the uploaded file
- thumbnail export at 1280 by 720 and a phone-size check
- consistent product and model spelling
- first-party resource-link checks
- sponsorship disclosure when applicable
- a reminder to add the final YouTube URL back to the article

Uploading, publishing, sending sponsor review, and activating social automation are separate external actions. Perform only the actions the user authorized.

## Validate the runbook

Run:

```bash
python3 scripts/validate_youtube_companion.py /absolute/path/to/youtube.md
```

Resolve the script relative to this skill folder when invoked outside the skill directory.

Then check:

```bash
git diff --check -- /absolute/path/to/youtube.md
git status --short -- /absolute/path/to/article-folder
```

Review every reported publication gate. A runbook can be complete with explicit gates, but it is not ready to publish until those gates are replaced with verified public values.

When working in a mixed worktree, stage and commit only the new skill or companion files.
