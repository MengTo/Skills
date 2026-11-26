#!/bin/zsh
# Post: the lip-synced clip -> 3840x2160 60 fps H.264 (~29 Mbps), Lanczos upscale + light unsharp, one grain pass over the
# whole frame, 60 fps by frame repetition (no interpolation: interpolation smears hands), the FILM's audio for the same
# window under it (not the clip's own audio). Writes OUTBASE-clean.mp4 and OUTBASE-labelled.mp4 and prints their specs.
# usage: post.sh IN.mp4 OUTBASE "label text" FILM_AUDIO_LINE.m4a
#   FILM_AUDIO_LINE: the film's mix cut to the clip's window, e.g.
#   ffmpeg -ss 19.25 -t 6.4 -i film-mix.m4a -c:a aac -b:a 320k line-film.m4a
IN=$1; OUT=$2; LBL=$3; A=$4
[ -f "$A" ] || { echo "film audio line not found: $A"; exit 1; }
FONT=/System/Library/Fonts/Supplemental/Arial.ttf   # a font FILE: "-font Helvetica" fails in this ImageMagick
VF="scale=3840:2160:flags=lanczos,unsharp=5:5:0.35:5:5:0,noise=c0s=7:c0f=t+u:c1s=3:c1f=t+u:c2s=3:c2f=t+u,fps=60,format=yuv420p"
ffmpeg -v error -y -i "$IN" -i "$A" -map 0:v -map 1:a -vf "$VF" -c:v libx264 -preset slow -b:v 30M -maxrate 40M -bufsize 60M \
  -profile:v high -c:a aac -b:a 320k -shortest -movflags +faststart "${OUT}-clean.mp4" || exit 1
magick -size 3840x2160 xc:none -font $FONT -pointsize 54 -fill 'rgba(0,0,0,0.55)' \
  -draw "roundrectangle 60,60 $((60 + 40 + ${#LBL} * 28)),150 18,18" -fill white -annotate +90+124 "$LBL" "${OUT}-label.png" || exit 1
ffmpeg -v error -y -i "${OUT}-clean.mp4" -i "${OUT}-label.png" -filter_complex "[0:v][1:v]overlay=0:0,format=yuv420p" \
  -c:v libx264 -preset slow -b:v 30M -maxrate 40M -bufsize 60M -profile:v high -c:a copy -movflags +faststart "${OUT}-labelled.mp4" || exit 1
rm -f "${OUT}-label.png"
for f in "${OUT}-clean.mp4" "${OUT}-labelled.mp4"; do
  echo "$f"; ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,bit_rate:format=duration -of compact=p=0 "$f"
done
