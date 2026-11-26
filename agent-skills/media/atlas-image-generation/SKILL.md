---
name: atlas-image-generation
description: Use when the user wants to generate and download an image through Atlas Cloud, including live image-model discovery, schema-validated request options, safe one-time submission, bounded result polling, and local artifact verification.
---

# Atlas Image Generation

Generate an image through Atlas Cloud only when the user wants a new artifact.
Use the existing `aura-asset-images` or `unsplash-asset-images` skills when a
licensed stock image already solves the job.

## Guardrails

- Read `ATLASCLOUD_API_KEY` from the environment. Never print or persist it.
- Fetch the live model catalog before every generation. Do not rely on a
  remembered model ID.
- Fetch the selected model's schema and send only fields it declares.
- Submit the generation POST exactly once. A timeout can still mean the paid
  task was created, so never retry an ambiguous POST.
- Retry only catalog, schema, result, and output GET requests with a finite
  bound.
- Download returned URLs promptly because provider outputs can expire.
- Stop before submission when the credential, model, schema, or user approval
  is missing.

## Workflow

1. **Define the artifact.** Confirm the subject, composition, visual style,
   aspect ratio, required text, brand constraints, and destination.
2. **Prefer reuse when appropriate.** Use a stock-image skill for generic
   photography. Generate only when the brief needs an original composition or
   visual treatment.
3. **Discover live models.** Run the bundled helper with `--list-models`. Pick
   an exact image model that is visible in the current catalog.
4. **Inspect the request before spending.** Run `--dry-run` with the chosen
   model, prompt, and options. The helper fetches the live schema and rejects
   unsupported fields.
5. **Confirm cost-bearing work.** Show the non-secret request summary and ask
   for confirmation when the user has not already approved generation.
6. **Submit once.** Run the same command without `--dry-run`. Do not rerun it if
   submission times out or returns an unknown outcome.
7. **Poll and download.** Let the helper poll the schema-declared result path
   with a finite limit, then download the first completed image.
8. **Verify the artifact.** Confirm the file exists, is non-empty, and is an
   image before reporting success. Inspect it visually when composition or text
   accuracy matters.

## Helper

Resolve the skill directory in the active agent environment, then list the
currently available image models:

```bash
python3 "<skill-root>/scripts/generate_image.py" --list-models
```

Preview a schema-validated request without submitting it:

```bash
python3 "<skill-root>/scripts/generate_image.py" \
  --model "<exact-id-from-live-list>" \
  --prompt "Editorial product scene, balanced composition, no text" \
  --param 'size="1024x1024"' \
  --output outputs/atlas-images/product-scene.png \
  --dry-run --json
```

After approval, remove `--dry-run` and keep the remaining arguments unchanged.
The helper supports:

- `--prompt`, `--prompt-file`, or stdin
- `--param key=<json-value>` for model-specific schema fields
- `--params-json '{...}'` for several model-specific fields
- `--poll-interval` and `--max-polls` for bounded polling
- `--output` for the downloaded image path
- `--json` for machine-readable output

Resolve `<skill-root>` to this skill's installed directory before running the
command. Do not assume the user's project directory contains the bundled script.

## Prompt Recipe

Build the prompt in this order:

```text
subject + action/state + environment + composition + lighting + material/style
+ camera/render treatment + intended use + exclusions
```

Keep requirements concrete:

- Name the focal subject and its position.
- Specify negative space when the image will carry overlaid text.
- State `no text` when generated lettering is unwanted.
- Describe palette and material instead of using vague taste words.
- Separate must-have constraints from optional atmosphere.
- Avoid requesting logos, public figures, or copyrighted characters unless the
  user has the rights and the provider permits the request.

## Result States

- **completed:** Return the request ID, verified local path, model ID, and final
  prompt.
- **failed:** Return the provider status and sanitized error. Do not invent an
  artifact.
- **polling timeout:** Return the request ID and unknown final status. Do not
  create a replacement task.
- **ambiguous submission:** State that the POST outcome is unknown and stop.
- **blocked before submission:** Explain the missing key, schema, model, or
  approval without making a paid request.

## Anti-Patterns

- Do not hardcode a model catalog into this skill.
- Do not copy parameters from another model's examples.
- Do not retry a POST because the client timed out.
- Do not expose the API key in command output, logs, commits, or URLs.
- Do not claim success from a request ID alone.
- Do not report a downloaded file without checking its bytes and media type.
- Do not generate a new image when a suitable existing asset is cheaper,
  faster, and legally clearer.

## Acceptance Checks

- The selected ID came from the current live catalog.
- Every submitted option exists in the current model schema.
- Exactly one generation POST was attempted.
- Result polling stopped at a terminal state or the configured bound.
- The delivered local file is non-empty and has an image content type.
- The final response names any unresolved visual, rights, or expiry risk.
