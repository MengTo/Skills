# MengTo/skills

A growing library of **Clawdbot AgentSkills** — written for designers.

These skills are meant to feel like “Claude Code skills”, but tuned for **web design + prompting + shipping**:
- practical workflows
- checklists
- copy/paste recipes
- common pitfalls
- versionable files you can reuse (not one-off chat answers)

---

## Philosophy

### 1) Prompts are assets
If it’s good once, it should be reusable.
- store prompts as files
- version them
- build libraries + stylecards

### 2) Specs beat vibes
The fastest way to consistent output is:
- clear constraints
- clear hierarchy
- “change 1–2 things only” iteration

### 3) References beat paragraphs
Screenshots and examples carry:
- fonts, spacing, colors
- layout rhythm
- icon style

---

## Repo structure

```txt
agent-skills/
  ui/
    mengto-ui-prompting/
      SKILL.md
      ARTICLE.md
      REFERENCES.md
  web-design/
    pricing-page/
      SKILL.md
      REFERENCES.md
    landing-page/
      SKILL.md
      REFERENCES.md
    gsap/
      SKILL.md
      REFERENCES.md
    threejs/
      SKILL.md
      REFERENCES.md
    tailwindcss/
      SKILL.md
      REFERENCES.md
    vantajs/
      SKILL.md
      REFERENCES.md
    cobejs/
      SKILL.md
      REFERENCES.md
    unicorn-studio/
      SKILL.md
      REFERENCES.md
```

Conventions:
- `SKILL.md` is the skill (what the agent loads + follows).
- `REFERENCES.md` is links only (keep SKILL.md lean).
- Keep skills **procedural** (steps, patterns, guardrails), not encyclopedic.

---

## Current skills

### UI

#### `mengto-ui-prompting`
Design-first UI prompting system:
- prompt template (goal → format → layout → type → color → constraints)
- “variants > rerolls” workflow
- negative prompts / guardrails
- 2-pass typography workflow (generate layout, typeset in Figma)

Files:
- `agent-skills/ui/mengto-ui-prompting/SKILL.md`
- `agent-skills/ui/mengto-ui-prompting/ARTICLE.md`

### Web design

#### `pricing-page`
High-conversion SaaS pricing page skill:
- structure (above/below fold)
- plan design + comparison patterns
- conversion strategies + copy templates
- SEO/AEO checklist + FAQ schema hints
- layout types (3-card, slider, persona split, enterprise)

#### `landing-page`
High-conversion landing page (single-offer) skill:
- structure + section order
- layout types (classic, long-form, minimal, comparison)
- conversion strategies
- SEO/AEO guidance (when to index vs noindex)

#### `gsap`
GSAP animation skill:
- timelines, staggers, ScrollTrigger
- performance + cleanup patterns (SPA/React)

#### `threejs`
Three.js 3D scene skill:
- scene/camera/renderer mental model
- loaders + controls
- performance + disposal/cleanup

#### `tailwindcss`
Tailwind CSS skill:
- responsive/state variants
- safe dynamic class patterns
- component extraction + conventions

#### `vantajs`
Vanta.js animated background skill:
- init/resize/destroy
- performance + fallbacks

#### `cobejs`
cobe globe skill:
- canvas sizing/DPR
- markers + onRender rotation
- resize patterns

#### `unicorn-studio`
Unicorn Studio embed skill:
- embed patterns + attributes
- performance knobs (scale/dpi/fps/lazyload)
- common site-builder pitfalls

---

## How to add a new skill (workflow)

1) Create a folder:
- `agent-skills/<category>/<skill-name>/`

2) Add `SKILL.md`:
- frontmatter: `name`, `description`
- content: when to use, workflow, pitfalls, recipes, what to ask

3) (Optional) add `REFERENCES.md`:
- doc links only

4) Commit:
- small commits per skill

---

## Roadmap (next skills)

Web design libraries / systems:
- Framer Motion
- Radix UI
- shadcn/ui
- Next.js patterns (app router, perf, SEO)
- Webflow / Framer template checklists

Design ops:
- “Stylecards” (how to turn references into promptable systems)
- “Changelog writing” (benefit-first release notes)

---

## Publishing to GitHub later

When you’re ready to push to `MengTo/Skills`:

```bash
cd /Users/mengto/clawd/@MengTo/Skills

git remote add origin git@github.com:MengTo/Skills.git

git push -u origin main
```

If you prefer HTTPS:

```bash
git remote add origin https://github.com/MengTo/skills.git
```

---

## License
TBD.
