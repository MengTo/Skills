#!/usr/bin/env python3
"""realign-phrases.py <voice audio> <words.json in> <words.json out>
Word times for a voice whose words are already known (the same list, the same order, so every
T.name stays), placed phrase by phrase. align-voice.py heard the whole voice in one pass, and
whisper's times drift there: a sentence's first words were often put at the end of the phrase
before, 0.3 to 1.3 s early ("is nine. So where is it now?" sat a second early in draft 4).
Here the voice is split at its real pauses (silencedetect, -40 dB, 0.2 s), whisper hears each
phrase on its own, the script's words are matched to what it heard (numbers spelled out), and:
- a matched word takes whisper's time inside its phrase, clamped to the phrase;
- the first word of a phrase starts where the sound starts, the last ends where it stops;
- words heard differently ("Sea Dream", "fill") take the span of what was heard instead;
- words not heard at all are spread by letters between their neighbours.
Times are in the voice file's own clock, like the words it reads."""
import sys, re, json, subprocess, tempfile, os, difflib

audio, win, wout = sys.argv[1:4]
model = os.path.expanduser('~/Library/Caches/whisper.cpp/ggml-large-v3-turbo-q5_0.bin')
W = json.load(open(win))
tmp = tempfile.mkdtemp()

# 1. phrases: the sound between pauses of 0.2 s or more
log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', audio, '-af', 'silencedetect=noise=-40dB:d=0.2', '-f', 'null', '-'], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio], capture_output=True, text=True).stdout)
ph, prev = [], 0.0
for a, b in zip(starts, ends + [dur] * (len(starts) - len(ends))):
    if a - prev > 0.1: ph.append([prev, a])
    prev = b
if dur - prev > 0.1: ph.append([prev, dur])
# edges from a finer pass (pauses of 0.05 s), so a phrase stops where its sound does even when
# the silence after it is too short to split on (the voice's very end has 0.15 s)
flog = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', audio, '-af', 'silencedetect=noise=-40dB:d=0.05', '-f', 'null', '-'], capture_output=True, text=True).stderr
fs_ = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', flog)]
fe_ = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', flog)] + [dur]
for p in ph:
    for s, e in zip(fs_, fe_):
        if p[0] < s < p[1] <= e + 1e-3: p[1] = s
        if s <= p[0] + 1e-3 < e < p[1]: p[0] = e

# 2. whisper on each phrase, one model load for all
PAD = 0.08
files = []
for i, (a, b) in enumerate(ph):
    f = f'{tmp}/{i:04d}.wav'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{max(0, a - PAD):.3f}', '-to', f'{b + PAD:.3f}', '-i', audio, '-ar', '16000', '-ac', '1', f], check=True)
    files.append(f)
subprocess.run(['whisper-cli', '-m', model, '-l', 'en', '-np', '-ml', '1', '-sow', '-oj', *files], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

ones = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
tens = '_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split()
def nw(n):
    n = int(n)
    if n < 20: return ones[n]
    if n < 100: return tens[n // 10] + ('' if n % 10 == 0 else ' ' + ones[n % 10])
    return ones[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' and ' + nw(n % 100))
def spell(t):
    t = re.sub(r'(\d+)\.(\d+)', lambda m: nw(m.group(1)) + ' point ' + ' '.join(ones[int(c)] for c in m.group(2)), t)
    t = re.sub(r'(\d+)k\b', lambda m: nw(m.group(1)) + 'k', t, flags=re.I)
    return re.sub(r'\d+', lambda m: ' ' + nw(m.group(0)) + ' ', t)
norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())

H = []  # heard words: [norm, start, end, phrase]
for i, f in enumerate(files):
    a, b = ph[i]
    t0 = max(0, a - PAD)
    for s in json.load(open(f + '.json'))['transcription']:
        txt = s['text'].strip()
        if not txt: continue
        parts = [p for p in spell(txt).split() if norm(p)]
        x0, x1 = t0 + s['offsets']['from'] / 1000, t0 + s['offsets']['to'] / 1000
        x0, x1 = min(max(x0, a), b), min(max(x1, a), b)
        for k, p in enumerate(parts):  # a number spelled out shares its token's span
            H.append([norm(p), x0 + (x1 - x0) * k / len(parts), x0 + (x1 - x0) * (k + 1) / len(parts), i])

# 3. the script's words against what was heard
S = [norm(spell(w[0])) or 'w' for w in W]
# a script word may be several heard words once numbers are spelled ("3D" -> "three d"): compare word by word
Sx, owner = [], []
for j, w in enumerate(W):
    for p in spell(w[0]).split():
        if norm(p): Sx.append(norm(p)); owner.append(j)
sm = difflib.SequenceMatcher(None, Sx, [h[0] for h in H], autojunk=False)
T = [None] * len(W)
def put(j, a, b, p):
    if T[j] is None: T[j] = [a, b, p]
    else: T[j][1] = max(T[j][1], b)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(i2 - i1): h = H[j1 + k]; put(owner[i1 + k], h[1], h[2], h[3])
    elif tag == 'replace' and len({H[j][3] for j in range(j1, j2)}) == 1:
        a, b, p = H[j1][1], H[j2 - 1][2], H[j1][3]
        js = sorted({owner[i] for i in range(i1, i2)})
        size = [max(3, len(S[j])) for j in js]; tot = sum(size); x = a
        for j, s in zip(js, size):
            d = (b - a) * s / tot
            if T[j] is None: T[j] = [x, x + d, p]
            x += d
# words never placed: spread by letters between their neighbours
i = 0
while i < len(W):
    if T[i] is None:
        j = i
        while j < len(W) and T[j] is None: j += 1
        a = T[i - 1][1] if i > 0 else ph[0][0]
        b = T[j][0] if j < len(W) else ph[-1][1]
        p = T[i - 1][2] if i > 0 else 0
        size = [max(3, len(S[k])) for k in range(i, j)]; tot = sum(size); x = a
        for k in range(i, j):
            d = (b - a) * size[k - i] / tot; T[k] = [x, x + d, p]; x += d
        i = j
    else: i += 1
# 4. phrase edges from the sound itself
for k in range(len(W)):
    p = T[k][2]
    if k == 0 or T[k - 1][2] != p:
        if abs(T[k][0] - ph[p][0]) < 0.35: T[k][0] = ph[p][0]
    if k == len(W) - 1 or T[k + 1][2] != p:
        T[k][1] = ph[p][1]
for k in range(1, len(W)):  # keep the order
    if T[k][0] < T[k - 1][0]: T[k][0] = T[k - 1][0]
out = [[w[0], round(t[0], 3), round(max(t[1], t[0] + 0.04), 3)] for w, t in zip(W, T)]
json.dump(out, open(wout, 'w'))
moved = [(k, W[k][0], W[k][1], out[k][1]) for k in range(len(W)) if abs(W[k][1] - out[k][1]) > 0.15]
print(f'{len(ph)} phrases, {len(W)} words, {sum(1 for o in sm.get_opcodes() if o[0] == "equal")} matched runs; {len(moved)} words moved more than 0.15 s')
for m in moved: print(f'  {m[0]:4d} {m[1]:<14} {m[2]:8.3f} -> {m[3]:8.3f} ({m[3] - m[2]:+.2f})')
