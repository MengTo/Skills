# HeyGen's API, as the scripts use it

Base `https://api.heygen.com/`, header `x-api-key: $HEYGEN_API_KEY`. Every answer is `{ data }` or `{ error: { code, message } }`. Docs: developers.heygen.com (`/llms.txt` indexes every page as Markdown).

## Upload (upload.mjs)

1. `POST v3/assets/direct-uploads` with `{ filename, content_type, size_bytes }` → `{ asset_id, upload_url, upload_headers }`
2. `PUT upload_url` with exactly `upload_headers` and the bytes
3. `POST v3/assets/{asset_id}/complete` with `{}`

Up to 200 MB. An asset id stays usable until you delete it, so a retry reuses it.

## Train a twin (train.mjs)

`POST v3/avatars`:

```json
{ "type": "digital_twin", "name": "Ada · March takes",
  "file": { "type": "asset_id", "asset_id": "…" },
  "avatar_group_id": "…" }
```

Leave `avatar_group_id` out for a new character. The answer has `avatar_item` (the look: `id` is the `avatar_id` you render with, `default_voice_id` is the voice cloned from this footage) and `avatar_group` (the character: `id` and `consent_status`).

Poll `GET v3/avatars/looks/{look_id}` every 30 s until `status` leaves `processing`. A finished look carries `image_width`, `image_height` and `supported_api_engines` (`avatar_v`, `avatar_iv`, `avatar_iii`). A failed one carries `error.code`: `training_failed` or `moderation_failed`.

## Consent (consent.mjs)

`GET v3/avatars/{group_id}` shows `consent_status`: `pending`, `accepted` or `rejected`. `POST v3/avatars/{group_id}/consent` with `{}` returns `url`, a page where the person records a short statement on camera, valid 24 hours. Enterprise accounts can send `consent_video` instead. A twin renders only once its look is `completed` and its consent `accepted`.

## Render (render.mjs)

`POST v3/videos`, with a new `Idempotency-Key` header for each new render:

```json
{ "type": "avatar", "avatar_id": "<look_id>",
  "audio_asset_id": "…",
  "engine": { "type": "avatar_iv" },
  "resolution": "1080p", "aspect_ratio": "auto", "title": "…" }
```

- Audio: `audio_asset_id` or `audio_url` (a public https mp3 or wav), never with `script`. Words: `script` and `voice_id` instead.
- A photo: `{ "type": "image", "image": { "type": "asset_id" | "url", … } }` with the same audio fields. It's always Avatar IV.
- `engine.type`: `avatar_v`, `avatar_iv` (the default) or `avatar_iii`. Avatar V also takes `more_blinking` and `reference_look_id`.
- `motion_prompt`: gestures in words, for photo avatars, and for twins on Avatar V. It didn't calm an over-acting mouth.
- `expressiveness`: `low` (the default), `medium` or `high`, photo avatars on Avatar IV only.

The answer is `{ video_id, status: "waiting" }`. Poll `GET v3/videos/{video_id}` every 20 s: `pending`/`waiting`, `processing`, then `completed` with `video_url` (presigned, so download it at once) and `duration`, or `failed` with `failure_message`.

## The wallet (balance.mjs)

`GET v3/users/me` → `data.wallet.remaining_balance` in dollars. It's the account's, shared by everything on that key.

## Prices (November 2026)

| | |
|---|---|
| A digital twin | about $2.13 |
| Avatar V, twin | $0.12 a second |
| Avatar IV, twin | $0.0805 a second |
| Avatar III, twin | $0.01 a second |
| A photo, Avatar IV | $0.0385 a second |

Billed on the video's real length.
