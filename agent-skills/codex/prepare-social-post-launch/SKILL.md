---
name: prepare-social-post-launch
description: Prepare a tutorial, sponsored-video, or resource launch across social platforms. Use when the user wants to package source files, write and render a PDF guide, upload public downloads, stage channel-specific social posts, configure an optional comment-keyword DM automation, draft follow-up posts, or audit 4:3, 9:16, and 16:9 video exports for cross-platform distribution.
---

# Prepare Social Post Launch

Turn one long tutorial into a verified resource bundle and a review-ready social launch. Complete every reversible preparation step, but stop before publishing a social post, activating a DM automation, or uploading the full video unless the user explicitly authorizes that final action.

## Canonical video matrix

Use this distribution contract unless the user overrides it:

| Destination | Aspect ratio | Captions |
|---|---:|---|
| X | 4:3 | Burned in |
| LinkedIn | 4:3 | Burned in |
| Threads | 4:3 | Burned in |
| Instagram | 9:16 | Burned in |
| YouTube | 16:9 | No burned-in captions |

Run `scripts/inspect_video_exports.py` on candidate files before uploading. Do not infer the intended destination from a filename alone.

## Required deliverables

Prepare the applicable deliverables in one scoped bundle:

1. The exact HTML demos shown in the video
2. A ZIP containing those demos and a short README
3. A polished PDF article based on the transcript
4. Public Google Drive links for the ZIP and PDF
5. Requested social posts staged with the matching exports and final copy
6. An optional ManyChat automation targeting the next Instagram reel and a specific keyword
7. Follow-up social drafts with the download links, every resource mentioned, and the full-video link
8. A manifest recording source files, checksums, public URLs, and any unresolved fields

## Workflow

### 1. Audit the source material

- Read the applicable repository instructions.
- Inspect the video with `ffprobe` and transcribe the complete long-form version.
- Create a visual timeline or contact sheet so the article and downloads match the video.
- Identify every demonstrated HTML page from on-screen evidence, filenames, titles, and modification history.
- Verify each candidate in the Codex in-app browser. Never use Chrome.
- Package the exact demonstrated versions. Do not silently substitute a later variant.

### 2. Build the HTML download

- Preserve working standalone files as standalone files.
- Keep dependent assets beside any multi-file page.
- Add a README with opening instructions and browser requirements.
- ZIP the demos and record its SHA-256 checksum.
- Test the extracted bundle before uploading.

### 3. Write and render the article

- Use the user's requested voice skill and `no-ai-slop` when available.
- Build the article from transcript evidence, not recollection.
- Lead with the strongest practical change or surprise.
- Explain the reusable mechanism with concrete prompts and examples.
- Disclose sponsorship plainly.
- Treat price and model claims as time-sensitive. Attribute observed costs to the tutorial and advise readers to check the live estimate.
- Use the PDF skill to render the final document under `output/pdf/`.
- Render every PDF page to images and inspect the full contact sheet for clipping, overflow, broken links, and weak hierarchy.

### 4. Upload and verify downloads

- Prefer the Google Drive connector.
- If its write scope is unavailable, use the signed-in Codex browser.
- Create a clearly named folder and upload the ZIP and PDF.
- Set each delivery file to `Anyone with the link` and `Viewer` when the user has asked for public delivery.
- Read the file IDs or copied links back from the live Drive state.
- Verify that each item visibly reports shared/public access. Never invent or guess a Drive URL.

### 5. Stage requested social posts

- Match each requested destination to the verified export in the canonical video matrix.
- Check every crop and media preview visually before advancing.
- Write short platform-appropriate copy with one mechanism and one useful takeaway.
- Add a keyword CTA only when a comment-to-DM workflow is part of the request.
- Include sponsorship disclosure when applicable.
- For Instagram, turn off Facebook cross-posting unless the user asked for it.
- Stop at each platform's final share or publish control. Do not publish.

### 6. Configure ManyChat

Use the `Auto-DM links from comments` quick automation when an Instagram comment-to-DM workflow is requested.

- Target `next post or reel`.
- Match a specific memorable keyword, normally uppercase.
- Enable public comment replies and write three short, natural variants.
- Add an opening DM and a clear confirmation button.
- Deliver direct links to the HTML ZIP, PDF, and full YouTube video.
- Do not add an email gate unless the user asks for lead capture.
- Do not enable follow-gating by default.
- Stop before `Go live`.

If the YouTube URL is missing, leave an explicit `[ADD YOUTUBE URL BEFORE GOING LIVE]` marker and keep the automation inactive. Do not replace it with a different video.

### 7. Draft the follow-up social post

Prepare a separate resource post for the requested follow-up channel after the main video post. It should:

- Open with what is now available.
- Give one useful lesson from the video.
- Link the HTML archive, PDF guide, and full YouTube video.
- Include direct links to the important tools and source references.
- Stay concise enough to scan on mobile.
- Remain a draft unless the user explicitly asks to post it.

Use `references/copy-patterns.md` for reusable copy structure.

### 8. Final verification and handoff

- Confirm the local files exist and checksums match the upload sources.
- Read every social caption back from its live composer.
- Read the ManyChat trigger, replies, opening DM, and delivery message back from the live builder.
- Confirm that neither Instagram nor ManyChat is live.
- Keep relevant social and ManyChat tabs open as handoffs when user action is still required.
- Report unresolved fields prominently, especially the YouTube URL.

## Safety gates

- Uploading the requested files to the named Drive and staging requested social posts are authorized when the user asked for those actions.
- Publishing, activating an automation, sending a broadcast, and uploading a YouTube video are separate external actions. Do not infer those permissions.
- Do not let a placeholder URL reach a live automation.
- Never expose unrelated files, Drive folders, messages, contacts, or account data.
