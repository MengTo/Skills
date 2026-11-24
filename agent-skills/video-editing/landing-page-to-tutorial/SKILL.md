---
name: landing-page-to-tutorial
description: Run the whole chain for a long YouTube tutorial (15 to 25 minutes) that starts by designing and building landing pages with a coding model and ends with the released video, its free pack, a short and the posts. It begins by asking the setup questions (length, what it teaches, which pages, first pass or polished builds, the look, how the creator appears, voice, music, sponsor rules), then plans, designs the pages, builds them with a logged prompt trail, records real demos, writes the script from checked facts, makes the film as a demo and not a presentation, checks the export, and hands each stage to the skill that owns it (making-of-film, youtube-video-release, long-video-to-short or room-short-9x16, sponsorship-campaign-board). Use when someone asks for a tutorial video from a landing page or a site build, "a tutorial like the last one", a long-form "how I built this page with AI" video, a sponsored build tutorial, or wants to know what to do next anywhere in that chain. For a 4 to 5 minute film of an already finished project use making-of-film alone; for a one-minute explainer use html-explainer-video.
---

# Landing page to tutorial

Two runs are written down here: the Greymourn tutorial (a game site, Nov 2026, the source of `making-of-film`) and
a design-tool tutorial (three landing pages designed, built and filmed in six days, 22:28 at 4K60, with a free pack, a
short and posts). The second run went through nine scripts and twenty-two cuts. Most of those rounds came from things
nobody asked at the start. This skill is the order that would have avoided them.

It is a conductor. Each stage has an owner skill; read that skill when you reach the stage and do not repeat its
steps here.

`youtube-video-release` and `sponsorship-campaign-board` are private skills and not in this repo: where they are
named, do that stage by its description here and by your own release checklist.

| Stage | Owner |
|---|---|
| Brief, canvas, dates, angle (sponsored) | `sponsorship-campaign-board` |
| Plan, pages, builds, demos, facts | **this skill** |
| Script, voice, scenes, camera, cut, judges | `making-of-film`, with the long-form changes below |
| 4K export, checks, Studio, description, pinned comment | `youtube-video-release` |
| Covers and the thumbnail test | a cover skill for an AI face (private here), or `youtube-video-release` for a real frame |
| The short | `long-video-to-short` or `room-short-9x16` |
| Posts | `youtube-video-release` for the long video, the short's skill for the short |

## Ask these first, every time

No two tutorials use the same setup. Ask these together in one message before any paid run, page or script, each with
the last run's answer as a default to accept or change. Write the answers, in the creator's words, at the top of the
ledger. If an answer changes a step below, the answer wins.

1. **Length and depth.** How long, and as deep as which past video? (The first cut was 7 minutes against a plan of
   10; the creator called it a regression and the target became 12 to 15, then 22.)
2. **What it teaches.** Which topics must be in it: the models and what they cost, page craft (type, colour, spacing,
   hierarchy), how to judge an AI's output, their own skills and inspiration lists? What is the one takeaway?
3. **The hook.** What does the first line name, something the viewer already knows? When does the sponsor or the main
   tool first appear? (Asked for after v7: not in the first 20 seconds.)
4. **The pages.** How many, what kind, which references, and one design file or several? (Three files had to be
   remade as one.)
5. **First pass or polished builds.** Are the finals the model's first pass, a steered pass, or builds the creator
   polishes for hours? Who polishes, and by when? (Polished builds replaced the first passes late, in the hook and
   the end.)
6. **The split.** How much real UI and real pages (at least 25%), how much of the creator on camera (10 to 20%),
   how much anything else?
7. **On camera.** Real takes, an avatar twin, or generated shots? Normal clothes or dressed for each scene? A corner
   box, a third, a half, full frame? Twin approved before any re-skin?
8. **Voice.** Their own recording or a cloned voice, and which style? Play three 30-second samples before voicing
   anything long. (The style was picked twice.)
9. **The look.** Concept stills approved one by one before anything is animated? Which image model?
10. **Music.** Any, and where? Did they make it, or is it licensed?
11. **Names to keep out.** Any existing games, brands or people the pages or prompts must not show or name.
12. **Sponsor rules, if sponsored.** What must be said, what must never be said, the offer and its link, the label,
    and the dates. Read the brief; never quote it in the video or anything public.
13. **The pack.** Will the pages and prompts be given away? Where does it live, and what in it must stay private?
14. **Release.** Channel, target day, who uploads, covers from a real frame or an AI face, and which short follows.

## The chain

Each arrow is a stop for a yes. Prices are stated before every paid run, and every run goes in one ledger for the
whole project with the words that allowed it.

```
answers ─► plan ─► page prompts ─► designs picked ─► builds (logged) ─► builds checked ─► demos recorded
   ─► facts file, claims checked ─► script ─► three voice samples ─► voice ─► concept stills ─► film
   ─► cut reviewed on stills ─► export checks ─► pack ─► covers, Studio as Private ─► their "publish it"
   ─► short ─► posts
```

### 1. Plan
One page: the takeaway, the chapters with rough minutes, which page carries which lesson, where each demo goes, where
they are on camera. A 20-minute tutorial is about 3,000 words. Get it approved before designing anything.

### 2. Design the pages
Write each page as one long page, one section at a time. The prompt order that worked (`references/prompts.md`):

- **Hero, 175 to 200 words:** the product in a line → the scene and its light → the headline (size, weight, type
  class, the exact word, where it sits) → the device or UI → the left and right columns with their copy → the top bar
  → the mood and what to leave out.
