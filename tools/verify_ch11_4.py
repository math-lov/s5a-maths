"""Exercise 11.4: independent book/solution and geometric invariants.

Run with python3 tools/verify_ch11_4.py. Angles are degrees. Practice marks
are teacher-set. Expected values below are transcribed from the supplied
book and official solutions, independently of animation label strings.
"""
import json
import math
import re
from pathlib import Path
from figcheck import ang, build_points, check_anim

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'data/src/ch11-4.json').read_text())
Q = {q['code']: q for section in DATA['sections'] for q in section['questions']}


def near(a, b, message):
    assert a is not None and math.isclose(a, b, abs_tol=1e-7), (message, a, b)


def angle(p, names):
    return ang(p[names[0]], p[names[1]], p[names[2]])


def length(p, names):
    return math.dist(p[names[0]], p[names[1]])


def parallel(p, a, b):
    u = [p[a[1]][i] - p[a[0]][i] for i in (0, 1)]
    v = [p[b[1]][i] - p[b[0]][i] for i in (0, 1)]
    near(u[0]*v[1]-u[1]*v[0], 0, 'parallel ' + a + ' ' + b)


def collinear(p, names):
    for name in names[2:]:
        parallel(p, names[:2], names[0] + name)


def cyclic(p, names):
    # Opposite angles test, applied to a simple quadrilateral in perimeter order.
    near(angle(p, names[0:3]) + angle(p, names[2:] + names[:1]), 180, 'cyclic ' + names)


EXPECTED = {
 'CE1': {'ADE':94,'ABD':50,'CBD':44,'BCD':92,'DAB':88},
 'CE2': {'ADB':22,'BDC':90,'CBD':34,'ABD':34},
 'CE3': {'ABC':60,'ACB':39,'ACD':24,'AED':105,'ABD':24},
 '1': {'ABC':62,'BCD':86,'ADC':118,'BAD':94},
 '2': {'ADC':111,'ABC':69,'BAC':42},
 '3': {'ABP':104,'DCQ':89,'CDR':76,'BAD':89},
 '4': {'BCD':76,'ADE':104},
 '5': {'BAD':104,'DBC':58,'ADC':84,'ABD':38},
 '6': {'ABC':121,'BAD':122,'ADE':122,'ADC':58},
 '7': {'DAC':38,'CED':69,'ACB':31,'ADB':31},
 '8': {'ABD':43,'ACD':43,'DAE':98,'BCA':55},
 '9': {'BAC':35,'CAD':48,'BCA':46,'ACD':51,'AEB':94},
 '10': {'ABC':107,'CDE':107,'BAD':56,'ADB':45},
 '11': {'BAD':111,'BOC':122,'OCD':40},
 '12': {'AED':97,'BAD':68,'ACB':29},
 '15': {'ADC':80,'BAD':60,'ACD':80,'BAC':40},
 '16': {'ACB':84,'BAC':32,'DAC':32},
 '17': {'BAC':36,'BEC':72,'BCD':90},
 '18': {'ABC':105,'ADB':30,'AOC':150},
 '19': {'BAE':102,'CDE':126,'BEC':48},
 '20': {'EDF':124,'DFC':34,'DAE':90,'DCF':90},
 '22': {'BAD':72,'BOC':106,'OCD':71,'OED':124},
 '23': {'ACD':68,'DAE':18,'ADE':50,'BAD':62},
 '24': {'ACB':90,'DCE':90},
 '26': {'BAC':36}, '27': {'ADC':123,'BAC':90,'CAD':24},
 '28': {'ADC':93,'CBD':29,'BAD':116},
 '29': {'SRT':84,'PQR':124},
 '30': {'BCD':60,'CBD':60,'BDC':60},
 '31': {'BAC':18,'CAD':18,'BED':36,'EAF':54},
 '34': {'BAE':135,'DFE':90,'BFE':90},
 '35': {'ABC':90,'ACD':35,'ACB':35,'ABD':35,'MBD':20},
 '36': {'PTS':105,'QPT':95,'PQR':115,'QRS':110,'RST':115},
 '37': {'BCD':120,'BAD':60,'ABD':90},
}
EQUAL = {
 'CE1':['BC','CD'], 'CE4':['AB','AC'], '2':['AB','AC'],
 '5':['AB','AD'], '13':['AE','DE','AB','CD'],
 '14':['BC','CE','AD'], '15':['AB','BC'], '16':['AD','CD'],
 '17':['BE','EC'], '23':['AB','AE'], '24':['AB','DE'],
 '27':['AB','AD'], '30':['BC','CD','BD'], '31':['AF','EF'],
 '35':['BC','CD'],
}
PARALLEL = {'CE4':['DE','BC'],'4':['AB','CD'],'14':['CE','DA'],
            '16':['BA','CD'],'17':['AB','DC'],'21':['AB','ED'],
            '31':['AB','ED'],'34':['BC','ED']}
