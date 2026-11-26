#!/usr/bin/env python3
"""Landmark-measured face retouch for generated stills (free, no model run).

Seedream 5 Pro can draw a chin ~10 % long and a face ~8 % wide relative to the eye-to-nose length
(Vision landmarks; see measure.py: compare with your held-out real frames). This tool moves only what was measured.
In blind tests a chin lift won one round and lost the next, and --narrow / --shine hurt: use it sparingly.

  --lift PX        lift the chin bottom by PX, compressing only the soft tissue between the
                   lower lip and the chin (0 at the lower lip, full at the chin bottom)
  --narrow F       pull the jaw below the mouth toward the mouth's centre line by fraction F
                   (0 at mouth height, full at the chin): a narrower, less round chin; the
                   cheeks stay full
  --narrow-mouth F the same at mouth height and below (the whole lower face)
  --shine F        compress the specular highlight on the nose tip by fraction F
  --specks F       soften small reddish specks on the cheeks by fraction F

The displacement field is a thin-plate spline that is zero on the eyes, brows, nose and lips,
and fades to zero within --reach d of the jaw line, so the ear, collar and background stay put.

usage: warp_face.py IN.jpg LM.json OUT.jpg [--lift 16] [--narrow 0.07] [--shine 0.5]
                    [--specks 0.7] [--debug field.jpg]
LM.json comes from lmjson (rounds/r10/bin), keyed by file name.
"""
import argparse, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import RBFInterpolator
from scipy.ndimage import map_coordinates, zoom, gaussian_filter, median_filter

ap = argparse.ArgumentParser()
ap.add_argument('inp'); ap.add_argument('lm'); ap.add_argument('out')
ap.add_argument('--lift', type=float, default=0.0)
ap.add_argument('--narrow', type=float, default=0.0)
ap.add_argument('--narrow-mouth', type=float, default=0.0)
ap.add_argument('--shine', type=float, default=0.0)
ap.add_argument('--specks', type=float, default=0.0)
ap.add_argument('--reach', type=float, default=0.45)
ap.add_argument('--debug')
a = ap.parse_args()

lmall = json.load(open(a.lm))
key = a.inp.split('/')[-1]
f = lmall[key] if key in lmall else lmall[list(lmall)[0]]
P = lambda k: np.array(f[k], dtype=float)
le, re, lips, jaw, nose = P('leftEye'), P('rightEye'), P('outerLips'), P('faceContour'), P('nose')
em = (le.mean(0) + re.mean(0)) / 2
mc = lips.mean(0)
d = float(np.hypot(*(mc - em)))
lip_bottom = lips[:, 1].max()
chin_y = jaw[:, 1].max()
nose_y = nose[:, 1].max()

def smooth(t):
    t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)

img = np.asarray(Image.open(a.inp).convert('RGB')).astype(np.float32)
H, W = img.shape[:2]
out = img.copy()

# ---------- geometry: chin lift + narrowing ----------
if a.lift > 0 or a.narrow > 0 or a.narrow_mouth > 0:
    def target(p):
        x, y = p
        wv = smooth((y - lip_bottom) / max(1.0, chin_y - lip_bottom))   # lower lip -> chin
        wb = smooth((y - mc[1]) / max(1.0, chin_y - mc[1]))             # mouth -> chin
        wm = smooth((y - nose_y) / max(1.0, mc[1] - nose_y))            # nose base -> mouth
        k = a.narrow * wb + a.narrow_mouth * wm
        return np.array([x + k * (mc[0] - x), y - a.lift * wv])
    src = np.vstack([jaw, (jaw[:-1] + jaw[1:]) / 2])
    dst = np.array([target(p) for p in src])
    fixed = np.vstack([P(r) for r in ('leftEye', 'rightEye', 'leftBrow', 'rightBrow', 'nose', 'noseCrest', 'outerLips', 'innerLips')])
    centre = np.vstack([le, re, lips, nose]).mean(0)
    ring = np.array([p + (p - centre) / max(np.hypot(*(p - centre)), 1e-6) * a.reach * d for p in src])
    corners = np.array([[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]], float)
    ctrl = np.vstack([dst, fixed, ring, corners])
    disp = np.vstack([src - dst, np.zeros((len(fixed) + len(ring) + len(corners), 2))])
    rbf = RBFInterpolator(ctrl, disp, kernel='thin_plate_spline')

    x0 = int(max(0, min(ring[:, 0].min(), src[:, 0].min()) - 0.1 * d)); x1 = int(min(W, max(ring[:, 0].max(), src[:, 0].max()) + 0.1 * d))
    y0 = int(max(0, nose_y - 0.2 * d)); y1 = int(min(H, max(ring[:, 1].max(), src[:, 1].max()) + 0.1 * d))
    step = 4
    gy, gx = np.mgrid[y0:y1:step, x0:x1:step]
    field = rbf(np.column_stack([gx.ravel(), gy.ravel()])).reshape(gy.shape + (2,))
    dist = np.full(gx.shape, np.inf)
    for p in dst:
        dist = np.minimum(dist, np.hypot(gx - p[0], gy - p[1]))
    fade = 1 - smooth((dist - 0.15 * a.reach * d) / (0.85 * a.reach * d))
    fade *= smooth((gy - (nose_y - 0.2 * d)) / (0.3 * d))
    field *= fade[..., None]
    hh, ww = y1 - y0, x1 - x0
    def up(ch):
        u = zoom(ch, step, order=1)[:hh, :ww]
        u = np.pad(u, ((0, hh - u.shape[0]), (0, ww - u.shape[1])), mode='edge')
        return gaussian_filter(u, 2)
    fx, fy = up(field[..., 0]), up(field[..., 1])
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    for c in range(3):
        out[y0:y1, x0:x1, c] = map_coordinates(img[..., c], [yy + fy, xx + fx], order=3, mode='nearest')
    mag = np.hypot(fx, fy)
    print(f'geometry: lift {a.lift:.1f}px, narrow {a.narrow:.3f} below mouth, {a.narrow_mouth:.3f} at mouth; field max {mag.max():.1f}px')
    if a.debug:
        vis = np.clip(out, 0, 255).copy()
        m = (mag / max(mag.max(), 1e-6))[..., None]
        vis[y0:y1, x0:x1] = vis[y0:y1, x0:x1] * (1 - 0.6 * m) + np.array([255, 0, 80]) * 0.6 * m
        Image.fromarray(vis.astype(np.uint8)).crop((x0, y0, x1, y1)).save(a.debug, quality=88)

