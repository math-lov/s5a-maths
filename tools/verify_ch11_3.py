"""Independent checks of Exercise 11.3 against the supplied book and solutions.

Run: python -X utf8 tools/verify_ch11_3.py
Check numerical angles, all equal-chord marks, and curved length measures.
"""
import json
import math
from pathlib import Path

from figcheck import ang, build_points, check_anim

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT/'data/src/ch11-3.json').read_text(encoding='utf-8'))
questions = {q['id'].replace('ch11-3-', ''): q for s in data['sections'] for q in s['questions']}


def near(actual, expected, label):
    assert math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-7), (label, actual, expected)


def arc_degrees(points, a, b, avoid):
    def heading(name):
        return math.degrees(math.atan2(points[name][1], points[name][0])) % 360
    start, end = heading(a), heading(b)
    delta = (end-start) % 360
    if avoid:
        if (heading(avoid)-start) % 360 <= delta:
            delta = 360-delta
    else:
        delta = min(delta, 360-delta)
    return delta


angles = {
    'ce-1': {'BOC':55}, 'ce-3': {'BDC':30,'ADB':70,'ABD':50,'CAD':30},
    'l1-1': {'BOC':70,'AOB':70}, 'l1-2': {'BOC':50,'AOD':80,'AOB':115},
    'l1-3': {'COD':60,'AOD':120}, 'l1-5': {'AOB':75},
    'l1-6': {'COD':80,'BOC':60,'AOB':40}, 'l1-7': {'PRS':54,'QPR':36},
    'l1-8': {'EDF':100,'DEF':40}, 'l1-9': {'QRT':70,'SRT':35},
    'l1-10': {'OBA':57,'COD':66,'AOD':48}, 'l1-11': {'QPR':68,'PQR':56},
    'l1-12': {'BOC':48,'AOD':144,'COD':84,'OCD':48},
    'l1-13': {'BAC':63,'ABC':90}, 'l1-14': {'AOB':60},
    'l1-15': {'COD':40,'EOF':64,'OFE':58},
    'l2-16': {'OBC':65,'BOC':50,'COD':50,'DOE':50,'BOD':100,'DAE':25},
    'l2-17': {'BCA':18,'CAO':18,'AOB':36,'BOC':108},
    'l2-18': {'BAD':63,'BEC':27,'ADB':27,'CED':36},
    'l2-19': {'ACE':36,'BCD':90,'DCE':27,'EAD':27},
    'l2-20': {'BED':50,'AEB':40},
    'l2-21': {'AOB':74,'COD':74,'ACD':16,'ADO':74},
    'l2-23': {'ADB':70,'BDC':20,'CAD':60,'ACD':30,'AEB':130},
    'l2-25': {'CBD':30,'ABD':90,'BDA':30},
    'l2-26': {'AOC':100,'OAC':40,'OMA':90},
    'sm-27': {'AOD':60,'OAD':60,'ODA':60,'OMD':90},
    'cross-28': {'BDC':30,'ADB':30,'DCE':30,'CFD':90,'CDE':90},
}
# Physical radius, inferred from the original arc lengths (display size is independent).
radii = {
    'ce-3':18/math.pi, 'l1-3':24/math.pi, 'l1-4':15/math.radians(156),
    'l1-5':48/math.pi, 'l1-6':36/math.pi, 'l1-7':30/math.pi,
    'l1-8':27/math.pi, 'l1-9':18/math.pi, 'l1-13':20/math.pi,'l1-14':48/math.pi,
    'l2-18':15/math.pi,'l2-20':27/math.pi,
}
expected_arcs = {
    'ce-3': [('A','B','D',14),('A','D','B',10),('B','C','A',6)],
    'l1-3': [('A','B','D',8),('C','D','B',8),('A','D','B',16)],
    'l1-4': [('C','F','A',15),('A','C','F',10)],
    'l1-5': [('A','B','P',20),('A','B','Q',76)],
    'l1-6': [('B','C','D',12),('C','D','A',16),('A','B','D',8)],
    'l1-7': [('P','S','R',18),('Q','R','P',12)],
    'l1-8': [('E','F','D',30),('D','F','E',12)],
    'l1-9': [('Q','T','R',14),('S','T','Q',7)],
    'l1-13': [('A','C','X',20),('A','B','C',6)],
    'l1-14': [('B','C','D',20),('C','D','A',12),('A','B','D',16)],
    'l2-18': [('A','B','D',4.5),('C','D','A',6)],
    'l2-20': [('A','B','D',12),('C','D','A',12),('C','B','D',3)],
}
animations = [(key,q['anim']) for key,q in questions.items() if 'anim' in q]
animations += [(c['id'],c['demo']['opts']['anim']) for c in data['cards'] if c.get('demo')]
for key,animation in animations:
    assert not check_anim(animation,key), check_anim(animation,key)
    points,groups = build_points(animation),{}
    for name,expected in angles.get(key,{}).items():
        near(ang(points[name[0]],points[name[1]],points[name[2]]),expected,key+' ∠'+name)
    for a,b,avoid,expected in expected_arcs.get(key,[]):
        near(math.radians(arc_degrees(points,a,b,avoid))*radii[key],expected,key+' arc '+a+b)
    for step in animation['steps']:
        marks=[(t[2] if len(t)>2 else 1,t[:2]) for t in step.get('ticks',[])]
        marks += [(1,['O',name]) for name in step.get('radii',[])]
        for count,(a,b) in marks:
            length=math.dist(points[a],points[b])
            if count in groups: near(length,groups[count],key+' tick group '+str(count))
            else: groups[count]=length
        for measure in step.get('arcMeasures',[])+animation.get('arcMeasures',[]):
            for name in [measure['from'],measure['to'],measure.get('avoid')]:
                if name: near(math.hypot(*points[name]),1,key+' arc endpoint/avoid '+name)
    assert animation.get('readable') and animation.get('intro'),key
    assert animation['steps'][-1].get('final') and animation['steps'][-1].get('clearGoal'),key
    print('PASS',key)

