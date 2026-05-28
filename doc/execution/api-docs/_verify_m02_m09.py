import os
import re

ROOT = r"C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\modules"
METHOD_RE = re.compile(r"@(Get|Post|Put|Patch|Delete)\(([^)]*)\)")
CTRL_RE = re.compile(r"@Controller\(([^)]*)\)")


def parse_file(path: str) -> list[tuple[str, str, int]]:
    text = open(path, encoding="utf-8", errors="ignore").read()
    routes = []
    current_base = None
    for i, line in enumerate(text.splitlines(), 1):
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
            routes.append((meth, full, i))
    return routes


def audit_module(mod: str):
    modpath = os.path.join(ROOT, mod)
    per_file = {}
    all_routes = []
    for dirpath, _, files in os.walk(modpath):
        if "node_modules" in dirpath or "generated" in dirpath:
            continue
        for f in sorted(files):
            if not f.endswith(".controller.ts"):
                continue
            fp = os.path.join(dirpath, f)
            rel = os.path.relpath(fp, modpath)
            rs = parse_file(fp)
            per_file[rel] = rs
            all_routes.extend(rs)

    unique = sorted(set((m, p) for m, p, _ in all_routes))
    print(f"\n{'='*60}")
    print(f"{mod}")
    print(f"{'='*60}")
    print("Per controller file:")
    for rel in sorted(per_file):
        rs = per_file[rel]
        u = len(set((m, p) for m, p, _ in rs))
        print(f"  {rel}: {len(rs)} decorators, {u} unique paths")
    print(f"\nModule total unique endpoints: {len(unique)}")
    print("\nAll unique routes:")
    for meth, path in unique:
        print(f"  {meth:6} /{path}")


audit_module("m02-conversation-intelligence")
audit_module("m09-coaching-training")
