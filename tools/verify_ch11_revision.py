"""Independent source and geometry audit for Revision Exercise 11 (pp. 11.80–11.86).
Run: python3 tools/verify_ch11_revision.py
Original angles/lengths/arc ratios and the official answers are independent of
animation labels. The diagrams for multipart problems satisfy the later givens,
but the earlier proofs must not use those later givens.
"""
import json
import math
import re
from pathlib import Path
from figcheck import ang, build_points, check_anim
ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/'data/src/ch11-revision.json').read_text())
Q={q['code']:q for s in DATA['sections'] for q in s['questions']}
def near(a,b,label):
    assert a is not None and math.isclose(a,b,abs_tol=1e-7),(label,a,b)
def angle(p,n):return ang(p[n[0]],p[n[1]],p[n[2]])
def length(p,n):return math.dist(p[n[0]],p[n[1]])
def parallel(p,a,b):
    u=[p[a[1]][i]-p[a[0]][i] for i in [0,1]];v=[p[b[1]][i]-p[b[0]][i] for i in [0,1]]
    near(u[0]*v[1]-u[1]*v[0],0,'parallel '+a+' '+b)
def collinear(p,n):
    for c in n[2:]:parallel(p,n[:2],n[0]+c)
def cyclic(p,n):near(angle(p,n[:3])+angle(p,n[2:]+n[:1]),180,'cyclic '+n)
def arc(p,a,b,avoid=None):
    heading=lambda n:math.degrees(math.atan2(p[n][1],p[n][0]))%360
    aa,bb=heading(a),heading(b);delta=(bb-aa)%360
    return 360-delta if avoid and (heading(avoid)-aa)%360<delta else delta if avoid else min(delta,360-delta)
EXPECTED={
 '1':{'ADB':38,'ACD':47,'CBD':38,'BDC':57},
 '2':{'OAD':26,'CAB':32,'DBC':58,'AOB':64},
 '3':{'MON':116,'MAN':64},'4':{'CAD':40,'BCA':30,'BAC':60},
 '5':{'AOB':72,'ACD':45,'ACB':36},'6':{'ADE':121,'ADB':31,'BCD':62},
 '7':{'DAE':30,'ABC':105,'ADC':75},'8':{'ACD':32,'ADE':116,'ABC':116},
 '10':{'DBE':43,'CAD':47},'11':{'BAC':17,'DFE':38,'DEF':35},
 '12':{'BAE':96,'DCE':39,'BOD':114},'13':{'ABC':35,'ACB':90,'BAC':55},
 '14':{'AEB':90},'15':{'AGE':51,'BFD':93,'BCD':108},
 '17':{'ADC':77,'BAC':24,'AOB':106},'18':{'AFE':144,'BCD':98,'BGD':46},
 '19':{'OAB':68,'CDE':152,'ABC':124},
 '20':{'OBA':65,'OCD':73,'OEA':113,'CDF':56},
 '21':{'ABC':104,'BAC':34,'ADB':28},'22':{'ODA':27,'BOD':42},
 '23':{'OMC':90},'25':{'CAD':33,'AED':71},
 '26':{'AFD':52,'BEC':116,'ABD':32,'CBD':32},
 '27':{'ACB':57,'BAC':84,'ABC':39},'28':{'ABC':92,'BCD':100},
 '29':{'AED':97.5},'30':{'ADC':90},'31':{'ADC':90},
 '32':{'EBF':90,'EDF':90},'35':{'OEC':90},
 '36':{'CAE':64,'PQR':68,'PAF':60,'AFP':60,'APF':60},
 'MC1':{'CAD':54,'BCD':81,'AEB':90},'MC2':{'ODC':108,'ACB':36},
 'MC3':{'AEB':90},'MC4':{'ABC':60,'POQ':120},
 'MC5':{'ACD':75,'BAC':45,'ADC':75,'ABC':105},
 'MC6':{'ADB':48,'AEB':32},'MC8':{'BGF':90},
}
EQUAL={'2':['AD','DC'],'3':['AM','MB','AN','NC'],'6':['AD','AB'],
 '7':['AD','AE'],'8':['AB','BC'],'16':['AD','AE'],
 '21':['CD','OC'],'22':['AE','CE'],'23':['AM','MC'],
 '25':['AB','BC','DE'],'26':['AC','BD'],
 '31':['AC','CF'],'34':['OM','ON'],'36':['AB','CD','EF'],
 'MC1':['AE','BE'],'MC2':['OD','CD'],'MC3':['AB','AD'],
 'MC4':['AP','BP'],'MC7':['AB','EF']}
