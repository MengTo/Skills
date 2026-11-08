#!/bin/bash
# extract_frames.sh OUT_DIR VIDEO... [-- EVERY_SECONDS]
# Pull candidate reference frames from your own talking-head recordings: one full-resolution JPEG every N seconds
# (default 10), named <video>-<seconds>.jpg. Then run faces.swift on them to get face boxes and head turn (yaw),
# and crops.sh to cut tight face crops.
set -euo pipefail
OUT=$1; shift; EVERY=10; VIDS=()
while [ $# -gt 0 ]; do [ "$1" = "--" ] && { EVERY=$2; break; }; VIDS+=("$1"); shift; done
mkdir -p "$OUT"
for v in "${VIDS[@]}"; do
  b=$(basename "${v%.*}"); d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v"); t=5
  while python3 -c "import sys; sys.exit(0 if $t < $d - 1 else 1)"; do
    ffmpeg -loglevel error -y -ss "$t" -i "$v" -frames:v 1 -q:v 2 "$OUT/$b-$t.jpg"; t=$((t + EVERY))
  done
done
ls "$OUT" | wc -l | xargs echo "frames in $OUT:"
