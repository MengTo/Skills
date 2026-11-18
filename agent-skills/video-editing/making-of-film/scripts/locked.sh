#!/bin/zsh
# Runs one command under a shared GPU lock: waits for the lock, takes it, runs, releases it even on failure.
# A lock folder older than 10 minutes is stale and removed. Every render, capture and still that drives a GPU
# browser goes through it, so two threads never time frames or render on the same GPU at once.
#   locked.sh <command…>        env GPU_LOCK: the lock folder every rendering thread on this machine shares
# A killed render leaves the lock behind for 10 minutes: check no `node render.mjs` of yours runs, then rmdir it.
L=${GPU_LOCK:-$HOME/Library/Caches/making-of-film/.gpu-lock}
mkdir -p ${L:h}
while ! mkdir $L 2>/dev/null; do
  if [[ -n $(find $L -maxdepth 0 -mmin +10 2>/dev/null) ]]; then rmdir $L 2>/dev/null; continue; fi
  sleep 3
done
trap 'rmdir $L 2>/dev/null' EXIT INT TERM
"$@"
