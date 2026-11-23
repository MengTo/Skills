---
name: browser-video-recording
description: Create polished 60 fps 4:3 4K browser screen-recording style videos from Codex in-app browser captures, with browser-only crop, natural macOS cursor styling, deliberate click choreography, zoom-follow framing, ffprobe/thumbnail verification, and optional native recording compatibility checks. Use when the user asks to record or re-record browser actions, show cursor clicks and zooms, make Dribbble/UI inspiration or product demo recordings, or asks whether Codex, Playwright, or an MCP can produce a natural browser demo video.
---

# Browser Video Recording

## Dependency Model

Separate the workflow into three layers:

1. **Browser control and source frames**: Use the Codex in-app browser through the Browser skill/MCP. Do not use Chrome when the user asks for Codex browser or the project says not to. The browser layer supplies real screenshots and real click/scroll/navigation states.
2. **Local video renderer**: Use the bundled Python script to render screenshots into an MP4 with a natural macOS cursor, subtle click scale, and calm zoom-follow framing. This does not require a screen-recording MCP.
3. **Optional native recorder integration**: Use a native recording MCP (DreamCut is one option) only when callable and explicitly useful for starting/stopping an actual app recording or opening a generated project. If unavailable, blocked, or unable to capture the Codex browser surface, fall back to the screenshot-to-video renderer and explain the fallback.

## Self-Contained Execution

This skill is enough for another Codex instance to perform the Python rendering as long as the full skill folder is installed, including `scripts/render_browser_demo.py`. Codex should run the bundled script instead of recreating the renderer.

Required local tools:

- `python3`
- Python package `Pillow`
- `ffmpeg` and `ffprobe`

Always pass a transparent cursor PNG through `cursor_asset` and set `cursor_hotspot` in the config. Never rely on the script's screencapture fallback (`swift` and `/usr/sbin/screencapture`, which flashes an overlay over the screen to grab the live cursor).

The Browser skill/MCP is still needed for fresh Codex in-app browser screenshots. If it is unavailable, use the best available browser automation screenshot source and state the fallback.

## Optional Native Recorder Support

One option is DreamCut: `dreamcut record --app "<app>" --seconds N --output-path /abs/path/take.mp4` for a recording and `dreamcut screenshot --app "<app>" --output-path /abs/path/shot.png` for a still (`dreamcut help record` lists the options).

For native app recording, verify the MCP supports:

- Use `frameRate: 60`.
- Use `resolutionRawValue: "4K"`.
- Use `ratioPresetRawValue: "4:3"` for region recordings.
- Use an explicit `selectedRegionOnScreen` when cropping to an embedded browser viewport.

For the local renderer, **4K 4:3 means `3840x2880`**. If a native recorder exposes a `4K` enum, treat it as an app-side resolution preset and pair it with `4:3` region selection when recording through that MCP.

## Capture Workflow

Use `browser:control-in-app-browser` first. After loading its docs, drive the in-app browser with the Node/browser API:

- Set viewport to `1920x1440` for 4:3 4K output, then reset it before finishing.
- Navigate to the requested page and perform actual clicks, backs, searches, and scrolls.
- Save browser-only screenshots after each important state change. Use names like `01-results-top.png`, `02-after-card-click.png`, `03-back-results.png`.
- Record the viewport coordinates of each click/scroll target. The final cursor path should land on those points, pause, click, then move to the next meaningful point.

Avoid desktop coordinate automation unless the user explicitly needs system UI. Codex browser visibility may not expose a capturable macOS surface; screenshots from the browser API are the reliable source.

## Motion Rules

Make the cursor feel purposeful:

- Use sparse, mostly straight cursor paths.
- Pause briefly on a target before clicking.
- Do not wander over unrelated UI.
- Let the page transition happen after the click, not before.
- Use only subtle click feedback: scale dip/rebound, not decorative rings unless requested.
- Keep zoom-follow calmer than the cursor. The camera should frame the clicked content, not chase every small mouse move.

Default visual target:

- Real macOS pointer extracted from the compositor, or an existing transparent cursor asset.
- Cursor scale `3.0`, matching the large cursor style commonly used in edited demo recordings.
- Click animation strength `15` for a subtle click scale dip.
- Rotation strength up to `8deg`, only from horizontal velocity.

## Render Script

Use `scripts/render_browser_demo.py` for deterministic 60 fps 4:3 4K output:

```bash
python3 /path/to/browser-video-recording/scripts/render_browser_demo.py \
  --config /tmp/browser-demo-config.json \
  --output /tmp/browser-demo-4x3-4k-60fps.mp4
```

Generate a starter config:

```bash
python3 /path/to/browser-video-recording/scripts/render_browser_demo.py --write-template
```

The config supplies:

- `shots`: map of state names to screenshot PNG paths.
- `scene_starts`: `[time, shotName, transition]` entries.
- `cursor_keys`: `[time, x, y]` viewport-coordinate entries.
- `camera_keys`: `[time, x, y, zoom]` entries.
- `click_times`: click timestamps.
- `duration`, `fps`, `output_size`, `source_size`, `cursor_scale`.

Preferred defaults:

```json
{
  "fps": 60,
  "output_size": [3840, 2880],
  "source_size": [1920, 1440]
}
```

Always set `cursor_asset` (and `cursor_hotspot`). If it's omitted, the script briefly shows a solid-color overlay and uses `screencapture` to extract the live macOS cursor, which takes over the screen while it runs: never rely on that fallback; keep a transparent cursor PNG with the project and pass it every time.

## Verification

Always verify the delivered video:

```bash
ffprobe -v error \
  -show_entries stream=codec_name,width,height,r_frame_rate \
  -show_entries format=duration,size \
  -of json /path/to/output.mp4
```

Extract at least one mid-video thumbnail and inspect it:

```bash
ffmpeg -y -ss 8 -i /path/to/output.mp4 -frames:v 1 -update 1 /tmp/browser-demo-thumb.png
```

Confirm:

- Resolution is the requested output, usually `3840x2880` for 4:3 4K.
- Frame rate is `60/1` or equivalent.
- Duration matches the request.
- Cursor is visible, natural, and on-target.
- The video is cropped to browser content, not the desktop.
- The browser viewport override has been reset.
