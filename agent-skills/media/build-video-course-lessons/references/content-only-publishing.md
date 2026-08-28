# Content-only publishing

Read this only after the user authorizes remote article publication.

## Adapter requirements

The publisher must be dry-run by default and expose write plus verify-only modes. It must discover the destination schema, validate all packages before the first mutation, upload only article assets, rewrite only publication copies of Markdown, and patch only an explicit article-field allowlist.

Capture a pre-write receipt for course identity, lesson identity, video, chapters, access, order, pricing, instructor, cover, downloads, and publication state. Require those protected values to remain unchanged after the write.

## Failure behavior

- If asset upload succeeds but the record patch fails, report the exact unattached objects and reread state before retrying.
- If one lesson fails preflight, write none of the batch unless partial publication was explicitly requested.
- If authenticated rendering is unavailable, report persistence and public-route evidence separately.
- Never use a broad course importer to publish article content.
