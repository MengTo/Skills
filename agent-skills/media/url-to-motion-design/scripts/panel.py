#!/usr/bin/env python3
"""A blind panel: two fresh judges score scenes from their sheets, with anchors they can't tell apart.

  python3 panel.py setup <runDir> <tag> <id,id,…>   copies <runDir>/out/<id>.jpg (+ -final.jpg) and the two anchors into
                                                    <runDir>/judges/<tag>/images/scene-NN*, shuffled; writes lengths.txt,
                                                    JUDGE.md and <runDir>/judges/<tag>-map.json (who is who).
  python3 panel.py tally <runDir> <tag>             reads judges/<tag>/judge1.jsonl + judge2.jsonl, writes judges/<tag>-results.json,
                                                    appends every verdict to <runDir>/state.json and prints a table (lower score counts).

Then launch two fresh general-purpose agents, each told only: read <judgeDir>/JUDGE.md, look at every sheet in images/
with the Read tool, lengths in lengths.txt, write JSON lines to <judgeDir>/judge1.jsonl (or judge2.jsonl), read nothing else.
"""
import json, os, random, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.join(os.path.dirname(HERE), 'lab')
ANCHORS = [('prompt-box', 'pass8'), ('ruled-lines', 'low')]  # an old 8, 8 scene (now judged 7ish) and a known 6

def length(path):
    m = re.search(r'name="fil:duration"\s+content="([\d.]+)"', open(path).read())
    return float(m.group(1)) if m else 5.0

def setup(run, tag, ids):
    d = os.path.join(run, 'judges', tag); shutil.rmtree(d, ignore_errors=True); os.makedirs(os.path.join(d, 'images'))
    items = [(x, None, os.path.join(run, 'out', x), length(os.path.join(run, 'scenes', x + '.html'))) for x in ids]
    items += [(a, w, os.path.join(LAB, 'anchors', a), 5.0) for a, w in ANCHORS]
    random.Random('panel-' + tag).shuffle(items)
    m, L = {}, []
    for k, (x, w, src, n) in enumerate(items, 1):
        nn = f'{k:02d}'; m[nn] = {'id': x, 'anchor': w is not None, 'which': w, 'length': n}
        shutil.copy(src + '.jpg', f'{d}/images/scene-{nn}.jpg'); shutil.copy(src + '-final.jpg', f'{d}/images/scene-{nn}-final.jpg')
        L.append(f'scene-{nn}: {n:g} s')
    open(f'{d}/lengths.txt', 'w').write('\n'.join(L) + '\n')
    shutil.copy(os.path.join(os.path.dirname(HERE), 'references', 'judge.md'), f'{d}/JUDGE.md')
    json.dump(m, open(os.path.join(run, 'judges', f'{tag}-map.json'), 'w'), indent=1)
    print(len(items), 'sheets in', d)

def tally(run, tag):
    m = json.load(open(os.path.join(run, 'judges', f'{tag}-map.json'))); res = {}
    for j in ('judge1', 'judge2'):
        for line in open(os.path.join(run, 'judges', tag, f'{j}.jsonl')):
            line = line.strip()
            if not line: continue
            o = json.loads(line); it = m[o['scene']]; k = it['id'] + ('#' + it['which'] if it['anchor'] else '')
            r = res.setdefault(k, {'scores': [], 'anchor': it['anchor'], 'notes': []})
            r['scores'].append(o['score']); r['notes'].append({'score': o['score'], 'good': o['good'], 'weak': o['weak']})
    for r in res.values(): r['low'] = min(r['scores'])
    json.dump(res, open(os.path.join(run, 'judges', f'{tag}-results.json'), 'w'), indent=1)
    sp = os.path.join(run, 'state.json'); st = json.load(open(sp)) if os.path.exists(sp) else {}
    for k, r in res.items():
        if not r['anchor']: st.setdefault(k, []).append({'panel': tag, 'scores': r['scores'], 'notes': r['notes']})
    json.dump(st, open(sp, 'w'), indent=1)
    for k, r in sorted(res.items(), key=lambda x: (x[1]['anchor'], -x[1]['low'], x[0])):
        for n in r['notes']:
            print(f"{'ANCHOR ' if r['anchor'] else ''}{k:22s} {n['score']} | good: {n['good']} | weak: {n['weak']}")
    print('passed (8, 8):', [k for k, r in res.items() if not r['anchor'] and r['low'] >= 8])

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['setup'] and len(a) == 4: setup(os.path.abspath(a[1]), a[2], a[3].split(','))
    elif a[:1] == ['tally'] and len(a) == 3: tally(os.path.abspath(a[1]), a[2])
    else: print(__doc__); sys.exit(1)
