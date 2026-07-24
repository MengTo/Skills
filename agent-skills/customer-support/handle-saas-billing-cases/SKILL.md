---
name: handle-saas-billing-cases
description: Run evidence-first customer-case flows for SaaS subscription cancellations, unpaid or failed-payment cancellations, refund requests, and accidental renewals. Use when a customer asks to stop a subscription, prevent another retry, cancel after a failed payment, refund a payment, reverse an unintended renewal, or confirm the resulting billing and entitlement state.
---

# Handle SaaS Billing Cases

Resolve billing cases against verified provider and product state. Keep
investigation read-only until the user explicitly approves the exact financial
action and target.

## Start every case

1. Read the complete live customer thread and trusted billing policy. Identify
   the latest inbound message, current draft, requested outcome, and any
   ambiguity about timing, amount, product, or account.
2. Search mail and Codex tasks by normalized email, account id or UID, billing
   customer id, subscription id, invoice id, charge or payment-intent id, mail
   thread/message/draft ids, and issue phrase. Keep one canonical case.
3. Reconcile three systems without substituting one for another:
   - payment provider: customer, subscription, invoice, payment intent, charge,
     refund, amount, currency, and status;
   - product: auth account, profile, plan, entitlement, and access state;
   - email: complete thread, existing drafts, prior sends, and current approval.
4. Match the persistent product account to the provider customer/subscription
   and the exact transaction. Stop when identifiers disagree, multiple live
   subscriptions qualify, or test/live environments are ambiguous.
5. Record the proposed mutation as `action + exact target + timing + amount and
   currency when applicable + customer-visible effect`.

Read-only investigation and unsent drafting are allowed when requested.
Cancellation, refund, void, credit, invoice, charge, retry, and subscription
changes always require explicit current approval for the exact action. Approval
to investigate, send a reply, or perform one billing action does not approve
another.

## Flow: Cancellation request

1. **Evidence** — Verify the active subscription, product account, plan,
   collection method, cancellation state, current period end, latest invoice,
   payment/retry state, and entitlement behavior.
2. **Match** — Require one exact subscription linked to the verified account. If
   immediate versus period-end cancellation is unclear, ask; do not infer the
   more destructive option.
3. **Allowed action** — Explain verified options and prepare an unsent draft.
   Do not cancel or change invoices during triage.
4. **Approval gate** — Request approval naming subscription, immediate or
   period-end timing, invoice/retry treatment, and expected access end. Treat
   cancellation as a financial mutation.
5. **Customer communication** — Before action, acknowledge the request without
   saying it is canceled. After action, state the effective date and access
   result shown by read-back.
6. **Post-action verification** — Re-read subscription status and cancellation
   fields, current-period end, latest invoice/payment intent, retry schedule,
   product profile, and entitlement. Confirm no unintended second subscription
   remains.
7. **Closure** — Close only after the approved cancellation and reply state are
   verified. Keep open when access timing, invoice state, or customer
   confirmation remains unresolved.

## Flow: Unpaid or failed-payment cancellation

1. **Evidence** — Verify subscription state, latest invoice, payment intent and
   charge history, attempt timestamps, retry schedule, and the total actually
   collected.
2. **Match** — Link the failed payment and subscription to the verified product
   account. Distinguish a failed attempt followed by later success from a still
   unpaid account.
3. **Allowed action** — Draft a factual acknowledgement. If collected amount is
   zero, record `no_refundable_payment`; never create a fake refund.
4. **Approval gate** — Obtain exact approval to cancel the subscription and to
   void an open invoice, cancel a payment intent, or stop provider retries when
   each action is needed. Do not bundle unstated financial actions.
5. **Customer communication** — Say that cancellation or retry prevention is
   being checked until the provider read-back proves it. Do not say "no charge"
   unless transaction evidence shows zero collected.
6. **Post-action verification** — Re-read canceled subscription state, invoice
   status, payment intent, charge total, next retry, product plan, and
   entitlement. Require no live retry path for the canceled obligation.
7. **Closure** — Close after the canceled/no-retry state and customer reply are
   verified. If a later successful charge exists, route it to the refund or
   accidental-renewal flow.

## Flow: Refund request

1. **Evidence** — Identify the exact captured transaction, amount, currency,
   date, invoice, charge/payment-intent status, existing refunds, dispute state,
   policy eligibility, and linked subscription.
2. **Match** — Require the transaction-to-customer-to-product chain. Do not
   refund from email, name, amount, or last-four data alone. Stop on multiple
   plausible charges or an active dispute that requires a separate workflow.
3. **Allowed action** — Investigate and draft without mutation. State the exact
   refundable amount and whether the customer also asked to end the
   subscription.
4. **Approval gate** — Obtain explicit approval for full or partial amount,
   currency, transaction, and reason. For every subscription refund, cancel the
   verified subscription first and read back cancellation before creating the
   refund. A one-time purchase refund has no invented subscription step.
5. **Customer communication** — Before action, say the request is under review.
   After read-back, state the actual refunded amount and provider-confirmed
   status; qualify settlement timing instead of guaranteeing it.
6. **Post-action verification** — Re-read refund id/status/amount/currency,
   charge refunded totals, payment intent, invoice, subscription, product
   profile, and entitlement. Verify the mutation did not target another
   transaction or leave a subscription active.
7. **Closure** — Close after refund and subscription/product state are verified
   and the approved reply is sent. Keep open for pending/failed refund state or
   missing customer-visible confirmation.

## Flow: Accidental renewal

1. **Evidence** — Verify the renewal invoice, transaction timestamp, captured
   versus pending state, amount/currency, subscription term, prior cancellation
   signals, existing refunds, and current access.
2. **Match** — Link renewal, subscription, and product account. Check for
   duplicate subscriptions and distinguish a new purchase from an automatic
   renewal.
3. **Allowed action** — Explain the verified state and draft the proposed
   remedy. If payment is pending or uncaptured, do not create a refund.
4. **Approval gate** — For a captured renewal, separately name cancellation
   timing and refund amount/currency in the approval request. Cancel first,
   verify cancellation, then refund. For a pending payment, request only the
   provider-supported cancel/void/release action actually required.
5. **Customer communication** — Acknowledge the unintended renewal without
   promising reversal before approval and read-back. Afterward, report
   cancellation, access, and payment outcomes separately.
6. **Post-action verification** — Re-read subscription, invoice, payment intent,
   charge, refund, product plan, entitlement, and any retry or next-renewal
   fields. Confirm no duplicate refund or active renewal remains.
7. **Closure** — Close only when all approved remedy components and the final
   reply are verified. Leave open if the refund is pending, the provider action
   failed, or another subscription still qualifies.

## Send, archive, and handoff

Use `customer-email-draft-threads` for mailbox operations. Re-read the full
thread before send, verify the approved message in `SENT`, and only then perform
an authorized archive by removing `INBOX` from every message and proving
`inbox_remaining: []`. Do not confuse a provider mutation, sent reply, mail
archive, and resolved case.

Finish with:

```text
Case:
Evidence across provider/product/email:
Account and transaction match:
Canonical mail/Codex threads:
Financial action taken:
Approval used or still needed:
Customer communication state:
Post-action read-back:
Archive state:
Closure state and next step:
```

Run `customer-support-verification` before claiming completion.
