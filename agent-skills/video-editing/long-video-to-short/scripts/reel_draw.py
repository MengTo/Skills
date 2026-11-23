# The short's drawing language, one frame at a time: every function draws frame n (60 fps) onto a transparent
# 1080 x 1920 RGBA canvas that export.py lays over the section's background clip. Nothing reads a clock.
# Fonts: put Archivo-SemiBoldItalic.ttf (headlines) and Geist-Regular.ttf (captions) in ./fonts, or set
# REEL_HEAD_FONT and REEL_CAP_FONT to any .ttf. Run from the project folder (or set REEL_DIR).
from functools import lru_cache
from pathlib import Path
import math, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

wd = Path(os.environ.get('REEL_DIR', '.')).resolve()
W, H, FPS = 1080, 1920, 60
CREAM, PEACH, FIRE = (251, 247, 237), (255, 150, 84), (255, 134, 78)
HEAD = os.environ.get('REEL_HEAD_FONT', str(wd / 'fonts' / 'Archivo-SemiBoldItalic.ttf'))
CAP = os.environ.get('REEL_CAP_FONT', str(wd / 'fonts' / 'Geist-Regular.ttf'))

def q(x): return max(0, min(1, x))
def expo(x): return 1 - (1 - q(x)) ** 3
def ex5(x): return 1 - (1 - q(x)) ** 5
def sm(x): x = q(x); return x * x * (3 - 2 * x)
def window(n, a, b, inn=12, out=10): return sm((n - a) / inn) * sm((b - n) / out)
@lru_cache(256)
def font(path, n): return ImageFont.truetype(path, int(n))

def put(canvas, im, x, y, opacity=1):
    if opacity < .002: return
    if opacity < .997:
        im = im.copy(); im.putalpha(im.getchannel('A').point(tuple(round(i * opacity) for i in range(256))))
    canvas.alpha_composite(im, (int(x), int(y)))

def shade(stops, color):
    # a vertical gradient of darkness: [(y, alpha 0..255), ...]
    y = np.interp(np.arange(H), [v[0] for v in stops], [v[1] for v in stops]).astype('uint8')
    im = Image.new('RGBA', (W, H), color); im.putalpha(Image.fromarray(y[:, None]).resize((W, H))); return im
# under the captions (darkest at y 1445-1575) and behind a headline at the top
base_shade = shade([(0, 25), (180, 37), (570, 0), (1010, 0), (1160, 22), (1280, 127), (1445, 203), (1575, 215), (1850, 135), (1920, 111)], (12, 12, 15))
title_shade = shade([(0, 96), (170, 150), (310, 172), (475, 104), (620, 0), (1920, 0)], (23, 17, 15))

# ---- headlines -------------------------------------------------------------------------------------------------
def title_tile(text, size, tracking, color):
    ft = font(HEAD, size); total = math.ceil(sum(ft.getlength(c) for c in text) + max(0, len(text) - 1) * tracking)
    im = Image.new('RGBA', (total + 60, size + 65)); d = ImageDraw.Draw(im); x = 18
    for c in text:
        d.text((x, size + 2), c, font=ft, anchor='ls', fill=color, stroke_width=1, stroke_fill=color); x += ft.getlength(c) + tracking
    im = im.crop(im.getbbox())
    sh = Image.new('RGBA', (im.width + 38, im.height + 38), (18, 10, 9, 0)); mask = Image.new('L', sh.size)
    mask.paste(im.getchannel('A'), (18, 22)); sh.putalpha(mask.filter(ImageFilter.GaussianBlur(10)).point(lambda v: min(255, int(v * 1.9))))
    sh.alpha_composite(im, (17, 15)); return sh

