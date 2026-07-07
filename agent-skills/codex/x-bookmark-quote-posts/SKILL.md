---
name: x-bookmark-quote-posts
description: Check a user's latest X/Twitter bookmarks and turn recent saved posts into source-backed quote-post drafts. Use when asked to review X bookmarks, create quote posts from bookmarks, refresh a bookmark quote queue, run a bookmark quote automation, or write first-person quote posts from X sources.
---

# X Bookmark Quote Posts

## Overview

Turn a user's latest X bookmarks into a dated quote-post queue. The output should feel like a specific person or brand thinking in public from lived experience, not like generic AI commentary.

## Start

Work from the current content repo unless the user names another repo. If no repo is active, ask for the target workspace before writing files.

Before collecting:

- Read `AGENTS.md`, if present or supplied in the prompt.
- Check `git status --short` early. Content workspaces are often dirty; keep changes scoped.
- Read the latest existing bookmark quote-post file as the voice sample when one exists. Common locations include `data/x-growth/bookmark-quote-posts/*.md`, `data/x/bookmark-quote-posts/*.md`, or a user-specified content queue.
- Use the Codex in-app browser only for X. Do not use Chrome.
- Do not post, reply, quote, like, retweet, DM, follow, or mutate X in any way.

If X is logged out, CAPTCHA-blocked, or the in-app browser cannot attach, stop and report the exact blocker. Ask the user to sign in only when the browser session requires it.

## Collect Bookmarks

Open:

```text
https://x.com/i/bookmarks
```

Collect a bounded batch from the latest visible bookmark feed:

- Extract author, handle, source URL, source timestamp, visible post text, article-card title/summary, and media/context clues.
- Default to the last 30 days of bookmark-feed source posts unless the user names a different window. Treat the current date/time and timezone literally.
- Scroll enough to gather about 12-20 usable candidates across the 30-day window, while staying bounded.
- Include practical resource-list bookmarks, not only AI-agent takes. Example pattern: a Solt Wagner-style list of creative resources, websites, and apps such as image generators, dither tools, mockup tools, Framer templates, dock widgets, motion tools, and gradient tools.
- Note that X usually exposes source post timestamps, not bookmark-saved timestamps. Label the window clearly as source-post dates from the bookmark feed unless the saved/bookmarked timestamp is visible.
- Open status URLs for truncated posts or article cards when needed to get enough context. Keep the collection source-backed.

Do not rely on public search when the task is specifically about bookmarks unless browser access is blocked and the user approves a fallback.

## Draft

Create or update:

```text
data/x-growth/bookmark-quote-posts/YYYY-MM-DD.md
```

Use the existing project path when one is present. If the repo does not already have a bookmark queue, create the smallest reasonable dated path, such as `data/x/bookmark-quote-posts/YYYY-MM-DD.md`.

Use this shape:

```markdown
# Bookmark Quote Posts - YYYY-MM-DD

Checked in Codex Browser: https://x.com/i/bookmarks

Window: ...

Tone pass: first-person voice matched to the user or brand. Two or three slightly longer paragraphs, closer to a lived-in note than a stack of punchlines.

## Best Picks

### 1. Source Name - Topic

Source: https://x.com/...

<draft>
```

Write 7-10 drafts unless the source supply is weaker. Put strongest posts under `Best Picks`; use `Secondary Picks` for alternates or lower-confidence sources. Prefer variety across the user's relevant themes, such as tools, product ideas, design resources, technical lessons, industry takes, workflow ideas, and useful resources.

## Voice

Write in the user's or brand's established voice, with more lived experience in the sentence than polish.

Use:

- first person when it naturally fits
- two or three slightly longer paragraphs per draft
- direct language, rough edges, and human specificity
- past experience from the user's real domain, such as building, designing, teaching, shipping, selling, debugging, researching, operating, or learning from mistakes
- honest uncertainty when the source is thin

Avoid:

- short sentence, blank line, short sentence, blank line cadence
- generic frameworks like "the real skill is..."
- empty agreement such as "great point"
- hype phrases such as "game changer", "unlock", "hot take", "supercharge"
- CTAs unless the user asks for them
- claims about the user's life, work, products, team, customers, or results that are not grounded in the current prompt, existing drafts, or trusted project context

Good drafts should sound like the intended author adding personal context to the source, not summarizing it.

## Verify

Before committing:

- Ensure every draft has a source URL.
- Ensure every final draft is two or three paragraphs unless there is a deliberate exception.
- Re-read the file aloud mentally and remove AI-sounding summary lines.
- Run `git diff --check -- data/x-growth/bookmark-quote-posts/YYYY-MM-DD.md`.
- Stage only the intended bookmark quote-post file.

Commit from the target repo when the run changes files. Use a message like:

```bash
git commit -m "Refresh X bookmark quote posts for YYYY-MM-DD"
```

If no file changed because browser access was blocked or no usable bookmarks were available, do not invent a commit; report the blocker or no-change state plainly.

## Report

Close with:

- output path
- candidate/source count
- time window used
- browser/access status
- validation result
- commit hash, when committed
