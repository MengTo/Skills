#!/usr/bin/env python3
"""judge-pack.py <keyframes.tsv> <before dir> <after dir> <out dir> <seed> [01,04,...]

Blind X/Y pairs for two judges: for each key frame NN, the before and after 4K stills of the same spoken moment
are copied in as NN-X.jpg and NN-Y.jpg, which side is new decided by a seeded coin per frame. The key goes next to
the pack (<out dir>-key.tsv), never inside it, so a judge can't read it. NOTES.md (what the voice says at each key
frame, and any fact the judge must not mark down, such as a number that is correct) is copied in if it sits in
the keyframes file's folder.

keyframes.tsv: one line per key frame, tab-separated: name (starts with its two-digit number), time in film seconds.
Stills are named as render.mjs --stills writes them: t<time to 2 places, padded to 6>.jpg (t018.26.jpg), in both dirs.
Give each round a fresh seed and fresh judges; the lower of the two judges' scores counts.
"""
import sys, os, random, shutil

if len(sys.argv) < 6:
    print(__doc__); sys.exit(1)
kf, B, A, O, seed = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
only = sys.argv[6].split(',') if len(sys.argv) > 6 else None
rows = [l.rstrip('\n').split('\t') for l in open(kf) if l.strip() and not l.startswith('#')]
os.makedirs(O, exist_ok=True)
rnd = random.Random(seed)
key = []
for row in rows:
    name, t = row[0], float(row[-1])
    n = name[:2]
    if only and n not in only:
        continue
    still = f't{t:06.2f}.jpg'
    before, after = os.path.join(B, still), os.path.join(A, still)
    assert os.path.exists(before) and os.path.exists(after), (before, after)
    x_after = rnd.random() < 0.5
    shutil.copy(after if x_after else before, f'{O}/{n}-X.jpg')
    shutil.copy(before if x_after else after, f'{O}/{n}-Y.jpg')
    key.append(f'{n}\t{name}\t{t:.2f}\t' + ('X=after' if x_after else 'X=before'))
notes = os.path.join(os.path.dirname(os.path.abspath(kf)), 'NOTES.md')
if os.path.exists(notes):
    shutil.copy(notes, os.path.join(O, 'NOTES.md'))
open(O.rstrip('/') + '-key.tsv', 'w').write('\n'.join(key) + '\n')
print(len(key), 'pairs ->', O, '(key:', O.rstrip('/') + '-key.tsv)')
