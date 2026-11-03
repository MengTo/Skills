---
name: create-ai-avatar
description: Make an AI avatar of yourself that looks and sounds like you. A HeyGen digital twin trained on a couple of minutes of your own footage says lines you never recorded, in your own ElevenLabs voice, lip-synced from the audio, on the engine whose mouth moves most like yours. Covers picking and joining takes, training, consent, making the voice, rendering the same line on Avatar V, IV and III, and judging them mouth to mouth against your real footage before anything else is made. Use when someone wants a digital twin, an AI avatar or talking head of themselves or a consenting person, a HeyGen avatar from their YouTube videos or recordings, their avatar to speak in their own cloned voice, a lip-synced talking video from a photo and audio, or says their avatar looks wrong, over-acts or its mouth isn't theirs.
---

# Create AI Avatar

**HeyGen API · ElevenLabs · ffmpeg.** Scripts are plain Node 20 and bash, with no packages to install.

An avatar of you is three things, each from its best source. The face and the way you move come from your own footage (a HeyGen digital twin). The voice is your own clone on ElevenLabs, made into an audio file. One engine lip-syncs the two. You then judge the result where likeness breaks first: the mouth, close up, beside your real one.

**Boundary.** Use `html-explainer-video` for a film with no face in it, and `html-reel` to cut your real phone takes into a reel. Use this skill when the person on screen should be you, saying words you didn't record.

**Provenance.** Built in November 2026 on a creator's own twin, trained from the eye-contact takes of one YouTube video (2 min 48 s) and voiced in his ElevenLabs clone on v4. The same 8.8-second line was rendered on all three engines, and the creator picked by the mouth. The demo shows four presenters made from single portraits as HeyGen photo avatars, so nobody's real footage is on show.

## The mechanism

**Keep the face, the voice and the lip-sync apart, and only ever change one of them.** The twin is trained once. The voice is a file you listen to before it goes anywhere. A render is the twin plus that file on one engine. When something looks wrong you can then tell which part to change. Use the same line and the same audio for every engine you compare: a new line hides what the engine did.

**HeyGen can't use an ElevenLabs voice by its id.** Make the line on ElevenLabs (`scripts/voice.mjs`), then send HeyGen the audio as `audio_asset_id` or `audio_url` instead of `script` and `voice_id`. The video is as long as the audio, up to 30 minutes.

**Judge it by the mouth.** In a whole frame every engine looks fine. Crop the nose-to-chin box at six moments of each render and of your real footage, and stack them (`scripts/mouths.sh`). Then look at how wide the lips stretch, how much of the teeth show, the colour of the lips and the corners of the mouth.

## Three ways to an avatar

| | Digital twin | Photo avatar | Talking photo |
|---|---|---|---|
| From | 15 s to 10 min of footage, about 2 min best | One photo | One photo |
| Costs first | About $2.13 to train, plus consent | About $1.32 | Nothing |
| Engines | Avatar V, IV, III | Avatar V, IV, III | Avatar IV only |
| Moves | As you do: your head, your habits | What the engine imagines | What the engine imagines |
| Use for | Anything that has to pass as you | A presenter from a portrait, on Avatar V | A quick line |

All three take your audio. Start on **Avatar V**: it's HeyGen's newest engine and the default here. Judge it by the mouth, and step down to IV or III if it over-acts the person you know. Fil's **Create AI avatar** workflow is the photo avatar: your photo and a voice, wired into HeyGen Avatar V.

## The workflow

1. **Pick the footage** (references/footage.md). Use your best talking takes: you alone, facing the camera with the face in frame throughout, in a quiet room, at 1080p. That's two to three minutes of natural speech. Eye-contact takes are best. Download each once and join them with `bash scripts/prep-footage.sh footage.mp4 take-*.mp4`.
2. **Upload it.** `node scripts/upload.mjs footage.mp4` direct-uploads up to 200 MB and keeps the asset id beside the file.
3. **Train it.** Say the price ($2.13) and the wallet first. Then run `node scripts/train.mjs --footage <asset_id> --name "Ada · March takes"`, which trains in a few minutes. A new character gets a consent link: the person in the footage opens it within 24 hours and records a short statement. The twin renders only once its look is `completed` and its consent `accepted`. To add new footage of the same person, pass `--group`.
4. **Make the line.** Run `node scripts/voice.mjs "<one line, about 25 words>" line.mp3 --voice <your clone>`. Listen to it, and check its words with `node scripts/hear.mjs line.mp3`.
5. **Render the line on Avatar V,** with no motion prompt: `node scripts/render.mjs --look <look_id> --audio line.mp3`. To compare, render the same line on `--engine avatar_iv` and `avatar_iii` too. Each render prints its price first and the wallet after. A portrait instead of footage: make it a photo avatar with `POST /v3/avatars` `{ type: 'photo' }` (references/heygen.md) and render its look the same way.
6. **Judge.** Run `bash scripts/mouths.sh mouths.jpg footage.mp4 twin-avatar_v.mp4 twin-avatar_iv.mp4 twin-avatar_iii.mp4` and put the renders side by side with their sound. Show the person both before saying which is best: it's their face (references/judging.md).
7. **Use the one they pick** for the real lines, and write it down with the ids: the look, the group, the voice and the engine.

