# The sections' pictures, drawn from plan.json and timeline<tag>.json. Copy this into the project and add each
# section's own graphics (a prompt card, a picture, a count) where marked: GFX[name](n) returns frame n's RGBA
# overlay for that section, a pure function of n.
#   python scenes.py out.jpg name:frame [name:frame ...]    finished stills over the backgrounds, side by side
import json, os, sys
from pathlib import Path
from PIL import Image
import reel_draw as R
from reel_draw import W, H, q, CREAM, FIRE

TAG = os.environ.get('REEL_TAG', '')
PLAN = json.loads(Path(os.environ.get('REEL_PLAN', 'plan.json')).read_text())
TL = json.loads(Path(f'timeline{TAG}.json').read_text()); SEG = {s['name']: s for s in TL['segments']}
SEC = {s['name']: s for s in PLAN['sections']}
CAPS = {n: R.Captions(SEG[n]['words'], SEC[n]['pages']) for n in SEG}
COL = {'cream': CREAM, 'fire': FIRE}
def at(name, k): return CAPS[name].on[k]            # the frame the k-th spoken word of a section lights on

def on_camera(c, n, name):
    cam = SEG[name].get('camera'); F = SEG[name]['frames']
    if not cam: return
    geo = PLAN['camera'][cam['line']]; folder = Path('plates') / cam['line']
    if not folder.exists(): return                   # until the clip is approved and cut out, the part plays without the person
    fps = float((folder / 'fps').read_text())
    cut_in = SEC[name]['camera'].get('enter', True); cut_out = SEC[name]['camera'].get('leave', True)
    R.person(c, folder, round((cam['offset'] + n / 60) * fps) + 1, geo,
             fin=q(n / 18) if cut_in else 1, fout=q((n - (F - 20)) / 20) if cut_out else 0,
             grade=tuple(map(lambda v: tuple(v) if isinstance(v, list) else v, PLAN['grades'][geo['grade']])) if 'grade' in geo else R.NEUTRAL)

def section(name):
    S = SEC[name]; F = SEG[name]['frames']; first = SEG[name]['start'] == 0
    def draw(n):
        c = Image.new('RGBA', (W, H))
        if S.get('titles'): R.put(c, R.title_shade, 0, 0, 1)
        for i, t in enumerate(S.get('titles', [])):
            # a title lands six frames before the word it names and leaves three frames before the next one lands
            a = 0 if t.get('word') is None else at(name, t['word']) - 6
            b = at(name, t['until']) - 9 if t.get('until') is not None else F - 2
            R.heading(c, n, a, b, t.get('y', 232), [(p[0], COL[p[1]]) for p in t['parts']], t.get('size', 200), first=first and a == 0)
        # ---- this section's own graphics go here ----
        on_camera(c, n, name)
        R.put(c, R.base_shade, 0, 0, 1)
        CAPS[name].draw(c, n, 1 - q((n - (F - 4)) / 4), first=first)
        return c
    return draw
GFX = {n: section(n) for n in SEG}

if __name__ == '__main__':
    import subprocess as sp
    jobs = [a.split(':') for a in sys.argv[2:]]; sheet = Image.new('RGB', (W * len(jobs), H))
    for j, (name, n) in enumerate(jobs):
        n = int(n); raw = sp.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-ss', f'{n / 60:.6f}', '-i', f'base-{name}.mp4', '-frames:v', '1',
                                           '-vf', 'scale=1080:1920:in_color_matrix=bt709:out_range=full', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
        im = Image.frombytes('RGB', (W, H), raw).convert('RGBA'); im.alpha_composite(GFX[name](n)); sheet.paste(im.convert('RGB'), (W * j, 0))
    if len(jobs) > 3: sheet = sheet.resize((sheet.width // 3, H // 3), Image.Resampling.LANCZOS)
    sheet.save(sys.argv[1], quality=90)
