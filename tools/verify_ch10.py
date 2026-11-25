#!/usr/bin/env python3
"""Independent stdlib audit of Chapter 10 inventory, algebraic intervals and errata.

No symbolic solver or authoring dependencies are used. Each stored polynomial is
sampled in every sign region, outside the endpoints and at the roots themselves.
Source-sensitive scalar results and physical counterexamples have separate ledgers.
"""
import json, math, re
from fractions import Fraction
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
COUNT={'ch10-1':72,'ch10-2':27,'ch10-3':57,'ch10-revision':83}
D={p:json.loads((ROOT/'data/src'/f'{p}.json').read_text())for p in COUNT}
QS={p:{q['code']:q for sec in d['sections']for q in sec['questions']}for p,d in D.items()}
checks=0

def require(ok,msg):
    global checks
    checks+=1
    if not ok:raise AssertionError(msg)

def contains(intervals,x):
    return any((i['lo'] is None or x>i['lo']+1e-8 or abs(x-i['lo'])<1e-8 and i['loClosed']) and
               (i['hi'] is None or x<i['hi']-1e-8 or abs(x-i['hi'])<1e-8 and i['hiClosed'])for i in intervals)

def verify_condition(ch,q,c):
    cs=[float(Fraction(v))for v in c['coeff']]
    a,b,d=([0]*(3-len(cs))+cs)
    roots=[]
    if a:
        delta=b*b-4*a*d
        if delta>=0:
            roots=sorted(set([(-b-math.sqrt(delta))/(2*a),(-b+math.sqrt(delta))/(2*a)]))
    elif b:roots=[-d/b]
    cuts=sorted(set(roots+[i[k]for i in c['intervals']for k in ['lo','hi']if i[k]is not None]))
    samples=[-10000,10000,0]+cuts
    for lo,hi in zip(cuts,cuts[1:]):
        if hi-lo>1e-7:samples.append((lo+hi)/2)
    for x in cuts:samples += [x-max(1,abs(x))*.0001,x+max(1,abs(x))*.0001]
    for x in samples:
        value=(a*x+b)*x+d
        if any(abs(x-r)<1e-8 for r in roots):value=0
        expected={'<':value<0,'<=':value<=0,'>':value>0,'>=':value>=0}[c['op']]
        require(contains(c['intervals'],x)==expected,f'{ch} {q}: interval disagrees with polynomial at {x}: {c}')

nconditions=0;players=0;frames=0;cards=0;plots=set()

def audit_plots(o):
    if isinstance(o,dict):
        if 'coeff'in o and 'roots'in o:
            key=tuple(o['coeff'])
            if key not in plots:
                plots.add(key);a,b,c=o['coeff']
                require(o['yRange'][0]<min(0,c,c-b*b/(4*a)) and o['yRange'][1]>max(0,c,c-b*b/(4*a)), 'plot range includes the vertex, y-intercept and axis')
                for root in o['roots']:
                    x=root['x'];require(abs((a*x+b)*x+c)<=1e-7*max(1,abs(a*x*x),abs(b*x),abs(c)), 'plot zero must lie on its curve')
        for v in o.values():audit_plots(v)
    elif isinstance(o,list):
        for v in o:audit_plots(v)
for p,d in D.items():
    audit_plots(d)
    expected_codes={str(n)for n in range(1,70 if p.endswith('revision')else 51 if p.endswith('1')else 20 if p.endswith('2')else 44)}
    if p.endswith('revision'):expected_codes|={'MC'+str(n)for n in range(1,15)}
    else:
        expected_codes|={'SC('+chr(97+i)+')'for i in range(6 if p.endswith('1')else 4 if p.endswith('2')else 5)}
        if p.endswith('2'):expected_codes|={'CE'+str(n)for n in range(1,5)}
        else:
            for group,count in ([('A',6),('B',5),('C',5)]if p.endswith('1')else[('A',6),('B',3)]):expected_codes|={'CE '+group+str(n)for n in range(1,count+1)}
    require(set(QS[p])==expected_codes,p+' complete source inventory')
    expected_nums=range(1,70 if p.endswith('revision')else 51 if p.endswith('1')else 20 if p.endswith('2')else 44)
    require(all(str(n)in QS[p]for n in expected_nums),p+' original exercise numbers')
    for code,q in QS[p].items():
        require(len(q['answers'])==len(q['parts'])if q['type']!='mc'else set(q['options'])==set('ABCD'),p+' '+code+' answer structure')
        for condition in q['inequalityChecks']:verify_condition(p,code,condition);nconditions+=1
    specs=[q['inequalityAnim']for q in QS[p].values()if q.get('inequalityAnim')]
    for card in d['cards']:specs+=card['demo']['opts']['cases'];cards+=1
    for s in specs:
        players+=1
        for st in s['steps']:
            frames+=1;expect=r'\quad '.join(st['mathLines'])
            for lang in ['zh','en']:require(re.findall(r'\$([^$]*)\$',st[lang])==[expect],p+' caption sync')
            require(all(not re.search('[\u3400-\u9fff]',m)for m in st['mathLines']),p+' no Chinese in maths')
