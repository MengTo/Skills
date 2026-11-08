#!/usr/bin/env python3
"""Turn the 'self' segments of a build_ref.py segments.tsv into ~9-minute training files of only your speech.
usage: make_dataset.py SEGMENTS.tsv PREFIX     -> dataset/PREFIX-01.mp3 ... (48 kHz cut, highpass 70 Hz, -18 LUFS, MP3 320k)"""
import csv, os, subprocess, sys
tsv, prefix = sys.argv[1], sys.argv[2]
os.makedirs('dataset', exist_ok=True)
rows = [r for r in csv.DictReader(open(tsv), delimiter='\t') if r['label'] in ('self', 'him')]
by = {}
for r in rows: by.setdefault(r['rec'], []).append(r)
n = 0; tot = 0.0
def flush(src, chunk):
    global n
    if not chunk: return
    n += 1; segs = []
    for i, (s, e) in enumerate(chunk):
        seg = f'dataset/.seg{n:02d}_{i:03d}.wav'; d = e - s
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{s:.2f}', '-t', f'{d:.2f}', '-i', src, '-ac', '1', '-ar', '48000',
                        '-af', f'afade=t=in:d=0.02,afade=t=out:st={max(0, d - 0.03):.2f}:d=0.03', seg], check=True)
        segs.append(seg)
    lst = f'dataset/.list{n:02d}.txt'
    open(lst, 'w').write(''.join(f"file '{os.path.basename(x)}'\n" for x in segs))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-af', 'highpass=f=70,loudnorm=I=-18:TP=-2:LRA=9',
                    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '320k', f'dataset/{prefix}-{n:02d}.mp3'], check=True)
    for x in segs + [lst]: os.remove(x)
for rec, rs in by.items():
    src = rec.replace('.16k.wav', '.wav'); rs.sort(key=lambda r: float(r['start'])); chunk = []; dur = 0
    for r in rs:
        s, e = float(r['start']), float(r['end']); chunk.append((s, e)); dur += e - s; tot += e - s
        if dur >= 540: flush(src, chunk); chunk = []; dur = 0
    flush(src, chunk)
print(f'{n} files, {tot / 60:.1f} min of your speech -> dataset/{prefix}-*.mp3')
