# What separates a 7 from an 8

The bar is 8/10 from two fresh blind judges, the lower score counting. Across several hundred verdicts on Fil's scenes, the same things cost
the point. Fix what the scene's judges named first, then check all of these.

1. **A dead ending.** The biggest one. Nothing moving after ~60 % of the length, or a frozen last 1.5 s. Land the second beat late and keep
   something meaningful alive to the end: a slow push on the whole frame, a thread still drawing, a counter settling, light travelling.
   One blinking dot doesn't count. Longer scenes are judged harder on this: 6 s beat 8 s twice in round 19.
2. **Timid final frame.** Small things in a big empty field, or plain text on a flat colour. The last ~15 % is a poster: scale, one idea,
   intentional edges, centred mass (judges call out "bottom-heavy", "crowds top right while top left is empty").
3. **Tiny words.** Readable words at least 1.8cqw, display lines far bigger, faux-UI and code at least 1.6cqw. Cut lines rather than
   shrink them; fewer and larger wins. Judges call mono text "tiny" even at 1.8cqw when there's a lot of it.
4. **Slideshow of states.** Fades between layouts read as a template. Connect beats with one continuous move: the camera travels, one
   element becomes the next, one mechanism causes the next thing. A "fold" where many parts collapse at once reads as clutter mid-move;
   sequence it or don't do it.
5. **No stated point.** If a viewer can't say what the shot claims, add one short line or make the payoff say it.
6. **Weak or stock imagery.** Generic particle globes, purple orb nebulas, icon rings, grey wireframes, gradient placeholder thumbnails,
   blob trees read as filler. Draw something with craft (layered gradients, light, texture, real structure) or remove it.
7. **Slow or empty openings.** Frame one is a composed picture and something happens in the first half second. No long typing on a dim
   frame, no shapeless "forming cloud".
8. **Clipping, collisions and bands.** Things touching the frame by accident, labels colliding, a line crossing through tiles or type,
   big unused bands. Going off the edge must look deliberate.
9. **Bugs judges always catch:** a travelling light frozen mid-path in the last frame; a counter that stops while its bar runs; copy that
   swaps late and reads as a second message ("Done runs every node."); a label covering a card's chrome; a regroup mid-shot that reads as
   a reset.

## How far to change a scene
- At 7: keep the idea and fix exactly what was named. Two rounds at 7 where the notes name the *idea* ("rotating-word trope", "stock icon
  orbit") means polish won't get there: a new idea in the same look, same message.
- At 6 or 5: don't polish the old composition. New idea, same look, same subject.
- A version that scores lower than the one before is dropped; keep every judged version so you can restore it.
- Keep `data-fil-text` keys where the idea survives.

## Before a builder calls a scene done
1. Look at the sheet and the last frame, frame by frame; close looks with `--times`. List flaws, fix them. 3 to 5 rounds; stop at 6.
2. `grep`: no `setInterval`, no `Math.random`, no em dashes on screen, no `\u` escapes, colours only through the variables.
3. Render once in the other mode (`--mode light|dark`) and once with the headline 1.6× longer (`--t key="…"`), to `out/_<id>-a` and
   `out/_<id>-b`. Both must still look designed.
4. Render the final file once more to `out/<id>` so the sheet matches the file, and check it for blank frames (a dropped frame is the
   renderer's, render again).
Builders' own scores run about one point high.

## What happened in round 19 (a launch film, nine shots)
4 of 9 reached 8, 8 in 2 to 3 rounds each (an isometric tower, an isometric grid, a photo-pile pull-back, a camera travelling a path).
Five sat at 7 through 5 to 10 judged versions: particle-cluster spheres, an agent-windows feature, a particle galaxy, a word swap and an
icon orbit. What finally decided them was the idea, not the polish. Judges saw stills; the owner then asked to see them at speed
("show me videos"), so make the screening page and the MP4s part of the delivery, not an afterthought.
