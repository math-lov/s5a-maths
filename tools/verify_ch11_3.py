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
}
# Physical radius, inferred from the original arc lengths (display size is independent).
radii = {
    'ce-3':18/math.pi, 'l1-3':24/math.pi, 'l1-4':15/math.radians(156),
    'l1-5':48/math.pi, 'l1-6':36/math.pi, 'l1-7':30/math.pi,
    'l1-8':27/math.pi, 'l1-9':18/math.pi, 'l1-13':20/math.pi,'l1-14':48/math.pi,
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
for q in questions.values():
    for answer in q.get('answers',[]):
        assert ',' not in str(answer.get('input') or ''),(q['id'],'separate answer boxes required')
print('PASS: book angles, arc lengths, equality marks, separate answers and all diagrams')
