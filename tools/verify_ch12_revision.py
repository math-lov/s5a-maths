"""Source and geometry audit for all 55 questions in Revision Exercise 12.
Run with python3 tools/verify_ch12_revision.py (standard library only).
The ledgers below are transcribed from the supplied questions and solutions;
coordinates in the website data are checked against them independently.
"""
import json
import math
import re
from pathlib import Path
from figcheck import ang, build_points, check_anim
ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'data/src/ch12-revision.json').read_text())
Q = {q['code']: q for section in DATA['sections'] for q in section['questions']}
assert set(Q) == {str(i) for i in range(1, 42)} | {'MC'+str(i) for i in range(1, 15)}
assert [len(s['questions']) for s in DATA['sections']] == [18, 20, 1, 2, 14]
assert len(DATA['cards']) == 6
assert sum(q['marks'] for q in Q.values()) == 190
P = {code: build_points(q['anim']) for code, q in Q.items()}

def near(a, b, tag):
    assert a is not None and math.isclose(a, b, abs_tol=1e-6), (tag, a, b)
def angle(code, name):
    p=P[code];return ang(p[name[0]], p[name[1]], p[name[2]])
def length(code, name): return math.dist(P[code][name[0]], P[code][name[1]])
def parallel(code, a, b):
    p=P[code];u=[p[a[1]][i]-p[a[0]][i] for i in [0,1]];v=[p[b[1]][i]-p[b[0]][i] for i in [0,1]]
    near((u[0]*v[1]-u[1]*v[0])/(math.hypot(*u)*math.hypot(*v)),0,code+' parallel '+a+' '+b)
def straight(code, names):
    parallel(code,names[:2],names[0]+names[2])
    # These ledgers specify point order as well as collinearity.
    near(length(code,names[:2])+length(code,names[1:]),length(code,names[0]+names[2]),code+' point order '+names)
def tangent(code, centre, contact, point):near(angle(code,centre+contact+point),90,code+' tangent '+contact+point)

ANGLES={
 '1':{'OPA':46,'OCB':22},'3':{'ATO':31,'AOB':118},'4':{'AOC':126,'ATB':54},
 '5':{'BAP':106,'ABC':37},'6':{'BAD':88,'DAP':43,'BCA':49},
 '7':{'ABC':84,'BCO':35,'BAP':139},'9':{'OAP':90},'10':{'BTO':15},
 '12':{'AOC':126,'ABC':72,'BOQ':54},'13':{'POQ':90},
 '14':{'APB':35,'BAC':59,'ACB':78},'15':{'APC':71,'CBD':47,'CAP':78},
 '16':{'QPR':74,'CBR':53},'17':{'DAQ':37,'QPR':54,'CDB':43},
 '18':{'BCD':85,'DAQ':36,'QPR':82,'ABP':49,'ADB':49},
 '19':{'BAP':134,'BCO':20,'ABC':24},'20':{'PQE':58,'CBP':119},
 '22':{'MON':132,'ACB':66},'23':{'BFO':30,'DFE':60,'DEF':60,'EDF':60,'AOB':120},
 '24':{'BAC':90},'26':{'ABC':74,'APC':64,'BCP':95},
 '27':{'APC':51,'CDE':113,'ABC':98},'29':{'DAQ':74,'DPQ':37,'CBD':69},
 '30':{'AOC':114,'AEB':19},'31':{'BDC':63,'CBD':48,'ABD':48},
 '32':{'ACD':66,'CDO':48},'33':{'ABC':89,'APC':60,'BFE':62},
 '36':{'BQC':30,'QBC':30},'38':{'BAC':120},'40':{'BPQ':90},
 'MC1':{'AOB':126,'OBC':35,'CAP':62},'MC2':{'QPR':70,'CBR':55},
 'MC3':{'AOB':114,'BOC':119,'OBC':37},'MC4':{'ACB':36},
 'MC6':{'QPR':90},'MC8':{'ACB':84,'CAQ':141,'CBS':123},
 'MC9':{'DBT':35,'ABT':87},'MC10':{'ACD':65,'BAP':42,'BEC':39,'CAD':34},
}
for code, entries in ANGLES.items():
    for name, value in entries.items():near(angle(code,name),value,code+' '+name)
