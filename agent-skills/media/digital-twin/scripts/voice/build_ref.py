#!/usr/bin/env python3
"""Split your recordings into your own speech and other people's, by speaker embedding.

usage: build_ref.py OUT_DIR SEED_WAV:START:END REC1.16k.wav [REC2.16k.wav ...]
Each REC needs its whisper CSV next to it (REC.csv: start,end,text in ms).
- Seed: the span START..END seconds of SEED_WAV is only you (an opening talk, a solo intro). Its segments make the seed centroid.
- Every segment of 2.5-15 s is embedded and scored against the seed. >= 0.80 is you ('self'), <= 0.62 is someone else,
  and anything in between is left out.
Writes OUT_DIR/segments.tsv (rec, start, end, sim, label, text) and prints the totals."""
import csv, os, sys
import numpy as np
import soundfile as sf
from resemblyzer import VoiceEncoder, preprocess_wav

out = sys.argv[1]; seed_spec = sys.argv[2]; recs = sys.argv[3:]
os.makedirs(out, exist_ok=True)
enc = VoiceEncoder(verbose=False)

def segs(rec):
    rows = []
    with open(rec + '.csv') as fh:
        for r in csv.DictReader(fh):
            s, e = int(r['start']) / 1000, int(r['end']) / 1000
            if 2.5 <= e - s <= 15: rows.append((s, e, r['text'].strip().strip('"')))
    return rows

audio = {}
def cut(rec, s, e):
    if rec not in audio: audio[rec] = sf.read(rec, dtype='float32')
    x, sr = audio[rec]; return x[int(s * sr):int(e * sr)], sr

def emb(rec, s, e):
    x, sr = cut(rec, s, e)
    w = preprocess_wav(x, source_sr=sr)
    return enc.embed_utterance(w) if len(w) > sr * 1.0 else None

seed_wav, a, b = seed_spec.split(':'); a, b = float(a), float(b)
E = [emb(seed_wav, s, e) for s, e, _ in segs(seed_wav) if a <= s and e <= b]
E = np.array([x for x in E if x is not None]); c = E.mean(0); c /= np.linalg.norm(c)
print(f'seed: {len(E)} segments of {os.path.basename(seed_wav)} {a:.0f}-{b:.0f} s')

tot = {'self': 0.0, 'other': 0.0, 'unsure': 0.0}
with open(f'{out}/segments.tsv', 'w') as fh:
    fh.write('rec\tstart\tend\tsim\tlabel\ttext\n')
    for rec in recs:
        n = {'self': 0, 'other': 0, 'unsure': 0}
        for s, e, t in segs(rec):
            v = emb(rec, s, e)
            if v is None: continue
            sim = float(np.dot(v, c)); lab = 'self' if sim >= 0.80 else 'other' if sim <= 0.62 else 'unsure'
            n[lab] += 1; tot[lab] += e - s
            fh.write(f'{rec}\t{s:.2f}\t{e:.2f}\t{sim:.3f}\t{lab}\t{t}\n')
        print(f'{os.path.basename(rec)}: self {n["self"]}, other {n["other"]}, unsure {n["unsure"]}')
print('minutes: ' + ', '.join(f'{k} {v / 60:.1f}' for k, v in tot.items()))
