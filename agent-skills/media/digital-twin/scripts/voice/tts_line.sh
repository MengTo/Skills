#!/bin/bash
# tts_line.sh VOICE_ID "TEXT" OUT.mp3 [MODEL] [TAG]
# One line in your cloned voice. Default model eleven_v4 with "[calm] " in front: on one creator's instant clone, v4
# alone matched the timbre but spoke ~30 Hz above his range, and [calm] brought it back (9.2/10 vs 8.7 for his old Pro
# voice). Pass TAG "" to send the text as is, or another tag ("[calm, deep voice]"). Measure the result with
# score_voice.py; tags vary per voice. Settings: stability 0.5, similarity 0.95, style 0, speaker boost.
set -euo pipefail
[ $# -lt 3 ] && { sed -n '2,6p' "$0"; exit 1; }
V=$1; TEXT=$2; OUT=$3; M=${4:-eleven_v4}; TAG=${5-"[calm]"}
case "$TEXT" in \[*) ;; *) [ -n "$TAG" ] && TEXT="$TAG $TEXT";; esac
BODY=$(python3 -c 'import json,sys; print(json.dumps({"text":sys.argv[1],"model_id":sys.argv[2],"voice_settings":{"stability":0.5,"similarity_boost":0.95,"style":0.0,"use_speaker_boost":True}}))' "$TEXT" "$M")
code=$("$(dirname "$0")/el.sh" POST "/v1/text-to-speech/$V?output_format=mp3_44100_192" -H "Content-Type: application/json" -d "$BODY" -o "$OUT" -w "%{http_code}")
[ "$code" = 200 ] || { echo "ElevenLabs answered $code:"; head -c 400 "$OUT"; echo; exit 1; }
echo "$OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s)"
