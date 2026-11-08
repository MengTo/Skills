#!/usr/bin/env python3
"""Film-look grades for finished stills (colour only, so the likeness is untouched).
usage: film_grade.py LOOK in.jpg out.jpg      LOOK: br2049-orange | br2049-neon | dune-arrakis | dune-caladan
- br2049-orange: Blade Runner 2049's Las Vegas haze, everything pushed into one amber-orange family, lifted haze, soft contrast.
- br2049-neon:   Blade Runner 2049's city night, teal-cyan shadows, magenta-pink in the highlights, deep blacks, skin kept warm.
- dune-arrakis:  Dune's desert day, desaturated sand and ochre, lifted milky blacks, compressed highlights, low contrast.
- dune-caladan:  Dune's Caladan interiors, cool grey-teal, muted, soft overcast, warm but quiet skin."""
import sys
import numpy as np
from PIL import Image

def lum(x): return x @ np.array([0.2126, 0.7152, 0.0722])
def sat(x, s):
    l = lum(x)[..., None]; return l + (x - l) * s
def curve(x, lift=0.0, gain=1.0, gamma=1.0, contrast=0.0):
    x = np.clip(x, 0, 1)
    if contrast:
        x = x + contrast * (x - 0.5) * (1 - np.abs(2 * x - 1))   # S-curve around mid grey
    x = lift + (gain - lift) * np.clip(x, 0, 1) ** gamma
    return x
def split_tone(x, shadow, highlight, amount=1.0, balance=0.5):
    l = lum(x)[..., None]
    w_hi = np.clip((l - balance) / (1 - balance), 0, 1); w_sh = np.clip((balance - l) / balance, 0, 1)
    return x + amount * (w_sh * (np.array(shadow) - 0.5) + w_hi * (np.array(highlight) - 0.5))
def skin_mask(x):
    """warm skin-ish hues (in RGB): r > g > b, moderately saturated"""
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    m = ((r > g) & (g > b) & (r - b > 0.06) & (r - b < 0.45)).astype(float)
    from scipy.ndimage import gaussian_filter
    return gaussian_filter(m, 3)[..., None]
def grain(x, amt):
    rng = np.random.default_rng(7); n = rng.normal(0, amt, x.shape[:2])[..., None]
    return x + n * (1 - np.abs(2 * lum(x)[..., None] - 1))

def br2049_orange(x):
    l = lum(x)[..., None]
    tint = np.concatenate([0.98 * l ** 0.85 + 0.06, 0.62 * l ** 0.95 + 0.03, 0.26 * l ** 1.1], -1)   # amber ramp
    y = 0.25 * x + 0.75 * tint
    y = y * 0.92 + np.array([0.09, 0.05, 0.0])                                                      # haze lift
    return curve(y, lift=0.02, gain=0.98, gamma=1.05, contrast=-0.15)
def br2049_neon(x):
    sk = skin_mask(x)
    y = split_tone(x, shadow=(0.38, 0.56, 0.62), highlight=(0.62, 0.45, 0.58), amount=0.55, balance=0.45)
    y = sat(y, 1.15)
    y = curve(y, lift=0.0, gain=1.0, gamma=1.12, contrast=0.35)
    warm = curve(sat(x, 0.95), gamma=1.08, contrast=0.25) * np.array([1.03, 0.98, 0.95])
    return y * (1 - 0.55 * sk) + warm * 0.55 * sk
def dune_arrakis(x):
    y = sat(x, 0.55)
    y = split_tone(y, shadow=(0.50, 0.49, 0.47), highlight=(0.60, 0.53, 0.40), amount=0.6, balance=0.4)
    y = curve(y, lift=0.08, gain=0.93, gamma=0.95, contrast=-0.25)
    return y * np.array([1.04, 0.99, 0.88])
def dune_caladan(x):
    sk = skin_mask(x)
    y = sat(x, 0.6)
    y = split_tone(y, shadow=(0.44, 0.50, 0.53), highlight=(0.50, 0.51, 0.50), amount=0.6, balance=0.5)
    y = curve(y, lift=0.06, gain=0.94, gamma=1.0, contrast=-0.1) * np.array([0.96, 1.0, 1.02])
    warm = curve(sat(x, 0.7), lift=0.05, gain=0.95, contrast=-0.1)
    return y * (1 - 0.4 * sk) + warm * 0.4 * sk

LOOKS = {'br2049-orange': br2049_orange, 'br2049-neon': br2049_neon, 'dune-arrakis': dune_arrakis, 'dune-caladan': dune_caladan}
if __name__ == '__main__':
    look, src, dst = sys.argv[1:4]
    x = np.asarray(Image.open(src).convert('RGB')).astype(np.float64) / 255
    y = grain(LOOKS[look](x), 0.012)
    Image.fromarray((np.clip(y, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst, quality=93)
