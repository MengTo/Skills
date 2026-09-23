#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <video-file> <output-dir>" >&2
  exit 64
fi

video_file=$1
output_dir=$2

if [[ ! -f "$video_file" ]]; then
  echo "Video file not found: $video_file" >&2
  exit 66
fi

for command_name in ffmpeg ffprobe awk; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 69
  fi
done

duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$video_file")

if [[ -z "$duration" ]] || ! awk -v duration="$duration" 'BEGIN { exit !(duration > 0) }'; then
  echo "Could not determine a positive video duration." >&2
  exit 65
fi

mkdir -p "$output_dir"

frame_count=12
start_ratio=0.06
end_ratio=0.66

for frame_index in $(seq 1 "$frame_count"); do
  timestamp=$(awk -v duration="$duration" -v start="$start_ratio" -v end="$end_ratio" -v idx="$frame_index" -v count="$frame_count" 'BEGIN {
    ratio = start + ((idx - 1) * (end - start) / (count - 1));
    printf "%.3f", duration * ratio;
  }')
  frame_path=$(printf "%s/frame-%02d.jpg" "$output_dir" "$frame_index")
  ffmpeg -hide_banner -loglevel error -y -ss "$timestamp" -i "$video_file" -frames:v 1 -vf "scale='min(1920,iw)':-2" -q:v 2 "$frame_path"
done

ffmpeg -hide_banner -loglevel error -y -framerate 1 -start_number 1 -i "$output_dir/frame-%02d.jpg" \
  -frames:v 1 -vf "scale=480:-2,tile=4x3:padding=8:margin=8:color=black" \
  "$output_dir/contact-sheet.jpg"

echo "Extracted $frame_count frames and contact sheet to: $output_dir"
