# Prompts

The shapes that worked. The word-for-word examples are in `page-prompts-example.md` and `build-prompts-example.md`.

## A hero (175 to 200 words)

Write it in this order, as one paragraph:

1. The product in one line ("A landing page for [name], [what it is] for [who].").
2. The scene and its light.
3. The headline: its size, weight, type class, the exact word, and where it sits ("an enormous bold white grotesk
   headline "Morning." spans the full width and sits behind the summit, so the peaks overlap the letters").
4. The device or UI, and what its screen shows.
5. The left column and the right column, with their real copy.
6. The top bar.
7. The mood, and what to leave out (no cards, no gradients).

Put real numbers in: a price, an altitude, a balance. Attach image references and say what each is for ("Use the
attached painting as the hero art and the attached logo sheet for every logo").

## A section (90 to 135 words)

1. The section's name.
2. A continuity phrase: "The page continues into…", "The light turns to dusk".
3. "The same" object carried over from the hero (the same phone, the same peaks).
4. A numbered label and a headline ("03 / THE TRANSECT", "Snow line.").
5. Body copy described, not written ("two lines of copy about walking from the lake to the col").
6. A lock clause: "Same type and quiet spacing as the hero."
7. On the last one: "the last section and footer".

## The line that starts a build

The design tool's own hand-off line, pasted as the first and only prompt of the first pass:

```
Create a web page implementation from the following instructions: [your build link]
```

The link is private to the design file. Never show it on screen or print it in the pack.

## Steering notes

One layer per note, short, as you would say it. Three that were quoted in the video:

```
Make sure that the characters are animated.
```

```
Let's add more particle effects, combat effects, background effects, god rays, and lighting effects.
```

```
Add a real water shader to the lake in the hero: gentle ripples that distort the mountain's reflection, and react
softly to the pointer. Keep the word [headline] behind the summit and everything else as it is. No new generated
images and no paid calls. Self-verify until it's perfect, and keep it at 60 fps. Then turn the water effect into a
reusable skill: write it as skills/[name]/SKILL.md in this folder.
```

What makes the last one work: what to add, how it should behave, what must not change, what it may not spend, how
to check itself, and the ask to save the result as a skill.

## Voice text

- Simple words, short full sentences, a pause before each point.
- No tags. One paragraph of 40 to 80 words per generation. Two takes; keep the lower-pitched one.
- Numerals written the way they are said in the voice text ("six point two"), numerals as digits in a teleprompter.
- Transcribe every take and compare it with the script, word for word.

## The setup questions, to paste

```
Before I start, fourteen quick answers (the last video's answer is in brackets; "same" is fine):
1. Length and depth: how long, as deep as which past video?
2. What must it teach, and what is the one takeaway?
3. The hook: what does the first line name, and when does the sponsor or tool first appear?
4. The pages: how many, what kind, which references, one design file?
5. Finals: the model's first pass, one steered pass, or builds you polish yourself?
6. The split: how much real UI and pages, how much of you on camera?
7. On camera: real takes, your twin, or generated shots? Normal clothes or dressed per scene? Box, half or full?
8. Voice: your recording or your cloned voice? I'll send three 30-second samples first.
9. The look: concept stills one by one before animating? Which image model?
10. Music: any, where, and whose?
11. Names to keep out of the pages and prompts?
12. Sponsor rules: must say, must not say, the offer, the label, the dates?
13. The pack: given away? What in it stays private?
14. Release: channel, day, who uploads, covers from a real frame or your AI face, which short after?
```
