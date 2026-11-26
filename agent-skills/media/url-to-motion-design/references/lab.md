# Running the lab

The lab draws scenes exactly as Fil's video editor does: `lab/server.mjs` imports Fil's own `sceneRuntime`, `scene.js` (customize) and
`sceneFonts.js` from the repo, and a runner page (`lab/runner.html`) in the in-app browser takes jobs, loads each scene in a sandboxed
iframe with Fil's runtime, seeks it frame by frame and posts JPEGs back. Many builders share one runner; nobody launches a browser.

## Start it
Add a config to the project's `.claude/launch.json` once (the lab needs the facet-studio repo for the runtime):
```json
{ "name": "url-motion-lab", "runtimeExecutable": "node",
  "runtimeArgs": ["/Users/mengto/.claude/skills/url-to-motion-design/lab/server.mjs", "5212"], "port": 5212 }
```
then `preview_start {name: "url-motion-lab"}` (opens the runner tab at localhost:5212). A hidden pane gives a new tab a 0×0 viewport
and no animation frames, so the first render times out: right away `resize_window` the runner tab to 1440×900, `navigate` it to
`http://localhost:5212/` again and take one small screenshot. Check: `curl -s localhost:5212/status`.
Smoke test: `node scripts/render.mjs <any scene.html> <tmp>/smoke`. Use the in-app browser only: never Chrome, Chrome for Testing or a
Playwright browser from Bash (the owner's rule).

## Keep it awake (the hidden-pane trap)
When the session isn't open in a window, the pane is hidden and its page freezes every 1 to 3 minutes while you're idle: timers in the
top page stop too, so nothing inside it can save itself. `show_pane` does nothing then. Symptoms: `queued` or `running` > 0 and no new
frames. What works:
- `runner.html` gives up on a frame after 45 s (load 60 s), so one stuck frame can't hold a worker forever.
- Any `javascript_tool` call on the runner tab unfreezes it at once.
- While you wait on helpers, a `browser_batch` of 11 × (`computer wait 10` + `javascript_tool "1"`) keeps it alive for ~4 minutes and
  still lets helper reports reach you between batches.
- While you're idle, a background watchdog wakes you; when it exits, poke the tab and restart it:
```bash
while true; do s=$(curl -s -m 5 localhost:5212/status); read busy seen <<<"$(echo "$s" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['queued']+d['running'], d['runnerSeenAgo'])" 2>/dev/null || echo '1 999999')"; now=$(date +%s); newest=$(find <run>/out -name 'f*.jpg' -mmin -30 -exec stat -f %m {} + 2>/dev/null | sort -n | tail -1); age=$((now-${newest:-0})); if [ "$busy" -gt 0 ] && [ "$age" -gt 45 ] && [ "$seen" -gt 20000 ]; then echo "STALLED $(date +%T) frame age ${age}s $s"; exit 0; fi; sleep 6; done
```
  (`runnerSeenAgo` alone false-alarms: three busy workers on long jobs don't call /next. Frame age alone false-alarms on a job the server
  is about to requeue. Use both.)
- If a poke doesn't help, `navigate` the tab to the runner URL again and take a screenshot.
- Stop the server when the run is over (`preview_stop`).

## Render facts
- 1280×720, ~1.5 s per frame per worker, 3 workers. A 12-frame sheet takes 20 to 60 s. The server requeues a job after 150 s, so video
  renders go in 40-frame chunks (scripts/video.mjs does).
- A blank or half-laid-out frame from the hidden pane is the renderer's: render again. `scripts/panel.py` doesn't check; look at sheets.
- A sandboxed cross-origin frame is throttled when hidden: the runner uses `allow-scripts allow-same-origin` and a Worker-driven timer
  shim; don't change those.
