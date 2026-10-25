# Reading the source

A reel made from something says what that thing says and looks like it. The source is a tweet (an X post), a landing page, a YouTube video or a video file. `scripts/read-source.mjs` reads it into one folder; you finish two documents from it, `Source.md` (the words) and `Look.md` (the look), and the reel is made from those two and nothing else.

```bash
node scripts/read-source.mjs https://x.com/<handle>/status/<id> --out source --follow
node scripts/read-source.mjs https://example.com --out source
node scripts/read-source.mjs https://youtu.be/<id> --out source      # needs yt-dlp
node scripts/read-source.mjs demo.mp4 --out source
```

It writes `source.json`, `media/` (the post's videos and pictures, the authors' avatars, the YouTube video, the page's screenshots), `frames/` (contact sheets of each video, a frame every 2 s or every `--every` seconds, and up to 12 key frames at its scene changes) and drafts of `Source.md` and `Look.md` with what it measured. Each video's `cuts` lists every scene change's time: where it changes page, and where a glitch may hide. To choose pieces, read it again with `--every 0.5`, or pull frames at the moments you're deciding on (`ffmpeg -ss 12.3 -i video.mp4 -frames:v 1 f.jpg`).

## What each kind gives

| source | the words | the pictures | the look |
| --- | --- | --- | --- |
| tweet | its text, word for word; the quoted post's text; the linked pages' headings and copy (`--follow`) | its videos and pictures, the quoted post's | the video's frames (palette measured, fonts by eye); a linked landing page's styles |
| landing page | title, description, headings, copy, buttons | screenshots a screen at a time, desktop and phone | measured: fonts, sizes, weights, case and tracking of headlines, text, buttons and labels; colours; radii; `:root` CSS variables; palette by area |
| YouTube video | title, description, chapters, its captions as timed text | the video (720p) | the frames; the thumbnail's type |
| video file | none until it's transcribed (Fil's captions, or whisper) | itself | its frames |

Tweets are read through the public fxtwitter API (no sign-in). YouTube needs `yt-dlp` (`brew install yt-dlp`); without it, bring the video into Fil through Fil for Mac and read the file. Pages are read with playwright, signed out, as anyone sees them.

## Source.md: the words

- **Word for word.** Copy the source's own sentences. The script may shorten and reorder them, never change a claim.
- **Facts it may use.** List every number, name, price and claim the reel may say, each as the source says it ("$0.15 per 1M input tokens"). Nothing else gets said: no invented results, ratings or users.
- **The one idea.** What someone should leave believing, in the creator's words.
- **The hook.** The most surprising true thing in the source, sayable in the first second. Often it's in the post's first line or its video's best moment, not its headline.
- **Other people's work.** A quoted post, a linked repo, a tool someone else made: name them on screen and in the voice ("Ryan's Anatomy skill"), show their handle, never present it as the creator's own.
- **The ask.** Comment a word for the link, follow, the link in bio, or none.

## Look.md: the look

Fill each line from what was measured, then look at the frames and screens before you trust it.

- **Shape.** 9:16 for Reels, TikTok and Shorts; 4:5 or 1:1 for a feed; 16:9 for YouTube. The scenes take it as `HTMLReel.scene({ shape })`.
- **Mode, ground, ink, accent.** From the palette: the ground is the most common colour, the ink the most common far from it, the accent one vivid colour the source really uses for emphasis (a button, a highlight, a key). A measured accent can come out dull when the vivid parts are small: pick it from the frames by eye, then sample it exactly (`ffmpeg -ss 12.3 -i video.mp4 -frames:v 1 -vf crop=40:40:x:y,scale=1:1 -f rawvideo -pix_fmt rgb24 - | xxd -p`).
- **Frame.** The box's corners and backdrop for a framed demo: square and flat on the source's ground for a technical source, rounded over a blurred copy for an app. They go to frame-video as `--radius` and `--backdrop`.
- **Type, as three roles.**
  - Setup: the line that sets up. On a page, its headline or subhead face; in a video, the closest Google font to what it shows.
  - Payoff: the word that lands. Heavier, bigger, or the source's display face.
  - Labels: tags, figures, numbers, small words around a picture. Often the source's mono or small caps.
  Set them as `--reel-setup-font`, `--reel-setup-size`, `--reel-setup-weight`, `--reel-setup-case`, `--reel-setup-track`, the same for `payoff` and `label`, and `--reel-bg`, `--reel-ink`, `--reel-accent`, in the scene's own `:root` after `reel-clock.css`. A page's `font-family` that isn't on Google Fonts gets its closest one there.
- **Background.** What's behind the titles: the source's own ground, its texture or light, a blurred and dimmed frame of its video.
- **Motifs.** Shapes, frames, cards, cursors, rules, figure numbers the source uses: the scenes reuse them, so the reel feels like the source's own.
- **Motion.** How things arrive in the source: snappy and mechanical, soft and slow, springy. The scenes move the same way.

The defaults in `reel-clock.css` (a cinematic serif, a heavy condensed payoff, an orange dot) are one reel's look. Use them only when the source has no look of its own.

## The three posts this was tested on

- **MiniMax M3.1 Flash landing pages** (a 51 s 4:3 screen recording of six sites): six looks in one video, so the reel's look comes from the creator's favourite one (the exploded-keyboard pages), and each site gets its moment.
- **Reverse-engineer your home into a Mac app** (70 s, a warm tan isometric house with frosted-glass control cards, quoting @icanberk): warm ground, glass cards, a clean sans; the quoted creator credited.
- **Anatomy for visual explainers** (21 s, technical isometric wireframes with mono labels, quoting @wheresryan22): near-black ground, mono labels as figure captions ("Fig 1"), a thin-rule motif.
