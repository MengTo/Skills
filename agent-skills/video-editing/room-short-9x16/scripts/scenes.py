# v4: words set in the scene (Inter Tight): a light line and one heavy phrase, placed per section where the picture
# gives contrast. GFX[name](n) returns frame n's RGBA overlay, a pure function of n.
import json, os, sys
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W, H = 1080, 1920
TAG = os.environ.get('REEL_TAG', '')
PLAN = json.loads(Path(os.environ.get('REEL_PLAN', 'plan.json')).read_text())
TL = json.loads(Path(f'timeline{TAG}.json').read_text()); SEG = {s['name']: s for s in TL['segments']}
SEC = {s['name']: s for s in PLAN['sections']}
FONT = 'fonts/InterTight-Variable.ttf'; WHITE = (250, 248, 242); ORANGE = (255, 122, 40)
q = lambda x: max(0.0, min(1.0, x)); ease = lambda x: 1 - (1 - q(x)) ** 3
@lru_cache(None)
def font(size, wght):
    f = ImageFont.truetype(FONT, size); f.set_variation_by_axes([wght]); return f
def width(text, f, tr): return sum(f.getlength(c) for c in text) + tr * (len(text) - 1)
def put_text(d, x, y, text, f, fill, tr):
    for c in text: d.text((x, y), c, font=f, fill=fill); x += f.getlength(c) + tr
    return x
def layout(name):
    S = SEC[name]; words = SEG[name]['words']; on = [max(0, round(t0 * 60) - 2) for _, t0, _ in words]
    x0, y0 = S.get('at', [70, 300]); maxw = S.get('maxw', 940); pages = []; k = 0
    for pi, lines in enumerate(S['pages']):
        rows = []; y = y0
        for li, line in enumerate(lines):
            heavy = li == len(lines) - 1; ws = line.split()
            k_ = S.get('scale', 1); size = int((150 if heavy else 84) * k_); wg = 800 if heavy else 400; tr = -0.012
            while True:
                f = font(size, wg); sp = f.getlength(' ') * 0.8
                tot = sum(width(w, f, tr * size) for w in ws) + sp * (len(ws) - 1)
                if tot <= maxw or size < 60: break
                size -= 6
            INK = (26, 23, 20) if S.get('ink') == 'dark' else WHITE; col = tuple(S['accent']) if (heavy and S.get('accent')) else INK   # no accent colour unless the plan names one
            x = x0; items = []
            for w in ws: items.append((k, x, w)); x += width(w, f, tr * size) + sp; k += 1
            rows.append((y, size, wg, tr * size, col, items)); y += int(size * (1.0 if heavy else 1.12))
        pages.append(rows)
    starts = [p[0][5][0][0] for p in pages]
    return on, pages, starts
LAY = {n: layout(n) for n in SEG}
def section(name):
    on, pages, starts = LAY[name]; F = SEG[name]['frames']
    def draw(n):
        c = Image.new('RGBA', (W, H)); cur = 0
        if name == 'hook' and n < COVER_END:   # the cover is the first frame: its type holds, then fades before 'can build'
            a = 1 - q((n - (COVER_END - 9)) / 9); ov = COVER if a >= 1 else Image.merge('RGBA', (*COVER.split()[:3], COVER.getchannel('A').point(lambda v: int(v * a))))
            c.alpha_composite(ov); return c
        for i, s in enumerate(starts):
            if n >= on[s] - 3 or i == 0: cur = i
        end = on[starts[cur + 1]] - 3 if cur + 1 < len(pages) else F
        out = 1 - q((n - (end - 4)) / 4) if cur + 1 < len(pages) else 1 - q((n - (F - 3)) / 3)
        layer = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(layer)
        for y, size, wg, tr, col, items in pages[cur]:
            f = font(size, wg)
            for k, x, w in items:
                t = (n - on[k]) / 5 if not (cur == 0 and k == starts[0] and SEG[name]['start'] == 0) else 1
                if t <= 0: continue
                a = int(255 * q(t) * out); put_text(d, x, y + 16 * (1 - ease(t)), w, f, col + (a,), tr)
        if SEC[name].get('ink') != 'dark':
            sh = Image.new('RGBA', (W, H)); sh.paste((0, 0, 0, 255), mask=layer.getchannel('A').point(lambda v: int(v * 0.6))); c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
        c.alpha_composite(layer)
        return c
    return draw
COVER = Image.open('cover/overlay.png').convert('RGBA'); COVER_END = 87
GFX = {n: section(n) for n in SEG}
if __name__ == '__main__':
    import subprocess as sp
    jobs = [a.split(':') for a in sys.argv[2:]]; sheet = Image.new('RGB', (W * len(jobs), H))
    for j, (name, n) in enumerate(jobs):
        n = int(n); raw = sp.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-ss', f'{n / 60:.6f}', '-i', f'base-{name}.mp4', '-frames:v', '1', '-vf', 'scale=1080:1920:in_color_matrix=bt709:out_range=full', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
        im = Image.frombytes('RGB', (W, H), raw).convert('RGBA'); im.alpha_composite(GFX[name](n)); sheet.paste(im.convert('RGB'), (W * j, 0))
    if len(jobs) > 3: sheet = sheet.resize((sheet.width // 3, H // 3), Image.Resampling.LANCZOS)
    sheet.save(sys.argv[1], quality=90)
