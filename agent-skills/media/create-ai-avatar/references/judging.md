# Judging an avatar

The person decides: it's their face. Your job is to show them the difference plainly, with the same line on every engine, before you say which you'd pick.

## The mouth sheet

```sh
bash scripts/mouths.sh mouths.jpg footage.mp4 twin-avatar_v.mp4 twin-avatar_iv.mp4 twin-avatar_iii.mp4
```

It makes one row of six close-ups for each render, with your real footage last. Before trusting it, look at one frame and move `CROP` so the box runs from just under the nose to just under the chin. The face sits differently in every take, and a twin can be framed tighter than its footage. If a row's face drifts out of the box, that engine moves your head more: say so, and don't read it as a mouth.

Look along each column, then down:

| Look at | Over-acting | Like you |
|---|---|---|
| Width | Lips stretched toward the cheeks | Opens about as wide as yours |
| Teeth | Both rows, often | As often as yours show (for the creator this was built on: the top row, rarely) |
| Shape | Wide and flat, a half grin | Small and round, if that's how you talk |
| Lips | Pinker, glossier, outlined | Your colour |
| Corners | Pulled up between words | Relaxed |
| Skin | Smoothed around the mouth | Your texture, stubble and marks |

## The clip

Stills can't show sync. Put the renders side by side in one clip, with their shared sound, and watch it with the sound on:

```sh
ffmpeg -i twin-avatar_v.mp4 -i twin-avatar_iv.mp4 -i twin-avatar_iii.mp4 -filter_complex \
 "[0:v]crop=720:720:560:180,scale=640:640[a];[1:v]crop=720:720:560:180,scale=640:640[b];[2:v]crop=720:720:560:180,scale=640:640[c];[a][b][c]hstack=3[v]" \
 -map "[v]" -map 2:a -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest side-by-side.mp4
```

Check that consonants close the lips (b, p, m), that the mouth is still between phrases, and that hands, if they move, have five fingers that stay fingers.

## Showing the person

- Send the clip and the sheet, and say which row is which.
- Say what you saw in plain words: "Avatar V stretches your lips and shows both rows of teeth; in your real takes your mouth opens small and round."
- Say what you couldn't check, for example sync from stills.
- Ask which one, and let them change their mind after watching. The creator this was built on first picked Avatar III from the sheet, then Avatar IV after watching.
- Write down the pick with the ids: the look, the group, the voice and the engine.
