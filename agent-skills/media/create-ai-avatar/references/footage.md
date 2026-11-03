# The footage

The twin learns your face and how you move from this, so it can't be better than this.

## What HeyGen takes

| | Must | Best |
|---|---|---|
| Length | 15 to 600 seconds | About 2 minutes of natural talking |
| Size | Long edge 640 to 4096 px | 1080p |
| Format | mp4 or webm | mp4, H.264 |
| People | One, facing the camera throughout | |
| Sound | Clear speech throughout | A quiet room, no music |
| Framing | The face in frame from the first frame to the last | Head and shoulders, eyes near the top third |

A direct upload takes up to 200 MB; a link HeyGen fetches takes 32 MB. Two to three minutes at CRF 19 is usually 60 to 120 MB.

## Picking takes

- **Use takes where you talk to the camera.** Use takes made for a teleprompter or eye contact, not ones where you read off to the side. The twin keeps where you look.
- **Leave out anything that isn't you talking.** That means screen recordings, B-roll, cuts to a second camera, and a hand over the face.
- **Keep one look.** Use one shirt, one room and one light. Use a new group look (`--group`) for another outfit, not a mixed clip.
- **Use takes with natural speech, not a script read flat.** The twin learns how much your mouth opens. Varied sentences teach it more than one repeated line.
- **Match the shape you'll use.** Landscape takes make a landscape twin.

The twin this skill was built on used the eye-contact takes of one YouTube video (2 min 48 s), all from one session in front of the same shelves. It trained in about 4 minutes.

## Where takes come from

- **A Fil canvas.** A video's camera takes are on its canvas. Find them with the Fil MCP (`get_canvas` with a query, or `search_library`) and download each signed link once with `curl -o`. Never point ffmpeg at a signed link in a loop.
- **Your own files.** Use the original recording, not an export with captions or zooms burned in.
- **YouTube.** Only your own videos, from the original files where you have them. A re-download is compressed and often has music under the voice.

## Joining

```sh
bash scripts/prep-footage.sh footage.mp4 take-1845.mp4 take-1846.mp4 take-1847.mp4
```

It scales every take to the first one's shape (1920 on the long edge at most), sets 30 fps, joins them with their sound, and says the length and size. A gap between takes doesn't matter: each take should simply start and end on your face.

## Check before uploading

- Watch the joined clip once at 2× speed: one person, face in frame, nothing burned in.
- Make a contact sheet if you're picking between sessions: `ffmpeg -i footage.mp4 -vf "fps=1/10,scale=320:-1,tile=6x3" sheet.jpg`.
- Say the training price and the wallet before `train.mjs`.
