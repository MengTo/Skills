# Every frame's words must sit inside the centred 3:4 area of the 9:16 frame (y 240 to 1680 of 1920), which is what
# Instagram's grid and profile show. python safe_area.py [--tag d] [--margin 10]  -> exit 1 names the sections outside.
import sys, os
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
TAG = arg('--tag', ''); M = int(arg('--margin', 10)); os.environ['REEL_TAG'] = TAG
if TAG and os.path.exists(f'plan-{TAG}.json'): os.environ.setdefault('REEL_PLAN', f'plan-{TAG}.json')
sys.path.insert(0, os.getcwd())
import scenes as S
TOP, BOT = (S.H - S.W * 4 // 3) // 2 + M, (S.H + S.W * 4 // 3) // 2 - M; bad = 0
for name, seg in S.SEG.items():
    lo, hi = S.H, 0
    for n in range(0, seg['frames'], 2):
        bb = S.GFX[name](n).getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        if bb and bb[3] - bb[1] < S.H * 0.4: lo, hi = min(lo, bb[1]), max(hi, bb[3])   # a full-height gradient (the cover's) is not text
    ok = lo >= TOP and hi <= BOT; bad += not ok
    print(f"{'ok  ' if ok else 'FAIL'} {name:10s} text y {lo} to {hi}  (allowed {TOP} to {BOT})")
sys.exit(1 if bad else 0)
