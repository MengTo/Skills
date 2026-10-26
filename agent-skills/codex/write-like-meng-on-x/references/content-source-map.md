# Content Source Map

Use this map to bring Meng's real context into X writing without copying whole articles or repeating old tweets. Read only the sources relevant to the current subject.

| Context | Primary sources | Safe use in a draft | Check before claiming |
| --- | --- | --- | --- |
| Identity and house voice | `AGENTS.md`, `STYLE.md`, `docs/x-growth-voice.md` | Designer-builder-teacher perspective, direct language, proof before promise, no em dashes | `STYLE.md` may contain active uncommitted edits; treat it as current guidance but never stage it with this skill |
| Article and topic history | `articles/ARTICLES_INDEX.md` | Find prior work, recurring ideas, product stories, tutorials, and source artifacts | Open the linked article before using a specific detail |
| Resource library | `articles/2026-07-02-resources-i-use/content.md` | Recommend design, product, motion, AI, video, research, and shipping tools with a reason | Verify current product details when timeliness matters |
| UI vocabulary and prompting | `articles/2026-07-13-ui-prompting-vocabulary/content.md`, `articles/2026-06-03-animation-vocabulary/content.md` | Explain that naming structure, behavior, purpose, and responsive rules improves prompts | Do not reuse the same vocabulary-problem hook without new proof |
| Agent skills | `articles/2026-07-13-agent-skills-business-flywheel/content.md`, `articles/2026-07-03-agent-skills-field-guide/content.md`, `articles/2026-07-06-personal-agent-skills-library/content.md` | Skills as reusable workflows built from verified results | Recheck skill counts, repo names, installs, and current links |
| Aura and agent orchestration | `articles/2026-07-13-aura-infinite-canvas-agent-workflow/content.md`, `articles/2026-07-03-aura-161-major-release-changelog/content.md` | Planning, context, subagents, isolated tasks, verification, and product proof | Check the Aura repo or current article evidence before claiming a feature is live |
| DesignCode | `articles/2026-06-23-new-designcode-tweet-ideas/content.md`, `articles/2026-06-20-designcode-codex-course-blueprint/content.md` | Teaching designers code and developers design, Codex course work, real build workflows | Pricing, launch timing, and course availability need current verification |
| DreamCut and video | `articles/2026-06-07-dreamcut-codex-dive-club-podcast/content.md`, `articles/2026-05-21-add-background-music-dreamcut/content.md`, `articles/2026-05-21-remove-video-background-dreamcut/content.md` | Screen recordings, captions, proof clips, product tutorials, AI-assisted video workflows | Check the DreamCut repo or current release before stating capability boundaries |
| Neuform and design systems | `articles/2026-04-21-neuform-design-md-workflow.md`, `articles/2026-04-25-neuform-course-blueprint.md` | References becoming rules, `DESIGN.md`, remixing, components, export paths | Verify current naming, availability, and pricing |
| Vesperfall and game building | `articles/2026-07-24-how-i-built-vesperfall/content.md`, `articles/2026-07-24-how-i-built-vesperfall/vesperfall-full-game-prompt-v32.md`, `articles/2026-07-02-resources-i-use/content.md` | Playable contracts, reference boundaries, hybrid assets, image-to-3D, typed mechanics, deterministic review, performance, player feedback, and reusable game-development skills | Recheck the Vesperfall repo and live route before claiming the current version, metrics, catalog count, skill count, or shipped mechanics |
| Reference-first design | `articles/2026-06-04-avoid-ai-slop-design-workflow/content.md`, `articles/2026-07-02-floral-scroll-animation-prompts/content.md`, daily `ui-inspiration-capture` articles | Screenshots, motion evidence, section crops, interaction details, and precise references reduce generic output | Use rules and mechanisms, never copy a source brand or page |
| Founder and personal context | `articles/2026-06-12-dreamcut-failed-sales-strategy/content.md`, authored X corpus | Shipping, weak sales proof, travel, building from mobile, family time, aging, intuition, learning, and human taste | Personal details must be present in trusted sources and relevant to the post |
| X strategy and proof | `articles/2026-07-13-x-history-teaching-strategy.md`, `articles/2026-07-27-weekly-strategy-meeting.md`, `data/x-growth/owned-posts/`, `data/x-growth/scorecards/` | Bookmarks as a learning signal, complete tutorials, proof clips, distribution as product work, and source-backed metrics | Read the newest snapshot and timestamp every metric or payout claim |
| Current X drafting rules | `docs/x-growth-voice.md`, `skills/daily-x-growth/SKILL.md`, `data/x-growth/bookmark-quote-posts/` | Format, safety, source gates, approval state, and recent queue continuity | Generated drafts are not primary voice evidence |

## Focused Retrieval

Search before opening large files:

```bash
rg -n -i "<topic|product|resource|claim>" articles docs data/x-growth skills
```

For facts that may have changed, inspect the current product repo or live source before publishing. If verification is unavailable, write the draft without the unstable claim or label the uncertainty for Meng.
