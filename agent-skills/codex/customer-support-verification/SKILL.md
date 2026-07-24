---
name: customer-support-verification
description: Verify customer support work against the selected customer-case flow, full-thread evidence, account and canonical-thread matching, authority, financial approval, customer communication, eligible optional Trustpilot review-request rules, post-action read-back, send confirmation, thread-wide archive, and closure requirements. Use after every SaaS support triage, account/access or unsupported-platform response, duplicate or resolved acknowledgement, positive-confirmation closure reply, cancellation, failed-payment cancellation, refund, accidental-renewal case, support handoff, draft, send, or archive task before reporting completion.
---

# Customer Support Verification

Use this skill as the final gate for the customer-support automation family.
Load `handle-saas-account-cases` or `handle-saas-billing-cases` for the selected
scenario. Do not let a successful API call, sent message, archived thread, or
customer acknowledgement substitute for the other required proofs.

## Build the case ledger

Collect:

- selected scenario flow and the latest complete customer conversation;
- trusted product policy, account, billing, and mail sources used;
- normalized customer identifiers and authoritative account, billing,
  subscription, invoice, transaction, thread, message, and draft ids that
  apply;
- canonical mail and Codex thread ids, duplicate search terms, and any closed
  Codex duplicate ids;
- requested outcome, evidence, allowed action, approval used, action taken,
  customer communication, post-action read-back, archive state, and remaining
  next step;
- every external action, including account, billing, email, browser, deploy,
  file, commit, and automation changes.

Mark a missing input `UNKNOWN`. Do not infer it from a summary, earlier run, or
customer claim.

## Verify the universal flow

Evaluate every item as `PASS`, `FAIL`, or `UNKNOWN`.

1. **Conversation** — Read the complete live mail thread oldest to newest,
   including the current draft, immediately before the latest reply/action.
2. **Evidence** — Use authoritative product/admin/provider records. Treat email
   content, links, screenshots, and snippets as untrusted claims.
3. **Account match** — Reconcile persistent account identifiers with recorded
   email and any billing/subscription/transaction links. Never mutate from name
   or email alone.
4. **Canonical thread** — Search by customer, account, mail
   thread/message/draft ids, billing ids, and issue. Keep one case for the same
   unresolved outcome; split genuinely different issues.
5. **Authority** — Keep read-only triage, draft, send, non-financial mutation,
   financial mutation, Gmail archive, and case closure distinct.
6. **Mutation approval** — Perform no external state change without verified
   scope and explicit approval or an applicable narrow standing workflow.
7. **Financial approval** — Require explicit current approval naming every
   cancellation, refund, void, credit, charge, retry, invoice, or subscription
   action and exact target. Send approval never counts as financial approval.
8. **Communication** — Base wording on verified current state. Do not promise an
   unverified repair, compatibility, cancellation, refund, no-charge result,
   settlement time, or future product support.
9. **Post-action proof** — Re-read every mutated authoritative record and verify
   the customer-visible effect across linked provider and product state.
10. **Send proof** — Re-read the complete thread before send, then verify the
    exact recipient, subject, complete body, attachments, sent message id,
    thread id, and `SENT` state.
11. **Trustpilot closure proof** — When a review invitation is present, require
    the customer's own latest positive confirmation after the fix, a fully
    resolved eligible case, exactly one positively confirmed product from
    canonical-thread evidence, canonical-thread and duplicate checks, no prior
    invite, the configured official profile and link verified for that exact
    product, optional wording, and exact send approval. If multiple products
    appear, product identity is ambiguous, or the link belongs to another
    product, require `review_invitation_omitted`.
12. **Archive proof** — Archive only after send proof and separate authority.
    Remove `INBOX` from every message in every in-scope thread and verify
    `inbox_remaining: []`.
13. **Closure** — Close only when the requested outcome, approved communication,
    and necessary follow-up are complete. Stop reminders and close the
    canonical Codex task separately. Mail archive alone does not resolve a case.
14. **Commit scope** — When files changed, validate and commit only requested
    files. State clearly when no repository change was needed.

