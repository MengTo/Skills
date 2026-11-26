#!/usr/bin/env bash
# Puts the mouth of each render beside your real one: six close-ups a row,
# one row for each render, your real footage last. Likeness breaks at the
# mouth first, and it's hard to see in a whole frame. Look at lip width, how
# much teeth show, lip colour and the corners.
#
#   bash scripts/mouths.sh mouths.jpg footage.mp4 twin-avatar_v.mp4 twin-avatar_iv.mp4
#
#   CROP=w:h:x:y   the box around nose to chin on a 1920×1080 frame (frames are
#                  scaled to 1920 wide first); default 420:300:750:380. Check one
#                  frame and move it: the face sits differently in every take.
#   TIMES="1.0 2.3 3.6 4.9 6.2 7.5"   seconds into each render
#   REAL="10 20 30 40 50 60"          seconds into your footage

set -euo pipefail
out="${1:-}"
real="${2:-}"
shift 2 || true
if [ -z "$out" ] || [ -z "$real" ] || [ $# -lt 1 ]; then
  echo "Usage: bash scripts/mouths.sh <out.jpg> <your footage.mp4> <render.mp4> [render.mp4 …]" >&2
  exit 1
fi
crop="${CROP:-420:300:750:380}"
times="${TIMES:-1.0 2.3 3.6 4.9 6.2 7.5}"
reals="${REAL:-10 20 30 40 50 60}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# One row: six close-ups of one video, side by side.
row() {
  local video="$1" name="$2" at n=0
  local inputs=()
  shift 2
  for at in "$@"; do
    ffmpeg -v error -y -ss "$at" -i "$video" -frames:v 1 -vf "scale=1920:-2,crop=$crop" "$tmp/$name-$n.png"
    inputs+=(-i "$tmp/$name-$n.png")
    n=$((n + 1))
  done
  ffmpeg -v error -y "${inputs[@]}" -filter_complex "hstack=$n" "$tmp/row-$name.png"
}

rows=()
i=0
for render in "$@"; do
  # shellcheck disable=SC2086
  row "$render" "r$i" $times
  rows+=(-i "$tmp/row-r$i.png")
  echo "row $((i + 1)): $render"
  i=$((i + 1))
done
# shellcheck disable=SC2086
row "$real" real $reals
rows+=(-i "$tmp/row-real.png")
echo "row $((i + 1)): $real (you)"
ffmpeg -v error -y "${rows[@]}" -filter_complex "vstack=$((i + 1))" -q:v 2 "$out"
echo "$out"
