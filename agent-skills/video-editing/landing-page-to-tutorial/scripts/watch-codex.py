#!/usr/bin/env python3
"""Watch today's Codex session files for builds. Prints one line per event:
started (a thread whose first prompt matches BUILD_LINE) and finished (task_complete), with times.
Read-only. Also keeps build/codex-runs.json up to date for the film's numbers."""
import glob, json, os, re, sys, time

DAY = time.strftime('%Y/%m/%d')
ROOT = os.path.expanduser('~/.codex/sessions')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'codex-runs.json')
seen = {}
try:
    seen = json.load(open(OUT))
except Exception:
    pass

def scan(path):
    demo = None; started = None; done = None; turns = 0; cwd = None
    for line in open(path, errors='ignore'):
        if demo is None:
            m = re.search(os.environ.get('BUILD_LINE', r'/build/([A-Za-z0-9_]+)\.md'), line)
            if m: demo = m.group(1)
        try:
            o = json.loads(line)
        except Exception:
            continue
        p = o.get('payload') if isinstance(o.get('payload'), dict) else {}
        if o.get('type') == 'session_meta':
            cwd = p.get('cwd') or cwd
        if p.get('type') == 'task_started':
            turns += 1
            started = started or o.get('timestamp')
        if p.get('type') == 'task_complete':
            done = o.get('timestamp')
    return demo, started, done, turns, cwd

end = time.time() + float(sys.argv[1] if len(sys.argv) > 1 else 1700)
while time.time() < end:
    for path in glob.glob(os.path.join(ROOT, DAY, 'rollout-*.jsonl')) + glob.glob(os.path.join(ROOT, time.strftime('%Y/%m/%d', time.localtime(time.time() - 86400)), 'rollout-*.jsonl')):
        if os.path.getmtime(path) < time.time() - 6 * 3600:
            continue
        demo, started, done, turns, cwd = scan(path)
        if not demo:
            continue
        key = os.path.basename(path)
        prev = seen.get(key, {})
        cur = {'demo': demo, 'started': started, 'last_complete': done, 'turns': turns, 'cwd': cwd, 'file': path}
        if not prev:
            print(f'started {demo} at {started} in {cwd} ({key})', flush=True)
        elif done and done != prev.get('last_complete'):
            print(f'finished turn {turns} of {demo} at {done}', flush=True)
        seen[key] = cur
        json.dump(seen, open(OUT, 'w'), indent=1)
    time.sleep(15)
print('watch ended', flush=True)
