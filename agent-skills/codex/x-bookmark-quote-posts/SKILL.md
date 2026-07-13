---
name: x-bookmark-quote-posts
description: Check a user's latest X/Twitter bookmarks and turn recent saved posts into source-backed quote-post drafts calibrated against the user's latest 100 authored posts. Use when asked to review X bookmarks, create quote posts from bookmarks, refresh a bookmark quote queue, run a bookmark quote automation, study a user's X voice, or write first-person quote posts from X sources.
---

# X Bookmark Quote Posts

## Overview

Turn a user's latest X bookmarks into a dated quote-post queue. The output should feel like a specific person or brand thinking in public from lived experience, not like generic AI commentary.

## Start

Work from the current content repo unless the user names another repo. If no repo is active, ask for the target workspace before writing files.

Before collecting:

- Read `AGENTS.md`, if present or supplied in the prompt.
- Check `git status --short` early. Content workspaces are often dirty; keep changes scoped.
- Read the latest existing bookmark quote-post file for continuity when one exists. Common locations include `data/x-growth/bookmark-quote-posts/*.md`, `data/x/bookmark-quote-posts/*.md`, or a user-specified content queue. Do not use generated drafts as the primary voice source.
- Use the Codex in-app browser only for X. Do not use Chrome.
- Do not post, reply, quote, like, retweet, DM, follow, or mutate X in any way.

If X is logged out, CAPTCHA-blocked, or the in-app browser cannot attach, stop and report the exact blocker. Ask the user to sign in only when the browser session requires it.

## Calibrate Voice From 100 Posts

Calibrate before collecting bookmarks. Identify the target account from the request or active X profile, then open the account and X's Latest search:

```text
https://x.com/<handle>
https://x.com/search?q=from%3A<handle>&src=typed_query&f=live
```

Collect the latest 100 authored posts when X exposes enough history. Include original posts, replies, and quote posts; exclude pure reposts written by someone else. For each post, retain:

- authored post URL and timestamp
- full authored text
- whether it is a reply and whether it contains a quoted source
- quoted source URL for quote posts
- whether the timeline text was truncated

Expand every truncated authored post directly. If X prevents complete expansion, report the incomplete count instead of silently treating fragments as full posts. Do not confuse quoted-source text with the user's own text. If fewer than 100 authored posts are available, use all available posts and report the actual sample size and date range.

Build an internal voice ledger from the complete corpus:

- Use replies to learn natural vocabulary, capitalization, contractions, sentence rhythm, disagreement, and rough edges.
- Use standalone posts to learn hooks, paragraph length, pacing, lists, proof, and endings.
- Use quote posts as the format-specific authority for how the user reacts to a source and adds context.
- Separate reusable patterns from one-off artifacts such as pasted prompts, transcripts, link dumps, or unusually long announcements. Keep their factual signals, but do not let them define normal cadence.
- Measure, rather than assume: sample count and date range, format mix, median length, common paragraph counts, first-person frequency, list usage, and recurring opening and ending moves.
- Match the moves, not exact phrases. Never assemble a draft by copying fragments from several posts.

Treat the latest 100 authored posts as the primary voice source. Use prior generated drafts only for queue continuity. When live voice evidence conflicts with generic drafting defaults below, the live corpus wins.

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

Voice sample: latest <count> authored posts from <date> to <date>; <standalone> standalone posts, <replies> replies, <quotes> posts with quoted sources. Reply and quote counts may overlap.

Tone pass: first-person voice matched to repeated patterns in the live 100-post corpus.

## Best Picks

### 1. Source Name - Topic

Source: https://x.com/...

<draft>
```

Write 7-10 drafts unless the source supply is weaker. Put strongest posts under `Best Picks`; use `Secondary Picks` for alternates or lower-confidence sources. Prefer variety across the user's relevant themes, such as tools, product ideas, design resources, technical lessons, industry takes, workflow ideas, and useful resources.

Treat each finished draft as a suggested quote tweet the user can keep honing. The saved file is the full queue, but the assistant response should surface the strongest draft text directly so the user can react, rewrite, or ask for a sharper angle without opening the file first.

## Voice

Write in the user's or brand's established voice, with more lived experience in the sentence than polish.

Use:

- first person when it naturally fits
- the paragraph count and length distribution observed in the user's standalone and quote posts
- direct language, rough edges, and human specificity
- past experience from the user's real domain, such as building, designing, teaching, shipping, selling, debugging, researching, operating, or learning from mistakes
- honest uncertainty when the source is thin

Avoid:

- short sentence, blank line, short sentence, blank line cadence
- generic frameworks like "the real skill is..."
- empty agreement such as "great point"
- hype phrases such as "game changer", "unlock", "hot take", "supercharge"
- polished symmetry, abstract conclusions, or repeated template openings that do not appear in the live corpus
- CTAs unless the user asks for them
- claims about the user's life, work, products, team, customers, or results that are not grounded in the current prompt, existing drafts, or trusted project context

Good drafts should sound like the intended author adding personal context to the source, not summarizing it.

## Verify

Before committing:

- Ensure every draft has a source URL.
- Ensure every final draft follows the structure learned from the user's recent standalone and quote posts. Do not force every draft into the same paragraph count.
- Record the voice sample count, date range, and original/reply/quote mix in the dated file.
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
- voice-corpus count, date range, and format mix
- validation result
- commit hash, when committed
- a Markdown table of the strongest suggested quote posts, usually 3-5 rows, with columns:
  - `Pick`
  - `Source`
  - `Suggested tweet`
  - `Why this angle`
  - `Hone next`
- Put the best current suggestion in the first row. The `Suggested tweet` cell should contain the actual tweet draft, not a summary. Use `<br><br>` inside the cell when preserving two or three paragraphs.
- Keep the table useful for revision: `Why this angle` should explain the editorial bet in one sentence, and `Hone next` should name the most likely improvement, objection, or specificity gap.
- If browser access is blocked or no usable bookmarks are found, do not fabricate a suggested-tweet table. Report the blocker and say there are no source-backed suggestions for this run.
