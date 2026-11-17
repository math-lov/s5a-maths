"""Verify Exercise 12.1 against the source givens, independently of SVG labels.
Sources: SMS_bkexe_5A12_e.docx and SMS_sol_5A12_e.docx, pp.12.9–12.25.
Run: python3 tools/verify_ch12_1.py
"""
import json
import math
import re
from pathlib import Path
from figcheck import ang, build_points, check_anim
ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / 'data/src/ch12-1.json').read_text())
Q = {q['code']: q for s in D['sections'] for q in s['questions']}
assert set(Q) == {f'A{i}({c})' for i in [1, 2] for c in 'abc'} | {f'B{i}' for i in [1, 2, 3]} | {f'SC({c})' for c in 'abcd'} | {str(i) for i in range(1, 42)}
def near(a, b, tag):
    assert a is not None and math.isclose(a, b, abs_tol=1e-5), (tag, a, b)
def angle(p, n): return ang(p[n[0]], p[n[1]], p[n[2]])
def length(p, n): return math.dist(p[n[0]], p[n[1]])
def parallel(p, a, b, tag):
    u = [p[a[1]][i]-p[a[0]][i] for i in [0, 1]]
    v = [p[b[1]][i]-p[b[0]][i] for i in [0, 1]]
    near(u[0]*v[1]-u[1]*v[0], 0, tag)
# Numeric givens and derived answers transcribed from the original diagrams.
ANGLES = {
 'A1(a)': {'BCP':116,'ABC':26}, 'A1(b)': {'BAP':27,'APB':36},
 'A1(c)': {'ABC':90}, 'A2(b)': {'BOC':21,'BAP':58,'OAP':79},
 'A2(c)': {'ACB':90,'BAP':90}, 'B1': {'BOC':122,'ATO':32},
 'B2': {'ADC':52,'AOB':52,'BAT':26},
 'SC(a)': {'BAP':90}, 'SC(b)': {'BOC':38,'BAP':54,'OAP':92},
 'SC(c)': {'AOB':120,'BAT':60,'ABT':60,'ATB':60},
 '1': {'ABQ':111,'OAB':21}, '2': {'AOP':45}, '3': {'COB':58,'BAP':61},
 '6': {'AOB':60,'BAP':30,'BPA':30}, '7': {'ABC':31,'APO':28},
 '9': {'OAC':27,'APO':36}, '10': {'PAB':77,'OCB':40,'OAB':13,'AOC':106},
 '11': {'ABT':67,'ACD':113}, '13': {'ACD':43,'BEC':105,'BAP':29,'CAP':91},
 '14': {'CAP':26,'OBC':38,'OAP':90}, '15': {'OAB':42,'ATB':84},
 '16': {'AOB':110,'ATO':35}, '17': {'OTB':31,'AOC':121},
 '18': {'BAC':64,'BOC':122}, '22': {'ATB':56,'ADC':118,'ABC':62,'ABT':62},
 '23': {'APB':30,'BAP':30}, '24': {'BAP':29,'BDC':36,'AOC':130},
 '25': {'ACD':78,'APD':41,'AOB':74}, '26': {'ABC':112,'APO':44,'CDE':91},
 '28': {'ACB':90,'TCA':90}, '29': {'OCA':27,'ODA':67,'BAP':43,'OAP':90},
 '30': {'AOB':58,'CBD':66,'EAP':37,'OAP':90}, '31': {'DAE':90,'OBE':90},
 '32': {'BOP':51,'CAQ':73,'OCB':34}, '33': {'OTA':38,'BCD':128,'AOE':76,'EOD':76},
 '34': {'BAQ':44,'BCD':98,'DPQ':72,'ODP':90}, '36': {'OAP':90,'OCP':90},
 '40': {'BAC':60,'PTR':60}, '41': {'OMA':90},
}
PARALLELS = {'A2(b)':['AB','OC'],'SC(b)':['AB','OC'],'1':['BQ','AP'],
 '8':['AC','PQ'],'9':['AO','BC'],'14':['AP','BC'],'27':['OA','CB'],
 '30':['BE','CD'],'35':['OA','CT'],'36':['BC','OP']}
TANGENTS = {k:[('O','A','P')] for k in ['A1(a)','A1(b)','A1(c)','A2(a)','A2(c)','1','2','3','4','5','6','7','9','10','12','14','23','24','25','26','27','29','30','36']}
TANGENTS.update({k:[('O','A','T'),('O','B','T')] for k in ['B1','SC(c)','SC(d)','15','16','17','22','33']})
TANGENTS.update({'B2':[('O','A','T'),('O','C','T')], '5':[('O','A','P'),('O','A','Q')],
 '11':[('O','B','T')],'20':[('O','C','T'),('O','D','T')],
 '21':[('O','A','P'),('O','C','P')], '28':[('O','A','T')],
 '31':[('O','A','D'),('O','B','E')],'32':[('O','A','Q'),('O','B','P')],
 '34':[('O','A','P'),('O','D','P')],'35':[('O','A','T'),('O','C','T')],
 '37':[('I','P','A'),('I','Q','B'),('I','R','A')], '39':[('O','C','D')],
 '40':[('A','Q','T'),('A','S','T'),('B','P','T'),('C','R','T')],
 '41':[('O','M','A')]})
for k in ['B3','18','19','38']:
    TANGENTS[k] = [('O',a,b) for a,b in ([('P','A'),('Q','B'),('R','C')] if k!='38' else [('B','P'),('D','Q'),('F','R')])]
