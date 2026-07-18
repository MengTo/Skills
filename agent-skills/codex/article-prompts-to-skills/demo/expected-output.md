# Expected skill-package handoff

## Extraction ledger

| Source prompt | Reusable capability | Proposed skill | Portable proof |
| --- | --- | --- | --- |
| Pointer lens | Bound-aware alternate-image reveal | `pointer-lens-reveal` | Pointer, touch, clamping, and reduced-motion states work in a standalone media panel |
| Reading rail | Chapter-aware page navigation | `chapter-progress-rail` | Active chapter, click navigation, keyboard focus, and responsive collapse are demonstrated |
| Archive filters | Accessible animated collection filtering | `accessible-collection-filters` | Focus preservation, live result count, filtering, and reduced-motion behavior are exercised |

## Package checklist

Each proposed folder contains:

- a concise `SKILL.md` with a portable implementation contract;
- `agents/openai.yaml` with an explicit `$skill-name` default prompt;
- `demo/PROMPT.md` with Minimal, Recreate, and Remix examples;
- a functioning, self-contained `demo/index.html`;
- a real browser-captured `demo/preview.jpg`;
- targeted validation evidence.

## Example prompt: pointer lens

### Minimal

```text
Use $pointer-lens-reveal to reveal an alternate product finish inside a pointer-following lens.
```

### Recreate

```text
Use $pointer-lens-reveal to build a self-contained product-media panel with a circular pointer lens, boundary clamping, press-and-drag touch behavior, keyboard-accessible comparison controls, and a static reduced-motion fallback. Use original assets and art direction.
```

### Remix

```text
Use $pointer-lens-reveal to adapt the mechanism to an architectural before-and-after. Change the content, lens scale, palette, and composition while preserving input parity, clamping, focus behavior, and performance constraints.
```

## Boundary decision

Create three skills. The behaviors have separate state models, inputs, and acceptance checks. Do not create one generic “editorial interactions” skill and do not copy the source page.
