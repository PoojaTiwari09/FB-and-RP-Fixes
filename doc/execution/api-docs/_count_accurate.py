import os
import re
from collections import defaultdict

root = r"C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\modules"
METHOD_RE = re.compile(r"@(Get|Post|Put|Patch|Delete)\(([^)]*)\)")
CTRL_RE = re.compile(r"@Controller\(([^)]*)\)")


def parse_file(path: str) -> list[tuple[str, str]]:
    text = open(path, encoding="utf-8", errors="ignore").read()
    routes = []
    current_base = None
    for line in text.splitlines():
        cm = CTRL_RE.search(line)
        if cm:
            current_base = cm.group(1).strip("'\"")
            continue
        mm = METHOD_RE.search(line)
        if mm and current_base:
            meth = mm.group(1).upper()
            route = mm.group(2).strip("'\"")
            full = current_base.rstrip("/")
            if route:
                full = f"{full}/{route.lstrip('/')}"
            routes.append((meth, full))
    return routes


mods = sorted(d for d in os.listdir(root) if d.startswith("m0") and os.path.isdir(os.path.join(root, d)))
labels = {
    "m01-capture-transcription": "M01",
    "m02-conversation-intelligence": "M02",
    "m03-ai-summaries-genai": "M03",
    "m04-deal-intelligence": "M04",
    "m05-account-intelligence": "M05",
    "m06-forecasting-prediction": "M06",
    "m07-revenue-dashboards": "M07",
    "m08-sales-engagement": "M08",
    "m09-coaching-training": "M09",
    "m10-data-compliance": "M10",
}

print("Module | API count (corrected)")
print("-------|----------------")
total = 0
for mod in mods:
    unique = set()
    modpath = os.path.join(root, mod)
    for dirpath, _, files in os.walk(modpath):
        if "node_modules" in dirpath or "generated" in dirpath:
            continue
        for f in files:
            if f.endswith(".controller.ts"):
                unique.update(parse_file(os.path.join(dirpath, f)))
    c = len(unique)
    total += c
    print(f"{labels.get(mod, mod)} | {c}")
print(f"Total | {total}")
