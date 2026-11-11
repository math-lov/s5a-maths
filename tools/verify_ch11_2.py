"""Read-only checks against the numerical facts in the supplied Exercise 11.2.

Run: python -X utf8 tools/verify_ch11_2.py
Checks the saved geometry independently of the SVG renderer, including the
corrected printed question 27 and the original question/answer for question 18.
"""
import json
import math
from pathlib import Path

from figcheck import ang, build_points, check_anim

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "data/src/ch11-2.json").read_text(encoding="utf-8"))
questions = {q["id"].replace("ch11-2-", ""): q
             for section in data["sections"] for q in section["questions"]}


def near(actual, expected, label):
    assert math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-8), (label, actual, expected)


def distance(points, a, b):
    return math.dist(points[a], points[b])


def area(points, names):
    return abs(sum(points[a][0] * points[b][1] - points[b][0] * points[a][1]
                   for a, b in zip(names, names[1:] + names[:1]))) / 2


# Expected lengths in centimetres, taken from the original figures and solutions.
lengths = {
    "ce-2": (25, {"BE": 20, "DE": 20, "CE": 10, "AE": 40}),
    "ce-3": (10, {"AB": 16, "CD": 16, "AM": 8, "OM": 6, "ON": 6, "MN": 12}),
    "l1-1": (29, {"OM": 21, "OB": 29, "AB": 40}),
    "l1-2": (4 * math.sqrt(3), {"DN": 6, "NF": 6, "DF": 12}),
    "l1-4": (math.sqrt(74), {"AM": 7, "OM": 5, "CD": 14, "ON": 5}),
    "l1-5": (40 / 3, {"MN": 16, "ON": 8}),
    "l1-6": (17, {"AB": 16, "OM": 15, "ON": 15, "DN": 8, "OD": 17}),
    "l1-7": (20, {"BD": 8, "OD": 12, "AD": 16, "AC": 32}),
    "l1-8": (26, {"BD": 20, "CE": 2, "OE": 24, "BE": 10}),
    "l1-12": (7, {"AC": 10, "CE": 5, "BD": 14}),
    "l1-13": (math.sqrt(468), {"BM": 18, "BN": 30, "CD": 36, "MN": 24, "ON": 12}),
    "l1-14": (15, {"OD": 15, "OM": 9, "CD": 24, "ON": 9, "AB": 24}),
    "l2-18": (2.5, {"CD": 3, "MN": 2.7, "ON": 2, "OM": .7, "AM": 2.4, "AB": 4.8}),
    "l2-19": (37, {"AD": 24, "BC": 70, "MN": 47, "OM": 35, "ON": 12}),
    "l2-20": (25, {"AM": 24, "CM": 24, "CD": 40, "DM": 32}),
    "l2-21": (26, {"OB": 10, "AB": 24, "OA": 26, "AP": 48}),
    "l2-22": (50, {"AC": 80, "BD": 96, "OM": 30, "ON": 14, "AE": 54, "BE": 78,
                     "AB": 30 * math.sqrt(10)}),
    "l2-23": (39, {"OE": 25, "AE": 14, "AB": 16, "BM": 20, "OM": 15}),
    "l2-26": (4, {"AC": 8, "AB": 4 * math.sqrt(2), "BC": 4 * math.sqrt(2)}),
    "l2-28": (39, {"OP": 44, "OA": 39, "PA": 17, "OE": 36, "PC": 17, "CE": 9, "AB": 30}),
}
angles = {
    "ce-1": {"MON": 107, "ABC": 73},
    "l1-2": {"GNF": 90},
    "l1-3": {"POM": 49, "OPM": 41},
    "l1-9": {"MON": 96, "ABC": 84},
    "l1-10": {"AOM": 30, "OAD": 60, "ODA": 60, "AOD": 60},
    "l1-11": {"BDC": 29, "ABD": 61},
    "l1-15": {"OBM": 40, "MON": 130, "ONM": 25},
    "l1-16": {"PQR": 76, "OPQ": 38},
    "l2-17": {"OCA": 28, "COD": 62, "BAC": 31, "ABO": 59},
    "l2-24": {"ABE": 76, "MOE": 76, "AEB": 28},
    "l2-25": {"QPR": 79, "LON": 101, "QOR": 129.5},
}

assert len(questions) == 31 and len(data["cards"]) == 5
for key, question in questions.items():
    animation = question["anim"]
    assert not check_anim(animation, key), check_anim(animation, key)
    points = build_points(animation)
    if key in lengths:
        radius, expected = lengths[key]
        for segment, value in expected.items():
            near(distance(points, *segment) * radius, value, key + " " + segment)
    for name, value in angles.get(key, {}).items():
        near(ang(points[name[0]], points[name[1]], points[name[2]]), value, key + " angle " + name)
    print("PASS", key)

# Equal tick groups must never imply equality of unequal lengths.
animations = [(key, q["anim"]) for key, q in questions.items()]
animations += [(c["id"], c["demo"]["opts"]["anim"]) for c in data["cards"]]
for key, animation in animations:
    assert not check_anim(animation, key), check_anim(animation, key)
    points, groups = build_points(animation), {}
    for step in animation["steps"]:
        marks = [(t[2] if len(t) > 2 else 1, t[:2]) for t in step.get("ticks", [])]
        marks += [(1, ["O", name]) for name in step.get("radii", [])]
        for count, segment in marks:
            length = distance(points, *segment)
            if count in groups:
                near(length, groups[count], key + " tick group " + str(count))
            else:
                groups[count] = length

points = build_points(questions["l2-21"]["anim"])
near(area(points, "OBPQ") * 26**2, 360, "Q21 quadrilateral area")
points = build_points(questions["l2-26"]["anim"])
near(area(points, "OPBQ") * 4**2, 8, "Q26 square area")
points = build_points(questions["l2-25"]["anim"])
for chord in ("AB", "CD", "EF"):
    near(distance(points, *chord), 1.2, "Q25 equal secant chord " + chord)
for foot in "LMN":
    near(distance(points, "O", foot), .8, "Q25 interior foot " + foot)
assert all("tangent" not in spec for spec in questions["l2-25"]["anim"]["points"].values())
for names in ("PABQ", "PFER", "QCDR"):
    a, b = points[names[0]], points[names[-1]]
    direction = (b[0] - a[0], b[1] - a[1])
    parameters = [((points[n][0] - a[0]) * direction[0] + (points[n][1] - a[1]) * direction[1])
                  / sum(x*x for x in direction) for n in names]
    assert all(x < y for x, y in zip(parameters, parameters[1:])), (names, parameters)
points = build_points(questions["l2-27"]["anim"])
near(distance(points, "A", "B"), distance(points, "D", "E"), "Q27 corrected equal-chord condition")
near(distance(points, "C", "M"), distance(points, "C", "N"), "Q27 conclusion CM = CN")
assert "omitted" in questions["l2-27"]["stem"]["en"]
assert "4.8" in questions["l2-18"]["answers"][0]["math"]
assert "30\\sqrt{10}" in questions["l2-22"]["answers"][0]["math"]
assert "SSS" in questions["l1-16"]["solution"]["steps"][1]["en"]
print("PASS: 31 questions, 5 concept cards, source lengths/angles, equality marks and corrected proofs.")