# Independent answer ledger: a different path from the general interval solver.
LEDGER={
'ch10-1':{'CE B5':['-28'],'CE C5':['7'],'35':['34'],'37':['-1'],'43':['20,21,22,23,24,25,26'],'44':['19'],'46':['31']},
'ch10-2':{'CE4':['-6'],'10':['5'],'16':['6'],'19':['-5,-4,-3,-2,-1']},
'ch10-3':{'20':['3827'],'21':['34','36'],'35':['9'],'36':['8'],'39':['23'],'40':['48','11'],'41':['5']},
'ch10-revision':{'27':['9'],'28':['14'],'29':['46'],'36':['9'],'37':['8'],'38':['-6'],'57':['4'],'60':['229,246,263'],'61':['12'],'62':['65'],'64':['16'],'68':['-5'],'69':['N=0']}}
for p,rows in LEDGER.items():
    for code,tokens in rows.items():
        value=' '.join(a['math']for a in QS[p][code]['answers']).replace(' ','').replace(r'\quad','')
        for token in tokens:require(token in value,p+' '+code+' scalar ledger '+token+' got '+value)
require(''.join(QS['ch10-revision']['MC'+str(i)]['answer']for i in range(1,15))=='ABCDB C A C B D C C A B'.replace(' ',''),'source MC answer order')
for p,expected in [('ch10-1',[True,False,False,True,True,False]),('ch10-2',[False,False,True,False]),('ch10-3',[True,False,True,False,True])]:
    actual=[QS[p]['SC('+chr(97+i)+')']['answers'][0]['tf']for i in range(len(expected))]
    require(actual==expected,p+' section-check answers')
# Source errata: compute the conflicting results instead of trusting either list.
require(Fraction(9-5*8,8)>2*(6-8)and not Fraction(9-5*8,4)>2*(6-8),'CE10.1A Q5 denominator 8 vs 4 distinguishes x=8')
require(all(2*x>25 for x in range(14,23))and Fraction(25,2)**2-36*Fraction(25,2)+450>150,'CE10.3B Q1 official list lies outside AD')
require((0**2-12*0-24)<0 and (0**2-12*0+24)>0,'CE10.3B Q2 k=0 distinguishes k+2 from k-2')
orig=[k for k in range(-100,101)if 0<(k+7)**2-32<4]
official=[k for k in range(-100,101)if 0<(k+7)**2-32<100]
require(orig==[]and len(official)==12 and 0 in official,'10R Q69 original bound vs official bound and omitted k=0')
require(5**(22*(3*22-68))<=150000000<5**(23*(3*23-68)),'10.3 Q39 adjacent integers')
require(288*(6**10+6**20)<=1.83e18<288*(6**11+6**22),'10.3 Q40 adjacent integers')
require(-50*1.44**5+114*1.2**4+75>0>=-50*1.44**6+114*1.2**5+75,'10.3 Q41 adjacent integers')
require(4*2.25**3<=27*(1.5**1+1) and 4*2.25**4>27*(1.5**2+1),'10R Q57 adjacent integers')
require(5200*.88**2>4000>=5200*.87**2,'10R Q61 integer rate boundary')
require(15**2-15+1==211 and 16**2-16+1>211,'10R Q64 strict dot threshold')
require(all(36*k*k+24*k+16>0 for k in range(-100,101))and Fraction(3,Fraction(-3,2)-3)+Fraction(1,Fraction(-3,2)+3)==0,'10R Q67 linear case k=0 and discriminant')
require(QS['ch10-revision']['42']['inequalityAnim']['plot']['coeff']==[-8,24,-18]and QS['ch10-revision']['43']['inequalityAnim']['plot']['coeff']==[2,2,-6],'revision supplied curves retained')
require([r['x']for r in QS['ch10-revision']['MC7']['inequalityAnim']['plot']['roots']]==[-2.4,.4],'MC7 uses the actual supplied intercepts')
print(f'PASS: {sum(COUNT.values())} questions; {nconditions} polynomial conditions; {players} players/cases; {frames} frames; {cards} cards; {checks} assertions.')
