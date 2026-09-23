# Video lesson package contract

## Directory shape

```text
course-slug/
└── lesson-slug/
    ├── content.md
    ├── manifest.json
    ├── transcript.txt
    └── images/
        ├── source-0034s.jpg
        └── finished-result.jpg
```

`content.md` is the authored source. `transcript.txt` is evidence. `manifest.json` records source identity and image order; it must not duplicate the article text.

## Final-video config

```json
{
  "course": {"title": "Course title", "slug": "course-slug"},
  "outputRoot": "./content/courses/course-slug",
  "lessons": [
    {
      "number": 1,
      "title": "Lesson title",
      "slug": "lesson-slug",
      "video": "/path/to/final-master.mp4",
      "transcript": "/path/to/verified-transcript.txt",
      "expectedVideoSha256": "optional-64-character-sha256",
      "captures": [
        {"videoSeconds": 34, "name": "workflow-state", "brief": "The state where the workflow begins"}
      ]
    }
  ]
}
```

Relative paths resolve from the config directory. Capture names use lowercase hyphen slugs. Timestamps must fall inside the video duration.

## Editor-adapter contract

An editor adapter may build the same directory and manifest, but it must add:

- `sourceMethod: "editor-project"`;
- `editorAdapter` with `name` and `version`;
- `editorProject` with a project path or stable identity;
- `requestedTimelineSeconds` and `mappedSourceSeconds` for each capture;
- `captureMethod` for each capture;
- `includedEffects` and `excludedEffects` arrays for each capture.

The generic validator accepts adapter packages but does not validate editor-specific internals. The adapter owns those checks.

## Manifest invariants

- exact source video path, checksum, bytes, duration, dimensions, frame rate, and audio presence;
- transcript source and non-empty transcript;
- ordered image list matching Markdown;
- provenance for every extracted or generated visual;
- no credentials, private URLs, or article text.
