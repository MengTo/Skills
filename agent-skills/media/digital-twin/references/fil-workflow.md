# The Digital twin workflow in Fil

**https://fil.design/workflows/digital-twin** opens it as a new canvas in your Fil, every node already wired. Nothing runs
until you press Generate, and each node shows what it costs first.

| Node | Kind | What it does |
|---|---|---|
| **Your face** | file slot (needed) | 6–8 sharp frames of your face from your own talking-head videos: head upright, mouth closed or nearly, no selfies. For eye-contact stills, put your most frontal frames first. |
| **Your room** | file slot (needed) | 3 photos of the room you film in: the whole room, the desk, the window. Wired in after your face, so they go in last and it stays your room. |
| **Twin.md** | brief | Your face in words, your room, your gear and clothes, the look, the line, and the three shots (`Time:` and `Camera:` for each). Replace every [bracket]. |
| **digital-twin SKILL.md** | skill | The craft, short: consent, the four-part prompt, your real room only, the voice, the talking clip, judging, what to avoid. |
| **Still 1 · 2 · 3** | Seedream 5 Pro, 16:9, 2k | Each reads Your face, Your room, Twin.md and the skill, and makes its shot. About 11–12 credits each. |
| **Voice** | ElevenLabs v4 | `[calm]` and Twin.md's line. Pick your own clone in its voice field (by name or id). About 1 credit per 10 s. |
| **Talking clip** | Seedance 2.5, 480p, 5 s | Reads Still 1 and Twin.md's line. Left unticked by Generate all: pick the still that looks most like you, wire it in, and add it to Settings › Your face first. About 52 credits. |

## Run a batch of three

1. Fill in Twin.md and drop your files in. Generate the three stills (Generate all leaves the clip for later).
2. Look at each at full size: is it you, is it your room, is the gear right (an iMac's chin and logo is the most common miss).
   Measure the faces against your real frames if you can (`scripts/landmarks.swift`, `scripts/measure.py`).
3. Fix a still's mistakes with one edit (the image's Edit, model Seedream 5 Pro, listing every mistake), then keep only the
   fixed parts (`scripts/fix_still.py`), so the face can't change.
4. For the next three, change only the shots in Twin.md: the camera, the time of day, one small object.
5. Make the line in **Voice** and listen to it beside a real line of yours.
6. Wire the still you picked into **Talking clip**, add it to Settings › Your face, and generate. One clip per still.

## Prices (Nov 2026)

- A still: up to 12 credits ($0.12). A batch of three: about 36.
- An edit: 9 credits.
- A voice line: about 1 credit per 10 s.
- A talking clip (Seedance 2.5, 480p, 5 s): about 52 credits.

## From an agent

The Fil MCP builds the same flow on any canvas: `upload_file` your frames and room photos, `add_prompt` for each of the
four prompt parts (identity, room, shot, finish; together under 4,000 characters), `add_node` with kind `image`, model
`seedream-5-pro`, 16:9, 2k, wired with your face frames first and your room photos last, then `generate` with
`max_credits: 0` to price and again to run. `edit_image` with `model: "seedream-5-pro"` fixes a still (it defaults to
another model otherwise).
