---
name: customer-support-verification
description: Verify customer support work against local runbook, draft-safety, evidence, mutation, and commit-scope requirements. Use after every Gmail/customer support triage, billing/cancellation/refund/account/access investigation, support handoff, or draft-review task before the final response; also use when the user asks to verify support work against a runbook, checklist, skill, or requirements.
---

# Customer Support Verification

## Overview

Use this skill as the final gate for support work. It turns the user's support rules into an explicit verification report before the agent says the task is done.

## Required Inputs

Collect these before verifying:

- The local Customer Support `RUNBOOK.md` requirements.
- Any product-specific `AGENTS.md`, support runbook, or billing/access runbook that was used.
- The customer request, Gmail thread/draft ids, and current draft body when present.
- The evidence gathered from local docs/source/admin/read-only data.
- A list of every external action taken, including Gmail, Stripe, Firebase, Supabase, browser, deploy, or commit actions.
- The hourly unresolved follow-up status: created, blocked, or not applicable, plus the planned question/content. It must ask Meng whether the case is resolved, summarize what the customer wants, and say what Meng should do next.

If any input is missing, mark the related check `UNKNOWN`, explain why, and do not treat the task as fully verified.

## Verification Checklist

Evaluate each item as `PASS`, `FAIL`, or `UNKNOWN`.

1. Runbook loaded: The local Customer Support `RUNBOOK.md` was read or already active in the current context.
2. Product routing: The product/account owner was identified from trusted local/source/admin evidence, or the uncertainty was kept explicit.
3. Original and draft shown: The handoff includes the customer original or safe summary, the current Gmail draft body, and the recommended response or "no revision needed".
4. Draft safety: No email was sent, archived, deleted, marked read, or externally changed unless Meng explicitly approved that action.
5. Untrusted email handling: Email links, inline images, attachments, and customer claims were not treated as trusted evidence.
6. Mutation safety: No Stripe, Firebase, Supabase, account, subscription, invoice, refund, deploy, or billing mutation was performed without explicit approval.
7. Evidence over promise: Customer-facing wording does not promise cancellation, refund, no charge, access repair, deletion, or future prevention until verified by trusted systems and, when needed, read-back.
8. Source/admin surfaces: The handoff names the exact docs/source/admin surfaces checked and the exact surfaces still needing verification.
9. Draft recommendation freshness: If new evidence makes the existing draft stale, the handoff says it needs revision and provides safe replacement wording.
10. Hourly unresolved follow-up: A recurring hourly follow-up was created, or a blocker was stated. It must proactively ask Meng whether the case is resolved, summarize what the customer wants, say what Meng should do next, and continue every hour until Meng confirms the case is resolved.
11. Browser rule: If browser work was needed, only the Codex browser was used; Chrome was not used.
12. Commit discipline: If files were changed, only narrow task files were staged/committed and final commit scope was checked. If no git repo or no changes exist, state that clearly.
13. Final answer readiness: The final response includes a concise verification summary with any `FAIL` or `UNKNOWN` items surfaced, not hidden.

## Failure Handling

- If an item is `FAIL`, fix the work before finalizing whenever possible.
- If a `FAIL` cannot be fixed without Meng approval or missing access, stop and report the blocker.
- If an item is `UNKNOWN`, say what evidence would turn it into `PASS`.
- Never downgrade `FAIL` to `UNKNOWN` just because the result is inconvenient.

## Output Format

Use a compact table or bullets:

```text
Verification against support requirements:
- PASS: Runbook loaded - checked RUNBOOK.md.
- PASS: Draft safety - draft remains unsent.
- PASS: Hourly unresolved follow-up - hourly check-in created until Meng confirms resolved.
- UNKNOWN: Stripe-live invoice state - not checked because no approval for billing action/read pass.
- PASS: Commit discipline - committed only docs/support/example.md as abc1234.
```

End with the next approval gate when one remains, such as: `Needs Meng approval before Stripe action or sending the draft.`