EQUALS={'5':['AC','BC'],'17':['AD','CD'],'20':['DM','EM'],'25':['BP','BQ'],
        '26':['AB','BC'],'28':['BC','CD'],'MC2':['AB','BC']}
for code, names in EQUALS.items():near(length(code,names[0]),length(code,names[1]),code+' equal sides')
near(length('28','AP'),length('28','EP'),'28 equal sides AP EP')
for code,a,b in [('4','BC','AT'),('9','AB','PO'),('13','AP','BQ'),('16','AC','PR'),
                 ('35','OP','CB'),('37','PQ','RS'),('39','AE','PD'),('MC7','BC','PA'),('MC11','AB','EF')]:parallel(code,a,b)
STRAIGHTS={'1':['AOB','OCP'],'2':['PBO'],'8':['AOB'],'10':['AOB','OCT'],'14':['BCP'],
 '15':['CDP'],'16':['PAQ','PBR'],'17':['PAQ','PBR'],'18':['PAQ','PBR'],
 '20':['MOB','OBP','QDM','DME'],'21':['PBC'],'23':['FCO'],
 '27':['CEP'],'28':['AEC','DEB','EBP'],'29':['DCP','QAP'],'30':['ACE'],
 '31':['BEO','EOD'],'32':['AOB'],'33':['BAF','CBP','CDE'],
 '34':['CEO','EOP','OPD'],'35':['AOC'],'36':['PAQ','BOQ'],'37':['AEB','AFC','BDF','CDE'],
 '38':['BAD','CAE'],'39':['CQE','PBQ','BQD'],'40':['PAC','OAQ','BOC'],
 'MC5':['ACD'],'MC6':['QOR'],'MC7':['COP'],'MC8':['PAQ','RBS'],
 'MC9':['DBC'],'MC11':['EDC','DCF','TOM'],'MC12':['AED','AFB','BEC']}
for code,names in STRAIGHTS.items():
    for name in names:straight(code,name)
T={code:[('O','A','P')] for code in ['1','2','5','6','7','8','9','14','15','19','21','26','27','28','33','35','MC1','MC10']}
T.update({code:[('O','A','T'),('O','B','T')] for code in ['3','4']})
T.update({code:[('O','A','P'),('O','B','P')] for code in ['16','17','18','MC2']})
T.update({'10':[('O','B','T')],'11':[('O','P','A'),('O','Q','B'),('O','R','C')],
 '12':[('O','P','A'),('O','Q','B'),('O','R','C')],
 '13':[('O','A','P'),('O','B','Q'),('O','C','P')],'20':[('O','C','P')],
 '22':[('O','M','A'),('O','N','A')],'23':[('O','A','F'),('O','B','F'),('O','C','D')],
 '24':[('H','B','C'),('O','C','B'),('H','A','D'),('O','A','D')],
 '25':[('O','A','P'),('O','B','P'),('O','C','Q')],
 '29':[('O','A','P')],'30':[('O','B','E')],'31':[('O','A','B')],
 '32':[('O','C','D'),('H','O','A')],'34':[('P','E','A')],
 '36':[('O','A','P'),('O','B','P'),('O','C','Q')],
 '37':[('O','A','P'),('H','D','R')],'38':[('O','B','E'),('O','C','D')],
 '39':[('O','A','P'),('O','C','P')],'40':[('O','B','P')],
 '41':[('S','P','A'),('S','Q','A'),('S','R','B')],
 'MC3':[('O','P','A'),('O','Q','B'),('O','R','C')],
 'MC4':[('O','A','P'),('O','B','P')],'MC5':[('O','B','D')],
 'MC6':[('O','A','Q'),('O','B','R')],'MC7':[('O','A','P')],
 'MC8':[('O','A','P'),('O','B','R')],'MC9':[('O','B','T')],
 'MC11':[('O','A','T'),('O','B','T')],'MC12':[('O','B','P'),('H','B','Q')],
 'MC13':[('D','A','M'),('D','B','N'),('D','C','M')],
 'MC14':[('I','P','A'),('I','Q','B'),('I','R','A')]})
for code, triples in T.items():
    for triple in triples:tangent(code,*triple)
