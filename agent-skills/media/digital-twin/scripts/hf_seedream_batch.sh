#!/bin/bash
# hf_seedream_batch.sh PROMPT_DIR OUT_DIR [REFS_FILE]
# Run Seedream 5 Pro on Higgsfield (`higgsfield` CLI, signed in) for every PROMPT_DIR/*.txt, 16:9 2k, at most 8 at a time.
# References: PROMPT_DIR/<key>.refs if it exists (one image path per line, max 10, in order: face refs first, room photos
# last), else REFS_FILE (same format). Writes OUT_DIR/<key>.json, .png and .jpg. ~2.5 Higgsfield credits per still.
set -u
P=$1; O=$2; DEF=${3:-}
mkdir -p "$O"
while pgrep -f "generate create seedream_v5_pro" >/dev/null; do sleep 10; done
run() {
  local f=$1 k; k=$(basename "$f" .txt)
  local A=(higgsfield generate create seedream_v5_pro --aspect_ratio 16:9 --resolution 2k --wait --wait-timeout 20m --json)
  local R="$P/$k.refs"; [ -f "$R" ] || R=$DEF
  [ -n "$R" ] && [ -f "$R" ] || { echo "FAIL $k: no .refs file and no REFS_FILE"; return; }
  while IFS= read -r r; do [ -n "$r" ] && A+=(--image-references "$r"); done < "$R"
  "${A[@]}" --prompt "$(cat "$f")" > "$O/$k.json" 2> "$O/$k.err"
  local u; u=$(grep -o '"result_url": *"[^"]*"' "$O/$k.json" | head -1 | sed 's/.*"\(http[^"]*\)"/\1/')
  if [ -n "$u" ]; then curl -sS -o "$O/$k.png" "$u" && sips -s format jpeg -s formatOptions 90 "$O/$k.png" --out "$O/$k.jpg" >/dev/null && echo "ok $k"
  else echo "FAIL $k: $(tail -2 "$O/$k.err")"; fi
}
n=0
for f in "$P"/*.txt; do
  run "$f" &
  n=$((n + 1)); if [ $((n % 8)) -eq 0 ]; then wait; fi
done
wait
