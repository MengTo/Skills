#!/usr/bin/env python3
"""Scan training files in 6-s windows with ECAPA against your real/ centroid; report how much of each file is not clearly you.
usage: scan_dataset.py REF_DIR file1.mp3 ...   (same chain and calibration as score_voice2.py)"""
import glob, os, subprocess, sys, warnings
warnings.filterwarnings('ignore')
import numpy as np, torch
from speechbrain.inference.speaker import EncoderClassifier
CHAIN = 'highpass=f=80,lowpass=f=7600,loudnorm=I=-20:TP=-2'
def load(p):
    raw = subprocess.run(['ffmpeg','-loglevel','error','-i',p,'-af',CHAIN,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).copy()
m = EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', savedir=os.path.expanduser('~/.cache/speechbrain-ecapa'), run_opts={'device':'cpu'})
def emb(x):
    with torch.no_grad(): e = m.encode_batch(torch.from_numpy(x).unsqueeze(0)).squeeze().numpy()
    return e/np.linalg.norm(e)
ref = sys.argv[1]; cl = lambda d: sorted(glob.glob(f'{ref}/{d}/*.wav')+glob.glob(f'{ref}/{d}/*.mp3'))
c = np.mean([emb(load(p)) for p in cl('real')],0); c/=np.linalg.norm(c)
held = np.mean([float(emb(load(p))@c) for p in cl('heldout')]); oth = np.mean([float(emb(load(p))@c) for p in cl('other')])
print(f'held-out {held:.3f}=10  other {oth:.3f}=0')
for p in sys.argv[2:]:
    x = load(p); W = 16000*6; s = []
    for i in range(0, len(x)-W, W):
        w = x[i:i+W]
        if np.sqrt((w**2).mean()) < 0.01: continue
        s.append(10*(float(emb(w)@c)-oth)/(held-oth))
    s = np.array(s); bad = (s < 4).mean()*100; weak = ((s>=4)&(s<7)).mean()*100
    worst = ', '.join(f'{int(t*6)//60}:{int(t*6)%60:02d}' for t in np.argsort(s)[:3])
    print(f'{os.path.basename(p):24} windows {len(s):3}  median {np.median(s):4.1f}  not-you(<4) {bad:4.1f}%  weak(4-7) {weak:4.1f}%  worst at {worst}')
