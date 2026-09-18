# Preliminary naming research checklist

Use this checklist for each shortlisted candidate. Record the date, query, result, source URL, jurisdiction, and confidence.

## Contents

- Query matrix
- Entertainment and brand surface
- Storefront and catalog routes
- Official trademark sources
- Registry RDAP
- Handle checks
- Minimum evidence and degraded mode
- Risk labels

## Query matrix

Search all applicable forms:

- `"ExactCandidate"`
- `"Exact Candidate"`
- hyphenated form
- singular and plural
- likely misspellings
- likely phonetic spellings
- likely concatenations
- `"candidate" game character studio novel music tabletop brand trademark`
- `site:<storefront-domain> "candidate"`

Search strong components separately when they are already associated with entertainment properties.

## Entertainment and brand surface

Check:

- broad web;
- games and characters;
- developers, publishers, and studios;
- novels and comics;
- bands, artists, albums, and songs;
- tabletop games, miniatures, and fantasy products;
- active companies and consumer brands;
- generated-name lists only as low-weight originality evidence.

An exact same-field use is normally a rejection. A close spelling or phonetic match needs a documented risk judgment.

## Storefront and catalog routes

Replace `<query>` with a URL-encoded candidate:

- Steam: `https://store.steampowered.com/search/?term=<query>`
- itch.io: `https://itch.io/search?q=<query>`
- Epic: `https://store.epicgames.com/en-US/browse?q=<query>`
- GOG: `https://www.gog.com/en/games?query=<query>`
- PlayStation: `https://store.playstation.com/en-us/search/<query>`
- Xbox: `https://www.xbox.com/en-US/Search/Results?q=<query>`
- Nintendo: `https://www.nintendo.com/us/search/#q=<query>&cat=gme`
- Apple Search API: `https://itunes.apple.com/search?term=<query>&entity=software&limit=25`
- Google Play: `https://play.google.com/store/search?q=<query>&c=apps`

Record explicit zero counts when a storefront exposes them. For fuzzy results, distinguish the returned title from the exact query.

## Official trademark sources

### United States

Use [USPTO Trademark Search](https://tmsearch.uspto.gov/search/search-information).

Recommended knockout forms:

```text
CM:candidate
CM:"candidate phrase"
CM:(candidate OR phoneticvariant OR "candidate phrase")
```

Search all statuses first. Review likely Nice classes:

- 9: downloadable game software and related digital goods;
- 41: entertainment and game services;
- 28: toys, games, and tabletop goods.

Do not exclude related classes merely because they are outside 9, 41, and 28.

### International and Europe

- [WIPO Global Brand Database](https://branddb.wipo.int/en/quicksearch)
- [TMview](https://www.tmdn.org/tmview/)
- [EUIPO availability guidance](https://www.euipo.europa.eu/the-office/help-centre/tm/faq-search-availability)
- [UK IPO trademark search](https://trademarks.ipo.gov.uk/ipo-tmtext)

Record which official interfaces succeeded. TMview is a useful multi-office screen but is not itself an official register and has no legal effect.

## Registry RDAP

Use registry RDAP rather than a registrar marketing page:

- `.com`: `https://rdap.verisign.com/com/v1/domain/<slug>.com`
- `.game`: `https://rdap.centralnic.com/game/domain/<slug>.game`
- `.games`: `https://rdap.identitydigital.services/rdap/domain/<slug>.games`

An HTTP 404 means no registry object was returned at that moment. It does not guarantee that registration is possible or reserve the name.

## Handle checks

Check exact routes where feasible:

- X: `https://x.com/<slug>`
- YouTube: `https://www.youtube.com/@<slug>`

Treat HTTP status as a weak route signal only. A `404`, redirect, login wall,
or successful response does not establish handle ownership or availability.
Confirm the rendered profile and owner manually before making even a practical
claim, and describe an unconfirmed response only as a route status.

## Minimum evidence and degraded mode

A completed preliminary screen needs documented current evidence from:

1. broad-web exact and close-variant searches;
2. the major game storefronts and catalogs relevant to the release;
3. official trademark interfaces for the core target jurisdictions, including
   the United States and the applicable UK, EU, or international route;
4. registry RDAP for the selected domains.

Handle checks are useful but optional and volatile.

If one of the four required categories is materially unavailable, label the
result **degraded**. Give the best creative front-runner only as
research-incomplete, enumerate the missing sources, and require a refreshed
screen before recommending production adoption. If no current conflict
research can be completed, label the screen **blocked** and do not describe any
candidate as screened.

## Risk labels

Use:

- **Low–moderate:** no obvious exact conflict, but screening remains incomplete.
- **Moderate:** close spelling, component crowding, occupied handles, or uncertain official coverage.
- **High/reject:** meaningful same-field entertainment, game, character, or active-brand conflict.

Never use “legally clear,” “available,” or “safe.”
