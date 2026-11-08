# Your voice

Start with an **instant clone** (a minute, no verification), make it sound right on **`eleven_v4`** with an **audio
tag**, **score** it against your real voice, and let your ear decide. A Professional Voice Clone (PVC) can be better, but
it has traps that can take your voice offline for a day or more.

## 1. Build a clean dataset from your recordings

Your talking-head recordings already hold your voice on your usual mic. If other people talk in them (webinars, calls),
label the segments first.

```bash
mkdir -p voice/raw && cd voice
ffmpeg -i ~/Videos/talk-1105.mp4 -vn -ac 1 -ar 48000 raw/talk-1105.wav
ffmpeg -i raw/talk-1105.wav -ar 16000 raw/talk-1105.16k.wav
whisper-cli -m ~/Library/Caches/whisper.cpp/ggml-large-v3-turbo-q5_0.bin -f raw/talk-1105.16k.wav -ocsv   # → raw/talk-1105.16k.wav.csv
python3 ../scripts/voice/build_ref.py seg raw/talk-1105.16k.wav:0:600 raw/*.16k.wav
```

- The seed (`FILE:START:END`) is a span that is only you: your opening talk or a solo intro. Segments of 2.5–15 s are
  labelled by similarity to it: ≥ 0.80 `self`, ≤ 0.62 `other`, anything between is left out.
- `build_ref.py` uses Resemblyzer, which is fine for labelling **within one recording** (same mic and room). Don't use it
  to score clones (below).
- Name the whisper CSV exactly `X.16k.wav.csv`. A symlink loop clobbered three of them once.
- Check what's labelled you: `python ../scripts/voice/scan_dataset.py ref seg-files…` scores 6-second windows with ECAPA
  (the same model as the scorer). Clean files score median 9.7–10.4, with at most ~3 % of windows not clearly you.

## 2. The instant clone

```bash
python3 ../scripts/voice/make_ivc.py seg/segments.tsv ivc --seconds 180 --exclude "a sentence you'll test with"
../scripts/voice/el.sh POST /v1/voices/add -F "name=Your Name Instant" -F "remove_background_noise=false" \
  -F "files=@ivc/ivc-1.mp3" -F "files=@ivc/ivc-2.mp3"
../scripts/voice/el.sh POST /v1/voices/VOICE_ID/settings/edit -H "Content-Type: application/json" \
  -d '{"stability":0.5,"similarity_boost":0.95,"style":0.0,"use_speaker_boost":true,"speed":1.0}'
```

- About 3 minutes of your cleanest solo speech: the top segments by similarity, 6–15 s each, in two files. More doesn't
  help an instant clone much.
- `remove_background_noise=false` keeps your real timbre. Denoise the dataset yourself if it's noisy.
- Keep any sentence you'll score with out of the clone's samples, so the test stays fair.

## 3. Make it sound like you: model and tag

