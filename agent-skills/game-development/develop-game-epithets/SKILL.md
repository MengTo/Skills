---
name: develop-game-epithets
description: Develop and preliminarily screen original game protagonist epithets or role-titles from verified lore. Use for requests to name a player-character role like "Ashen One," generate dark-fantasy or genre-native hero titles, compare candidates, research game/storefront/entertainment/trademark/domain/handle conflicts, or prepare a naming recommendation before implementation. Treat the work as research, not legal clearance, and do not change production names or code unless the user separately approves a candidate and requests implementation.
---

# Develop Game Epithets

Create a concise, speakable protagonist identity that belongs to the actual game world, then perform a current preliminary conflict screen and recommend one candidate.

## Hold the implementation boundary

- Treat naming as read-only research unless the user explicitly asks to implement an approved candidate.
- Do not rename files, symbols, UI copy, routes, assets, or production data during naming research.
- Preserve existing project changes and inspect the repository read-only.
- Label every trademark result as preliminary screening, not legal advice or clearance.

## Follow the workflow

### 1. Verify the lore

Identify the authoritative project path and inspect the current source rather than relying on the brief or model memory.

Use `rg` and targeted file reads to find:

- player and character-select labels;
- world, level, location, and faction names;
- death, revival, checkpoint, and quest copy;
- inventory, relic, weapon, rarity, and item language;
- bosses, enemies, NPC address, and dialogue;
- title-card, objective, and ending copy.

Record a compact evidence table with file links or source citations. Separate what the repository **establishes** from what it **does not establish**.

If no authoritative project source is available, say so explicitly and switch
to **brief-only mode**. Treat only the facts the user supplied as canon, cite
them as user-provided brief evidence, and list every material unknown. Do not
invent a repository, imply that source verification occurred, or block a
creative round that can be completed honestly from the brief.

### 2. Define the naming territory

Extract:

- protagonist function;
- verified wound, curse, return loop, obligation, or lack thereof;
- world metaphysics;
- central motifs and verbs;
- emotional tone;
- vocabulary to own;
- vocabulary to avoid because it belongs to enemies, other properties, or unsupported lore.

Mark creative interpretations as interpretations. Never invent a curse, bloodline, scar, religion, rank, or chosen status to justify a name.

### 3. Generate a broad candidate field

Generate at least 30 genuinely distinct candidates across several structures:

- compact compounds;
- agent nouns and offices;
- ritual or material identities;
- participial or state titles;
- two-word noun phrases;
- sentence-like mythic titles.

Do not submit 30 suffix swaps. Honor every hard constraint literally across the entire field. Avoid saturated structures and terminology identified by the user.

Favor names that:

- remain concise and pronounceable;
- work with and without an article;
- can be addressed aloud;
- look strong in UI;
- coexist cleanly with the game title;
- communicate without fantasy word soup.

Run a deterministic constraint audit before judging the field:

```bash
printf '%s\n' "Candidate One" "Candidate Two" |
  python3 <skill-directory>/scripts/validate_candidate_field.py \
    --require RequiredTerm --ban BannedTerm --min-count 30
```

Use the default substring matching when a required or banned element also
matters inside a compound. Use `--match word` only when the constraint applies
to a standalone word. Fix every reported violation before continuing.

### 4. Run the first screen

Evaluate every candidate for:

- intended and accidental meaning;
- pronunciation and likely mishearing;
- person-title grammar versus weapon, attack, boss, location, or event grammar;
- genericness and search ownership;
- resemblance to famous game titles, characters, classes, factions, or generated-name vocabulary;
- unsupported lore claims;
- article and capitalization behavior;
- dialogue fit.

Advance roughly 8–12 candidates. Reject obvious same-field conflicts immediately.

### 5. Perform current conflict research

Read [research-checklist.md](references/research-checklist.md) before researching finalists.

Run the bundled exact-surface helper as a first pass:

```bash
python3 <skill-directory>/scripts/knockout_screen.py "Candidate One" "Candidate Two" --format markdown
```

