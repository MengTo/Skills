#!/bin/zsh
# Renders a film's scenes one at a time at 3840 × 2160, 60 fps (the 1920 × 1080 stage at 2×), one MP4 per scene,
# each under the GPU lock, so other threads' captures fit between them. About 70 minutes for 30 scenes at 4K60.
#   render-scenes.sh <film.html> <out folder> <scene,scene,…|all> [extra render.mjs args, e.g. --camera on]
# Scene ids are the <section class="x-scene" id="…"> of film.html, in order. Run it niced, in the background.
H=${0:A:h}
FILM=${1:A}; OUT=${2:A}; LIST=$3; shift 3
if [[ $LIST == all ]]; then LIST=$(node -e "const s=require('fs').readFileSync(process.argv[1],'utf8');console.log([...s.matchAll(/<section class=\"x-scene\" id=\"([^\"]+)\"/g)].map(m=>m[1]).join(','))" $FILM); fi
for id in ${(s:,:)LIST}; do
  $H/locked.sh nice -n 10 node $H/render.mjs $FILM --scene $id --fps 60 --scale 2 --out $OUT "$@" || echo "FAILED $id"
done
echo ALL_DONE
