#!/usr/bin/env python3
"""Build instant-clone samples from a build_ref.py segments.tsv: the cleanest segments of one speaker, ~180 s in two files.
usage: make_ivc.py SEGMENTS.tsv OUT_DIR [--seconds 180] [--exclude "a phrase to leave out"]...
- keeps label 'self' segments of 6-15 s, highest similarity first, until --seconds;
- cuts each from the 48 kHz source (the .16k.wav name with .wav), 20/30 ms fades and 0.35 s of silence after each;
- writes OUT_DIR/ivc-1.mp3 and ivc-2.mp3 (highpass 70 Hz, -18 LUFS, MP3 320k, 44.1 kHz, mono).
Leave out the sentence of any test line you will score against, so the test stays fair."""
import argparse, csv, os, subprocess
ap = argparse.ArgumentParser(); ap.add_argument('tsv'); ap.add_argument('out'); ap.add_argument('--seconds', type=float, default=180)
ap.add_argument('--exclude', action='append', default=[]); a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
rows = [r for r in csv.DictReader(open(a.tsv), delimiter='\t') if r['label'] in ('self', 'him') and 6 <= float(r['end']) - float(r['start']) <= 15
        and not any(x.lower() in r['text'].lower() for x in a.exclude)]
rows.sort(key=lambda r: -float(r['sim'])); pick, tot = [], 0.0
for r in rows:
    if tot >= a.seconds: break
    pick.append(r); tot += float(r['end']) - float(r['start'])
pick.sort(key=lambda r: (r['rec'], float(r['start'])))
halves, acc = [[], []], 0.0
for r in pick:
    halves[0 if acc < tot / 2 else 1].append(r); acc += float(r['end']) - float(r['start'])
for n, part in enumerate(halves, 1):
    segs = []
    for i, r in enumerate(part):
        s, e = float(r['start']), float(r['end']); d = e - s; out = f'{a.out}/.s{n}_{i:02d}.wav'
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{s:.2f}', '-t', f'{d:.2f}', '-i', r['rec'].replace('.16k.wav', '.wav'),
                        '-ac', '1', '-ar', '48000', '-af', f'afade=t=in:d=0.02,afade=t=out:st={max(0, d - 0.03):.2f}:d=0.03,apad=pad_dur=0.35', out], check=True)
        segs.append(out)
    lst = f'{a.out}/.l{n}.txt'; open(lst, 'w').write(''.join(f"file '{os.path.basename(x)}'\n" for x in segs))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-af', 'highpass=f=70,loudnorm=I=-18:TP=-2:LRA=9',
                    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '320k', f'{a.out}/ivc-{n}.mp3'], check=True)
    for x in segs + [lst]: os.remove(x)
    print(f'{a.out}/ivc-{n}.mp3: {len(part)} segments, {sum(float(r["end"]) - float(r["start"]) for r in part):.0f} s')