def heading(canvas, n, a, b, y, parts, sz=200, first=False, x=52):
    # parts: [(text, colour), ...] on one line. One entrance for every headline: 14 frames expo-out, opacity over the
    # first 8, a 12 px blur resolving, tracking in from +0.17 em (+0.07 em when wider than 880 px), a 24 px rise.
    # One exit: 8 frames into a 10 px blur, gone at b, so it never overlaps the next title. `first` is already set
    # on frame one (the cover) and only settles a little tracking.
    if n < a: return
    p = 1 if first else ex5((n - a) / 14); k = q((n - (b - 8)) / 8) ** 3; vis = (1 if first else q((n - a + 1) / 8)) * (1 - k)
    if vis < .001: return
    gap = round(sz * .17)
    def row(track):
        tiles = [title_tile(tx, sz, track, c) for tx, c in parts]
        im = Image.new('RGBA', (sum(t.width - 38 for t in tiles) + gap * (len(tiles) - 1) + 98, max(t.height for t in tiles) + 60)); xx = 30
        for t in tiles: im.alpha_composite(t, (xx, 30)); xx += t.width - 38 + gap
        return im
    settled = row(-1); scale = min(1, 955 / (settled.width - 60)); wide = (settled.width - 60) * scale > 880
    em = (.03 * (1 - ex5(n / 40)) if first else (.07 if wide else .17) * (1 - expo((n - a) / 22))) + .04 * k; track = round(em * sz) - 1
    im = settled if track <= -1 else row(track)
    if scale < 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    blur = (0 if first else 12 * (1 - p)) + 10 * k
    if blur > .35: im = im.filter(ImageFilter.GaussianBlur(blur))
    sw = round((settled.width - 60) * scale); sh = round((settled.height - 60) * scale)
    back = Image.new('RGBA', (sw + 160, sh + 150)); ImageDraw.Draw(back).rounded_rectangle((70, 66, sw + 90, sh + 84), radius=70, fill=(10, 10, 14, 150))
    put(canvas, back.filter(ImageFilter.GaussianBlur(38)), x - 80, y - 75, vis * .62)      # a soft dark backing
    put(canvas, im, x - round(30 * scale), y - round(30 * scale) + (0 if first else 24 * (1 - p)), vis)

def count(n, a, to, frames=36): return str(max(1, round(to * expo((n - a) / frames))))   # a number that eases up and settles on the spoken one

# ---- captions --------------------------------------------------------------------------------------------------
TIGHT = -.035   # letter spacing in em
def offs(word, size):
    o = [0]
    for c in word[1:]: o.append(o[-1] + (.012 if c in '.,' else TIGHT) * size)   # a full stop keeps clear of its letter
    return o
def tw(word, size): return font(CAP, size).getlength(word) + offs(word, size)[-1]
def gap(size): return font(CAP, size).getlength(' ') * .9
def tight(d, x, y, word, size, **kw):
    ft = font(CAP, size); o = offs(word, size)
    for i, c in enumerate(word): d.text((x + ft.getlength(word[:i]) + o[i], y), c, font=ft, anchor='ls', **kw)
@lru_cache(4096)
def cap_tile(word, size, level, soft):
    # one caption word: level 0..5 mixes cream to the spoken orange, soft 0..3 is the focus it resolves from
    col = tuple(round(c + (o - c) * level / 5) for c, o in zip(CREAM, PEACH))
    w = math.ceil(tw(word, size)) + 40; h = size + 53; baseline = size + 9
    layer = Image.new('RGBA', (w, h)); mask = Image.new('L', layer.size)
    tight(ImageDraw.Draw(mask), 15, baseline + 3, word, size, fill=235, stroke_width=3, stroke_fill=235)
    layer.putalpha(mask.filter(ImageFilter.GaussianBlur(7)).point(lambda v: min(255, int(v * 1.9))))
    tight(ImageDraw.Draw(layer), 15, baseline, word, size, fill=col)
    return layer.filter(ImageFilter.GaussianBlur(soft * 1.6)) if soft else layer
