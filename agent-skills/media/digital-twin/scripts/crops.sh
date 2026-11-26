#!/bin/bash
# crops.sh FACES.txt OUT_DIR [SIZE]
# Tight square face crops (head and a little shoulder, no lav mic) from full frames, using faces.swift output:
#   swift faces.swift frames/*.jpg > faces.txt     # "file x y w h conf yaw roll", pixels, top-left origin
#   ./crops.sh faces.txt refs/all 1024
# The crop is 2.7 face widths, centred a quarter face height below the face centre, clamped to the frame.
set -euo pipefail
F=$1; OUT=$2; SZ=${3:-1024}; mkdir -p "$OUT"
while read -r path x y w h conf yaw roll; do
  [ "$x" = "none" ] && continue
  read -r W H < <(sips -g pixelWidth -g pixelHeight "$path" | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w, h}')
  read -r s ox oy < <(python3 -c "
w,h,x,y,W,H=$w,$h,$x,$y,$W,$H
s=int(min(W,H,w*2.7)); cx=x+w/2; cy=y+h/2+h*0.25
print(s, int(max(0,min(W-s,cx-s/2))), int(max(0,min(H-s,cy-s/2))))")
  ffmpeg -loglevel error -y -i "$path" -vf "crop=$s:$s:$ox:$oy,scale=$SZ:$SZ" -q:v 2 "$OUT/$(basename "${path%.*}").jpg"
done < "$F"
ls "$OUT" | wc -l | xargs echo "crops in $OUT:"
