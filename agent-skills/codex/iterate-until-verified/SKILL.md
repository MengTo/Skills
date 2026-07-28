---
name: iterate-until-verified
description: Apply a prompt-agnostic execution and verification loop to any substantial task while preserving the original request. Use when the user asks to fan out work, use subagents or independent reviewers, loop until done, benchmark against references, apply a harsh critic, compare candidates blind, improve an existing prompt with verification, or continue until explicit quality gates pass.
---

# Iterate Until Verified

Preserve the task. Strengthen the process around it.

## Choose the mode

- **Execute:** Complete the original task with the workflow below. Use this mode by default.
- **Compose:** When the user asks for an improved prompt rather than the finished work, return a reusable prompt wrapper. Keep the original task authoritative and unchanged inside the wrapper.

Do not silently switch from composing a prompt to executing it.

## 1. Lock the original task

Extract:

- outcome and deliverables
- audience and use case
- supplied inputs and references
- constraints, tools, formats, and exclusions
- authorized actions and protected boundaries
- explicit definition of done

Treat these as the task contract. Do not replace the subject, invent requirements, relax constraints, expand permissions, or let the verification method become the deliverable.

Ask a question only when a missing answer would materially change the work and cannot be discovered safely. Otherwise, state a reasonable assumption and proceed.

## 2. Convert ambition into gates

Translate words such as `perfect`, `best`, `professional`, `production-ready`, or `AAA` into observable checks. Select only the dimensions relevant to the task:

- correctness and factual accuracy
- completeness against the request
- craft, clarity, and audience fit
- usability and accessibility
- robustness, edge cases, and regression safety
- performance, security, or compliance
- visual, editorial, or technical fidelity to a supplied benchmark

Create a compact acceptance matrix:

| Gate | Verification method | Pass condition | Evidence |
| --- | --- | --- | --- |
| Relevant quality dimension | Test, inspection, comparison, or read-back | Observable binary condition | Command, source, screenshot, output, or artifact |

Prefer pass/fail conditions over vague scores. A strong reaction such as “wow” may be a useful signal, but it is never the only gate.

## 3. Decompose and assign

Split the task into the smallest meaningful workstreams with clear ownership, inputs, outputs, and integration boundaries.

- Fan out only workstreams that are genuinely independent.
- Keep coupled edits with one owner to avoid racing changes.
- Give each worker the original task contract and only the context it needs.
- Require every worker to return an artifact or evidence, not a confidence claim.
- Keep one integrator responsible for cross-workstream consistency and regressions.

Use subagents or delegated workers when they are available, permitted, and useful. Otherwise, perform the workstreams sequentially while preserving the same ownership boundaries.

## 4. Separate making from judging

Do not let an implementer be the sole approver of its own work.

Give the verifier:

- the original task contract
- the acceptance matrix
- the candidate artifact
- the relevant benchmark or source material

Withhold the implementer’s rationale and self-assessment unless the verifier needs them to reproduce a check. Instruct the verifier to find failures first, cite evidence, reject unsupported claims, and return a gate-by-gate verdict.

For blind comparison:

- anonymize and randomize candidates when practical
- compare like with like using the same conditions
- keep the evaluator blind to author or candidate identity, not to the task or rubric
- do not call a comparison blind when obvious identity cues remain

## 5. Match proof to the work

Use the strongest verification surface available:

- **Code:** focused tests, typechecks, builds, linters, security checks, runtime behavior, and regression tests.
- **Visual work:** rendered output at relevant sizes, interaction checks, accessibility checks, and side-by-side comparison with an accessible reference.
- **Research or analysis:** primary sources, reproducible calculations, citation checks, and contradiction searches.
- **Writing:** factual checks, brief coverage, audience fit, structure, and an editorial pass against representative references.
- **Plans or decisions:** constraint coverage, dependency checks, failure scenarios, feasibility, and explicit tradeoffs.
- **External actions:** exact target resolution followed by post-action read-back.

Never substitute a self-rating for evidence. Never invent a benchmark, source, test result, screenshot, or blind verdict.

## 6. Run the loop

Repeat:

1. Produce or improve the candidate.
2. Run every applicable gate.
3. Record `pass`, `fail`, or `blocked` with evidence.
4. Route each failure to the responsible workstream.
5. Make the smallest revision that addresses the evidence.
6. Re-run the failed gate and any affected regression gates.
7. Integrate only verified work.

Continue while required gates fail and a safe, in-scope action can make meaningful progress. Do not churn on the same approach after repeated failure; change the approach or report the blocker.

## 7. Stop honestly

Finish only when:

- every required gate passes
- the integrated result still satisfies the original task
- regressions relevant to the changed work have been checked
- evidence supports the final claims
- remaining unknowns are disclosed

Stop as blocked when a required gate depends on missing access, unavailable inputs, new authority, or an infeasible constraint. Name the exact blocker and the minimum next action. Do not weaken a gate merely to declare success.

## Compose mode template

When returning an enhanced prompt, use this shape:

```text
Use an iterative execution-and-verification workflow around the authoritative task below.

AUTHORITATIVE TASK
<preserve the user's original task here without changing its subject, deliverables, or constraints>

PROCESS
1. Extract the task contract and convert subjective quality language into observable acceptance gates.
2. Decompose independent workstreams and fan them out when delegation is useful and permitted.
3. Keep one integrator responsible for consistency.
4. Assign an independent verifier that sees the task, rubric, candidate, and references—but not the implementer's self-assessment.
5. Verify with task-appropriate evidence. Use anonymized side-by-side comparison when a real comparable benchmark exists.
6. Route failed gates back to the responsible workstream, revise, and re-check affected regressions.
7. Do not finish until every required gate passes or a concrete blocker is proven.

FINAL RESPONSE
Return the deliverable, a concise gate-by-gate evidence summary, and anything still unverified. Do not claim checks that were not run.
```

Adapt the process to the task. Do not copy domain-specific tools, benchmarks, or quality claims from another prompt unless they apply here.

## Completion checks

- The original task remains authoritative.
- Subjective ambition became observable gates.
- Independent work was separated without creating racing edits.
- Making and judging were assigned to different roles.
- Benchmarks were real, comparable, and honestly labeled.
- Failed gates drove revisions.
- The final claims match the collected evidence.
