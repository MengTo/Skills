#!/usr/bin/env python3
"""Paste only the fixed regions of a Seedream edit back onto an approved still, so nothing else changes.
usage: fix_still.py ORIGINAL EDIT OUT 'x0,y0,x1,y1;x0,y0,x1,y1' [--protect-face LM.json] [--feather PX] [--match]
Regions are fractions of width/height. With --protect-face, the core of the face (eyes, nose, mouth; from Vision
landmarks) is never taken from the edit. --match matches each region's colour statistics to the original's border
so the patch carries the original's grade and grain level. Prints how far the edit drifted outside the regions."""
import argparse, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('orig'); ap.add_argument('edit'); ap.add_argument('out'); ap.add_argument('regions')
ap.add_argument('--protect-face'); ap.add_argument('--feather', type=float, default=24); ap.add_argument('--match', action='store_true')
a = ap.parse_args()
o = Image.open(a.orig).convert('RGB'); W, H = o.size
e = Image.open(a.edit).convert('RGB').resize((W, H), Image.LANCZOS)
rects = [[float(v) for v in r.split(',')] for r in a.regions.split(';') if r.strip()]
m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
for x0, y0, x1, y1 in rects:
    d.rectangle([int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)], fill=255)
if a.protect_face:
    lm = json.load(open(a.protect_face)); f = lm[list(lm)[0]] if len(lm) == 1 else lm[a.orig.split('/')[-1]]
    pts = np.vstack([np.array(f[k]) for k in ('leftEye', 'rightEye', 'nose', 'outerLips', 'leftBrow', 'rightBrow')])
    x0, y0 = pts.min(0); x1, y1 = pts.max(0); pad = 0.12 * (x1 - x0)
    d.ellipse([x0 - pad, y0 - pad, x1 + pad, y1 + pad], fill=0)
m = m.filter(ImageFilter.GaussianBlur(a.feather))
O = np.asarray(o).astype(np.float64); E = np.asarray(e).astype(np.float64); M = np.asarray(m).astype(np.float64)[..., None] / 255
if a.match:
    ring = (M[..., 0] > 0.02) & (M[..., 0] < 0.5)
    if ring.sum() > 500:
        for c in range(3):
            mo, so = O[..., c][ring].mean(), O[..., c][ring].std() + 1e-6
            me, se = E[..., c][ring].mean(), E[..., c][ring].std() + 1e-6
            E[..., c] = (E[..., c] - me) * (so / se) + mo
outside = M[..., 0] < 0.01
drift = np.abs(O - E).mean(-1)[outside].mean()
R = O * (1 - M) + E * M
Image.fromarray(np.clip(R, 0, 255).astype(np.uint8)).save(a.out, quality=95, subsampling=0)
print(f'{a.out.split("/")[-1]}: regions {len(rects)}, edit drift outside regions {drift:.1f} levels (≲6 = aligned)')
