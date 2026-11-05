# agent-qa evidence review demo

This portable page uses three synthetic examples. It is a learning aid for the skill, not the agent-qa product interface, a real test report, or a runtime benchmark. It makes no external network requests or application/provider calls.

## Minimal prompt

Use $agent-qa to review the supplied run evidence. Preserve the recorded verdict, match the target and build, separate observations from inferred causes, and trace any knowledge record's historical use, current status and source provenance. Report missing information as unknown. Do not start a new run or change memory during this review.

## Recreate the demo

Create a single portable HTML page with inline CSS and JavaScript. Use the fictional cases in `input.md` and the acceptance criteria in `expected-output.md`. Provide three buttons labeled Recorded failure, Older passing build, and Validation only. Each changes a run-review panel and a memidex-provenance panel. Keep the synthetic-data label visible. Show the input data in an expandable section, use textContent for data, support keyboard focus and reduced motion, and keep the layout readable on narrow screens. Render the default case at a 1280 by 720 browser viewport for `preview.jpg`.

## Remix prompt

Use $agent-qa to review a different fictional run. Supply its recorded verdict, requested and recorded builds, relevant evidence indexes, and any knowledge provenance explicitly. Update the example without guessing missing artifacts, inventing a replacement hint's origin, or turning configuration validation into an application pass. Preserve the three review distinctions and the clear synthetic-data label.
