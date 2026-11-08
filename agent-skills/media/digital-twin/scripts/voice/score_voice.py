#!/usr/bin/env python3
"""Score how close speech is to YOUR real voice, out of 10, with the ECAPA-TDNN speaker model (SpeechBrain,
VoxCeleb-trained), which holds up far better than Resemblyzer to denoising, levelling and TTS studio sound.

usage: score_voice2.py REF_DIR test1.wav [test2.mp3 ...]
REF_DIR has real/ (your clips: the centroid), heldout/ (your own clips from another day or recording: defines 10) and
other/ (other people, ideally from the same recordings and mic: defines 0). 20-30 clips of 3-10 s each work.
Every clip, references included, goes through the same chain first: 16 kHz mono, 80 Hz-7.6 kHz band, loudness
normalised, so a channel difference can't pass for a speaker difference.
- Similarity: cosine to the real/ centroid, mapped so held-out mean = 10 and other mean = 0 (clipped 0-10).
- Pitch: median F0; 10 inside your own clips' p10-p90 range (computed from real/ + heldout/), 0 at 25 % beyond it.
- Score = 0.7 x similarity + 0.3 x pitch.
Needs Python 3.10+ with speechbrain and torchaudio (pip install speechbrain torchaudio), and ffmpeg.
Clips under ~5 s score low whatever the voice: score 7-10 s lines."""
import glob, os, subprocess, sys, warnings
warnings.filterwarnings('ignore')
import numpy as np, torch
from speechbrain.inference.speaker import EncoderClassifier

CHAIN = 'highpass=f=80,lowpass=f=7600,loudnorm=I=-20:TP=-2'
def load(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-af', CHAIN, '-ac', '1', '-ar', '16000',
                          '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def f0_median(x, sr=16000):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    fr, hop, ps = 640, 320, []
    for i in range(0, len(x) - fr, hop):
        w = x[i:i + fr]
        if np.sqrt((w ** 2).mean()) < 0.03: continue
        w = w - w.mean(); c = np.correlate(w, w, 'full')[fr - 1:]; lo, hi = sr // 300, sr // 70
        k = np.argmax(c[lo:hi]) + lo
        if c[k] > 0.3 * c[0]: ps.append(sr / k)
    return float(np.median(ps)) if ps else float('nan')

model = EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb',
                                       savedir=os.path.expanduser('~/.cache/speechbrain-ecapa'), run_opts={'device': 'cpu'})
def emb(path):
    x = torch.from_numpy(load(path)).unsqueeze(0)
    with torch.no_grad(): e = model.encode_batch(x).squeeze().numpy()
    return e / np.linalg.norm(e)

def clips(d):
    return sorted(glob.glob(os.path.join(d, '*.wav')) + glob.glob(os.path.join(d, '*.mp3')))

ref = sys.argv[1]; tests = sys.argv[2:]
real, held, other = clips(f'{ref}/real'), clips(f'{ref}/heldout'), clips(f'{ref}/other')
c = np.array([emb(p) for p in real]).mean(0); c /= np.linalg.norm(c)
cos = lambda p: float(np.dot(emb(p), c))
s_held = np.mean([cos(p) for p in held]); s_other = np.mean([cos(p) for p in other])
f0s = np.array([f0_median(load(p)) for p in real + held]); f0s = f0s[~np.isnan(f0s)]
f0_real = float(np.median(f0s)); f0_lo, f0_hi = np.percentile(f0s, 10), np.percentile(f0s, 90)
def pitch_score(f):
    # 10 inside your own clips' p10-p90 range; falls to 0 at 25 % beyond it
    if f0_lo <= f <= f0_hi: return 10.0
    edge = f0_lo if f < f0_lo else f0_hi
    return float(np.clip(10 - 10 * abs(np.log(f / edge)) / np.log(1.25), 0, 10))
print(f'calibration (ECAPA): your held-out {s_held:.3f} (=10), other people {s_other:.3f} (=0), your pitch {f0_real:.0f} Hz (your clips p10-p90 {f0_lo:.0f}-{f0_hi:.0f})')
print(f"{'clip':40} {'cos':>6} {'sim/10':>7} {'F0':>6} {'pitch/10':>8} {'SCORE':>6}")
for p in tests:
    s = cos(p); sim = float(np.clip(10 * (s - s_other) / (s_held - s_other), 0, 10))
    f = f0_median(load(p)); pitch = pitch_score(f)
    print(f'{os.path.basename(p)[:40]:40} {s:6.3f} {sim:7.1f} {f:6.0f} {pitch:8.1f} {0.7 * sim + 0.3 * pitch:6.1f}')