assert [a['tf'] for a in questions['sc']['answers']]==[True,True,False,False]
# Teaching examples must establish their claims without accidental diameters
# or vertically opposite angles. Check the geometry rather than its labels.
for index,card in enumerate(data['cards'][:5]):
    animation=card['demo']['opts']['anim']
    points=build_points(animation)
    names=[name for name in points if name!='O']
    for i,a in enumerate(names):
        for b in names[i+1:]:
            assert ang(points[a],points['O'],points[b])<170,(card['id'],'near-diameter',a,b)
    centre_ab=ang(points['A'],points['O'],points['B'])
    centre_cd=ang(points['C'],points['O'],points['D'])
    near(centre_ab,60,card['id']+' centre angle AB')
    near(centre_cd,60 if index<3 else 120,card['id']+' centre angle CD')
    if index<3:
        near(math.dist(points['A'],points['B']),math.dist(points['C'],points['D']),card['id']+' equal chords')
    else:
        near(arc_degrees(points,'A','B','C')/arc_degrees(points,'C','D','A'),.5,card['id']+' arc ratio')
    if index==0:
        for measure in animation['arcMeasures']:
            degrees=arc_degrees(points,measure['from'],measure['to'],measure['avoid'])
            near(math.radians(degrees)*18/math.pi,6,card['id']+' marked arc length')
    if index==4:
        near(ang(points['A'],points['P'],points['B']),30,card['id']+' circumference angle AB')
        near(ang(points['C'],points['P'],points['D']),60,card['id']+' circumference angle CD')
assert len(questions)==32 and [len(s['questions']) for s in data['sections']]==[3,1,15,11,1,1]
# Check ratios and proof givens independently of labels and captions.
for key,arcs,expected in [
    ('l2-16',['BC','CD','DE'],[1,1,1]),
    ('l2-17',['AB','BC'],[1,3]),
    ('l2-19',['AB','DE'],[1,1]),
    ('l2-23',['AB','BC','CD','DA'],[7,2,6,3]),
    ('l2-24',['AB','CD'],[1,1]),
    ('l2-26',['AB','BC','CA'],[7,6,5]),
    ('sm-27',['AB','AD','DC'],[1,3,5]),
    ('cross-28',['AB','BC','DE'],[1,1,1]),
]:
    points=build_points(questions[key]['anim'])
    units=[arc_degrees(points,*segment,None)/ratio for segment,ratio in zip(arcs,expected)]
    for unit in units: near(unit,units[0],key+' given arc ratio')
p=build_points(questions['l2-22']['anim'])
near(math.dist(p['A'],p['C']),math.dist(p['B'],p['D']),'Q22 AC = BD')
near(ang(p['A'],p['M'],p['B']),ang(p['D'],p['M'],p['C']),'Q22 given equal angles')
p=build_points(questions['cross-28']['anim'])
near(math.dist(p['G'],p['C']),math.dist(p['G'],p['D']),'Q28 GC = GD')
near(math.dist(p['G'],p['D']),math.dist(p['G'],p['E']),'Q28 GD = GE')

def triangle_area(points,names,radius):
    return abs(sum(points[a][0]*points[b][1]-points[b][0]*points[a][1]
                   for a,b in zip(names,names[1:]+names[:1]))) * radius**2 / 2

p=build_points(questions['l2-26']['anim'])
area=100/360*math.pi*10**2-triangle_area(p,'OAC',10)
near(area,38.0260749491,'Q26 exact shaded area')
p=build_points(questions['sm-27']['anim'])
near(math.dist(p['A'],p['D'])*12,12,'Q27 given chord')
triangle=triangle_area(p,'OAD',12)
near(triangle,36*math.sqrt(3),'Q27 triangle area')
near(math.pi*12**2/2-(math.pi*12**2/6-triangle),48*math.pi+36*math.sqrt(3),'Q27 shaded area')
for q in questions.values():
    for answer in q.get('answers',[]):
        assert ',' not in str(answer.get('input') or ''),(q['id'],'separate answer boxes required')
print('PASS: book angles, arc lengths, equality marks, separate answers and all diagrams')
