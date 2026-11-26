---
name: elevenlabs-tts
description: Generate ElevenLabs text-to-speech audio from scripts or inline text using local voice profiles. Use when the user asks for ElevenLabs, text-to-speech, TTS, narration, voiceover, speech audio, or voice generation; load voice names, voice ids, emails, owners, and account-specific defaults only from local config outside the skill.
---

# ElevenLabs TTS

Use this skill for ElevenLabs text-to-speech generation. Keep the skill reusable and non-personal:

- Do not store API keys, voice names, voice ids, emails, account names, customer names, or personal defaults in the skill.
- Read `ELEVENLABS_API_KEY` from the process environment or the nearest `.env`.
- Read account-specific voice profiles from local JSON config outside this skill.
- Generate audio with request-level settings. Do not mutate saved ElevenLabs account or voice settings unless the user explicitly asks.

## Local Profiles

Prefer one of these config sources, in order:

1. `--config /path/to/profiles.json`
2. `ELEVENLABS_TTS_CONFIG=/path/to/profiles.json`
3. `local/elevenlabs/profiles.json`

Project-local profile files are also fine when they are gitignored, for example `config/local/elevenlabs-tts.json`.

The helper script expects this shape:

```json
{
  "default_profile": "default",
  "profiles": {
    "default": {
      "voice_name": "Voice name from the local account",
      "voice_id": "optional-direct-voice-id",
      "voice_id_env": "OPTIONAL_ENV_VAR_WITH_VOICE_ID",
      "model_id": "eleven_multilingual_v2",
      "output_format": "mp3_44100_128",
      "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 1.0,
        "style": 0.0,
        "speed": 1.0,
        "use_speaker_boost": true
      },
      "output_dir": "outputs/voiceovers",
      "emails": []
    }
  }
}
```

Fields like `emails`, owners, aliases, and notes are for local routing/context only. The script ignores unknown metadata fields.

## Workflow

1. Choose the profile from `--profile`, `ELEVENLABS_TTS_PROFILE`, or `default_profile`.
2. Prefer the helper script:
   `python3 <skill-root>/scripts/generate_voice.py --text-file script.txt --profile default --output output.mp3`
   Generating spends the account's characters: run it with `--dry-run` first (free), tell the user how many characters
   it will use, and generate only on their typed yes.
3. If the profile has `voice_id`, use it. If it has `voice_id_env`, read that env var. Otherwise search ElevenLabs by `voice_name`.
4. Use profile `model_id`, `output_format`, and `voice_settings` unless the user overrides them for this generation.
5. Put generated audio in the requested destination. If no destination is given, use the profile `output_dir`, then `outputs/voiceovers/`.
6. Report the output path and any important warnings. Do not print secrets.

## Helper Script

The bundled script supports:

- `--text "..."` for inline text
- `--text-file path.txt` for script files
- stdin when neither `--text` nor `--text-file` is provided
- `--profile name` to select a local profile
- `--config path.json` to select a local profile file
- `--voice-id`, `--voice-name`, `--model-id`, `--output-format`, and `--settings-json` for one-off overrides
- `--output path.mp3` to choose the output file
- `--dry-run` to print the resolved request payload without calling the text-to-speech endpoint
- `--list-voices` to list matching ElevenLabs voices without generating audio

## API Notes

Use the current ElevenLabs endpoints:

- Voice search: `GET https://api.elevenlabs.io/v2/voices`
- Speech generation: `POST https://api.elevenlabs.io/v1/text-to-speech/:voice_id?output_format=...`

Send the API key as `xi-api-key`.
