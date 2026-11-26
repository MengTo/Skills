#!/bin/bash
# measure_drafts.sh DIR K1 K2 ...
# Fetch and measure talking-clip drafts. Reads DIR/K.json (from `higgsfield generate create … --json`) or uses DIR/K.mp4 if
# it's already there. Makes K.wav (16 kHz), K.csv (speakstats at 15 fps), K-sheet.jpg (10 frames), K.whisper.txt, and
# prints what was said plus the mouth/head summary. Compare against your own numbers (speaking.md).
# Needs: ffmpeg, whisper-cli + a model (WHISPER_MODEL, default the large-v3-turbo q5 in ~/Library/Caches/whisper.cpp),
# speakstats compiled next to this script (swiftc -O speakstats.swift -o speakstats), python3 with numpy.
H=$(cd "$(dirname "$0")" && pwd)
M=${WHISPER_MODEL:-$HOME/Library/Caches/whisper.cpp/ggml-large-v3-turbo-q5_0.bin}
[ -x "$H/speakstats" ] || swiftc -O "$H/speakstats.swift" -o "$H/speakstats"
cd "$1"; shift
for k in "$@"; do
  if [ ! -s "$k.mp4" ]; then
    u=$(grep -o '"result_url": "[^"]*"' "$k.json" 2>/dev/null | head -1 | sed 's/.*: "//; s/"$//')
    [ -z "$u" ] && { echo "$k: no result"; continue; }
    curl -sfL "$u" -o "$k.mp4"
  fi
  ffmpeg -loglevel error -y -i "$k.mp4" -ac 1 -ar 16000 "$k.wav"
  "$H/speakstats" "$k.mp4" 0 5 15 > "$k.csv" 2>/dev/null
  ffmpeg -loglevel error -y -i "$k.mp4" -vf "fps=2,scale=400:-2,tile=5x2" -frames:v 1 -q:v 3 "$k-sheet.jpg"
  whisper-cli -m "$M" -f "$k.wav" -nt -np 2>/dev/null | tr -s ' \n' ' ' > "$k.whisper.txt"
  echo "$k: $(cat "$k.whisper.txt")"
done
python3 "$H/speaksummary.py" $(for k in "$@"; do echo "$k.csv"; done)
