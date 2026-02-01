# Claude Code — Repo Guide

Repo: **@MengTo/Skills**

This repo contains Clawdbot-style AgentSkills written for designers.

## What to do here
- Add new skills (new folders under `agent-skills/`)
- Improve existing skills (`SKILL.md` + `REFERENCES.md`)
- Keep docs procedural: checklists, recipes, pitfalls, workflows

## Folder contract
Each skill folder should look like:

```txt
agent-skills/<category>/<skill-name>/
  SKILL.md            # required (frontmatter + steps)
  REFERENCES.md       # optional (links only)
  ARTICLE.md          # optional (long-form)
  assets/             # optional
  scripts/            # optional
```

Conventions:
- `SKILL.md` should be concise + actionable.
- `REFERENCES.md` should be links only (no big explanations).
- Prefer copy/paste snippets and “when to use” triggers.

## Style
- Write like Meng To: skimmable, practical, confident.
- Prefer constraints and defaults (durations, spacing, hierarchy).
- Avoid fluff.

## Safety
- Don’t include secrets, API keys, tokens.
- Don’t paste private client info.

## Suggested workflow (for Claude)
1) Identify the most specific skill folder.
2) Update `SKILL.md` first.
3) Add/refresh links in `REFERENCES.md`.
4) Keep changes small and commit with a clear message.

## Git
This folder is its own git repo. Work from:

```bash
cd /Users/mengto/clawd/@MengTo/Skills
```
