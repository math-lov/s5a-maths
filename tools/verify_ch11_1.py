"""Check Exercise 11.1 geometry against the supplied questions and solutions.

Run: python -X utf8 tools/verify_ch11_1.py
Checks numerical angles, lengths, all equal-tick groups, and proof givens.
This supplements figcheck, which does not validate equal-length ticks.
"""
import json
import math
from pathlib import Path

from figcheck import ang, build_points, check_anim

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'data/src/ch11-1.json').read_text(encoding='utf-8'))
questions = {q['id'].replace('ch11-1-', ''): q
             for section in data['sections'] for q in section['questions']}


def near(actual, expected, label):
    assert math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-8), (label, actual, expected)


angles = {
    'l1-1': {'DAC': 100, 'BAC': 80, 'BOC': 160},
    'l1-2': {'AOC': 170, 'ABC': 95},
    'l1-3': {'PRO': 33, 'QOR': 66, 'QSR': 99},
    'l1-4': {'BAC': 54, 'ABC': 90, 'ACB': 36},
    'l1-5': {'PQS': 62, 'SQR': 28},
    'l1-6': {'EFG': 64, 'EGF': 64, 'EDF': 26},
    'l1-7': {'BDC': 26, 'BEC': 68, 'ABD': 42},
    'l1-8': {'BAC': 40, 'BCD': 100},
    'l1-9': {'CED': 80, 'ACD': 50},
    'l1-10': {'AOB': 112, 'OBC': 26, 'OAC': 30},
    'l1-11': {'ACO': 38, 'ABC': 128},
    'l1-12': {'OCA': 32, 'ODC': 48},
    'l1-13': {'ABC': 93, 'DOE': 78, 'BCE': 48},
    'l1-14': {'ADC': 64, 'ABD': 32},
    'l1-15': {'ACB': 33, 'CAD': 24},
    'l1-16': {'BAD': 90, 'BCD': 90},
    'l1-17': {'ABD': 38, 'BAC': 42, 'BAD': 100},
    'l1-18': {'AED': 94, 'AFD': 42, 'FAC': 26},
    'l1-19': {'BDC': 25, 'CAD': 65, 'BCA': 40},
    'l1-22': {'ACB': 32, 'ACD': 26},
    'l2-23': {'OAB': 50, 'OEC': 26, 'OCB': 54},
    'l2-24': {'ADC': 30, 'BAC': 90},
    'l2-25': {'DAE': 34, 'BED': 56, 'AEB': 56, 'BAC': 22},
    'l2-26': {'BAC': 60, 'OCA': 30, 'OCB': 30},
    'l2-27': {'ABC': 90, 'ADC': 90},
    'l2-28': {'ADC': 90, 'ABC': 90, 'ACB': 25},
    'l2-29': {'BAD': 70, 'BDC': 26, 'COD': 88},
    'l2-30': {'BOE': 116, 'DFE': 110, 'BCD': 104},
    'l2-32': {'BEC': 104, 'ABC': 90, 'BCD': 90},
    'sm-33': {'BAD': 60, 'BDC': 30, 'ABD': 90, 'ODC': 60},
}
lengths = {
    'l1-21': (18, {'AE': 12, 'CE': 24, 'DE': 18, 'BE': 16}),
    'l2-28': (19.5, {'AC': 39, 'AD': 36, 'CD': 15,
                        'BC': 39 * math.cos(math.radians(25))}),
    'sm-33': (15, {'BC': 15, 'CD': 15, 'AB': 15, 'AD': 30, 'BD': 15 * math.sqrt(3)}),
}

assert len(questions) == 34
animations = [(key, q['anim']) for key, q in questions.items() if 'anim' in q]
assert len(animations) == 33
animations += [(c['id'], c['demo']['opts']['anim']) for c in data['cards']
               if c.get('demo', {}).get('type') == 'circle']
assert len(animations) == 37

for key, animation in animations:
    assert not check_anim(animation, key), check_anim(animation, key)
    points, groups = build_points(animation), {}
    for name, expected in angles.get(key, {}).items():
        near(ang(points[name[0]], points[name[1]], points[name[2]]), expected, key + ' ∠' + name)
    if key in lengths:
        radius, expected_lengths = lengths[key]
        for segment, expected in expected_lengths.items():
            near(math.dist(points[segment[0]], points[segment[1]]) * radius, expected, key + ' ' + segment)
    for step in animation['steps']:
        marks = [(t[2] if len(t) > 2 else 1, t[:2]) for t in step.get('ticks', [])]
        marks += [(1, ['O', name]) for name in step.get('radii', [])]
        for count, (a, b) in marks:
            length = math.dist(points[a], points[b])
            if count in groups:
                near(length, groups[count], key + ' tick group ' + str(count))
            else:
                groups[count] = length
    assert animation.get('readable') and animation.get('intro'), key
    assert animation['steps'][-1].get('final'), key
    assert animation['steps'][-1].get('clearGoal'), key
    print('PASS', key)

# Proof givens that numerical angle-label checks alone cannot establish.
p = build_points(questions['l2-31']['anim'])
near(math.dist(p['A'], p['E']), math.dist(p['D'], p['E']), 'Q31 AE = DE')
near(math.dist(p['B'], p['E']), math.dist(p['C'], p['E']), 'Q31 BE = CE')
p = build_points(questions['l1-20']['anim'])
near(ang(p['B'], p['A'], p['C']), ang(p['O'], p['C'], p['D']), 'Q20 equal angles')
p = build_points(questions['l2-27']['anim'])
near(ang(p['B'], p['A'], p['C']), ang(p['D'], p['A'], p['C']), 'Q27 angle bisector')
p = build_points(questions['sm-33']['anim'])
area = abs(sum(p[a][0]*p[b][1] - p[b][0]*p[a][1]
               for a,b in zip('ABD','BDA'))) * 15**2 / 2
near(area, 112.5 * math.sqrt(3), 'Q33 area')
print('PASS: all 37 animations; original numerical givens, answers and equal-length marks')
