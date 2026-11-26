#!/bin/bash
# run_round.sh ROUND_DIR START_NUMBER "label" [LEDGER_FILE]
# Run a round built by make_round.py (ROUND_DIR/prompts/*.txt + .refs) on Higgsfield Seedream 5 Pro (~2.5 credits each),
# append the spend to LEDGER_FILE (default ROUND_DIR/../credits.txt), and make a numbered sheet to pick from.
# Keys start with their number, so file order = sheet order.
set -u
R=$1; START=$2; LABEL=$3; LED=${4:-$R/../credits.txt}; H=$(cd "$(dirname "$0")" && pwd)
bash "$H/hf_seedream_batch.sh" "$R/prompts" "$R/out" > "$R/run.log" 2>&1
cat "$R/run.log"
ok=$(grep -c '^ok' "$R/run.log")
echo "$(date '+%Y-%m-%d %H:%M') · $LABEL · $ok Seedream 5 Pro stills on Higgsfield · $(python3 -c "print($ok*2.5)") credits" >> "$LED"
tail -1 "$LED"
cd "$R/out" && START=$START python3 "$H/numbered_sheet.py" ../sheet.jpg 3 $(ls *.jpg | sort)
