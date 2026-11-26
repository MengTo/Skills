#!/usr/bin/env bash
# Joins your takes into one clip to train a twin from: 1080p at most, 30 fps,
# H.264 at CRF 19 with AAC sound, so two or three minutes stays well under the
# 200 MB a direct upload takes. Takes of different sizes are scaled and padded
# to the first one's shape. Run it on local copies: download a take once and
# work from that file.
#
#   bash scripts/prep-footage.sh footage.mp4 take-1.mp4 take-2.mp4 take-3.mp4

set -euo pipefail
out="${1:-}"
shift || true
if [ -z "$out" ] || [ $# -lt 1 ]; then
  echo "Usage: bash scripts/prep-footage.sh <out.mp4> <take.mp4> [take.mp4 …]" >&2
  exit 1
fi
size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$1")
w=${size%x*}
h=${size#*x}
# The long edge at most 1920.
if [ "$w" -ge "$h" ] && [ "$w" -gt 1920 ]; then h=$((h * 1920 / w / 2 * 2)); w=1920; fi
if [ "$h" -gt "$w" ] && [ "$h" -gt 1920 ]; then w=$((w * 1920 / h / 2 * 2)); h=1920; fi
inputs=()
filter=""
joined=""
i=0
for f in "$@"; do
  inputs+=(-i "$f")
  filter+="[$i:v]scale=$w:$h:force_original_aspect_ratio=decrease,pad=$w:$h:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v$i];[$i:a]aresample=48000[a$i];"
  joined+="[v$i][a$i]"
  i=$((i + 1))
done
ffmpeg -v error -y "${inputs[@]}" -filter_complex "${filter}${joined}concat=n=$i:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 19 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$out"
secs=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")
mb=$(($(wc -c <"$out") / 1000000))
echo "$out: ${w}x${h}, ${secs%.*} s, ${mb} MB"
if [ "${secs%.*}" -lt 15 ] || [ "${secs%.*}" -gt 600 ]; then
  echo "HeyGen trains from 15 to 600 seconds: about 2 minutes is best." >&2
fi