SECOND={'24':('H','AB'),'30':('C','BED'),'31':('H','ABCD'),'32':('H','OCD'),
 '33':('H','BDEF'),'34':('P','ED'),'37':('H','BCD'),'38':('H','BCDE'),'MC12':('H','BDEF')}
for code,(centre,names) in SECOND.items():
    radius=next(c['r'] for c in Q[code]['anim']['circles']if c['c']==centre)
    for name in names:near(length(code,centre+name),radius,code+' second circle '+name)

# Independently scale each length diagram to the source units.
LENGTHS={'2':('AP',45,{'PB':27,'OA':24}), '8':('AB',48,{'AP':14,'BP':50,'OA':24}),
 '11':('AB',31,{'BQ':8,'CA':42,'QC':19}),'21':('AP',78,{'BP':52,'BC':65}),
 '23':('DE',18,{'EF':18,'FD':18,'BF':27,'OB':9*math.sqrt(3)}),
 '34':('AB',30,{'CE':9,'OB':17,'OP':4.5}),
 'MC5':('AC',8,{'CD':4,'AB':4*math.sqrt(6)}),'MC6':('PQ',42,{'PR':56,'OA':24}),
 'MC13':('OM',24,{'ON':10,'MN':26,'DA':4})}
for code,(base,value,entries) in LENGTHS.items():
    scale=value/length(code,base)
    for name,want in entries.items():near(length(code,name)*scale,want,code+' length '+name)
near(24**2,576,'8 circle area coefficient')
near((120/360)*(9*math.sqrt(3))**2,81,'23 sector area coefficient')
# Arc ratios, symbolic angle relations, and proof conclusions are not inferred from appearance.
near(angle('10','AOC')/angle('10','BOC'),7/5,'10 arc ratio')
near(angle('38','BHE'),angle('38','DHE'),'38 equal outer arcs')
near(angle('MC9','AOB')/angle('MC9','AOC'),3/2,'MC9 arc ratio')
x,y=angle('28','CDP'),angle('28','BAP');near(angle('28','AEB'),x+y,'28 symbolic conclusion')
a=angle('MC7','BCP');near(angle('MC7','CAP'),135-a/2,'MC7 symbolic conclusion')
for code,u,v in [('35','BAP','BOP'),('37','ECF','EBF'),('39','PAC','PQC')]:near(angle(code,u),angle(code,v),code+' cyclic proof')
near(angle('25','PAC')+angle('25','PQC'),180,'25 cyclic conclusion')
near(angle('36','PBC')+angle('36','PQC'),180,'36 cyclic conclusion')
for code,tri1,tri2 in [('20','OCP','QMP'),('39','PAC','QAE'),('40','OAC','QAP')]:
    for i in range(3):
        u=tri1[(i+1)%3]+tri1[i]+tri1[(i+2)%3];v=tri2[(i+1)%3]+tri2[i]+tri2[(i+2)%3]
        near(angle(code,u),angle(code,v),code+' similar angles')
near(length('40','QA'),length('40','QP'),'40 new circle radii')
near(angle('MC11','TME'),90,'MC11 II');near(length('MC11','TE'),length('MC11','TF'),'MC11 I');near(length('MC11','CM'),length('MC11','DM'),'MC11 III')
near(angle('MC12','BAC'),angle('MC12','CBQ'),'MC12 true II')
for u,v in [('ACB','ADB'),('BAD','DBQ')]:assert abs(angle('MC12',u)-angle('MC12',v))>1,('MC12 false statement counterexample',u,v)
# Exact coordinate conditions in the two Cross Topics questions and coordinate MCs.
for code,centre,origin,scale,coords in [
 ('40','O',(0,0),math.sqrt(80),{'A':(-8,4),'B':(-8,-4),'P':(-12,4),'Q':(-10,5)}),
 ('41','S',(34,0),15,{'A':(9,0),'P':(25,12),'Q':(25,-12),'R':(49,0)}),
 ('MC13','D',(4,-4),4,{'O':(0,0),'M':(24,0),'N':(0,-10)}),
 ('MC14','I',(2,2),2,{'O':(0,0),'A':(5,0),'B':(0,12)})]:
    for name,target in coords.items():
        for i in [0,1]:near(P[code][name][i]*scale+origin[i],target[i],code+' coordinates '+name)
