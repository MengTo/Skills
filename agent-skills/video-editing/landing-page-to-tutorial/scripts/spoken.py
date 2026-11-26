"""spoken.py <script.txt> <out.json>: the script as voice generations, written the way the voice recipe asks
(voice-tuning/RECIPE.md): run-on sentences joined with commas, lowercase sentence starts, full stops kept only after
questions and before so/now/and/but/okay, one paragraph of 40-80 words per generation, kept camera lines on their own."""
import json,re,sys
src,out=sys.argv[1:3]
PROPER={'I',"I'm","I've","I'd","I'll",'Codex','Tarnfield','Folvra','Brasswater','Foundry','Warden','Wren',"Wren's",'Oda','Tamsin','Morning','Build','September','GPT','Astra','HTML','WebGL','Claude','Cursor','Impeccable','Emil','Stageshow','Benji','Open','Solid','Dream','Mobbin','Collect','Awwwards','ThreeUI','AI','MP','HP','Guard','Arts','Attack','Item','Pincer','Boiler','Rivet','Hooked','Sections','Classical','Logo','Neoclassical','Grotesk','Serif','Monospace','Hairline','Copy','SVG','D','Generate','Add','Sky','Retina','Recent','Mesh','Linen\'s','Pill','Polish','Composition','Receipts'}
KEEPSTOP=re.compile(r"^(so|now|and|but|okay|step|scoreboard|one|two|three|second|first)\b",re.I)
def sents(t):return [x.strip() for x in re.split(r'(?<=[.?!])\s+',t) if x.strip()]
def low(s):
    w=s.split(' ',1)
    if w[0].strip(',.?') in PROPER:return s
    return w[0][0].lower()+w[0][1:]+(' '+w[1] if len(w)>1 else '')
def runon(ss):
    o=''
    for i,s in enumerate(ss):
        s=low(s)
        if not o:o=s;continue
        prev_q=o.endswith('?')
        if prev_q or KEEPSTOP.match(s):o+=' '+s
        else:o=o[:-1]+', '+s
    return o
L=open(src).read().split('\n')[4:];gens=[];sec=None
for l in L:
    if l.startswith('==='):sec=l.strip('= ');continue
    if not l.strip():continue
    if l.startswith('[KEEP]'):
        gens.append({'section':sec,'keep':True,'text':l[7:]});continue
    ss=sents(l);chunk=[];n=0
    for s in ss:
        k=len(s.split())
        if n+k>78 and n>=38:gens.append({'section':sec,'keep':False,'src':chunk});chunk=[];n=0
        chunk.append(s);n+=k
    if chunk:
        if gens and not gens[-1]['keep'] and gens[-1]['section']==sec and n<26 and 'src' in gens[-1] and sum(len(x.split()) for x in gens[-1]['src'])+n<=95:gens[-1]['src']+=chunk
        else:gens.append({'section':sec,'keep':False,'src':chunk})
for i,g in enumerate(gens):
    g['n']=i+1
    if not g['keep']:g['text']=runon(g.pop('src'))
    g['words']=len(g['text'].split())
json.dump(gens,open(out,'w'),indent=1,ensure_ascii=False)
new=[g for g in gens if not g['keep']]
print(len(gens),'generations,',len(new),'new;',sum(g['words'] for g in new),'new words; shortest',min(g['words'] for g in new),'longest',max(g['words'] for g in new))
import math;print('credits one take each:',sum(math.ceil(len(g['text'])/124) for g in new))
for g in gens[:6]+gens[20:23]:print(g['n'],g['words'],'|',g['text'][:400])
