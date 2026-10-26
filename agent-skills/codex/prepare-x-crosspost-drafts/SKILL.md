---
name: prepare-x-crosspost-drafts
description: Prepare a known X post as matching Threads and LinkedIn drafts by recovering the exact authored copy and original media, filling the signed-in composers, verifying both previews, and stopping before the final Post or Publish action. Use when the user points to a specific X post and asks to cross-post, reuse, repurpose, or set up the same content, link, image, or video on Threads and LinkedIn without publishing it for them.
---

# Prepare X Crosspost Drafts

## Goal

Turn one selected X post into ready-to-publish Threads and LinkedIn composers. Preserve the source copy and media when the user asks for the same content, then leave the final publication action to the user.

This is the direct preparation workflow for one known post. When the user wants discovery, popularity filtering, destination-history audits, deduplication, or an approval packet for several posts, complete that separate selection workflow before opening destination composers.

## Authority boundary

An explicit request such as “set up the post and I will publish” authorizes:

- reading the named X post
- locating or downloading its original media
- opening signed-in Threads and LinkedIn composers
- entering the approved copy and uploading the approved media
- using intermediate controls such as `Next`, `Done`, or `Back` to reach the final composer
- leaving the completed composers open

It does not authorize clicking the final `Post`, `Publish`, or scheduler action. Do not like, repost, reply, follow, bookmark, message, change account settings, or publish another platform. Do not save a scheduler draft unless the user explicitly asks.

## Start safely

1. Read `AGENTS.md` and run `git status --short --branch` before changing local files.
2. Query available connectors or APIs for X, Threads, and LinkedIn. Use a connector when it can perform the required operation. Use the signed-in Codex in-app browser for composer UI work. Never use Chrome.
3. Read the browser-control skill and its file-upload guidance before browser actions.
4. Open the canonical X status and verify the authored text, paragraph breaks, outbound link, media type, and media duration or image count.
5. Treat X as read-only. Draft preparation is limited to the two destinations the user named.

If authentication fails in the Codex browser, ask the user to sign in there and resume after confirmation. Do not switch browsers or use public search as a session substitute.

## Preserve the source

When the user says “same content,” copy the authored X text exactly:

- preserve wording, paragraph breaks, capitalization, and the product URL
- do not add hashtags, engagement prompts, credits, or platform-specific filler
- exclude quoted-post text unless the user included it in the authored copy
- do not copy X engagement counts, timestamps, or the quoted-post card

If the text exceeds a destination limit, stop and ask whether to adapt it or split it. Do not silently rewrite a same-content request.

## Recover the exact media

Prefer media in this order:

1. the exact local file the user supplied or previously attached
2. the original media downloaded from the authored X post
3. the quoted post’s original media only when the authored post has no attachment or the user explicitly asks for the quoted media

For a quote post with both authored and quoted videos, “same video” means the video attached to the authored post. Do not replace it with the shorter quoted video.

Use the browser page-asset or media-download capability when a local original is unavailable. Never substitute a screenshot, screen recording, generated card, or link preview when the source media exists.

Before uploading:

- resolve the absolute local path
- confirm the file is non-empty and has the expected MIME type
- use `ffprobe` to verify video duration and dimensions
- visually inspect images when relevant
- re-encode only when the destination rejects the original technical format; do not trim, crop, caption, or alter the content without approval

## Prepare Threads

1. Open `https://www.threads.com/` in the signed-in Codex browser.
2. Open `New thread`.
3. Fill the exact source copy.
4. If the URL creates a link-preview card and the user requested source media, remove only the preview card. Verify that the URL remains in the text.
5. Attach the exact media with the file-chooser flow and an absolute local path.
6. Wait for the media preview to finish loading.
7. Verify the full text, live product link, video player or image preview, and final `Post` control.
8. Stop before `Post`.

Do not use `Add to thread` unless the source copy exceeds the single-post limit and the user approves a split.

## Prepare LinkedIn

1. Prefer the direct signed-in composer at `https://www.linkedin.com/preload/sharebox/`.
2. Fill the caption before opening the media editor so the copy survives the media flow.
3. Select `Add media`.
4. In the media editor, select the real `input[type="file"]` when it is available. Start waiting for the file chooser before clicking the input or visible upload control, then set the exact absolute file path.
5. Wait for the upload or preview to finish.
6. Use the intermediate `Next` or `Done` control to return to the final composer.
7. Verify the full caption, video or image preview, and enabled final `Post` control.
8. Stop before `Post`.

If a background LinkedIn tab rejects typing or clicks, claim the active signed-in Codex browser tab or reopen a clean direct composer and repeat the workflow there. Remove abandoned duplicate composer tabs after the verified draft is ready.

## Handle upload failures

Use this recovery order:

1. Refresh the DOM snapshot and confirm the current composer state.
2. Prefer the actual file input over a decorative upload button.
3. Retry from a clean, active Codex-browser composer rather than stacking more background modals.
4. If the documented file-chooser flow still fails, leave the uploader open and ask the user to select the exact local file. Resume after the user confirms selection.

Do not claim the destination is ready until the media preview is visible and the final composer has been checked. Report partial completion precisely.

## Verify and hand off

Before finishing, verify each destination independently:

| Destination | Required proof |
| --- | --- |
| Threads | Exact text, product link still present, requested media preview visible, final `Post` control present |
| LinkedIn | Exact caption, requested media preview visible, final `Post` control enabled |

Leave only the two useful composer tabs open. Mark completed composers as deliverables and an upload that still needs user action as a handoff. Clean up source, duplicate, error, and abandoned composer tabs.

Tell the user:

- which destinations are fully ready
- which copy and media were verified
- whether any platform still needs one manual action
- that no post was published
