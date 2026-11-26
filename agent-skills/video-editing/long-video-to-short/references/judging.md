# Judging

The maker of a short can't see its faults any more. A judge is a fresh agent with no history of the work, given
frame strips and one brief.

## What to give it

Strips of consecutive frames (every 2nd or 3rd frame, 8–12 across, each about 360 px wide) of:

1. the first 0.6 s (the cover and how it starts moving);
2. every on-camera entrance and exit;
3. a caption page flip and a headline change;
4. two or three moments with hands moving (cut-out edges);
5. the closing card.

Make them from the rendered file (`ffmpeg -ss T -i short.mp4 -frames:v 30 -vf "select=not(mod(n\,3)),scale=360:-1,tile=10x1" strip.jpg`),
not from stills of the project.

## The brief

> You are judging a 60-second vertical short for a designer's audience. These strips are consecutive frames from
> the rendered file, left to right. Score each item out of 10 and name the single worst fault in each, with the
> strip and frame where you see it:
> 1. Entrances (headlines, captions, the person arriving)
> 2. Exits (the same, leaving)
> 3. Text (legibility, hierarchy, line breaks, nothing clipped or overlapping)
> 4. Cut-out edges (hair, shoulders, hands, anything see-through, any rim of another background)
> 5. How the person sits in the scene (light, colour, scale, contact, anything behind them that clashes)
> 6. Polish overall
>
> Anchors: 6 = a fault a viewer would notice at full speed; 8 = faults only visible frame by frame; 9 = nothing you
> would send back. Don't soften: say what you would fix first.

Attach the motion rules (`motion.md`) as what was intended, and nothing about what you changed since the last round.

## Rounds

- Same brief and same strips' moments every round, a new judge each time.
- Fix the lowest item first; one round's fixes, one re-render, one re-judge.
- Report the scorecard as it is: the lowest item, not the average, and what wasn't judged (a judge reading strips has
  not watched playback or heard the sound; say so).
- Stop when the target is met, or when two rounds come back flat. In our run entrances, exits, text and polish
  reached 8 while cut-out and seating stayed at 6 for four rounds: the faults left (no rim light from the scene, a
  roof touching the hair) were choices of background and light, not of code. Say that, and offer the real fix (a
  calmer background, or a re-skin for that beat) instead of another round.
