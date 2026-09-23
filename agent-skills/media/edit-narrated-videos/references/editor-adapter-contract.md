# Editor adapter contract

An adapter maps this generic workflow to one editor without leaking editor-specific commands into the core skill.

## Capability declaration

Declare each capability as supported, unsupported, or manual:

- idle or activity status;
- exact project identity and editing context;
- decoded timeline and source audio access;
- dry-run edit planning;
- recoverable version creation;
- synchronized timeline mutation;
- caption regeneration and text-only correction;
- project validation;
- export;
- export receipt and physical file path.

## Required receipts

Mutation receipts should include the project identity, before-version identity, reviewed edit plan, removed and retained ranges, affected linked tracks, duration before and after, warnings, and validation result.

Export receipts should include the exact project version, destination path, requested settings, adapter result, and time. Verify the physical output independently.

## Safety rules

- Do not use a stale connection endpoint or implicit active document when an exact identity is available.
- Do not mutate while the editor is recording, exporting, busy, or unclear.
- Do not write an opaque project file directly.
- Do not claim unsupported capabilities.
- Keep provider upload and publication outside the adapter.