## Rules

Each rule names the failure it prevents.

- **Check which face goes with which voice before rendering.** Two photo avatars' ids were swapped once, and four renders paired each face with the other person's voice. Name every file after its person, and check the look's `name` before each render.
- **A new render needs a new Idempotency-Key.** One render was sent again with the first render's key, and HeyGen handed back the first video. `render.mjs` builds the key from the subject and the audio.
- **Change the engine, not the prompt, when the mouth over-acts.** On Avatar V the lips stretched wide and both rows of teeth showed. A `motion_prompt` and `more_blinking` changed almost nothing; Avatar IV and III fixed it.
- **`expressiveness` is for photo avatars on Avatar IV only.** Avatar V rejects it, and a twin doesn't take it.
- **A calm read beats an acted one.** A stability-0 read with `[excited]` and `[laughs]` sounded less like the creator than the default. Start calm, and change the voice only after the face is right.
- **A twin is no sharper than its footage.** Takes scaled down to 720p gave a 1280×720 look. Train from 1080p.
- **Say the price and the wallet before every paid call.** The wallet is the account's, so anything else on the same key spends from it too. It once dropped $1.76 more than the twin and one render cost.
- **Consent belongs to a group and to one person.** Never add someone else's footage to a group, and never train anyone who hasn't agreed. HeyGen runs no consent check for a photo, so getting the person's agreement is on you.
- **Download a source once, then work from the local file.** Never loop ffmpeg over a signed link.
- **Training clones a voice too.** HeyGen makes `default_voice_id` from the footage as its own resource. Use it only if your ElevenLabs clone isn't there. Deleting the twin doesn't delete it.
- **Hands can come out wrong.** Avatar IV gestures, and in one render a thumb looked rubbery. Watch the whole frame once before using a take.

## The engines, on one twin and one line

| Engine | A second | The mouth | Everything else |
|---|---|---|---|
| Avatar V | $0.12 | Lips stretched, both rows of teeth, pinker lips | Smoothed skin; invents the most |
| Avatar IV | $0.0805 | Small and round, top teeth now and then | Hand gestures; the creator's pick for his own face |
| Avatar III | $0.01 | Closest: small openings, natural lip colour | Your real head movement; oldest, so check sync by ear |

That's one face in one session, so judge your own: it's why step 6 exists.

## Numbers

- Footage: 15–600 s (about 2 min best), long edge 640–4096 px, mp4 or webm, one person, up to 200 MB direct.
- Training: about $2.13, about 4 minutes for 2 min 48 s. A photo avatar: about $1.32, ready in about 10 seconds.
- Consent link: valid 24 hours.
- A line: about 25 words, 8–10 s, the same audio for every engine.
- One 8.8 s render: Avatar V $1.05, IV $0.71, III $0.09; 2–3 minutes each.
- Audio: mp3 or wav, up to 32 MB as an asset, up to 30 minutes a video.
- Mouth sheet: 6 moments a row, a 420 × 300 box of a 1920-wide frame, moved to fit the face.

## Files

- `references/footage.md`: picking, joining and checking takes
- `references/heygen.md`: every HeyGen call the scripts make, and its answers
- `references/judging.md`: the mouth sheet, what to look for, showing the person
- `scripts/keys.mjs`: keys from the environment or `.env.local`, and the HeyGen client
- `scripts/prep-footage.sh`, `upload.mjs`, `train.mjs`, `consent.mjs`, `voice.mjs`, `hear.mjs`, `render.mjs`, `mouths.sh`, `balance.mjs`
- `demo/index.html`: four presenters from single portraits on Avatar V, one on all three engines, with the mouth sheet

Keys: `HEYGEN_API_KEY`, `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` (your clone), from the environment or `.env.local`. They're never printed.
