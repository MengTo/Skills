# Synthetic review inputs

These are fictional teaching cases, not captured agent-qa CLI output.

1. Recorded failure: `example-settings-rc7`, staging build rc7, verdict FAILED. Test 0, step 2 expected the settings screen, which was not observed. The network evidence shows HTTP 503 for the settings request. No console events or screenshot were supplied. The digest suggests a navigation regression, without a confirmed cause. Knowledge record `example-settings-hint` was used by this run and was superseded afterward. Supplied provenance: "Learned from an earlier staging onboarding run; later replaced by a direct settings-link hint." The replacement hint's source is not supplied.
2. Older pass: `example-checkout-rc6` passed on staging build rc6. The requested target is rc7. No rc7 run, knowledge record or provenance was supplied.
3. Validation only: configuration validation succeeded and dry-run discovery selected one test for staging rc7. No application steps ran, no run ID or verdict exists, and no knowledge record was inspected.

The request in all three cases is a read-only review. No application execution, retry or memory change is authorized by these fictional inputs.
