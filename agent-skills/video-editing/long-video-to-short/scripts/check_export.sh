#!/bin/bash
# The checks every export gets, on the rendered file: ./check_export.sh short.mp4 [max MB, default 30]
# Size, length, frame size and rate, bt709 tags, loudness and true peak, every silence over a second, and (with
# whisper-cli and WHISPER_MODEL) its transcript, to read word for word against the script.
f="$1"; max="${2:-30}"
ffprobe -v error -select_streams v -show_entries stream=width,height,r_frame_rate,color_transfer,color_primaries,color_space,pix_fmt:format=duration,size -of default=nw=1 "$f"
mb=$(ffprobe -v error -show_entries format=size -of csv=p=0 "$f" | awk '{printf "%.1f", $1/1048576}')
echo "size: $mb MB (limit $max)"; awk "BEGIN{exit !($mb >= $max)}" && echo "FAIL: over $max MB"
[ "$(ffprobe -v error -select_streams v -show_entries stream=color_transfer -of csv=p=0 "$f")" = bt709 ] || echo "FAIL: not tagged bt709 (plays dark or washed out on YouTube)"
ffmpeg -nostdin -hide_banner -i "$f" -af ebur128=peak=true -f null - 2>&1 | awk '/Summary/{s=1} s&&/I:|Peak:/{print "loudness:",$0}'
echo "silences over 1 s (only the end hold should be here):"
ffmpeg -nostdin -hide_banner -i "$f" -af silencedetect=n=-45dB:d=1 -f null - 2>&1 | grep silence_ || echo "  none"
if command -v whisper-cli >/dev/null && [ -n "$WHISPER_MODEL" ]; then
  t=$(mktemp -d); ffmpeg -nostdin -v error -i "$f" -vn -ac 1 -ar 16000 "$t/a.wav"
  echo "transcript:"; whisper-cli -m "$WHISPER_MODEL" -f "$t/a.wav" -np -nt 2>/dev/null
fi