- **Each section, 90 to 135 words:** its name → a continuity phrase ("The page continues into…") → "the same" object
  → a numbered label and headline → body copy described, not written → a lock clause ("Same type and quiet spacing as
  the hero") → the last one says it is the last section and footer.

Make several designs per prompt and pick one. Record the exploring too (variants, copying, zooming, dragging a
variant out): the creator asked for "the exploration aspect" and "more examples". Keep every design in one file.

### 3. Build, with a trail
- Start each build with the tool's own hand-off line, word for word, and nothing else.
- Run builds in parallel, each in its own folder and sandbox. Log the model, effort, start and end times, the skills
  the model read, and every asset call (`scripts/watch-codex.py` reads a coding agent's session files).
- Never state a number you did not read from a file. Spend that isn't read from the wallet is not stated.
- **Check each build** (`scripts/check-build.mjs`): served locally, loaded headless, console and HTTP errors listed,
  stills down the page. Zero errors before it is filmed.
- **Steer once, in the open.** One note per layer, quoted in the video as typed ("Make sure that the characters are
  animated."). End a good effect with "turn it into a reusable skill".
- If the creator polishes builds by hand, those are the finals: use them in the hook and the ending, and say so.
- Always film the latest build.

### 4. Record the demos
- Real pages, full frame, scrolling, at 4K60: one eased scroll from the hero to the footer
  (`scripts/choreo-scroll.mjs`, a choreography for a stepped-clock page recorder). Never crop or zoom a design, and
  never put words across it.
- The real UI of the design tool and the coding agent, or an exact copy of it. No invented UI.
- Interactive pieces (a game, a ledger) get their own scripted choreography with an assertion on what the screen
  should read at the end.
- Check every clip for share links, account names and other companies' branding before it is used.

### 5. Facts, then the script
- Write a facts file from the logs: every number with its source in brackets. Have a second reader check every
  claim against the files before the script is written. (In the first run 9 of 53 claims were false.)
- Then the script, as `making-of-film` writes it, with these long-form changes:
  - The first second is their voice over the finished result. No silent cold open.
  - Chapters of two to four minutes, each teaching one thing and ending on something the viewer can do.
  - Plain words, short full sentences, like talking to a friend. No poetic lines.
  - Lines said on camera are whole sentences of 5 to 30 seconds.
  - Where it falls short becomes tips in a sponsored video: say what to do, not what failed.
- Expect notes on the script. Change the lines asked for and keep the length unless told otherwise.

### 6. Voice
Three samples of 30 seconds in different styles first; they pick by ear. Then one paragraph of 40 to 80 words per
generation, two takes, keep the lower. Transcribe every take and read it against the script: product names are what
break ("Astra" came back as "Astro"). `scripts/spoken.py` turns a script into voice generations; put this video's
proper names in its list. A re-voice never moves the picture.

### 7. The film
`making-of-film` owns this. What changes for a long tutorial:

- **A demo, not a presentation.** Count the seconds of real UI and real pages; under 25% is a fail. Slides with a
  lone headline are what got the first cut rejected.
- **Several pages mean several looks.** Each chapter takes its page's palette and type; the film's own chrome stays
  quiet. Concept stills are approved one by one before animating.
- **Work in chapters.** One worker per chapter against one shared contract for timing and anchors, then a lead who
  reads stills every two seconds across the whole cut. A 13-frame judge does not scale to 20 minutes.
- **Fewer transitions.** Cut on words; don't dress every join.
- **On camera** as answered in question 7. Check every clip for eyes off the lens, the mouth caught mid-word and the
  wrong number of fingers on a count. Their face is never graded. No camera on the end card unless asked.
- **Music** only where asked, and only music they made or licensed.

### 8. Before upload
`youtube-video-release` owns the export and Studio. The checks that caught something in these runs:

| Check | Caught |
|---|---|
| Every take transcribed against the script | three misheard product names |
| Every anchored phrase found in the voice | four missed phrases in one chapter |
| Text in the safe area, small text, overlaps, frozen frames | lone headlines, labels caught mid-animation |
| Stills every two seconds, read by a person or a fresh judge | small visuals, a stray pair of lines |
| Every take heard in the export | a past export with 13 silent minutes |
| Colour tags read bt709 | a past export that played dark |
| Loudness about −14 LUFS, no silence over 1.2 s | |

Say plainly what was not listened to or watched in motion.

### 9. The pack
The pages, the prompts word for word, and an article. Replace private build links and tokens with a placeholder and
say so. Quote only prompts that name nothing borrowed. Check embedded media for other people's work and credit or
remove it. It goes public only when the video does.

### 10. Release, short, posts
Upload as Private or Unlisted. Public, the pinned comment and any sponsor submission happen only on their "publish
it". Then the short (ask its own setup questions), and one post per platform for the long video: the cover and the
link, nothing else. The short's posts go out after the long video is public.

## Mistakes these runs made

- A 7-minute cut delivered against a deeper brief.
- Slides where demos should be.
- Three design files instead of one.
- First-pass builds filmed as the finals.
- A costume look animated before the plain twin clip was approved.
- A voice style chosen without samples.
- The sponsor named in the hook.
- Notes on late cuts kept only as code comments: write every note in the ledger with the cut's number.
- A pack link and a full video still unlisted when the short's posts were being scheduled.

## Files

- `references/prompts.md`: the page prompt order, the build and steering lines, the voice text rules.
- `references/page-prompts-example.md`, `references/build-prompts-example.md`: one run's prompts word for word.
- `references/two-runs.md`: the two runs stage by stage, with the creator's notes and what each changed.
- `scripts/check-build.mjs`, `choreo-scroll.mjs`, `watch-codex.py`, `spoken.py`.
