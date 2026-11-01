# HTML Explainer Video prompts

## Minimal prompt

```text
Use $html-explainer-video to explain [our new scheduling feature] in one minute, in the look of [https://our-site.example]. No camera.
```

## With everything said

```text
Use $html-explainer-video to explain [what it does and who it's for]. The one idea: [what they should leave believing]. Read the facts from [our docs]. Take the look from [our site] with read-look.mjs and check it by eye. Shape: [16:9 for our site and YouTube]. Show me the price before you make the voice. The ask: [try it on one feature today, at example.com].
```

## In a named style

```text
Use $html-explainer-video to explain [the idea], in [a warm editorial look: a serif, hairlines, slow fades]. 4:3 for feeds.
```

## With a camera

```text
Use $html-explainer-video to explain [the feature], with me on camera. Set it up so I only have to press Record: a scratch voice, two parts of about 30 s, layouts by keyframes, the script as my teleprompter.
```

## Recreate this film

```text
Open demo/index.html and change its look, shape and camera. Then render it: scripts/render.mjs demo/film.html --look paper --shape 16:9 --scene all --fps 60 --scale 2 --out final
```

## Remix it

```text
Read demo/film.js and demo/film.css, then write a new look for demo/looks/ from [my site], and open demo/film.html?look=mine. Every scene works without a change: if one doesn't, add a variable rather than a special case.
```