PAR={'1':['AD','BC'],'8':['AB','DC'],'16':['BC','DE'],
 '19':['BC','OE'],'24':['AD','BC'],'33':['CH','EF'],
 'MC2':['AO','BC'],'MC7':['AF','BE']}
COL={'2':['ODB','ADC'],'3':['AMB','ANC'],'4':['AOC'],'6':['CODE'],
 '7':['CED'],'8':['CDE'],'9':['AEC','BED'],'11':['DCF','EBF'],
 '14':['AEC','BED'],'15':['AFD','BFE','BAG','DEG'],
 '16':['ABD','ACE'],'18':['BAG','DEG'],
 '20':['AEFD','OEB','OFC'],'21':['BCD','AOD'],
 '22':['ABD','OCD','OEB','AEC'],'23':['OMB','AMC'],
 '25':['AOE'],'26':['AEC','BED','BAF','CDF'],
 '29':['AEC','BED'],'31':['AEC','BED','ABF','DCF'],
 '32':['ADE','BCE','ABF','DCF'],
 '33':['AFD','BAG','BEC','BFH','CDH','CFG'],
 '34':['AMB','CND'],'35':['ADEB','OFC'],
 '36':['PABQ','PFER','QCDR'],'MC1':['AEC','BED'],
 'MC2':['ADC','ODB'],'MC3':['AEC','BED'],
 'MC4':['APB','AQC','BRC','AOR'],'MC6':['AODE','BCE'],
 'MC8':['BCF','EDF','AOGHF']}
CYCLIC={'7':'ABCD','8':'ABCD','9':'ABCD','16':'BCED','31':'ABCD',
 '32':'BDEF','33':'ABEF','MC7':'ABEF'}
# Physical scale independent of the SVG display radius.
LENGTHS={
 '3':(5/math.cos(math.radians(58)),{'OM':5,'ON':5}),
 '9':(10,{'AE':12,'EC':6,'BE':8,'ED':9}),
 '14':(37.5,{'AB':60,'AE':48,'BD':72,'BE':36,'CE':27}),
 '23':(34,{'AC':60,'BM':18,'OM':16}),
 '24':(39,{'AD':30,'BC':72,'MN':51,'OM':36,'ON':15}),
 '35':(39,{'AD':16,'CE':8*math.sqrt(14),'AB':72,'DE':40}),
}
ARCS={'4':(18/math.pi,[('A','B','C',6),('C','D','A',8)]),
 '5':(10/math.pi,[('A','B','C',4),('A','D','B',5)]),
 '13':(18/math.pi,[('A','B','C',18),('A','C','B',7),('B','C','A',11)]),
 '27':(30,[('A','C','B',13*math.pi)])}
ANSWERS={
 '1':['38','57'],'2':['32','58'],'3':['5','64'],'4':['30','60'],
 '5':['36','5'],'6':['31','62'],'10':['47'],'11':['35'],'12':['114'],
 '13':['7','11'],'14':['37.5'],'15':['108'],'17':['106'],'18':['46'],
 '19':['124'],'20':['56'],'21':['34'],'22':['42'],'23':['16'],
 '24':['39'],'25':['71'],'26':['116'],'27':['30'],'28':['100'],
 '29':['97.5'],'35':[None,'72']}
