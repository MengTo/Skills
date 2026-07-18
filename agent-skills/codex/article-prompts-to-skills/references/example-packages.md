# Example Packages

Use these examples to calibrate extraction depth and prompt specificity. Adapt the structure; do not copy the subjects or visual treatments by default.

## Example 1: Four Independent Visual Behaviors

Source: an article containing four prompts for a floral scroll experience.

| Source behavior | Skill package | Why it stands alone |
| --- | --- | --- |
| Ambient drifting elements | `ambient-section-particles` | Reusable without scroll or typography |
| A timeline controlled by page progress | `scroll-progress-timeline` | Own state model and navigation behavior |
| A frame sequence scrubbed by scroll | `scroll-scrubbed-visual-sequence` | Distinct asset-loading and interpolation contract |
| Words revealed as the reader scrolls | `scroll-scrubbed-word-reveal` | Distinct text segmentation and accessibility contract |

Sample prompts for one extracted skill:

**Minimal**

```text
Use $scroll-progress-timeline to add a fixed chapter rail that marks the active section and lets keyboard users jump between chapters.
```

**Recreate**

```text
Use $scroll-progress-timeline to build a self-contained editorial demo with a vertical progress rail, four anchored chapters, an active indicator derived from document progress, clickable labels, visible focus states, and reduced-motion behavior. Keep the content and visual system original.
```

**Remix**

```text
Use $scroll-progress-timeline to reinterpret the same mechanism for a product release story. Change the copy, palette, chapter count, and rail placement while preserving progress calculation, keyboard navigation, responsive collapse, and accessibility semantics.
```

## Example 2: Mixed Reusable and Page-Specific Prompts

Source: a landing-page article with prompts for a magnetic button, a WebGL hero, a pricing grid, a founder quote, and a branded footer.

Extract only capabilities with a portable contract:

- create `magnetic-pointer-target` if the hover physics and input fallbacks are explicit;
- create or update `pointer-reactive-webgl-background` if shader behavior, performance limits, and fallbacks are documented;
- update an existing pricing-page skill if the grid is ordinary information architecture;
- do not create a founder-quote skill from editorial copy alone;
- do not create a branded-footer skill when the prompt is mostly source-specific layout.

The correct result may be two skills from five prompts.

## Example 3: A Workflow Prompt Pack

Source: a tutorial describing how to convert a reference page into multiple screenshot-backed interaction prompts.

Keep the workflow together when capture, evidence mapping, prompt writing, and article insertion form one verified handoff. Package it as one workflow skill with:

- a focused `SKILL.md`;
- `demo/input.md` containing a fictional source packet;
- `demo/expected-output.md` showing the extraction ledger and handoff;
- `demo/index.html` visualizing the workflow without pretending to run external systems;
- example prompts for minimal use, exact recreation, and a subject-matter remix.

Do not split “take screenshot,” “write prompt,” and “update article” into separate skills unless they are independently requested and useful outside the workflow.

## Quality Test

A package is portable when another agent can:

1. identify the trigger from the description;
2. apply the method to a new subject without seeing the source article;
3. reproduce the important behavior from the instructions and examples;
4. verify the result from explicit acceptance checks;
5. distinguish the mechanism from the demo's art direction.
