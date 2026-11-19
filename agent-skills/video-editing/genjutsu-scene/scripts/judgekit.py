#!/usr/bin/python3
# Blind-judge kit for two versions of the same talking shot (before vs after, e.g. take 2 vs scene one, draft vs final).
# From the two clean 4K60 files it cuts, at the SAME film moments: full frames (1920x1080), large face crops (1400x1400),
# a mouth strip (8 sounds, each labelled with the sound spoken) and an eye strip (8 moments), plus the truth photos.
# One ffmpeg pass per clip (select exact 60 fps frames) and one Vision pass over all frames: per-image decoding of 4K
# crawled for 12 minutes under load. Sides are shuffled ONCE PER JUDGE for every file (a per-moment shuffle confused a judge).
# usage: judgekit.py CONFIG.json
# CONFIG.json: {
#   "out": "/abs/judge-dir", "seed": 7, "lmdump": "/abs/lmdump", "truth": "/abs/dir with T1.jpg..T5.jpg",
#   "sources": {"draft": ["/abs/draft-4k60-clean.mp4", 19.25], "final": ["/abs/final-4k60-clean.mp4", 19.25]},  # [file, film time of frame 0]
#   "moments": [["m1", 20.68], ["m2", 21.68], ["m3", 23.93], ["m4", 25.30]],
#   "mouth": [["code", 20.50], ["model (m)", 21.33], ...8 items],
#   "eyes": [19.6, 20.4, ...8 film times] }
# Writes OUT/j1, OUT/j2 (judge folders) and OUT-KEY.json (which name is X for each judge). Do not show the key to judges.
import json, random, subprocess, os, sys, numpy as np
from PIL import Image, ImageDraw
C = json.load(open(sys.argv[1])); W = C['out'].rstrip('/') + '/'; os.makedirs(W + 'raw', exist_ok=True)
SRC = C['sources']; A, B = list(SRC)
MOM, MOUTH, EYES = C['moments'], C['mouth'], C['eyes']
FACE = {}
times = sorted(set([ft for _, ft in MOM] + [ft for _, ft in MOUTH] + EYES))
pngs = []
for name, (f, a0) in SRC.items():
    ns = [round((ft - a0) * 60) for ft in times]
    tmp = f'{W}raw/{name}-%03d.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-vf', 'select=' + '+'.join(f'eq(n\\,{n})' for n in ns), '-vsync', '0', tmp], check=True)
    for i, ft in enumerate(times):
        dst = f'{W}raw/{name}-{ft:.2f}.png'; os.replace(tmp % (i + 1), dst); pngs.append(dst)
out = subprocess.run([C['lmdump'], '--images'] + pngs, capture_output=True, text=True).stdout.splitlines()
for png, line in zip(pngs, out): FACE[png] = json.loads(line)['face']['pts']
grab = lambda name, ft: f'{W}raw/{name}-{ft:.2f}.png'
def box(P, keys):
    p = np.array(sum((P[k] for k in keys), [])); return p.min(0), p.max(0)
rng = random.Random(C.get('seed', 7)); key = {}
for j in ('j1', 'j2'):
    d = W + j + '/'; os.makedirs(d + 'truth', exist_ok=True)
    xs = rng.choice([A, B]); ys = B if xs == A else A; key[j] = f'X={xs}'
    for side, name in (('X', xs), ('Y', ys)):
        for lab, ft in MOM:
            png = grab(name, ft); im = Image.open(png).convert('RGB')
            im.resize((1920, 1080), Image.LANCZOS).save(f'{d}{lab}-{side}.jpg', quality=93)
            (x0, y0), (x1, y1) = box(FACE[png], ['faceContour', 'leftBrow', 'rightBrow'])
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * (y1 - y0); s = 1.15 * max(x1 - x0, y1 - y0) * 1.6
            im.crop((int(cx - s / 2), int(cy - s / 2), int(cx + s / 2), int(cy + s / 2))).resize((1400, 1400), Image.LANCZOS).save(f'{d}{lab}-{side}-face.jpg', quality=93)
        cw, ch = 300, 220; strip = Image.new('RGB', (cw * 4, (ch + 28) * 2), 'black'); dr = ImageDraw.Draw(strip)
        for i, (wd, ft) in enumerate(MOUTH):
            png = grab(name, ft); P = FACE[png]; (x0, y0), (x1, y1) = box(P, ['outerLips'])
            le, re = np.array(P['leftEye']).mean(0), np.array(P['rightEye']).mean(0); iod = np.hypot(*(re - le))
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; hw = 0.85 * iod; hh = hw * ch / cw
            c = Image.open(png).convert('RGB').crop((int(cx - hw), int(cy - hh), int(cx + hw), int(cy + hh))).resize((cw, ch), Image.LANCZOS)
            gx, gy = (i % 4) * cw, (i // 4) * (ch + 28); strip.paste(c, (gx, gy + 28)); dr.text((gx + 6, gy + 8), f'"{wd}"', fill='white')
        strip.save(f'{d}mouth-{side}.jpg', quality=93)
        ew, eh = 420, 150; es = Image.new('RGB', (ew * 2, eh * 4), 'black')
        for i, ft in enumerate(EYES):
            png = grab(name, ft); (x0, y0), (x1, y1) = box(FACE[png], ['leftEye', 'rightEye', 'leftBrow', 'rightBrow'])
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; hw = 0.62 * (x1 - x0); hh = hw * eh / ew
            c = Image.open(png).convert('RGB').crop((int(cx - hw), int(cy - hh), int(cx + hw), int(cy + hh))).resize((ew, eh), Image.LANCZOS)
            es.paste(c, ((i % 2) * ew, (i // 2) * eh))
        es.save(f'{d}eyes-{side}.jpg', quality=93)
    for t in sorted(os.listdir(C['truth'])):
        if t.lower().endswith(('.jpg', '.png')): subprocess.run(['cp', os.path.join(C['truth'], t), d + 'truth/'])
json.dump(key, open(W.rstrip('/') + '-KEY.json', 'w'), indent=1); print('judge folders in', W, '(key written, not shown)')
