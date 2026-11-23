# Render, join and compress: python export.py [all | NAME | mux | small] [--tag T] [--reuse T0] [--mb 29]
# Each section: scenes.GFX[name](n) piped as raw RGBA over base-NAME.mp4 into layered<tag>-NAME.mp4. mux: the
# sections in timeline order under voice<tag>.wav at -14 LUFS into short<tag>-master.mp4. small: a two-pass x264
# at the bitrate that lands under --mb megabytes, into short<tag>.mp4. A second cut that differs in one section:
# --tag d --reuse '' renders only the sections plan-d.json marks "own" and takes the rest from the first cut.
import sys, os, json, platform, subprocess as sp
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
TAG = arg('--tag', ''); REUSE = arg('--reuse', None); MB = float(arg('--mb', 29)); os.environ['REEL_TAG'] = TAG
if TAG and Path(f'plan-{TAG}.json').exists(): os.environ.setdefault('REEL_PLAN', f'plan-{TAG}.json')
sys.path[:0] = [os.getcwd(), str(Path(__file__).parent)]
TL = json.loads(Path(f'timeline{TAG}.json').read_text()); NAMES = [s['name'] for s in TL['segments']]; FR = {s['name']: s['frames'] for s in TL['segments']}
PLAN = json.loads(Path(os.environ.get('REEL_PLAN', 'plan.json')).read_text()); OWN = {s['name'] for s in PLAN['sections'] if s.get('own')}
def lay(n): return f"layered{TAG if (REUSE is None or n in OWN) else REUSE}-{n}.mp4"
def ff(*a): return ['ffmpeg', '-nostdin', '-v', 'error', '-y', *map(str, a)]
BT709 = ['-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
ENC = ['-c:v', 'h264_videotoolbox', '-b:v', '7550k', '-maxrate', '8050k', '-bufsize', '11M'] if platform.system() == 'Darwin' else ['-c:v', 'libx264', '-preset', 'fast', '-crf', '14']
def count(p): return int(sp.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=nb_frames', '-of', 'csv=p=0', str(p)]).strip().strip(b','))
def segment(name):
    from scenes import GFX
    F = FR[name]; dest = Path(lay(name)); part = dest.with_suffix('.part.mp4')
    cmd = ff('-threads', 2, '-i', f'base-{name}.mp4', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1080x1920', '-r', 60, '-i', 'pipe:0', '-filter_complex',
             '[1:v]scale=iw:ih:out_color_matrix=bt709:out_range=tv,format=yuva420p[ui];[0:v][ui]overlay=0:0:shortest=1:format=yuv420,setsar=1[out]',
             '-map', '[out]', '-an', *ENC, '-g', 120, '-bf', 0, *BT709, part)
    proc = sp.Popen(cmd, stdin=sp.PIPE)
    try:
        for n in range(F): proc.stdin.write(GFX[name](n).tobytes())
    finally:
        proc.stdin.close(); code = proc.wait()
    if code or count(part) != F: raise RuntimeError((name, code, 'the background must be at least as long as the section'))
    part.replace(dest); print(f'finished {name}, {F} frames', flush=True)
def mux():
    end = TL['end']; files = [lay(n) for n in NAMES]
    assert sum(count(f) for f in files) == end, (sum(count(f) for f in files), end)
    Path(f'layers{TAG}.txt').write_text(''.join(f"file '{f}'\n" for f in files))
    sp.run(ff('-f', 'concat', '-safe', 0, '-i', f'layers{TAG}.txt', '-i', f'voice{TAG}.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-t', str(end / 60),
              '-af', f'pan=stereo|FL=c0|FR=c0,loudnorm=I=-14:TP=-1.6:LRA=7,aresample=48000,atrim=end_sample={end * 800}', '-c:a', 'aac', '-b:a', '192k',
              '-movflags', '+faststart', f'short{TAG}-master.mp4'), check=True)
def small():
    dur = TL['end'] / 60; kb = int(MB * 8 * 1024 * .97 / dur - 160)   # video bitrate that lands under MB megabytes with 160 kb/s sound
    for p in (1, 2):
        sp.run(ff('-i', f'short{TAG}-master.mp4', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{kb}k', '-maxrate', f'{int(kb * 1.5)}k', '-bufsize', '9M', '-pass', p,
                  '-passlogfile', f'x264{TAG}', '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709', '-g', 120, *BT709,
                  *(['-an', '-f', 'null', '-'] if p == 1 else ['-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', f'short{TAG}.mp4'])), check=True)
    print(f'short{TAG}.mp4', '%.1f MB' % (Path(f'short{TAG}.mp4').stat().st_size / 2 ** 20), 'at', kb, 'kb/s')
if __name__ == '__main__':
    a = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'all'
    if a == 'mux': mux()
    elif a == 'small': small()
    elif a != 'all': segment(a)
    else:
        todo = [n for n in NAMES if REUSE is None or n in OWN]; extra = [x for k in ('--tag', '--reuse') if k in sys.argv for x in (k, arg(k, ''))]
        with ThreadPoolExecutor(max_workers=3) as pool:      # a process per section, three at a time
            for j in [pool.submit(sp.run, [sys.executable, __file__, n, *extra], check=True) for n in todo]: j.result()
        mux(); small()