refs=json.loads((ROOT/'data/src/theorem-abbreviations.json').read_text())
approved={v['abbreviation'] for g in ['theorems','basicAngleRules','otherGeometryReasons'] for v in refs[g].values()}
readers=[(k,q['anim']) for k,q in Q.items()]+[(c['id'],c['demo']['opts']['anim']) for c in DATA['cards']]
assert len(Q)==44 and [len(s['questions']) for s in DATA['sections']]==[16,18,2,8]
assert len(readers)==49
assert [Q['MC'+str(n)]['answer'] for n in range(1,9)]==list('CBADC CAD'.replace(' ',''))
for k,a in readers:
    assert not check_anim(a,k),check_anim(a,k)
    p=build_points(a);assert a['layout']=='side-by-side' and a['readable']
    assert a['steps'][-1]['final'] and a['steps'][-1]['clearGoal']
    assert '\\' not in a['steps'][-1].get('answer',''),(k,'plain SVG badge')
    for n,value in EXPECTED.get(k,{}).items():near(angle(p,n),value,k+' '+n)
    for names in COL.get(k,[]):collinear(p,names)
    if k in PAR:parallel(p,*PAR[k])
    if k in CYCLIC:cyclic(p,CYCLIC[k])
    if k in EQUAL:
        for n in EQUAL[k][1:]:near(length(p,n),length(p,EQUAL[k][0]),k+' '+n)
    if k in LENGTHS:
        scale,values=LENGTHS[k]
        for n,value in values.items():near(scale*length(p,n),value,k+' length '+n)
    if k in ARCS:
        scale,values=ARCS[k]
        for start,end,avoid,value in values:near(scale*math.radians(arc(p,start,end,avoid)),value,k+' arc '+start+end)
    centre=[n for n,s in a['points'].items() if s.get('centre')][-1]
    marks={}
    for s in a['steps']:
        zh=re.findall(r'\$(.*?)\$',s['zh']);en=re.findall(r'\$(.*?)\$',s['en'])
        assert len(zh)==1 and zh==en,(k,'bilingual formula')
        assert zh[0]=='\\quad '.join(s['mathLines']),(k,'formula lines')
        assert all('$' not in m and not re.search(r'[\u3400-\u9fff]',m) for m in s['mathLines'])
        assert all(r in approved for r in s.get('ref','').split('; ') if r),(k,s.get('ref'))
        for t in s.get('ticks',[])+[[centre,n,1] for n in s.get('radii',[])]:
            count=t[2] if len(t)>2 else 1
            assert 1<=count<=3,(k,'tick style')
            size=length(p,t[:2])
            if count in marks:near(size,marks[count],k+' equality group '+str(count))
            marks[count]=size
        for n in s.get('radii',[]):near(length(p,centre+n),1,k+' main-circle radius')
        for m in s.get('segmentLabels',[]):assert set(m['between']).issubset(p),(k,m)
    if k in ANSWERS:assert [v['input'] for v in Q[k]['answers']]==ANSWERS[k],k
    print('PASS',k)
# Extra relationships which are not encoded by the displayed numeric labels.
for k,one,two in [('31','BD','BF'),('31','BC','CD'),('31','AB','AD'),
 ('MC4','OP','OQ'),('MC4','OQ','OR'),('MC7','AF','CD')]:
    p=build_points(Q[k]['anim']);near(length(p,one),length(p,two),k+' '+one+'='+two)
p=build_points(Q['26']['anim']);near(angle(p,'ABD'),angle(p,'DBC'),'26 angle bisector')
p=build_points(Q['30']['anim']);near(angle(p,'BDC'),angle(p,'CAD'),'30 given angles');near(arc(p,'A','B'),arc(p,'A','D'),'30 equal arcs')
p=build_points(Q['32']['anim']);near(angle(p,'CAF'),angle(p,'BEF'),'32 target')
p=build_points(Q['33']['anim']);parallel(p,'AE','FC');cyclic(p,'BCHG')
p=build_points(Q['34']['anim']);near(angle(p,'MON'),2*angle(p,'BCD'),'34 target')
p=build_points(Q['35']['anim'])
for n in 'DEF':near(math.hypot(*p[n]),25/39,'35 inner circle '+n)
# Counterexamples for statements that are not guaranteed (MC3 and MC7).
p=build_points(Q['MC3']['anim']);assert math.hypot(*p['E'])>.2
p=build_points(Q['MC7']['anim']);parallel(p,'BE','CD')
assert abs(angle(p,'BCD')+angle(p,'BED')-180)>1
assert abs(angle(p,'ACD')+angle(p,'AFD')-180)>1
# Arc ratios and all corresponding point orders.
for k,names,ratio in [('28',['AB','BC','CD'],[4,7,3]),('29',['AB','BC','CD','DA'],[5,4,6,9]),('MC5',['AB','CD'],[1,1]),('MC8',['BC','DE'],[1,1])]:
    p=build_points(Q[k]['anim']);unit=arc(p,*names[0])/ratio[0]
    for n,r in zip(names,ratio):near(arc(p,*n)/r,unit,k+' arc ratio '+n)
p=build_points(Q['MC5']['anim']);near(arc(p,'A','C','D')/arc(p,'A','C','B'),5/7,'MC5 arc ratio answer')
# S7 must allow a legitimate arc length beside degree angles in separate math
# expressions, and still flag an angle expressed with pi or radian units.
import build
build.ERRORS.clear();build.WARNINGS.clear()
build.check_text('mixed',r'$\overset{\frown}{AC}=13\pi$ cm, $\angle ACB=57^\circ$.')
assert not build.ERRORS and not build.WARNINGS
build.check_text('angle',r'$\angle ACB=2\pi$')
assert build.WARNINGS
build.check_text('radian','angle = 1 rad')
assert build.ERRORS
print('PASS: 44 original questions, 49 players; source givens, official answers, arc lengths, point order, equality groups and S7 regression')
