# The short's sound and its timeline from plan.json: python build_voice.py [plan.json] [tag]
# Reads voice/<para>.mp3 and voice/<para>-aligned.json (align_phrases.py), levels the paragraphs to the first one,
# cuts each section out of its paragraph in the pauses, and writes voice<tag>.wav (48 kHz mono) and
# timeline<tag>.json: every section's first frame, length in frames (60 fps) and its words' times from that frame.
# Paragraphs stay whole wherever someone is on camera, so a talking clip made from the same file keeps its lip sync.
import json, sys, wave, numpy as np, subprocess as sp
from pathlib import Path
plan = json.loads(Path(sys.argv[1] if len(sys.argv) > 1 else 'plan.json').read_text()); tag = sys.argv[2] if len(sys.argv) > 2 else ''
R = 48000; SPF = R // 60
def load(p): return np.frombuffer(sp.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(R), '-f', 'f32le', '-'], capture_output=True).stdout, '<f4').copy()
def rms(x):
    e = np.sqrt(np.convolve(x * x, np.ones(960) / 960, 'same')); return float(np.sqrt((x[e > .02] ** 2).mean()))
def fade(y, f=int(.012 * R)): y = y.copy(); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y
paras = list(dict.fromkeys(s['para'] for s in plan['sections']))
X = {k: load(f'voice/{k}.mp3') for k in paras}; ref = rms(X[paras[0]])
for k in X: X[k] *= ref / rms(X[k])
WD = {k: json.loads(Path(f'voice/{k}-aligned.json').read_text()) for k in paras}
out = []; tl = []; N = 0; carry = 0
for s in plan['sections']:
    # in / out: seconds in the paragraph, both inside pauses (out null = its end). words: [first, last exclusive].
    # tail: silence added after it. fade: 12 ms fades, for the two sides of a removed word.
    x = X[s['para']]; a = s.get('in', 0); b = s.get('out') or len(x) / R
    y = x[int(a * R):int(b * R)]
    if s.get('fade'): y = fade(y)
    y = np.concatenate([y, np.zeros(int(s.get('tail', 0) * R), 'f')])
    fr = int(round((len(y) + carry) / SPF)); carry = len(y) + carry - fr * SPF   # frame boundaries follow the sound, never more than half a frame off
    i, j = s.get('words', [0, len(WD[s['para']])]); at = sum(map(len, out)) / R; shift = at - N / 60 - a
    seg = dict(name=s['name'], start=N, frames=fr, words=[[w, round(t0 + shift, 3), round(t1 + shift, 3)] for w, t0, t1 in WD[s['para']][i:j]])
    if 'camera' in s:   # line: the talking clip this part belongs to; line_at: where that clip's sound starts in the paragraph
        seg['camera'] = dict(line=s['camera']['line'], offset=round(a - s['camera'].get('line_at', 0), 3))
    out.append(y); tl.append(seg); N += fr
y = np.concatenate(out); y = np.concatenate([y, np.zeros(max(0, N * SPF - len(y)), 'f')])[:N * SPF]
w = wave.open(f'voice{tag}.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(R); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
Path(f'timeline{tag}.json').write_text(json.dumps(dict(end=N, segments=tl), indent=1))
for s in tl: print('%-10s start %4d frames %4d (%.2f s)' % (s['name'], s['start'], s['frames'], s['frames'] / 60), ' '.join('%s@%d' % (w[0], round(w[1] * 60)) for w in s['words']))
print('total %.2f s' % (N / 60))
