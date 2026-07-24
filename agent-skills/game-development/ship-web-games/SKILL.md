---
name: ship-web-games
description: Package, deploy, and verify a playable Three.js or web game. Use for release builds, asset delivery, private/public deployment, production smoke tests, browser proof, release notes, rollback readiness, and cleanup of temporary QA resources.
---

# Ship Web Games

Release only a verified commit and prove the deployed game, not merely the local build.

## Release sequence

1. Confirm the exact integration commit and preserve unrelated work.
2. Run focused tests, lint/type checks, production build, and diff checks.
3. Package and deploy the exact validated commit.
4. Poll deployment status and open the production game in the repository-approved browser.

## Production proof

Verify load, first input, one combat or core interaction, assets, save/settings if applicable, responsive view, console health, and representative performance. Report the deployed state separately from local readiness.

## Finish cleanly

Record release evidence and rollback target. Close temporary dev servers, benchmarks, and QA tabs once no longer needed; do not terminate resources owned by another active task.
