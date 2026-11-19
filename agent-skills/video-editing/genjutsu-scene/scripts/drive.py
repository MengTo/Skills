#!/usr/bin/python3
# Build the Genjutsu drive (the video whose motion is transferred) from the person's camera frames.
# Every frame is scaled about the eye midpoint so the eyes land on the start still's eye point, with an eased scale ramp
# (a slow push-in: the camera move in the result). The border outside the source frame is the frame's own edge pixels
# clamped outward, blurred and feathered in, so there is no hard edge (a hard edge comes back as a "slab" in the result).
# The frame order is an index list, so a bad ending (a brow raise, a big gesture, a long blink) can be replaced by playing
# back and forth inside a calm stretch: e.g. "0-116,115-94,95-115" (relative to --first, inclusive, either direction).
# usage: drive.py --frames DIR --first N --index SPEC --src-eye X,Y --eye FX,FY --scale S0,S1 --out OUT.mp4
#                 [--pattern %04d.jpg] [--size 1920x1080] [--fps 25] [--work DIR]
#   --src-eye: eye midpoint (px) in the source frame --first (lmdump --images on that frame: mean of leftEye/rightEye mids).
#   --eye: where the eyes sit in the drive, as fractions of W, H (= the start still's eye point, so frame 1 matches it).
#   --scale: source-to-drive scale at the first and last drive frame (the still's inter-ocular / the source's).
import argparse, math, os, subprocess, numpy as np
from PIL import Image, ImageFilter
ap = argparse.ArgumentParser()
ap.add_argument('--frames', required=True); ap.add_argument('--pattern', default='%04d.jpg'); ap.add_argument('--first', type=int, required=True)
ap.add_argument('--index', required=True); ap.add_argument('--src-eye', required=True); ap.add_argument('--eye', required=True)
ap.add_argument('--scale', required=True); ap.add_argument('--size', default='1920x1080'); ap.add_argument('--fps', type=int, default=25)
ap.add_argument('--out', required=True); ap.add_argument('--work')
a = ap.parse_args()
IDX = []
for part in a.index.split(','):
    x, y = (int(v) for v in part.split('-')); IDX += list(range(x, y + 1)) if y >= x else list(range(x, y - 1, -1))
W, H = (int(v) for v in a.size.split('x')); N = len(IDX)
TE = [float(v) for v in a.src_eye.split(',')]; fx, fy = (float(v) for v in a.eye.split(',')); EX, EY = fx * W, fy * H
S0, S1 = (float(v) for v in a.scale.split(','))
work = a.work or os.path.splitext(a.out)[0] + '-frames'; os.makedirs(work, exist_ok=True)
ez = lambda k: 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, k)))
yy, xx = np.mgrid[0:H, 0:W]
for i in range(N):
    s = S0 + (S1 - S0) * ez(i / max(1, N - 1)); ox, oy = EX - s * TE[0], EY - s * TE[1]
    src = Image.open(os.path.join(a.frames, a.pattern % (a.first + IDX[i]))).convert('RGB')
    fr = np.asarray(src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS), np.float32)
    x0, y0 = round(ox), round(oy)
    ext = fr[np.clip(yy - y0, 0, fr.shape[0] - 1), np.clip(xx - x0, 0, fr.shape[1] - 1)]
    blur = np.asarray(Image.fromarray(ext.astype(np.uint8)).filter(ImageFilter.GaussianBlur(28)), np.float32)
    din = np.minimum.reduce([xx - x0, (x0 + fr.shape[1] - 1) - xx, yy - y0, (y0 + fr.shape[0] - 1) - yy]).astype(np.float32)
    al = np.clip((din + 4) / 48, 0, 1)[..., None]
    Image.fromarray(np.clip(ext * al + blur * (1 - al), 0, 255).astype(np.uint8)).save(f'{work}/{i + 1:04d}.png')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(a.fps), '-i', f'{work}/%04d.png', '-c:v', 'libx264', '-preset', 'slow',
                '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', a.out], check=True)
print(f'{a.out}: {N} frames, {N / a.fps:.2f} s at {a.fps} fps; source frames {a.first + IDX[0]}..{a.first + max(IDX)}')