def say(canvas, word, size, x, base, n, appear, on, nxt, lit=False, op=1):
    # the word rises out of its own line's mask as its focus resolves; the spoken word warms to orange over four
    # frames with a small lift and cools when the next one starts. No hard flips, no bounce.
    p = expo((n - appear) / 15)
    if p <= 0: return
    mix = (1 if lit else sm((n - on + 1) / 4)) * (1 - sm((n - nxt + 1) / 5)) if n >= on - 1 or lit else 0
    tile = cap_tile(word, size, round(mix * 5), min(3, round((1 - p) * 3.4)))
    lift = 5 * math.sin(math.pi * q((n - on) / 12)) if n >= on else 0
    ty = round(base - size - 9 + (1 - p) * size * .92 - lift); clip = round(base + size * .27)
    if ty >= clip: return
    if ty + tile.height > clip: tile = tile.crop((0, 0, tile.width, clip - ty))
    put(canvas, tile, x - 15, ty, min(1, p * 1.6) * op)

class Captions:
    # words: [[word, start s, end s], ...] relative to the section's first frame (timeline.json).
    # pages: [[line, line], ...] the same words broken for the frame, one or two lines a page.
    def __init__(self, words, pages, x=77, base=1444, line=113, width=826, top=103, lead=2):
        on = [max(0, round(w[1] * FPS) - lead) for w in words]          # each word lights two frames before its sound
        for k in range(1, len(on)): on[k] = max(on[k], on[k - 1] + 5)   # two words never light on the same frame
        i = 0; self.pages = []
        for lines in pages:
            rows = []
            for ln in lines:
                row = []
                for word in ln.split(' '): row.append((word, on[i])); i += 1
                rows.append(row)
            self.pages.append(rows)
        assert i == len(words), ('caption pages hold %d words, the section says %d' % (i, len(words)), [w[0] for w in words])
        P = self.pages; self.on = on; self.x, self.base, self.line, self.width, self.top = x, base, line, width, top
        self.starts = [max(0, P[0][0][0][1] - 10)] + [max(P[j][0][0][1] - 5, 0) for j in range(1, len(P))]
    def size(self, rows):
        s = self.top
        while max(sum(tw(w, s) for w, _ in row) + gap(s) * (len(row) - 1) for row in rows) > self.width: s -= 1
        return s
    def page(self, canvas, j, n, op=1, dy=0, delay=0):
        rows = self.pages[j]; size = self.size(rows); flat = [w for row in rows for w in row]; k = 0
        for ri, row in enumerate(rows):
            x = self.x; base = self.base - (len(rows) - 1 - ri) * self.line + dy
            for word, on in row:
                nxt = flat[k + 1][1] if k + 1 < len(flat) else 10 ** 9
                say(canvas, word, size, x, base, n, self.starts[j] + delay + k * 2, on, nxt, lit=(k == 0), op=op)
                x += tw(word, size) + gap(size); k += 1
    def draw(self, canvas, n, op=1, first=False):
        # first: frame one of the short already shows its page (the cover)
        if n < self.starts[0] and not first: return
        j = max([i for i, s in enumerate(self.starts) if s <= n] or [0])
        if j > 0 and n < self.starts[j] + 4:                      # the old page lifts away over four frames
            k = (n - self.starts[j]) / 4; self.page(canvas, j - 1, n, op * (1 - k), -10 * k)
        self.page(canvas, j, n, op, 0, -40 if (first and j == 0) else 1 if j > 0 else 0)

# ---- the person on camera ----------------------------------------------------------------------------------------
@lru_cache(20)
def fade_bottom(h):
    y = (255 * np.array([1 - sm((v / h - .93) / .07) for v in range(h)])).astype('uint8')
    return Image.fromarray(y[:, None]).resize((W, h))