# ---------- nose-tip shine ----------
if a.shine > 0:
    tip = nose[np.argmax(nose[:, 1])] if len(nose) else mc
    crest = P('noseCrest')
    tipc = crest[-1] if len(crest) else tip
    cx, cy = (tipc + tip) / 2
    r = 0.22 * d
    X0, X1, Y0, Y1 = int(cx - 2 * r), int(cx + 2 * r), int(cy - 2 * r), int(cy + 2 * r)
    patch = out[Y0:Y1, X0:X1]
    lum = patch @ np.array([0.299, 0.587, 0.114], np.float32)
    base = gaussian_filter(lum, 0.12 * d)
    excess = np.clip(lum - base - 4, 0, None)          # highlight above the local shading
    yy, xx = np.mgrid[Y0:Y1, X0:X1]
    wmask = 1 - smooth((np.hypot(xx - cx, yy - cy) - 0.6 * r) / (0.8 * r))
    k = (a.shine * excess * wmask)[..., None]
    ratio = patch / np.maximum(lum[..., None], 1)
    out[Y0:Y1, X0:X1] = patch - k * ratio
    print(f'shine: max highlight {excess.max():.0f} levels, removed {a.shine:.2f} of it within {r:.0f}px of the tip')

# ---------- reddish specks ----------
if a.specks > 0:
    poly = [tuple(p) for p in jaw] + [tuple(p) for p in np.vstack([P('rightBrow'), P('leftBrow')])[::-1]]
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    keep = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(keep)
    for r_ in ('leftEye', 'rightEye', 'outerLips', 'leftBrow', 'rightBrow'):
        pts = P(r_); c0 = pts.mean(0); pad = 0.12 * d
        dr.ellipse([pts[:, 0].min() - pad, pts[:, 1].min() - pad, pts[:, 0].max() + pad, pts[:, 1].max() + pad], fill=255)
    skin = (np.asarray(m) > 0) & ~(np.asarray(keep) > 0)
    ys, xs = np.nonzero(skin)
    Y0, Y1, X0, X1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    patch = out[Y0:Y1, X0:X1]
    med = np.stack([median_filter(patch[..., c], size=int(0.05 * d) | 1) for c in range(3)], -1)
    R_, G_, B_ = patch[..., 0], patch[..., 1], patch[..., 2]
    mR, mG = med[..., 0], med[..., 1]
    red = (R_ - G_) - (mR - mG)                       # redder than the surrounding skin
    dark = (med.mean(-1) - patch.mean(-1))            # and a little darker
    score = np.clip((red - 3) / 6, 0, 1) * np.clip((dark + 2) / 6, 0, 1)
    score = gaussian_filter(score, 1.2) * skin[Y0:Y1, X0:X1]
    k = (a.specks * np.clip(score * 1.5, 0, 1))[..., None]
    out[Y0:Y1, X0:X1] = patch * (1 - k) + med * k
    print(f'specks: {int((score > 0.3).sum())} px treated')

Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(a.out, quality=96, subsampling=0)
