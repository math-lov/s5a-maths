"""Check 12.2 geometry against the supplied textbook and official solutions.
Run: python3 tools/verify_ch12_2.py. Uses only the Python standard library.
"""
import json
import math
import re
from pathlib import Path
from figcheck import ang, build_points, check_anim

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / 'data/src/ch12-2.json').read_text())
Q = {q['code']: q for s in D['sections'] for q in s['questions']}
assert set(Q) == {'CE1', 'CE2', 'CE3', 'SC(a)', 'SC(b)', 'SC(c)'} | {str(i) for i in range(1, 31)}
assert len(D['cards']) == 4
assert sum(q['marks'] for q in Q.values()) == 120

def near(a, b, tag):
    assert a is not None and math.isclose(a, b, abs_tol=1e-5), (tag, a, b)
def angle(p, n): return ang(p[n[0]], p[n[1]], p[n[2]])
def length(p, n): return math.dist(p[n[0]], p[n[1]])
def parallel(p, a, b, tag):
    u = [p[a[1]][i]-p[a[0]][i] for i in [0, 1]]
    v = [p[b[1]][i]-p[b[0]][i] for i in [0, 1]]
    near((u[0]*v[1]-u[1]*v[0]) / (math.hypot(*u)*math.hypot(*v)), 0, tag)

# Independently transcribed source givens and official numerical conclusions.
ANGLES = {
 'CE1': {'BAC':93,'APB':29}, 'CE2': {'ACB':43,'BDC':71,'CAP':66},
 'CE3': {'ADB':72,'APB':40,'BCD':104,'DAP':32,'ABD':32},
 'SC(c)': {'DAQ':46,'ADB':41,'BDC':46,'ABD':47},
 '1': {'CAQ':76,'BCA':38}, '2': {'BAC':46,'BAP':67},
 '3': {'CAP':59,'AOC':118}, '4': {'ACB':48,'CAQ':66},
 '5': {'BAC':50,'ACB':65}, '6': {'CAP':122,'ABC':32,'BAP':32,'ACB':58},
 '7': {'APB':34,'BAC':78,'ACB':68}, '8': {'APB':39,'BAP':107},
 '9': {'ADB':56,'DCE':29,'EAP':44,'BAD':51},
 '10': {'BCP':38,'DCQ':32,'ADC':70}, '11': {'AED':105,'BAP':36,'BCD':111},
 '12': {'ATB':76,'CAT':116}, '13': {'ATB':56,'ACB':118},
 '14': {'BAP':117,'BCQ':44,'ABC':73}, '15': {'ABC':60,'ACB':60,'ACP':60,'BCQ':60},
 '17': {'ACQ':98,'APB':62,'AQC':43}, '20': {'ABC':124,'DAP':62,'ADC':56},
 '21': {'ATC':66,'APD':33}, '22': {'CBP':112,'ADC':102},
 '23': {'CQP':73,'DAP':41,'DCQ':74}, '24': {'CDE':66,'ABC':22},
 '25': {'SRT':50,'PSR':80}, '26': {'BED':25,'CEF':25,'ACB':70},
}
EQUALS = {'CE1':['AB','AP'],'SC(c)':['BC','CD'],'1':['BA','BC'],
 '4':['AC','BC'],'8':['AB','BC'],'12':['AC','BC'],'15':['AB','BC','CA'],
 '20':['AD','CD'],'22':['AB','AD'],'23':['AD','BC'],'25':['PS','RS'],
 '27':['BD','DE'],'28':['FC','FD'],'29':['AD','BC']}
PARALLELS = {'SC(a)':['TA','CB'],'2':['BC','PQ'],'5':['BC','PQ'],
 '10':['AD','BC'],'16':['AP','BC'],'19':['DB','PQ'],'22':['PQ','DC'],
 '26':['DF','BC'],'28':['AB','DC']}
STRAIGHTS = {'CE1':['BCP'],'CE3':['BDP'],'SC(b)':['POQ'],'SC(c)':['PAQ'],
 '1':['PAQ'],'2':['PAQ'],'3':['PAQ'],'4':['PAQ'],'5':['PAQ'],'6':['BOC','PAQ'],
 '7':['BCP'],'8':['BCP'],'10':['PCQ'],'17':['ABQ'],'18':['ACD'],'19':['PAQ'],
 '21':['DBO','ABP','DCP'],'22':['PBQ'],'23':['CBQ','PAQ'],'24':['AOB','BEC'],
 '26':['ADB','AFC','BEC','PAQ'],'27':['BET','ADB','CDE'],'28':['AEB'],
 '29':['AEC','BED'],'30':['CAP']}
