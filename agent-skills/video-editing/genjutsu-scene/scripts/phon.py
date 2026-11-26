#!/usr/bin/python3
# Phoneme check: inner-lip gap / inter-ocular distance at known sounds of the line (film times from the film's word
# timings), min within +-45 ms for closures (m, b, p: lips should meet, < 0.03) and max for open vowels (> 0.08), plus the
# mean over a silence (should be shut). This is the number that tracks what judges see in a mouth strip.
# usage: phon.py dump.jsonl FPS AUDIO_START_S CHECKS.json
# CHECKS.json: {"closed": [["m of model", 21.33], ...], "open": [["o of code", 20.50], ...], "silence": [22.25, 22.70]}
#   Find the times in the film's words.json ([word, start, end] in film seconds): a closure is the word's start for an
#   initial m/b/p, a vowel ~0.1 s into the word. Example: references/greymourn-checks.json.
import sys, json, numpy as np
rows = [json.loads(l) for l in open(sys.argv[1])]; fps = (lambda s: float(s.split('/')[0]) / float(s.split('/')[1]) if '/' in s else float(s))(sys.argv[2]); a0 = float(sys.argv[3])
C = json.load(open(sys.argv[4]))
def gap(r):
    if not r.get('face'): return np.nan
    P = r['face']['pts']; il = np.array(P['innerLips']); le = np.array(P['leftEye']).mean(0); re = np.array(P['rightEye']).mean(0)
    return (il[:, 1].max() - il[:, 1].min()) / np.hypot(*(re - le))
g = np.array([gap(r) for r in rows]); t = a0 + np.arange(len(g)) / fps
def win(c, w=0.045): return g[(t >= c - w) & (t <= c + w)]
hit_c, hit_o, n_c, n_o = 0, 0, 0, 0
for lab, c in C.get('closed', []):
    v = win(c)
    if not len(v): print(f'{lab:28s} -  (outside the clip)'); continue
    x = float(np.nanmin(v)); n_c += 1; hit_c += x < 0.03; print(f'{lab:28s} {x:.3f}  {"closed" if x < 0.03 else "OPEN (miss)"}')
for lab, c in C.get('open', []):
    v = win(c)
    if not len(v): print(f'{lab:28s} -  (outside the clip)'); continue
    x = float(np.nanmax(v)); n_o += 1; hit_o += x > 0.08; print(f'{lab:28s} {x:.3f}  {"open" if x > 0.08 else "closed (miss)"}')
if 'silence' in C:
    s = g[(t >= C['silence'][0]) & (t <= C['silence'][1])]
    if len(s): print(f'{"silence (mean)":28s} {np.nanmean(s):.3f}')
print(f'closures < 0.03: {hit_c}/{n_c}   open vowels > 0.08: {hit_o}/{n_o}   gap p50 {np.nanpercentile(g, 50):.3f} p90 {np.nanpercentile(g, 90):.3f}')
