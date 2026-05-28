import re
from collections import defaultdict

path = "BACKEND-ROUTES-REFERENCE.md"
text = open(path, encoding="utf-8").read()
raw = defaultdict(int)
unique = defaultdict(set)
current = None
for line in text.splitlines():
    if line.startswith("=== ") and line.endswith(" ==="):
        current = line.strip("= ").strip()
    elif current:
        m = re.match(r"^(GET|POST|PUT|PATCH|DELETE)\s+(/.*)", line)
        if m:
            raw[current] += 1
            unique[current].add(f"{m.group(1)} {m.group(2)}")
print("Module | Raw decorators | Unique method+path")
print("-------|----------------|---------------------")
t_raw = t_u = 0
for mod in sorted(raw.keys()):
    print(f"{mod} | {raw[mod]} | {len(unique[mod])}")
    t_raw += raw[mod]
    t_u += len(unique[mod])
print(f"TOTAL | {t_raw} | {t_u}")
