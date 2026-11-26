#!/bin/bash
# el.sh METHOD PATH [curl args...]
# Call api.elevenlabs.io with your key. The key is read from $ELEVENLABS_ENV, else ./.env (a line ELEVENLABS_API_KEY=…),
# else the environment. It is never printed. Keep the .env chmod 600 and out of git.
#   ./el.sh GET /v1/user/subscription
#   ./el.sh POST /v1/voices/add -F name="My Voice Instant" -F files=@ivc-1.mp3 -F files=@ivc-2.mp3
ENVF=${ELEVENLABS_ENV:-./.env}
if [ -f "$ENVF" ]; then set -a; eval "$(grep '^ELEVENLABS_API_KEY=' "$ENVF" | tr -d '\r')"; set +a; fi
[ -z "${ELEVENLABS_API_KEY:-}" ] && { echo "no ELEVENLABS_API_KEY (set ELEVENLABS_ENV or put it in ./.env)" >&2; exit 1; }
m=$1; p=$2; shift 2
curl -sS -X "$m" -H "xi-api-key: $ELEVENLABS_API_KEY" "https://api.elevenlabs.io$p" "$@"