TANGENTS = {k:[('O','A','P')] for k in ['CE1','CE2','CE3','1','2','3','4','5','7','8','9','11','14','16','19','20','23']}
TANGENTS.update({k:[('O','A','T'),('O','B','T')] for k in ['12','13','27']})
TANGENTS.update({'SC(a)':[('O','A','T')],'SC(b)':[('O','R','T')],
 '10':[('O','C','P')],'14':[('O','A','P'),('O','C','Q')],
 '15':[('O','C','P')],'16':[('O','A','P'),('O','B','Q')],
 '17':[('O','A','P'),('O','B','P'),('O','C','Q')], '18':[('O','B','D')],
 '20':[('O','A','P'),('O','C','Q')],'21':[('O','A','T'),('O','C','T')],
 '22':[('O','B','P')],'24':[('H','O','B')],'25':[('O','R','T')],
 '26':[('O','A','P'),('H','A','P'),('H','E','B')],
 '27':[('O','A','T'),('O','B','T'),('H','A','T')],
 '28':[('O','C','F'),('O','D','F'),('H','E','A')],
 '29':[('H','A','C'),('H','B','D')],'30':[('O','B','P')]})
SECOND_CIRCLES = {'24':'OCED','26':'ADEF','27':'ACD','28':'CEDF','29':'ABF'}
for code, q in Q.items():
    a=q['anim'];p=build_points(a)
    assert not check_anim(a,code),check_anim(a,code)
    for n,v in ANGLES.get(code,{}).items():near(angle(p,n),v,code+' '+n)
    eq=EQUALS.get(code,[])
    for n in eq[1:]:near(length(p,n),length(p,eq[0]),code+' equal sides')
    if code in PARALLELS:parallel(p,*PARALLELS[code],code+' parallel')
    for n in STRAIGHTS.get(code,[]):parallel(p,n[:2],n[0]+n[2],code+' collinear '+n)
    for centre,contact,outside in TANGENTS.get(code,[]):
        near(angle(p,centre+contact+outside),90,code+' tangent '+contact+outside)
    if code in SECOND_CIRCLES:
        rad=a['circles'][0]['r']
        for v in SECOND_CIRCLES[code]:near(math.dist(p['H'],p[v]),rad,code+' second circle '+v)
    assert len(a['steps'])==len(q['solution']['steps'])
    ticks={}
    for state in [a.get('givens',{})]+a['steps']:
        for v,w,*count in state.get('ticks',[]):
            group=count[0] if count else 1
            size=length(p,v+w)
            if group in ticks:near(size,ticks[group],code+' tick group '+str(group))
            else:ticks[group]=size
    for step,sol in zip(a['steps'],q['solution']['steps']):
        formula=r'\quad '.join(step['mathLines'])
        assert re.findall(r'\$([^$]+)\$',step['zh'])==[formula],code
        assert re.findall(r'\$([^$]+)\$',step['en'])==[formula],code
        assert sol['math']==formula and sol['zh']==step['zh'] and sol['en']==step['en'],code
    # Every original point and full circle fits the 420-square SVG, including the
    # large auxiliary circle of Q29. Hidden centres need not be labelled.
    for v,pos in p.items():
        if a['points'][v].get('hidden'):continue
        x=a['cx']+pos[0]*a['r'];y=a['cy']-pos[1]*a['r']
        assert 20<x<400 and 20<y<400,(code,v,x,y)
    for centre,rad in [('O',1)]+[(c['c'],c['r']) for c in a['circles']]:
        x=a['cx']+p[centre][0]*a['r'];y=a['cy']-p[centre][1]*a['r'];r=rad*a['r']
        assert 15<x-r and x+r<405 and 15<y-r and y+r<405,(code,'circle clipping')

# Verify the complete numeric-givens ledger before any Next click.
GIVENS={
 'CE1':{'BAC':'93°'},'CE2':{'ACB':'43°','BDC':'71°'},
 'CE3':{'ADB':'72°','APB':'40°','BCD':'104°'},
 'SC(b)':{'PRT':'a','QPR':'b'},'SC(c)':{'DAQ':'46°','ADB':'41°','BDC':'46°'},
 '1':{'CAQ':'76°'},'2':{'BAC':'46°'},'3':{'CAP':'59°'},'4':{'ACB':'48°','CAQ':'66°'},
 '5':{'BAC':'50°','ACB':'65°'},'6':{'CAP':'122°','ABC':'32°'},'7':{'APB':'34°','BAC':'78°'},
 '8':{'APB':'39°'},'9':{'ADB':'56°','DCE':'29°','EAP':'44°'},
 '10':{'BCP':'38°','DCQ':'32°'},'11':{'AED':'105°','BAP':'36°'},'12':{'ATB':'76°'},
 '13':{'CAT':'x','CBT':'y'},'14':{'BAP':'117°','BCQ':'44°'},
 '17':{'ACQ':'98°','APB':'62°','AQC':'43°'},'20':{'ABC':'124°','DAP':'θ'},
 '21':{'ATC':'66°'},'22':{'CBP':'112°'},'23':{'CQP':'73°','DAP':'41°'},
 '24':{'ABC':'x'},'25':{'SRT':'50°'},'26':{'BED':'25°','CEF':'25°','ACB':'70°'},
}
for code,q in Q.items():
    g=q['anim']['givens']
    shown={v[1]+v[0]+v[2]:v[3] for v in g.get('arcs',[])}
    assert shown==GIVENS.get(code,{}),(code,'initial givens',shown)
