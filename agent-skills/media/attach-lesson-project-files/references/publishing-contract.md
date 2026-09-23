# Attachment publishing adapter contract

Read this only after remote upload and attachment are authorized.

## Scope the write

- Resolve the exact parent and lesson identities from the live destination.
- Capture a pre-write receipt for every protected field.
- Patch only the attachment collection and required audit fields.
- Preserve existing attachments unless an exact owned entry is being replaced.
- Do not expose a public URL when the destination requires protected delivery.

## Required modes

- default dry-run: validate source checksums, destination identity, access, and write plan;
- write: upload verified bytes and patch only the attachment field;
- verify-only: read records, download stored bytes, and compare checksums.

Use stable object identities for safe retry. If upload succeeds but record attachment fails, report the unattached object and reread state before retrying or cleaning up.

## Verification

Confirm stored bytes, metadata, access policy, learner-facing filename and size, record read-back, and authenticated route behavior when access is available.
