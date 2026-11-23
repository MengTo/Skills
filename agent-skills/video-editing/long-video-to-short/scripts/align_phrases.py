# Word times for one voiced paragraph, exact where it matters: at the start of every phrase.
#   python align_phrases.py voice/A.mp3 voice/A.txt voice/A-aligned.json [--syllables syl.json]
# whisper's word stamps drift near pauses (a sentence's last word lands on the next one), so the paragraph is cut
# into its phrases (the runs of sound between pauses), each phrase is transcribed alone to count its words, and
# the words share the phrase's real bounds by syllables. A phrase's first word therefore starts on its sound.
# Needs ffmpeg and whisper.cpp's whisper-cli, with WHISPER_MODEL set to a ggml model (small is enough).
import json, re, wave, subprocess as sp, numpy as np, tempfile, os, sys
R = 16000; M = os.environ.get('WHISPER_MODEL')
if not M: sys.exit('set WHISPER_MODEL to a whisper.cpp ggml model file')
audio, text, out_path = sys.argv[1:4]
SY = json.load(open(sys.argv[sys.argv.index('--syllables') + 1])) if '--syllables' in sys.argv else {}
# syllables for what a vowel count gets wrong, keyed by the word in lower case without punctuation: {"gpt": 3, "url": 3, "3d": 2}
N_ = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())
def load(p): return np.frombuffer(sp.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(R), '-f', 'f32le', '-'], capture_output=True).stdout, '<f4').copy()
def whisper(x):
    d = tempfile.mkdtemp(); p = os.path.join(d, 'p.wav'); y = np.concatenate([np.zeros(R // 2, 'f'), x, np.zeros(R // 2, 'f')])
    w = wave.open(p, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(R); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    sp.run(['whisper-cli', '-m', M, '-f', p, '-ml', '1', '-sow', '-ojf', '-of', os.path.join(d, 'p'), '-np'], capture_output=True)
    return [t['text'].strip() for t in json.load(open(os.path.join(d, 'p.json')))['transcription'] if N_(t['text'])]
def syl(w):
    n = N_(w); return SY.get(n, max(1, len(re.findall(r'[aeiouy]+', re.sub(r'e$', '', n))))) + (.6 if w[-1] in '.,' else 0) + .25
x = load(audio); e = np.sqrt(np.convolve(x * x, np.ones(320) / 320, 'same')); loud = e >= e.max() * .03
runs = []; s = None
for i, v in enumerate(loud):
    if v and s is None: s = i
    if not v and s is not None: runs.append([s, i]); s = None
if s is not None: runs.append([s, len(x)])
ph = [runs[0]]
for a, b in runs[1:]:
    if a - ph[-1][1] < .10 * R: ph[-1][1] = b       # a gap under 100 ms is inside a phrase
    else: ph.append([a, b])
ph = [p for p in ph if p[1] - p[0] > .05 * R]
full = open(text).read().split()                    # the script as it was voiced, word for word
out = []; i = 0
for pi, (a, b) in enumerate(ph):
    ws = whisper(x[max(0, a - 800):b + 800]); n = len(ws)
    # how many of the paragraph's words this phrase holds: whisper's count, corrected by matching its last word
    last = N_(ws[-1]) if ws else ''; cand = [j for j in range(i + 1, min(len(full), i + n + 3) + 1) if N_(full[j - 1]) == last]
    j = min(cand, key=lambda j: abs(j - i - n)) if cand else min(len(full), i + max(1, n))
    j = max(i + 1, min(j, len(full) - (len(ph) - 1 - pi)))   # every later phrase keeps at least a word
    if pi == len(ph) - 1: j = len(full)
    words = full[i:j]; m = len(words); span = (b - a) / R
    L = np.cumsum([0] + [syl(w) for w in words]); rel = [min(r, span * .97) for r in L[:-1] / L[-1] * span]
    for k in range(1, m): rel[k] = max(rel[k], rel[k - 1] + .05)
    for k, w in enumerate(words): out.append([w, round(a / R + rel[k], 3), round(a / R + (rel[k + 1] if k + 1 < m else span), 3)])
    i = j
assert i == len(full), (i, len(full))
json.dump(out, open(out_path, 'w'))
print(len(ph), 'phrases |', ' '.join('%s@%.2f' % (w, s) for w, s, _ in out))
