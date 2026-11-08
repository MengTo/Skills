#!/usr/bin/env python3
"""Summarise speakstats CSVs: how much the mouth opens and how often, blinks, head motion, brows.
usage: speaksummary.py file.csv...   (prints one row per file, then a mean row per folder)"""
import sys, os
import numpy as np

def load(p):
    rows = [l.strip().split(',') for l in open(p) if l.strip()][1:]
    rows = [r for r in rows if len(r) == 12 and r[1] != '']
    return np.array(rows, float) if rows else None

def peaks(x, thr, min_gap):
    """local maxima above thr, at least min_gap samples apart"""
    idx = [i for i in range(1, len(x) - 1) if x[i] >= x[i - 1] and x[i] > x[i + 1] and x[i] > thr]
    out = []
    for i in idx:
        if not out or i - out[-1] >= min_gap: out.append(i)
        elif x[i] > x[out[-1]]: out[-1] = i
    return out

cols = ['open p50', 'open p90', 'open>0.15 %', 'syll/s', 'blinks/min', 'yaw sd', 'roll sd', 'pitch sd', 'move sd', 'head speed', 'brow sd', 'mw p50']
res = {}
print(f"{'clip':22} {'n':>4} " + ' '.join(f'{c:>11}' for c in cols))
for p in sys.argv[1:]:
    a = load(p)
    if a is None or len(a) < 10: print(p, 'no data'); continue
    t = a[:, 0]; dt = np.median(np.diff(t)); fps = 1 / dt
    cx, cy, fw, yawp, roll, pitchp, op, mw, eL, eR, brow = [a[:, i] for i in range(1, 12)]
    eye = (eL + eR) / 2
    em = np.median(eye)
    closed = eye < 0.6 * em
    blinks = int(np.sum(np.diff(closed.astype(int)) == 1))
    dur = t[-1] - t[0] + dt
    # mouth cycles: smooth lightly, count open peaks with a gap of >= 0.12 s
    k = max(1, int(round(fps * 0.08)))
    sm = np.convolve(op, np.ones(k) / k, mode='same')
    syl = len(peaks(sm, max(0.08, np.percentile(sm, 40)), max(1, int(0.12 * fps)))) / dur
    move = np.hypot(cx - cx.mean(), cy - cy.mean())
    speed = np.median(np.hypot(np.diff(cx), np.diff(cy)) * fps)
    v = [np.percentile(op, 50), np.percentile(op, 90), (op > 0.15).mean() * 100, syl, blinks / dur * 60,
         yawp.std(), roll.std(), pitchp.std(), move.std(), speed, brow.std(), np.median(mw)]
    res[p] = v
    print(f"{os.path.basename(p)[:22]:22} {len(a):4d} " + ' '.join(f'{x:11.3f}' for x in v))
groups = {}
for p, v in res.items(): groups.setdefault(os.path.dirname(p), []).append(v)
for g, vs in groups.items():
    print(f"{'MEAN ' + os.path.basename(g):22} {len(vs):4d} " + ' '.join(f'{x:11.3f}' for x in np.mean(vs, 0)))