COLLINEAR = {'CE1':['CDE'],'CE3':['AEC','BED'],'CE4':['ADB','AEC'],
 '3':['ADR','PBCQ'],'4':['CDE'],'6':['CDE'],'7':['AEC','BED'],
 '8':['BAE'],'9':['AEC','BED'],'10':['ADE'],'13':['BAE','CDE'],
 '14':['AEB'],'17':['AEC','BED'],'18':['CBD'],
 '20':['ADF','BAE','BCF','CDE'],'21':['AFE','BCD'],
 '22':['OEC','BED'],'24':['ACE','BCD'],'25':['AED','OEB','OFC'],
 '29':['QRT'],'30':['ADC'],'31':['AFD','BFE','AIC'],
 '33':['ADF','BCE','CDG','EFG'],'34':['BFD','CFE'],
 '35':['AEC','BED','AMC']}
CYCLIC = {'CE3':'ABCD','CE4':'BCED','5':'ABCD','7':'ABCD',
 '8':'ABCD','9':'ABCD','10':'ABCD','15':'ABCD','16':'ABCD',
 '17':'ABCD','18':'ADCO','21':'CDEF','24':'ABED','25':'OECD','30':'ABOD',
 '33':'CDFE','35':'ABCD'}

references = json.loads((ROOT/'data/src/theorem-abbreviations.json').read_text())
approved = {v['abbreviation'] for group in ['theorems','basicAngleRules','otherGeometryReasons']
            for v in references[group].values()}
animations = [(k,q['anim']) for k,q in Q.items() if 'anim' in q]
animations += [(c['id'],c['demo']['opts']['anim']) for c in DATA['cards'] if c.get('demo')]
assert len(animations) == 46
assert len(Q) == 42 and [len(s['questions']) for s in DATA['sections']] == [4,1,21,14,2]
assert [a['tf'] for a in Q['SC']['answers']] == [True,False,False,False,True]
for key, a in animations:
    assert not check_anim(a,key), check_anim(a,key)
    assert a['layout']=='side-by-side' and a['readable'] and a['intro']
    assert a['steps'][-1]['final'] and a['steps'][-1]['clearGoal']
    assert '\\' not in a['steps'][-1].get('answer',''), (key,'SVG badge is plain text')
    p = build_points(a)
    for names, value in EXPECTED.get(key,{}).items(): near(angle(p,names),value,key+' '+names)
    all_marks = {}
    centre = [n for n,v in a['points'].items() if v.get('centre')][-1]
    for s in a['steps']:
        zh = re.findall(r'\$(.*?)\$',s['zh'])
        en = re.findall(r'\$(.*?)\$',s['en'])
        assert len(zh)==1 and zh==en, (key,'bilingual formula')
        assert zh[0]=='\\quad '.join(s['mathLines']), (key,'formula lines')
        assert all('$' not in line and not re.search(r'[\u3400-\u9fff]',line)
                   for line in s['mathLines']), key
        assert all(r in approved for r in s.get('ref','').split('; ') if r),(key,s.get('ref'))
        groups = {}
        for tick in s.get('ticks',[]):
            n=tick[2] if len(tick)>2 else 1
            value=length(p,tick[:2])
            if n in groups: near(value,groups[n],key+' equal tick lengths')
            groups[n]=value
        for tick in s.get('ticks', []) + [[centre, n, 1] for n in s.get('radii', [])]:
            count = tick[2] if len(tick)>2 else 1
            size = length(p,tick[:2])
            if count in all_marks: near(size,all_marks[count],key+' persistent equal-length marks')
            all_marks[count]=size
        if s.get('radii'):
            for name in s['radii']: near(length(p,centre+name),1,key+' radius')
    if key in EQUAL:
        # Q13 has two independently equal pairs, not four equal lengths.
        pairs=[EQUAL[key][:2],EQUAL[key][2:]] if key=='13' else [EQUAL[key]]
        for pair in pairs:
            for names in pair[1:]:near(length(p,names),length(p,pair[0]),key+' '+names)
    for names in COLLINEAR.get(key,[]):collinear(p,names)
    if key in PARALLEL:parallel(p,*PARALLEL[key])
    if key in CYCLIC:cyclic(p,CYCLIC[key])
    print('PASS',key)