@lru_cache(8)
def last_frame(folder): return max((int(p.stem) for p in Path(folder).glob('[0-9]*.png')), default=0)
def seat(im, grade):
    # grade: saturation, tint (r, g, b), gain, the scene's light colour on the edge, how much of it. Keep the
    # person's own colour (saturation near 1): desaturating them to match a grey scene reads as a dead face.
    sat, tint, gain, sky, amt = grade
    arr = np.asarray(im).astype(np.float32) / 255; rgb = arr[..., :3]; al = arr[..., 3]
    lum = (rgb @ np.array([.299, .587, .114], np.float32))[..., None]
    rgb = np.clip((lum + (rgb - lum) * sat) * np.array(tint, np.float32) * gain, 0, 1)
    dist = cv2.distanceTransform((al > .5).astype(np.uint8), cv2.DIST_L2, 3)
    w = (np.clip(1 - dist / 9, 0, 1) * amt * np.clip((lum[..., 0] - .16) / .22, 0, 1))[..., None]
    arr[..., :3] = np.clip(rgb * (1 - w) + np.array(sky, np.float32) * w, 0, 1)
    return Image.fromarray((arr * 255 + .5).astype('uint8'), 'RGBA')
NEUTRAL = (1.04, (1, 1, 1), 1, (.8, .8, .8), .15)
def person(canvas, folder, idx, geo, fin=1, fout=0, grade=NEUTRAL):
    # folder: cut-out plates NNNN.png (plates.py), 16:9. geo: wide (the plate's drawn width in px), cx (its centre),
    # y (its top). fin 0..1 over the first 18 frames: opacity up over twelve while the focus resolves over eighteen.
    # fout 0..1 over the last ~20: the focus goes first, then the opacity; never a half-faded sharp face.
    blur = 0
    if fout > 0: f = sm(fout); blur = 28 * sm(f / .6); op = (1 - .15 * q(f / .6)) * (1 - q((f - .4) / .6) ** 2.2)
    elif fin < 1: op = ex5(fin * 18 / 12); blur = 28 * (1 - expo((fin * 18 - 4) / 14))
    else: op = 1
    if op < .001: return
    wide = geo['wide']; h = round(wide * 9 / 16); x = round(geo['cx'] - wide * .5 + (1 - op) * 16); y = round(geo['y'] + (1 - op) * 22)
    idx = max(1, min(idx, last_frame(str(folder))))
    with Image.open(Path(folder) / f'{idx:04}.png') as src:
        left = -x * src.width / wide; right = (W - x) * src.width / wide
        im = src.convert('RGBA').resize((W, h), Image.Resampling.LANCZOS, box=(left, 0, right, src.height))
    im.putalpha(ImageChops.multiply(im.getchannel('A'), fade_bottom(h)))
    im = seat(im, grade)
    if blur > .3:   # a true Gaussian on premultiplied colour (PIL's three box passes leave a soft head square)
        arr = np.asarray(im).astype(np.float32) / 255; pm = np.dstack([arr[..., :3] * arr[..., 3:], arr[..., 3]]); pm = cv2.GaussianBlur(pm, (0, 0), blur)
        al = pm[..., 3:]; im = Image.fromarray((np.clip(np.dstack([pm[..., :3] / np.maximum(al, 1e-4), al[..., 0]]), 0, 1) * 255 + .5).astype('uint8'), 'RGBA')
    sh = Image.new('RGBA', im.size, (6, 6, 9, 0)); sh.putalpha(im.getchannel('A').filter(ImageFilter.GaussianBlur(26)).point(lambda v: round(v * .42)))
    put(canvas, sh, 0, y + 10, op); put(canvas, im, 0, y, op)       # a soft contact shade, then the person

def dip(canvas, n, frames, inn=False, out=False, d=18):
    # a section that follows or leads into a dip to dark: 12 frames down, 18 up
    k = (1 - sm(n / d) if inn else 0) + (sm((n - (frames - 12)) / 12) if out else 0)
    if k > .002: put(canvas, Image.new('RGBA', (W, H), (6, 6, 8, 255)), 0, 0, min(1, k))
