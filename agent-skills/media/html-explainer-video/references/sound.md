# Sound

Three layers under one voice: a music bed, sound effects on what you see, and silence the rest of the time.

## The cues

In `film.js`, a list of what happens and when, `t` being the frame it happens:

```js
window.SFX = [
  [T.product, 'pop'], [T.feature, 'pop'], [T.say, 'typing', 0.9], [T.on2, 'click'], [T.pageEnd, 'sub'],
];
```

Pick the name for what the moment is:

| name | for |
| --- | --- |
| `click` | A press |
| `tap` | A light touch: a word landing, a toggle's edge |
| `pop-soft` | A row or chip arriving |
| `pop` | Something landing with weight |
| `typing` with a duration, `key` | Typing, and Enter |
| `whoosh-soft` | A move |
| `whoosh-heavy` | A big reveal |
| `sub` | A short kick-led hit, under the film's one or two biggest reveals. No more than that |
| `success` | A job finished |
| `ting` | One accent |
| `riser`, `reverse-whoosh` | Into a big moment |
| `snap`, `hit`, `blip` | A shutter, a cut hit, a tick |

**Fewer, better.** About one a second across the film, with quiet stretches under the voice, and never more than two within 150 ms. Keep presses, arrivals you can see and the hook's beats. Cut decoration. Not a hit on every cut.

## Placing them

```bash
node scripts/sfx.mjs film.html --out sfx.json
```

Each role has a measured sync point, because a sound's peak isn't its start and the picture needs it in a particular place:

| role | lands | level over a bed at 0.12 |
| --- | --- | --- |
| click | 11 ms before the frame | 0.27 |
| pop, soft | 4 ms after | 0.12 |
| land | 30 ms after | 0.17 |
| tap | 60 ms before | 0.10 |
| key | 8 ms after | 0.25 |
| whoosh, short | its peak 37 ms after | 0.14 |
| whoosh, long | its peak 3 ms after | 0.15 |
| riser | its peak 23 ms before | 0.21 |
| bell | 20 ms before | 0.12 |
| sub | on the frame | 0.11 |

`sounds/kit.json` holds these for every take, measured from the files. The sounds are from [earshot](https://github.com/Leonxlnx/earshot)'s launch kit by Leon Lin, made in code and audited, under the MIT licence (`sounds/LICENSE.txt`). A bigger sound swallows a smaller one within 70 ms, and each role keeps its own smallest gap in a run.

## Music

A bed under the voice: from their library, or an audio node priced first (`eleven-music`, about ⚡8 for a minute). Instrumental, calm, no drop. In Fil: `set: { sound: "music", volume: 0.12, under_voices: 0.5, fade_out: 1.5 }`.

## In Fil

Upload the takes your film uses (`references/fil-editor.md`), save their ids as `assets.json` (`{ "click_1.mp3": "<asset id>" }`), then:

```bash
node scripts/sfx.mjs film.html --out sfx.json --assets assets.json
```

`sfx-commands.json` holds `{"op":"add","file":…,"at":…,"set":{"volume":…,"sound":"effect","under_voices":0.9}}` for each, to send 60 at a time with `brief: true`. `under_voices: 0.9` matters: `false` means Use take silences the effect. Read the lanes back afterwards: a busy named lane sends a clip elsewhere, so check nothing sits on the voice's lane or above the scenes, and name any new lane "Sound effects N".

If you'd rather not upload anything, Fil's own inserts work too: `{"op":"add","insert":"pop-soft","at":t,"set":{"volume":0.1}}`, at volumes 0.06 to 0.2, with no sync offset.

## Listening

None of us has ears, so measure. [earshot](https://github.com/Leonxlnx/earshot) (optional, its own install) gives a transcript of what a film sounds like:

```bash
ffmpeg -y -loglevel error -i preview.mp4 -vn -c:a pcm_s16le preview.wav
python -m earshot timeline preview.wav | head -60
```

Fix what it says is wrong: an effect louder than the voice, a run reading as a rattle, dead air. Without it: `ffmpeg -i film.mp4 -af ebur128=peak=true -f null -` for loudness and true peak, and watch at 0.25× for sync.
