"""Audit Ch.11.1–11.3 original figures and all permanent equality marks.

Complements verify_ch11_{1,2,3}.py: include frame-zero and later-part givens
in the equality checks, so an unproved equality cannot accidentally be marked
by using the same tick count as a different-length segment.
"""
import json
import math
from pathlib import Path

from figcheck import build_points, check_anim

ROOT = Path(__file__).resolve().parent.parent
ledger = json.loads((ROOT / 'data/raw/ch11-animation-audit.json').read_text(encoding='utf-8'))
records = {entry['id']: entry for entry in ledger['questions']}
players, question_count, steps = [], 0, 0
for chapter in (1, 2, 3):
    data = json.loads((ROOT / f'data/src/ch11-{chapter}.json').read_text(encoding='utf-8'))
    for section in data['sections']:
        for question in section['questions']:
            if 'anim' not in question:
                continue
            animation = question['anim']
            record = records[question['id']]
            assert {tuple(sorted(s[:2])) for s in animation['segments']} == {
                tuple(sorted(s[:2])) for s in record['segments']}, question['id']
            assert 19 <= record['pdfPage'] <= 57
            assert animation.get('givens') is not None
            players.append((question['id'], animation))
            question_count += 1
    players.extend((card['id'], card['demo']['opts']['anim']) for card in data['cards']
                   if card.get('demo', {}).get('type') == 'circle')

for name, animation in players:
    assert not check_anim(animation, name), check_anim(animation, name)
    points, tick_groups = build_points(animation), {}
    states = [animation.get('givens', {})]
    for step in animation['steps']:
        states.extend([step.get('givens', {}), step])
    for state in states:
        marks = state.get('ticks', []) + [['O', n, 1] for n in state.get('radii', [])]
        for mark in marks:
            count = mark[2] if len(mark) > 2 else 1
            length = math.dist(points[mark[0]], points[mark[1]])
            if count in tick_groups:
                assert math.isclose(length, tick_groups[count], abs_tol=1e-7), (
                    name, 'false equality mark', mark, length, tick_groups[count])
            tick_groups[count] = length
        arc_groups = {}
        for measure in state.get('arcMeasures', []):
            if not measure.get('tickCount'):
                continue
            u, v = points[measure['from']], points[measure['to']]
            angle = math.acos(max(-1, min(1, (u[0]*v[0] + u[1]*v[1]) /
                                          (math.hypot(*u)*math.hypot(*v)))))
            group = measure['tickCount']
            if group in arc_groups:
                assert math.isclose(angle, arc_groups[group], abs_tol=1e-7), (
                    name, 'false equal-arc mark', measure)
            arc_groups[group] = angle
    measures = animation.get('arcMeasures', [])
    assert len({m.get('id', m['from']+m['to']) for m in measures}) == len(measures), (
        name, 'two original arcs share a replacement ID')
    steps += len(animation['steps'])

assert question_count == 95 and len(players) == 109
print(f'PASS: {question_count} source figures, {len(players)} players, {steps} steps; '
      'initial and staged equalities are geometrically valid.')
