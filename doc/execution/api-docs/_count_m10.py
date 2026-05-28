import os
import re

ROOT = r"C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\modules\m10-data-compliance"
METHOD_RE = re.compile(r"@(Get|Post|Put|Patch|Delete)\(([^)]*)\)")
CTRL_RE = re.compile(r"@Controller\(([^)]*)\)")


def parse_file(path: str) -> list[tuple[str, str]]:
    text = open(path, encoding="utf-8", errors="ignore").read()
    routes: list[tuple[str, str]] = []
    current_base: str | None = None
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


all_routes: list[tuple[str, str]] = []
for dirpath, _, files in os.walk(ROOT):
    if "node_modules" in dirpath or "generated" in dirpath:
        continue
    for f in files:
        if not f.endswith(".controller.ts"):
            continue
        fp = os.path.join(dirpath, f)
        rs = parse_file(fp)
        rel = os.path.relpath(fp, ROOT)
        print(f"{rel}: {len(rs)}")
        all_routes.extend(rs)

unique = sorted(set(all_routes))
print(f"\nM10 unique endpoints: {len(unique)}")
for m, p in unique:
    print(f"  {m:6} {p}")
