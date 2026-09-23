---
name: prepare-video-launch-package
description: Prepare a finished video and its resources for a controlled multi-channel launch with verified exports, source-backed copy, download packaging, channel-specific handoffs, and explicit publication gates. Use for tutorials, product videos, sponsored videos, or resource releases; do not treat preparation as authorization to publish.
---

# Prepare a Video Launch Package

Build one verified source package, then derive only the channel assets the user needs. Keep upload, draft staging, publication, automation activation, messages, and follow-up engagement as separate actions.

## 1. Audit the source set

Record the final master, transcript or captions, related article, thumbnails, downloads, sponsor requirements, source links, and existing public URLs. Probe every export and reject mislabeled, stale, or duplicate masters.

Run:

```bash
python3 scripts/inspect_video_exports.py /path/to/export.mp4
```

The script reports media facts, not current platform eligibility. Verify live channel requirements against official sources before upload.

## 2. Define the deliverable matrix

For each requested channel specify aspect ratio, duration, captions, safe areas, thumbnail or cover, copy limit, destination link, disclosure, draft state, and final approval owner.

Do not create every possible derivative by default. Preserve the source master and derive only approved outputs.

## 3. Package resources

Bundle promised templates, source files, prompts, article or guide, and license or attribution notes. Scan for secrets and private data, hash the bundle, upload only when authorized, and verify the downloaded bytes before using its link in copy.

## 4. Build source-backed copy

Use [copy-patterns.md](references/copy-patterns.md). Keep claims inside the video evidence and promise only deliverables that exist. Use `$build-youtube-companion-runbooks` when a full YouTube package is required.

## 5. Prepare channel handoffs

Read [channel-checklists.md](references/channel-checklists.md) only for requested channels. Fill account identity, visibility, timing, caption, media preview, disclosures, checks, and unresolved URLs. Stop before the final publish control unless publication is explicitly authorized.

## 6. Verify the package

- Probe dimensions, frame rate, duration, codecs, and audio.
- Decode the full file when corruption risk matters.
- Inspect representative frames, captions, crop, safe areas, and thumbnail readability.
- Read staged copy and account identity back from the live composer.
- Keep placeholders out of active automation and published copy.
- Record which outputs are local, uploaded, drafted, scheduled, published, or still blocked.

## Deliver

Return a launch manifest with checksums, media properties, resource links, channel copy, draft or publication state, approvals, unresolved gates, and follow-up ownership.