# Additional side conditions and proportional arcs.
near(length(build_points(Q['15']['anim']),'AC'),length(build_points(Q['15']['anim']),'AD'),'15 AC=AD')
p=build_points(Q['24']['anim']);near(angle(p,'CAD'),angle(p,'CDA'),'24 given angles')
p=build_points(Q['26']['anim']);near(angle(p,'BAE'),angle(p,'CDE'),'26 given angles')
p=build_points(Q['6']['anim']);assert abs(angle(p,'ABC')+angle(p,'ADC')-180)>.9
p=build_points(Q['34']['anim']);assert abs(angle(p,'BAE')+angle(p,'BFE')-180)>40
p=build_points(Q['32']['anim']);near(sum(angle(p,n) for n in ['BAF','BCD','FED']),360,'32 sum')
p=build_points(Q['33']['anim']);near(angle(p,'CGE'),angle(p,'ABE')-angle(p,'BAF'),'33 y-x')
p=build_points(Q['31']['anim']);near(angle(p,'ABI'),angle(p,'IBF'),'31 in-centre bisects B')


def arc_degrees(p,ab):
    aa=[math.degrees(math.atan2(p[n][1],p[n][0]))%360 for n in ab]
    return min((aa[1]-aa[0])%360,(aa[0]-aa[1])%360)


for k,arcs,ratio in [('25',['AB','BC'],[1,1]),('26',['CE','BC'],[2,1]),
 ('28',['AD','DC','BC'],[2,1,3]),('29',['PQ','QR','RS'],[1,1,2]),
 ('36',['PQ','QR','RS','ST','TP'],[7,6,8,5,10]),('37',['AB','BC','CD'],[1,1,1])]:
    p=build_points(Q[k]['anim']);unit=arc_degrees(p,arcs[0])/ratio[0]
    for ab,n in zip(arcs,ratio):near(arc_degrees(p,ab)/n,unit,k+' arc '+ab)
# Every custom circle uses a genuine centre and radius for all its stated points.
for k,names in [('21','CDEF'),('33','CDFE')]:
    a=Q[k]['anim'];p=build_points(a);circle=a['circles'][0]
    for n in names:near(length(p,circle['c']+n),circle['r'],k+' second circle '+n)
# Verify both sides of the equal-angle card are on the same side of its chord.
a=DATA['cards'][4]['demo']['opts']['anim'];p=build_points(a)
def side(n):
    u=[p['D'][i]-p['A'][i] for i in (0,1)];v=[p[n][i]-p['A'][i] for i in (0,1)]
    return u[0]*v[1]-u[1]*v[0]
assert side('B')*side('C')>0
print('PASS: 42 questions, 46 animations; source givens, point order, circles, angles, lengths, arc ratios and theorem directions')

# The four Section Check SVGs are independent vector redrawings. Verify their
# actual endpoints as well, including the noncyclic congruent-triangle example.
import xml.etree.ElementTree as ET
FIGS = json.loads((ROOT/'data/src/figures.json').read_text())
def svg_points(number):
    root=ET.fromstring(FIGS['ch11-4-sc-'+str(number)]['svg'])
    lines=root.findall('{http://www.w3.org/2000/svg}line')
    endpoint=lambda n,i:(float(n.attrib['x'+i]),float(n.attrib['y'+i]))
    if number<4:
        return {'A':endpoint(lines[0],'1'),'B':endpoint(lines[0],'2'),
                'C':endpoint(lines[1],'2'),'D':endpoint(lines[2],'2')}
    return {'A':endpoint(lines[0],'1'),'B':endpoint(lines[0],'2'),
            'C':endpoint(lines[1],'1'),'D':endpoint(lines[1],'2')}
p=svg_points(1)
assert abs(angle(p,'BAD')-2*angle(p,'BCD'))<.002
p=svg_points(3)
for first,second in [('AB','CB'),('AD','CD')]:assert abs(length(p,first)-length(p,second))<.002
assert abs(angle(p,'BAD')+angle(p,'BCD')-180)>1
p=svg_points(4);parallel(p,'AB','DC')
assert abs(angle(p,'BAD')+angle(p,'BCD')-180)>1
print('PASS: Section Check vector givens and counterexamples')
