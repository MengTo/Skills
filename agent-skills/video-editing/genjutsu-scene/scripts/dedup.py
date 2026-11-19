#!/usr/bin/python3
# Sync Lipsync 3 in "remap" mode stretches a short clip to the audio by REPEATING frames (a 6.04 s clip for a 6.40 s line came
# back 154 frames with 9 exact repeats, one every ~17 frames), which shows as a hitch every 0.7 s at 60 fps. This drops the
# repeats and spreads the unique frames evenly over the audio's length (mouth timing moves at most ~34 ms, mean ~12 ms).
# usage: dedup.py SYNC.mp4 OUT.mp4 [--dur 6.4] [--thresh 0.3]
#   --dur defaults to the audio stream's duration in SYNC.mp4. Prints the repeats found, the drift, and the new frame rate
#   (pass that rate to lipsync.py / phon.py / gaze.py as N/dur).
import argparse, json, os, shutil, subprocess, tempfile, numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--dur', type=float)
ap.add_argument('--thresh', type=float, default=0.3); a = ap.parse_args()
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,r_frame_rate,duration', '-of', 'json', a.src],
                               capture_output=True, text=True).stdout)['streams']
v = next(s for s in pr if s['codec_type'] == 'video'); au = next((s for s in pr if s['codec_type'] == 'audio'), None)
num, den = (float(x) for x in v['r_frame_rate'].split('/')); fps = num / den
dur = a.dur or float(au['duration'])
g = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.src, '-vf', 'format=gray,scale=214:120', '-f', 'rawvideo', '-'], capture_output=True).stdout
fr = np.frombuffer(g, np.uint8).reshape(-1, 120, 214).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean((1, 2)); rep = [i + 1 for i, x in enumerate(d) if x < a.thresh]
keep = [i for i in range(len(fr)) if i not in rep]; n = len(keep)
drift = [abs(i / fps - k * dur / n) for k, i in enumerate(keep)]
print(f'{len(fr)} frames, median change {np.median(d):.2f}; repeated frames (0-based) {rep}; kept {n}')
print(f'timing drift max {1000 * max(drift):.0f} ms, mean {1000 * np.mean(drift):.0f} ms; new rate {n}/{dur:g} = {n / dur:.4f} fps')
tmp = tempfile.mkdtemp(prefix='dedup-')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.src, f'{tmp}/%04d.png'], check=True)
for k, i in enumerate(keep): os.replace(f'{tmp}/{i + 1:04d}.png', f'{tmp}/k{k + 1:04d}.png')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{n}/{dur:g}', '-i', f'{tmp}/k%04d.png', '-c:v', 'libx264', '-crf', '8',
                '-preset', 'slow', '-pix_fmt', 'yuv420p', a.out], check=True)
shutil.rmtree(tmp); print(f'{a.out}: {n} frames over {dur:g} s')