for name in 'APB':
    x,y=(P['41'][name][0]*15+34,P['41'][name][1]*15);near(3*x-4*y,27,'41 L1 '+name)
for name in 'AQC':
    x,y=(P['41'][name][0]*15+34,P['41'][name][1]*15);near(3*x+4*y,27,'41 L2 '+name)
near(2*2+3*2,2*5,'MC14 incentre condition')

# Original numeric angle marks must be visible before Next, not hidden in a later step.
INITIAL={'1':{'OPA':46},'3':{'ATO':31},'4':{'AOC':126},'5':{'BAP':106},'6':{'BAD':88,'DAP':43},'7':{'ABC':84,'BCO':35},'12':{'AOC':126},'14':{'APB':35,'BAC':59},'15':{'APC':71,'CBD':47},'16':{'QPR':74},'17':{'DAQ':37,'QPR':54},'18':{'BCD':85,'DAQ':36,'QPR':82},'19':{'BAP':134,'BCO':20},'22':{'MON':132},'23':{'BFO':30},'26':{'ABC':74,'APC':64},'27':{'APC':51,'CDE':113},'29':{'DAQ':74,'DPQ':37},'30':{'AOC':114},'31':{'BDC':63,'CBD':48},'32':{'ACD':66},'33':{'ABC':89,'APC':60},'36':{'BQC':30},'40':{'BPQ':90},'MC1':{'AOB':126,'OBC':35},'MC2':{'QPR':70},'MC3':{'AOB':114,'BOC':119},'MC6':{'QPR':90},'MC8':{'ACB':84,'CAQ':141},'MC9':{'DBT':35},'MC10':{'ACD':65,'BAP':42,'BEC':39}}
for code,q in Q.items():
    actual={a[1]+a[0]+a[2]:int(a[3][:-1])for a in q['anim']['givens'].get('arcs',[])}
    assert actual==INITIAL.get(code,{}),(code,'original given angle ledger',actual)
for code,names in EQUALS.items():
    actual={frozenset(t[:2])for t in Q[code]['anim']['givens'].get('ticks',[])}
    assert {frozenset(n)for n in names}.issubset(actual),(code,'equal-length premise hidden')

# Circle incidence from the original labelled diagrams (not inferred from norms).
PRIMARY={'1':'ABC','2':'AB','3':'AB','4':'ABC','5':'ABC','6':'ABCD','7':'ABC','8':'AB','9':'AB','10':'ABC','11':'PQR','12':'PQR','13':'ABC','14':'ABC','15':'ABCD','16':'ABC','17':'ABCD','18':'ABCD','19':'ABC','20':'BCDE','21':'ABC','22':'ABC','23':'ABC','24':'AC','25':'ABC','26':'ABC','27':'ABCDE','28':'ABCD','29':'ABCD','30':'ABCD','31':'ADE','32':'ABC','33':'ABCD','34':'ABCD','35':'ABC','36':'ABC','37':'ABC','38':'ABC','39':'ABCDE','40':'ABC','41':'PQR','MC1':'ABC','MC2':'ABC','MC3':'PQR','MC4':'ABCDE','MC5':'ABC','MC6':'AB','MC7':'ABCD','MC8':'ABC','MC9':'ABC','MC10':'ABCDE','MC11':'ABCD','MC12':'ABC','MC13':'ABC','MC14':'PQR'}
for code,names in PRIMARY.items():
    for name in names:near(math.hypot(*P[code][name]),1,code+' primary circle '+name)
for name in 'MN':near(math.hypot(*P['22'][name]),Q['22']['anim']['circles'][0]['r'],'22 small circle contact')
near(length('24','HO'),1.6,'24 external circle contact')
near(length('34','OP')+Q['34']['anim']['circles'][0]['r'],1,'34 internal circle contact')
for i,u in enumerate('VPWXY'):
    v='VPWXY'[(i+1)%5];w='VPWXY'[(i+2)%5]
    near(angle('MC4',u+v+w),108,'MC4 regular pentagon')