# Physical scale is independent of display radius.
LENGTHS = {
 'A1(c)':(10,{'AB':16,'BC':12,'CP':29,'AP':21}),
 'A2(a)':(16,{'OA':16,'BP':18,'AP':30}),
 'A2(c)':(1,{'AC':math.sqrt(2),'BC':math.sqrt(2),'AP':2,'AB':2}),
 'B1':(7/math.tan(math.radians(58)),{'AT':7,'BT':7}),
 'B3':(None,{'AB':19,'AR':5,'CR':9,'BC':23,'AC':14}),
 'SC(a)':(6,{'AP':9,'BP':15,'AB':12}),
 '4':(16,{'OA':16,'AP':30,'BP':18}), '5':(12,{'OP':20,'AP':16,'OQ':15,'AQ':9}),
 '6':(22,{'OA':22,'BP':22}), '12':(28,{'OA':28,'BP':25,'AP':45}),
 '19':(None,{'AB':45,'BC':41,'AR':26,'CR':22,'AC':48}),
 '28':(7.5,{'AT':20,'CT':16,'AB':15,'AC':12}),
 '31':(9,{'AD':18,'DE':30,'CE':6}),
 '37':(6,{'OA':24,'OB':18,'AB':30,'IP':6,'IQ':6,'IR':6}),
 '39':(7.5,{'AB':12,'BC':9,'AC':15,'CD':20,'AD':25}),
 '41':(25,{'AC':40,'BM':10,'OM':15,'OA':25}),
}
for k,q in Q.items():
    a=q['anim']; p=build_points(a)
    assert not check_anim(a,k), check_anim(a,k)
    for n,value in ANGLES.get(k,{}).items():near(angle(p,n),value,k+' '+n)
    for centre,contact,outside in TANGENTS.get(k,[]):
        near(angle(p,centre+contact+outside),90,k+' tangent '+contact+outside)
    if k in PARALLELS:parallel(p,*PARALLELS[k],k+' parallel')
    if k in LENGTHS:
        scale,expected=LENGTHS[k]
        if scale is None:scale=expected['AB']/length(p,'AB')
        for n,value in expected.items():near(length(p,n)*scale,value,k+' '+n)
    for step,sol in zip(a['steps'],q['solution']['steps']):
        mathtext=r'\quad '.join(step['mathLines'])
        assert re.findall(r'\$([^$]+)\$',step['zh'])==[mathtext],k
        assert re.findall(r'\$([^$]+)\$',step['en'])==[mathtext],k
        assert sol['math']==mathtext and sol['zh']==step['zh'] and sol['en']==step['en'],k
        assert '\\' not in step.get('answer',''),k
# Symbolic claims need independent checks on the representative geometry.
for k in ['20','27','35','36','38']:
    p=build_points(Q[k]['anim'])
    if k=='20':near(angle(p,'CTD'),2*angle(p,'ABD'),'20 identity')
    if k=='27':near(angle(p,'OCB'),2*angle(p,'BAP'),'27 given')
    if k=='35':near(length(p,'OM'),length(p,'AM'),'35 midpoint')
    if k=='38':
        parallel(p,'AC','PQ','38 AC//PQ');parallel(p,'AE','PR','38 AE//PR')
        near(angle(p,'COE'),2*(angle(p,'OQP')+angle(p,'ORP')),'38 identity')
        assert abs(angle(p,'OQP')-angle(p,'ORP'))>1,'Do not assume a=b in part (a)'
# Two alternative integer constructions, not unique required answers.
for a,b,c,d,e in [(12,9,15,20,25),(16,12,20,48,52)]:
    assert a*a+b*b==c*c and c*c+d*d==e*e
near((math.degrees(math.atan2(20,15))/360)*math.pi*25**2,289.7797556255,'41 sector area')
for c in D['cards']:assert not check_anim(c['demo']['opts']['anim'],c['id'])
assert len(D['cards'])==5
assert [Q['SC('+c+')']['answers'][0]['tf'] for c in 'abcd']==[True,False,True,True]
# The common reference table remains the authority for abbreviation spelling.
refs=json.loads((ROOT/'data/src/theorem-abbreviations.json').read_text())
known={v['abbreviation'] for group in ['theorems','basicAngleRules','otherGeometryReasons'] for v in refs[group].values()}
for a in [q['anim'] for q in Q.values()]+[c['demo']['opts']['anim'] for c in D['cards']]:
    for step in a['steps']:
        assert all(r.strip() in known for r in step.get('ref','').split(';') if r.strip()),step['ref']
# Regression: a perimeter of a triangle is not an angle-finding question.
import copy
import build
sample=copy.deepcopy(Q['B3'])
build.ERRORS.clear();build.WARNINGS.clear()
build.check_question(sample,'perimeter regression',set(),need_input=True)
assert not build.ERRORS and not build.WARNINGS,(build.ERRORS,build.WARNINGS)
sample['parts'][0]['en']='Find the angle ABC.'
build.check_question(sample,'angle regression',set(),need_input=True)
assert any('anim' in w and 'goal' in w for w in build.WARNINGS),build.WARNINGS
build.ERRORS.clear();build.WARNINGS.clear()
print('PASS: 54 source questions, 5 cards; original angle/length givens, tangent perpendicularity, parallel lines, symbolic claims and bilingual formula synchronisation')
