#!/usr/bin/env python3
"""Face proportions from Vision landmarks (lmjson output), normalised by n = eye line -> nose base
(vertical, so head turn barely changes it). Columns: c/n = mouth centre -> chin bottom; wNose/wMouth/w66
= face-contour width at nose base, mouth, and 2/3 of the way from mouth to chin; m/n = nose base -> mouth;
cd = the skill's chin (lower-lip bottom -> chin) / d.
Run it on your own held-out real frames first: their means are your target. (One person's real 3/4 frames measured
c/n 0.80, wNose 2.63, wMouth 2.24, w66 1.36, cd 0.36; generated images of him ran ~8 % long in the chin and ~7 % wide
until the reference set was fixed.)
usage: measure.py LM.json"""
import json, math, sys
import numpy as np
lm = json.load(open(sys.argv[1]))
print(f"{'img':40} {'c/n':>5} {'cd':>5} {'m/n':>5} {'wNose':>6} {'wMouth':>6} {'w66':>5} {'yaw':>5}")
for name, f in sorted(lm.items()):
    le, re = np.mean(f['leftEye'], 0), np.mean(f['rightEye'], 0)
    em = (le + re) / 2; a, b = sorted([le, re], key=lambda p: p[0])
    th = -math.atan2(b[1] - a[1], b[0] - a[0]); R = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]])
    r = lambda p: (np.array(p, float) - em) @ R.T
    lips = r(f['outerLips']); nose = r(f['nose']); jaw = r(f['faceContour'])
    mc = lips.mean(0); n = nose[:, 1].max(); chin = jaw[:, 1].max(); d = np.hypot(*mc)
    def w(y):
        xs = [x1 + (y - y1) * (x2 - x1) / (y2 - y1) for (x1, y1), (x2, y2) in zip(jaw[:-1], jaw[1:]) if (y1 - y) * (y2 - y) <= 0 and y1 != y2]
        return (max(xs) - min(xs)) / n if len(xs) >= 2 else float('nan')
    print(f"{name[:40]:40} {(chin - mc[1]) / n:5.2f} {(chin - lips[:, 1].max()) / d:5.3f} {(mc[1] - n) / n:5.2f} {w(n):6.2f} {w(mc[1]):6.2f} {w(mc[1] + 0.66 * (chin - mc[1])):5.2f} {f['yaw']:5.2f}")
