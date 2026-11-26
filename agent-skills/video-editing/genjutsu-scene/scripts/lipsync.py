#!/usr/bin/python3
# Lip sync, envelope method: outer-lip height / inter-ocular distance (Vision, 3-frame smoothed) against the voice's speech
# envelope (200-4000 Hz, RMS at 100 Hz, low-passed to 8 Hz). Reports r_best within +-250 ms, its lag, and z against 40
# shifted-audio controls. Validated on a 30 s stretch of the twin camera: r 0.32, z +4.25. 5-6 s clips are noisy (controls
# sd ~0.15-0.2), so read it together with phon.py and a mouth strip, never alone.
# usage: lipsync.py dump.jsonl FPS AUDIO_START_S VOICE.wav [first_frame last_frame]
#   VOICE.wav: the film's clean voice, mono 16 kHz, film time = file time (ffmpeg -i voice.m4a -ac 1 -ar 16000 voice.wav)
#   AUDIO_START_S: the film time of the clip's first frame. FPS: the clip's real frame rate (145/6.4 after dedup.py).
import sys, json, wave, numpy as np
rows = [json.loads(l) for l in open(sys.argv[1])]; fps = (lambda s: float(s.split('/')[0]) / float(s.split('/')[1]) if '/' in s else float(s))(sys.argv[2]); a0 = float(sys.argv[3])
f0 = int(sys.argv[5]) if len(sys.argv) > 5 else 0; f1 = int(sys.argv[6]) if len(sys.argv) > 6 else len(rows)
w = wave.open(sys.argv[4])
assert w.getframerate() == 16000 and w.getnchannels() == 1, 'voice must be mono 16 kHz wav'
a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
F = np.fft.rfft(a); fr = np.fft.rfftfreq(len(a), 1 / 16000); F[(fr < 200) | (fr > 4000)] = 0; b = np.fft.irfft(F, len(a))
n = len(b) // 160; env = np.sqrt((b[:n * 160].reshape(n, 160) ** 2).mean(1) + 1e-10)
E = np.fft.rfft(env); ef = np.fft.rfftfreq(n, 1 / 100); E[ef > 8] = 0; env = np.fft.irfft(E, n)
at = lambda t: np.interp(t * 100, np.arange(n), env)
def oh(r):
    if not r.get('face'): return np.nan
    P = r['face']['pts']; ol = np.array(P['outerLips']); le = np.array(P['leftEye']).mean(0); re = np.array(P['rightEye']).mean(0)
    return (ol[:, 1].max() - ol[:, 1].min()) / np.hypot(*(re - le))
o = np.array([oh(r) for r in rows[f0:f1]]); o = np.where(np.isnan(o), np.nanmedian(o), o)
o = np.convolve(np.pad(o, 1, mode='edge'), np.ones(3) / 3, 'valid'); t = np.arange(len(o)) / fps
def best(shift):
    return max((np.corrcoef(o, at(a0 + shift + t + l / 1000))[0, 1], l) for l in range(-250, 251, 10))
r, lag = best(0)
ctrl = [best(s)[0] for s in np.concatenate([np.linspace(-12, -1.5, 20), np.linspace(1.5, 12, 20)])]
print(f'r {r:.3f} at {lag:+d} ms ({"lips lead" if lag >= 0 else "lips trail"}); controls mean {np.mean(ctrl):.3f} sd {np.std(ctrl):.3f}; '
      f'z {(r - np.mean(ctrl)) / np.std(ctrl):+.2f}; lip height p50 {np.percentile(o, 50):.3f} p90 {np.percentile(o, 90):.3f}; n {len(o)}')