Then browse current sources. Search:

- exact, spaced, hyphenated, concatenated, plural, singular, and likely phonetic variants;
- games, characters, studios, novels, music, tabletop properties, fantasy products, and active brands;
- Steam, itch.io, Epic, GOG, PlayStation, Xbox, Nintendo, Apple App Store, and Google Play;
- USPTO, WIPO Global Brand Database, TMview/EUIPO, and UK IPO;
- exact `.com` plus one or two useful game-oriented domains through registry RDAP;
- major social/video handles where feasible.

Use primary and official sources for trademark, registry, and storefront claims. Date-stamp every check and identify the jurisdiction.

Respect the active environment's browser policy. If the task requires the Codex in-app browser, use it and do not substitute Chrome.

For USPTO, search combined-mark exact forms and relevant close variants across all statuses. Include likely Nice classes 9, 41, and 28 without assuming other classes are irrelevant.

If an official database is blocked, state that clearly. Do not imply a blocked check succeeded and do not treat an aggregator as equivalent to the official register.

Reject a candidate with a meaningful current game, character, entertainment, or active-brand conflict even if no exact registered trademark appears.

Classify the research state before deciding:

- **Preliminary screen completed:** current broad-web and close-variant review,
  major storefront review, official trademark checks for the relevant core
  jurisdictions, and registry checks were all performed with documented
  results.
- **Degraded screen:** automation, indexed snippets, or only some required
  sources were available. Present a **research-incomplete creative
  front-runner**, list every missing check, and do not invite production
  adoption yet.
- **Blocked screen:** current conflict research could not be performed. Return
  the creative work separately from the research blocker; do not call any
  candidate screened.

Use only careful conclusions:

- “No obvious exact conflict found in this preliminary screen.”
- “No registry object was returned.”
- “The direct route returned HTTP 404.”

Never say “available,” “cleared,” “safe,” or “guaranteed.”

### 6. Score and decide

Score the shortlist from 1–10 on:

- lore fit;
- distinctiveness;
- spoken quality;
- visual/UI quality;
- searchability;
- trademark risk;
- storefront collision risk;
- domain and handle practicality.

Treat the score as a decision aid, not arithmetic proof. A meaningful entertainment conflict is a knockout even when the total score is high.

If no candidate survives responsibly, generate a new round instead of lowering the standard.

### 7. Stress-test the finalists

Test the winner in at least these contexts:

1. character-select heading;
2. NPC address;
3. death or revival line;
4. inventory title;
5. quest text;
6. return announcement;
7. spoken boss taunt.

Also test:

- canonical capitalization;
- direct address without an article;
- narrative use with an article;
- pairing beside the game title;
- singular/plural ambiguity;
- likely voice pronunciation.

Do not invent unsupported lore merely to make a test line work.

### 8. Deliver one recommendation

Use [report-template.md](references/report-template.md) for the full handoff.

Lead with:

- one clear recommendation, or a research-incomplete creative front-runner
  when the required screen is degraded;
- a short lore-grounded rationale;
- the material conflict caveat.

Then provide:

- 2–4 strong fallbacks;
- a compact comparison table;
- winner dialogue/UI tests;
- a rejection ledger for attractive failures;
- direct sources and exact queries/databases checked;
- research date and jurisdictions;
- the preliminary-screening disclaimer;
- the required counsel/expanded-clearance next step.

For a completed preliminary screen, end with the exact single recommended
name. For a degraded or blocked screen, end instead with
`Research-incomplete creative front-runner: <Name>` so the final line cannot be
mistaken for an adoption recommendation. State that no production rename was
performed.

## Keep the evidence honest

- Distinguish exact matches, close matches, component crowding, and ordinary-language noise.
- Treat search-engine non-results as low visible saturation, not proof of non-use.
- Treat domain and handle state as volatile.
- Prefer a clear name with a disclosed caveat over an opaque coined word that merely looks unique.
- Preserve rejected candidates and reasons so later rounds do not repeat known failures.
