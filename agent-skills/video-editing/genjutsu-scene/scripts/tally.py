#!/usr/bin/python3
# Unshuffle the two blind judges by the key and tally the LOWER score of the two per item and moment.
# usage: tally.py JUDGE_DIR KEY.json BEFORE_NAME AFTER_NAME
#   JUDGE_DIR holds j1-result.json and j2-result.json (each judge's JSON reply, saved verbatim); names as in the kit's config.
# Prints the table (after vs before), wins/ties/losses for AFTER, each judge's overall pick; writes JUDGE_DIR/scores.json.
import json, sys
D, KF, A, B = sys.argv[1:5]
K = json.load(open(KF)); R = {j: json.load(open(f'{D}/{j}-result.json')) for j in ('j1', 'j2')}
per = {}
for j in ('j1', 'j2'):
    xs = K[j].split('=')[1]; ys = B if xs == A else A
    per[j] = {xs: R[j]['X'], ys: R[j]['Y'], 'better': {'X': xs, 'Y': ys, 'tie': 'tie'}[R[j]['better']]}
items = ['likeness', 'eyes', 'lighting', 'proportions', 'hands', 'integration', 'image_quality']
low = {}
for c in (A, B):
    low[c] = {k: [min(x, y) for x, y in zip(per['j1'][c][k], per['j2'][c][k])] for k in items}
    for k in ('lip_sync', 'eye_contact'): low[c][k] = min(per['j1'][c][k], per['j2'][c][k])
w = t = l = 0
print('%-14s %-26s %-26s' % ('item', B, A))
for k in items + ['lip_sync', 'eye_contact']:
    a, b = low[A][k], low[B][k]
    pa, pb = (a, b) if isinstance(a, list) else ([a], [b])
    for x, y in zip(pb, pa): w += x > y; t += x == y; l += x < y
    print('%-14s %-26s %-26s' % (k, b, a))
print(f'{B} vs {A}: {w} wins, {t} ties, {l} losses; judges prefer: j1 {per["j1"]["better"]}, j2 {per["j2"]["better"]}')
json.dump({'per_judge': per, 'lower': low, 'tally': {'wins': w, 'ties': t, 'losses': l}}, open(f'{D}/scores.json', 'w'), indent=1)
