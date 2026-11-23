# Reading the project, and writing the script in his voice

## Contents
- Where the story is
- The facts file and the claims check
- His voice
- The Greymourn script (worked example)

## Where the story is

His prompts are the story: what he asked for, in his words, in order, with what he rejected. For a project of his:
- `qa/PROMPTS.md` (or the project's prompt log): every prompt he typed. If there's none, rebuild it from the session
  transcripts in `~/.claude/projects/<project dir>/*.jsonl` (his messages, not the queued attachments: see the
  `extracting-prompts-from-transcripts` memory).
- Scorecards and judges' verdicts (`qa/SCORECARD.md`, rounds, before/after pairs): the numbers for the honest chapter.
- Ledgers: what each generation cost, for the cost beat.
- Hand-over notes of the threads that built it: the lessons (the tiny castle, the self-score against the judges).
- `git log --format='%h %ad %s' --date=iso`: when things happened ("six hours and twelve prompts later").
- The first session's transcript: what really happened on day one (which skills loaded when, when it was playable).

With only a brief, list what the brief claims and what the film still needs (captures, numbers) before writing.

## The facts file and the claims check

Write `00-facts.md` before the script: one line per fact the film may state, with its source (file:line, commit,
transcript time). Then, when the script and the scenes exist, have a fresh subagent check every claim in the voice
and on screen against the repo, read-only, and sort them into false / unclear / true with the evidence and a
correction (Greymourn's: 9 false, 10 unclear, 34 true).

What Greymourn's check caught, each the kind of thing that will recur:
- **A count that's one entry's number.** "164 prompts" was the number of one prompt; 176 were logged.
- **What loaded when.** "One prompt with two skills loaded": Claude loaded one by itself; dream-loop came 5 hours
  later. Read the transcript, not the summary.
- **Made vs used.** 29 models made, 27 in the game (two never drawn). Say the one you mean, and match screen and voice.
- **Stale numbers.** "Five or six" was round 15; round 16 said about seven. Use the latest round, say which.
- **Edited quotes.** Code shown as "real lines" must be verbatim, with line numbers and "…" for gaps.
- **Borrowed names inside pictures.** Concept images had the reference game's names in them: blur them.
- **His framing vs the record.** "Three days" was his ("Put 3 days bc i did this on and off"); the prompts run 10–16
  Nov. Keep his framing when it's his, and tell him what the record says.

A false line in the voice needs a re-voiced line (≈1 credit, his yes): fix it before the full voice if you can.

## His voice

He talks plainly, first person, result first, with real numbers, and says where it falls short. The film is spoken,
so write for the ear: short sentences, one idea each.

Since 21–23 Nov (these win over the Greymourn wording below):
- **Grade-five words** (23 Nov; on 21 Nov he asked for eighth grade, then fifth), friend to friend. Nothing poetic or
  abstract: say what's on screen in plain words.
- **2–3 of his own fillers per 30 s**: "so", "you know", "uh", "kind of", "like"; "okay, so" is fine.
- **Two texts.** The teleprompter script he reads is short plain sentences with numerals ("4K", "1080p", "176"). The
  voice text sent to his cloned voice is run-on (joined with commas, "and", "so"; no "!" or "…") with numbers as
  words ("a hundred and seventy"). See `voice.md`.
- **Sponsored parts tell tries as experiments and tips, never failures** (16 Nov). Honest limits stay in unsponsored
  films.

- Start with the result and a number: "I made this game in three days. It runs in a browser tab."
- The honest twist early: "I didn't write the code, and I didn't model anything."
- His prompts said as he typed them, and shown: "Most of them sound like this. Keep working until eight out of ten."
- Steps as "Step one. Get it playable." Lessons as "One thing I learned." The pick: "this is the trick I'd steal first."
- The limits without hedging: "So where is it now? Not at nine." "And the gameplay you saw at the start is a scripted
  bot, not me playing." "The real bill was Claude usage. I ran into my usage limits."
- The close: what he'd keep, as four short imperatives, then where it all is: "It's linked below, with the skills.
  Go build your own."
- Never: hype words, "game-changer", "insane", sponsor taglines, credentials, "smash that like", invented
  quotes ("Ok so" was on this list until 22 Nov; "okay, so" is his own and allowed). Lines you wrote for him get ✎ in the script so he can change them.
- See `write-like-meng-on-x` for his written voice; the film's is the same voice said aloud.

Pace: 2.7 words a second spoken (his clone reads a little faster than the Mac's voice). 720 words ≈ 4:30 with the
10 s cold open, pauses and the end hold (Greymourn's; since 19 Nov there is no silent cold open and no added pause,
so the same words run a little shorter).

## The Greymourn script (as voiced; cut sentences struck out in the edit)

A worked example of shape, claims and honesty from 17–19 Nov, written before the grade-five and fillers rules: don't
copy its wording or its filler-free lines.

> I made this game in three days. It runs in a browser tab. Lighting, effects, sound, and a boss with two phases.
> I didn't write the code, and I didn't model anything. I wrote about a hundred and seventy short prompts. Most of them sound like this. Keep working until eight out of ten.
> In the next five minutes you get the whole workflow. The stack. The prompt that made it playable. How the models were made. The loop that fixed the graphics. And the part that matters most, which is how I stopped the AI from grading its own work. I'll also show you where it still falls short.
> The stack is small. Claude Code, with Fable five point two as the coordinator and Opus five point five on the side threads. Seedream five for concept art. Tripo for the 3D models. And three JS, plain modules, no build step.
> Step one. Get it playable. One prompt. I asked for a castle level, playable, and told it to verify itself until perfect. Six hours and twelve prompts later I had a level, enemies and a boss. It also wrote fifty one checks for the combat rules. Stamina, roll timing, parry windows. Those checks are why everything after this was safe to change.
> Step two. The models. Seedream draws each character in a strict A pose on a grey background. Front view, arms out, empty hands. Then Tripo turns that picture into a 3D model. Twenty seven of them are in the game. They come with no skeleton, so the agent wrote the rig and every animation in code. One thing I learned. My base prompt said gothic castle, so when I asked for a rock, I got a tiny castle. The fix was to start the prompt with, only a rock.
> Step three is the dream loop, and this is the trick I'd steal first. Take a screenshot of your own game. Ask Seedream to repaint it, and keep exactly the same camera, the same layout, the same pose. Only the rendering gets better. Now you have a target the game can actually reach. The agents change the engine until a live screenshot matches it. Round one scored about five out of ten. Two days in, I changed my mind about the look. Golden hour became mist. That was one sentence. Yes, switch to mist.
> Step four. The UI. I asked for a concept first, and got six images. Then I typed two words. Build it. After that it was small notes. Use more border gradients. Uneven, shadowy, noisy. The inventory, the map you can turn, the settings. All of it came from prompts like that.
> Step five is the one that matters. One agent can't hold a whole game. So Fable splits the work across threads. Lighting, effects, characters, props, UI, sound. Up to nine at once, each one owning its own files. And every thread thinks its work is great. The effects thread scored itself eight. Independent judges gave it three. So no thread scores itself. Every change gets a 4K before and after, from the same camera. A fresh judge sees them shuffled as X and Y, with no idea which one is new. If the new one doesn't win or tie, it's thrown away. Full rounds use two judges, and the lower score counts. The target is nine.
> So where is it now? Not at nine. The HUD is the best part, at eight. It takes over ten seconds to load. I rejected the walk four times before I approved it. And the gameplay you saw at the start is a scripted bot, not me playing. The cost was a few hundred credits for images, models and sound. The real bill was Claude usage. I ran into my usage limits.
> The workflow is what I'd keep. Get it playable first. Generate a target you can reach. Split the work. And never let the builder be the judge. Every prompt I wrote, every concept and every model is on a Fil canvas. It's linked below, with the skills. Go build your own.

Cut from the first voice by `voice-edit.mjs` because they were false or stale: "with two skills loaded. Dream loop, by
Anshu Chimala, and my own skill for action combat."; "Strict judges still put most of it at five or six."; "But three
days ago this was one prompt." Re-voiced (1 credit): "about a hundred and seventy" (was sixty), "Twenty seven" (was
twenty nine). The full annotated script with what each picture does: `lothric/docs/tutorial/02-script.md`.