# Source equal-side and parallel marks are premises, not deductions to hide.
for code in ['CE1','SC(c)','1','4','8','12','15','22','23','25','29']:
    actual={frozenset(t[:2]) for t in Q[code]['anim']['givens'].get('ticks',[])}
    assert actual=={frozenset(n) for n in EQUALS[code]},(code,'missing initial equal sides')
for code in ['SC(a)','2','5','10','16','22','28']:
    actual={frozenset(t[:2]) for t in Q[code]['anim']['givens'].get('parallel',[])}
    assert actual=={frozenset(n) for n in PARALLELS[code]},(code,'missing parallel premise')
assert {tuple(t['between']):t['text'] for t in Q['30']['anim']['givens']['dimensions']}=={('A','C'):'16',('A','P'):'9',('B','P'):'15'}
NUMERIC={'CE1':'29','CE2':'66','1':'38','2':'67','3':'118','7':'68','8':'107','9':'51','10':'70','11':'111','12':'116','13':'118','14':'73','21':'33','22':'102','23':'74','24':'22'}
for code,want in NUMERIC.items():
    assert [a['input'] for a in Q[code]['answers'] if a['input'] is not None]==[want],(code,'answer ledger')

assert [Q['SC('+c+')']['answers'][0]['tf'] for c in 'abc']==[True,True,False]
for code,contact in [('SC(c)','A'),('6','A')]:
    p=build_points(Q[code]['anim'])
    assert abs(angle(p,'O'+contact+'Q')-90)>0.1,'False tangent drawn as tangent'
for code,value in [('13','56°'),('20','62°'),('24','66°')]:
    assert value not in [v[3] for v in Q[code]['anim']['givens'].get('arcs',[])]
    assert any(value==v[3] for s in Q[code]['anim']['steps'] for v in s.get('givens',{}).get('arcs',[]))
assert not Q['18']['anim']['givens'] and Q['18']['anim']['steps'][2]['givens']['segmentLabels']
assert not Q['27']['anim']['givens'] and any(s.get('givens',{}).get('notes') for s in Q['27']['anim']['steps'])
assert ['B','C'] not in Q['30']['anim']['segments']
p=build_points(Q['18']['anim']);near(length(p,'BD')/length(p,'CD'),1.5,'18 given ratio')
near(length(p,'AC')/length(p,'CD'),1.25,'18 area ratio')
p=build_points(Q['24']['anim']);near(angle(p,'AOC'),2*angle(p,'ABC'),'24 centre angle')
near(angle(p,'BOE'),angle(p,'ABC'),'24 tangent angle')
p=build_points(Q['27']['anim']);near(angle(p,'ADC'),angle(p,'ATB'),'27 later given')
near(angle(p,'ACE'),angle(p,'ABE'),'27 new cyclic quadrilateral')
p=build_points(Q['28']['anim']);near(angle(p,'CFE'),angle(p,'EFD'),'28 bisector')
near(math.dist(p['E'],p['F']),2*Q['28']['anim']['circles'][0]['r'],'28 diameter')
p=build_points(Q['30']['anim']);scale=15/length(p,'BP')
for n,v in {'AC':16,'AP':9,'BP':15,'CP':25,'BC':20}.items():near(length(p,n)*scale,v,'30 '+n)
# The coordinate plane is introduced only for part (b), with B=(6,1).
def coordinate(v):return (6+(p[v][0]-p['B'][0])*scale,1+(p[v][1]-p['B'][1])*scale)
for v,target in [('C',(6,21)),('P',(-9,1))]:
    for actual,want in zip(coordinate(v),target):near(actual,want,'30 coordinate '+v)
for v in 'AB':
    x,y=coordinate(v);near(3*x+4*y,22,'30 line '+v)
for c in D['cards']:assert not check_anim(c['demo']['opts']['anim'],c['id'])
print('12.2: all 36 source questions, 4 cards, geometry, givens and staged conditions verified')
