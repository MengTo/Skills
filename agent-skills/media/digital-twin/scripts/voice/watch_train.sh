#!/bin/bash
# watch_train.sh VOICE_ID [MODEL]
# Poll a Professional Voice Clone's fine-tuning every 5 min (up to 8 h). Prints changes, plus verification state
# (a PVC whose samples changed must be re-verified by its owner before it trains). Exits when MODEL (default
# eleven_v4) is fine_tuned or failed.
V=$1; MODEL=${2:-eleven_v4}; cd "$(dirname "$0")"; last=""
for i in $(seq 1 96); do
  s=$(./el.sh GET "/v1/voices/$V" | python3 -c "
import json,sys
m=sys.argv[1]
try: d=json.load(sys.stdin)
except Exception: print('api-error'); raise SystemExit
ft=d.get('fine_tuning') or {}; st=ft.get('state') or {}; pr=ft.get('progress') or {}
print('%s=%s %s | allowed=%s | verification failures=%d' % (m, st.get(m), pr.get(m), ft.get('is_allowed_to_fine_tune'), len(ft.get('verification_failures') or [])))" "$MODEL")
  [ "$s" != "$last" ] && echo "$(date +%H:%M) $s" && last="$s"
  case "$s" in *"$MODEL=fine_tuned"*|*"$MODEL=failed"*) exit 0;; esac
  sleep 300
done
echo "gave up after 8 h"
