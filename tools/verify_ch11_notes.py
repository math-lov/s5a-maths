"""Check the mathematical claims in Chapter 11 notes independently of the SVG.

Run: python3 tools/verify_ch11_notes.py
"""
import json
import math
import re
from pathlib import Path
from figcheck import ang, build_points, check_anim

ROOT = Path(__file__).resolve().parent.parent
notes = json.loads((ROOT / 'data/src/notes/ch11.json').read_text(encoding='utf-8'))
reasons = json.loads((ROOT / 'data/src/theorem-abbreviations.json').read_text(encoding='utf-8'))
approved = {r['abbreviation'] for group in ('theorems','basicAngleRules','otherGeometryReasons')
            for r in reasons[group].values()}

def near(a,b,label):
    assert math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-7), (label,a,b)

def angle(p,name): return ang(p[name[0]],p[name[1]],p[name[2]])

def sweep(p,a,b,avoid):
    heading=lambda k: math.degrees(math.atan2(p[k][1],p[k][0]))%360
    d=(heading(b)-heading(a))%360
    return 360-d if (heading(avoid)-heading(a))%360<d else d

players = [p['demo']['anim'] for p in notes['points'] if p.get('demo',{}).get('type')=='circle']
for n,a in enumerate(players,2):
    assert not check_anim(a,str(n)),check_anim(a,str(n))
    assert a['layout']=='side-by-side' and a['readable']
    assert any(v.get('centre') for v in a['points'].values()), 'main circle needs centre'
    p=build_points(a)
    for step in a['steps']:
        zh=re.findall(r'\$([^$]+)\$',step['zh']);en=re.findall(r'\$([^$]+)\$',step['en'])
        assert len(zh)==1 and zh==en==['\\quad '.join(step['mathLines'])]
        assert not step['ref'] or step['ref'] in approved
        assert not any(re.search(r'[\u3400-\u9fff]|@B@|\\\\',line) for line in step['mathLines'])
        if step.get('radii'):
            for name in step['radii']:near(math.dist(p['O'],p[name]),1,'radius '+name)
    assert a['steps'][-1]['final'] and a['steps'][-1]['clearGoal']
    print('PASS notes player',n,len(a['steps']),'steps')

# The players are ordered by the notes, not by topic, so pick them by content:
# the x-chain is the longest one, the crossing-chord one is the only one with E.
chain=max(players,key=lambda a:len(a['steps']))
cross=next(a for a in players if 'E' in build_points(a))

# Example 11.3 Q17: all expressions in x must match the actual diagram.
p=build_points(chain);x=18
for name,factor in [('BCA',1),('CAO',1),('ACO',1),('AOB',2),('BOC',6),('AOC',8)]:
    near(angle(p,name),factor*x,name)
near(sweep(p,'A','B','C')/sweep(p,'B','C','A'),1/3,'given arc ratio')
near(angle(p,'OAC')+angle(p,'ACO')+angle(p,'AOC'),180,'triangle sum')

# Crossing-chord example: E really lies inside both chords, then check the
# asserted AA correspondence and every side ratio (not merely the labels).
p=build_points(cross)
for a,b in [('A','C'),('B','D')]:
    near(math.dist(p[a],p['E'])+math.dist(p['E'],p[b]),math.dist(p[a],p[b]),'E on chord '+a+b)
for first,second in [('ABE','DCE'),('BAE','CDE'),('AEB','DEC')]:
    near(angle(p,first),angle(p,second),'AA '+first+'='+second)
ratios=[math.dist(p[a],p[b])/math.dist(p[c],p[d]) for a,b,c,d in [('A','E','D','E'),('B','E','C','E'),('A','B','D','C')]]
for r in ratios:near(r,ratios[0],'corresponding side ratio')

