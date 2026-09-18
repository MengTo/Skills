# Course publishing adapter contract

Read this only when implementing or running a destination adapter.

## Required modes

| Mode | Allowed effect |
| --- | --- |
| Dry run | Validate sources and read destination state; no mutation. |
| Draft write | Create or refresh adapter-owned draft records and upload or reuse media. |
| Verify only | Read database, provider, storage, and route state without mutation. |
| Publish | Change only reviewed publication fields after an explicit write request. |
| Narrow patch | Change one allowlisted concern such as cover, article content, attachment, or media replacement. |

Reject contradictory modes and publication without an expected-state assertion.

## Ownership and recovery

- Give each course import a stable ownership marker.
- Match lessons by stable identity plus title, not array position alone.
- Refuse to overwrite records owned by another workflow.
- Key upload reuse to the exact source checksum.
- Persist provider IDs and resume receipts after each successful step.
- Keep credentials, access tokens, and temporary authentication material out of receipts.

## Protected state

Before writing, capture the fields outside the adapter's current allowlist. After writing, compare them byte-for-byte or through normalized values. Narrow article, attachment, cover, or publication modes must not become broad course refreshes.

## Verification matrix

| Surface | Required proof |
| --- | --- |
| Local source | File, checksum, bytes, media probe, transcript, and chapters match. |
| Course store | Course and lesson identities, order, access, ownership, and expected state read back. |
| Video host | Asset readiness, duration, visibility, embed policy, and source receipt read back. |
| File storage | Uploaded bytes match the source checksum and intended access policy. |
| Learner route | Catalog, course page, player, access gate, articles, and downloads render correctly. |
| Deployment | The intended public environment serves the verified course version. |

Treat every unavailable surface as a named limitation, not an inferred success.