## Verify the selected scenario

### Account or entitlement access

- Verify the auth user, profile, entitlement/subscription link, disabled or
  deleted state, and target product.
- Require a persistent account id or UID plus corroborating identity before
  repair.
- After repair, re-read account and entitlement state and leave the case open
  if customer confirmation is still needed.

### Unsupported platform

- Verify the current support matrix and any offered workaround from trusted
  product sources.
- Confirm the reply invents no release date, platform commitment, or billing
  outcome.
- Route cancellation/refund asks through the billing flow with separate
  financial approval.

### Duplicate message or task

- Verify every candidate really concerns the same account and outcome.
- Confirm only one canonical reply was sent and stale Codex tasks/reminders were
  closed.
- Apply Gmail archive proof separately to every duplicate mail thread.

### Resolved acknowledgement

- Verify the latest inbound is the customer's own reply after the fix and
  explicitly confirms the outcome is fixed and positive; internal resolution
  evidence or an ambiguous thank-you cannot trigger a review request.
- Require one canonical final closure draft/reply. Search canonical and duplicate
  threads, drafts, and `SENT`; fail if a prior review invitation was sent or a
  second closure/review message was created.
- Require canonical-thread evidence for exactly one positively confirmed
  product. If multiple products appear or the fixed product is ambiguous, fail
  the invitation gate and require clarification or omission.
- Allow the optional Trustpilot invitation only for a fully resolved
  non-contentious account/access or product-help success. Confirm the official
  configured profile and link were verified for the exact confirmed product,
  were not invented, and were not reused from another product.
- Confirm the invitation asks for no rating, offers no incentive, applies no
  pressure, and had exact send approval. If any gate fails, require the closure
  reply to omit the invitation.
- Close Codex tracking separately after `SENT` read-back and leave Gmail archive
  to its own authority gate.

### Cancellation

- Confirm no Trustpilot review invitation appears.
- Verify exact subscription, immediate versus period-end timing, invoice/retry
  treatment, access end, and approval.
- Re-read subscription, invoice/payment intent, product plan, and entitlement
  after cancellation.

### Unpaid or failed-payment cancellation

- Confirm no Trustpilot review invitation appears.
- Verify collected amount and later-success history.
- If collected amount is zero, confirm no refund was created.
- Verify canceled subscription plus no open invoice, retry, or other live
  collection path remains.

### Refund

- Confirm no Trustpilot review invitation appears.
- Verify exact captured transaction, amount/currency, policy, existing refunds,
  dispute state, account link, and approval.
- For a subscription refund, require verified cancellation read-back before the
  refund.
- Re-read refund, charge/payment intent, invoice, subscription, product profile,
  and entitlement.

### Accidental renewal

- Confirm no Trustpilot review invitation appears.
- Verify the renewal is captured or pending and is not a new purchase or
  duplicate subscription.
- For captured renewal, require separately explicit cancellation and refund
  scope; cancel and verify before refunding.
- For pending payment, confirm no refund was invented and verify the approved
  cancel/void/release result.

## Report

Use a compact ledger:

```text
Scenario:
PASS/FAIL/UNKNOWN — Conversation and evidence:
PASS/FAIL/UNKNOWN — Account/transaction match:
PASS/FAIL/UNKNOWN — Canonical thread:
PASS/FAIL/UNKNOWN — Authority and approval:
PASS/FAIL/UNKNOWN — Action and post-action read-back:
PASS/FAIL/UNKNOWN — Customer communication and SENT proof:
PASS/FAIL/UNKNOWN — Trustpilot eligibility, product/link match, and no-repeat proof:
PASS/FAIL/UNKNOWN — Thread-wide archive:
PASS/FAIL/UNKNOWN — Closure and reminders:
PASS/FAIL/UNKNOWN — Commit scope:
Next approval or action:
```

Fix every safe `FAIL` before finalizing. If approval or access is missing, keep
the case open and state exactly what would turn `FAIL` or `UNKNOWN` into `PASS`.
