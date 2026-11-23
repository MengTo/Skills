#!/bin/bash
# A section's background: a vertical 1080 x 1920, 60 fps crop of a landscape recording, at the section's length.
#   ./base.sh SOURCE START_SECONDS FRAMES NAME [X 0..1, default .5] [HEIGHT, default 1920]
# X is where the crop sits across the source (0 left, 1 right). HEIGHT over 1920 pushes in (2300 is 20% closer),
# which is how something in the way (a HUD, a weapon, a light under the headline) is put out of frame.
# Use fresh footage at its real speed: slowing a clip with frame interpolation is far slower and smears.
src="$1"; ss="$2"; n="$3"; name="$4"; x="${5:-.5}"; h="${6:-1920}"
ffmpeg -nostdin -v error -y -ss "$ss" -i "$src" -frames:v "$n" -an \
  -vf "scale=-2:$h:flags=lanczos,crop=1080:1920:(iw-1080)*$x:0,setsar=1" -r 60 \
  -c:v libx264 -preset fast -crf 14 -g 60 -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  "base-$name.mp4" && echo "base-$name.mp4, $n frames"
