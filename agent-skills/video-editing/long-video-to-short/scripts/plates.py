# Cut-out plates of the person from a talking clip: python plates.py FRAMES_DIR MASKS_DIR OUT_DIR FPS [--warm-edge]
# FRAMES_DIR: the clip's frames (ffmpeg -i clip-60.mp4 frames/%04d.png). MASKS_DIR: macOS Vision person mattes of the
# same names (segdir.swift). Writes OUT_DIR/NNNN.png (RGBA) and OUT_DIR/fps. The mattes are made solid and steady:
# specks and thin strips of the set go; soft insides of moving hands are made opaque; the torso and a desk
# microphone (which Vision keeps in some frames and drops in others) are held by the clip's median matte in the
# lower half; the matte is a 3-frame median in time; the old set's colour is unmixed from the edge.
# --warm-edge also cleans an amber backlight off dark cloth (a warm set behind a dark jacket) further in.
import sys, cv2, numpy as np
from pathlib import Path
from PIL import Image
fr, mk, out, fps = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]; WARM = '--warm-edge' in sys.argv
out.mkdir(parents=True, exist_ok=True); (out / 'fps').write_text(fps)
E = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)); E5, E11, E17 = E(5), E(11), E(17)
def nblur(v, m, sig): return cv2.GaussianBlur(v * m[..., None], (0, 0), sig) / np.maximum(cv2.GaussianBlur(m, (0, 0), sig)[..., None], 1e-4)
def plate(rgb, a):
    # unmix the set from the half-transparent edge: colour = (pixel - (1 - a) x background) / a, eased into the inside's colour
    c = rgb.astype('f') / 255; fg = (a > .96).astype('f'); bg = (a < .04).astype('f')
    F = nblur(c, fg, 9); B = nblur(c, bg, 14)
    un = np.clip((c - (1 - a[..., None]) * B) / np.maximum(a[..., None], .3), 0, 1)
    w = np.clip((a - .08) / .35, 0, 1)[..., None]; est = un * w + F * (1 - w)
    col = np.where(((a > .02) & (a < .98))[..., None], est, c)
    return Image.fromarray(np.dstack([(col * 255 + .5).astype('uint8'), (a * 255 + .5).astype('uint8')]), 'RGBA')
files = sorted(fr.glob('*.png'))
def clean(p):
    a = np.asarray(Image.open(mk / p.name).convert('L')).astype('f') / 255
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > .35).astype('uint8'), 8)
    if n > 2:
        keep = np.zeros(a.shape, 'uint8'); big = st[1:, 4].max()
        for i in range(1, n):
            if st[i, 4] >= .04 * big: keep[lab == i] = 1
        a = a * cv2.GaussianBlur(cv2.dilate(keep, E11).astype('f'), (0, 0), 3)
    core = cv2.morphologyEx((a > .5).astype('uint8'), cv2.MORPH_OPEN, E11)
    a = a * cv2.GaussianBlur(cv2.dilate(core, E17).astype('f'), (0, 0), 2)
    a = np.clip((a - .07) / .42, 0, 1)                         # a steeper edge: blurred hands stop being half there
    inside = cv2.erode(cv2.morphologyEx((a > .10).astype('uint8'), cv2.MORPH_CLOSE, E17), E5).astype('f')
    return np.maximum(a, cv2.GaussianBlur(inside, (0, 0), 1.5))
A = np.stack([clean(p) for p in files]).astype('float16')
med = np.median(A[::3].astype('f'), axis=0); h = med.shape[0]
hold = (np.clip((med - .5) / .3, 0, 1) * np.clip((np.arange(h)[:, None] / h - .52) / .08, 0, 1)).astype('f')   # the still torso and mic, below the chin
hold = cv2.GaussianBlur(cv2.erode(hold, E(41)), (0, 0), 4)     # only the inside: at the outline it would hold a line of the old set
LUM = np.array([.299, .587, .114], 'f')
for i, p in enumerate(files):
    a = np.maximum(np.median(A[max(0, i - 1):i + 2].astype('f'), axis=0), hold)
    a = cv2.GaussianBlur(np.clip(cv2.erode(a, E5), 0, 1), (0, 0), .9)   # in by two pixels: no rim of the old set on the hair
    rgb = np.asarray(Image.open(p).convert('RGB')).astype('f') / 255
    # the old set's backlight on dark cloth and hair (a ragged bright line along the shoulder): near the edge, where
    # the inside is dark and the pixel is much brighter, take the inside's colour. Skin is bright inside and is left alone.
    m = cv2.erode((a > .96).astype('uint8'), E11).astype('f'); F = nblur(rgb, m, 10)
    L = rgb @ LUM; FL = F @ LUM; dist = cv2.distanceTransform((a > .5).astype('uint8'), cv2.DIST_L2, 3)
    near = np.clip((11 - dist) / 4, 0, 1)
    if WARM: near = np.maximum(near, np.clip((rgb[..., 0] - 1.12 * rgb[..., 2] - .02) / .06, 0, 1) * np.clip((44 - dist) / 10, 0, 1))
    w = (np.clip((L - FL - .05) / .07, 0, 1) * np.clip((.30 - FL) / .07, 0, 1) * near * (cv2.GaussianBlur(m, (0, 0), 10) > .05)).astype('f')
    w = cv2.GaussianBlur(w, (0, 0), 1.2)[..., None]
    plate(((rgb * (1 - w) + F * w) * 255 + .5).astype('uint8'), a).save(out / p.name, compress_level=1)
print(out, len(files), 'plates')
