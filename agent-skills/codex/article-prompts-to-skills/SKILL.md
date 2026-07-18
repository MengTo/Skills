---
name: article-prompts-to-skills
description: Convert an article, tutorial, or prompt pack into focused reusable AgentSkills, one independent capability per skill, with portable instructions, example prompts, working demos, preview screenshots, validation, gallery updates, and a narrow commit. Use when the user asks to turn an article's prompts, tutorial sections, design patterns, interactions, or workflow ideas into complete skills rather than leaving them as prose.
---

# Article Prompts to Skills

Turn source prompts into small, demonstrable capability packages. Preserve the useful behavior, not the source page's brand or layout.

## 1. Inspect Before Extracting

1. Read the repository instructions and the complete source article.
2. Run `git status --short`; preserve unrelated work.
3. Inventory every explicit prompt, heading, example, asset, and acceptance criterion.
4. Search existing `SKILL.md` files for overlapping capabilities before creating folders.
5. If the source is raw HTML and the prompts do not exist yet, use `$html-to-interaction-prompts` first, then return here.

Do not infer a family of skills from a title alone. Trace each proposed skill to source evidence.

## 2. Build an Extraction Ledger

Create a working table before editing files:

| Source prompt | Reusable capability | Keep | Remove | Skill name | Demo proof |
| --- | --- | --- | --- | --- | --- |

Apply these boundaries:

- Create one skill per independently reusable behavior.
- Merge steps only when separating them would make either step unusable.
- Update an existing skill when its contract already covers the capability.
- Skip decorative or editorial fragments that do not create a repeatable method.
- Name skills after the outcome or mechanism, never after the source article.

## 3. Extract the Portable Contract

Keep the source's successful mechanics:

- behavior and state transitions;
- data model and parameter defaults;
- timing, easing, spacing, and responsive rules;
- accessibility, reduced-motion, and keyboard behavior;
- performance constraints and failure modes;
- acceptance checks that prove the result.

Remove source-specific packaging:

- brand names, marketing copy, and proprietary content;
- page layout that is unrelated to the capability;
- hard-coded palettes, assets, and selectors;
- incidental implementation choices that do not affect the outcome.

The result must transfer to a different subject, layout, and visual system without rewriting the core instructions.

## 4. Package Every Skill

Initialize every new folder with the installed `skill-creator` initializer, then complete this contract:

```text
agent-skills/<category>/<skill-name>/
  SKILL.md
  agents/openai.yaml
  references/          # only when detailed reusable guidance is needed
  assets/ or scripts/  # only when the workflow genuinely reuses them
  demo/
    index.html
    PROMPT.md
    preview.jpg
    input.md            # required for workflow skills
    expected-output.md  # required for workflow skills
```

Write `SKILL.md` in imperative form. Keep only `name` and `description` in frontmatter. Put all trigger phrases in the description. Keep operational steps, constraints, pitfalls, and validation commands in the body.

Write `agents/openai.yaml` from the final skill:

- use a human-readable display name;
- keep the short description between 25 and 64 characters;
- make the default prompt explicitly invoke `$skill-name`.

## 5. Write Three Useful Example Prompts

Put these headings in `demo/PROMPT.md`:

### Minimal prompt

Invoke the skill and ask for one clear outcome.

```text
Use $skill-name to add <capability> to <target>.
```

### Recreate the demo

Describe the reference experience, implementation contract, deliverables, and acceptance checks. Specify what must remain local and self-contained.

### Remix prompt

Change the subject, content, palette, and composition while preserving the mechanism, accessibility behavior, responsive rules, and performance contract.

Read [references/example-packages.md](references/example-packages.md) for visual, mixed-source, and workflow examples.

## 6. Build Proof, Not Decoration

Make every demo original, self-contained, and inspectable:

- demonstrate the core mechanism on the first screen;
- use realistic content instead of labels such as “demo card”;
- add controls only when they expose meaningful states;
- support 390px through 1440px layouts;
- use semantic HTML and visible focus states;
- provide reduced-motion behavior for animated work;
- keep dependencies local and avoid a build step unless the skill requires one;
- use `input.md` and `expected-output.md` for nonvisual workflows.

Never treat a screenshot as the implementation. The HTML demo must work.

## 7. Validate the Complete Package

Run validation in proportion to the artifact:

1. Run the skill creator's `quick_validate.py` on every new or changed skill.
2. Run repository demo validation and any targeted syntax checks.
3. Open each demo in the permitted browser at desktop and mobile sizes.
4. Exercise the primary interaction, keyboard focus, and reduced-motion path.
5. Confirm the console is clean.
6. Capture a real browser preview at the repository's shared dimensions.
7. Rebuild the demo and screenshot galleries, then validate again.
8. Scan changed files for secrets, tokens, private paths, and private client data.

Do not claim visual or interaction verification from static file inspection alone.

## 8. Commit Only the Task

Stage the new skill folders and the gallery files they require. Review `git diff --cached --stat` and `git diff --cached` before committing. Leave pre-existing dirty files untouched.

Report:

- the source-to-skill mapping;
- the example prompt and demo paths;
- validation and browser evidence;
- the commit hash;
- unrelated dirty files that remain outside the commit.

## Failure Modes

- **Page clone:** copying the source layout instead of extracting the mechanism.
- **Mega-skill:** combining independent prompts into one vague skill.
- **Micro-fragments:** turning every sentence into a skill without reusable behavior.
- **Theme lock-in:** hard-coding the source's palette, assets, or copy.
- **Prompt-only package:** omitting a functioning demo and preview.
- **Fake proof:** claiming interaction verification without exercising it.
- **Dirty-tree spillover:** staging unrelated modifications or generated files.
