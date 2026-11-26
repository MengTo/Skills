# Caption onsets against the sound, measured on the rendered file: python sync_check.py short.mp4 [timeline.json]
# For every word that follows a pause: the frame its caption lights on, minus where its sound starts, in ms.
# Pass: every one between about 20 and 70 ms early, none late (a late highlight reads as lag).
import json, sys, numpy as np, subprocess as sp
V = json.load(open(sys.argv[2] if len(sys.argv) > 2 else 'timeline.json'))
x = np.frombuffer(sp.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', sys.argv[1], '-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], capture_output=True).stdout, '<f4')
env = np.convolve(np.abs(x), np.ones(40) / 40, 'same'); thr = env.max() * .06; out = []
for s in V['segments']:
    ws = s['words']
    for i, (w, a, b) in enumerate(ws):
        if i and a - ws[i - 1][2] < .12: continue
        cap = s['start'] / 60 + max(0, round(a * 60) - 2) / 60; lo = max(0, int((cap - .25) * 8000)); seg = env[lo:int((cap + .25) * 8000)]
        qs = np.where(seg < thr)[0]; qs = qs[qs < int(.25 * 8000) + 500]
        if len(qs): out.append((s['name'], w, round(cap, 3), round((lo + qs.max()) / 8000, 3)))
for n, w, c, snd in out: print('%-10s %-14s caption %.3f sound %.3f  %+d ms' % (n, w, c, snd, round((c - snd) * 1000)))
d = np.array([round((c - s) * 1000) for *_, c, s in out]); print('words after a pause:', len(d), 'median %+d ms, range %+d to %+d ms' % (np.median(d), d.min(), d.max()))
