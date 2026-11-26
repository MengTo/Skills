#!/usr/bin/env python3
"""Build a round of stills: one prompt file and one reference list per shot, from the 4-part prompt stack.
usage: make_round.py SPEC.json OUT_DIR
SPEC.json:
{
  "identity":  "identity.txt",     # your identity block (who you are; references only for who you are)
  "workspace": "workspace.txt",    # the shared scene: your real room, the round's look (one per round)
  "finish":    "finish.txt",       # your gear, wardrobe, lens look, grade, "no light stands", "no text" (always last)
  "refs": {                        # face references per angle, in order (lean set first; real frames at that angle)
    "past":  ["refs/G1.jpg", "refs/N1.jpg", "..."],
    "front": ["refs/F1.jpg", "refs/F2.jpg", "refs/F3.jpg", "refs/G1.jpg", "..."],
    "side":  ["refs/S1.jpg", "..."],
    "wide":  ["refs/full1.jpg", "..."]
  },
  "room": ["room/full.jpg", "room/desk.jpg", "room/window.jpg"],   # appended LAST to every list
  "shots": [
    {"key": "01-desk-50mm", "angle": "past",
     "shot": "Time: late afternoon. Camera: a 50mm lens at f/1.8 on the desk beside the monitor, at eye level about two metres away, looking back across the room: a medium shot from the waist up, head three-quarters toward camera right, looking just past the lens, hands up in a relaxed gesture."}
  ]
}
Writes OUT_DIR/<key>.txt (identity, workspace, shot, finish joined by blank lines) and OUT_DIR/<key>.refs (one path per
line, at most 10). Warns when a prompt passes 4,000 characters (Fil's Seedream limit for all prompts joined).
Run the round with hf_seedream_batch.sh / run_round.sh, or paste the four parts into four Fil prompt nodes."""
import json, os, sys
spec = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
base = os.path.dirname(os.path.abspath(sys.argv[1]))
def text(k):
    p = spec.get(k)
    if not p: return ''
    p = p if os.path.isabs(p) else os.path.join(base, p)
    return open(p).read().strip()
ident, work, fin = text('identity'), text('workspace'), text('finish')
assert ident, 'SPEC needs an identity file'
room = spec.get('room', [])
for s in spec['shots']:
    refs = spec['refs'][s.get('angle', 'past')] + room
    if len(refs) > 10:
        print(f'{s["key"]}: {len(refs)} refs, keeping the first {10 - len(room)} face refs + the room'); refs = spec['refs'][s.get('angle', 'past')][:10 - len(room)] + room
    txt = '\n\n'.join(x for x in (ident, work, s['shot'].strip(), fin) if x)
    open(f'{out}/{s["key"]}.txt', 'w').write(txt + '\n')
    open(f'{out}/{s["key"]}.refs', 'w').write('\n'.join(refs) + '\n')
    warn = '  ⚠ over 4,000: trim the identity or workspace for Fil' if len(txt) > 4000 else ''
    print(f'{s["key"]}: {len(txt)} characters, {len(refs)} refs{warn}')
print(len(spec['shots']), 'shots in', out)
