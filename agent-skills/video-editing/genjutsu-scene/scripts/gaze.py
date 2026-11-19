#!/usr/bin/python3
# Gaze on the lens, from an lmdump .jsonl plus the frames it was dumped from.
# Per frame: dark-iris centroid in each Vision eye box (dx, fraction of eye width; + = image right), head-turn proxy yw
# (nose vs face-contour centre, fraction of face width), look = yw + dx (0 = straight down the lens at eye level).
# "On the lens" = |look| < 0.05 (loose) / < 0.03 (tight). The measure has a face-dependent bias of about +-0.05 and it
# reads lower on sharper sources (1080p vs a 480p upscale), so compare clips only at the same resolution, and always look
# at an eye strip by eye before you trust a drop.
# usage: gaze.py dump.jsonl FRAMES_DIR [--pattern %04d.png] [--fps F] [--split S] [--out gaze.json]
#   FRAMES_DIR holds the frames the dump was made from, 1-based (ffmpeg -i clip.mp4 DIR/%04d.png).
import sys, json, argparse, numpy as np
from PIL import Image, ImageDraw

def iris(img, pts, pct=30):
    p = np.array(pts); x0, y0 = p.min(0); x1, y1 = p.max(0); w = x1 - x0
    bx0, by0, bx1, by1 = int(x0) - 2, int(y0) - 2, int(x1) + 3, int(y1) + 3
    crop = np.asarray(img.crop((bx0, by0, bx1, by1)), np.float32)
    m = Image.new('L', (bx1 - bx0, by1 - by0), 0); ImageDraw.Draw(m).polygon([(a - bx0, b - by0) for a, b in pts], fill=1)
    m = np.asarray(m, bool); v = crop[m]; sel = m & (crop <= np.percentile(v, pct))
    yy, xx = np.nonzero(sel)
    return (xx.mean() + bx0 - (x0 + x1) / 2) / w, (yy.mean() + by0 - (y0 + y1) / 2) / w

def gaze(row, img):
    P = row['face']['pts']
    dl, dr = iris(img, P['leftEye']), iris(img, P['rightEye'])
    fc = np.array(P['faceContour']); nose = np.array(P['nose'])
    yw = (nose[:, 0].mean() - (fc[:, 0].min() + fc[:, 0].max()) / 2) / (fc[:, 0].max() - fc[:, 0].min())
    dx, dy = (dl[0] + dr[0]) / 2, (dl[1] + dr[1]) / 2
    return dict(dx=dx, dy=dy, yw=yw, look=yw + dx)

def stats(G):
    l = np.array([g['look'] for g in G if g])
    if not len(l): return 'no faces'
    return '%d faces; |look|<0.05 %.0f%%  <0.03 %.0f%%  mean %+.3f' % (len(l), 100 * np.mean(np.abs(l) < 0.05), 100 * np.mean(np.abs(l) < 0.03), l.mean())

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('dump'); ap.add_argument('frames'); ap.add_argument('--pattern', default='%04d.png')
    ap.add_argument('--fps', type=float, default=24); ap.add_argument('--split', type=float, nargs='*', default=[],
                    help='clip times (s) to report sections between, e.g. --split 3.0 for two sentences')
    ap.add_argument('--out')
    a = ap.parse_args()
    rows = [json.loads(l) for l in open(a.dump)]
    G = [gaze(r, Image.open(f'{a.frames}/{a.pattern % (i + 1)}').convert('L')) if r.get('face') else None for i, r in enumerate(rows)]
    print('whole clip:', stats(G))
    cuts = [0] + [int(s * a.fps) for s in a.split] + [len(G)]
    if a.split:
        for x, y in zip(cuts, cuts[1:]): print('  %.2f-%.2f s: %s' % (x / a.fps, y / a.fps, stats(G[x:y])))
    if a.out: json.dump(G, open(a.out, 'w'))
