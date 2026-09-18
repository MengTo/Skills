---
name: write-repo-readme
description: Write or rewrite a GitHub README that matches the owner's existing repos, with every claim checked against the code and every link verified before commit. Use when asked to create a README, fix an outdated one, make a repo presentable before sharing it, or set up a repo's About panel, description, topics, or preview image.
---

# Write a repo README

A README is the landing page for a repo someone is about to share. It gets read once, quickly, by people deciding whether to click through. Two things sink it: claims that are wrong, and a voice that doesn't match the author's other work.

Never write it from memory of the project. Read the code, measure the numbers, and check every link.

## First, match the house style

Before drafting anything, read two or three of the owner's existing READMEs. This is the step that matters most and the easiest one to skip.

```bash
gh api "users/<owner>/repos?per_page=100&sort=updated" --jq '.[] | select(.fork==false) | "\(.name)|\(.stargazers_count)|\(.description // "-")"'
gh api repos/<owner>/<repo>/readme --jq '.content|@base64d'
```

Pick their most recent substantial projects, not their most starred, since old repos reflect an older voice. Note their section names, whether they use bullets or prose, whether they open with a live link, whether they include a preview image, and how technical they let the middle get. Follow what you find rather than importing a generic template.

## Structure

Adapt to the house style, but this order works for a project people can look at:

1. **Title** — the project's name. Not the domain it deploys to, not the repo slug if that differs from what the thing is called.
2. **One paragraph** saying what it is and what you can do with it. Concrete verbs.
3. **Live link**, prominent, if there is somewhere to see it running.
4. **Preview image** immediately after.
5. **Inspiration or credits**, when the project started from someone else's work. Put it near the top rather than burying it at the bottom.
6. **What is inside** — features as bullets, each naming a behavior rather than a technology.
7. **How it is made** — the two or three genuinely interesting mechanisms, explained well enough that a builder learns something. This is the section people remember.
8. **Run locally** — a copy-pasteable command.
9. **Deployment**, if not obvious.
10. **Other projects**, when asked for.
11. **Credits.**

## Verify every claim

Anything countable goes in only after you measure it:

```bash
du -h index.html            # file sizes
du -ch assets/*.woff2       # asset totals
rg -c "<pattern>"           # counts of items, routes, entries
```

Check feature claims against the source. If you write that it supports reduced motion, grep for `prefers-reduced-motion` first. If you write that it has no external requests, load the page and confirm zero cross-origin entries in `performance.getEntriesByType('resource')`.

Describing other projects: take the words from the source, never invent them. A repo's own `description` field, or the site's own `og:description`:

```bash
gh api repos/<owner>/<repo> --jq '.description'
curl -sL -A "Mozilla/5.0 ..." <url> | grep -oiE '<meta[^>]*og:description[^>]*>'
```

Writing your own marketing copy for someone's product puts words in their mouth. Quote what they already say about themselves.

## Hunt for stale infrastructure claims

READMEs rot at the deployment line first. A project that moved hosts still tells people about the old one, and that is the first sentence a visitor reads. Before finishing, check that the stated host, URL, branch and build command are still true, and delete config files belonging to hosts no longer in use.

## Link-check before committing

Every link, no exceptions. One bad URL in a README that just got tweeted is the whole cost of this step:

```bash
grep -oE 'https://[^)]+' README.md | sort -u | while read u; do
  printf "  %-52s %s\n" "$u" "$(curl -s -o /dev/null -L -w '%{http_code}' --max-time 12 -A "Mozilla/5.0" "$u")"
done
```

Chase anything that isn't 200. Some hosts block bots and need a real user-agent before you conclude the link is dead.

## Capture a preview image

If the project is visual and running somewhere, a still belongs at the top. Screenshot the live site, not localhost, so the image proves the deployed thing works.

Use the Codex in-app browser. Set a `1600 x 1000` viewport, load the deployed URL,
wait for fonts, media, and entrance motion to settle, stage the most representative
state, and save a browser-only screenshot. Reset the viewport when finished.

**Stage the UI before the shutter.** A default screenshot catches the page at rest, which usually means the interesting feature is idle and invisible. Drive the page into the state that shows it working, then shoot. Call the project's own functions to do it rather than faking input.

Convert down before committing, since a 2x PNG runs several megabytes:

```bash
sips -Z 2400 -s format jpeg -s formatOptions 82 /tmp/preview.png --out assets/preview.jpg
```

Then look at the result before committing it. A preview that misrepresents the project is worse than none.

## Set the About panel

The README isn't the only thing people see. A repo with no description or homepage looks abandoned in search results and link unfurls:

```bash
gh repo edit <owner>/<repo> \
  --description "<one sentence: what it is and what you do with it>" \
  --homepage "<live url>" \
  --add-topic <topic> --add-topic <topic>
```

## Don't decide these alone

- **A license.** Adding one grants rights on the owner's behalf. Point out that it's missing, recommend a common choice, and let them pick.
- **Which projects to list.** Propose a short set and say what you left out and why. A full inventory reads as a résumé; three or four well-chosen links get clicked.
- **Claims about people, revenue, or usage** that you cannot verify from a source. Leave them out and say you did.

## Report back

Say what you verified rather than asserting it is correct: the numbers you measured, the link-check result, any stale claim you found and fixed. Flag the parts you wrote rather than sourced, since those are the ones the owner needs to read closely.
