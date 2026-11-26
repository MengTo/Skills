#!/bin/zsh
# The whole film locally, as Meng will watch it: the scene clips in film order, the voice, the cold open's own
# sound and a music bed, at −14 LUFS integrated, true peak under −2 dBTP, 48 kHz AAC, 3840 × 2160 60 fps HEVC.
# Made from the Greymourn tutorial's preview3.sh (its drafts 3–4g were built with it).
#   preview.sh <film.html> <scene clip folder> <voice> <out.mp4> <film end, s>
#   env  COLD=<the cold open's sound, from 0>   BED=<music bed>   BED_AT=9.4 (s, where the bed comes in)
#        BED_LO=0.16 (under the voice)  BED_HI=0.34  RISE=a,b (film seconds of a beat with no voice: the bed rises)
# The bed fades in over 1.2 s at BED_AT and out over the last 3 s. Two loudnorm passes (measure, then apply).
set -e
FILM=${1:A}; IN=${2:A}; VOICE=${3:A}; OUT=${4:A}; END=$5
[[ -n $END ]] || { echo 'preview.sh <film.html> <scene clip folder> <voice> <out.mp4> <film end, s>'; exit 1; }
LIST=$(mktemp -t mofilm).txt
node -e "const s=require('fs').readFileSync(process.argv[1],'utf8');console.log([...s.matchAll(/<section class=\"x-scene\" id=\"([^\"]+)\"/g)].map(m=>\"file '\"+process.argv[2]+'/'+m[1]+\".mp4'\").join('\n'))" $FILM $IN > $LIST
while read -r l; do f=${${l#file \'}%\'}; [[ -f $f ]] || { echo "missing clip: $f"; exit 1; }; done < $LIST

ins=(-i $VOICE); fc="[1:a]aresample=48000[v]"; lab="[v]"; k=2
if [[ -n $COLD ]]; then ins+=(-i ${COLD:A}); fc+=";[$k:a]volume=0.9,aresample=48000[c]"; lab+="[c]"; k=$((k+1)); fi
if [[ -n $BED ]]; then
  AT=${BED_AT:-9.4}; LO=${BED_LO:-0.16}; HI=${BED_HI:-0.34}; MS=$(python3 -c "print(int(float('$AT')*1000))")
  if [[ -n $RISE ]]; then A=${RISE%,*}; B=${RISE#*,}; VOL="volume='$LO+($HI-$LO)*(clip((t-($A))/0.8,0,1)-clip((t-($B)+0.6)/0.6,0,1))':eval=frame"; else VOL="volume=$LO"; fi
  ins+=(-i ${BED:A}); fc+=";[$k:a]aresample=48000,adelay=$MS|$MS,$VOL,afade=t=in:st=$AT:d=1.2,afade=t=out:st=$((END-3.0)):d=2.6[m]"; lab+="[m]"; k=$((k+1))
fi
n=$(( k - 1 ))
FC="$fc;${lab}amix=inputs=$n:normalize=0:duration=longest"
# pass 1: measure (the voice stands in for the picture so the input numbers hold)
M=$(ffmpeg -hide_banner -nostats -i $VOICE $ins -filter_complex "$FC,atrim=0:$END,loudnorm=I=-14:TP=-2:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
read II TP LRA TH OFF <<< "$(echo $M | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
# pass 2: the film (TP −2.6 so the AAC encode still lands under −2)
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i $LIST $ins \
  -filter_complex "$FC,atrim=0:$END,loudnorm=I=-14:TP=-2.6:LRA=11:measured_I=${II}:measured_TP=${TP}:measured_LRA=${LRA}:measured_thresh=${TH}:offset=${OFF}:linear=true,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v hevc_videotoolbox -b:v 48M -maxrate 64M -tag:v hvc1 -pix_fmt yuv420p -r 60 -c:a aac -b:a 256k -ar 48000 -t $END -movflags +faststart $OUT
rm -f $LIST
ffmpeg -hide_banner -nostats -i $OUT -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:|LRA:" | tail -3
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate,sample_rate -show_entries format=duration,bit_rate $OUT
echo PREVIEW_OK
