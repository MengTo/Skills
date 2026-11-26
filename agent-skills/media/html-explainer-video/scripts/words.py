#!/usr/bin/env python3
"""The film's clock: the voice's words as [[word, start, end], ...], written as
words.json and words.js (window.WORDS = [...]) for the scenes. Every scene is
timed to these by name (T.clock, T.look2), so a new file retimes the whole film.

- From Fil's captions list, the text get_video returns with captions "list"
  (lines like `- k3f9a.12 · 1.24–1.52 s · “screen”`). Make captions with
  look.max_words 1 first. Short words can still share a line ("word. Four."):
  those are split by their letters, and with --voice at the voice's own
  silences too, so a sentence's pause inside a line doesn't move the next word.
- With --json, from any transcriber's word times, already [[word, start, end], ...].
- With --draft, from the script itself, for nothing: a clock from its letters
  and its punctuation at --pace words a second. Build and judge every scene on
  it before paying for a voice; the real words replace it without a change to
  any scene, as long as the script hasn't changed.

Usage:
  words.py captions.txt --voice voice.mp3 --out demo/words
  words.py --draft script.txt --out demo/words [--pace 2.6] [--start 0.12]

Prints the word count, the length and the pace. Python 3 standard library only."""
import argparse, json, re, subprocess, sys

CUE = re.compile(r'^\s*-\s+(\S+)\s+·\s+(-?[\d.]+)\s*[–-]\s*(-?[\d.]+)\s*s\s+·\s+[“"](.*)[”"]\s*$')


def silences(voice):
    """The voice's pauses over 80 ms, [[start, end], ...], from ffmpeg."""
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', voice, '-af', 'silencedetect=n=-34dB:d=0.08', '-f', 'null', '-'], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', out)]
    ends = [float(x) for x in re.findall(r'silence_end: (-?[\d.]+)', out)]
    return list(zip(starts, ends))


def spread(cue, s, e):
    """Words across a span, each its share by its letters."""
    total = sum(len(w) for w in cue) or 1
    out, t = [], s
    for w in cue:
        d = (e - s) * len(w) / total
        out.append([w, round(t, 3), round(t + d, 3)])
        t += d
    return out


def from_captions(text, gaps=()):
    words = []
    for line in text.splitlines():
        m = CUE.match(line)
        if not m:
            continue
        s, e, cue = float(m.group(2)), float(m.group(3)), m.group(4).split()
        if not cue:
            continue
        # A word ending a sentence inside the line: the pause there splits it.
        mid = next((i for i, w in enumerate(cue[:-1]) if re.search(r'[.!?,:;]$', w)), None)
        gap = next((g for g in gaps if g[0] > s + 0.05 and g[1] < e - 0.02), None)
        if mid is not None and gap:
            words += spread(cue[: mid + 1], s, gap[0]) + spread(cue[mid + 1 :], gap[1], e)
        else:
            words += spread(cue, s, e)
    return words


def draft(text, pace, start):
    """Each word's share of the time by its letters, a pause after punctuation."""
    tokens = text.split()
    letters = sum(max(3, len(re.sub(r'\W', '', w))) for w in tokens)
    total = len(tokens) / pace
    pause = lambda w: 0.42 if re.search(r'[.!?]$', w) else 0.24 if re.search(r'[,:;]$', w) else 0.0
    speaking = max(1.0, total - sum(pause(w) for w in tokens))
    words, t = [], start
    for w in tokens:
        d = speaking * max(3, len(re.sub(r'\W', '', w))) / letters
        words.append([w, round(t, 3), round(t + d, 3)])
        t += d + pause(w)
    return words


ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0], formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
ap.add_argument('source', nargs='?', help='a captions list, or - for stdin')
ap.add_argument('--draft', help='a script: a clock from its words, for nothing')
ap.add_argument('--out', required=True, help='writes <out>.json and <out>.js')
ap.add_argument('--json', help="any transcriber's [[word, start, end], ...]")
ap.add_argument('--voice', help='the voice file: splits a line with two sentences at its pause')
ap.add_argument('--pace', type=float, default=2.6)
ap.add_argument('--start', type=float, default=0.12)
a = ap.parse_args()

if a.json:
    words = [[str(w[0]), float(w[1]), float(w[2])] for w in json.load(open(a.json))]
elif a.draft:
    words = draft(open(a.draft).read(), a.pace, a.start)
else:
    words = from_captions(sys.stdin.read() if a.source in (None, '-') else open(a.source).read(), silences(a.voice) if a.voice else ())
if not words:
    sys.exit('no words found: is this get_video with captions "list"?')
json.dump(words, open(a.out + '.json', 'w'), ensure_ascii=False, indent=0)
open(a.out + '.js', 'w').write('/* The voice\'s words: [word, start, end] in the film\'s seconds (scripts/words.py). */\nwindow.WORDS = ' + json.dumps(words, ensure_ascii=False) + ';\n')
end = words[-1][2]
print(f'{len(words)} words, {end:.1f} s, {len(words) / max(end, 0.1):.2f} words a second' + (' (a draft clock)' if a.draft else ''))