for shape in notes['shapes']:
    a=shape['anim'];assert not check_anim(a,shape['id']),check_anim(a,shape['id'])
    assert any(v.get('centre') for v in a['points'].values()), 'main circle needs centre'
    p=build_points(a)
    if shape['id']=='butterfly':near(angle(p,'ACB'),angle(p,'ADB'),'butterfly')
    if shape['id']=='fake-butterfly':
        # The fake butterfly has one vertex at the centre, not four concyclic
        # vertices. Preserve the teacher's point order and crossing outline.
        near(p['A'][0],0,'A above O')
        near(p['A'][1],1,'A above O')
        near(p['C'][0],1,'C right of O')
        near(p['C'][1],0,'C right of O')
        assert p['B'][0]>0 and p['B'][1]>0, 'B inside minor arc AC'
        assert {frozenset(s) for s in a['segments']} == {
            frozenset(s) for s in [('O','A'),('O','B'),('A','C'),('B','C')]}
        near(angle(p,'AOB'),2*angle(p,'ACB'),'centre twice on arc AB')
        near(angle(p,'ACB'),30,'circumference example')
        near(angle(p,'OAC'),45,'misleading angle at A')
        near(angle(p,'OBC'),75,'misleading angle at B')
        assert not math.isclose(angle(p,'OAC'),angle(p,'OBC'))
        assert not math.isclose(angle(p,'AOC'),2*angle(p,'ACB'))
    if shape['id']=='fortune-fan':
        # 圓周角係鈍角，所對的是優弧：反角 = 2×圓周角，弧長亦等於反角
        near(360-angle(p,'AOB'),2*angle(p,'ADB'),'reflex centre twice')
        near(sweep(p,'A','B','D'),2*angle(p,'ADB'),'major arc excluding D')
    if shape['id']=='dart':
        # 同一個「圓心 × 2」定理的細角 case：圓周角所對的是劣弧
        near(angle(p,'AOB'),2*angle(p,'ADB'),'centre twice')
        near(sweep(p,'A','B','D'),angle(p,'AOB'),'minor arc excluding D')
    if shape['id']=='semi-circle':near(angle(p,'APB'),90,'diameter')
    if shape['id']=='cyclic-quad':near(angle(p,'DAB')+angle(p,'BCD'),180,'opposite supplementary')
    for arc in a['steps'][0]['circleArcs']:
        for name in arc[:3]:near(math.hypot(*p[name]),1,'arc endpoint or excluded vertex')
    print('PASS shape',shape['id'])

# Matching geometry is fixed in demos.js. Verify all six answers, including
# the two different vertices intercepting AB in round 2.
p={name:(math.cos(math.radians(v)),math.sin(math.radians(v))) for name,v in dict(A=200,B=300,C=20,D=120).items()}
arcs={a['id']:a for a in notes['match']['arcs']}
for rd in notes['match']['rounds']:
    for item in rd['angles']:
        a,v,b=item['label'].replace('∠','');arc=arcs[item['arc']]
        assert {a,b}=={arc['from'],arc['to']}
        near(2*angle(p,a+v+b),sweep(p,a,b,v),'matched arc '+item['label'])
print('All Chapter 11 notes geometry checks passed (%d players, %d shapes, %d matches).'
      % (len(players), len(notes['shapes']), sum(len(rd['angles']) for rd in notes['match']['rounds'])))

# Supporting figures: check the actual geometry, including the chord-ratio
# counterexample, rather than trusting captions or drawn length labels.
figures = {f['id']: f['anim'] for section in notes['points'] for f in section.get('figures', [])}
assert len(figures) == 13
for name, anim in figures.items():
    assert not check_anim(anim, name), check_anim(anim, name)
p = build_points(figures['chord-trap'])
near(math.dist(p['A'],p['B']), 1, 'unit chord')
near(math.dist(p['C'],p['D']), 2, 'diameter')
near(angle(p,'AOB'), 60, 'unit chord central angle')
near(angle(p,'COD'), 180, 'diameter central angle')
p = build_points(figures['bisect-chord'])
near(math.dist(p['A'],p['M']), math.dist(p['B'],p['M']), 'chord midpoint')
near(angle(p,'OMB'), 90, 'perpendicular bisector')
p = build_points(figures['split-dart'])
near(angle(p,'ADO'), angle(p,'DAO'), 'left isosceles triangle')
near(angle(p,'ODB'), angle(p,'OBD'), 'right isosceles triangle')
print('All 13 supporting figures and geometric counterexamples passed.')

# Check the angle-specific classifier hints against its fixed diagram.
p = build_points({'points': {'O': {'centre': True}, 'A': {'at': 32},
    'C': {'at': -84}, 'D': {'at': 0}, 'E': {'cross': ['A', 'C', 'O', 'D']}}})
p['F'] = tuple(-value for value in p['C'])
near(angle(p,'OCA'),angle(p,'FCA'),'OCA hint: extending CO preserves the angle')
near(angle(p,'AOD'),2*angle(p,'ACD'),'ACD/AOD hints: shared minor arc AD')
near(angle(p,'AEO')+angle(p,'OEC'),180,'AEO hint: adjacent angles on AC')
near(angle(p,'AEO'),angle(p,'ECO')+angle(p,'COE'),'AEO hint: triangle exterior angle')
assert math.hypot(*p['E']) < 1 and math.hypot(*p['E']) > 0
print('All four classifier hints agree with the selected angles.')

p = build_points(figures['cyclic-direct-rules'])
near(angle(p,'DAB') + angle(p,'BCD'), 180, 'cyclic opposite angles')
near(angle(p,'DCE'), angle(p,'DAB'), 'cyclic exterior angle')
near(angle(p,'BCE'), 180, 'BC extended through C to E')
