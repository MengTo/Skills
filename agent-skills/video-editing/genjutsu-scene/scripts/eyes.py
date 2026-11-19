#!/usr/bin/python3
# Eye openness (eye-box height / width, both eyes) and brow raise (eye centre to brow, / inter-ocular) per frame.
# Two uses:
#  1. Choosing or fixing a drive: run it on the twin camera's dump and look for brow raises and big gestures near the end of
#     the window. Genjutsu turns a mild brow lift (brow 0.43-0.45 vs ~0.40 at rest) into a startled, wide-eyed face.
#  2. Checking a result's ending: --tail S reports the last S seconds against the clip's median.
# usage: eyes.py dump.jsonl [--fps F] [--from A --to B] [--every N] [--tail S]
import sys, json, argparse, numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('dump'); ap.add_argument('--fps', type=float, default=24)
ap.add_argument('--from', dest='a', type=int, default=0); ap.add_argument('--to', dest='b', type=int)
ap.add_argument('--every', type=int, default=0); ap.add_argument('--tail', type=float)
a = ap.parse_args()
rows = [json.loads(l) for l in open(a.dump)]
def feat(r):
    if not r.get('face'): return (np.nan, np.nan)
    P = r['face']['pts']; le, re = np.array(P['leftEye']), np.array(P['rightEye'])
    iod = np.hypot(*(re.mean(0) - le.mean(0)))
    op = np.mean([(e[:, 1].max() - e[:, 1].min()) / (e[:, 0].max() - e[:, 0].min()) for e in (le, re)])
    lb, rb = np.array(P.get('leftBrow', P['leftEye'])), np.array(P.get('rightBrow', P['rightEye']))
    brow = np.mean([(e[:, 1].mean() - b[:, 1].mean()) / iod for e, b in ((le, lb), (re, rb))])
    return op, brow
F = np.array([feat(r) for r in rows])
print('openness median %.3f p90 %.3f; brow median %.3f p90 %.3f; n %d' % (np.nanmedian(F[:, 0]), np.nanpercentile(F[:, 0], 90),
      np.nanmedian(F[:, 1]), np.nanpercentile(F[:, 1], 90), len(F)))
if a.every:
    for k in range(a.a, a.b or len(F), a.every): print('%4d  t %.2f  open %.3f  brow %.3f' % (k, k / a.fps, F[k, 0], F[k, 1]))
if a.tail:
    k = int(len(F) - a.tail * a.fps)
    print('last %.1f s: openness mean %.3f max %.3f; brow mean %.3f max %.3f' % (a.tail, np.nanmean(F[k:, 0]), np.nanmax(F[k:, 0]),
          np.nanmean(F[k:, 1]), np.nanmax(F[k:, 1])))