Generate the same 3 test lines on several models, then score them. Use 7–10 s lines with different rhythms: one you
really said (so there's a real recording to compare), one with short choppy sentences, one long flowing sentence.

What one creator's instant clone measured (his range 106–131 Hz, median 116):

| Variant | Similarity /10 | Pitch | Score /10 (mean of 3 lines) |
|---|---|---|---|
| v4, no tag | 9.0–9.5 | 136–162 Hz, too high | 7.7 |
| **v4 + `[calm]`** | 8.5–9.3 | 129–134 Hz | **9.2** |
| v4 + `[calm, deep voice]` | 7.8–9.3 | 118–125 Hz | 9.1 |
| v4 + `[calm, low voice]` | 6.8–8.8 | 118–120 Hz | 8.6 |
| v4 + `[calm, relaxed]` | 8.6–9.5 | 134–143 Hz | 8.6 |
| v4 + stability 0.8 or 1.0 | — | 143–160 Hz | pitch unchanged |
| Multilingual v2 | 7.1–7.6 | 109–121 Hz | 8.1 |
| v3 | 3.2–5.5 | 118–130 Hz | 5.9 |
| his older Pro voice on v4 | 7.7–9.1 | 122–138 Hz | 8.7 |

So: v4 got the timbre and v2 got the pitch. A tag fixed v4's pitch without losing the timbre, and stability didn't touch
it. Tags vary per voice: try 3–4 and score. Confirm with whisper that the tag isn't spoken.

`scripts/voice/tts_line.sh VOICE_ID "Your line." out.mp3 [eleven_v4] ["[calm]"]`

Takes vary by about ±0.4 between runs. Compare means across the three lines, never one cherry-picked take.

## 4. Score it

```bash
python3 scripts/voice/score_voice.py voice/ref clip1.mp3 clip2.mp3 …
```

- `voice/ref/real/`: 20–30 clips of you (3–10 s), the centroid. `heldout/`: 15–20 clips of you from another day, which
  define 10. `other/`: 15–25 clips of other people, ideally from the same recordings, which define 0. Cut them from the
  labelled segments.
- ECAPA-TDNN (SpeechBrain, trained on VoxCeleb). Every clip, references included, goes through the same chain (80 Hz–7.6
  kHz band, loudness normalised, 16 kHz mono), so a mic or processing difference can't pass for a speaker difference.
- Pitch: median F0, 10 inside your own p10–p90 range (computed from your clips), falling to 0 at 25 % beyond.
- **Score = 0.7 × similarity + 0.3 × pitch.**
- Sanity checks from that project: his raw clip = 10.0, the same clip denoised = 9.3. So **9 ≈ your own voice after
  processing**, and that's the target.
- **Clips under ~5 s score low whatever the voice** (a 4 s line of the right voice scored 4.7). To check that two short
  clips are the same voice, compare their embeddings to each other (cosine ~0.85 = the same voice).
- **Resemblyzer is useless for scoring:** it's channel-sensitive, and it scored his own voice 3.8 after denoising.
- Then the real test: a before/after for your ear (your real line → the old clone → the new clone). The person heard
  his and said "Sounds like me". That's the gate, and the score is the guide.

## 5. Professional Voice Clone: worth it, with traps

A PVC trains on 30 min–3 h of your speech (ElevenLabs suggests up to 3 h), per model, in 3–6 hours each. Traps from one
real run:

1. **Adding samples to a working PVC resets its verification.** The voice then can't train and is **unusable on every
   model** ("not fine-tuned and cannot be used"). Every voiceover in that voice, in every app, fails until it's
   re-verified and retrained.
2. **Verification = you read on-screen text into your mic** (web app: the voice's ⋮ → Finish this voice → Next → Verify
   your voice). Only the owner can do it. Never click Skip.
3. **5 tries, then a 24-hour lock.** All 5 failed in that run: 2 "spoken text doesn't match", 3 "your recording doesn't
   match the voice from your uploaded samples". That was on two different mics, with samples that an ECAPA scan called
   clean.
4. Some browsers' embedded panes block the microphone. Use a normal browser.
5. A new PVC needs a free Professional slot (a Creator plan has 1).

So:
- **Keep an instant clone as the stand-in** before touching a PVC in use.
- **Before spending verification tries,** record 30 s of yourself on the mic you'll use, and score it against the
  samples. Read at your normal pace and energy, in a quiet room, close to the mic.
- Plan the downtime: warn whoever uses the voice.
- After a retrain, check each model's state and retrain the ones you use that dropped out.
  `scripts/voice/watch_train.sh VOICE_ID eleven_v4` polls every 5 minutes.

## 6. API calls (all through `scripts/voice/el.sh METHOD PATH [curl args]`)

| Call | Endpoint |
|---|---|
| your plan, slots, characters | `GET /v1/user/subscription` |
| list voices | `GET /v2/voices?category=cloned` / `professional` |
| a voice: samples, fine-tuning, verification | `GET /v1/voices/{id}` (`fine_tuning.state`, `verification_failures`, `next_max_verification_attempts_reset_unix_ms`) |
| instant clone | `POST /v1/voices/add` (multipart `name`, `files`, `remove_background_noise`) |
| settings | `POST /v1/voices/{id}/settings/edit` |
| speak | `POST /v1/text-to-speech/{id}?output_format=mp3_44100_192` with `{"text":"[calm] …","model_id":"eleven_v4"}` |
| PVC samples | `POST /v1/voices/pvc/{id}/samples` (multipart `files`), `DELETE /v1/voices/{id}/samples/{sid}`, `GET …/samples/{sid}/audio` |
| PVC train | `POST /v1/voices/pvc/{id}/train {"model_id":"eleven_v4"}` |
| models | `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_multilingual_v2`, `eleven_flash_v2_5`, `eleven_turbo_v2_5` |

The key needs voices read and write (and text-to-speech) permissions. Keep it in `.env` (chmod 600), out of git, and
never print it. In Fil, an audio node with an ElevenLabs model takes your voice by its id.

## 7. Your real voice as a Seedance audio reference

When a line you actually said fits: find it with whisper word timings (`-ml 1`), cut 4–5 s on silences, denoise lightly
(`afftdn`), set it to −16 LUFS, and pad it to 5.0 s with a ~0.35 s lead
(`ffmpeg -i in.wav -af "adelay=350|350,apad=whole_dur=5" line-5s.mp3`). Quote its exact words in the video prompt.
Seedance re-voices it rather than playing it back, but it keeps your real pitch (112 Hz against his real 113). The
clone-voice drafts sat at 124–131 Hz.