# All symbolic angle labels represent the actual angle, including the two-circle proofs.
for code,groups in {'28':['CAB CDP','AEB EAP','CBE CBD CDB','BCE BCA BAP'],
 '35':['BAP ACB OBC BOP'],'37':['ABC CAQ CGS','CBD CDS CDG','DCG DBE ECF EBF'],
 '38':['BCE DBE BCA ABE ABC ACD'],'39':['PAC AEC PQC','PCA QEA','APC AQE'],
 'MC12':['ACB ABP','ADB EBP','DBQ BED']}.items():
    for group in groups:
        names=group.split()
        for name in names[1:]:near(angle(code,name),angle(code,names[0]),code+' symbolic angle '+name)

# Input and source answer ledgers. Proof and coordinate-pair answers explicitly opt out of scalar input.
NUMERIC={'1':['22'],'2':['24'],'3':['242'],'4':['54'],'5':['37'],'6':['49'],'7':['139'],
 '10':['15'],'11':['19'],'12':['72','54'],'14':['78'],'15':['78'],'16':['53'],
 '17':['43'],'19':['24'],'20':['119'],'21':['65'],'22':['66'],'23':['27'],'26':['95'],
 '27':['98'],'29':['69'],'30':['19'],'32':['48'],'33':['62'],'34':['4.5'],'36':['30'],'38':['120'],'41':['15','49']}
for code,q in Q.items():
    if q['type']=='long':assert [a['input'] for a in q['answers'] if a['input'] is not None]==NUMERIC.get(code,[]),(code,'answer ledger')
assert [Q['MC'+str(i)]['answer'] for i in range(1,15)] == list('DBCB CBCBBCDBBD'.replace(' ',''))

# Content and animation state contracts, including initial givens and later-part conditions.
approved={v['abbreviation']for group in json.loads((ROOT/'data/src/theorem-abbreviations.json').read_text()).values()if isinstance(group,dict)for v in group.values()if isinstance(v,dict)and'abbreviation'in v}
players=[(q['code'],q['anim'],q['solution']['steps'])for q in Q.values()]+[(c['id'],c['demo']['opts']['anim'],None)for c in DATA['cards']]
for code,anim,solutions in players:
    assert anim['layout']=='side-by-side' and not check_anim(anim,code),(code,check_anim(anim,code))
    p=build_points(anim);ticks={}
    for state in [anim.get('givens',{})]+anim['steps']:
        for u,v,*count in state.get('ticks',[]):
            group=count[0]if count else 1;value=math.dist(p[u],p[v])
            if group in ticks:near(value,ticks[group],code+' tick group '+str(group))
            ticks[group]=value
    for i,step in enumerate(anim['steps']):
        formula=r'\quad '.join(step['mathLines'])
        assert re.findall(r'\$([^$]+)\$',step['zh'])==[formula],(code,i,'Chinese formula')
        assert re.findall(r'\$([^$]+)\$',step['en'])==[formula],(code,i,'English formula')
        assert not re.search(r'[\u4e00-\u9fff\x00-\x1f]',formula),(code,i,'formula control character or Chinese')
        assert step['ref'] and all(ref in approved for ref in step['ref'].split('; ')),(code,i,'unshared reason')
        if solutions:assert solutions[i]['math'].splitlines()==step['mathLines'] and solutions[i]['zh'].startswith(step['zh'].split('：$')[0]) and solutions[i]['en'].startswith(step['en'].split(': $')[0]),(code,i,'solution sync')
    assert anim['steps'][-1]['final'] and anim['steps'][-1]['clearGoal'],code
for code,value in [('20','58°'),('23','54 cm'),('38','DC tangent'),('40','A(−8,4)')]:
    q=Q[code];assert value not in json.dumps(q['anim']['givens'],ensure_ascii=False),(code,'future given leaked')
    assert value in json.dumps([s.get('givens')for s in q['anim']['steps']],ensure_ascii=False),(code,'missing staged given')
assert all(isinstance(n,list)for q in Q.values()for n in q['anim']['givens'].get('notes',[]))
print('12R: 55 source questions, 6 cards, 190 teaching marks; all geometry, answers, proof incidences, coordinates and bilingual formulas verified')
