#!/usr/bin/env python3
"""align-voice.py <voice audio> <script.txt> <out dir> [lead seconds]
Word times for the film from a real voice: whisper.cpp hears the words, the
script's own words are matched to them (names and numbers keep the script's
spelling), and anything unheard is spaced between its neighbours. Writes
words.json and words.js; `lead` is where the voice starts in the film (10 s)."""
import sys,re,json,subprocess,difflib,os,tempfile
audio,script,out=sys.argv[1:4]; lead=float(sys.argv[4]) if len(sys.argv)>4 else 10.0
model=os.path.expanduser('~/Library/Caches/whisper.cpp/ggml-large-v3-turbo-q5_0.bin')
tmp=tempfile.mkdtemp(); wav=tmp+'/v.wav'
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',audio,'-ar','16000','-ac','1',wav],check=True)
subprocess.run(['whisper-cli','-m',model,'-f',wav,'-ml','1','-sow','-oj','-of',tmp+'/v','-l','en','-np'],check=True,stdout=subprocess.DEVNULL)
segs=json.load(open(tmp+'/v.json'))['transcription']
heard=[]
for s in segs:
    w=s['text'].strip()
    if not w: continue
    a=s['offsets']['from']/1000; b=s['offsets']['to']/1000
    if heard and not s['text'].startswith(' ') and not re.match(r'^\W',w) and False: pass
    heard.append([w,a,b])
norm=lambda w: re.sub(r'[^a-z0-9]','',w.lower())
paras=[p.strip() for p in open(script).read().strip().split('\n') if p.strip()]
toks=[w for p in paras for w in p.split()]
H=[norm(h[0]) for h in heard]; S=[norm(t) for t in toks]
sm=difflib.SequenceMatcher(None,S,H,autojunk=False)
t=[None]*len(toks)
for a,b,n in sm.get_matching_blocks():
    for k in range(n): t[a+k]=(heard[b+k][1],heard[b+k][2])
# fill the gaps by letters between known neighbours
i=0
while i<len(toks):
    if t[i] is None:
        j=i
        while j<len(toks) and t[j] is None: j+=1
        a=t[i-1][1] if i>0 else heard[0][1]; b=t[j][0] if j<len(toks) else heard[-1][2]
        size=[max(3,len(S[k])) for k in range(i,j)]; tot=sum(size); x=a
        for k in range(i,j):
            d=(b-a)*size[k-i]/tot; t[k]=(x,x+d); x+=d
        i=j
    else: i+=1
words=[[w,round(lead+a,3),round(lead+max(b,a+0.04),3)] for w,(a,b) in zip(toks,t)]
matched=sum(1 for a,b,n in sm.get_matching_blocks() for _ in range(n))
ps=[]; k=0
for p in paras: ps.append(words[k][1]); k+=len(p.split())
json.dump(words,open(out+'/words.json','w'))
open(out+'/words.js','w').write('window.WORDS='+json.dumps(words)+';\nwindow.PARAS='+json.dumps(ps)+';\n')
print('script words',len(toks),'heard',len(heard),'matched',matched,'end',words[-1][2])
print('heard text:',' '.join(h[0] for h in heard)[:400])
